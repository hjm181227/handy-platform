import { BaseApiService } from '../base/BaseApiService';
import { ApiResponse, SellerApplication, DesignToolAccess } from '../../types';
import { API_ENDPOINTS } from '../../config/api';

// 어드민 전용 사용자 타입
export interface AdminUser {
  userUuid: string;
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin' | 'seller';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  designToolAccess?: DesignToolAccess;
}

// 사용자 목록 응답
export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
  };
}

// 사용자 상세 응답
export interface AdminUserDetailResponse {
  user: AdminUser;
  sellerInfo?: any;
  stats: {
    orderCount: number;
    totalSpent: number;
    wishlistCount: number;
    averageOrderValue: number;
  };
  recentOrders: Array<{
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
}

// 사용자 권한 변경 요청
export interface UserRoleUpdateRequest {
  role: 'user' | 'admin' | 'seller';
  sellerInfo?: {
    brandName?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
}

// 사용자 정보 업데이트 요청
export interface UserUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'seller';
  isActive?: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

// 대시보드 데이터
export interface AdminDashboardData {
  stats: {
    totalUsers: number;
    totalOrders: number;
    totalProducts: number;
    totalRevenue: number;
    thisMonthRevenue: number;
    pendingOrders: number;
    lowStockProducts: number;
  };
  topSellingProducts: Array<{
    _id: string;
    totalSold: number;
    revenue: number;
    product: {
      name: string;
      price: number;
    };
  }>;
}

// 어드민 주문 목록 항목 (서버 GET /api/admin/orders 응답: Order 문서 + user)
export interface AdminOrderListItem {
  _id: string;
  orderUuid?: string;
  orderNumber: string;
  userUuid: string;
  user: { name: string; email: string } | null;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  totalAmount: number;
  items: Array<{
    productType?: string;
    productUuid?: string;
    productName: string;
    sellerName?: string;
    sellerUuid?: string;
    productImage?: string;
    shape?: string;
    size?: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress?: {
    recipientName?: string;
    recipientPhone?: string;
    postcode?: string;
    roadAddress?: string;
    detailAddress?: string;
    [key: string]: any;
  };
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrdersListResponse {
  orders: AdminOrderListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
  };
}

// 어드민 상품 목록 항목 (서버 GET /api/admin/products 응답: Product 문서)
export interface AdminProductListItem {
  _id: string;
  productUuid?: string;
  productId?: string;
  name: string;
  description?: string;
  brand?: string;
  sku?: string;
  price: number;
  salePrice?: number;
  mainImageUrl?: string;
  stockQuantity?: number;
  isInStock?: boolean;
  status?: 'active' | 'inactive' | 'draft' | 'out_of_stock';
  isFeatured?: boolean;
  sellerId?: string;
  sellerUuid?: string;
  rating?: { average: number; count: number };
  stats?: { viewsCount?: number; ordersCount?: number; reviewsCount?: number };
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface AdminProductsListResponse {
  products: AdminProductListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
  };
}

// SellerApplication은 types/index.ts에서 import

export interface SellerApplicationDetail extends Omit<SellerApplication, 'verificationDocuments'> {
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  verificationDocuments: Array<{
    type: string;
    url: string;
    uploadedAt: string;
  }>;
  isVerified: boolean;
  isActive: boolean;
  commission: number;
  verificationNote?: string;
  auditLogs?: SellerApplicationAuditLog[];
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    averageRating: number;
    responseRate: number;
    fulfillmentRate: number;
    lastActiveAt: string;
  };
}

export interface SellerApplicationListResponse {
  success: boolean;
  items: SellerApplication[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SellerApplicationAuditLog {
  auditUuid: string;
  action: 'approved' | 'rejected';
  previousStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  nextStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  previousCommission?: number;
  nextCommission?: number;
  verificationNote?: string;
  rejectionReason?: string;
  actor: {
    userUuid: string;
    userId: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
}

export interface SellerApplicationDetailResponse {
  success: boolean;
  data: SellerApplicationDetail;
}

export abstract class BaseAdminService extends BaseApiService {
  
  // === 사용자 관리 ===
  
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'user' | 'admin' | 'seller';
    isActive?: boolean;
  } = {}): Promise<AdminUsersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const url = `${API_ENDPOINTS.ADMIN.USERS}?${queryParams.toString()}`;
    return this.request<AdminUsersResponse>(url);
  }

  async getUserDetail(userId: string): Promise<AdminUserDetailResponse> {
    return this.request<AdminUserDetailResponse>(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`);
  }

  async updateUserRole(userId: string, data: UserRoleUpdateRequest): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`${API_ENDPOINTS.ADMIN.USERS}/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateUser(userId: string, data: UserUpdateRequest): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.USER_STATUS(userId), {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`, {
      method: 'DELETE',
    });
  }

  // === 판매자 관리 ===
  
  async getSellers(params: {
    page?: number;
    limit?: number;
    search?: string;
    isVerified?: boolean;
  } = {}): Promise<AdminUsersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.isVerified !== undefined) queryParams.append('isVerified', params.isVerified.toString());
    
    const url = `${API_ENDPOINTS.ADMIN.SELLERS}?${queryParams.toString()}`;
    return this.request<AdminUsersResponse>(url);
  }

  async verifySeller(sellerId: string, isVerified: boolean, note?: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.SELLER_VERIFY(sellerId), {
      method: 'PATCH',
      body: JSON.stringify({ isVerified, note }),
    });
  }

  async getSellerDetail(sellerId: string): Promise<any> {
    return this.request<any>(API_ENDPOINTS.ADMIN.SELLER_DETAIL(sellerId));
  }

  // === 대시보드 ===
  
  async getDashboard(): Promise<AdminDashboardData> {
    return this.request<AdminDashboardData>(API_ENDPOINTS.ADMIN.DASHBOARD);
  }

  /** 대시보드 집계 (GET /api/admin/dashboard) — 총 회원/주문/상품/매출 등 */
  async getDashboardStats(): Promise<AdminDashboardData> {
    return this.getDashboard();
  }

  // === 주문 관리 ===
  
  async getOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const url = `${API_ENDPOINTS.ADMIN.ORDERS}?${queryParams.toString()}`;
    return this.request<any>(url);
  }

  /**
   * 전체 주문 목록 (GET /api/admin/orders)
   * - search: 주문번호(orderNumber) 부분 일치 검색만 지원 (서버 스펙)
   * - 응답: { orders: [...(user: {name,email}|null 포함)], pagination }
   */
  async getAllOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<AdminOrdersListResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.ADMIN.ORDERS}?${queryParams.toString()}`;
    return this.request<AdminOrdersListResponse>(url);
  }

  async updateOrderStatus(orderId: string, data: {
    status: string;
    note?: string;
    trackingNumber?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.ORDER_STATUS(orderId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // === 상품 관리 ===
  
  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const url = `${API_ENDPOINTS.ADMIN.PRODUCTS}?${queryParams.toString()}`;
    return this.request<any>(url);
  }

  /**
   * 전체 상품 목록 (GET /api/admin/products)
   * - search: 상품명(name)/SKU 부분 일치 검색 (서버 스펙)
   * - 응답: { products: [...], pagination }
   */
  async getAllProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<AdminProductsListResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.ADMIN.PRODUCTS}?${queryParams.toString()}`;
    return this.request<AdminProductsListResponse>(url);
  }

  async updateProductStock(productId: string, stock: number): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.PRODUCT_STOCK(productId), {
      method: 'PUT',
      body: JSON.stringify({ stock }),
    });
  }

  async updateProductFeatured(productId: string, isFeatured: boolean): Promise<ApiResponse<any>> {
    // 서버(PUT /api/admin/products/:id/featured)는 body 필드명을 `featured`로 검증한다
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.PRODUCT_FEATURED(productId), {
      method: 'PUT',
      body: JSON.stringify({ featured: isFeatured }),
    });
  }

  // === 분석 및 통계 ===
  
  async getSalesAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<any> {
    return this.request<any>(`${API_ENDPOINTS.ADMIN.ANALYTICS_SALES}?period=${period}`);
  }

  async getProductAnalytics(): Promise<any> {
    return this.request<any>(API_ENDPOINTS.ADMIN.ANALYTICS_PRODUCTS);
  }

  // === 판매자 신청 관리 ===
  
  async getSellerApplications(params: {
    page?: number;
    limit?: number;
    status?: 'draft' | 'pending' | 'approved' | 'rejected';
    search?: string;
    sortBy?: 'created' | 'updated' | 'brandName';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<SellerApplicationListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const url = `/api/admin/seller-applications?${queryParams.toString()}`;
    return this.request<SellerApplicationListResponse>(url);
  }

  async getSellerApplicationDetail(sellerInfoId: string): Promise<SellerApplicationDetailResponse> {
    return this.request<SellerApplicationDetailResponse>(`/api/admin/seller-applications/${sellerInfoId}`);
  }

  async getSellerDocumentAccessUrl(documentUrl: string): Promise<string> {
    const response = await this.request<{ success: boolean; data: { url: string } }>(
      `/api/upload/seller-document/access?url=${encodeURIComponent(documentUrl)}`
    );
    return response.data.url;
  }

  async approveSellerApplication(
    sellerInfoId: string,
    data: { verificationNote?: string; commission?: number } = {}
  ): Promise<ApiResponse<{
    sellerInfoId: string;
    userId: string;
    status: string;
    approvedAt: string;
  }>> {
    return this.request<ApiResponse<any>>(`/api/admin/seller-applications/${sellerInfoId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rejectSellerApplication(
    sellerInfoId: string,
    rejectionReason: string,
    verificationNote?: string
  ): Promise<ApiResponse<{
    sellerInfoId: string;
    userId: string;
    status: string;
    rejectionReason: string;
    rejectedAt: string;
  }>> {
    return this.request<ApiResponse<any>>(`/api/admin/seller-applications/${sellerInfoId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason, verificationNote }),
    });
  }

  // === 카테고리 관리 ===

  async getCategories(params: {
    page?: number;
    limit?: number;
    type?: string;
    isActive?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.ADMIN.CATEGORIES_LIST}?${queryParams.toString()}`;
    return this.request<any>(url);
  }

  async createCategory(data: {
    type: string;
    name: string;
    value: string;
    iconUrl?: string;
    hexColor?: string;
    description?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.CATEGORIES_CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(
    categoryId: string,
    data: {
      name?: string;
      value?: string;
      iconUrl?: string;
      hexColor?: string;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.CATEGORIES_UPDATE(categoryId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleCategory(categoryId: string, isActive: boolean): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.CATEGORIES_TOGGLE(categoryId), {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  async deleteCategory(categoryId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.CATEGORIES_DELETE(categoryId), {
      method: 'DELETE',
    });
  }

  // === 이벤트 배너 관리 ===

  async getBanners(params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.ADMIN.EVENT_BANNERS_LIST}?${queryParams.toString()}`;
    return this.request<any>(url);
  }

  async createBanner(data: {
    title: string;
    description?: string;
    imageUrl: string;
    redirectUrl?: string;
    brands?: string[];
    categories?: string[];
    displayOrder?: number;
    startDate?: string;
    endDate?: string;
    detailImages?: Array<{ imageUrl: string; imageS3Key?: string; displayOrder: number }>;
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.EVENT_BANNERS_CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBanner(
    bannerId: string,
    data: {
      title?: string;
      description?: string;
      imageUrl?: string;
      redirectUrl?: string;
      brands?: string[];
      categories?: string[];
      displayOrder?: number;
      startDate?: string;
      endDate?: string;
      isActive?: boolean;
      detailImages?: Array<{ imageUrl: string; imageS3Key?: string; displayOrder: number }>;
    }
  ): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.EVENT_BANNERS_UPDATE(bannerId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleBanner(bannerId: string, isActive: boolean): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.EVENT_BANNERS_TOGGLE(bannerId), {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  async deleteBanner(bannerId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.EVENT_BANNERS_DELETE(bannerId), {
      method: 'DELETE',
    });
  }

  // === 스냅 관리 ===

  async getAdminSnaps(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    const url = `${API_ENDPOINTS.ADMIN.SNAPS_LIST}?${queryParams.toString()}`;
    return this.request<any>(url);
  }

  async updateSnapStatus(snapUuid: string, status: string): Promise<any> {
    return this.request<any>(API_ENDPOINTS.ADMIN.SNAPS_STATUS(snapUuid), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteAdminSnap(snapUuid: string): Promise<any> {
    return this.request<any>(API_ENDPOINTS.ADMIN.SNAPS_DELETE(snapUuid), {
      method: 'DELETE',
    });
  }

  // === 쿠폰 관리 ===

  async getCoupons(params: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive';
    // 서버(routes/adminCoupons.ts)가 읽는 쿼리 키는 scopeType 이다
    scopeType?: 'platform' | 'seller';
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<{
    coupons: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  }>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.ADMIN.COUPONS}?${queryParams.toString()}`;
    return this.request<ApiResponse<any>>(url);
  }

  async getCouponDetail(couponId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.COUPON_DETAIL(couponId));
  }

  async createCoupon(data: {
    name: string;
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
    discountValue: number;
    maxDiscountAmount?: number;
    minimumOrderAmount?: number;
    scope: { type: 'platform' | 'seller'; sellerUuid?: string };
    appliesTo: 'product' | 'quote' | 'both';
    validity: { startDate: string; endDate: string };
    limits: { totalCount: number; perUserLimit: number };
    isPublic: boolean;
    issueMethod?: 'auto' | 'claim' | 'code' | 'manual';
    autoTrigger?: 'signup' | 'first_purchase' | 'birthday';
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.COUPON_CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCoupon(couponId: string, data: Partial<{
    name: string;
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
    discountValue: number;
    maxDiscountAmount?: number;
    minimumOrderAmount?: number;
    scope: { type: 'platform' | 'seller'; sellerUuid?: string };
    appliesTo: 'product' | 'quote' | 'both';
    validity: { startDate: string; endDate: string };
    limits: { totalCount: number; perUserLimit: number };
    isPublic: boolean;
    isActive: boolean;
    issueMethod?: 'auto' | 'claim' | 'code' | 'manual';
    autoTrigger?: 'signup' | 'first_purchase' | 'birthday';
  }>): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.COUPON_UPDATE(couponId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCoupon(couponId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.COUPON_DELETE(couponId), {
      method: 'DELETE',
    });
  }

  async getCouponStats(): Promise<ApiResponse<{
    overview: {
      totalCoupons: number;
      activeCoupons: number;
      publicCoupons: number;
      inactiveCoupons: number;
      totalUsages: number;
      totalDiscountAmount: number;
      uniqueUsers: number;
      totalDownloads: number;
      conversionRate: number;
    };
  }>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.COUPON_STATS);
  }
}

export class AdminServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseAdminService {
    return new (class extends BaseAdminService {})(baseURL, getAuthHeaders);
  }
}
