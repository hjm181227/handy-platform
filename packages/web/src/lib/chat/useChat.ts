/**
 * useChat Hook
 * 채팅 기능을 React 컴포넌트에 바인딩하는 커스텀 훅
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getChatSocket } from './ChatSocketService';
import { config } from '../../config/environment';
import { webApiService } from '../../services/api';
import { createImagePreview, revokeImagePreview } from '@handy-platform/shared/src/utils/imageUpload';
import type { Message, UseChatReturn, ChatRoom } from './types';

// 백엔드 채팅 서버 URL
const CHAT_API_URL = config.chatApiUrl;

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [partnerLastReadAt, setPartnerLastReadAt] = useState<string | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const chatSocket = useRef(getChatSocket());
  const imageUploadManager = useRef(webApiService.createImageUploadManager());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const useFallback = useRef(false);
  const currentUserId = useRef<string | null>(token ? getUserIdFromToken(token) : null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actualRoomIdRef = useRef<string | null>(null);

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
          actualRoomIdRef.current = mongoRoomId;

          // 2. GET /messages - 메시지 히스토리 로드
          const messagesResponse = await fetch(
            `${CHAT_API_URL}/messages?roomId=${mongoRoomId}&limit=50`,
            {
              headers: { 'Authorization': `Bearer ${token}` },
            }
          );

          if (messagesResponse.ok) {
            const backendMessages = await messagesResponse.json();

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
              read: msg.senderId === currentUserId.current
                ? false // 내 메시지의 read는 partnerLastReadAt로 나중에 계산
                : true,  // 상대방 메시지는 내가 방에 입장했으므로 읽은 것
              // 커스텀 주문서 메시지 처리
              messageType: msg.messageType || 'text',
              metadata: msg.metadata || undefined,
              fileUrl: msg.fileUrl || undefined,
            }));

            // createdAt 기준 오름차순 정렬 (오래된 메시지가 위로)
            const sortedMessages = transformedMessages.sort((a, b) => {
              return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            });

            setMessages(sortedMessages);
            // 50개가 로드됐다면 더 이전 메시지가 있을 수 있음
            setHasMoreMessages(backendMessages.length >= 50);
          }

          // 3. Socket.IO 연결 및 방 입장 (실제 MongoDB roomId 사용)
          await chatSocket.current.connect({ token });
          setIsConnected(true);

          await chatSocket.current.joinRoom(mongoRoomId);

          // 4. 읽음 표시 — REST API로 마크 + 파트너 읽음 시간 조회
          try {
            const readResponse = await fetch(`${CHAT_API_URL}/rooms/${mongoRoomId}/read`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({}),
            });
            if (readResponse.ok) {
              const readData = await readResponse.json();
              setPartnerLastReadAt(readData.partnerLastReadAt || null);
            }
          } catch (e) {
            console.warn('[useChat] markAsRead failed:', e);
          }

          setCurrentRoom({ id: roomId, name: partnerUsername || roomId, avatar: '' });
          useFallback.current = false;

        } catch (connectError) {
          console.warn('[useChat] Backend connection failed:', connectError);
          useFallback.current = true;
          setIsConnected(false);
          setError('채팅 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
          setMessages([]);
          setCurrentRoom({ id: roomId, name: partnerUsername || roomId, avatar: '' });
        }

      } catch (err) {
        console.error('[useChat] Initialization error:', err);
        setError(err instanceof Error ? err.message : '채팅을 초기화하는데 실패했습니다');
        useFallback.current = true;
        setMessages([]);
        setCurrentRoom({ id: roomId, name: partnerUsername || roomId, avatar: '' });
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    // Cleanup: 방 퇴장 (ref 사용으로 stale closure 방지)
    return () => {
      if (chatSocket.current.isConnected() && actualRoomIdRef.current) {
        chatSocket.current.leaveRoom(actualRoomIdRef.current);
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

        // 상대방 메시지 수신 → 자동 읽음 처리 (내가 채팅방에 있으므로)
        chatSocket.current.emitMarkAsRead(actualRoomId);

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
          read: true, // 내가 보고 있으므로 읽음 처리
          // 커스텀 주문서 메시지 처리
          messageType: (message as any).messageType || 'text',
          metadata: (message as any).metadata || undefined,
          fileUrl: (message as any).fileUrl || undefined,
        };
        setMessages(prev => [...prev, transformedMessage]);
      }
    });

    // 소켓 message:read 이벤트 수신 시 partnerLastReadAt 업데이트
    const unsubscribeRead = chatSocket.current.onMessageRead((data) => {
      if (data.roomId === actualRoomId) {
        setPartnerLastReadAt(data.readAt);
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

    // 타이핑 인디케이터 구독 — 상대방의 타이핑 상태만 반영
    const unsubscribeTyping = chatSocket.current.onTyping((data) => {
      if (data.roomId === actualRoomId && data.userId !== currentUserId.current) {
        setIsPartnerTyping(data.isTyping);
        // 상대방이 타이핑 중이면 5초 후 자동 해제 (서버 이벤트 유실 방어)
        if (data.isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 5000);
        } else {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        }
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeRead();
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
      unsubscribeTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [actualRoomId]);

  /**
   * partnerLastReadAt 변경 시 내 메시지의 read 상태 업데이트
   */
  useEffect(() => {
    if (!partnerLastReadAt) return;
    setMessages(prev => prev.map(msg => {
      if (msg.sender !== 'me') return msg;
      const msgTime = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
      const readTime = new Date(partnerLastReadAt).getTime();
      return { ...msg, read: msgTime <= readTime };
    }));
  }, [partnerLastReadAt]);

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
                  failed: false,
                }
              : msg
          ));
        } catch (sendError) {
          // 4. 실패 시: 메시지를 failed 상태로 표시하여 재전송 버튼 노출
          console.error('[useChat] Send message to server failed:', sendError);
          setMessages(prev => prev.map(msg =>
            msg.clientMessageId === clientMessageId
              ? { ...msg, failed: true }
              : msg
          ));
        }
      }
    } catch (err) {
      console.error('[useChat] Send message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [actualRoomId, roomId]);

  /**
   * 이미지 메시지 전송
   */
  const sendImage = useCallback(async (file: File) => {
    if (!actualRoomId || useFallback.current) {
      setError('이미지 전송은 서버 연결 상태에서만 가능합니다');
      return;
    }

    const previewUrl = createImagePreview(file);
    const clientMessageId = `img-${Date.now()}-${Math.random()}`;
    const now = new Date();

    // Optimistic UI: 미리보기 이미지로 즉시 표시
    const optimisticMessage: Message = {
      id: clientMessageId,
      roomId: actualRoomId,
      sender: 'me',
      senderId: currentUserId.current || 'me',
      text: '',
      timestamp: now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      createdAt: now.toISOString(),
      read: false,
      clientMessageId,
      messageType: 'image',
      fileUrl: previewUrl,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // S3 업로드
      const result = await imageUploadManager.current.uploadImage({
        file,
        uploadType: 'chat-message',
        onProgress: (progress) => setUploadProgress(progress),
      });

      if (!result.success) {
        throw new Error(result.error || '이미지 업로드에 실패했습니다');
      }

      // 소켓으로 이미지 메시지 전송
      const sentMessage = await chatSocket.current.sendImageMessage(actualRoomId, result.imageUrl);

      // 성공: optimistic 메시지를 서버 응답으로 교체
      setMessages(prev => prev.map(msg =>
        msg.clientMessageId === clientMessageId
          ? {
              ...msg,
              id: sentMessage.id || msg.id,
              fileUrl: result.imageUrl,
              senderId: sentMessage.senderId || msg.senderId,
            }
          : msg
      ));
    } catch (err) {
      console.error('[useChat] Image send failed:', err);
      setError(err instanceof Error ? err.message : '이미지 전송에 실패했습니다');

      // 실패한 메시지 제거
      setMessages(prev => prev.filter(msg => msg.clientMessageId !== clientMessageId));
    } finally {
      revokeImagePreview(previewUrl);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [actualRoomId]);

  /**
   * 실패한 메시지 재전송
   */
  const retryMessage = useCallback(async (clientMessageId: string) => {
    const failedMsg = messages.find(m => m.clientMessageId === clientMessageId && m.failed);
    if (!failedMsg || !failedMsg.text) return;

    // failed 상태 해제 후 재전송
    setMessages(prev => prev.map(msg =>
      msg.clientMessageId === clientMessageId ? { ...msg, failed: false } : msg
    ));

    if (!actualRoomIdRef.current) return;
    try {
      const sentMessage = await chatSocket.current.sendMessage(actualRoomIdRef.current, failedMsg.text);
      setMessages(prev => prev.map(msg =>
        msg.clientMessageId === clientMessageId
          ? { ...msg, id: sentMessage.id || msg.id, senderId: sentMessage.senderId, read: false, failed: false }
          : msg
      ));
    } catch {
      setMessages(prev => prev.map(msg =>
        msg.clientMessageId === clientMessageId ? { ...msg, failed: true } : msg
      ));
    }
  }, [messages]);

  /**
   * 이전 메시지 추가 로드 (페이지네이션)
   */
  const loadMoreMessages = useCallback(async () => {
    if (!actualRoomIdRef.current || !token || isLoadingMore || !hasMoreMessages || useFallback.current) return;

    const oldestMessage = messages[0];
    if (!oldestMessage?.createdAt) return;

    try {
      setIsLoadingMore(true);
      const before = encodeURIComponent(oldestMessage.createdAt);
      const response = await fetch(
        `${CHAT_API_URL}/messages?roomId=${actualRoomIdRef.current}&limit=50&before=${before}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) return;

      const olderMessages = await response.json();
      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      const transformed: Message[] = olderMessages.map((msg: any) => ({
        id: msg._id,
        roomId: msg.roomId,
        sender: msg.senderId === currentUserId.current ? 'me' : 'other',
        senderId: msg.senderId,
        text: msg.text,
        timestamp: new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        createdAt: msg.createdAt,
        read: msg.senderId === currentUserId.current ? false : true,
        messageType: msg.messageType || 'text',
        metadata: msg.metadata || undefined,
        fileUrl: msg.fileUrl || undefined,
      }));

      const sorted = transformed.sort((a, b) =>
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );

      setMessages(prev => [...sorted, ...prev]);
      setHasMoreMessages(olderMessages.length >= 50);
    } catch (err) {
      console.error('[useChat] loadMoreMessages error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [token, isLoadingMore, hasMoreMessages, messages]);

  /**
   * 방 입장
   */
  const joinRoom = useCallback(async (newRoomId: string) => {
    if (useFallback.current) {
      setMessages([]);
      setCurrentRoom(null);
      return;
    }

    try {
      // 기존 방 퇴장
      if (roomId) {
        await chatSocket.current.leaveRoom(roomId);
      }

      // 새 방 입장
      await chatSocket.current.joinRoom(newRoomId);
      setCurrentRoom({ id: newRoomId, name: newRoomId, avatar: '' });

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
   * 읽음 처리
   */
  const markAsRead = useCallback(() => {
    if (actualRoomId && !useFallback.current) {
      chatSocket.current.emitMarkAsRead(actualRoomId);
    }
  }, [actualRoomId]);

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
    sendImage,
    setInputText,
    joinRoom,
    leaveRoom,
    scrollToLatest,
    clearError,
    markAsRead,
    isUploading,
    uploadProgress,
    isPartnerTyping,
    retryMessage,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
  };
}
