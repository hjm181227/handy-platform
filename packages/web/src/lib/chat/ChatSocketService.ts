/**
 * ChatSocketService (Singleton)
 * Socket.IO 연결을 관리하는 싱글톤 서비스
 */

import { io, Socket } from 'socket.io-client';
import type { Message, ChatRoom, TypingIndicator, ChatServiceConfig } from './types';
import { config as envConfig } from '../../config/environment';

type MessageCallback = (message: Message) => void;
type TypingCallback = (data: TypingIndicator) => void;
type ConnectionCallback = () => void;
type ErrorCallback = (error: Error) => void;
type ReadCallback = (data: { roomId: string; userId: string; readAt: string }) => void;
type UnreadTotalCallback = (data: { total: number }) => void;
type DeletedCallback = (data: { roomId: string; messageId: string }) => void;

/** 메시지 ack를 기다리는 최대 시간. 초과하면 실패로 보고하고 재전송을 유도한다. */
const ACK_TIMEOUT_MS = 10000;

/**
 * 서버는 Mongoose 문서를 그대로 내보내므로 식별자가 `_id`다.
 * 클라이언트 Message 타입은 `id`를 쓰기 때문에 진입 지점에서 한 번만 맞춰준다.
 * (예전에는 `id`가 없어서 수신 메시지마다 Date.now()로 가짜 키를 만들었고,
 *  같은 밀리초에 도착한 메시지끼리 React key가 충돌했다.)
 */
function normalizeMessage(raw: any): Message {
  if (!raw || typeof raw !== 'object') return raw;
  return { ...raw, id: raw.id ?? (raw._id != null ? String(raw._id) : undefined) };
}

export class ChatSocketService {
  private static instance: ChatSocketService | null = null;
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private typingCallbacks: Set<TypingCallback> = new Set();
  private connectCallbacks: Set<ConnectionCallback> = new Set();
  private disconnectCallbacks: Set<ConnectionCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  private readCallbacks: Set<ReadCallback> = new Set();
  private unreadTotalCallbacks: Set<UnreadTotalCallback> = new Set();
  private deletedCallbacks: Set<DeletedCallback> = new Set();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): ChatSocketService {
    if (!ChatSocketService.instance) {
      ChatSocketService.instance = new ChatSocketService();
    }
    return ChatSocketService.instance;
  }

  /**
   * 소켓 연결 (환경 변수에서 URL 읽기)
   */
  public connect(config?: ChatServiceConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 이미 연결되어 있으면 재사용
        if (this.socket?.connected) {
          console.log('[ChatSocket] Already connected, reusing connection');
          resolve();
          return;
        }

        const serverUrl = config?.serverUrl || import.meta.env.VITE_SOCKET_URL || envConfig.chatApiUrl;

        const socketOptions: any = {
          reconnection: config?.reconnection !== false,
          reconnectionAttempts: config?.reconnectionAttempts || 5,
          reconnectionDelay: config?.reconnectionDelay || 1000,
          transports: ['websocket', 'polling'],
        };

        // 토큰이 있으면 auth에 추가 (토큰 자체는 로그에 남기지 않는다)
        if (config?.token) {
          socketOptions.auth = { token: config.token };
        }

        this.socket = io(serverUrl, socketOptions);

        // 타임아웃 설정 (10초)
        const connectionTimeout = setTimeout(() => {
          console.error('[ChatSocket] Connection timeout');
          reject(new Error('Socket connection timeout (10s)'));
        }, 10000);

        // 연결 성공 시 타임아웃 제거
        const clearTimeoutAndResolve = () => {
          clearTimeout(connectionTimeout);
          resolve();
        };

        // 연결 이벤트 리스너
        this.socket.on('connect', () => {
          this.connectCallbacks.forEach(cb => cb());
          clearTimeoutAndResolve();
        });

        this.socket.on('disconnect', () => {
          console.log('[ChatSocket] Disconnected from server');
          this.disconnectCallbacks.forEach(cb => cb());
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('[ChatSocket] Connection error:', error?.message ?? error);
          this.errorCallbacks.forEach(cb => cb(error));
          clearTimeout(connectionTimeout);
          reject(error);
        });

        // 메시지 수신
        this.socket.on('message', (message: any) => {
          const normalized = normalizeMessage(message);
          this.messageCallbacks.forEach(cb => cb(normalized));
        });

        // 타이핑 이벤트
        this.socket.on('user:typing', (data: TypingIndicator) => {
          this.typingCallbacks.forEach(cb => cb(data));
        });

        // 방 입장 확인
        this.socket.on('room:joined', (data: { roomId: string }) => {
          console.log('[ChatSocket] Joined room:', data.roomId);
          this.currentRoomId = data.roomId;
        });

        // 방 퇴장 확인
        this.socket.on('room:left', (data: { roomId: string }) => {
          console.log('[ChatSocket] Left room:', data.roomId);
          if (this.currentRoomId === data.roomId) {
            this.currentRoomId = null;
          }
        });

        // Presence 이벤트 (다른 사용자의 입장/퇴장)
        this.socket.on('presence', (data: { userId: string; state: 'join' | 'leave' }) => {
          console.log('[ChatSocket] Presence update:', data);
        });

        // message:read 이벤트
        this.socket.on('message:read', (data: { roomId: string; userId: string; readAt: string }) => {
          this.readCallbacks.forEach(cb => cb(data));
        });

        // 메시지 삭제 (상대가 지운 경우에도 즉시 자리표시자로 바뀐다)
        this.socket.on('message:deleted', (data: { roomId: string; messageId: string }) => {
          this.deletedCallbacks.forEach(cb => cb(data));
        });

        // 헤더 배지용 미확인 총합. 이 소켓 하나로 방 화면과 배지를 모두 처리해,
        // 방에 들어갈 때 접속이 두 개 열리던 문제를 없앤다.
        this.socket.on('chat:unread-total', (data: { total: number }) => {
          this.unreadTotalCallbacks.forEach(cb => cb(data));
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 소켓 연결 해제
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentRoomId = null;
  }

  /**
   * 연결 상태 확인
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 현재 방 ID 반환
   */
  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  /**
   * 방 입장 (연결 대기 로직 포함)
   * 참고: 백엔드 서버는 join 이벤트에 ACK를 보내지 않음
   */
  public async joinRoom(roomId: string): Promise<void> {
    // 연결이 완료될 때까지 최대 5초 대기
    const maxWaitTime = 5000;
    const checkInterval = 100;
    let waitedTime = 0;

    while (!this.socket?.connected && waitedTime < maxWaitTime) {
      console.log('[ChatSocket] Waiting for connection before joining room...');
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitedTime += checkInterval;
    }

    if (!this.socket?.connected) {
      throw new Error('Socket not connected after waiting');
    }

    console.log('[ChatSocket] Joining room:', roomId);

    // ACK 없이 바로 emit하고 완료 처리
    this.socket!.emit('join', { roomId });
    this.currentRoomId = roomId;
    console.log('[ChatSocket] ✅ Successfully joined room:', roomId);
  }

  /**
   * 방 퇴장
   * 참고: 백엔드 서버는 leave 이벤트에 ACK를 보내지 않음
   */
  public async leaveRoom(roomId: string): Promise<void> {
    if (!this.socket?.connected) {
      return;
    }

    console.log('[ChatSocket] Leaving room:', roomId);
    this.socket!.emit('leave', { roomId });

    if (this.currentRoomId === roomId) {
      this.currentRoomId = null;
    }

    console.log('[ChatSocket] ✅ Successfully left room:', roomId);
  }

  /**
   * 메시지 전송 (ack 대기)
   *
   * clientMessageId를 호출자가 넘길 수 있게 열어둔 이유:
   * 서버 멱등성 키가 {senderId, clientMessageId}라서, 재전송이 같은 키를
   * 재사용해야 "이미 도착했는데 ack만 못 받은" 경우에 중복 저장을 막는다.
   */
  private emitMessage(payload: Record<string, unknown>): Promise<Message> {
    if (!this.socket?.connected) {
      return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
      this.socket!
        .timeout(ACK_TIMEOUT_MS)
        .emit('message', payload, (timeoutError: Error | null, response: any) => {
          if (timeoutError) {
            reject(new Error('서버 응답이 없습니다. 다시 시도해주세요.'));
            return;
          }
          if (response?.error) {
            reject(new Error(response.error));
            return;
          }
          if (response?.message) {
            resolve(normalizeMessage(response.message));
            return;
          }
          reject(new Error('Invalid response from server'));
        });
    });
  }

  public async sendMessage(
    roomId: string,
    text: string,
    clientMessageId: string = `${Date.now()}-${Math.random()}`
  ): Promise<Message> {
    return this.emitMessage({ roomId, text, clientMessageId });
  }

  /**
   * 이미지 메시지 전송
   */
  public async sendImageMessage(
    roomId: string,
    fileUrl: string,
    clientMessageId: string = `${Date.now()}-${Math.random()}`
  ): Promise<Message> {
    return this.emitMessage({
      roomId,
      fileUrl,
      messageType: 'image',
      clientMessageId,
    });
  }

  /**
   * 타이핑 상태 전송
   */
  public sendTyping(roomId: string, isTyping: boolean): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('typing', { roomId, isTyping });
  }

  // ===== 이벤트 구독 메서드 =====

  /**
   * 메시지 수신 이벤트 구독
   */
  public onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  /**
   * 타이핑 이벤트 구독
   */
  public onTyping(callback: TypingCallback): () => void {
    this.typingCallbacks.add(callback);
    return () => this.typingCallbacks.delete(callback);
  }

  /**
   * 연결 이벤트 구독
   */
  public onConnect(callback: ConnectionCallback): () => void {
    this.connectCallbacks.add(callback);
    return () => this.connectCallbacks.delete(callback);
  }

  /**
   * 연결 해제 이벤트 구독
   */
  public onDisconnect(callback: ConnectionCallback): () => void {
    this.disconnectCallbacks.add(callback);
    return () => this.disconnectCallbacks.delete(callback);
  }

  /**
   * 에러 이벤트 구독
   */
  public onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * 읽음 이벤트 구독
   */
  public onMessageRead(callback: ReadCallback): () => void {
    this.readCallbacks.add(callback);
    return () => this.readCallbacks.delete(callback);
  }

  /**
   * 미확인 총합 이벤트 구독 (헤더 배지)
   */
  public onUnreadTotal(callback: UnreadTotalCallback): () => void {
    this.unreadTotalCallbacks.add(callback);
    return () => this.unreadTotalCallbacks.delete(callback);
  }

  /**
   * 메시지 삭제 이벤트 구독
   */
  public onMessageDeleted(callback: DeletedCallback): () => void {
    this.deletedCallbacks.add(callback);
    return () => this.deletedCallbacks.delete(callback);
  }

  /**
   * 읽음 처리 전송
   */
  public emitMarkAsRead(roomId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('message:read', { roomId });
  }

  /**
   * 모든 리스너 정리
   */
  public cleanup(): void {
    this.messageCallbacks.clear();
    this.typingCallbacks.clear();
    this.connectCallbacks.clear();
    this.disconnectCallbacks.clear();
    this.errorCallbacks.clear();
    this.readCallbacks.clear();
    this.unreadTotalCallbacks.clear();
    this.deletedCallbacks.clear();
  }
}

// Export singleton instance getter
export const getChatSocket = () => ChatSocketService.getInstance();
