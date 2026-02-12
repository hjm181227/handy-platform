import React, { useState, useEffect } from 'react';
import { config } from '../config/environment';
import { useAuthModal } from '../contexts/AuthModalContext';
import { MessageCircleMore, TriangleAlert } from 'lucide-react';

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
    return '📋 커스텀 주문서';
  } else if (lastMessage.messageType === 'quote') {
    return '💰 견적서';
  }

  return lastMessage.text || '';
};

export const ChatPage: React.FC<ChatPageProps> = ({ nav, currentUser }) => {
  const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openLogin } = useAuthModal();

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

  // 채팅방 목록 조회
  useEffect(() => {
    const fetchRooms = async () => {
      if (!currentUser) return;

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('로그인이 필요합니다');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${CHAT_API_URL}/rooms?limit=50`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('채팅방 목록을 불러오는데 실패했습니다');
        }

        const data = await response.json();
        const roomsData = data.rooms || [];

        // 각 partner에 대해 브랜드 정보 조회 (판매자인 경우 브랜드명 사용)
        const roomsWithDisplayNames = await Promise.all(
          roomsData.map(async (room: ChatRoomResponse) => {
            try {
              const brandResponse = await fetch(
                `${config.apiBaseUrl}/api/brands/${room.partner.id}`
              );
              if (brandResponse.ok) {
                const brandData = await brandResponse.json();
                return {
                  ...room,
                  partner: {
                    ...room.partner,
                    displayName: brandData.brandName || room.partner.username,
                    avatar: brandData.brandProfile || room.partner.avatar,
                  },
                };
              }
            } catch {
              // 브랜드 조회 실패 시 기존 username 사용
            }
            return {
              ...room,
              partner: {
                ...room.partner,
                displayName: room.partner.username,
              },
            };
          })
        );

        setRooms(roomsWithDisplayNames);
      } catch (err) {
        console.error('[ChatPage] Error fetching rooms:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [currentUser]);

  // 비로그인 상태: 회원가입 유도 UI
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E0DC] sticky top-0 z-10 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-[#F7F5F3] rounded-full transition-colors"
              aria-label="뒤로가기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="#131211"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-[#131211]">채팅</h1>
          </div>
        </div>

        {/* 로그인 유도 UI */}
        <div className="flex-1 bg-[#F7F5F3] flex items-start justify-center pt-[100px] px-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-[72px] h-[72px] bg-white rounded-[20px] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <MessageCircleMore className="w-9 h-9 text-[#A39E99]" />
            </div>
            <h2 className="text-xl font-bold text-[#131211] text-center">
              로그인이 필요합니다
            </h2>
            <p className="text-sm text-[#A39E99] text-center">
              채팅 기능을 이용하려면 로그인해주세요.<br />
              판매자와 실시간으로 소통할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-4">
              <button
                onClick={openLogin}
                className="flex-1 px-6 py-3 bg-[#E85A6B] text-white font-semibold rounded-lg hover:bg-[#D44D5E] transition-colors"
              >
                로그인
              </button>
              <button
                onClick={() => nav('/register')}
                className="flex-1 px-6 py-3 border border-[#E5E0DC] text-[#131211] font-semibold rounded-lg hover:bg-[#F7F5F3] transition-colors"
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
      <div className="bg-white border-b border-[#E5E0DC] sticky top-0 z-10 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-[#F7F5F3] rounded-full transition-colors"
            aria-label="뒤로가기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="#131211"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-[#131211]">채팅</h1>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex-1 bg-[#F7F5F3] flex items-start justify-center pt-[100px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A6B] mx-auto mb-4"></div>
            <p className="text-[#A39E99]">채팅방 목록을 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <div className="flex-1 bg-[#F7F5F3] flex items-start justify-center pt-[100px] px-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-[72px] h-[72px] bg-white rounded-[20px] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <TriangleAlert className="w-9 h-9 text-[#E85A6B]" />
            </div>
            <h2 className="text-xl font-bold text-[#131211] text-center">
              오류가 발생했습니다
            </h2>
            <p className="text-sm text-[#A39E99] text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D44D5E] transition-colors mt-2"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* Chat List */}
      {!isLoading && !error && (
        <div className="max-w-7xl mx-auto">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              onClick={() => handleChatClick(room.partner.id, room.partner.displayName || room.partner.username)}
              className={`border-b border-[#F5F3F1] hover:bg-[#FFF8F5] cursor-pointer transition-colors ${room.unreadCount > 0 ? 'bg-[#FFF8F5]' : 'bg-white'}`}
            >
              <div className="px-4 py-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {room.partner.avatar ? (
                    <img src={room.partner.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#F2EAE3] flex items-center justify-center text-[#8B7355] font-bold text-lg">
                      {(room.partner.displayName || room.partner.username)?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-[#131211] truncate">
                      {room.partner.displayName || room.partner.username || '알 수 없음'}
                    </h3>
                    <span className="text-xs text-[#A39E99] ml-2 flex-shrink-0">
                      {room.lastMessageAt ? formatTime(room.lastMessageAt) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-[#A39E99] truncate">
                    {formatLastMessage(room.lastMessage)}
                  </p>
                </div>

                {/* Unread Badge */}
                {room.unreadCount > 0 && (
                  <div className="flex-shrink-0">
                    <div className="w-[22px] h-[22px] rounded-full bg-[#E85A6B] flex items-center justify-center">
                      <span className="text-[11px] text-white font-bold leading-none">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State (if no chats) */}
      {!isLoading && !error && rooms.length === 0 && (
        <div className="flex-1 bg-[#F7F5F3] flex items-start justify-center pt-[100px] px-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-[72px] h-[72px] bg-white rounded-[20px] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <MessageCircleMore className="w-9 h-9 text-[#A39E99]" />
            </div>
            <h2 className="text-xl font-bold text-[#131211] text-center">
              아직 대화가 없습니다
            </h2>
            <p className="text-sm text-[#A39E99] text-center">
              판매자나 고객센터와 대화를 시작해보세요.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
