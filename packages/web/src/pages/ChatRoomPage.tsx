import React, { useState, useRef, useEffect } from 'react';

interface ChatRoomPageProps {
  nav: (path: string) => void;
  roomId: string;
}

interface Message {
  id: string;
  sender: 'me' | 'other';
  text: string;
  timestamp: string;
  read?: boolean;
}

// 더미 메시지 데이터 (채팅방별)
const DUMMY_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: '1', sender: 'other', text: '안녕하세요! 핸디샵 고객센터입니다.', timestamp: '오전 10:23', read: true },
    { id: '2', sender: 'other', text: '무엇을 도와드릴까요?', timestamp: '오전 10:23', read: true },
    { id: '3', sender: 'me', text: '주문한 상품 배송이 지연되고 있어요', timestamp: '오전 10:25', read: true },
    { id: '4', sender: 'other', text: '주문번호를 알려주시겠어요?', timestamp: '오전 10:26', read: true },
    { id: '5', sender: 'me', text: 'ORD-2024-001234입니다', timestamp: '오전 10:27', read: true },
    { id: '6', sender: 'other', text: '확인해보겠습니다. 잠시만 기다려주세요.', timestamp: '오전 10:28', read: true },
    { id: '7', sender: 'other', text: '현재 배송 중이며, 내일 도착 예정입니다.', timestamp: '오전 10:30', read: false },
  ],
  '2': [
    { id: '1', sender: 'other', text: '안녕하세요! 글로시 네일입니다 😊', timestamp: '오후 2:15', read: true },
    { id: '2', sender: 'me', text: '안녕하세요', timestamp: '오후 2:16', read: true },
    { id: '3', sender: 'other', text: '주문하신 젤 네일 제품 3종이 배송 준비 중입니다.', timestamp: '오후 2:17', read: true },
    { id: '4', sender: 'other', text: '내일 오전 중 출고 예정이에요!', timestamp: '오후 2:17', read: false },
    { id: '5', sender: 'me', text: '감사합니다!', timestamp: '오후 2:18', read: true },
  ],
  '3': [
    { id: '1', sender: 'me', text: '제품 사용법이 궁금해요', timestamp: '어제 오후 3:20', read: true },
    { id: '2', sender: 'other', text: '네일 아트 스튜디오입니다! 어떤 제품인가요?', timestamp: '어제 오후 3:25', read: true },
    { id: '3', sender: 'me', text: '젤 네일 스타터 키트요', timestamp: '어제 오후 3:26', read: true },
    { id: '4', sender: 'other', text: '제품 박스 안에 설명서가 들어있어요. 유튜브에도 튜토리얼 영상이 있답니다!', timestamp: '어제 오후 3:30', read: true },
    { id: '5', sender: 'me', text: '감사합니다! 찾아볼게요', timestamp: '어제 오후 3:32', read: true },
    { id: '6', sender: 'other', text: '다음에 또 이용해주세요 😊', timestamp: '어제 오후 3:33', read: true },
  ],
};

// 채팅방 정보
const CHAT_ROOM_INFO: Record<string, { name: string }> = {
  '1': { name: '핸디샵 고객센터' },
  '2': { name: '글로시 네일' },
  '3': { name: '네일 아트 스튜디오' },
  '4': { name: '배송 알림' },
  '5': { name: '엘레강스 네일' },
  '6': { name: '프리미엄 네일샵' },
  '7': { name: '젤네일 판매점' },
};

export const ChatRoomPage: React.FC<ChatRoomPageProps> = ({ nav, roomId }) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>(DUMMY_MESSAGES[roomId] || []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roomInfo = CHAT_ROOM_INFO[roomId] || { name: '알 수 없음' };

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      text: inputText,
      timestamp: '방금',
      read: false,
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => nav('/chat')}
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

          {/* Profile */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
              {roomInfo.name.charAt(0)}
            </div>
            <h1 className="text-lg font-bold">{roomInfo.name}</h1>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.sender === 'me' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`
                    px-4 py-3 rounded-2xl
                    ${message.sender === 'me'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white text-gray-900 rounded-bl-md'
                    }
                  `}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                </div>
                <div className={`flex items-center gap-2 mt-1 px-2 ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs text-gray-500">
                    {message.timestamp}
                  </span>
                  {message.sender === 'me' && (
                    <span className="text-xs text-gray-500">
                      {message.read ? '읽음' : '안읽음'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`
                px-6 py-3 rounded-lg font-medium transition-colors
                ${inputText.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
