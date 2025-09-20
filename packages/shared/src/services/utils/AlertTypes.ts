// AlertService 관련 타입 정의

export type AlertType = 'alert' | 'confirm' | 'error' | 'prompt';

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

export interface AlertState {
  id: string;
  type: AlertType;
  message: string;
  options: BaseAlertOptions;
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
  dismiss(id?: string): void;
  dismissAll(): void;
  resetRetryCounter(error: Error | string): void;
}