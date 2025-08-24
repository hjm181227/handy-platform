import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  UserCoupon,
  Coupon,
  UserPointsInfo,
  PointTransaction,
  PaginationInfo
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseLoyaltyService extends BaseApiService {
  // 쿠폰 관련
  async getUserCoupons(filters: {
    status?: 'available' | 'used' | 'expired';
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<{
    coupons: UserCoupon[];
    pagination: PaginationInfo;
    summary: {
      total: number;
      available: number;
      used: number;
      expired: number;
    };
  }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.COUPONS.USER_COUPONS}?${queryString}` : API_ENDPOINTS.COUPONS.USER_COUPONS;
    return this.request(endpoint);
  }

  async getAvailableCoupons(filters: {
    orderAmount?: number;
    productIds?: string;
    category?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<ApiResponse<{
    coupons: Array<{
      id: string;
      coupon: Coupon;
      discountAmount: number;
      finalAmount: number;
      savings: number;
    }>;
    orderAmount?: number;
    bestSavings?: number;
  }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.COUPONS.AVAILABLE}?${queryString}` : API_ENDPOINTS.COUPONS.AVAILABLE;
    return this.request(endpoint);
  }

  async getPublicCoupons(filters: {
    page?: number;
    limit?: number;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<ApiResponse<{
    coupons: Coupon[];
    pagination: PaginationInfo;
  }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.COUPONS.PUBLIC}?${queryString}` : API_ENDPOINTS.COUPONS.PUBLIC;
    return this.request(endpoint);
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

  // 포인트 관련
  async getPointsBalance(): Promise<ApiResponse<{ points: UserPointsInfo }>> {
    return this.request<ApiResponse<{ points: UserPointsInfo }>>(API_ENDPOINTS.POINTS.BALANCE);
  }

  async getPointsHistory(filters: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<ApiResponse<{
    transactions: PointTransaction[];
    pagination: PaginationInfo;
    summary: {
      totalEarned: number;
      totalUsed: number;
      netPoints: number;
      transactionCount: number;
    };
  }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.POINTS.HISTORY}?${queryString}` : API_ENDPOINTS.POINTS.HISTORY;
    return this.request(endpoint);
  }

  async usePoints(orderId: string, amount: number, description?: string): Promise<ApiResponse<{
    transaction: PointTransaction;
    newBalance: number;
  }>> {
    return this.request<ApiResponse<{
      transaction: PointTransaction;
      newBalance: number;
    }>>(API_ENDPOINTS.POINTS.USE, {
      method: 'POST',
      body: JSON.stringify({ orderId, amount, description }),
    });
  }

  async getExpiringPoints(days = 30): Promise<ApiResponse<{
    totalAmount: number;
    count: number;
    points: Array<{
      id: string;
      amount: number;
      expiresAt: string;
      daysUntilExpiry: number;
      originalTransaction: PointTransaction;
    }>;
  }>> {
    return this.request(`${API_ENDPOINTS.POINTS.EXPIRING}?days=${days}`);
  }

  // 회원 등급 관련
  async getUserTier(): Promise<ApiResponse<{
    currentTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    progress: {
      currentSpent: number;
      currentOrders: number;
      nextTierRequirements: {
        minSpent: number;
        minOrders: number;
      };
    };
    benefits: {
      pointBonus: number;
      description: string;
    };
    stats: {
      totalOrders: number;
      totalSpent: number;
      averageOrderValue: number;
    };
  }>> {
    return this.request(API_ENDPOINTS.POINTS.TIER);
  }

  // 포인트 정책 조회
  async getPointsPolicy(): Promise<ApiResponse<{
    earning: {
      purchaseRate: number;
      reviewPoints: number;
      signupPoints: number;
      referralPoints: number;
      tierBonus: Record<string, number>;
    };
    usage: {
      minUsagePoints: number;
      maxUsagePercent: number;
      usageUnit: number;
    };
    expiry: {
      defaultExpiryDays: number;
      expiryWarningDays: number;
    };
    tierUpgrade: Record<string, {
      minSpent: number;
      minOrders: number;
    }>;
  }>> {
    return this.request(API_ENDPOINTS.POINTS.POLICY);
  }
}

export class LoyaltyServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseLoyaltyService {
    return new (class extends BaseLoyaltyService {})(baseURL, getAuthHeaders);
  }
}