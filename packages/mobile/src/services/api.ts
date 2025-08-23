import AsyncStorage from '@react-native-async-storage/async-storage';
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
  getApiConfig,
  getDebugConfig,
  API_ENDPOINTS,
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
  HybridTokenManager,
  AsyncStorageAdapter,
  // 새로운 서비스들
  BaseSellerService,
  SellerServiceFactory,
  BaseUserManagementService,
  UserManagementServiceFactory,
  BaseQRService,
  QRServiceFactory,
  BasePaymentService,
  PaymentServiceFactory,
  BaseComprehensiveLoyaltyService,
  ComprehensiveLoyaltyServiceFactory,
  // 새로운 타입들
  SellerProfile,
  SellerDashboard,
  ShippingAddress,
  QRCodeData,
  QRCodeResponse,
  BulkProductOperation,
  BulkOperationResult,
} from '@handy-platform/shared';
import { tokenManager } from '../utils/tokenUtils';

class ApiService {
  private baseURL: string;
  private timeout: number;
  private debugConfig: any;

  constructor() {
    const config = getApiConfig();
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.debugConfig = getDebugConfig();
    
    if (this.debugConfig.enableApiLogs) {
      console.log('🚀 API Service initialized with config:', {
        baseURL: this.baseURL,
        timeout: this.timeout,
        environment: process.env.REACT_NATIVE_ENV || 'development'
      });
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await tokenManager.getValidToken();
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
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...headers,
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);
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
    await tokenManager.clearTokens();
    
    // You could emit an event here to notify the app about token expiration
    console.log('Token expired, user needs to re-authenticate');
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
      await tokenManager.setTokenInfo({
        accessToken: response.token,
        // If the response includes refresh token and expiry, include them
        // refreshToken: response.refreshToken,
        // expiryTime: response.expiryTime,
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
      await tokenManager.setTokenInfo({
        accessToken: response.token,
        // If the response includes refresh token and expiry, include them
        // refreshToken: response.refreshToken,
        // expiryTime: response.expiryTime,
      });
    }
    
    return response;
  }

  async getUserProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request<ApiResponse<{ user: User }>>('/api/auth/profile');
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return this.request<ApiResponse<{ user: User }>>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>('/api/auth/logout', {
        method: 'POST',
      });
      
      // Always clear local token regardless of server response
      await tokenManager.clearTokens();
      
      return response;
    } catch (error) {
      // Even if server logout fails, clear local token
      await tokenManager.clearTokens();
      throw error;
    }
  }

  // Wishlist
  async addToWishlist(productId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/api/auth/wishlist/${productId}`, {
      method: 'POST',
    });
  }

  async removeFromWishlist(productId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/api/auth/wishlist/${productId}`, {
      method: 'DELETE',
    });
  }

  // ======================
  // Products
  // ======================

  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `/api/products?${queryString}` : '/api/products';
    return this.request<ProductsResponse>(endpoint);
  }

  async getProduct(id: string): Promise<ApiResponse<{ product: Product; relatedProducts: Product[] }>> {
    return this.request<ApiResponse<{ product: Product; relatedProducts: Product[] }>>(`/api/products/${id}`);
  }

  async getFeaturedProducts(limit = 8): Promise<ApiResponse<{ products: Product[] }>> {
    return this.request<ApiResponse<{ products: Product[] }>>(`/api/products/featured?limit=${limit}`);
  }

  async getCategories(): Promise<ApiResponse<{ categories: ProductCategory[] }>> {
    return this.request<ApiResponse<{ categories: ProductCategory[] }>>('/api/products/categories');
  }

  async getBrands(): Promise<ApiResponse<{ brands: string[] }>> {
    return this.request<ApiResponse<{ brands: string[] }>>('/api/products/brands');
  }

  async getSearchSuggestions(query: string): Promise<ApiResponse<{ suggestions: Array<{ id: string; name: string; category: string }> }>> {
    return this.request<ApiResponse<{ suggestions: Array<{ id: string; name: string; category: string }> }>>(`/api/products/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  // Product Reviews
  async addProductReview(productId: string, review: ReviewForm): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }

  async updateProductReview(productId: string, reviewId: string, review: ReviewForm): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/api/products/${productId}/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(review),
    });
  }

  async deleteProductReview(productId: string, reviewId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/api/products/${productId}/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  // ======================
  // Cart
  // ======================

  async getCart(): Promise<ApiResponse<{ cart: Cart }>> {
    return this.request<ApiResponse<{ cart: Cart }>>('/api/cart');
  }

  async addToCart(productId: string, quantity: number): Promise<ApiResponse<{ cart: Cart }>> {
    return this.request<ApiResponse<{ cart: Cart }>>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(productId: string, quantity: number): Promise<ApiResponse<{ cart: Cart }>> {
    return this.request<ApiResponse<{ cart: Cart }>>(`/api/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(productId: string): Promise<ApiResponse<{ cart: Cart }>> {
    return this.request<ApiResponse<{ cart: Cart }>>(`/api/cart/items/${productId}`, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/cart', {
      method: 'DELETE',
    });
  }

  async getCartCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>('/api/cart/count');
  }

  async syncCart(items: Array<{ productId: string; quantity: number }>): Promise<ApiResponse<{ cart: Cart }>> {
    return this.request<ApiResponse<{ cart: Cart }>>('/api/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  // ======================
  // Orders
  // ======================

  async getOrders(filters: { page?: number; limit?: number; status?: string } = {}): Promise<OrdersResponse> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `/api/orders?${queryString}` : '/api/orders';
    return this.request<OrdersResponse>(endpoint);
  }

  async getOrder(id: string): Promise<ApiResponse<{ order: Order }>> {
    return this.request<ApiResponse<{ order: Order }>>(`/api/orders/${id}`);
  }

  async createOrder(orderData: {
    shippingAddress: Address;
    paymentMethod: PaymentMethod;
    items?: Array<{ productId: string; quantity: number }>;
    notes?: string;
  }): Promise<ApiResponse<{ order: Order }>> {
    return this.request<ApiResponse<{ order: Order }>>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<{ order: Order }>> {
    return this.request<ApiResponse<{ order: Order }>>(`/api/orders/${orderId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async trackOrder(orderId: string): Promise<ApiResponse<{
    orderNumber: string;
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    statusHistory: Array<{
      status: string;
      note: string;
      timestamp: string;
    }>;
  }>> {
    return this.request<ApiResponse<{
      orderNumber: string;
      status: string;
      trackingNumber?: string;
      estimatedDelivery?: string;
      actualDelivery?: string;
      statusHistory: Array<{
        status: string;
        note: string;
        timestamp: string;
      }>;
    }>>(`/api/orders/${orderId}/track`);
  }

  async reorder(orderId: string): Promise<ApiResponse<{
    cart: Cart;
    addedItems: string[];
    unavailableItems: string[];
  }>> {
    return this.request<ApiResponse<{
      cart: Cart;
      addedItems: string[];
      unavailableItems: string[];
    }>>(`/api/orders/${orderId}/reorder`, {
      method: 'POST',
    });
  }

  // ======================
  // Payments
  // ======================

  async processPayment(orderId: string, paymentData: {
    paymentMethod: PaymentMethod;
    cardNumber?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
    cardholderName?: string;
    paypalEmail?: string;
    bankAccount?: string;
    routingNumber?: string;
  }): Promise<ApiResponse<{
    transactionId: string;
    order: Order;
  }>> {
    return this.request<ApiResponse<{
      transactionId: string;
      order: Order;
    }>>(`/api/payments/process/${orderId}`, {
      method: 'POST',
      body: JSON.stringify({ paymentDetails: paymentData }),
    });
  }

  async getPaymentStatus(transactionId: string): Promise<ApiResponse<{
    status: string;
    order: Order;
  }>> {
    return this.request<ApiResponse<{
      status: string;
      order: Order;
    }>>(`/api/payments/status/${transactionId}`);
  }

  async requestRefund(orderId: string, reason: string, amount?: number): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/api/payments/refund/${orderId}`, {
      method: 'POST',
      body: JSON.stringify({ reason, amount }),
    });
  }

  async getPaymentMethods(): Promise<ApiResponse<{
    paymentMethods: Array<{
      id: string;
      name: string;
      description: string;
      processingTime: string;
      fees: string;
    }>;
  }>> {
    return this.request<ApiResponse<{
      paymentMethods: Array<{
        id: string;
        name: string;
        description: string;
        processingTime: string;
        fees: string;
      }>;
    }>>('/api/payments/methods');
  }

  // ======================
  // Image Upload
  // ======================

  async getPresignedUrl(filename: string, contentType: string): Promise<ApiResponse<{
    presignedUrl: string;
    imageUrl: string;
    filename: string;
    expiresIn: string;
  }>> {
    return this.request<ApiResponse<{
      presignedUrl: string;
      imageUrl: string;
      filename: string;
      expiresIn: string;
    }>>('/api/upload/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ filename, contentType }),
    });
  }

  async getUploadConfig(): Promise<ApiResponse<{
    allowedTypes: string[];
    maxFileSize: string;
    presignedUrlExpires: string;
    note: string;
  }>> {
    return this.request<ApiResponse<{
      allowedTypes: string[];
      maxFileSize: string;
      presignedUrlExpires: string;
      note: string;
    }>>('/api/upload/config');
  }

  // ======================
  // Utility Methods
  // ======================

  async setAuthToken(token: string): Promise<void> {
    await tokenManager.setTokenInfo({ accessToken: token });
  }

  async removeAuthToken(): Promise<void> {
    await tokenManager.clearTokens();
  }

  async getAuthToken(): Promise<string | null> {
    return await tokenManager.getToken();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await tokenManager.getValidToken();
    return !!token;
  }

  // ======================
  // Reviews (확장)
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

  // OAuth 로그인 (Native 환경에서 사용)
  async oauthLogin(provider: 'kakao' | 'google' | 'apple' | 'naver', authCode: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(API_ENDPOINTS.OAUTH[provider.toUpperCase() as keyof typeof API_ENDPOINTS.OAUTH] as string, {
      method: 'POST',
      body: JSON.stringify({ authCode }),
    }, false);
    
    // Automatically store token on successful OAuth login
    if (response.token) {
      await tokenManager.setTokenInfo({
        accessToken: response.token,
        user: response.user,
      });
    }
    
    return response;
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
  // Enhanced Image Upload
  // ======================

  async getPresignedUrlEnhanced(request: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    return this.request<PresignedUrlResponse>(API_ENDPOINTS.UPLOAD.PRESIGNED_URL, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getUploadConfigEnhanced(): Promise<ImageUploadConfig> {
    return this.request<ImageUploadConfig>(API_ENDPOINTS.UPLOAD.CONFIG);
  }

  async notifyUploadComplete(images: string[], targetPath?: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/upload/complete', {
      method: 'POST',
      body: JSON.stringify({ images, targetPath }),
    });
  }

  // ======================
  // Native-specific features
  // ======================

  // Camera 및 갤러리 접근을 위한 권한 체크 (별도 파일에서 구현된 기능과 연동)
  async requestCameraPermission(): Promise<boolean> {
    // 이 기능은 별도의 permissions.ts에서 구현됨
    return true;
  }

  // 푸시 알림 토큰 등록
  async registerPushToken(token: string, platform: 'ios' | 'android'): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/notifications/register', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  }

  // QR 코드 생성
  async generateQRCode(data: string, options?: { size?: number; errorCorrectionLevel?: string }): Promise<ApiResponse<{ qrCodeUrl: string }>> {
    return this.request<ApiResponse<{ qrCodeUrl: string }>>(API_ENDPOINTS.QR.GENERATE, {
      method: 'POST',
      body: JSON.stringify({ data, options }),
    });
  }

  // ======================
  // Utility Methods (확장)
  // ======================

  // Token refresh method that can be called manually
  async refreshTokenIfNeeded(): Promise<boolean> {
    const token = await tokenManager.getValidToken();
    return !!token;
  }

  // 현재 사용자 정보 가져오기
  async getCurrentUser(): Promise<User | null> {
    return await tokenManager.getUser();
  }

  // Image upload helper using shared ImageUploadManager
  createImageUploadManager(): ImageUploadManager {
    return new ImageUploadManager(this.baseURL, () => this.getAuthHeaders());
  }

  // ======================
  // Seller Service Integration
  // ======================

  createSellerService(): BaseSellerService {
    return SellerServiceFactory.create(this.baseURL, () => this.getAuthHeaders());
  }

  // ======================
  // User Management Service Integration
  // ======================

  createUserManagementService(): BaseUserManagementService {
    return UserManagementServiceFactory.create(this.baseURL, () => this.getAuthHeaders());
  }

  // ======================
  // QR Service Integration
  // ======================

  createQRService(): BaseQRService {
    return QRServiceFactory.create(this.baseURL, () => this.getAuthHeaders());
  }

  // ======================
  // Payment Service Integration (Enhanced)
  // ======================

  createPaymentService(): BasePaymentService {
    return PaymentServiceFactory.create(this.baseURL, () => this.getAuthHeaders());
  }

  // ======================
  // Comprehensive Loyalty Service Integration
  // ======================

  createLoyaltyService(): BaseComprehensiveLoyaltyService {
    return ComprehensiveLoyaltyServiceFactory.create(this.baseURL, () => this.getAuthHeaders());
  }

  // 환경 정보 가져오기
  getEnvironmentInfo() {
    return {
      platform: 'react-native',
      baseURL: this.baseURL,
      timeout: this.timeout,
      debugEnabled: this.debugConfig.enableApiLogs,
      tokenManager: tokenManager.getEnvironmentInfo(),
    };
  }
}

export const apiService = new ApiService();