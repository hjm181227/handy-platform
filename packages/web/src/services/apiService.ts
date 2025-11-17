import {
  createApiService,
  BaseIntegratedApiService,
  User,
  API_BASE_URL
} from '@handy-platform/shared';

// 웹 전용 토큰 관리
class WebTokenManager {
  private static readonly TOKEN_KEY = 'accessToken';
  private static readonly USER_KEY = 'user';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}

// 웹 전용 인증 헤더 제공 함수
const getWebAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = WebTokenManager.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 웹 전용 통합 API 서비스 생성
class WebApiService {
  private apiService: BaseIntegratedApiService;

  constructor() {
    // Vite 환경변수 우선 사용
    const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || API_BASE_URL;
    console.log('🔧 Web API Service Base URL:', baseURL);
    
    this.apiService = createApiService(
      baseURL,
      getWebAuthHeaders,
      'web'
    );
    
    // 웹 전용 AuthService 메서드 확장
    this.setupWebAuthMethods();
  }

  private setupWebAuthMethods() {
    // 기존 AuthService 메서드들을 웹 환경에 맞게 래핑
    const originalAuth = this.apiService.auth;
    
    // 플랫폼별 메서드 구현
    (originalAuth as any).setAuthToken = async (token: string, user?: User): Promise<void> => {
      WebTokenManager.setToken(token);
      if (user) {
        WebTokenManager.setUser(user);
      }
    };

    (originalAuth as any).clearAuthToken = async (): Promise<void> => {
      WebTokenManager.clearToken();
    };

    (originalAuth as any).getAuthToken = async (): Promise<string | null> => {
      return WebTokenManager.getToken();
    };

    (originalAuth as any).getCurrentUser = async (): Promise<User | null> => {
      return WebTokenManager.getUser();
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
  get sellerApplication() { return this.apiService.sellerApplication; }
  get production() { return this.apiService.production; }
  get admin() { return this.apiService.admin; }
  get loyalty() { return this.apiService.loyalty; }
  get image() { return this.apiService.image; }
  get shipping() { return this.apiService.shipping; }
  get qr() { return this.apiService.qr; }
  get address() { return this.apiService.address; }
  get brand() { return this.apiService.brand; }
  get likes() { return this.apiService.likes; }
  get category() { return this.apiService.category; }
  get banner() { return this.apiService.banner; }

  // 환경 정보
  getEnvironmentInfo() {
    return this.apiService.getEnvironmentInfo();
  }

  // 편의 메서드들
  async isAuthenticated(): Promise<boolean> {
    return !!(await this.auth.getAuthToken());
  }

  async getCurrentUser(): Promise<User | null> {
    return WebTokenManager.getUser();
  }

  async loginAndStoreToken(credentials: { email: string; password: string }) {
    const response = await this.auth.login(credentials);
    await this.auth.setAuthToken(response.token, response.user);
    return response;
  }

  async oauthLogin(provider: 'kakao' | 'google' | 'apple' | 'naver', accessToken: string) {
    const response = await this.auth.oauthLogin(provider, accessToken);

    // 신규 사용자가 아닌 경우에만 토큰 저장
    if (!response.needsSignup) {
      await this.auth.setAuthToken(response.token, response.user);
    }

    return response;
  }

  async signupWithOauth(data: {
    provider: 'kakao' | 'google' | 'apple' | 'naver';
    kakaoUserInfo: {
      id: string;
      email: string;
      name: string;
      profileImage?: string;
    };
    additionalInfo?: {
      phone?: string;
    };
  }) {
    const response = await this.auth.signupWithOauth(data.provider, {
      kakaoUserInfo: data.kakaoUserInfo,
      additionalInfo: data.additionalInfo
    });
    await this.auth.setAuthToken(response.token, response.user);
    return response;
  }

  async logoutAndClearToken() {
    WebTokenManager.clearToken();
  }

  // 로그아웃 후 리다이렉트가 필요한 경우 사용
  async logoutAndRedirect(redirectPath: string = '/login') {
    await this.logoutAndClearToken();
    window.location.href = redirectPath;
  }

  // 사용자 프로필 관련 메서드
  async getCurrentUserProfile() {
    return this.auth.getUserProfile();
  }

  async updateUserProfile(userData: Partial<User>) {
    return this.auth.updateProfile(userData);
  }

  // WebView 환경에서 네이티브 토큰 동기화
  async initializeFromNative(): Promise<void> {
    if ((window as any).ReactNativeWebView) {
      try {
        // 네이티브에서 토큰 요청
        (window as any).ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'REQUEST_TOKEN' })
        );
      } catch (error) {
        console.warn('Native token sync failed:', error);
      }
    }
  }

}

// 싱글톤 인스턴스 생성
export const webApiService = new WebApiService();


// 기본 내보내기
export default webApiService;

// 개별 서비스 접근을 위한 편의 내보내기
export const {
  auth: authService,
  product: productService,
  review: reviewService,
  cart: cartService,
  order: orderService,
  payment: paymentService,
  seller: sellerService,
  sellerApplication: sellerApplicationService,
  production: productionService,
  admin: adminService,
  loyalty: loyaltyService,
  image: imageService,
  shipping: shippingService,
  qr: qrService,
  address: addressService,
  brand: brandService,
  likes: likesService,
  category: categoryService,
  banner: bannerService,
} = webApiService;

// 레거시 호환성을 위한 기본 함수들
export const login = (credentials: { email: string; password: string }) =>
  webApiService.loginAndStoreToken(credentials);

export const logout = () => webApiService.logoutAndClearToken();

export const isAuthenticated = () => webApiService.isAuthenticated();

export const getCurrentUser = () => webApiService.getCurrentUser();

// 타입 내보내기
export type { BaseIntegratedApiService as IntegratedApiService, User };