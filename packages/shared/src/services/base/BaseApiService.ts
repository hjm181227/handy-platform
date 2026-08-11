import { ApiError, withRetry, parseApiError, safeJsonParse, isTokenExpired, isRetryableError } from '../../utils/apiHelpers';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: string;
  headers?: Record<string, string>;
  /**
   * 자동 재시도 여부. 생략하면 메서드의 멱등성에 따라 결정된다
   * (GET/HEAD/OPTIONS/PUT/DELETE는 재시도, POST/PATCH는 재시도 안 함).
   * 읽기 목적의 POST처럼 재시도가 안전한 경우에만 true를 명시한다.
   */
  enableRetry?: boolean;
  timeout?: number;
  disableAutoRetry?: boolean; // 수동 재시도 시 자동 재시도 비활성화
  skipTokenExpiredHandler?: boolean; // 로그인 등 공개 API에서 401 에러 시 토큰 만료 처리 스킵
}

/**
 * HTTP 명세상 재시도해도 안전한(멱등) 메서드.
 *
 * POST/PATCH가 제외된 이유: 요청이 서버에 도달해 처리되는 중에 클라이언트 타임아웃
 * (기본 15초)이나 5xx가 발생하면 재시도가 같은 쓰기 작업을 다시 보낸다.
 * 결제 승인/주문 생성에서 이는 중복 결제·중복 주문으로 이어진다.
 */
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);

/**
 * 해당 HTTP 메서드를 자동 재시도해도 안전한지 여부.
 * 웹/모바일의 별도 request 구현도 이 판정을 공유해야 한다.
 */
export function isRetryableMethod(method?: string): boolean {
  return IDEMPOTENT_METHODS.has((method || 'GET').toUpperCase());
}

export abstract class BaseApiService {
  protected baseURL: string;
  protected timeout: number;
  protected getAuthHeaders: () => Promise<Record<string, string>>;
  protected onTokenExpired?: () => void;

  /** 전역 API 에러 콜백 (Sentry 등 에러 모니터링 연동용) */
  static onApiError?: (error: unknown, context: { method: string; endpoint: string; status?: number }) => void;

  constructor(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>,
    onTokenExpired?: () => void
  ) {
    this.baseURL = baseURL;
    this.timeout = 15000;
    this.getAuthHeaders = getAuthHeaders;
    this.onTokenExpired = onTokenExpired;
  }

  protected async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = this.timeout,
      disableAutoRetry = false,
      skipTokenExpiredHandler = false
    } = options;

    // 호출부가 명시하지 않았으면 메서드의 멱등성을 따른다.
    const enableRetry = options.enableRetry ?? isRetryableMethod(method);

    const makeRequest = async (): Promise<T> => {
      const url = `${this.baseURL}${endpoint}`;
      const authHeaders = await this.getAuthHeaders();

      const allHeaders = {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method,
          body,
          signal: controller.signal,
          headers: allHeaders,
        });

        clearTimeout(timeoutId);

        // Log response status
        console.log(`🟢 API Response [${method} ${endpoint}]: ${response.status} ${response.statusText}`);

        return await this.handleResponse<T>(response, skipTokenExpiredHandler);
      } catch (error) {
        clearTimeout(timeoutId);

        // Log error
        console.error(`🔴 API Error [${method} ${endpoint}]:`, error);

        // 에러 모니터링 콜백 호출 (Sentry 등)
        if (BaseApiService.onApiError) {
          const status = error instanceof ApiError ? error.status : undefined;
          BaseApiService.onApiError(error, { method, endpoint, status });
        }

        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408, 'TIMEOUT');
        }
        throw error;
      }
    };

    // disableAutoRetry가 true이면 자동 재시도를 비활성화
    if (enableRetry && !disableAutoRetry) {
      return withRetry(makeRequest, {
        retryCondition: isRetryableError,
      });
    }

    return makeRequest();
  }

  protected async handleResponse<T>(response: Response, skipTokenExpiredHandler: boolean = false): Promise<T> {
    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      const apiError = parseApiError(response, errorData);

      // 5xx 서버 에러 또는 네트워크 에러는 모니터링에 보고
      if (BaseApiService.onApiError && response.status >= 500) {
        BaseApiService.onApiError(apiError, {
          method: 'RESPONSE',
          endpoint: response.url,
          status: response.status,
        });
      }

      // 로그인/회원가입 등 공개 API에서는 토큰 만료 처리를 스킵
      if (!skipTokenExpiredHandler && isTokenExpired(apiError)) {
        await this.handleTokenExpiration();
        throw apiError;
      }

      throw apiError;
    }

    return response.json();
  }

  protected async handleTokenExpiration(): Promise<void> {
    console.log('Token expired, need to re-authenticate');

    // 커스텀 토큰 만료 핸들러 호출
    if (this.onTokenExpired) {
      this.onTokenExpired();
    }
  }

  protected buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    return searchParams.toString();
  }

  private generateCurlCommand(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: string
  ): string {
    let curl = `curl -X ${method} '${url}'`;

    // Add headers
    Object.entries(headers).forEach(([key, value]) => {
      curl += ` \\\n  -H '${key}: ${value}'`;
    });

    // Add body if present
    if (body) {
      // Escape single quotes in body
      const escapedBody = body.replace(/'/g, "'\\''");
      curl += ` \\\n  -d '${escapedBody}'`;
    }

    return curl;
  }
}