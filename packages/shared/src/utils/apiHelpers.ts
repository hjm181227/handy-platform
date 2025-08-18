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
    if (error instanceof ApiError) {
      // Retry on server errors (5xx) and certain network errors
      return error.status ? error.status >= 500 : true;
    }
    return true;
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
    if (error.message.includes('fetch')) {
      return {
        message: '네트워크 연결을 확인해주세요.',
        code: 'NETWORK_ERROR',
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