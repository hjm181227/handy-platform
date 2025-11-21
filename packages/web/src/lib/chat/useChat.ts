/**
 * useChat Hook
 * 채팅 기능을 React 컴포넌트에 바인딩하는 커스텀 훅
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getChatSocket } from './ChatSocketService';
import type { Message, UseChatReturn, ChatRoom } from './types';

// Dummy data as fallback
const DUMMY_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: '1', roomId: '1', sender: 'other', senderId: 'user1', text: '안녕하세요!', timestamp: '오전 10:30', read: true },
    { id: '2', roomId: '1', sender: 'me', senderId: 'me', text: '네, 안녕하세요!', timestamp: '오전 10:31', read: true },
    { id: '3', roomId: '1', sender: 'other', senderId: 'user1', text: '오늘 날씨가 좋네요', timestamp: '오전 10:32', read: true },
    { id: '4', roomId: '1', sender: 'me', senderId: 'me', text: '그러게요. 산책하기 좋은 날씨에요', timestamp: '오전 10:33', read: false },
  ],
  '2': [
    { id: '5', roomId: '2', sender: 'other', senderId: 'user2', text: '회의 자료 받으셨나요?', timestamp: '오후 2:15', read: true },
    { id: '6', roomId: '2', sender: 'me', senderId: 'me', text: '네, 확인했습니다', timestamp: '오후 2:16', read: true },
  ],
};

const CHAT_ROOM_INFO: Record<string, ChatRoom> = {
  '1': { id: '1', name: '김철수', avatar: '' },
  '2': { id: '2', name: '이영희', avatar: '' },
  '3': { id: '3', name: '박민수', avatar: '' },
};

/**
 * useChat 훅
 * @param roomId 채팅방 ID
 * @param token JWT 토큰 (선택)
 * @returns UseChatReturn
 */
export function useChat(roomId: string, token?: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);

  const chatSocket = useRef(getChatSocket());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const useFallback = useRef(false);

  /**
   * 소켓 연결 및 방 입장
   */
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);

        // 토큰 필수 체크
        if (!token) {
          throw new Error('로그인이 필요합니다');
        }

        // 소켓 연결 시도
        try {
          await chatSocket.current.connect({ token });
          setIsConnected(true);
          useFallback.current = false;

          // 방 입장
          await chatSocket.current.joinRoom(roomId);
          setCurrentRoom(CHAT_ROOM_INFO[roomId] || null);

        } catch (connectError) {
          console.warn('[useChat] Socket connection failed, using fallback data:', connectError);
          useFallback.current = true;
          setIsConnected(false);

          // Fallback 더미 데이터 사용
          setMessages(DUMMY_MESSAGES[roomId] || []);
          setCurrentRoom(CHAT_ROOM_INFO[roomId] || null);
        }

      } catch (err) {
        console.error('[useChat] Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize chat');

        // 에러 시에도 더미 데이터로 폴백
        useFallback.current = true;
        setMessages(DUMMY_MESSAGES[roomId] || []);
        setCurrentRoom(CHAT_ROOM_INFO[roomId] || null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    // Cleanup: 방 퇴장
    return () => {
      if (chatSocket.current.isConnected()) {
        chatSocket.current.leaveRoom(roomId);
      }
    };
  }, [roomId, token]);

  /**
   * 메시지 수신 이벤트 구독
   */
  useEffect(() => {
    if (useFallback.current) {
      return; // Fallback 모드에서는 소켓 이벤트 구독 안 함
    }

    const unsubscribeMessage = chatSocket.current.onMessage((message) => {
      if (message.roomId === roomId) {
        setMessages(prev => [...prev, message]);
      }
    });

    const unsubscribeConnect = chatSocket.current.onConnect(() => {
      setIsConnected(true);
      setError(null);
    });

    const unsubscribeDisconnect = chatSocket.current.onDisconnect(() => {
      setIsConnected(false);
    });

    const unsubscribeError = chatSocket.current.onError((err) => {
      setError(err.message);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
    };
  }, [roomId]);

  /**
   * 메시지 전송
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) {
      return;
    }

    try {
      if (useFallback.current) {
        // Fallback 모드: 로컬 상태만 업데이트
        const newMessage: Message = {
          id: `${Date.now()}`,
          roomId,
          sender: 'me',
          senderId: 'me',
          text: text.trim(),
          timestamp: '방금',
          read: false,
        };
        setMessages(prev => [...prev, newMessage]);
        setInputText('');
      } else {
        // 소켓 모드: 서버로 전송
        const sentMessage = await chatSocket.current.sendMessage(roomId, text.trim());
        setMessages(prev => [...prev, sentMessage]);
        setInputText('');
      }
    } catch (err) {
      console.error('[useChat] Send message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [roomId]);

  /**
   * 방 입장
   */
  const joinRoom = useCallback(async (newRoomId: string) => {
    if (useFallback.current) {
      // Fallback 모드에서는 더미 데이터만 로드
      setMessages(DUMMY_MESSAGES[newRoomId] || []);
      setCurrentRoom(CHAT_ROOM_INFO[newRoomId] || null);
      return;
    }

    try {
      // 기존 방 퇴장
      if (roomId) {
        await chatSocket.current.leaveRoom(roomId);
      }

      // 새 방 입장
      await chatSocket.current.joinRoom(newRoomId);
      setCurrentRoom(CHAT_ROOM_INFO[newRoomId] || null);

    } catch (err) {
      console.error('[useChat] Join room error:', err);
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  }, [roomId]);

  /**
   * 방 퇴장
   */
  const leaveRoom = useCallback(async () => {
    if (useFallback.current) {
      setMessages([]);
      setCurrentRoom(null);
      return;
    }

    try {
      await chatSocket.current.leaveRoom(roomId);
      setMessages([]);
      setCurrentRoom(null);
    } catch (err) {
      console.error('[useChat] Leave room error:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave room');
    }
  }, [roomId]);

  /**
   * 최신 메시지로 스크롤
   */
  const scrollToLatest = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 새 메시지 도착 시 자동 스크롤
  useEffect(() => {
    scrollToLatest();
  }, [messages, scrollToLatest]);

  return {
    messages,
    inputText,
    isLoading,
    isConnected,
    error,
    currentRoom,
    sendMessage,
    setInputText,
    joinRoom,
    leaveRoom,
    scrollToLatest,
    clearError,
  };
}
