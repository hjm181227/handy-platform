import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../lib/chat';
import { useAuth } from '../hooks/useAuth';
import { CustomOrderMessageCard } from '../components/chat/CustomOrderMessageCard';
import { CustomOrderBottomSheet } from '../components/chat/CustomOrderBottomSheet';
import { QuoteMessageCard } from '../components/chat/QuoteMessageCard';
import { QuoteBottomSheet } from '../components/chat/QuoteBottomSheet';
import type { Message } from '../lib/chat/types';

interface ChatRoomPageProps {
  nav: (path: string) => void;
  roomId: string;
}

export const ChatRoomPage: React.FC<ChatRoomPageProps> = ({ nav, roomId }) => {
  // localStorage에서 JWT 토큰 가져오기
  const token = localStorage.getItem('accessToken') || undefined;

  // useAuth 훅으로 현재 사용자 정보 가져오기
  const { currentUser } = useAuth();

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
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 페이지로 이동 중...</p>
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
    isLoading,
    isConnected,
    error,
    currentRoom,
    clearError,
  } = useChat(roomId, token);

  // 자동 스크롤을 위한 ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 주문서 바텀 시트 상태
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [selectedCustomOrderId, setSelectedCustomOrderId] = useState<string | null>(null);

  // 견적서 바텀 시트 상태
  const [showQuoteSheet, setShowQuoteSheet] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

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

  // 메시지 변경 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    sendMessage(inputText);
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
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">채팅방 로딩 중...</p>
        </div>
      </div>
    );
  }

  const roomName = currentRoom?.name || '알 수 없음';

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
              {roomName.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{roomName}</h1>
              {/* 연결 상태 표시 */}
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className="text-gray-500">
                  {isConnected ? '연결됨' : '오프라인 (더미 데이터)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            닫기
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">아직 메시지가 없습니다.</p>
              <p className="text-gray-400 text-sm mt-2">첫 메시지를 보내보세요!</p>
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
                      <div className="bg-gray-300 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDateSeparator(message.createdAt)}
                      </div>
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {roomName.charAt(0)}
                        </div>
                      ) : (
                        <div className="w-10" />
                      )}
                    </div>
                  )}

                  {/* 메시지 버블 */}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {/* 발신자 이름 (상대방 메시지, 그룹 시작시에만) */}
                    {!isMe && isGroupStart && (
                      <span className="text-xs text-gray-600 mb-1 px-2">{roomName}</span>
                    )}

                    {/* 메시지 버블 + 타임스탬프 */}
                    <div className="flex items-end gap-2">
                      {/* 내 메시지: 읽음 표시 + 타임스탬프 (왼쪽) */}
                      {isMe && isGroupEnd && (
                        <div className="flex flex-col items-end gap-0.5 text-xs text-gray-500">
                          {message.read ? (
                            <span className="text-blue-500">✓✓</span>
                          ) : (
                            <span className="text-gray-400">✓</span>
                          )}
                          <span>{message.timestamp}</span>
                        </div>
                      )}

                      {/* 커스텀 주문서 메시지 */}
                      {message.messageType === 'custom_order' && message.metadata?.customOrderId && message.metadata?.type !== 'quote' ? (
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
                            px-4 py-2.5 rounded-2xl transition-all
                            ${isMe
                              ? 'bg-blue-600 text-white rounded-br-sm shadow-md hover:shadow-lg'
                              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
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
                        <span className="text-xs text-gray-500 self-end mb-0.5">
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
                  ? 'bg-[#FF073A] text-white hover:bg-[#E0062F]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              전송
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
