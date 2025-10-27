/**
 * NavigateService Types
 *
 * 네비게이션 서비스의 공통 인터페이스 및 타입 정의
 */

/**
 * 네비게이션 서비스 인터페이스
 *
 * 플랫폼별 구현체(.web.ts, .native.ts)가 이 인터페이스를 구현합니다.
 */
export interface INavigateService {
  /**
   * 손톱 사이즈 측정 화면으로 이동
   */
  goToMeasureSize(): void;

  /**
   * 저장된 손톱 사이즈 목록 화면으로 이동
   */
  goToNailSizes(): void;

  /**
   * 웹 페이지 내 네비게이션 (선택적 구현)
   * @param path 이동할 경로
   */
  goToWebPage?(path: string): void;
}

/**
 * 네비게이션 메시지 타입
 *
 * WebView ↔ Native 통신에 사용되는 메시지 타입
 */
export type NavigationMessageType =
  | 'NAVIGATE_TO_MEASUREMENT'  // 손톱 사이즈 측정 화면
  | 'NAVIGATE_TO_SIZES'        // 손톱 사이즈 목록 화면
  | 'NAVIGATE_BACK';           // 뒤로가기

/**
 * 네비게이션 메시지 데이터
 */
export interface NavigationMessageData {
  screen?: string;    // 이동할 화면 이름
  params?: any;       // 화면에 전달할 파라미터
}

/**
 * 네비게이션 메시지
 */
export interface NavigationMessage {
  type: NavigationMessageType;
  data?: NavigationMessageData;
}
