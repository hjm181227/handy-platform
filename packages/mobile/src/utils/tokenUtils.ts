import AsyncStorage from '@react-native-async-storage/async-storage';
import { HybridTokenManager, AsyncStorageAdapter } from '@handy-platform/shared';

// AsyncStorage 어댑터 생성
const storage = new AsyncStorageAdapter(AsyncStorage);

// 하이브리드 토큰 매니저 인스턴스 생성 (모바일 환경)
export const tokenManager = new HybridTokenManager(storage);

// React Native 환경 설정
if (typeof process !== 'undefined' && !process.env.REACT_NATIVE_ENV) {
  process.env.REACT_NATIVE_ENV = 'development';
}

// 백워드 호환성을 위한 레거시 타입 및 함수 export
export { TokenInfo } from '@handy-platform/shared';

// 레거시 TokenManager 클래스 (deprecated)
export class TokenManager {
  private static instance: TokenManager;
  
  private constructor() {
    console.warn('TokenManager is deprecated. Use tokenManager (HybridTokenManager) instead.');
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async getValidToken(): Promise<string | null> {
    return tokenManager.getValidToken();
  }

  async setTokenInfo(tokenInfo: { accessToken: string; refreshToken?: string; expiryTime?: number }): Promise<void> {
    return tokenManager.setTokenInfo(tokenInfo);
  }

  async clearTokens(): Promise<void> {
    return tokenManager.clearTokens();
  }

  async getToken(): Promise<string | null> {
    return tokenManager.getToken();
  }

  async getRefreshToken(): Promise<string | null> {
    return tokenManager.getRefreshToken();
  }

  isTokenExpired(token?: string): boolean {
    return tokenManager.isTokenExpired(token);
  }
}