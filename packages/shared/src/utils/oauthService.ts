import { ApiError } from './apiHelpers';
import { AuthResponse, OAuthProvider } from '../types';
import { API_ENDPOINTS } from '../config/api';

export interface OAuthConfig {
  kakao?: {
    clientId: string;
    redirectUri?: string;
  };
  google?: {
    clientId: string;
    redirectUri?: string;
  };
  apple?: {
    clientId: string;
    redirectUri?: string;
  };
  naver?: {
    clientId: string;
    redirectUri?: string;
  };
}

export interface OAuthLoginResult {
  success: boolean;
  authCode?: string;
  error?: string;
  provider: string;
}

export abstract class BaseOAuthService {
  protected config: OAuthConfig;
  protected baseURL: string;
  protected getAuthHeaders: () => Promise<Record<string, string>>;

  constructor(
    config: OAuthConfig, 
    baseURL: string, 
    getAuthHeaders: () => Promise<Record<string, string>>
  ) {
    this.config = config;
    this.baseURL = baseURL;
    this.getAuthHeaders = getAuthHeaders;
  }

  // 서버에 OAuth 로그인 요청
  async loginWithProvider(provider: 'kakao' | 'google' | 'apple' | 'naver', authCode: string): Promise<AuthResponse> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.OAUTH[provider.toUpperCase() as keyof typeof API_ENDPOINTS.OAUTH]}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authCode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `OAuth login failed for ${provider}`,
        response.status,
        errorData.code
      );
    }

    return response.json();
  }

  // 계정 연결
  async linkAccount(provider: string, authCode: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.OAUTH.LINK(provider)}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authCode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `Failed to link ${provider} account`,
        response.status,
        errorData.code
      );
    }
  }

  // 계정 연결 해제
  async unlinkAccount(provider: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.OAUTH.UNLINK(provider)}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `Failed to unlink ${provider} account`,
        response.status,
        errorData.code
      );
    }
  }

  // 연결된 계정 목록 조회
  async getLinkedAccounts(): Promise<OAuthProvider[]> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.OAUTH.LINKED}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to get linked accounts',
        response.status,
        errorData.code
      );
    }

    const data = await response.json();
    return data.linkedAccounts || [];
  }

  // 추상 메서드들 (플랫폼별 구현 필요)
  abstract initializeProvider(provider: 'kakao' | 'google' | 'apple' | 'naver'): Promise<void>;
  abstract loginWithKakao(): Promise<OAuthLoginResult>;
  abstract loginWithGoogle(): Promise<OAuthLoginResult>;
  abstract loginWithApple(): Promise<OAuthLoginResult>;
  abstract loginWithNaver(): Promise<OAuthLoginResult>;
  abstract isProviderAvailable(provider: 'kakao' | 'google' | 'apple' | 'naver'): boolean;
}

// 웹용 OAuth 서비스
export class WebOAuthService extends BaseOAuthService {
  private popupWindow: Window | null = null;

  async initializeProvider(provider: 'kakao' | 'google' | 'apple' | 'naver'): Promise<void> {
    switch (provider) {
      case 'kakao':
        return this.initializeKakao();
      case 'google':
        return this.initializeGoogle();
      case 'apple':
        return this.initializeApple();
      case 'naver':
        return this.initializeNaver();
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async initializeKakao(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
      script.onload = () => {
        if (this.config.kakao?.clientId) {
          (window as any).Kakao.init(this.config.kakao.clientId);
          resolve();
        } else {
          reject(new Error('Kakao client ID not configured'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Kakao SDK'));
      document.head.appendChild(script);
    });
  }

  private async initializeGoogle(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google SDK'));
      document.head.appendChild(script);
    });
  }

  private async initializeApple(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Apple SDK'));
      document.head.appendChild(script);
    });
  }

  private async initializeNaver(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Naver SDK'));
      document.head.appendChild(script);
    });
  }

  async loginWithKakao(): Promise<OAuthLoginResult> {
    if (!this.isProviderAvailable('kakao')) {
      return { success: false, error: 'Kakao SDK not available', provider: 'kakao' };
    }

    return new Promise((resolve) => {
      (window as any).Kakao.Auth.authorize({
        redirectUri: this.config.kakao?.redirectUri || window.location.origin + '/oauth/kakao',
        success: (authCode: string) => {
          resolve({ success: true, authCode, provider: 'kakao' });
        },
        fail: (error: any) => {
          resolve({ success: false, error: error.error_description || 'Kakao login failed', provider: 'kakao' });
        },
      });
    });
  }

  async loginWithGoogle(): Promise<OAuthLoginResult> {
    if (!this.isProviderAvailable('google')) {
      return { success: false, error: 'Google SDK not available', provider: 'google' };
    }

    return new Promise((resolve) => {
      (window as any).google.accounts.oauth2.initCodeClient({
        client_id: this.config.google?.clientId,
        scope: 'email profile',
        ux_mode: 'popup',
        callback: (response: any) => {
          if (response.code) {
            resolve({ success: true, authCode: response.code, provider: 'google' });
          } else {
            resolve({ success: false, error: 'Google login failed', provider: 'google' });
          }
        },
      }).requestCode();
    });
  }

  async loginWithApple(): Promise<OAuthLoginResult> {
    if (!this.isProviderAvailable('apple')) {
      return { success: false, error: 'Apple SDK not available', provider: 'apple' };
    }

    return new Promise((resolve) => {
      (window as any).AppleID.auth.signIn({
        clientId: this.config.apple?.clientId,
        redirectURI: this.config.apple?.redirectUri,
        scope: 'name email',
        responseType: 'code',
        responseMode: 'web_message',
      }).then((response: any) => {
        if (response.authorization && response.authorization.code) {
          resolve({ success: true, authCode: response.authorization.code, provider: 'apple' });
        } else {
          resolve({ success: false, error: 'Apple login failed', provider: 'apple' });
        }
      }).catch((error: any) => {
        resolve({ success: false, error: error.error || 'Apple login failed', provider: 'apple' });
      });
    });
  }

  async loginWithNaver(): Promise<OAuthLoginResult> {
    if (!this.isProviderAvailable('naver')) {
      return { success: false, error: 'Naver SDK not available', provider: 'naver' };
    }

    const naverLogin = new (window as any).naver.LoginWithNaverId({
      clientId: this.config.naver?.clientId,
      callbackUrl: this.config.naver?.redirectUri || window.location.origin + '/oauth/naver',
      isPopup: true,
    });

    return new Promise((resolve) => {
      naverLogin.init();
      naverLogin.getLoginStatus((status: boolean) => {
        if (status) {
          const accessToken = naverLogin.accessToken.access_token;
          resolve({ success: true, authCode: accessToken, provider: 'naver' });
        } else {
          resolve({ success: false, error: 'Naver login failed', provider: 'naver' });
        }
      });
    });
  }

  isProviderAvailable(provider: 'kakao' | 'google' | 'apple' | 'naver'): boolean {
    if (typeof window === 'undefined') return false;
    
    switch (provider) {
      case 'kakao':
        return !!(window as any).Kakao && !!this.config.kakao?.clientId;
      case 'google':
        return !!(window as any).google && !!this.config.google?.clientId;
      case 'apple':
        return !!(window as any).AppleID && !!this.config.apple?.clientId;
      case 'naver':
        return !!(window as any).naver && !!this.config.naver?.clientId;
      default:
        return false;
    }
  }
}

// React Native용 OAuth 서비스 (기본 구조)
export class MobileOAuthService extends BaseOAuthService {
  async initializeProvider(provider: 'kakao' | 'google' | 'apple' | 'naver'): Promise<void> {
    // React Native 환경에서는 각 플랫폼별 SDK를 사용
    // 실제 구현은 react-native-kakao-login, @react-native-google-signin/google-signin 등을 사용
    console.log(`Initialize ${provider} for React Native`);
  }

  async loginWithKakao(): Promise<OAuthLoginResult> {
    // React Native Kakao SDK 사용
    return { success: false, error: 'Not implemented for mobile', provider: 'kakao' };
  }

  async loginWithGoogle(): Promise<OAuthLoginResult> {
    // React Native Google Sign-In SDK 사용
    return { success: false, error: 'Not implemented for mobile', provider: 'google' };
  }

  async loginWithApple(): Promise<OAuthLoginResult> {
    // React Native Apple Authentication SDK 사용
    return { success: false, error: 'Not implemented for mobile', provider: 'apple' };
  }

  async loginWithNaver(): Promise<OAuthLoginResult> {
    // React Native Naver SDK 사용
    return { success: false, error: 'Not implemented for mobile', provider: 'naver' };
  }

  isProviderAvailable(provider: 'kakao' | 'google' | 'apple' | 'naver'): boolean {
    // React Native 환경에서의 SDK 가용성 체크
    return true; // 임시로 true 반환
  }
}

// OAuth 서비스 팩토리
export class OAuthServiceFactory {
  static create(
    config: OAuthConfig,
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>,
    platform: 'web' | 'mobile' = 'web'
  ): BaseOAuthService {
    if (platform === 'mobile') {
      return new MobileOAuthService(config, baseURL, getAuthHeaders);
    } else {
      return new WebOAuthService(config, baseURL, getAuthHeaders);
    }
  }
}

// OAuth 설정 유틸리티
export const createOAuthConfig = (env: 'development' | 'production'): OAuthConfig => {
  const processEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};
  
  if (env === 'production') {
    return {
      kakao: {
        clientId: processEnv.REACT_APP_KAKAO_CLIENT_ID || '',
        redirectUri: processEnv.REACT_APP_KAKAO_REDIRECT_URI || undefined,
      },
      google: {
        clientId: processEnv.REACT_APP_GOOGLE_CLIENT_ID || '',
        redirectUri: processEnv.REACT_APP_GOOGLE_REDIRECT_URI || undefined,
      },
      apple: {
        clientId: processEnv.REACT_APP_APPLE_CLIENT_ID || '',
        redirectUri: processEnv.REACT_APP_APPLE_REDIRECT_URI || undefined,
      },
      naver: {
        clientId: processEnv.REACT_APP_NAVER_CLIENT_ID || '',
        redirectUri: processEnv.REACT_APP_NAVER_REDIRECT_URI || undefined,
      },
    };
  } else {
    return {
      kakao: {
        clientId: processEnv.REACT_APP_KAKAO_CLIENT_ID_DEV || '',
        redirectUri: processEnv.REACT_APP_KAKAO_REDIRECT_URI_DEV || undefined,
      },
      google: {
        clientId: processEnv.REACT_APP_GOOGLE_CLIENT_ID_DEV || '',
        redirectUri: processEnv.REACT_APP_GOOGLE_REDIRECT_URI_DEV || undefined,
      },
      apple: {
        clientId: processEnv.REACT_APP_APPLE_CLIENT_ID_DEV || '',
        redirectUri: processEnv.REACT_APP_APPLE_REDIRECT_URI_DEV || undefined,
      },
      naver: {
        clientId: processEnv.REACT_APP_NAVER_CLIENT_ID_DEV || '',
        redirectUri: processEnv.REACT_APP_NAVER_REDIRECT_URI_DEV || undefined,
      },
    };
  }
};