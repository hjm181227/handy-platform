import { AppError } from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition?: (error: Error) => boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryCondition: (error: Error) => {
    return isRetryableError(error);
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config };
  let lastError: Error;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on the last attempt
      if (attempt === finalConfig.maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (!finalConfig.retryCondition!(lastError)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(2, attempt),
        finalConfig.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  throw lastError!;
}

export function parseApiError(response: Response, data?: any): ApiError {
  const message = data?.error || data?.message || `API Error: ${response.status} ${response.statusText}`;
  const details = data?.details || null;
  
  return new ApiError(message, response.status, data?.code, details);
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
      return {
        message: '네트워크 연결을 확인해주세요.',
        code: 'NETWORK_ERROR',
      };
    }

    // Timeout errors
    if (error.message.includes('timeout') || error.name === 'AbortError') {
      return {
        message: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
        code: 'TIMEOUT_ERROR',
      };
    }

    // JSON parse errors
    if (error.message.includes('JSON') || error.message.includes('parse')) {
      return {
        message: '서버 응답을 처리할 수 없습니다.',
        code: 'PARSE_ERROR',
      };
    }

    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  return {
    message: '알 수 없는 오류가 발생했습니다.',
    code: 'UNKNOWN_ERROR',
  };
}

// 사용자 친화적 에러 메시지 생성
export function getUserFriendlyErrorMessage(error: unknown): string {
  const appError = handleApiError(error);
  
  // 상태 코드별 메시지
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return appError.details || '잘못된 요청입니다.';
      case 401:
        return '로그인이 필요합니다.';
      case 403:
        return '권한이 없습니다.';
      case 404:
        return '요청한 데이터를 찾을 수 없습니다.';
      case 409:
        return '이미 존재하는 데이터입니다.';
      case 422:
        return '입력 데이터를 확인해주세요.';
      case 429:
        return '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case 502:
      case 503:
      case 504:
        return '서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.';
      default:
        return appError.message;
    }
  }
  
  return appError.message;
}

// 재시도 가능한 에러인지 판단
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError && error.status) {
    // 5xx 서버 에러는 재시도
    if (error.status >= 500) return true;
    
    // 408(timeout), 429(rate limit)는 재시도
    if (error.status === 408 || error.status === 429) return true;
    
    // 4xx 클라이언트 에러는 재시도 안함
    if (error.status >= 400 && error.status < 500) return false;
  }
  
  if (error instanceof Error) {
    // 네트워크 에러는 재시도
    if (error.message.includes('fetch') || error.message.includes('NetworkError')) return true;
    
    // 타임아웃 에러는 재시도
    if (error.message.includes('timeout') || error.name === 'AbortError') return true;
  }
  
  // 기타 에러는 재시도
  return true;
}

// 특정 에러에 대한 복구 제안
export function getErrorRecoveryAction(error: unknown): {
  action: 'retry' | 'login' | 'reload' | 'contact_support' | 'none';
  message?: string;
} {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return { 
          action: 'login', 
          message: '다시 로그인해주세요.' 
        };
      case 408:
      case 429:
      case 500:
      case 502:
      case 503:
      case 504:
        return { 
          action: 'retry', 
          message: '잠시 후 다시 시도해주세요.' 
        };
      case 400:
      case 422:
        return { 
          action: 'none', 
          message: '입력 내용을 확인해주세요.' 
        };
      default:
        return { action: 'none' };
    }
  }
  
  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
      return { 
        action: 'retry', 
        message: '네트워크 연결을 확인하고 다시 시도해주세요.' 
      };
    }
    
    if (error.message.includes('timeout')) {
      return { 
        action: 'retry', 
        message: '연결 시간이 초과되었습니다. 다시 시도해주세요.' 
      };
    }
  }
  
  return { 
    action: 'contact_support', 
    message: '문제가 지속되면 고객센터에 문의해주세요.' 
  };
}

export function isTokenExpired(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401 || error.code === 'TOKEN_EXPIRED';
  }
  return false;
}

export async function safeJsonParse(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

// API 응답 처리 헬퍼 함수
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await safeJsonParse(response);
    throw parseApiError(response, errorData);
  }

  const data = await safeJsonParse(response);
  return data;
}