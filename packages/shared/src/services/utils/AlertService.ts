import {
  IAlertService,
  AlertOptions,
  ConfirmOptions,
  ErrorOptions,
  PromptOptions,
  ToastOptions,
  AlertState,
  AlertResult,
  ProcessedError
} from './AlertTypes';

/**
 * 에러를 사용자 친화적 메시지로 변환하는 함수
 */
export function processError(error: Error | string): ProcessedError {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' ? error.stack : undefined;

  // 네트워크 관련 에러
  if (errorMessage.includes('Network Error') || 
      errorMessage.includes('fetch') || 
      errorMessage.includes('NETWORK_ERROR') ||
      errorMessage.includes('ERR_NETWORK')) {
    return {
      userMessage: '인터넷 연결을 확인해주세요.',
      technicalMessage: errorMessage,
      category: 'network',
      recoverable: true,
      showRetry: true
    };
  }

  // 인증 관련 에러
  if (errorMessage.includes('Unauthorized') || 
      errorMessage.includes('401') ||
      errorMessage.includes('토큰') ||
      errorMessage.includes('로그인')) {
    return {
      userMessage: '로그인이 필요합니다. 다시 로그인해주세요.',
      technicalMessage: errorMessage,
      category: 'auth',
      recoverable: true,
      showRetry: false
    };
  }

  // 권한 관련 에러
  if (errorMessage.includes('Forbidden') || 
      errorMessage.includes('403') ||
      errorMessage.includes('권한')) {
    return {
      userMessage: '접근 권한이 없습니다.',
      technicalMessage: errorMessage,
      category: 'auth',
      recoverable: false,
      showRetry: false
    };
  }

  // 502 Bad Gateway (서비스 점검)
  if (errorMessage.includes('502') ||
      errorMessage.includes('Bad Gateway')) {
    return {
      userMessage: '현재 서비스 점검 중입니다. 잠시 후 이용해주세요.',
      technicalMessage: errorMessage,
      category: 'server',
      recoverable: true,
      showRetry: true
    };
  }

  // 서버 에러
  if (errorMessage.includes('500') ||
      errorMessage.includes('Internal Server Error') ||
      errorMessage.includes('서버')) {
    return {
      userMessage: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      technicalMessage: errorMessage,
      category: 'server',
      recoverable: true,
      showRetry: true
    };
  }

  // 유효성 검사 에러
  if (errorMessage.includes('validation') ||
      errorMessage.includes('유효') ||
      errorMessage.includes('입력') ||
      errorMessage.includes('형식')) {
    return {
      userMessage: errorMessage,
      technicalMessage: errorStack,
      category: 'validation',
      recoverable: true,
      showRetry: false
    };
  }

  // 404 에러
  if (errorMessage.includes('404') || 
      errorMessage.includes('Not Found')) {
    return {
      userMessage: '요청한 정보를 찾을 수 없습니다.',
      technicalMessage: errorMessage,
      category: 'client',
      recoverable: false,
      showRetry: false
    };
  }

  // 기본 처리
  return {
    userMessage: errorMessage || '알 수 없는 오류가 발생했습니다.',
    technicalMessage: errorStack,
    category: 'unknown',
    recoverable: true,
    showRetry: true
  };
}

/**
 * AlertService 핵심 클래스
 * Promise 기반으로 사용자 액션을 대기하고, 큐잉 시스템으로 다중 알림 처리
 */
export class AlertService implements IAlertService {
  private alertQueue: AlertState[] = [];
  private currentAlert: AlertState | null = null;
  private listeners: Set<(alerts: AlertState[]) => void> = new Set();
  private retryCounters: Map<string, number> = new Map(); // 재시도 카운터
  private readonly maxManualRetries = 2; // 최대 수동 재시도 횟수

  /**
   * 상태 변경 알림
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener([
      ...(this.currentAlert ? [this.currentAlert] : []),
      ...this.alertQueue
    ]));
  }

  /**
   * 리스너 등록 (React Context에서 사용)
   */
  public subscribe(listener: (alerts: AlertState[]) => void): () => void {
    this.listeners.add(listener);
    // 현재 상태 즉시 전달
    listener([
      ...(this.currentAlert ? [this.currentAlert] : []),
      ...this.alertQueue
    ]);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 다음 알림 처리
   */
  private processNext() {
    if (this.currentAlert || this.alertQueue.length === 0) {
      return;
    }

    this.currentAlert = this.alertQueue.shift()!;
    this.notifyListeners();
  }

  /**
   * 알림 생성 및 대기
   */
  private createAlert<T>(
    type: AlertState['type'], 
    message: string, 
    options: any = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const alertState: AlertState = {
        id,
        type,
        message,
        options: {
          closeOnBackdrop: true,
          closeOnEsc: true,
          ...options
        },
        resolve,
        reject
      };

      this.alertQueue.push(alertState);
      this.processNext();
    });
  }

  /**
   * 일반 알림
   */
  public async alert(message: string, options: AlertOptions = {}): Promise<void> {
    return this.createAlert<void>('alert', message, {
      confirmLabel: '확인',
      variant: 'default',
      ...options
    });
  }

  /**
   * 확인/취소 모달
   */
  public async confirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
    return this.createAlert<boolean>('confirm', message, {
      cancelLabel: '취소',
      confirmLabel: '확인',
      variant: 'default',
      ...options
    });
  }

  /**
   * 에러 메시지 표시
   */
  public async error(error: Error | string, options: ErrorOptions = {}): Promise<AlertResult> {
    const processedError = processError(error);
    
    // 재시도 키 생성 (에러 메시지 기반)
    const retryKey = typeof error === 'string' ? error : error.message;
    const currentRetryCount = this.retryCounters.get(retryKey) || 0;
    
    // 최대 재시도 횟수 확인
    const canRetry = processedError.showRetry && currentRetryCount < this.maxManualRetries;
    
    const errorOptions: ErrorOptions = {
      variant: 'danger',
      showRetry: canRetry,
      retryLabel: canRetry ? 
        `다시 시도 (${currentRetryCount + 1}/${this.maxManualRetries})` : 
        '다시 시도 불가',
      details: processedError.technicalMessage,
      showDetails: !!processedError.technicalMessage,
      maxManualRetries: this.maxManualRetries,
      currentRetryCount,
      disableAutoRetry: currentRetryCount > 0, // 재시도 시 자동 재시도 비활성화
      ...options
    };

    const result = await this.createAlert<AlertResult>('error', processedError.userMessage, errorOptions);
    
    // 재시도 선택 시 카운터 증가
    if (result.action === 'retry' && canRetry) {
      this.retryCounters.set(retryKey, currentRetryCount + 1);
      result.retryCount = currentRetryCount + 1;
      result.disableAutoRetry = true; // 수동 재시도 시 자동 재시도 비활성화
    }
    
    // 성공하면 카운터 리셋 (외부에서 resetRetryCounter 호출해야 함)
    
    return result;
  }

  /**
   * 재시도 카운터 리셋 (성공 시 호출)
   */
  public resetRetryCounter(error: Error | string): void {
    const retryKey = typeof error === 'string' ? error : error.message;
    this.retryCounters.delete(retryKey);
  }

  /**
   * 텍스트 입력 모달
   */
  public async prompt(message: string, options: PromptOptions = {}): Promise<string | null> {
    return this.createAlert<string | null>('prompt', message, {
      cancelLabel: '취소',
      confirmLabel: '확인',
      placeholder: '',
      required: false,
      multiline: false,
      maxLength: 500,
      ...options
    });
  }

  /**
   * 토스트 메시지 (논블로킹, 자동 사라짐)
   * 환경에 따라 다르게 동작:
   * - React Native: ToastAndroid (Android) 사용
   * - Web: autoClose 옵션을 가진 alert 사용
   */
  public toast(message: string, options: ToastOptions = {}): void {
    const duration = options.duration || 3000;
    const variant = options.variant || 'default';

    // React Native 환경 감지
    const isReactNative = typeof window === 'undefined' || (typeof navigator !== 'undefined' && navigator.product === 'ReactNative');

    if (isReactNative) {
      // React Native 환경: ToastAndroid 사용
      try {
        // React Native에서만 동적으로 import
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ToastAndroid, Platform } = require('react-native');

        if (Platform.OS === 'android') {
          // Android: ToastAndroid 사용
          const toastDuration = duration > 2000 ? ToastAndroid.LONG : ToastAndroid.SHORT;
          ToastAndroid.show(message, toastDuration);
        } else {
          // iOS: Alert 사용 (간단한 알림)
          const { Alert } = require('react-native');
          Alert.alert('알림', message);
        }
      } catch (error) {
        console.warn('Toast display failed in React Native:', error);
        // Fallback: 콘솔에만 출력
        console.log('[Toast]', message);
      }
    } else {
      // Web 환경: 기존 alert 시스템 활용하여 자동으로 닫히는 알림 생성
      this.createAlert<void>('toast', message, {
        variant,
        autoClose: duration,
        closeOnBackdrop: true,
        closeOnEsc: true,
        ...options
      }).catch(() => {
        // 토스트는 비동기적으로 처리되므로 에러 무시
      });
    }
  }

  /**
   * 특정 알림 제거
   */
  public dismiss(id?: string): void {
    if (!id && this.currentAlert) {
      // 현재 표시중인 알림을 취소로 처리
      this.currentAlert.resolve(false);
      this.currentAlert = null;
      this.processNext();
      this.notifyListeners();
    } else if (id) {
      // 특정 ID의 알림 제거
      if (this.currentAlert?.id === id) {
        this.currentAlert.resolve(false);
        this.currentAlert = null;
        this.processNext();
      } else {
        const index = this.alertQueue.findIndex(alert => alert.id === id);
        if (index !== -1) {
          const alert = this.alertQueue.splice(index, 1)[0];
          alert.resolve(false);
        }
      }
      this.notifyListeners();
    }
  }

  /**
   * 모든 알림 제거
   */
  public dismissAll(): void {
    // 현재 알림 취소
    if (this.currentAlert) {
      this.currentAlert.resolve(false);
      this.currentAlert = null;
    }

    // 대기 중인 모든 알림 취소
    this.alertQueue.forEach(alert => alert.resolve(false));
    this.alertQueue = [];

    this.notifyListeners();
  }

  /**
   * 알림 응답 처리 (UI 컴포넌트에서 호출)
   */
  public resolveAlert(id: string, result: any): void {
    if (this.currentAlert?.id === id) {
      this.currentAlert.resolve(result);
      this.currentAlert = null;
      this.processNext();
      this.notifyListeners();
    }
  }

  /**
   * 알림 거부 처리 (UI 컴포넌트에서 호출)
   */
  public rejectAlert(id: string, reason?: any): void {
    if (this.currentAlert?.id === id) {
      this.currentAlert.reject(reason);
      this.currentAlert = null;
      this.processNext();
      this.notifyListeners();
    }
  }
}

// 싱글톤 인스턴스
export const alertService = new AlertService();