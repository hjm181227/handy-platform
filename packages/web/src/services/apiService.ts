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
    // 토큰 및 사용자 정보 삭제
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    // 자동 로그인 설정 삭제
    localStorage.removeItem('autoLogin');

    // 사용자 활동 데이터 삭제 (추천 엔진 등)
    localStorage.removeItem('userActivity');

    console.log('[WebTokenManager] All user data cleared from localStorage');
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

    // 토큰 만료 시 자동 처리 콜백
    const handleTokenExpired = () => {
      console.warn('🔴 [WebApiService] Token expired, clearing auth data and redirecting to login');

      // 로컬 데이터 정리
      WebTokenManager.clearToken();

      // 상태 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('authStateChanged'));

      // 로그인 페이지로 리다이렉트
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 100);
    };

    this.apiService = createApiService(
      baseURL,
      getWebAuthHeaders,
      'web',
      handleTokenExpired // 토큰 만료 콜백 등록
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

    // 토큰만 저장 (사용자 정보는 별도로 가져와야 함)
    (originalAuth as any).setAuthTokenOnly = async (token: string): Promise<void> => {
      WebTokenManager.setToken(token);
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
  get user() { return this.apiService.user; }
  get snap() { return this.apiService.snap; }
  get follow() { return this.apiService.follow; }
  get designTool() { return this.apiService.designTool; }

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

    // 소셜 로그인 성공 시 토큰 저장 (신규 사용자도 자동 가입되어 토큰이 발급됨)
    if (response.token) {
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
    try {
      // 서버에 로그아웃 요청 (선택적, 실패해도 로컬 정리는 진행)
      await this.auth.logout();
    } catch (error) {
      console.warn('[WebApiService] Server logout failed, clearing local data anyway:', error);
    } finally {
      // 로컬 데이터 완전 정리
      WebTokenManager.clearToken();
    }
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
    const response = await this.auth.updateProfile(userData);

    // 프로필 업데이트 성공 시 localStorage도 자동 갱신
    if (response.data?.user) {
      WebTokenManager.setUser(response.data.user);
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      console.log('[WebApiService] User profile updated and synced to localStorage');
    }

    return response;
  }

  // 서버에서 최신 사용자 정보 가져와서 갱신
  async refreshCurrentUser(): Promise<User | null> {
    try {
      const response = await this.auth.getUserProfile();
      if (response.data?.user) {
        WebTokenManager.setUser(response.data.user);
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        console.log('[WebApiService] User data refreshed from server');
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('[WebApiService] Failed to refresh user data:', error);
      throw error;
    }
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
  user: userService,
  follow: followService,
  designTool: designToolService,
} = webApiService;

// 레거시 호환성을 위한 기본 함수들
export const login = (credentials: { email: string; password: string }) =>
  webApiService.loginAndStoreToken(credentials);

export const logout = () => webApiService.logoutAndClearToken();

export const isAuthenticated = () => webApiService.isAuthenticated();

export const getCurrentUser = () => webApiService.getCurrentUser();

// 타입 내보내기
export type { BaseIntegratedApiService as IntegratedApiService, User };