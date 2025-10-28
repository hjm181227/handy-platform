/**
 * NavigateService for Native builds (React Native)
 *
 * 모바일 네이티브 환경에서의 네비게이션 처리
 * - WebView 내부: postMessage로 Native 브릿지에 전달
 * - Native 화면: DeviceEventEmitter로 직접 이벤트 발생
 */

import { DeviceEventEmitter } from 'react-native';
import { INavigateService } from './types';

class NavigateServiceNative implements INavigateService {
  /**
   * WebView 환경인지 확인
   * (React Native 내부의 WebView에서 실행 중인지)
   */
  private isWebViewEnvironment(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ReactNativeWebView;
  }

  /**
   * WebView에 메시지 전송
   */
  private sendMessageToWebView(message: { type: string; data?: any }): void {
    if (this.isWebViewEnvironment()) {
      const webview = (window as any).ReactNativeWebView;
      webview.postMessage(JSON.stringify(message));
      console.log('[NavigateService.native] Message sent to WebView:', message);
    }
  }

  /**
   * Native 이벤트 발생
   */
  private emitNativeEvent(eventName: string, data?: any): void {
    DeviceEventEmitter.emit(eventName, data);
    console.log('[NavigateService.native] Event emitted:', eventName, data);
  }

  /**
   * 손톱 사이즈 측정 화면으로 이동
   *
   * - WebView 환경: Native 브릿지에 메시지 전송
   * - Native 화면: 직접 이벤트 발생
   */
  goToMeasureSize(): void {
    console.log('[NavigateService.native] goToMeasureSize called');
    console.log('[NavigateService.native] WebView environment:', this.isWebViewEnvironment());

    if (this.isWebViewEnvironment()) {
      // WebView → Native 브릿지 메시지 전송
      this.sendMessageToWebView({
        type: 'NAVIGATE_TO_MEASUREMENT',
        data: { screen: 'NailMeasurement' }
      });
    } else {
      // Native 화면에서 직접 호출
      this.emitNativeEvent('navigateToMeasurement', {
        screen: 'NailMeasurement'
      });
    }
  }

  /**
   * 저장된 손톱 사이즈 목록 화면으로 이동
   *
   * - WebView 환경: Native 브릿지에 메시지 전송
   * - Native 화면: 직접 이벤트 발생
   */
  goToNailSizes(): void {
    console.log('[NavigateService.native] goToNailSizes called');
    console.log('[NavigateService.native] WebView environment:', this.isWebViewEnvironment());

    if (this.isWebViewEnvironment()) {
      // WebView → Native 브릿지 메시지 전송
      this.sendMessageToWebView({
        type: 'NAVIGATE_TO_SIZES',
        data: { screen: 'NailSizes' }
      });
    } else {
      // Native 화면에서 직접 호출
      this.emitNativeEvent('navigateToSizes', {
        screen: 'NailSizes'
      });
    }
  }

  /**
   * 뒤로가기
   *
   * Native 네비게이션 스택에서 뒤로가기
   */
  goBack(): void {
    console.log('[NavigateService.native] goBack called');
    this.emitNativeEvent('navigateBack');
  }

  /**
   * 웹 페이지로 이동 (WebView URL 변경)
   * @param path 이동할 경로
   */
  goToWebPage(path: string): void {
    console.log('[NavigateService.native] goToWebPage:', path);

    if (this.isWebViewEnvironment()) {
      // WebView 내부에서는 window.location 사용
      window.location.href = path;
    } else {
      // Native에서는 WebView URL 변경 이벤트 발생
      this.emitNativeEvent('navigateToWebPage', { path });
    }
  }
}

// 싱글톤 인스턴스 생성
const navigateService = new NavigateServiceNative();

// 디폴트 export
export default navigateService;

// Named export
export { navigateService, NavigateServiceNative };
export type { INavigateService };
