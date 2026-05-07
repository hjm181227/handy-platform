/**
 * ChatService (React Native)
 * Socket.IO 연결을 관리하는 React Native용 채팅 서비스 (싱글톤)
 */

import { io, Socket } from 'socket.io-client';
import { BaseChatService } from './BaseChatService';
import type { Message, TypingIndicator, ChatServiceConfig } from './types';
import { API_CONFIG, getCurrentEnvironment } from '../../config/api';

// React Native 모듈 - 이 파일은 React Native 환경에서만 import됨
// 웹 빌드에서는 tree-shaking으로 제거되므로 안전
import { Platform, AppState } from 'react-native';

export class ChatServiceNative extends BaseChatService {
  private static instance: ChatServiceNative | null = null;
  private socket: Socket | null = null;
  private appStateSubscription: any = null;

  private constructor() {
    super();
    this.setupAppStateListener();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): ChatServiceNative {
    if (!ChatServiceNative.instance) {
      ChatServiceNative.instance = new ChatServiceNative();
    }
    return ChatServiceNative.instance;
  }

  /**
   * 앱 상태 리스너 설정 (백그라운드 연결 관리)
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('[ChatService] App became active, reconnecting...');
        this.reconnectIfNeeded();
      } else if (nextAppState === 'background') {
        console.log('[ChatService] App went to background');
        // 백그라운드에서도 연결 유지 (필요시 disconnect 호출)
      }
    });
  }

  /**
   * 필요 시 재연결
   */
  private reconnectIfNeeded(): void {
    if (this.socket && !this.socket.connected) {
      console.log('[ChatService] Attempting to reconnect...');
      this.socket.connect();
    }
  }

  /**
   * 소켓 연결
   */
  public connect(config?: ChatServiceConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 이미 연결되어 있으면 재사용
        if (this.socket?.connected) {
          resolve();
          return;
        }

        // React Native 환경에서 서버 URL 결정
        const chatEnv = getCurrentEnvironment();
        let serverUrl = config?.serverUrl || API_CONFIG[chatEnv]?.chatURL || API_CONFIG.stage.chatURL;

        // Android Emulator는 localhost 대신 10.0.2.2 사용
        if (Platform.OS === 'android' && __DEV__) {
          serverUrl = serverUrl.replace('localhost', '10.0.2.2');
        }

        const socketOptions: any = {
          reconnection: config?.reconnection !== false,
          reconnectionAttempts: config?.reconnectionAttempts || 5,
          reconnectionDelay: config?.reconnectionDelay || 1000,
          transports: ['websocket', 'polling'], // Android에서 polling 이슈 방지
        };

        // 토큰이 있으면 auth에 추가
        if (config?.token) {
          socketOptions.auth = { token: config.token };
        }

        this.socket = io(serverUrl, socketOptions);

        // 연결 이벤트 리스너
        this.socket.on('connect', () => {
          console.log('[ChatService] Connected to server');
          this.connectCallbacks.forEach(cb => cb());
          resolve();
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('[ChatService] Disconnected from server:', reason);
          this.disconnectCallbacks.forEach(cb => cb());
        });

        this.socket.on('connect_error', (error) => {
          console.error('[ChatService] Connection error:', error);
          this.errorCallbacks.forEach(cb => cb(error));
          reject(error);
        });

        // 메시지 수신
        this.socket.on('message', (message: Message) => {
          console.log('[ChatService] Message received:', message);
          this.messageCallbacks.forEach(cb => cb(message));
        });

        // 타이핑 이벤트
        this.socket.on('user:typing', (data: TypingIndicator) => {
          this.typingCallbacks.forEach(cb => cb(data));
        });

        // 방 입장 확인
        this.socket.on('room:joined', (data: { roomId: string }) => {
          console.log('[ChatService] Joined room:', data.roomId);
          this.currentRoomId = data.roomId;
        });

        // 방 퇴장 확인
        this.socket.on('room:left', (data: { roomId: string }) => {
          console.log('[ChatService] Left room:', data.roomId);
          if (this.currentRoomId === data.roomId) {
            this.currentRoomId = null;
          }
        });

        // 미확인 총합 (헤더 배지 실시간 업데이트용)
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

    // AppState 리스너 제거
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
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
   * React Native에서는 항상 활성화
   */
  public isChatEnabled(): boolean {
    return true;
  }
}

// Export singleton instance getter
export const getChatServiceNative = () => ChatServiceNative.getInstance();
