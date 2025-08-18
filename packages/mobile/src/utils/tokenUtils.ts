import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiryTime?: number;
}

export class TokenManager {
  private static instance: TokenManager;
  private tokenRefreshPromise: Promise<string | null> | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async getValidToken(): Promise<string | null> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      return null;
    }

    // Check if token is expired or expires soon (within 5 minutes)
    const expiryTime = await this.getTokenExpiry();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiryTime && expiryTime - now < fiveMinutes) {
      // Token is expired or expires soon, try to refresh
      return await this.refreshToken();
    }

    return token;
  }

  async setTokenInfo(tokenInfo: TokenInfo): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, tokenInfo.accessToken);
    
    if (tokenInfo.refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokenInfo.refreshToken);
    }
    
    if (tokenInfo.expiryTime) {
      await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, tokenInfo.expiryTime.toString());
    } else {
      // If no expiry provided, calculate from JWT token
      const expiry = this.getTokenExpiryFromJWT(tokenInfo.accessToken);
      if (expiry) {
        await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
      }
    }
  }

  async clearTokens(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(TOKEN_EXPIRY_KEY),
    ]);
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async getTokenExpiry(): Promise<number | null> {
    const expiry = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
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

  private getTokenExpiryFromJWT(token: string): number | null {
    try {
      const payload = this.decodeJWTPayload(token);
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return null;
    }
  }

  private decodeJWTPayload(token: string): any {
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
    
    // For React Native, we need to use a different approach since atob might not be available
    try {
      return global.atob ? global.atob(base64) : this.polyfillAtob(base64);
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

  private async refreshToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.tokenRefreshPromise;
      return result;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        await this.clearTokens();
        return null;
      }

      // Call refresh endpoint (this would be implemented in your API service)
      // For now, just return null to indicate refresh is not available
      console.log('Token refresh not implemented yet');
      
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearTokens();
      return null;
    }
  }

  // Method to be called by API service for token refresh
  async refreshTokenWithAPI(refreshEndpoint: () => Promise<{ accessToken: string; refreshToken?: string; expiryTime?: number }>): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        await this.clearTokens();
        return null;
      }

      const tokenInfo = await refreshEndpoint();
      await this.setTokenInfo(tokenInfo);
      
      return tokenInfo.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearTokens();
      return null;
    }
  }
}

export const tokenManager = TokenManager.getInstance();