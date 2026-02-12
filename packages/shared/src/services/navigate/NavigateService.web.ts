/**
 * NavigateService for Web builds
 *
 * 웹 환경에서의 네비게이션 처리
 * - 일반 웹 브라우저: 앱 다운로드 안내
 * - WebView 환경: React Native로 메시지 전송
 */

import { INavigateService } from './types';

class NavigateServiceWeb implements INavigateService {
  /**
   * WebView 환경인지 확인
   */
  private isWebViewEnvironment(): boolean {
    return !!(window as any).ReactNativeWebView;
  }

  /**
   * WebView에 메시지 전송
   */
  private sendMessageToWebView(message: { type: string; data?: any }): void {
    if (this.isWebViewEnvironment()) {
      // 네이티브 메서드를 직접 호출하여 this 컨텍스트 유지
      // 변수에 저장하면 this 바인딩이 손실되므로 직접 호출
      (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
      console.log('[NavigateService.web] Message sent to WebView:', message);
    } else {
      console.warn('[NavigateService.web] Not in WebView environment');
    }
  }

  /**
   * 손톱 사이즈 측정 화면으로 이동
   *
   * - WebView: 네이티브 측정 화면으로 전환
   * - 일반 브라우저: 앱 다운로드 안내
   */
  goToMeasureSize(): void {
    console.log('[NavigateService.web] goToMeasureSize called');

    if (this.isWebViewEnvironment()) {
      // WebView → Native 메시지 전송
      this.sendMessageToWebView({
        type: 'NAVIGATE_TO_MEASUREMENT',
        data: { screen: 'NailMeasurement' }
      });
    } else {
      // 일반 웹 브라우저 → 앱 다운로드 안내
      const shouldDownload = window.confirm(
        '손톱 사이즈 측정은 모바일 앱에서만 사용할 수 있습니다.\n' +
        'HANDY 앱을 다운로드하시겠습니까?'
      );

      if (shouldDownload) {
        window.open('https://play.google.com/store/apps/details?id=com.handyapp', '_blank');
      }
    }
  }

  /**
   * 저장된 손톱 사이즈 목록 화면으로 이동
   *
   * - WebView: 네이티브 사이즈 목록 화면으로 전환
   * - 일반 브라우저: 앱 다운로드 안내
   */
  goToNailSizes(): void {
    console.log('[NavigateService.web] goToNailSizes called');

    if (this.isWebViewEnvironment()) {
      // WebView → Native 메시지 전송
      this.sendMessageToWebView({
        type: 'NAVIGATE_TO_SIZES',
        data: { screen: 'NailSizes' }
      });
    } else {
      // 일반 웹 브라우저 → 앱 다운로드 안내
      const shouldDownload = window.confirm(
        '손톱 사이즈 관리는 모바일 앱에서만 사용할 수 있습니다.\n' +
        'HANDY 앱을 다운로드하시겠습니까?'
      );

      if (shouldDownload) {
        window.open('https://play.google.com/store/apps/details?id=com.handyapp', '_blank');
      }
    }
  }

  /**
   * 웹 페이지 내 네비게이션 (라우팅)
   * @param path 이동할 경로 (예: '/products', '/cart')
   */
  goToWebPage(path: string): void {
    console.log('[NavigateService.web] goToWebPage:', path);
    window.location.href = path;
  }
}

// 싱글톤 인스턴스 생성
const navigateService = new NavigateServiceWeb();

// 디폴트 export
export default navigateService;

// Named export
export { navigateService, NavigateServiceWeb };
export type { INavigateService };
