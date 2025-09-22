import {
  ApiResponse,
  AuthResponse,
  User,
  Product,
  ProductsResponse,
  ProductFilters,
  Cart,
  Order,
  OrdersResponse,
  Address,
  PaymentMethod,
  RegisterForm,
  LoginForm,
  ReviewForm,
  ProductCategory,
  ApiError,
  withRetry,
  parseApiError,
  safeJsonParse,
  isTokenExpired,
  API_ENDPOINTS,
  getApiConfig,
  getDebugConfig,
  // 추가된 타입들
  PaginationInfo,
  DetailedReview,
  ReviewsResponse,
  UserCoupon,
  Coupon,
  UserPointsInfo,
  PointTransaction,
  PresignedUrlRequest,
  PresignedUrlResponse,
  ImageUploadConfig,
  LinkedAccountsResponse,
  ImageUploadManager,
  // 새로운 타입들
  SellerProfile,
  SellerDashboard,
  ShippingAddress,
  QRCodeData,
  QRCodeResponse,
  BulkProductOperation,
  BulkOperationResult,
} from '@handy-platform/shared';

// 웹 환경에서 Vite 환경변수를 통해 환경 설정
const setViteEnvironment = () => {
  // Vite의 환경변수를 window 객체에 설정
  let viteEnv = 'development';
  try {
    // @ts-ignore
    viteEnv = import.meta.env ? import.meta.env.MODE : 'development';
  } catch {
    viteEnv = 'development';
  }
  (window as any).__VITE_ENV__ = viteEnv === 'production' ? 'production' : 'development';
};

// 하이브리드 토큰 관리 (웹/앱 통합)
class HybridTokenManager {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly USER_KEY = 'user';
  private isWebView: boolean;

  constructor() {
    // WebView 환경인지 감지
    this.isWebView = !!(window as any).ReactNativeWebView;
  }

  async getToken(): Promise<string | null> {
    if (this.isWebView) {
      // WebView 환경: Native에서 토큰 가져오기
      try {
        const authData = await (window as any).ReactNativeWebView.getStoredAuth();
        return authData?.token || null;
      } catch {
        return null;
      }
    } else {
      // 일반 웹 환경: localStorage 사용
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
  }

  async setTokenInfo(tokenInfo: { accessToken: string; user?: User }): Promise<void> {
    // 양쪽 환경 모두에 저장
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokenInfo.accessToken);
    if (tokenInfo.user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(tokenInfo.user));
    }

    if (this.isWebView) {
      // WebView 환경: Native에도 동기화
      try {
        (window as any).ReactNativeWebView.syncToken(tokenInfo.accessToken, tokenInfo.user);
      } catch {
        console.warn('Failed to sync token to native');
      }
    }
  }

  async clearTokens(): Promise<void> {
    // 양쪽 환경 모두에서 정리
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    if (this.isWebView) {
      // WebView 환경: Native에서도 토큰 삭제
      try {
        (window as any).ReactNativeWebView.auth('logout');
      } catch {
        console.warn('Failed to clear tokens from native');
      }
    }
  }

  async getValidToken(): Promise<string | null> {
    const token = await this.getToken();
    if (!token) return null;

    // JWT 토큰 만료 체크
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        await this.clearTokens();
        return null;
      }
      return token;
    } catch {
      await this.clearTokens();
      return null;
    }
  }

  async getUser(): Promise<User | null> {
    if (this.isWebView) {
      // WebView 환경: Native에서 유저 정보 가져오기
      try {
        const authData = await (window as any).ReactNativeWebView.getStoredAuth();
        return authData?.user || null;
      } catch {
        return null;
      }
    } else {
      // 일반 웹 환경: localStorage 사용
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
  }

  async initializeFromNative(): Promise<void> {
    // WebView 시작 시 Native의 저장된 토큰을 가져와서 동기화
    if (this.isWebView) {
      try {
        const authData = await (window as any).ReactNativeWebView.getStoredAuth();
        if (authData?.token) {
          // 토큰이 있으면 localStorage에도 저장 (성능 최적화)
          localStorage.setItem(this.ACCESS_TOKEN_KEY, authData.token);
          if (authData.user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user));
          }
        }
      } catch (error) {
        console.warn('Failed to initialize tokens from native:', error);
      }
    }
  }
}

export const webTokenManager = new HybridTokenManager();

// 웹용 API 서비스
class WebApiService {
  private baseURL: string;
  private timeout: number;
  private enableDebug: boolean;

  constructor() {
    // Vite 환경 설정
    setViteEnvironment();
    
    // Shared 패키지의 설정 사용
    const config = getApiConfig();
    const debugConfig = getDebugConfig();
    
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.enableDebug = debugConfig.enableApiLogs;
    
    if (this.enableDebug) {
      console.log('🚀 Web API Service initialized with config:', {
        baseURL: this.baseURL,
        timeout: this.timeout,
        environment: (() => { 
          try { 
            // @ts-ignore
            return import.meta.env ? import.meta.env.MODE : 'development';
          } catch { 
            return 'development';
          }
        })()
      });
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await webTokenManager.getValidToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    enableRetry: boolean = true
  ): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getAuthHeaders();

      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        if (this.enableDebug) {
          console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`, {
            headers,
            body: options.body,
          });
        }

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...headers,
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (this.enableDebug) {
          console.log(`📡 API Response: ${response.status} ${url}`, response);
        }

        return await this.handleResponse<T>(response);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408, 'TIMEOUT');
        }
        throw error;
      }
    };

    if (enableRetry) {
      return withRetry(makeRequest, {
        retryCondition: (error) => {
          // Don't retry auth errors (4xx) except for 408, 429
          if (error instanceof ApiError && error.status) {
            if (error.status >= 400 && error.status < 500) {
              return error.status === 408 || error.status === 429;
            }
          }
          return true;
        },
      });
    }

    return makeRequest();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      const apiError = parseApiError(response, errorData);
      
      // Handle token expiration
      if (isTokenExpired(apiError)) {
        await this.handleTokenExpiration();
        throw apiError;
      }
      
      throw apiError;
    }

    return response.json();
  }

  private async handleTokenExpiration(): Promise<void> {
    // Clear expired token using token manager
    await webTokenManager.clearTokens();
    
    // Redirect to login page
    console.log('Token expired, redirecting to login');
    window.location.href = '/login';
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    return searchParams.toString();
  }

  // ======================
  // Authentication
  // ======================

  async login(credentials: LoginForm): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, false); // Don't retry login attempts
    
    // Automatically store token on successful login
    if (response.token) {
      await webTokenManager.setTokenInfo({
        accessToken: response.token,
        user: response.user,
      });
    }
    
    return response;
  }

  async register(userData: RegisterForm): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    }, false); // Don't retry registration attempts
    
    // Automatically store token on successful registration
    if (response.token) {
      await webTokenManager.setTokenInfo({
        accessToken: response.token,
        user: response.user,
      });
    }
    
    return response;
  }

  async getUserProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request<ApiResponse<{ user: User }>>(API_ENDPOINTS.AUTH.PROFILE);
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
      });
      
      // Always clear local token regardless of server response
      await webTokenManager.clearTokens();
      
      return response;
    } catch (error) {
      // Even if server logout fails, clear local token
      await webTokenManager.clearTokens();
      throw error;
    }
  }

  // ======================
  // Products
  // ======================

  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.PRODUCTS.LIST}?${queryString}` : API_ENDPOINTS.PRODUCTS.LIST;
    return this.request<ProductsResponse>(endpoint);
  }

  async getProduct(id: string): Promise<ApiResponse<{ product: Product; relatedProducts: Product[] }>> {
    return this.request<ApiResponse<{ product: Product; relatedProducts: Product[] }>>(API_ENDPOINTS.PRODUCTS.DETAIL(id));
  }

  async getFeaturedProducts(limit = 8): Promise<ApiResponse<{ products: Product[] }>> {
    return this.request<ApiResponse<{ products: Product[] }>>(`${API_ENDPOINTS.PRODUCTS.FEATURED}?limit=${limit}`);
  }

  async getCategories(): Promise<ApiResponse<{ categories: ProductCategory[] }>> {
    return this.request<ApiResponse<{ categories: ProductCategory[] }>>(API_ENDPOINTS.PRODUCTS.CATEGORIES);
  }

  // ======================
  // Cart
  // ======================

  async getCart(): Promise<ApiResponse<{ cart: Cart }>> {
    return this.request<ApiResponse<{ cart: Cart }>>(API_ENDPOINTS.CART.GET);
  }

  async addToCart(productId: string, quantity: number): Promise<ApiResponse<{ cart: Cart }>> {
    return this.request<ApiResponse<{ cart: Cart }>>(API_ENDPOINTS.CART.ITEMS, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(productId: string, quantity: number): Promise<ApiResponse<{ cart: Cart }>> {
    return this.request<ApiResponse<{ cart: Cart }>>(API_ENDPOINTS.CART.ITEM(productId), {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(productId: string): Promise<ApiResponse<{ cart: Cart }>> {
    return this.request<ApiResponse<{ cart: Cart }>>(API_ENDPOINTS.CART.ITEM(productId), {
      method: 'DELETE',
    });
  }

  async getCartCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>(API_ENDPOINTS.CART.COUNT);
  }

  // ======================
  // Orders
  // ======================

  async getOrders(filters: { page?: number; limit?: number; status?: string } = {}): Promise<OrdersResponse> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.ORDERS.LIST}?${queryString}` : API_ENDPOINTS.ORDERS.LIST;
    return this.request<OrdersResponse>(endpoint);
  }

  async getOrder(id: string): Promise<ApiResponse<{ order: Order }>> {
    return this.request<ApiResponse<{ order: Order }>>(API_ENDPOINTS.ORDERS.DETAIL(id));
  }

  async createOrder(orderData: {
    items: Array<{ productId: string; quantity: number; options?: Record<string, string> }>;
    shippingAddress: Address;
    paymentMethod: PaymentMethod;
    couponCode?: string;
    pointsToUse?: number;
  }): Promise<ApiResponse<{ order: Order }>> {
    return this.request<ApiResponse<{ order: Order }>>(API_ENDPOINTS.ORDERS.CREATE, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async cancelOrder(id: string, reason?: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.ORDERS.CANCEL(id), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async reorderFromOrder(id: string): Promise<ApiResponse<{ cart: Cart }>> {
    return this.request<ApiResponse<{ cart: Cart }>>(API_ENDPOINTS.ORDERS.REORDER(id), {
      method: 'POST',
    });
  }

  // ======================
  // Reviews
  // ======================

  async getProductReviews(
    productId: string, 
    filters: { page?: number; rating?: number; sortBy?: string; verifiedOnly?: boolean } = {}
  ): Promise<ReviewsResponse> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.PRODUCTS.REVIEWS(productId)}?${queryString}` : API_ENDPOINTS.PRODUCTS.REVIEWS(productId);
    return this.request<ReviewsResponse>(endpoint);
  }

  async createReview(productId: string, reviewData: ReviewForm & { images?: string[] }): Promise<ApiResponse<{ review: DetailedReview }>> {
    return this.request<ApiResponse<{ review: DetailedReview }>>(API_ENDPOINTS.PRODUCTS.REVIEW_CREATE(productId), {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async updateReview(productId: string, reviewId: string, reviewData: Partial<ReviewForm>): Promise<ApiResponse<{ review: DetailedReview }>> {
    return this.request<ApiResponse<{ review: DetailedReview }>>(API_ENDPOINTS.PRODUCTS.REVIEW_UPDATE(productId, reviewId), {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  }

  async deleteReview(productId: string, reviewId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.PRODUCTS.REVIEW_DELETE(productId, reviewId), {
      method: 'DELETE',
    });
  }

  async markReviewHelpful(productId: string, reviewId: string, helpful: boolean): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.PRODUCTS.REVIEW_HELPFUL(productId, reviewId), {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    });
  }

  // ======================
  // Coupons
  // ======================

  async getUserCoupons(): Promise<ApiResponse<{ coupons: UserCoupon[] }>> {
    return this.request<ApiResponse<{ coupons: UserCoupon[] }>>(API_ENDPOINTS.COUPONS.USER_COUPONS);
  }

  async getAvailableCoupons(): Promise<ApiResponse<{ coupons: Coupon[] }>> {
    return this.request<ApiResponse<{ coupons: Coupon[] }>>(API_ENDPOINTS.COUPONS.AVAILABLE);
  }

  async downloadCoupon(couponId: string): Promise<ApiResponse<{ coupon: UserCoupon }>> {
    return this.request<ApiResponse<{ coupon: UserCoupon }>>(API_ENDPOINTS.COUPONS.DOWNLOAD(couponId), {
      method: 'POST',
    });
  }

  async redeemCoupon(code: string): Promise<ApiResponse<{ coupon: UserCoupon }>> {
    return this.request<ApiResponse<{ coupon: UserCoupon }>>(API_ENDPOINTS.COUPONS.REDEEM, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // ======================
  // Points
  // ======================

  async getPointsBalance(): Promise<ApiResponse<{ points: UserPointsInfo }>> {
    return this.request<ApiResponse<{ points: UserPointsInfo }>>(API_ENDPOINTS.POINTS.BALANCE);
  }

  async getPointsHistory(filters: { page?: number; limit?: number; type?: string } = {}): Promise<ApiResponse<{ transactions: PointTransaction[]; pagination: PaginationInfo }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.POINTS.HISTORY}?${queryString}` : API_ENDPOINTS.POINTS.HISTORY;
    return this.request<ApiResponse<{ transactions: PointTransaction[]; pagination: PaginationInfo }>>(endpoint);
  }

  async usePoints(orderId: string, amount: number): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.POINTS.USE, {
      method: 'POST',
      body: JSON.stringify({ orderId, amount }),
    });
  }

  // ======================
  // Image Upload
  // ======================

  async getPresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    return this.request<PresignedUrlResponse>(API_ENDPOINTS.UPLOAD.PRESIGNED_URL, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getUploadConfig(): Promise<ImageUploadConfig> {
    return this.request<ImageUploadConfig>(API_ENDPOINTS.UPLOAD.CONFIG);
  }

  async notifyUploadComplete(images: string[], targetPath?: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/upload/complete', {
      method: 'POST',
      body: JSON.stringify({ images, targetPath }),
    });
  }

  // ======================
  // OAuth
  // ======================

  async getLinkedAccounts(): Promise<LinkedAccountsResponse> {
    return this.request<LinkedAccountsResponse>(API_ENDPOINTS.OAUTH.LINKED);
  }

  async linkOAuthAccount(provider: string, authCode: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.OAUTH.LINK(provider), {
      method: 'POST',
      body: JSON.stringify({ authCode }),
    });
  }

  async unlinkOAuthAccount(provider: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.OAUTH.UNLINK(provider), {
      method: 'DELETE',
    });
  }

  // ======================
  // Wishlist
  // ======================

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

  // ======================
  // Shipping
  // ======================

  async getShippingMethods(): Promise<ApiResponse<{ methods: Array<{ id: string; name: string; cost: number; estimatedDays: number }> }>> {
    return this.request<ApiResponse<{ methods: Array<{ id: string; name: string; cost: number; estimatedDays: number }> }>>(API_ENDPOINTS.SHIPPING.METHODS);
  }

  async calculateShipping(data: {
    items: Array<{ productId: string; quantity: number }>;
    address: Address;
  }): Promise<ApiResponse<{ cost: number; methods: Array<{ id: string; name: string; cost: number; estimatedDays: number }> }>> {
    return this.request<ApiResponse<{ cost: number; methods: Array<{ id: string; name: string; cost: number; estimatedDays: number }> }>>(API_ENDPOINTS.SHIPPING.CALCULATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ======================
  // Payments
  // ======================

  async processPayment(orderId: string, paymentData: {
    paymentMethod: PaymentMethod;
    paymentDetails?: Record<string, any>;
  }): Promise<ApiResponse<{ transactionId: string; status: string }>> {
    return this.request<ApiResponse<{ transactionId: string; status: string }>>(API_ENDPOINTS.PAYMENTS.PROCESS(orderId), {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getPaymentMethods(): Promise<ApiResponse<{ methods: PaymentMethod[] }>> {
    return this.request<ApiResponse<{ methods: PaymentMethod[] }>>(API_ENDPOINTS.PAYMENTS.METHODS);
  }

  // ======================
  // Utility Methods
  // ======================

  async isAuthenticated(): Promise<boolean> {
    const token = await webTokenManager.getValidToken();
    return !!token;
  }

  async getCurrentUser(): Promise<User | null> {
    return await webTokenManager.getUser();
  }

  // Image upload helper using shared ImageUploadManager
  createImageUploadManager(): ImageUploadManager {
    return new ImageUploadManager(this.baseURL, () => this.getAuthHeaders());
  }

}

export const webApiService = new WebApiService();
export default webApiService;