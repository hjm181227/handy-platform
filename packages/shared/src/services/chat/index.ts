/**
 * Chat Service
 * 채팅 기능 관련 모듈 통합 export
 * 플랫폼별 구현을 자동으로 선택 (.native.ts, .web.ts)
 */

// Types (공통)
export type {
  Message,
  ChatRoom,
  User,
  TypingIndicator,
  SocketEvents,
  ChatServiceConfig,
  MessageCallback,
  TypingCallback,
  ConnectionCallback,
  ErrorCallback,
} from './types';

// Base Service
export { BaseChatService } from './BaseChatService';

// Platform-specific services
// 플랫폼별 파일명 (.native.ts, .web.ts)을 사용하여 자동으로 선택됨
export { ChatServiceWeb, getChatServiceWeb } from './ChatService.web';
export { ChatServiceNative, getChatServiceNative } from './ChatService.native';

// 플랫폼 감지하여 적절한 서비스 반환
import { getChatServiceWeb as getWebService } from './ChatService.web';
import { getChatServiceNative as getNativeService } from './ChatService.native';

export const getChatService = (): any => {
  // 환경 감지: React Native vs Web
  const isReactNative =
    typeof navigator !== 'undefined' &&
    navigator.product === 'ReactNative';

  if (isReactNative) {
    // React Native 환경
    return getNativeService();
  } else {
    // Web 환경
    return getWebService();
  }
};
