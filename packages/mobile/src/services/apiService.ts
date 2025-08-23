import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  createApiService,
  IntegratedApiService,
  User
} from '@handy-platform/shared';
import { API_BASE_URL } from '@handy-platform/shared/src/config/api';

// 모바일 전용 토큰 관리
class MobileTokenManager {
  private static readonly TOKEN_KEY = '@handy_platform:accessToken';
  private static readonly USER_KEY = '@handy_platform:user';

  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  static async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  }

  static async clearToken(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.TOKEN_KEY),
        AsyncStorage.removeItem(this.USER_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  static async getUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  static async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }
}

// 모바일 전용 인증 헤더 제공 함수
const getMobileAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await MobileTokenManager.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 모바일 전용 통합 API 서비스 생성
class MobileApiService {
  private apiService: IntegratedApiService;

  constructor() {
    this.apiService = createApiService(
      API_BASE_URL,
      getMobileAuthHeaders,
      'mobile'
    );
    
    // 모바일 전용 AuthService 메서드 확장
    this.setupMobileAuthMethods();
  }

  private setupMobileAuthMethods() {
    // 기존 AuthService 메서드들을 모바일 환경에 맞게 래핑
    const originalAuth = this.apiService.auth;
    
    // 플랫폼별 메서드 구현
    (originalAuth as any).setAuthToken = async (token: string, user?: User): Promise<void> => {
      await MobileTokenManager.setToken(token);
      if (user) {
        await MobileTokenManager.setUser(user);
      }
    };

    (originalAuth as any).clearAuthToken = async (): Promise<void> => {
      await MobileTokenManager.clearToken();
    };

    (originalAuth as any).getAuthToken = async (): Promise<string | null> => {
      return await MobileTokenManager.getToken();
    };

    (originalAuth as any).getCurrentUser = async (): Promise<User | null> => {
      return await MobileTokenManager.getUser();
    };
  }

  // 편의 메서드: 모든 서비스에 직접 접근 가능
  get auth() { return this.apiService.auth; }
  get product() { return this.apiService.product; }
  get review() { return this.apiService.review; }
  get cart() { return this.apiService.cart; }
  get order() { return this.apiService.order; }
  get payment() { return this.apiService.payment; }
  get seller() { return this.apiService.seller; }
  get loyalty() { return this.apiService.loyalty; }
  get image() { return this.apiService.image; }
  get shipping() { return this.apiService.shipping; }
  get qr() { return this.apiService.qr; }

  // 환경 정보
  getEnvironmentInfo() {
    return this.apiService.getEnvironmentInfo();
  }

  // 편의 메서드들
  async isAuthenticated(): Promise<boolean> {
    const token = await this.auth.getAuthToken();
    return !!token;
  }

  async getCurrentUser(): Promise<User | null> {
    return await this.auth.getCurrentUser();
  }

  async loginAndStoreToken(credentials: { email: string; password: string }) {
    const response = await this.auth.login(credentials);
    await this.auth.setAuthToken(response.token, response.user);
    return response;
  }

  async registerAndStoreToken(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) {
    const response = await this.auth.register(userData);
    await this.auth.setAuthToken(response.token, response.user);
    return response;
  }

  async logoutAndClearToken() {
    await MobileTokenManager.clearToken();
  }

  // 로그아웃 후 앱 재시작이 필요한 경우 사용 (React Native 환경)
  async logoutAndRestart() {
    await this.logoutAndClearToken();
    
    // React Native에서 앱 재시작 (선택적)
    if (typeof require !== 'undefined') {
      try {
        const { RNRestart } = require('react-native-restart');
        RNRestart?.Restart?.();
      } catch (error) {
        console.log('앱 재시작 기능 사용 불가:', error);
      }
    }
  }

  // OAuth 로그인 (모바일에서 자주 사용됨)
  async oauthLoginAndStoreToken(
    provider: 'kakao' | 'google' | 'apple' | 'naver',
    accessToken: string
  ) {
    const response = await this.auth.oauthLogin(provider, accessToken);
    await this.auth.setAuthToken(response.token, response.user);
    return response;
  }

}

// 싱글톤 인스턴스 생성
export const mobileApiService = new MobileApiService();


// 기본 내보내기
export default mobileApiService;

// 개별 서비스 접근을 위한 편의 내보내기
export const {
  auth: authService,
  product: productService,
  review: reviewService,
  cart: cartService,
  order: orderService,
  payment: paymentService,
  seller: sellerService,
  loyalty: loyaltyService,
  image: imageService,
  shipping: shippingService,
  qr: qrService,
} = mobileApiService;

// 레거시 호환성을 위한 기본 함수들
export const login = (credentials: { email: string; password: string }) =>
  mobileApiService.loginAndStoreToken(credentials);

export const register = (userData: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) => mobileApiService.registerAndStoreToken(userData);

export const logout = () => mobileApiService.logoutAndClearToken();

export const isAuthenticated = () => mobileApiService.isAuthenticated();

export const getCurrentUser = () => mobileApiService.getCurrentUser();

// OAuth 로그인
export const oauthLogin = (
  provider: 'kakao' | 'google' | 'apple' | 'naver',
  accessToken: string
) => mobileApiService.oauthLoginAndStoreToken(provider, accessToken);

// 타입 내보내기
export type { IntegratedApiService, User };