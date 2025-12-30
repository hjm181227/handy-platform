import React, { useState, useEffect } from 'react';

const CHAT_API_URL = 'http://16.176.147.141';

interface User {
  uuid: string;
  email: string;
  name?: string;
}

interface ChatPageProps {
  nav: (path: string) => void;
  currentUser?: User | null;
}

interface ChatRoomResponse {
  roomId: string;
  partner: { id: string; username: string };
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

  const handleChatClick = (partnerId: string) => {
    nav(`/chat/${partnerId}`);
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
        setRooms(data.rooms || []);
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="뒤로가기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold">채팅</h1>
          </div>
        </div>

        {/* 로그인 유도 UI */}
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6">💬</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            로그인이 필요합니다
          </h2>
          <p className="text-gray-600 mb-8">
            채팅 기능을 이용하려면 로그인해주세요.<br />
            판매자와 실시간으로 소통할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
            <button
              onClick={() => nav('/login')}
              className="flex-1 px-6 py-3 bg-[#FF073A] text-white font-semibold rounded-lg hover:bg-[#E0062F] transition-colors"
            >
              로그인
            </button>
            <button
              onClick={() => nav('/register')}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="뒤로가기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold">채팅</h1>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">채팅방 목록을 불러오는 중...</p>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            오류가 발생했습니다
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Chat List */}
      {!isLoading && !error && (
        <div className="max-w-7xl mx-auto">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              onClick={() => handleChatClick(room.partner.id)}
              className="bg-white border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="px-4 py-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-lg">
                    {room.partner.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {room.partner.username || '알 수 없음'}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {room.lastMessageAt ? formatTime(room.lastMessageAt) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {formatLastMessage(room.lastMessage)}
                  </p>
                </div>

                {/* Unread Badge */}
                {room.unreadCount > 0 && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-[#FF073A] flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
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
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            아직 대화가 없습니다
          </h2>
          <p className="text-gray-600">
            판매자나 고객센터와 대화를 시작해보세요.
          </p>
        </div>
      )}
    </div>
  );
};
