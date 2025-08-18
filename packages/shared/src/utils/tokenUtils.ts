export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiryTime?: number;
}

export interface ITokenStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class BaseTokenManager {
  protected tokenRefreshPromise: Promise<string | null> | null = null;
  protected storage: ITokenStorage;

  constructor(storage: ITokenStorage) {
    this.storage = storage;
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