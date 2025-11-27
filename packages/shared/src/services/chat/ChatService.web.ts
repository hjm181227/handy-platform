/**
 * ChatService (Web)
 * Socket.IO 연결을 관리하는 웹용 채팅 서비스 (싱글톤)
 */

import { io, Socket } from 'socket.io-client';
import { BaseChatService } from './BaseChatService';
import type { Message, TypingIndicator, ChatServiceConfig } from './types';

export class ChatServiceWeb extends BaseChatService {
  private static instance: ChatServiceWeb | null = null;
  private socket: Socket | null = null;

  private constructor() {
    super();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): ChatServiceWeb {
    if (!ChatServiceWeb.instance) {
      ChatServiceWeb.instance = new ChatServiceWeb();
    }
    return ChatServiceWeb.instance;
  }

  /**
   * 소켓 연결 (환경 변수에서 URL 읽기)
   */
  public connect(config?: ChatServiceConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 이미 연결되어 있으면 재사용
        if (this.socket?.connected) {
          resolve();
          return;
        }

        // 환경 변수는 config에서 받거나 기본값 사용
        const serverUrl = config?.serverUrl || 'http://16.176.147.141';

        const socketOptions: any = {
          reconnection: config?.reconnection !== false,
          reconnectionAttempts: config?.reconnectionAttempts || 5,
          reconnectionDelay: config?.reconnectionDelay || 1000,
          transports: ['websocket', 'polling'],
        };

        // 토큰이 있으면 auth에 추가
        if (config?.token) {
          socketOptions.auth = { token: config.token };
        }

        this.socket = io(serverUrl, socketOptions);

        // 연결 이벤트 리스너
        this.socket.on('connect', () => {
          console.log('[ChatSocket] Connected to server');
          this.connectCallbacks.forEach(cb => cb());
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('[ChatSocket] Disconnected from server');
          this.disconnectCallbacks.forEach(cb => cb());
        });

        this.socket.on('connect_error', (error) => {
          console.error('[ChatSocket] Connection error:', error);
          this.errorCallbacks.forEach(cb => cb(error));
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
   * 방 입장
   */
  public async joinRoom(roomId: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('join', { roomId }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          this.currentRoomId = roomId;
          resolve();
        }
      });
    });
  }

  /**
   * 방 퇴장
   */
  public async leaveRoom(roomId: string): Promise<void> {
    if (!this.socket?.connected) {
      return;
    }

    return new Promise((resolve) => {
      this.socket!.emit('leave', { roomId }, () => {
        if (this.currentRoomId === roomId) {
          this.currentRoomId = null;
        }
        resolve();
      });
    });
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
   * 타이핑 상태 전송
   */
  public sendTyping(roomId: string, isTyping: boolean): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('typing', { roomId, isTyping });
  }

  /**
   * 웹 환경에서는 채팅 비활성화 (WebView에서만 활성화)
   */
  public isChatEnabled(): boolean {
    // WebView 환경 감지
    const isWebView = typeof window !== 'undefined' && !!(window as any).ReactNativeWebView;
    return isWebView;
  }
}

// Export singleton instance getter
export const getChatServiceWeb = () => ChatServiceWeb.getInstance();
