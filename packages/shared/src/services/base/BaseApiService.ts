import { ApiError, withRetry, parseApiError, safeJsonParse, isTokenExpired, isRetryableError } from '../../utils/apiHelpers';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: string;
  headers?: Record<string, string>;
  enableRetry?: boolean;
  timeout?: number;
  disableAutoRetry?: boolean; // 수동 재시도 시 자동 재시도 비활성화
}

export abstract class BaseApiService {
  protected baseURL: string;
  protected timeout: number;
  protected getAuthHeaders: () => Promise<Record<string, string>>;
  protected onTokenExpired?: () => void;

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
      enableRetry = true,
      timeout = this.timeout,
      disableAutoRetry = false
    } = options;

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

        return await this.handleResponse<T>(response);
      } catch (error) {
        clearTimeout(timeoutId);

        // Log error
        console.error(`🔴 API Error [${method} ${endpoint}]:`, error);

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

  protected async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      const apiError = parseApiError(response, errorData);
      
      if (isTokenExpired(apiError)) {
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