/**
 * useChat Hook
 * 채팅 기능을 React 컴포넌트에 바인딩하는 커스텀 훅
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getChatSocket } from './ChatSocketService';
import { config } from '../../config/environment';
import type { Message, UseChatReturn, ChatRoom } from './types';

// Dummy data as fallback (일반 텍스트 메시지만 - 커스텀 주문서는 API 연동)
const DUMMY_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: '1', roomId: '1', sender: 'other', senderId: 'user1', text: '안녕하세요!', timestamp: '오전 10:30', createdAt: '2025-11-25T01:30:00Z', read: true },
    { id: '2', roomId: '1', sender: 'me', senderId: 'me', text: '네, 안녕하세요!', timestamp: '오전 10:31', createdAt: '2025-11-25T01:31:00Z', read: true },
    { id: '3', roomId: '1', sender: 'other', senderId: 'user1', text: '오늘 날씨가 좋네요', timestamp: '오전 10:32', createdAt: '2025-11-25T01:32:00Z', read: true },
    { id: '4', roomId: '1', sender: 'me', senderId: 'me', text: '그러게요. 산책하기 좋은 날씨에요', timestamp: '오전 10:33', createdAt: '2025-11-25T01:33:00Z', read: false },
  ],
  '2': [
    { id: '5', roomId: '2', sender: 'other', senderId: 'user2', text: '회의 자료 받으셨나요?', timestamp: '오후 2:15', createdAt: '2025-11-25T05:15:00Z', read: true },
    { id: '6', roomId: '2', sender: 'me', senderId: 'me', text: '네, 확인했습니다', timestamp: '오후 2:16', createdAt: '2025-11-25T05:16:00Z', read: true },
  ],
};

const CHAT_ROOM_INFO: Record<string, ChatRoom> = {
  '1': { id: '1', name: '김철수', avatar: '' },
  '2': { id: '2', name: '이영희', avatar: '' },
  '3': { id: '3', name: '박민수', avatar: '' },
};

// 백엔드 채팅 서버 URL
const CHAT_API_URL = 'http://16.176.147.141';

/**
 * JWT 토큰에서 userId 추출
 */
function getUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.sub || payload.id || null;
  } catch {
    return null;
  }
}

/**
 * useChat 훅
 * @param roomId 상대방 userId (예: 'hermosear98')
 * @param token JWT 토큰 (선택)
 * @param partnerUsername 상대방 이름 (선택) - /rooms/ensure 호출 시 사용
 * @returns UseChatReturn
 */
export function useChat(roomId: string, token?: string, partnerUsername?: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [actualRoomId, setActualRoomId] = useState<string | null>(null);

  const chatSocket = useRef(getChatSocket());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const useFallback = useRef(false);
  const currentUserId = useRef<string | null>(token ? getUserIdFromToken(token) : null);

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

        // 백엔드 API 연동 시도
        try {
          // 1. POST /rooms/ensure - 채팅방 생성/조회
          console.log('[useChat] Ensuring chat room with:', roomId);
          const ensureResponse = await fetch(`${CHAT_API_URL}/rooms/ensure`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              partnerId: roomId,
              ...(partnerUsername && { partnerUsername }),
            }),
          });

          if (!ensureResponse.ok) {
            throw new Error(`Failed to create/get chat room: ${ensureResponse.status}`);
          }

          const roomData = await ensureResponse.json();
          const mongoRoomId = roomData._id;
          setActualRoomId(mongoRoomId);
          console.log('[useChat] Got room ID:', mongoRoomId);

          // 2. GET /messages - 메시지 히스토리 로드
          console.log('[useChat] Loading message history...');
          const messagesResponse = await fetch(
            `${CHAT_API_URL}/messages?roomId=${mongoRoomId}&limit=50`,
            {
              headers: { 'Authorization': `Bearer ${token}` },
            }
          );

          if (messagesResponse.ok) {
            const backendMessages = await messagesResponse.json();
            console.log('[useChat] Loaded messages:', backendMessages.length);

            // 백엔드 메시지 형식을 프론트엔드 형식으로 변환
            const transformedMessages: Message[] = backendMessages.map((msg: any) => ({
              id: msg._id,
              roomId: msg.roomId,
              sender: msg.senderId === currentUserId.current ? 'me' : 'other',
              senderId: msg.senderId,
              text: msg.text,
              timestamp: new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              createdAt: msg.createdAt, // 날짜 구분용
              read: msg.status === 'read',
              // 커스텀 주문서 메시지 처리
              messageType: msg.messageType || 'text',
              metadata: msg.metadata || undefined,
            }));

            // createdAt 기준 오름차순 정렬 (오래된 메시지가 위로)
            const sortedMessages = transformedMessages.sort((a, b) => {
              return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            });

            setMessages(sortedMessages);
          }

          // 3. Socket.IO 연결 및 방 입장 (실제 MongoDB roomId 사용)
          console.log('[useChat] Connecting to Socket.IO...');
          await chatSocket.current.connect({ token });

          // connect() Promise가 resolve되면 연결 성공으로 간주
          console.log('[useChat] Socket.IO connected successfully (via Promise resolve)');
          setIsConnected(true);

          console.log('[useChat] Joining room:', mongoRoomId);
          await chatSocket.current.joinRoom(mongoRoomId);
          console.log('[useChat] Successfully joined room:', mongoRoomId);

          setCurrentRoom({ id: roomId, name: partnerUsername || roomId, avatar: '' });
          useFallback.current = false;

        } catch (connectError) {
          console.warn('[useChat] Backend connection failed, using fallback data:', connectError);
          useFallback.current = true;
          setIsConnected(false);

          // Fallback 더미 데이터 사용 (시간순 정렬)
          const dummyMessages = DUMMY_MESSAGES[roomId] || [];
          const sortedDummy = [...dummyMessages].sort((a, b) =>
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          );
          setMessages(sortedDummy);
          setCurrentRoom(CHAT_ROOM_INFO[roomId] || { id: roomId, name: partnerUsername || roomId, avatar: '' });
        }

      } catch (err) {
        console.error('[useChat] Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize chat');

        // 에러 시에도 더미 데이터로 폴백 (시간순 정렬)
        useFallback.current = true;
        const dummyMessages = DUMMY_MESSAGES[roomId] || [];
        const sortedDummy = [...dummyMessages].sort((a, b) =>
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
        setMessages(sortedDummy);
        setCurrentRoom(CHAT_ROOM_INFO[roomId] || { id: roomId, name: partnerUsername || roomId, avatar: '' });
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    // Cleanup: 방 퇴장
    return () => {
      if (chatSocket.current.isConnected() && actualRoomId) {
        chatSocket.current.leaveRoom(actualRoomId);
      }
    };
  }, [roomId, token, partnerUsername]);

  /**
   * 메시지 수신 이벤트 구독
   */
  useEffect(() => {
    if (useFallback.current || !actualRoomId) {
      return; // Fallback 모드이거나 roomId가 없으면 구독 안 함
    }

    const unsubscribeMessage = chatSocket.current.onMessage((message) => {
      // 실제 MongoDB roomId로 필터링
      if (message.roomId === actualRoomId) {
        // 자신이 보낸 메시지는 이미 Optimistic Update로 추가했으므로 무시
        if (message.senderId === currentUserId.current) {
          return;
        }

        // 백엔드 메시지 형식을 프론트엔드 형식으로 변환
        const now = new Date();
        const transformedMessage: Message = {
          id: message.id || `${Date.now()}`,
          roomId: message.roomId,
          sender: message.senderId === currentUserId.current ? 'me' : 'other',
          senderId: message.senderId,
          text: message.text,
          timestamp: now.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          createdAt: now.toISOString(), // 날짜 구분용
          read: false,
          // 커스텀 주문서 메시지 처리
          messageType: (message as any).messageType || 'text',
          metadata: (message as any).metadata || undefined,
        };
        setMessages(prev => [...prev, transformedMessage]);
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
  }, [actualRoomId]);

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
        const now = new Date();
        const newMessage: Message = {
          id: `${Date.now()}`,
          roomId: actualRoomId || roomId,
          sender: 'me',
          senderId: 'me',
          text: text.trim(),
          timestamp: '방금',
          createdAt: now.toISOString(),
          read: false,
        };
        setMessages(prev => [...prev, newMessage]);
        setInputText('');
      } else {
        // 소켓 모드: Optimistic UI - 즉시 메시지 추가 후 서버 전송
        if (!actualRoomId) {
          throw new Error('Room not initialized');
        }

        // 1. Optimistic Update: 즉시 UI에 메시지 추가
        const clientMessageId = `client-${Date.now()}-${Math.random()}`;
        const now = new Date();
        const optimisticMessage: Message = {
          id: clientMessageId, // 임시 ID
          roomId: actualRoomId,
          sender: 'me',
          senderId: currentUserId.current || 'me',
          text: text.trim(),
          timestamp: now.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          createdAt: now.toISOString(),
          read: false,
          clientMessageId, // 추적용
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setInputText(''); // 입력창 즉시 클리어

        // 2. 서버로 전송
        try {
          const sentMessage = await chatSocket.current.sendMessage(actualRoomId, text.trim());

          // 3. 성공 시: 임시 메시지를 서버 메시지로 교체
          setMessages(prev => prev.map(msg =>
            msg.clientMessageId === clientMessageId
              ? {
                  ...msg,
                  id: sentMessage.id || msg.id, // 서버 ID로 업데이트
                  senderId: sentMessage.senderId,
                  read: false,
                }
              : msg
          ));
        } catch (sendError) {
          // 4. 실패 시: 메시지를 에러 상태로 표시 (일단 그대로 유지, 향후 재전송 기능 추가 가능)
          console.error('[useChat] Send message to server failed:', sendError);
          setError('메시지 전송에 실패했습니다');

          // 실패한 메시지는 UI에 남겨두되, 에러 표시 가능 (향후 구현)
          // 현재는 그냥 로컬에 남아있는 상태로 유지
        }
      }
    } catch (err) {
      console.error('[useChat] Send message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [actualRoomId, roomId]);

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
