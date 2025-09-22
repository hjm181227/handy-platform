import { BaseApiService } from '../base/BaseApiService';
import { ApiResponse } from '../../types';
import { API_ENDPOINTS } from '../../config/api';

// 어드민 전용 사용자 타입
export interface AdminUser {
  id: string;
  userId: string;
  userUuid: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin' | 'seller';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

  async updateProductStock(productId: string, stock: number): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.PRODUCT_STOCK(productId), {
      method: 'PUT',
      body: JSON.stringify({ stock }),
    });
  }

  async updateProductFeatured(productId: string, isFeatured: boolean): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(API_ENDPOINTS.ADMIN.PRODUCT_FEATURED(productId), {
      method: 'PUT',
      body: JSON.stringify({ isFeatured }),
    });
  }

  // === 분석 및 통계 ===
  
  async getSalesAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<any> {
    return this.request<any>(`${API_ENDPOINTS.ADMIN.ANALYTICS_SALES}?period=${period}`);
  }

  async getProductAnalytics(): Promise<any> {
    return this.request<any>(API_ENDPOINTS.ADMIN.ANALYTICS_PRODUCTS);
  }
}

export class AdminServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseAdminService {
    return new (class extends BaseAdminService {})(baseURL, getAuthHeaders);
  }
}