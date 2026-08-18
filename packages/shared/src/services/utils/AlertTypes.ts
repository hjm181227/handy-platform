// AlertService 관련 타입 정의

export type AlertType = 'alert' | 'confirm' | 'error' | 'prompt' | 'toast';

export type AlertVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface BaseAlertOptions {
  title?: string;
  variant?: AlertVariant;
  icon?: string;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  autoClose?: number; // milliseconds
}

export interface AlertOptions extends BaseAlertOptions {
  confirmLabel?: string;
}

export interface ConfirmOptions extends BaseAlertOptions {
  cancelLabel?: string;
  confirmLabel?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

export interface ErrorOptions extends BaseAlertOptions {
  details?: string;
  showDetails?: boolean;
  showRetry?: boolean;
  retryLabel?: string;
  technical?: string; // 기술적 오류 정보
  maxManualRetries?: number; // 최대 수동 재시도 횟수
  currentRetryCount?: number; // 현재 재시도 횟수
  disableAutoRetry?: boolean; // 자동 재시도 비활성화
}

export interface PromptOptions extends BaseAlertOptions {
  placeholder?: string;
  defaultValue?: string;
  multiline?: boolean;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  validation?: (value: string) => string | null; // 에러 메시지 리턴, null이면 유효
  cancelLabel?: string;
  confirmLabel?: string;
}

export interface ToastOptions extends BaseAlertOptions {
  duration?: number; // milliseconds (default: 3000)
  position?: 'top' | 'bottom' | 'center'; // default: 'bottom'
}

export interface ToastState {
  id: string;
  message: string;
  options: ToastOptions;
}

/**
 * 큐에 적재된 알림이 실제로 가질 수 있는 옵션의 합집합.
 * AlertState.options는 type에 따라 위 5종 중 하나가 들어오므로,
 * 렌더러(AlertModal)가 type을 보고 분기해 읽을 수 있도록 평탄화한 형태로 정의한다.
 */
export interface AlertStateOptions extends BaseAlertOptions {
  // alert / confirm / prompt 공통
  confirmLabel?: string;
  cancelLabel?: string;

  // ErrorOptions
  details?: string;
  showDetails?: boolean;
  showRetry?: boolean;
  retryLabel?: string;
  technical?: string;
  maxManualRetries?: number;
  currentRetryCount?: number;
  disableAutoRetry?: boolean;

  // PromptOptions
  placeholder?: string;
  defaultValue?: string;
  multiline?: boolean;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  validation?: (value: string) => string | null;

  // ToastOptions
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
}

export interface AlertState {
  id: string;
  type: AlertType;
  message: string;
  options: AlertStateOptions;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

export interface AlertResult {
  confirmed: boolean;
  value?: string; // prompt의 경우 입력값
  action?: 'confirm' | 'cancel' | 'retry' | 'close';
  retryCount?: number; // 재시도 횟수
  disableAutoRetry?: boolean; // 자동 재시도 비활성화 요청
}

// 에러 타입 분류를 위한 인터페이스
export interface ProcessedError {
  userMessage: string;
  technicalMessage?: string;
  category: 'network' | 'validation' | 'auth' | 'server' | 'client' | 'unknown';
  recoverable: boolean;
  showRetry: boolean;
}

// AlertService 인터페이스
export interface IAlertService {
  alert(message: string, options?: AlertOptions): Promise<void>;
  confirm(message: string, options?: ConfirmOptions): Promise<boolean>;
  error(error: Error | string, options?: ErrorOptions): Promise<AlertResult>;
  prompt(message: string, options?: PromptOptions): Promise<string | null>;
  toast(message: string, options?: ToastOptions): void;
  dismiss(id?: string): void;
  dismissAll(): void;
  resetRetryCounter(error: Error | string): void;
}