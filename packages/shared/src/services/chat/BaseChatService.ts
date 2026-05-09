/**
 * BaseChatService
 * 채팅 서비스의 추상 베이스 클래스
 * 플랫폼별 구현 (web, native)은 이 클래스를 상속받아 구현
 */

import type {
  Message,
  ChatServiceConfig,
  MessageCallback,
  TypingCallback,
  ConnectionCallback,
  ErrorCallback,
} from './types';

export type UnreadTotalCallback = (data: { total: number }) => void;

export abstract class BaseChatService {
  protected currentRoomId: string | null = null;
  protected messageCallbacks: Set<MessageCallback> = new Set();
  protected typingCallbacks: Set<TypingCallback> = new Set();
  protected connectCallbacks: Set<ConnectionCallback> = new Set();
  protected disconnectCallbacks: Set<ConnectionCallback> = new Set();
  protected errorCallbacks: Set<ErrorCallback> = new Set();
  protected unreadTotalCallbacks: Set<UnreadTotalCallback> = new Set();

  /**
   * 소켓 연결
   */
  abstract connect(config?: ChatServiceConfig): Promise<void>;

  /**
   * 소켓 연결 해제
   */
  abstract disconnect(): void;

  /**
   * 연결 상태 확인
   */
  abstract isConnected(): boolean;

  /**
   * 방 입장
   */
  abstract joinRoom(roomId: string): Promise<void>;

  /**
   * 방 퇴장
   */
  abstract leaveRoom(roomId: string): Promise<void>;

  /**
   * 메시지 전송
   */
  abstract sendMessage(roomId: string, text: string): Promise<Message>;

  /**
   * 타이핑 상태 전송
   */
  abstract sendTyping(roomId: string, isTyping: boolean): void;

  /**
   * 현재 방 ID 반환
   */
  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

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
   * 미확인 메시지 총합 이벤트 구독 (서버 'chat:unread-total' emit 수신)
   * - 메시지 수신 / 읽음 처리 시 서버가 fresh total을 broadcast
   * - 헤더 배지 실시간 업데이트용
   */
  public onUnreadTotal(callback: UnreadTotalCallback): () => void {
    this.unreadTotalCallbacks.add(callback);
    return () => this.unreadTotalCallbacks.delete(callback);
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
    this.unreadTotalCallbacks.clear();
  }

  /**
   * 채팅 기능 활성화 여부 (플랫폼별 오버라이드 가능)
   */
  public isChatEnabled(): boolean {
    return true;
  }
}
