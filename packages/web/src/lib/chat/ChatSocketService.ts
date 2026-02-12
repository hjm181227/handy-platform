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

export class ChatSocketService {
  private static instance: ChatSocketService | null = null;
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private typingCallbacks: Set<TypingCallback> = new Set();
  private connectCallbacks: Set<ConnectionCallback> = new Set();
  private disconnectCallbacks: Set<ConnectionCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();

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

        console.log('[ChatSocket] 🔍 VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
        console.log('[ChatSocket] 🎯 Final serverUrl:', serverUrl);

        const socketOptions: any = {
          reconnection: config?.reconnection !== false,
          reconnectionAttempts: config?.reconnectionAttempts || 5,
          reconnectionDelay: config?.reconnectionDelay || 1000,
          transports: ['websocket', 'polling'],
        };

        // 토큰이 있으면 auth에 추가
        if (config?.token) {
          socketOptions.auth = { token: config.token };
          console.log('[ChatSocket] 🔐 Auth token added (length:', config.token.length, ')');
        }

        console.log('[ChatSocket] 🚀 Connecting to', serverUrl, 'with options:', socketOptions);
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
          console.log('[ChatSocket] ✅ Connected to server successfully!');
          console.log('[ChatSocket] ✅ Socket ID:', this.socket?.id);
          console.log('[ChatSocket] ✅ Transport:', this.socket?.io.engine.transport.name);
          this.connectCallbacks.forEach(cb => cb());
          clearTimeoutAndResolve();
        });

        this.socket.on('disconnect', () => {
          console.log('[ChatSocket] Disconnected from server');
          this.disconnectCallbacks.forEach(cb => cb());
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('[ChatSocket] ❌ Connection error:', error);
          console.error('[ChatSocket] ❌ Error message:', error.message);
          console.error('[ChatSocket] ❌ Error data:', error.data);
          console.error('[ChatSocket] ❌ Error type:', error.type);
          console.error('[ChatSocket] ❌ Error description:', error.description);
          this.errorCallbacks.forEach(cb => cb(error));
          clearTimeout(connectionTimeout);
          reject(error);
        });

        // 메시지 수신
        this.socket.on('message', (message: Message) => {
          console.log('[ChatSocket] Message received:', message);
          this.messageCallbacks.forEach(cb => cb(message));
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
          console.log('[ChatSocket] 👤 Presence update:', data);
          // 필요 시 콜백으로 UI 업데이트 가능
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
   * 메시지 전송
   */
  public async sendMessage(roomId: string, text: string): Promise<Message> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    return new Promise((resolve, reject) => {
      const clientMessageId = `${Date.now()}-${Math.random()}`;

      this.socket!.emit('message', {
        roomId,
        text,
        clientMessageId,
      }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else if (response?.message) {
          resolve(response.message);
        } else {
          reject(new Error('Invalid response from server'));
        }
      });
    });
  }

  /**
   * 이미지 메시지 전송
   */
  public async sendImageMessage(roomId: string, fileUrl: string): Promise<Message> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    return new Promise((resolve, reject) => {
      const clientMessageId = `${Date.now()}-${Math.random()}`;

      this.socket!.emit('message', {
        roomId,
        fileUrl,
        messageType: 'image',
        clientMessageId,
      }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else if (response?.message) {
          resolve(response.message);
        } else {
          reject(new Error('Invalid response from server'));
        }
      });
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
   * 모든 리스너 정리
   */
  public cleanup(): void {
    this.messageCallbacks.clear();
    this.typingCallbacks.clear();
    this.connectCallbacks.clear();
    this.disconnectCallbacks.clear();
    this.errorCallbacks.clear();
  }
}

// Export singleton instance getter
export const getChatSocket = () => ChatSocketService.getInstance();
