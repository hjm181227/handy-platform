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
import { validateResponseId, normalizeUserId } from '../../utils/uuidUtils';

// 소셜 사용자 정보 타입
export interface SocialUserInfo {
  provider: 'kakao' | 'google' | 'apple' | 'naver';
  providerId: string;
  email: string;
  name: string;
  profileImage?: string;
}

// OAuth 로그인 응답 타입 (기존 사용자 vs 신규 가입 필요)
export interface OAuthLoginResponse {
  success: boolean;
  // 기존 사용자 로그인 성공 시
  token?: string;
  user?: User;
  isNewUser?: false;
  // 신규 사용자 - 약관 동의 후 회원가입 필요
  needsSignup?: boolean;
  socialUserInfo?: SocialUserInfo;
}

// 휴대폰 인증 관련 타입
export interface PhoneSendResponse {
  success: boolean;
  data: {
    verificationId: string;
    expiresAt: string;
    message: string;
  };
}

export interface PhoneVerifyResponse {
  success: boolean;
  data: {
    verificationId: string;
    phone: string;
    verifiedAt: string;
    purpose: string;
    message: string;
  };
}

export interface PhoneStatusResponse {
  success: boolean;
  data: {
    verificationId: string;
    status: 'pending' | 'verified' | 'expired' | 'failed';
    expiresAt: string;
    verifiedAt?: string;
    remainingAttempts: number;
  };
}

export abstract class BaseAuthService extends BaseApiService {
  // 기본 인증 메서드
  async login(credentials: LoginForm): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
      enableRetry: false,
      skipTokenExpiredHandler: true, // 로그인 API는 401 에러 시 토큰 만료 처리 스킵
    });

    // Validate UUID format in login response during migration period
    if (response.user) {
      try {
        validateResponseId(response.user, 'User');
      } catch (error) {
        console.warn(`UUID Migration Warning - Login user validation:`, error);
      }
    }

    return response;
  }

  async register(userData: RegisterForm): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
      enableRetry: false,
      skipTokenExpiredHandler: true, // 회원가입 API는 401 에러 시 토큰 만료 처리 스킵
    });

    // Validate UUID format in register response during migration period
    if (response.user) {
      try {
        validateResponseId(response.user, 'User');
      } catch (error) {
        console.warn(`UUID Migration Warning - Register user validation:`, error);
      }
    }

    return response;
  }

  // 휴대폰 인증 메서드
  async sendPhoneVerification(
    phone: string,
    purpose: 'registration' | 'update' | 'recovery' = 'registration'
  ): Promise<PhoneSendResponse> {
    return this.request<PhoneSendResponse>(API_ENDPOINTS.PHONE.SEND, {
      method: 'POST',
      body: JSON.stringify({ phone, purpose }),
      enableRetry: false,
    });
  }

  async verifyPhoneCode(verificationId: string, code: string): Promise<PhoneVerifyResponse> {
    return this.request<PhoneVerifyResponse>(API_ENDPOINTS.PHONE.VERIFY, {
      method: 'POST',
      body: JSON.stringify({ verificationId, code }),
      enableRetry: false,
    });
  }

  async getPhoneVerificationStatus(verificationId: string): Promise<PhoneStatusResponse> {
    return this.request<PhoneStatusResponse>(API_ENDPOINTS.PHONE.STATUS(verificationId));
  }

  async getUserProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.request<ApiResponse<{ user: User }>>(API_ENDPOINTS.AUTH.PROFILE);

    // Validate UUID format in profile response during migration period
    if (response.data?.user) {
      try {
        validateResponseId(response.data.user, 'User Profile');
      } catch (error) {
        console.warn(`UUID Migration Warning - Profile user validation:`, error);
      }
    }

    return response;
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
  async oauthLogin(provider: 'kakao' | 'google' | 'apple' | 'naver', accessToken: string): Promise<OAuthLoginResponse> {
    const endpoint = API_ENDPOINTS.OAUTH[provider.toUpperCase() as keyof typeof API_ENDPOINTS.OAUTH] as string;
    return this.request<OAuthLoginResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
      enableRetry: false,
      skipTokenExpiredHandler: true, // OAuth 로그인 API는 401 에러 시 토큰 만료 처리 스킵
    });
  }

  /**
   * 네이버 OAuth 인증 데이터 조회 (일회용)
   * stateId로 저장된 인증 데이터를 조회합니다.
   * 데이터는 일회용으로, 조회 후 즉시 삭제됩니다.
   */
  async getNaverAuthData(stateId: string): Promise<{
    success: boolean;
    needsSignup: boolean;
    token?: string;
    user?: User;
    socialUserInfo?: SocialUserInfo;
  }> {
    return this.request(API_ENDPOINTS.OAUTH.NAVER_AUTH_DATA(stateId), {
      enableRetry: false,
    });
  }

  /**
   * 카카오 OAuth 인증 데이터 조회 (일회용)
   * stateId로 저장된 인증 데이터를 조회합니다.
   * 데이터는 일회용으로, 조회 후 즉시 삭제됩니다.
   */
  async getKakaoAuthData(stateId: string): Promise<{
    success: boolean;
    needsSignup: boolean;
    token?: string;
    user?: User;
    socialUserInfo?: SocialUserInfo;
  }> {
    return this.request(API_ENDPOINTS.OAUTH.KAKAO_AUTH_DATA(stateId), {
      enableRetry: false,
    });
  }

  /**
   * Google OAuth 인증 데이터 조회 (일회용)
   * stateId로 저장된 인증 데이터를 조회합니다.
   * 데이터는 일회용으로, 조회 후 즉시 삭제됩니다.
   */
  async getGoogleAuthData(stateId: string): Promise<{
    success: boolean;
    needsSignup: boolean;
    token?: string;
    user?: User;
    socialUserInfo?: SocialUserInfo;
  }> {
    return this.request(API_ENDPOINTS.OAUTH.GOOGLE_AUTH_DATA(stateId), {
      enableRetry: false,
    });
  }

  /**
   * 소셜 회원가입 완료 (약관 동의 후 계정 생성)
   */
  async completeSocialSignup(data: {
    socialUserInfo: {
      provider: 'kakao' | 'google' | 'apple' | 'naver';
      providerId: string;
      email: string;
      name: string;
      profileImage?: string;
    };
    marketingConsent: boolean;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>(API_ENDPOINTS.OAUTH.COMPLETE_SIGNUP, {
      method: 'POST',
      body: JSON.stringify(data),
      enableRetry: false,
    });
  }

  async signupWithOauth(provider: 'kakao' | 'google' | 'apple' | 'naver', data: {
    kakaoUserInfo: {
      id: string;
      email: string;
      name: string;
      profileImage?: string;
    };
    additionalInfo?: {
      phone?: string;
    };
  }): Promise<AuthResponse> {
    const endpoint = API_ENDPOINTS.OAUTH.SIGNUP(provider);
    return this.request<AuthResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
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

  // 배송지 관리 메서드
  async getAddresses(): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(API_ENDPOINTS.USER_MANAGEMENT.ADDRESSES);
  }

  async addAddress(address: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.USER_MANAGEMENT.ADDRESS_CREATE, {
      method: 'POST',
      body: JSON.stringify(address),
    });
  }

  async updateAddress(addressId: string, updates: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.USER_MANAGEMENT.ADDRESS_UPDATE(addressId), {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAddress(addressId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.USER_MANAGEMENT.ADDRESS_DELETE(addressId), {
      method: 'DELETE',
    });
  }

  async setDefaultAddress(addressId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.USER_MANAGEMENT.ADDRESS_DEFAULT(addressId), {
      method: 'PUT',
    });
  }

  // 약관 동의 업데이트
  async updateTermsAgreement(terms: {
    serviceTerms: boolean;
    privacyPolicy: boolean;
    marketingConsent: boolean;
    ageVerification: boolean;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.AUTH.UPDATE_TERMS, {
      method: 'PUT',
      body: JSON.stringify(terms),
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
  static create(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>,
    onTokenExpired?: () => void
  ): BaseAuthService {
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
    })(baseURL, getAuthHeaders, onTokenExpired);
  }
}