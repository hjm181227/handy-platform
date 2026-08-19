/**
 * useChat Hook
 * 채팅 기능을 React 컴포넌트에 바인딩하는 커스텀 훅
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getChatSocket } from './ChatSocketService';
import { config } from '../../config/environment';
import { webApiService } from '../../services/api';
import { createImagePreview, revokeImagePreview } from '@handy-platform/shared/src/utils/imageUpload';
import { deleteChatMessage } from './moderationService';
import type { Message, UseChatReturn, ChatRoom } from './types';

// 백엔드 채팅 서버 URL
const CHAT_API_URL = config.chatApiUrl;

/**
 * JWT 토큰에서 userId 추출.
 *
 * JWT 페이로드는 base64가 아니라 base64url이고(`-`/`_`, 패딩 없음), 한글 등
 * 비ASCII가 들어가면 atob 결과를 그대로 JSON.parse 할 수 없다. 이걸 놓치면
 * 조용히 null이 되어 내 메시지가 전부 상대편으로 렌더된다.
 */
function getUserIdFromToken(token: string): string | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;

    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);

    // UTF-8 바이트열을 문자열로 복원
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder('utf-8').decode(bytes);

    const payload = JSON.parse(json);
    return payload.userId || payload.sub || payload.id || null;
  } catch (e) {
    console.error('[useChat] Failed to decode JWT payload:', e);
    return null;
  }
}

/** 타이핑 이벤트 전송 간격 — 입력 중 이 간격으로만 서버에 알린다. */
const TYPING_THROTTLE_MS = 2000;
/** 마지막 입력 후 이 시간이 지나면 타이핑 종료를 알린다. */
const TYPING_STOP_DELAY_MS = 3000;

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
  /** 서버에 붙지 못한 상태. true면 전송을 막고 재시도를 안내한다. */
  const [isDegraded, setIsDegraded] = useState(false);
  /** 재연결 시도 횟수 — 증가시키면 초기화 effect가 다시 돈다. */
  const [retryNonce, setRetryNonce] = useState(0);

  const chatSocket = useRef(getChatSocket());
  const imageUploadManager = useRef(webApiService.createImageUploadManager());
  const useFallback = useRef(false);
  const currentUserId = useRef<string | null>(token ? getUserIdFromToken(token) : null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actualRoomIdRef = useRef<string | null>(null);
  /** 재전송을 위해 실패한 이미지 원본을 clientMessageId로 보관한다. */
  const pendingImageFiles = useRef<Map<string, File>>(new Map());
  /** partnerUsername은 표시용 힌트일 뿐이라, 값이 바뀌어도 방을 다시 열지 않는다. */
  const partnerUsernameRef = useRef(partnerUsername);
  partnerUsernameRef.current = partnerUsername;
  /** 내 타이핑 상태 전송 제어 */
  const lastTypingSentAt = useRef(0);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 소켓 콜백에서 최신 메시지 목록을 stale closure 없이 읽기 위한 미러 */
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

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
              ...(partnerUsernameRef.current && { partnerUsername: partnerUsernameRef.current }),
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
              deleted: Boolean(msg.deletedAt),
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

          setCurrentRoom({ id: roomId, name: partnerUsernameRef.current || roomId, avatar: '' });
          useFallback.current = false;
          setIsDegraded(false);
          setError(null);

        } catch (connectError) {
          console.warn('[useChat] Backend connection failed:', connectError);
          useFallback.current = true;
          setIsDegraded(true);
          setIsConnected(false);
          setError('채팅 서버에 연결할 수 없습니다. 메시지를 보낼 수 없습니다.');
          setMessages([]);
          setCurrentRoom({ id: roomId, name: partnerUsernameRef.current || roomId, avatar: '' });
        }

      } catch (err) {
        console.error('[useChat] Initialization error:', err);
        setError(err instanceof Error ? err.message : '채팅을 초기화하는데 실패했습니다');
        useFallback.current = true;
        setIsDegraded(true);
        setMessages([]);
        setCurrentRoom({ id: roomId, name: partnerUsernameRef.current || roomId, avatar: '' });
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
  }, [roomId, token, retryNonce]);

  /**
   * 연결 재시도 — 폴백 상태에서 사용자가 직접 다시 시도할 수 있게 한다.
   * (예전에는 복구 수단이 페이지 새로고침뿐이었다)
   */
  const retryConnection = useCallback(() => {
    setRetryNonce((n) => n + 1);
  }, []);

  /**
   * 앱(WebView)에 "지금 이 방을 보고 있다"고 알린다.
   *
   * 푸시 알림 억제는 네이티브가 판단하는데, 방 입장은 WebView 안의 웹 소켓이
   * 하기 때문에 네이티브는 알 방법이 없었다. 그래서 보고 있는 방의 메시지도
   * 알림이 울렸다. 푸시 페이로드의 roomId는 서버 방 ID이므로 actualRoomId를 보낸다.
   */
  useEffect(() => {
    const bridge = (window as any).ReactNativeWebView;
    if (!bridge?.postMessage) return;

    const post = (id: string | null) => {
      try {
        bridge.postMessage(JSON.stringify({ type: 'CHAT_ROOM_STATE', data: { roomId: id } }));
      } catch (e) {
        console.warn('[useChat] Failed to notify native of room state:', e);
      }
    };

    post(actualRoomId);
    return () => post(null);
  }, [actualRoomId]);

  /**
   * 재연결 시 실패한 메시지를 자동으로 다시 보낸다.
   *
   * 같은 clientMessageId를 재사용하므로, 서버에 이미 도착했는데 ack만 못 받은
   * 경우에도 멱등성 키가 중복 저장을 막는다.
   *
   * 이미지는 대상에서 제외한다 — 재업로드가 필요해 비용이 크고, 사용자가
   * 의도하지 않은 시점에 데이터를 쓰게 되기 때문이다(수동 재전송 버튼은 있다).
   */
  const flushFailedMessages = useCallback(async () => {
    const roomId = actualRoomIdRef.current;
    if (!roomId || useFallback.current) return;

    const pending = messagesRef.current.filter(
      (m) => m.failed && m.clientMessageId && m.messageType !== 'image' && m.text
    );

    for (const msg of pending) {
      try {
        const sent = await chatSocket.current.sendMessage(
          roomId,
          msg.text,
          msg.clientMessageId!
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMessageId === msg.clientMessageId
              ? { ...m, id: sent.id || m.id, failed: false }
              : m
          )
        );
      } catch {
        // 아직 불안정하면 나머지는 다음 재연결에 맡긴다
        break;
      }
    }
  }, []);

  /**
   * 메시지 수신 이벤트 구독
   */
  useEffect(() => {
    if (useFallback.current || !actualRoomId) {
      return; // Fallback 모드이거나 roomId가 없으면 구독 안 함
    }

    const unsubscribeMessage = chatSocket.current.onMessage((message) => {
      // 실제 MongoDB roomId로 필터링
      if (message.roomId !== actualRoomId) return;

      const isMine = message.senderId === currentUserId.current;
      const incomingClientId = (message as any).clientMessageId as string | undefined;

      // 상대방 메시지 수신 → 자동 읽음 처리 (내가 채팅방에 있으므로)
      if (!isMine) {
        chatSocket.current.emitMarkAsRead(actualRoomId);
      }

      const createdAt = (message as any).createdAt
        ? new Date((message as any).createdAt)
        : new Date();

      const transformedMessage: Message = {
        id: message.id || incomingClientId || `${Date.now()}`,
        roomId: message.roomId,
        sender: isMine ? 'me' : 'other',
        senderId: message.senderId,
        text: message.text,
        timestamp: createdAt.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        createdAt: createdAt.toISOString(), // 날짜 구분용
        read: !isMine, // 상대 메시지는 내가 보고 있으므로 읽음
        clientMessageId: incomingClientId,
        // 커스텀 주문서 메시지 처리
        messageType: (message as any).messageType || 'text',
        metadata: (message as any).metadata || undefined,
        fileUrl: (message as any).fileUrl || undefined,
      };

      // 내가 보낸 메시지도 버리지 않고 중복만 제거한다. 예전처럼 senderId로
      // 통째로 무시하면 다른 탭·기기에서 보낸 내 메시지가 이 화면에 안 뜬다.
      setMessages(prev => {
        if (incomingClientId && prev.some(m => m.clientMessageId === incomingClientId)) {
          // 낙관적으로 그려둔 메시지 → 서버 ID로 승격
          return prev.map(m =>
            m.clientMessageId === incomingClientId
              ? { ...m, id: transformedMessage.id, failed: false }
              : m
          );
        }
        if (message.id && prev.some(m => m.id === message.id)) return prev;
        return [...prev, transformedMessage];
      });
    });

    // 소켓 message:read 이벤트 수신 시 partnerLastReadAt 업데이트
    const unsubscribeRead = chatSocket.current.onMessageRead((data) => {
      if (data.roomId === actualRoomId) {
        setPartnerLastReadAt(data.readAt);
      }
    });

    // 상대(또는 내 다른 기기)가 메시지를 지우면 즉시 자리표시자로 바꾼다
    const unsubscribeDeleted = chatSocket.current.onMessageDeleted((data) => {
      if (data.roomId !== actualRoomId) return;
      setMessages(prev => prev.map(m =>
        m.id === data.messageId
          ? { ...m, deleted: true, text: '', fileUrl: undefined, metadata: undefined }
          : m
      ));
    });

    const unsubscribeConnect = chatSocket.current.onConnect(() => {
      setIsConnected(true);
      setError(null);
      // 끊겨 있는 동안 실패한 메시지를 자동으로 다시 보낸다.
      // clientMessageId를 그대로 재사용하므로 서버 멱등성이 중복을 막는다.
      void flushFailedMessages();
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
      unsubscribeDeleted();
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
      unsubscribeTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
    // flushFailedMessages는 ref만 읽으므로 의존성에 넣지 않아도 최신 동작을 한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // 예전에는 여기서 로컬 메시지를 그려 "보낸 것처럼" 보이게 했다.
        // 서버로는 전혀 나가지 않아 조용한 유실이었으므로, 지금은 거부한다.
        setError('채팅 서버에 연결되어 있지 않습니다. 재연결 후 다시 보내주세요.');
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

        // 2. 서버로 전송 (같은 clientMessageId를 넘겨야 재전송이 중복 저장되지 않는다)
        try {
          const sentMessage = await chatSocket.current.sendMessage(
            actualRoomId,
            text.trim(),
            clientMessageId
          );

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
  const sendImage = useCallback(async (file: File, existingClientMessageId?: string) => {
    if (!actualRoomId || useFallback.current) {
      setError('이미지 전송은 서버 연결 상태에서만 가능합니다');
      return;
    }

    const previewUrl = createImagePreview(file);
    const clientMessageId = existingClientMessageId ?? `img-${Date.now()}-${Math.random()}`;
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

    // 재전송이면 기존 말풍선을 되살리고, 신규면 추가한다
    setMessages(prev =>
      existingClientMessageId && prev.some(m => m.clientMessageId === clientMessageId)
        ? prev.map(m =>
            m.clientMessageId === clientMessageId
              ? { ...m, failed: false, fileUrl: previewUrl }
              : m
          )
        : [...prev, optimisticMessage]
    );
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
      const sentMessage = await chatSocket.current.sendImageMessage(
        actualRoomId,
        result.imageUrl,
        clientMessageId
      );

      // 성공: optimistic 메시지를 서버 응답으로 교체
      pendingImageFiles.current.delete(clientMessageId);
      revokeImagePreview(previewUrl);
      setMessages(prev => prev.map(msg =>
        msg.clientMessageId === clientMessageId
          ? {
              ...msg,
              id: sentMessage.id || msg.id,
              fileUrl: result.imageUrl,
              senderId: sentMessage.senderId || msg.senderId,
              failed: false,
            }
          : msg
      ));
    } catch (err) {
      console.error('[useChat] Image send failed:', err);
      setError(err instanceof Error ? err.message : '이미지 전송에 실패했습니다');

      // 예전에는 실패한 이미지 말풍선을 지워버려서 사용자가 무엇을 보내려
      // 했는지조차 사라졌다. 텍스트와 동일하게 failed로 남기고 재전송을 연다.
      // 미리보기 blob URL은 해제하지 않는다 — 해제하면 실패한 말풍선이
      // 깨진 이미지로 바뀌어 무엇을 보내려 했는지 알 수 없게 된다.
      pendingImageFiles.current.set(clientMessageId, file);
      setMessages(prev => prev.map(msg =>
        msg.clientMessageId === clientMessageId ? { ...msg, failed: true } : msg
      ));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [actualRoomId]);

  /**
   * 실패한 메시지 재전송
   */
  const retryMessage = useCallback(async (clientMessageId: string) => {
    const failedMsg = messages.find(m => m.clientMessageId === clientMessageId && m.failed);
    if (!failedMsg) return;
    if (!actualRoomIdRef.current) return;

    // 이미지 재전송: 보관해둔 원본 파일로 업로드부터 다시 한다
    if (failedMsg.messageType === 'image') {
      const file = pendingImageFiles.current.get(clientMessageId);
      if (!file) {
        setError('이미지를 다시 선택해주세요.');
        return;
      }
      await sendImage(file, clientMessageId);
      return;
    }

    if (!failedMsg.text) return;

    // failed 상태 해제 후 재전송
    setMessages(prev => prev.map(msg =>
      msg.clientMessageId === clientMessageId ? { ...msg, failed: false } : msg
    ));

    try {
      // 같은 clientMessageId 재사용 → 서버 멱등성 키가 중복 저장을 막는다
      const sentMessage = await chatSocket.current.sendMessage(
        actualRoomIdRef.current,
        failedMsg.text,
        clientMessageId
      );
      setMessages(prev => prev.map(msg =>
        msg.clientMessageId === clientMessageId
          ? { ...msg, id: sentMessage.id || msg.id, senderId: sentMessage.senderId, read: false, failed: false }
          : msg
      ));
    } catch (err) {
      console.error('[useChat] Retry failed:', err);
      setMessages(prev => prev.map(msg =>
        msg.clientMessageId === clientMessageId ? { ...msg, failed: true } : msg
      ));
    }
  }, [messages, sendImage]);

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
        deleted: Boolean(msg.deletedAt),
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
   * 내가 보낸 메시지 삭제.
   * 서버는 soft delete라 목록에서 사라지지 않고 자리표시자로 남는다.
   */
  const deleteMessage = useCallback(async (messageId: string) => {
    const roomId = actualRoomIdRef.current;
    if (!roomId) {
      return { success: false, error: '채팅방이 준비되지 않았습니다' };
    }

    const result = await deleteChatMessage(roomId, messageId);
    if (result.success) {
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, deleted: true, text: '', fileUrl: undefined, metadata: undefined }
          : m
      ));
    } else if (result.error) {
      setError(result.error);
    }
    return result;
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
   * 내가 입력 중임을 상대에게 알린다.
   *
   * 이 훅에 타이핑 수신 UI는 있었지만 발신 호출이 한 곳도 없어서
   * 상대의 "입력 중" 표시가 뜰 수가 없었다. 입력 이벤트마다 보내면
   * 과하니 THROTTLE 간격으로만 보내고, 조용해지면 종료를 알린다.
   */
  const notifyTyping = useCallback(() => {
    const roomIdForTyping = actualRoomIdRef.current;
    if (!roomIdForTyping || useFallback.current) return;

    const now = Date.now();
    if (now - lastTypingSentAt.current > TYPING_THROTTLE_MS) {
      lastTypingSentAt.current = now;
      chatSocket.current.sendTyping(roomIdForTyping, true);
    }

    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      lastTypingSentAt.current = 0;
      chatSocket.current.sendTyping(roomIdForTyping, false);
    }, TYPING_STOP_DELAY_MS);
  }, []);

  /** 전송 직후처럼 즉시 타이핑을 끝내야 할 때 */
  const stopTyping = useCallback(() => {
    const roomIdForTyping = actualRoomIdRef.current;
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    if (!roomIdForTyping || useFallback.current) return;
    if (lastTypingSentAt.current === 0) return;
    lastTypingSentAt.current = 0;
    chatSocket.current.sendTyping(roomIdForTyping, false);
  }, []);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 언마운트 시 남은 타이머·미리보기 정리
  useEffect(() => {
    const previews = pendingImageFiles.current;
    return () => {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      previews.clear();
    };
  }, []);

  return {
    messages,
    inputText,
    isLoading,
    isConnected,
    isDegraded,
    error,
    currentRoom,
    actualRoomId,
    sendMessage,
    sendImage,
    setInputText,
    deleteMessage,
    joinRoom,
    leaveRoom,
    clearError,
    markAsRead,
    retryConnection,
    notifyTyping,
    stopTyping,
    isUploading,
    uploadProgress,
    isPartnerTyping,
    retryMessage,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
  };
}
