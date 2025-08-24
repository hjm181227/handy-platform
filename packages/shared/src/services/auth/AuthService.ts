import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  AuthResponse, 
  User, 
  LoginForm, 
  RegisterForm,
  LinkedAccountsResponse 
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseAuthService extends BaseApiService {
  // 기본 인증 메서드
  async login(credentials: LoginForm): Promise<AuthResponse> {
    return this.request<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
      enableRetry: false,
    });
  }

  async register(userData: RegisterForm): Promise<AuthResponse> {
    return this.request<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
      enableRetry: false,
    });
  }

  async getUserProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request<ApiResponse<{ user: User }>>(API_ENDPOINTS.AUTH.PROFILE);
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return this.request<ApiResponse<{ user: User }>>(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
  }

  // OAuth 메서드
  async oauthLogin(provider: 'kakao' | 'google' | 'apple' | 'naver', accessToken: string): Promise<AuthResponse> {
    const endpoint = API_ENDPOINTS.OAUTH[provider.toUpperCase() as keyof typeof API_ENDPOINTS.OAUTH] as string;
    return this.request<AuthResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
      enableRetry: false,
    });
  }

  async linkOAuthAccount(provider: string, accessToken: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.OAUTH.LINK(provider), {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });
  }

  async unlinkOAuthAccount(provider: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.OAUTH.UNLINK(provider), {
      method: 'DELETE',
    });
  }

  async getLinkedAccounts(): Promise<LinkedAccountsResponse> {
    return this.request<LinkedAccountsResponse>(API_ENDPOINTS.OAUTH.LINKED);
  }

  // 위시리스트 메서드
  async addToWishlist(productId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.AUTH.WISHLIST_ADD(productId), {
      method: 'POST',
    });
  }

  async removeFromWishlist(productId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.AUTH.WISHLIST_REMOVE(productId), {
      method: 'DELETE',
    });
  }

  // 추상 메서드 - 각 플랫폼에서 구현해야 함
  abstract setAuthToken(token: string, user?: User): Promise<void>;
  abstract clearAuthToken(): Promise<void>;
  abstract getAuthToken(): Promise<string | null>;
  abstract isAuthenticated(): Promise<boolean>;
  abstract getCurrentUser(): Promise<User | null>;
}

export class AuthServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseAuthService {
    return new (class extends BaseAuthService {
      async setAuthToken(token: string, user?: User): Promise<void> {
        // 플랫폼별 구현 필요
        throw new Error('setAuthToken method must be implemented');
      }
      
      async clearAuthToken(): Promise<void> {
        // 플랫폼별 구현 필요
        throw new Error('clearAuthToken method must be implemented');
      }
      
      async getAuthToken(): Promise<string | null> {
        // 플랫폼별 구현 필요
        throw new Error('getAuthToken method must be implemented');
      }
      
      async isAuthenticated(): Promise<boolean> {
        const token = await this.getAuthToken();
        return !!token;
      }
      
      async getCurrentUser(): Promise<User | null> {
        // 플랫폼별 구현 필요
        throw new Error('getCurrentUser method must be implemented');
      }
    })(baseURL, getAuthHeaders);
  }
}