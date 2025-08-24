import { User } from '../types';

export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiryTime?: number;
  user?: User;
}

export interface ITokenStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// WebView 브리지 인터페이스
export interface WebViewBridge {
  auth: (action: 'login' | 'logout', data?: any) => Promise<any>;
  getStoredAuth: () => Promise<{ token: string; user: User } | null>;
  syncToken: (token: string, user?: User) => Promise<void>;
}

export class BaseTokenManager {
  protected tokenRefreshPromise: Promise<string | null> | null = null;
  protected storage: ITokenStorage;
  protected readonly ACCESS_TOKEN_KEY = 'accessToken';
  protected readonly REFRESH_TOKEN_KEY = 'refreshToken';
  protected readonly USER_KEY = 'user';
  protected readonly TOKEN_EXPIRY_KEY = 'tokenExpiry';

  constructor(storage: ITokenStorage) {
    this.storage = storage;
  }

  // 토큰 정보 저장
  async setTokenInfo(tokenInfo: TokenInfo): Promise<void> {
    await this.storage.setItem(this.ACCESS_TOKEN_KEY, tokenInfo.accessToken);
    
    if (tokenInfo.refreshToken) {
      await this.storage.setItem(this.REFRESH_TOKEN_KEY, tokenInfo.refreshToken);
    }
    
    if (tokenInfo.user) {
      await this.storage.setItem(this.USER_KEY, JSON.stringify(tokenInfo.user));
    }
    
    // JWT에서 만료시간 추출하거나 제공된 만료시간 사용
    const expiryTime = tokenInfo.expiryTime || this.getTokenExpiryFromJWT(tokenInfo.accessToken);
    if (expiryTime) {
      await this.storage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    }
  }

  // 액세스 토큰 반환
  async getToken(): Promise<string | null> {
    return await this.storage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // 리프레시 토큰 반환
  async getRefreshToken(): Promise<string | null> {
    return await this.storage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // 사용자 정보 반환
  async getUser(): Promise<User | null> {
    const userStr = await this.storage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // 유효한 토큰 반환 (만료 체크 포함)
  async getValidToken(): Promise<string | null> {
    const token = await this.getToken();
    if (!token) return null;

    // 토큰 만료 체크
    if (this.isTokenExpired(token)) {
      // 토큰이 만료된 경우 리프레시 시도
      const refreshedToken = await this.refreshTokenIfPossible();
      return refreshedToken;
    }

    return token;
  }

  // 토큰 리프레시 (서브클래스에서 구현)
  protected async refreshTokenIfPossible(): Promise<string | null> {
    // 기본 구현: 만료된 토큰 삭제
    await this.clearTokens();
    return null;
  }

  // 모든 토큰 정보 삭제
  async clearTokens(): Promise<void> {
    await Promise.all([
      this.storage.removeItem(this.ACCESS_TOKEN_KEY),
      this.storage.removeItem(this.REFRESH_TOKEN_KEY),
      this.storage.removeItem(this.USER_KEY),
      this.storage.removeItem(this.TOKEN_EXPIRY_KEY),
    ]);
  }

  // 토큰 존재 여부 확인
  async hasToken(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // 인증 상태 확인
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidToken();
    return !!token;
  }

  isTokenExpired(token?: string): boolean {
    if (!token) {
      return true;
    }

    try {
      const payload = this.decodeJWTPayload(token);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }

  getTokenExpiryFromJWT(token: string): number | null {
    try {
      const payload = this.decodeJWTPayload(token);
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return null;
    }
  }

  decodeJWTPayload(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }

    const payload = parts[1];
    if (!payload) {
      throw new Error('Invalid JWT token payload');
    }
    
    const decoded = this.base64UrlDecode(payload);
    return JSON.parse(decoded);
  }

  private base64UrlDecode(base64Url: string): string {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }
    
    try {
      // Try to use global atob first (browser environment)
      if (typeof atob !== 'undefined') {
        return atob(base64);
      }
      // Fallback to polyfill
      return this.polyfillAtob(base64);
    } catch (error) {
      throw new Error('Failed to decode base64 string');
    }
  }

  private polyfillAtob(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    let i = 0;
    
    str = str.replace(/[^A-Za-z0-9+/]/g, '');
    
    while (i < str.length) {
      const encoded1 = chars.indexOf(str.charAt(i++));
      const encoded2 = chars.indexOf(str.charAt(i++));
      const encoded3 = chars.indexOf(str.charAt(i++));
      const encoded4 = chars.indexOf(str.charAt(i++));
      
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
      
      const char1 = (bitmap >> 16) & 255;
      const char2 = (bitmap >> 8) & 255;
      const char3 = bitmap & 255;
      
      result += String.fromCharCode(char1);
      
      if (encoded3 !== 64) {
        result += String.fromCharCode(char2);
      }
      if (encoded4 !== 64) {
        result += String.fromCharCode(char3);
      }
    }
    
    return result;
  }
}

// Common validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
};

export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 하이브리드 토큰 매니저 (웹/모바일 통합)
export class HybridTokenManager extends BaseTokenManager {
  private isWebView: boolean;
  private webViewBridge?: WebViewBridge;

  constructor(storage: ITokenStorage, webViewBridge?: WebViewBridge) {
    super(storage);
    
    // WebView 환경 감지
    this.isWebView = !!(typeof window !== 'undefined' && (window as any).ReactNativeWebView);
    this.webViewBridge = webViewBridge || (typeof window !== 'undefined' ? (window as any).ReactNativeWebView : undefined);
  }

  // WebView 환경에서 Native와 토큰 동기화
  async setTokenInfo(tokenInfo: TokenInfo): Promise<void> {
    // 로컬 스토리지에 저장
    await super.setTokenInfo(tokenInfo);

    // WebView 환경에서는 Native와 동기화
    if (this.isWebView && this.webViewBridge) {
      try {
        await this.webViewBridge.syncToken(tokenInfo.accessToken, tokenInfo.user);
      } catch (error) {
        console.warn('Failed to sync token with native:', error);
      }
    }
  }

  // WebView에서 Native의 토큰 가져오기
  async getTokenFromNative(): Promise<{ token: string; user: User } | null> {
    if (!this.isWebView || !this.webViewBridge) return null;

    try {
      return await this.webViewBridge.getStoredAuth();
    } catch (error) {
      console.warn('Failed to get token from native:', error);
      return null;
    }
  }

  // 우선순위: Native > Local Storage
  async getToken(): Promise<string | null> {
    // WebView 환경에서는 Native 우선
    if (this.isWebView) {
      const nativeAuth = await this.getTokenFromNative();
      if (nativeAuth?.token) return nativeAuth.token;
    }

    // 로컬 스토리지에서 가져오기
    return await super.getToken();
  }

  async getUser(): Promise<User | null> {
    // WebView 환경에서는 Native 우선
    if (this.isWebView) {
      const nativeAuth = await this.getTokenFromNative();
      if (nativeAuth?.user) return nativeAuth.user;
    }

    // 로컬 스토리지에서 가져오기
    return await super.getUser();
  }

  // WebView와 Native 모두에서 토큰 삭제
  async clearTokens(): Promise<void> {
    // 로컬 스토리지 정리
    await super.clearTokens();

    // WebView 환경에서는 Native도 정리
    if (this.isWebView && this.webViewBridge) {
      try {
        await this.webViewBridge.auth('logout');
      } catch (error) {
        console.warn('Failed to clear tokens from native:', error);
      }
    }
  }

  // Native에서 웹으로 토큰 초기화 (앱 시작 시)
  async initializeFromNative(): Promise<void> {
    if (!this.isWebView) return;

    try {
      const nativeAuth = await this.getTokenFromNative();
      if (nativeAuth?.token) {
        // Native의 토큰을 로컬 스토리지에도 저장 (성능 최적화)
        await super.setTokenInfo({
          accessToken: nativeAuth.token,
          user: nativeAuth.user,
        });
      }
    } catch (error) {
      console.warn('Failed to initialize tokens from native:', error);
    }
  }

  // 환경 정보 반환
  getEnvironmentInfo() {
    return {
      isWebView: this.isWebView,
      hasWebViewBridge: !!this.webViewBridge,
      platform: this.isWebView ? 'webview' : typeof window !== 'undefined' ? 'web' : 'node',
    };
  }
}

// 스토리지 어댑터들
export class LocalStorageAdapter implements ITokenStorage {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  }
}

// React Native AsyncStorage 어댑터 (임포트 시 주의)
export class AsyncStorageAdapter implements ITokenStorage {
  private asyncStorage: any;

  constructor(AsyncStorage: any) {
    this.asyncStorage = AsyncStorage;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await this.asyncStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.asyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to set item in AsyncStorage:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.asyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove item from AsyncStorage:', error);
    }
  }
}