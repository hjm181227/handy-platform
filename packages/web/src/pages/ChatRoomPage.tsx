import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Plus, Send, EllipsisVertical, Store, X } from 'lucide-react';
import { useChat } from '../lib/chat';
import { useAuth } from '../hooks/useAuth';
import { CustomOrderMessageCard } from '../components/chat/CustomOrderMessageCard';
import { CustomOrderBottomSheet } from '../components/chat/CustomOrderBottomSheet';
import { QuoteMessageCard } from '../components/chat/QuoteMessageCard';
import { QuoteBottomSheet } from '../components/chat/QuoteBottomSheet';
import { ImageMessageBubble } from '../components/chat/ImageMessageBubble';
import { config } from '../config/environment';
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

      // 브랜드 정보 조회 시도 (판매자인지 확인)
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/brands/${roomId}`);
        if (response.ok) {
          const brandData = await response.json();
          setDisplayName(brandData.brandName || roomId);
          if (brandData.brandProfile) {
            setPartnerAvatar(brandData.brandProfile);
          }
        }
        // 404 등의 경우 roomId 유지 (구매자)
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
      alert('로그인이 필요한 서비스입니다.');
      nav('/login');
    }
  }, [token, nav]);

  // 토큰 없으면 로딩 화면 표시 (리다이렉트 중)
  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F5F3]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A6B] mx-auto mb-4"></div>
          <p className="text-[#A39E99]">로그인 페이지로 이동 중...</p>
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
    error,
    clearError,
    isUploading,
    uploadProgress,
  } = useChat(roomId, token, partnerUsernameFromUrl);

  // 자동 스크롤을 위한 ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      alert('이미지 크기는 10MB 이하만 가능합니다.');
      return;
    }

    // 이미지 타입 검증
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('JPG, PNG, WebP 이미지만 지원합니다.');
      return;
    }

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

  // 메시지 변경 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (selectedImage) {
      handleImageSend();
    } else {
      sendMessage(inputText);
    }
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
      <div className="h-screen flex items-center justify-center bg-[#F7F5F3]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A6B] mx-auto mb-4"></div>
          <p className="text-[#A39E99]">채팅방 로딩 중...</p>
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
    <div className="h-screen flex flex-col bg-[#F7F5F3]">
      {/* Header */}
      <div className="bg-white flex-shrink-0">
        <div className="h-16 flex items-center gap-3 px-4">
          <button
            onClick={() => nav('/chat')}
            className="flex-shrink-0"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-6 h-6 text-[#131211]" />
          </button>

          {/* Avatar */}
          {partnerAvatar ? (
            <img src={partnerAvatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#F2EAE3] flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-[#A39E99]" />
            </div>
          )}

          {/* Name + Connection */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#131211] truncate">{roomName}</h1>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#22C55E]' : 'bg-gray-400'}`}></span>
              <span className={`text-[11px] font-medium ${isConnected ? 'text-[#22C55E]' : 'text-[#A39E99]'}`}>
                {isConnected ? '연결됨' : '오프라인'}
              </span>
            </div>
          </div>

          {/* More */}
          <button className="flex-shrink-0">
            <EllipsisVertical className="w-6 h-6 text-[#131211]" />
          </button>
        </div>
        <div className="h-px bg-[#E5E0DC]" />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-700 flex-1">{error}</span>
          <button
            onClick={clearError}
            className="ml-2 flex-shrink-0"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#A39E99]">아직 메시지가 없습니다.</p>
              <p className="text-[#A39E99] text-sm mt-2">첫 메시지를 보내보세요!</p>
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
                      <span className="px-3 py-1 bg-white rounded-xl text-xs font-medium text-[#A39E99]">
                        {formatDateSeparator(message.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* 메시지 */}
                  <div
                    className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${
                      isGroupStart ? 'mt-6' : 'mt-1'
                    }`}
                  >
                  {/* 상대방 아바타 (그룹 시작시에만) */}
                  {!isMe && (
                    <div className="flex-shrink-0">
                      {isGroupStart ? (
                        partnerAvatar ? (
                          <img src={partnerAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#F2EAE3] flex items-center justify-center">
                            <Store className="w-5 h-5 text-[#A39E99]" />
                          </div>
                        )
                      ) : (
                        <div className="w-10" />
                      )}
                    </div>
                  )}

                  {/* 메시지 버블 */}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {/* 발신자 이름 (상대방 메시지, 그룹 시작시에만) */}
                    {!isMe && isGroupStart && (
                      <span className="text-xs text-[#A39E99] mb-1 px-2">{roomName}</span>
                    )}

                    {/* 메시지 버블 + 타임스탬프 */}
                    <div className="flex items-end gap-2">
                      {/* 내 메시지: 읽음 표시 + 타임스탬프 (왼쪽) */}
                      {isMe && isGroupEnd && (
                        <div className="flex flex-col items-end gap-0.5 text-xs text-[#A39E99]">
                          {message.read ? (
                            <span className="text-[#E85A6B]">✓✓</span>
                          ) : (
                            <span className="text-[#A39E99]">✓</span>
                          )}
                          <span>{message.timestamp}</span>
                        </div>
                      )}

                      {/* 이미지 메시지 */}
                      {message.messageType === 'image' && message.fileUrl ? (
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
                      ) : message.messageType === 'custom_order' && message.metadata?.type === 'quote' && message.metadata?.quoteId ? (
                        /* 견적서 메시지 */
                        <QuoteMessageCard
                          quoteId={message.metadata.quoteId as string}
                          isMine={isMe}
                          onClick={() => handleQuoteCardClick(message.metadata!.quoteId as string)}
                        />
                      ) : (
                        /* 일반 텍스트 메시지 버블 */
                        <div
                          className={`
                            px-4 py-2.5 transition-all
                            ${isMe
                              ? 'bg-[#FFE5EA] text-[#131211] rounded-[16px_4px_16px_16px]'
                              : 'bg-white text-[#131211] rounded-[4px_16px_16px_16px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
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
                        <span className="text-xs text-[#A39E99] self-end mb-0.5">
                          {message.timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                  </div>
                </React.Fragment>
              );
            })
          )}

          {/* 타이핑 인디케이터 (향후 구현 예정) */}
          {false && ( // 일단 비활성화
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                {roomName.charAt(0)}
              </div>
              <span className="italic">{roomName}님이 입력 중</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}

          {/* 자동 스크롤용 마커 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-[#E5E0DC] flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
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

          <div className="flex items-end gap-2">
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
              className="w-9 h-9 flex items-center justify-center bg-[#F7F5F3] hover:bg-[#EDE9E5] rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
              aria-label="이미지 첨부"
            >
              <Plus className="w-5 h-5 text-[#A39E99]" />
            </button>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedImage ? '이미지를 전송합니다...' : '메시지를 입력하세요...'}
              className="flex-1 px-4 py-2.5 bg-[#F7F5F3] rounded-[20px] resize-none focus:outline-none focus:ring-1 focus:ring-[#E85A6B] max-h-32 text-[#131211] placeholder:text-[#A39E99]"
              rows={1}
              disabled={!!selectedImage}
            />
            <button
              onClick={handleSend}
              disabled={(!inputText.trim() && !selectedImage) || isUploading}
              className={`
                w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                ${(inputText.trim() || selectedImage) && !isUploading
                  ? 'bg-[#E85A6B] text-white hover:bg-[#D44D5E]'
                  : 'bg-[#F7F5F3] text-[#A39E99] cursor-not-allowed'
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
        isSeller={isSeller}
        onPurchase={handlePurchase}
      />
    </div>
  );
};
