import { ApiError, withRetry, parseApiError, safeJsonParse, isTokenExpired } from '../../utils/apiHelpers';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: string;
  headers?: Record<string, string>;
  enableRetry?: boolean;
  timeout?: number;
}

export abstract class BaseApiService {
  protected baseURL: string;
  protected timeout: number;
  protected getAuthHeaders: () => Promise<Record<string, string>>;

  constructor(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>) {
    this.baseURL = baseURL;
    this.timeout = 15000;
    this.getAuthHeaders = getAuthHeaders;
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
      timeout = this.timeout
    } = options;

    const makeRequest = async (): Promise<T> => {
      const url = `${this.baseURL}${endpoint}`;
      const authHeaders = await this.getAuthHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method,
          body,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...headers,
          },
        });

        clearTimeout(timeoutId);
        return await this.handleResponse<T>(response);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408, 'TIMEOUT');
        }
        throw error;
      }
    };

    if (enableRetry) {
      return withRetry(makeRequest, {
        retryCondition: (error) => {
          if (error instanceof ApiError && error.status) {
            if (error.status >= 400 && error.status < 500) {
              return error.status === 408 || error.status === 429;
            }
          }
          return true;
        },
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
}