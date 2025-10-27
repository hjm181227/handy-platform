/**
 * NavigateService Entry Point
 *
 * 플랫폼별 빌드 시스템이 자동으로 .web.ts 또는 .native.ts를 선택합니다.
 * - 웹 빌드: NavigateService.web.ts 사용 (Vite가 자동 해석)
 * - 모바일 빌드: NavigateService.native.ts 사용 (Metro가 자동 해석)
 */

// 타입 export
export type {
  INavigateService,
  NavigationMessageType,
  NavigationMessageData,
  NavigationMessage,
} from './types';

// 플랫폼별 구현체 명시적 export
// 번들러(Vite/Metro)가 자동으로 .web.ts 또는 .native.ts를 선택
export { navigateService as default } from './NavigateService.web';
export { navigateService } from './NavigateService.web';
