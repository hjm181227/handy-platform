import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, Plus, Send, EllipsisVertical, Store, X, ArrowDown, Sparkles } from 'lucide-react';
import { useChat } from '../lib/chat';
import { useAuth } from '../hooks/useAuth';
import { CustomOrderMessageCard } from '../components/chat/CustomOrderMessageCard';
import { CustomOrderBottomSheet } from '../components/chat/CustomOrderBottomSheet';
import { QuoteMessageCard } from '../components/chat/QuoteMessageCard';
import { QuoteBottomSheet } from '../components/chat/QuoteBottomSheet';
import { ImageMessageBubble } from '../components/chat/ImageMessageBubble';
import { ProductInquiryCard } from '../components/chat/ProductInquiryCard';
import { ReportDialog } from '../components/chat/ReportDialog';
import { blockUser, leaveChatRoom } from '../lib/chat/moderationService';
import { fetchAssistStatus, refineDraft } from '../lib/chat/assistService';
import { config } from '../config/environment';
import { secureImageUrl } from '../utils/imageUrl';
import type { Message } from '../lib/chat/types';

interface ChatRoomPageProps {
  nav: (path: string) => void;
  roomId: string;
  partnerUsername?: string;
}

export const ChatRoomPage: React.FC<ChatRoomPageProps> = ({ nav, roomId, partnerUsername: propPartnerUsername }) => {
  // localStorage에서 JWT 토큰 가져오기
  const token = localStorage.getItem('accessToken') || undefined;

  // URL 쿼리 파라미터에서 name 추출 (props보다 우선)
  const urlParams = new URLSearchParams(window.location.search);
  const partnerUsernameFromUrl = urlParams.get('name') || propPartnerUsername;

  // 표시될 이름 상태 (브랜드명 또는 username)
  const [displayName, setDisplayName] = useState<string>(partnerUsernameFromUrl || roomId);
  // 아바타 이미지 상태
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);

  // useAuth 훅으로 현재 사용자 정보 가져오기
  const { currentUser } = useAuth();

  // 브랜드 정보 조회 (판매자인 경우 브랜드명 사용)
  useEffect(() => {
    const fetchPartnerDisplayName = async () => {
      // URL에서 이름이 제공된 경우 그대로 사용
      if (partnerUsernameFromUrl) {
        setDisplayName(partnerUsernameFromUrl);
        return;
      }

      // 브랜드 정보 조회 시도 (판매자인지 확인).
      // GET /api/brands/{uuid}는 상품 통계 집계까지 도는 무거운 엔드포인트라,
      // 표시용 이름·프로필만 필요한 여기서는 경량 배치 엔드포인트를 쓴다.
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/brands/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sellerUuids: [roomId] }),
        });
        if (response.ok) {
          const data = await response.json();
          const brand = data.brands?.[roomId];
          if (brand) {
            setDisplayName(brand.brandName || roomId);
            if (brand.brandProfile) {
              setPartnerAvatar(secureImageUrl(brand.brandProfile) ?? null);
            }
          }
        }
        // 판매자가 아니면 결과에 없다 → roomId 유지 (구매자)
      } catch {
        // 브랜드 조회 실패 시 roomId 유지
      }
    };

    fetchPartnerDisplayName();
  }, [roomId, partnerUsernameFromUrl]);

  // 현재 사용자가 판매자인지 확인
  const isSeller = currentUser?.role === 'seller' || currentUser?.role === 'admin';

  // 로그인 체크 - 토큰 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!token) {
      // alert()은 리다이렉트를 막고 사용자를 붙잡아둔다. 아래 안내 화면으로 대체.
      nav('/login');
    }
  }, [token, nav]);

  // 토큰 없으면 로딩 화면 표시 (리다이렉트 중)
  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-muted">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  // useChat 훅으로 모든 채팅 로직 처리
  const {
    messages,
    inputText,
    setInputText,
    sendMessage,
    sendImage,
    isLoading,
    isConnected,
    isDegraded,
    error,
    clearError,
    retryConnection,
    notifyTyping,
    stopTyping,
    isUploading,
    uploadProgress,
    isPartnerTyping,
    retryMessage,
    deleteMessage,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
    actualRoomId,
  } = useChat(roomId, token, partnerUsernameFromUrl);

  // 자동 스크롤을 위한 ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  /** 사용자가 대화 하단 근처를 보고 있는지 — 자동 스크롤 여부를 이 값으로 판단한다 */
  const isNearBottomRef = useRef(true);
  /** 스크롤 직전의 높이·위치. 과거 메시지를 붙인 뒤 위치를 되돌리는 데 쓴다 */
  const lastScrollRef = useRef({ height: 0, top: 0 });
  /** 직전 렌더의 메시지 목록 상태 (붙임 방향 판별용) */
  const prevListRef = useRef<{ firstId: string | null; length: number }>({ firstId: null, length: 0 });
  /** 화면 밖에서 새 메시지가 도착했을 때 표시할 점프 버튼 */
  const [hasNewMessages, setHasNewMessages] = useState(false);
  /** 첨부 파일 검증 실패 등 화면 내 안내 */
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  // ✨ 상담 어시스턴트 (초안 다듬기) — 서버 상태로 노출 여부를 정한다
  const [assistEnabled, setAssistEnabled] = useState(false);
  const [assistPreview, setAssistPreview] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAssistStatus().then((status) => {
      if (!cancelled) setAssistEnabled(status.enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefine = async () => {
    // actualRoomId가 없으면 아직 방이 만들어지기 전이라 문맥·권한 검증이 불가
    if (!inputText.trim() || isRefining || !actualRoomId) return;
    setIsRefining(true);
    setLocalNotice(null);
    const result = await refineDraft(actualRoomId, inputText.trim().slice(0, 1000));
    setIsRefining(false);
    if (result.success) {
      setAssistPreview(result.refined);
    } else {
      setAssistPreview(null);
      setLocalNotice(result.error);
    }
  };

  /** 미리보기를 입력창에 반영 — 사용자는 이어서 수정한 뒤 직접 전송한다 */
  const handleAssistApply = () => {
    if (assistPreview) setInputText(assistPreview);
    setAssistPreview(null);
  };

  // ⋮ 메뉴 (나가기·차단·신고)
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'leave' | 'block' | null>(null);
  const [menuBusy, setMenuBusy] = useState(false);
  /** 삭제 버튼을 띄울 내 메시지 (탭하면 열린다) */
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    isNearBottomRef.current = true;
    setHasNewMessages(false);
  };

  // 주문서 바텀 시트 상태
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [selectedCustomOrderId, setSelectedCustomOrderId] = useState<string | null>(null);

  // 견적서 바텀 시트 상태
  const [showQuoteSheet, setShowQuoteSheet] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // 이미지 첨부 상태
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<{ file: File; previewUrl: string } | null>(null);

  // 주문서 카드 클릭 핸들러
  const handleOrderCardClick = (customOrderId: string) => {
    setSelectedCustomOrderId(customOrderId);
    setShowOrderSheet(true);
  };

  // 견적서 카드 클릭 핸들러
  const handleQuoteCardClick = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setShowQuoteSheet(true);
  };

  // 견적서 구매하기 핸들러
  const handlePurchase = (quoteId: string) => {
    // 견적서 기반 체크아웃 페이지로 이동 (mode=quote, quoteUuid 전달)
    nav(`/checkout?mode=custom&quoteUuid=${quoteId}`);
  };

  // 이미지 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 10MB 제한
    if (file.size > 10 * 1024 * 1024) {
      setLocalNotice('이미지 크기는 10MB 이하만 보낼 수 있습니다. 더 작은 파일을 선택해주세요.');
      e.target.value = '';
      return;
    }

    // 이미지 타입 검증
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setLocalNotice('JPG, PNG, WebP 이미지만 보낼 수 있습니다.');
      e.target.value = '';
      return;
    }

    setLocalNotice(null);
    const previewUrl = URL.createObjectURL(file);
    setSelectedImage({ file, previewUrl });

    // input 초기화 (같은 파일 재선택 가능)
    e.target.value = '';
  };

  // 이미지 전송 핸들러
  const handleImageSend = async () => {
    if (!selectedImage) return;
    const { file, previewUrl } = selectedImage;
    setSelectedImage(null);
    URL.revokeObjectURL(previewUrl);
    await sendImage(file);
  };

  // 이미지 선택 취소
  const handleImageCancel = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.previewUrl);
      setSelectedImage(null);
    }
  };

  // 스크롤 추적 + 위로 올렸을 때 이전 메시지 로드
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      isNearBottomRef.current = distanceFromBottom < 120;
      if (isNearBottomRef.current) setHasNewMessages(false);

      // 과거 메시지를 붙인 뒤 위치를 복원하려면 붙이기 직전의 값이 필요하다
      lastScrollRef.current = { height: container.scrollHeight, top: container.scrollTop };

      if (container.scrollTop < 60 && hasMoreMessages && !isLoadingMore) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  /**
   * 메시지 목록이 바뀔 때의 스크롤 처리.
   *
   * 예전에는 messages가 바뀔 때마다 무조건 맨 아래로 스크롤해서,
   * 위로 올려 과거 메시지를 불러오면 즉시 바닥으로 튕겨 나갔다.
   * 이제 붙은 방향을 구분해서 처리한다:
   *   - 위쪽에 붙음(과거 로딩) → 보던 위치 유지
   *   - 아래쪽에 붙음(새 메시지) → 바닥 근처였으면 따라가고, 아니면 점프 버튼
   */
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const prev = prevListRef.current;
    const firstId = messages[0]?.id ?? null;
    const grew = messages.length > prev.length;
    const prependedOlder = grew && prev.firstId !== null && firstId !== prev.firstId;

    if (prev.length === 0 && messages.length > 0) {
      // 방에 처음 들어왔을 때는 애니메이션 없이 최신 메시지부터 보여준다
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isNearBottomRef.current = true;
    } else if (prependedOlder) {
      const { height, top } = lastScrollRef.current;
      container.scrollTop = container.scrollHeight - height + top;
    } else if (grew) {
      if (isNearBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setHasNewMessages(true);
      }
    }

    prevListRef.current = { firstId, length: messages.length };
    lastScrollRef.current = { height: container.scrollHeight, top: container.scrollTop };
  }, [messages]);

  const handleSend = () => {
    stopTyping();
    if (selectedImage) {
      handleImageSend();
    } else {
      sendMessage(inputText);
    }
  };

  // 입력할 때마다 상대에게 "입력 중"을 알린다 (훅 내부에서 스로틀됨)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    autoGrowInput(e.target);
    if (e.target.value.trim()) {
      notifyTyping();
    } else {
      stopTyping();
    }
  };

  /** 입력창 자동 확장 — 긴 초안(어시스턴트 다듬기 등)도 보이도록 최대 5줄까지 늘어난다 */
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const INPUT_MAX_HEIGHT = 120; // px ≈ 5줄
  const autoGrowInput = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, INPUT_MAX_HEIGHT) + 'px';
  };
  // 어시스턴트 미리보기 적용 등 코드로 inputText가 바뀔 때도 높이를 맞춘다
  useEffect(() => {
    autoGrowInput(inputTextareaRef.current);
  }, [inputText]);

  // 나가기·차단은 되돌리기 번거로운 동작이라 확인을 한 번 거친다
  const confirmPendingAction = async () => {
    if (!pendingAction || !actualRoomId) return;
    setMenuBusy(true);

    const result =
      pendingAction === 'leave'
        ? await leaveChatRoom(actualRoomId)
        : await blockUser(roomId);

    setMenuBusy(false);
    setPendingAction(null);

    if (!result.success) {
      setLocalNotice(result.error ?? '요청을 처리하지 못했습니다');
      return;
    }
    nav('/chat');
  };

  const handleDeleteMessage = async (messageId: string) => {
    setSelectedMessageId(null);
    await deleteMessage(messageId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-muted">채팅방 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 채팅방 표시 이름 (브랜드명 또는 username)
  const roomName = displayName || '알 수 없음';

  // 날짜 포맷팅 헬퍼 함수
  const formatDateSeparator = (dateString?: string): string => {
    if (!dateString) return '';

    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 날짜만 비교 (시간 무시)
    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(messageDate, today)) {
      return '오늘';
    } else if (isSameDay(messageDate, yesterday)) {
      return '어제';
    } else {
      return messageDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  // 두 메시지가 다른 날짜인지 확인
  const isDifferentDay = (date1?: string, date2?: string): boolean => {
    if (!date1 || !date2) return false;

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    return d1.getFullYear() !== d2.getFullYear() ||
           d1.getMonth() !== d2.getMonth() ||
           d1.getDate() !== d2.getDate();
  };

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Header */}
      <div className="bg-white flex-shrink-0">
        <div className="h-16 flex items-center gap-3 px-4">
          <button
            onClick={() => nav('/chat')}
            className="flex-shrink-0"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-6 h-6 text-ink" />
          </button>

          {/* Avatar */}
          {partnerAvatar ? (
            <img src={partnerAvatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-surface-strong flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-muted" />
            </div>
          )}

          {/* Name + Connection */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-ink truncate">{roomName}</h1>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#22C55E]' : 'bg-gray-400'}`}></span>
              <span className={`text-[11px] font-medium ${isConnected ? 'text-[#22C55E]' : 'text-muted'}`}>
                {isConnected ? '연결됨' : '오프라인'}
              </span>
            </div>
          </div>

          {/* More — 나가기·차단·신고 */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowRoomMenu((open) => !open)}
              aria-label="채팅방 메뉴"
              aria-haspopup="menu"
              aria-expanded={showRoomMenu}
            >
              <EllipsisVertical className="w-6 h-6 text-ink" />
            </button>

            {showRoomMenu && (
              <>
                {/* 바깥을 누르면 닫힌다 */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowRoomMenu(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-lg border border-line overflow-hidden"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      setShowRoomMenu(false);
                      setPendingAction('leave');
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-ink hover:bg-surface"
                  >
                    채팅방 나가기
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setShowRoomMenu(false);
                      setPendingAction('block');
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-ink hover:bg-surface border-t border-surface"
                  >
                    차단하기
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setShowRoomMenu(false);
                      setShowReportDialog(true);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-brand hover:bg-surface border-t border-surface"
                  >
                    신고하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="h-px bg-line" />
      </div>

      {/* 연결 끊김 배너 — 이 상태에서는 전송이 불가능하므로 재시도를 제공한다 */}
      {isDegraded && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm text-amber-800 flex-1">
            채팅 서버에 연결하지 못했습니다. 메시지를 보낼 수 없습니다.
          </span>
          <button
            onClick={retryConnection}
            className="flex-shrink-0 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors"
          >
            다시 연결
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && !isDegraded && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-700 flex-1">{error}</span>
          <button
            onClick={clearError}
            className="ml-2 flex-shrink-0"
            aria-label="오류 닫기"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* 첨부 검증 등 화면 내 안내 */}
      {localNotice && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-700 flex-1">{localNotice}</span>
          <button
            onClick={() => setLocalNotice(null)}
            className="ml-2 flex-shrink-0"
            aria-label="안내 닫기"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* 이전 메시지 로딩 스피너 */}
          {isLoadingMore && (
            <div className="flex justify-center py-3">
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted">아직 메시지가 없습니다.</p>
              <p className="text-muted text-sm mt-2">첫 메시지를 보내보세요!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

              // 날짜 구분선 표시 여부
              const showDateSeparator = index === 0 || isDifferentDay(prevMessage?.createdAt, message.createdAt);

              // 그룹 판별: 이전 메시지와 같은 발신자인지
              const isGroupStart = !prevMessage || prevMessage.sender !== message.sender;
              const isGroupEnd = !nextMessage || nextMessage.sender !== message.sender;
              const isMe = message.sender === 'me';

              return (
                <React.Fragment key={message.id}>
                  {/* 날짜 구분선 */}
                  {showDateSeparator && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 bg-white rounded-xl text-xs font-medium text-muted">
                        {formatDateSeparator(message.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* 메시지 */}
                  <div
                    className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${
                      isGroupStart ? 'mt-4' : 'mt-1'
                    }`}
                  >
                  {/* 상대방 아바타 (그룹 시작시에만) */}
                  {!isMe && (
                    <div className="flex-shrink-0">
                      {isGroupStart ? (
                        partnerAvatar ? (
                          <img src={partnerAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface-strong flex items-center justify-center">
                            <Store className="w-4 h-4 text-muted" />
                          </div>
                        )
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                  )}

                  {/* 메시지 버블 */}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%] min-w-0`}>
                    {/* 발신자 이름 (상대방 메시지, 그룹 시작시에만) */}
                    {!isMe && isGroupStart && (
                      <span className="text-xs font-medium text-muted mb-1">{roomName}</span>
                    )}

                    {/* 메시지 버블 + 타임스탬프 */}
                    <div className="flex flex-col items-end gap-1">
                      {/* 전송 실패 재전송 버튼 */}
                      {isMe && message.failed && message.clientMessageId && (
                        <button
                          onClick={() => retryMessage(message.clientMessageId!)}
                          className="text-[11px] text-brand font-semibold self-end"
                        >
                          재전송
                        </button>
                      )}

                      {/* 내 메시지를 탭하면 삭제 버튼이 열린다 */}
                      {isMe && selectedMessageId === message.id && !message.deleted && (
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="text-[11px] text-brand font-semibold self-end"
                        >
                          삭제
                        </button>
                      )}
                    <div className="flex items-end gap-1.5">
                      {/* 내 메시지: 읽음 표시 + 타임스탬프 (왼쪽) */}
                      {isMe && isGroupEnd && (
                        <div className="flex flex-col items-end gap-1 text-[11px]">
                          {!message.read && !message.failed && (
                            <span className="text-brand font-semibold">1</span>
                          )}
                          <span className={`${message.failed ? 'text-brand' : 'text-muted'}`}>{message.timestamp}</span>
                        </div>
                      )}

                      {/* 삭제된 메시지 — 목록에서 사라지지 않고 자리표시자로 남는다 */}
                      {message.deleted ? (
                        <div
                          className={`px-3.5 py-2.5 max-w-[280px] rounded-[16px] border border-dashed ${
                            isMe ? 'border-[#E5D5D8]' : 'border-line'
                          }`}
                        >
                          <p className="text-sm text-muted italic">
                            삭제된 메시지입니다
                          </p>
                        </div>
                      ) : /* 이미지 메시지 */
                      message.messageType === 'image' && message.fileUrl ? (
                        <ImageMessageBubble
                          fileUrl={message.fileUrl}
                          isMe={isMe}
                          isUploading={isUploading && !!message.clientMessageId?.startsWith('img-')}
                          uploadProgress={uploadProgress}
                        />
                      ) : /* 커스텀 주문서 메시지 */
                      message.messageType === 'custom_order' && message.metadata?.customOrderId && message.metadata?.type !== 'quote' ? (
                        <CustomOrderMessageCard
                          customOrderId={message.metadata.customOrderId as string}
                          isMine={isMe}
                          onClick={() => handleOrderCardClick(message.metadata!.customOrderId as string)}
                        />
                      ) : /* 상품 문의 카드 */
                      message.messageType === 'product_inquiry' && message.metadata?.productUuid ? (
                        <ProductInquiryCard
                          productUuid={message.metadata.productUuid}
                          name={message.metadata.name ?? '상품'}
                          imageUrl={message.metadata.imageUrl}
                          price={message.metadata.price}
                          isMine={isMe}
                          onClick={(productUuid) => nav(`/product/${productUuid}`)}
                        />
                      ) : message.messageType === 'custom_order' && message.metadata?.type === 'quote' && message.metadata?.quoteId ? (
                        /* 견적서 메시지 */
                        <QuoteMessageCard
                          quoteId={message.metadata.quoteId as string}
                          isMine={isMe}
                          onClick={() => handleQuoteCardClick(message.metadata!.quoteId as string)}
                        />
                      ) : (
                        /* 일반 텍스트 메시지 버블 — 내 메시지는 탭하면 삭제 버튼이 열린다 */
                        <div
                          onClick={
                            isMe
                              ? () =>
                                  setSelectedMessageId((current) =>
                                    current === message.id ? null : message.id
                                  )
                              : undefined
                          }
                          className={`
                            px-3.5 py-2.5 transition-all max-w-[280px]
                            ${isMe
                              ? 'bg-brand-100 text-ink rounded-[16px_4px_16px_16px] cursor-pointer'
                              : 'bg-white text-ink rounded-[4px_16px_16px_16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
                            }
                          `}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {message.text}
                          </p>
                        </div>
                      )}

                      {/* 상대방 메시지: 타임스탬프 (오른쪽) */}
                      {!isMe && isGroupEnd && (
                        <span className="text-xs text-muted self-end mb-0.5">
                          {message.timestamp}
                        </span>
                      )}
                    </div>
                    </div>
                  </div>
                  </div>
                </React.Fragment>
              );
            })
          )}

          {/* 타이핑 인디케이터 */}
          {isPartnerTyping && (
            <div className="flex items-center gap-2 mt-4 ml-10">
              <div className="bg-white rounded-[4px_16px_16px_16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-3.5 py-2.5">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                  <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          )}

          {/* 자동 스크롤용 마커 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 새 메시지 점프 버튼 — 위쪽을 보고 있을 때만 나타난다 */}
      {hasNewMessages && (
        <div className="relative">
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5
                       px-4 py-2 bg-brand text-white text-xs font-semibold rounded-full
                       shadow-lg hover:bg-brand-600 transition-colors"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            새 메시지
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-white flex-shrink-0" style={{ borderTop: '1px solid #E5E0DC' }}>
        <div className="max-w-4xl mx-auto px-4 pt-2.5 pb-8">
          {/* 이미지 미리보기 */}
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <img
                src={selectedImage.previewUrl}
                alt="첨부 이미지 미리보기"
                className="max-w-[200px] max-h-[150px] object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={handleImageCancel}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ✨ 다듬기 미리보기 — 적용해도 사용자가 수정 후 직접 전송한다 */}
          {assistPreview && (
            <div className="mb-3 p-3 rounded-xl border border-brand/30 bg-[#FDF4F5]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                <span className="text-xs font-semibold text-brand">다듬은 문장</span>
              </div>
              <p className="text-sm text-ink whitespace-pre-wrap break-words mb-2.5">{assistPreview}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleAssistApply}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand text-white hover:bg-brand-600 transition-colors"
                >
                  적용
                </button>
                <button
                  onClick={handleRefine}
                  disabled={isRefining}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-line text-ink hover:bg-surface transition-colors disabled:opacity-50"
                >
                  {isRefining ? '다듬는 중...' : '다시 다듬기'}
                </button>
                <button
                  onClick={() => setAssistPreview(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-muted hover:bg-surface transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {/* 파일 첨부 버튼 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-9 h-9 flex items-center justify-center bg-surface hover:bg-[#EDE9E5] rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
              aria-label="이미지 첨부"
            >
              <Plus className="w-5 h-5 text-muted" />
            </button>

            <textarea
              ref={inputTextareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onBlur={stopTyping}
              placeholder={
                isDegraded
                  ? '연결이 끊겨 메시지를 보낼 수 없습니다'
                  : selectedImage
                    ? '이미지를 전송합니다...'
                    : '메시지 입력...'
              }
              className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2.5 bg-surface rounded-[20px] resize-none overflow-y-auto focus:outline-none text-sm text-ink placeholder:text-muted disabled:opacity-60"
              rows={1}
              disabled={!!selectedImage || isDegraded}
            />
            {/* ✨ 초안 다듬기 (상담 어시스턴트) */}
            {assistEnabled && (
              <button
                onClick={handleRefine}
                disabled={!inputText.trim() || isRefining || isDegraded || !!selectedImage || !actualRoomId}
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                  ${inputText.trim() && !isRefining && !isDegraded && !selectedImage && actualRoomId
                    ? 'bg-[#FDF4F5] text-brand hover:bg-[#FBE9EC]'
                    : 'bg-surface text-muted cursor-not-allowed'
                  }
                `}
                aria-label="문장 다듬기"
                title="문장 다듬기"
              >
                {isRefining ? (
                  <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-[18px] h-[18px]" />
                )}
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={(!inputText.trim() && !selectedImage) || isUploading || isDegraded}
              className={`
                w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                ${(inputText.trim() || selectedImage) && !isUploading && !isDegraded
                  ? 'bg-brand text-white hover:bg-brand-600'
                  : 'bg-surface text-muted cursor-not-allowed'
                }
              `}
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-[18px] h-[18px]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 커스텀 주문서 바텀 시트 */}
      <CustomOrderBottomSheet
        isOpen={showOrderSheet}
        onClose={() => setShowOrderSheet(false)}
        customOrderId={selectedCustomOrderId}
        isSeller={isSeller}
        currentUserUuid={currentUser?.userUuid}
        buyerUuid={roomId}
        onQuoteSent={() => {
          // 견적서 전송 후 바텀시트 닫기
          setShowOrderSheet(false);
        }}
      />

      {/* 견적서 바텀 시트 */}
      <QuoteBottomSheet
        isOpen={showQuoteSheet}
        onClose={() => setShowQuoteSheet(false)}
        quoteId={selectedQuoteId}
        currentUserUuid={currentUser?.userUuid}
        onPurchase={handlePurchase}
      />

      {/* 나가기·차단 확인 */}
      {pendingAction && (
        <>
          <div
            className="fixed inset-0 z-[70] bg-black/50"
            onClick={() => !menuBusy && setPendingAction(null)}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
              role="alertdialog"
              aria-modal="true"
            >
              <h2 className="text-lg font-bold text-ink mb-2">
                {pendingAction === 'leave' ? '채팅방을 나갈까요?' : `${roomName}님을 차단할까요?`}
              </h2>
              <p className="text-sm text-[#6B6560] mb-6">
                {pendingAction === 'leave'
                  ? '내 목록에서만 사라지고, 새 메시지가 오면 다시 나타납니다.'
                  : '서로 메시지를 주고받을 수 없게 됩니다. 설정에서 차단을 해제할 수 있습니다.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingAction(null)}
                  disabled={menuBusy}
                  className="flex-1 py-3 bg-surface text-ink rounded-xl font-semibold hover:bg-[#EDE9E5] transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={confirmPendingAction}
                  disabled={menuBusy}
                  className="flex-1 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {menuBusy ? '처리 중...' : pendingAction === 'leave' ? '나가기' : '차단하기'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 신고 */}
      <ReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        reportedId={roomId}
        roomId={actualRoomId}
        partnerName={roomName}
        onReported={() => setLocalNotice('신고가 접수되었습니다. 확인 후 조치하겠습니다.')}
      />
    </div>
  );
};
