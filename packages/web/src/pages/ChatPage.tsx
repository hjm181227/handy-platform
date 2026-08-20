import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, MessageCircleMore, Store, TriangleAlert } from 'lucide-react';
import { config } from '../config/environment';
import { useAuthModal } from '../contexts/AuthModalContext';

const CHAT_API_URL = config.chatApiUrl;

/**
 * 채팅 페이지에서 사용하는 사용자 인터페이스
 * (shared User 타입과 구분)
 */
interface ChatUser {
  uuid: string;
  email: string;
  name?: string;
}

interface ChatPageProps {
  nav: (path: string) => void;
  currentUser?: ChatUser | null;
}

interface ChatRoomResponse {
  roomId: string;
  partner: { id: string; username: string; displayName?: string; avatar?: string };
  lastMessage?: {
    text: string;
    messageType: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
}

// 시간 포맷팅 함수
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // 오늘이면 시간만 표시
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }
};

// 마지막 메시지 텍스트 포맷팅
const formatLastMessage = (lastMessage?: ChatRoomResponse['lastMessage']): string => {
  if (!lastMessage) return '';

  if (lastMessage.messageType === 'custom_order') {
    return '커스텀 주문서';
  } else if (lastMessage.messageType === 'quote') {
    return '견적서';
  }

  return lastMessage.text || '';
};

/** 한 번에 불러오는 방 개수 */
const PAGE_SIZE = 30;

/**
 * 파트너 UUID들의 브랜드 표시 정보를 한 번에 조회한다.
 *
 * 예전에는 방마다 GET /api/brands/{uuid}를 병렬로 때렸는데, 그 엔드포인트는
 * 상품 통계 집계와 최근 상품 조회까지 수행해서 방 개수만큼 무거운 쿼리가 돌았다.
 */
async function fetchBrandDisplayInfo(
  partnerIds: string[]
): Promise<Map<string, { brandName: string; brandProfile: string | null }>> {
  const result = new Map<string, { brandName: string; brandProfile: string | null }>();
  const uniqueIds = Array.from(new Set(partnerIds)).filter(Boolean);
  if (uniqueIds.length === 0) return result;

  try {
    const response = await fetch(`${config.apiBaseUrl}/api/brands/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerUuids: uniqueIds }),
    });
    if (!response.ok) return result;

    const data = await response.json();
    for (const [uuid, brand] of Object.entries(data.brands ?? {})) {
      result.set(uuid, brand as { brandName: string; brandProfile: string | null });
    }
  } catch {
    // 브랜드 조회 실패는 치명적이지 않다 — username으로 표시된다
  }
  return result;
}

export const ChatPage: React.FC<ChatPageProps> = ({ nav, currentUser }) => {
  const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { openLogin } = useAuthModal();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleChatClick = (partnerId: string, partnerUsername?: string) => {
    const queryParam = partnerUsername ? `?name=${encodeURIComponent(partnerUsername)}` : '';
    nav(`/chat/${partnerId}${queryParam}`);
  };

  const handleBack = () => {
    // React Native 환경에서는 Native에 메시지 전송하여 원래 서버로 복귀
    if ((window as any).ReactNativeWebView) {
      console.log('[ChatPage] Sending closeChat message to Native');
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'closeChat' })
      );
    } else {
      // 웹 환경에서는 일반 네비게이션
      nav('/');
    }
  };

  /**
   * 채팅방 한 페이지를 불러와 브랜드 표시 정보를 붙인다.
   * @param offset 건너뛸 방 개수 (0이면 처음부터)
   */
  const loadRoomPage = useCallback(
    async (offset: number): Promise<{ rooms: ChatRoomResponse[]; hasMore: boolean } | null> => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('로그인이 필요합니다');
        return null;
      }

      const response = await fetch(`${CHAT_API_URL}/rooms?limit=${PAGE_SIZE}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('채팅방 목록을 불러오는데 실패했습니다');
      }

      const data = await response.json();
      const roomsData: ChatRoomResponse[] = data.rooms || [];

      const brandMap = await fetchBrandDisplayInfo(roomsData.map((room) => room.partner.id));

      const withDisplayNames = roomsData.map((room) => {
        const brand = brandMap.get(room.partner.id);
        return {
          ...room,
          partner: {
            ...room.partner,
            displayName: brand?.brandName || room.partner.username,
            avatar: brand?.brandProfile || room.partner.avatar,
          },
        };
      });

      return { rooms: withDisplayNames, hasMore: Boolean(data.pagination?.hasMore) };
    },
    []
  );

  // 채팅방 목록 처음부터 다시 조회
  const fetchRooms = useCallback(async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);

      const page = await loadRoomPage(0);
      if (!page) return;

      setRooms(page.rooms);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('[ChatPage] Error fetching rooms:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, loadRoomPage]);

  // 다음 페이지 이어붙이기
  const loadMoreRooms = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const page = await loadRoomPage(rooms.length);
      if (!page) return;

      if (page.rooms.length === 0) {
        setHasMore(false);
        return;
      }

      // 목록은 최근 메시지순이라 페이지 사이에 중복이 생길 수 있다
      setRooms((prev) => {
        const seen = new Set(prev.map((r) => r.roomId));
        return [...prev, ...page.rooms.filter((r) => !seen.has(r.roomId))];
      });
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('[ChatPage] Error loading more rooms:', err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, rooms.length, loadRoomPage]);

  // 초기 로딩
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // 목록 끝이 보이면 다음 페이지 로드
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreRooms();
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMoreRooms]);

  // 페이지 포커스 시 방 목록 갱신 (채팅방에서 돌아온 경우 unread 배지 업데이트)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        fetchRooms();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser, fetchRooms]);

  // 비로그인 상태: 회원가입 유도 UI
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-line sticky top-0 z-10 flex-shrink-0">
          <div className="h-14 px-4 flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex-shrink-0"
              aria-label="뒤로가기"
            >
              <ChevronLeft className="w-6 h-6 text-ink" />
            </button>
            <h1 className="text-base font-bold text-ink">채팅</h1>
          </div>
        </div>

        {/* 로그인 유도 UI */}
        <div className="flex-1 bg-surface flex items-start justify-center pt-[100px] px-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-[72px] h-[72px] bg-white rounded-[20px] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <MessageCircleMore className="w-9 h-9 text-muted" />
            </div>
            <h2 className="text-xl font-bold text-ink text-center">
              로그인이 필요합니다
            </h2>
            <p className="text-sm text-muted text-center">
              채팅 기능을 이용하려면 로그인해주세요.<br />
              판매자와 실시간으로 소통할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-4">
              <button
                onClick={openLogin}
                className="flex-1 px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-600 transition-colors"
              >
                로그인
              </button>
              <button
                onClick={() => nav('/register')}
                className="flex-1 px-6 py-3 border border-line text-ink font-semibold rounded-lg hover:bg-surface transition-colors"
              >
                회원가입
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-line sticky top-0 z-10 flex-shrink-0">
        <div className="h-14 px-4 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex-shrink-0"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-6 h-6 text-ink" />
          </button>
          <h1 className="text-base font-bold text-ink">채팅</h1>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex-1 bg-surface flex items-start justify-center pt-[100px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
            <p className="text-muted">채팅방 목록을 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <div className="flex-1 bg-surface flex items-start justify-center pt-[100px] px-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-[72px] h-[72px] bg-white rounded-[20px] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <TriangleAlert className="w-9 h-9 text-brand" />
            </div>
            <h2 className="text-xl font-bold text-ink text-center">
              오류가 발생했습니다
            </h2>
            <p className="text-sm text-muted text-center">{error}</p>
            <button
              onClick={fetchRooms}
              className="px-6 py-2 bg-brand text-white rounded-lg hover:bg-brand-600 transition-colors mt-2"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* Chat List */}
      {!isLoading && !error && (
        <div>
          {rooms.map((room) => (
            <div
              key={room.roomId}
              onClick={() => handleChatClick(room.partner.id, room.partner.displayName || room.partner.username)}
              className={`border-b border-surface hover:bg-surface cursor-pointer transition-colors ${room.unreadCount > 0 ? 'bg-surface' : 'bg-white'}`}
            >
              <div className="px-4 py-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {room.partner.avatar ? (
                    <img src={room.partner.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-surface-strong flex items-center justify-center">
                      <Store className="w-6 h-6 text-muted" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-ink truncate">
                      {room.partner.displayName || room.partner.username || '알 수 없음'}
                    </h3>
                    <span className="text-xs text-muted ml-2 flex-shrink-0">
                      {room.lastMessageAt ? formatTime(room.lastMessageAt) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted truncate">
                    {formatLastMessage(room.lastMessage)}
                  </p>
                </div>

                {/* Unread Badge */}
                {room.unreadCount > 0 && (
                  <div className="flex-shrink-0">
                    <div className="w-[22px] h-[22px] rounded-full bg-brand flex items-center justify-center">
                      <span className="text-[11px] text-white font-bold leading-none">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 무한 스크롤 감지 지점 */}
          {hasMore && <div ref={sentinelRef} className="h-px" />}

          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Empty State (if no chats) */}
      {!isLoading && !error && rooms.length === 0 && (
        <div className="flex-1 bg-surface flex items-start justify-center pt-[100px] px-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-[72px] h-[72px] bg-white rounded-[20px] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <MessageCircleMore className="w-9 h-9 text-muted" />
            </div>
            <h2 className="text-xl font-bold text-ink text-center">
              아직 대화가 없습니다
            </h2>
            <p className="text-sm text-muted text-center">
              판매자나 고객센터와 대화를 시작해보세요.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
