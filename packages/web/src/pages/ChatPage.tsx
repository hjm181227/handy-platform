import React from 'react';

interface ChatPageProps {
  nav: (path: string) => void;
}

interface ChatRoom {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

// 테스트 계정 채팅 데이터
const DUMMY_CHATS: ChatRoom[] = [
  {
    id: 'hermosear98',
    name: 'hermosear98@gmail.com',
    lastMessage: '',
    timestamp: '',
    unreadCount: 0,
  },
  {
    id: 'usertest',
    name: 'usertest@handy.com',
    lastMessage: '',
    timestamp: '',
    unreadCount: 0,
  },
];

export const ChatPage: React.FC<ChatPageProps> = ({ nav }) => {
  const handleChatClick = (chatId: string) => {
    nav(`/chat/${chatId}`);
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

      {/* Chat List */}
      <div className="max-w-7xl mx-auto">
        {DUMMY_CHATS.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleChatClick(chat.id)}
            className="bg-white border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="px-4 py-4 flex items-center gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {chat.name.charAt(0)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {chat.name}
                  </h3>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {chat.timestamp}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {chat.lastMessage}
                </p>
              </div>

              {/* Unread Badge */}
              {chat.unreadCount > 0 && (
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {chat.unreadCount}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (if no chats) */}
      {DUMMY_CHATS.length === 0 && (
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
