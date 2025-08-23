import { ApiResponse, Coupon, UserCoupon, PointTransaction, UserPointsInfo } from '../types';
import { API_ENDPOINTS } from '../config/api';
import { handleApiResponse } from '../utils/apiHelpers';

export interface CouponDownloadRequest {
  couponCode?: string;
  couponId?: string;
}

export interface CouponRedeemRequest {
  code: string;
}

export interface CouponValidationRequest {
  couponId: string;
  orderId?: string;
  orderAmount?: number;
  categoryIds?: string[];
}

export interface CouponValidationResponse {
  isValid: boolean;
  discount: {
    type: 'percentage' | 'fixed_amount';
    value: number;
    maxDiscount?: number;
  };
  reason?: string;
}

export interface PointsUseRequest {
  amount: number;
  orderId: string;
  description?: string;
}

export interface PointsEarnRequest {
  type: 'purchase' | 'review' | 'signup' | 'referral' | 'admin_adjust';
  amount: number;
  orderId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export class BaseComprehensiveLoyaltyService {
  protected baseURL: string;
  protected getAuthHeaders: () => Promise<Record<string, string>>;

  constructor(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>) {
    this.baseURL = baseURL;
    this.getAuthHeaders = getAuthHeaders;
  }

  // === 쿠폰 관리 ===

  // 사용자 쿠폰 목록 조회 (확장)
  async getUserCoupons(params?: {
    status?: 'available' | 'used' | 'expired';
    page?: number;
    limit?: number;
    sortBy?: 'acquiredAt' | 'expiresAt' | 'value';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    coupons: UserCoupon[];
    pagination: any;
    summary: {
      totalAvailable: number;
      totalUsed: number;
      totalExpired: number;
      totalValue: number;
    };
  }>> {
    const headers = await this.getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseURL}${API_ENDPOINTS.COUPONS.USER_COUPONS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 쿠폰 다운로드
  async downloadCoupon(request: CouponDownloadRequest): Promise<ApiResponse<{
    userCoupon: UserCoupon;
    message: string;
  }>> {
    const headers = await this.getAuthHeaders();
    
    const couponId = request.couponId;
    if (!couponId) {
      throw new Error('Coupon ID is required');
    }

    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.COUPONS.DOWNLOAD(couponId)}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    return handleApiResponse(response);
  }

  // 쿠폰 코드로 등록
  async redeemCoupon(request: CouponRedeemRequest): Promise<ApiResponse<{
    userCoupon: UserCoupon;
    message: string;
  }>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.COUPONS.REDEEM}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return handleApiResponse(response);
  }

  // 사용 가능한 공개 쿠폰 목록 조회
  async getAvailableCoupons(params?: {
    category?: string;
    minOrderAmount?: number;
    newUsersOnly?: boolean;
  }): Promise<ApiResponse<{
    coupons: Coupon[];
    featured: Coupon[];
  }>> {
    const headers = await this.getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseURL}${API_ENDPOINTS.COUPONS.AVAILABLE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 공개 쿠폰 목록 조회 (비로그인 사용자용)
  async getPublicCoupons(): Promise<ApiResponse<Coupon[]>> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.COUPONS.PUBLIC}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleApiResponse(response);
  }

  // 쿠폰 유효성 검증
  async validateCoupon(request: CouponValidationRequest): Promise<ApiResponse<CouponValidationResponse>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}/api/coupons/validate`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return handleApiResponse(response);
  }

  // === 포인트 관리 ===

  // 포인트 잔액 및 상세 정보 조회 (확장)
  async getPointsInfo(): Promise<ApiResponse<UserPointsInfo>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.POINTS.BALANCE}`, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 포인트 사용 내역 조회 (확장)
  async getPointsHistory(params?: {
    type?: PointTransaction['type'];
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    transactions: PointTransaction[];
    pagination: any;
    summary: {
      totalEarned: number;
      totalUsed: number;
      totalExpired: number;
      periodEarned: number;
      periodUsed: number;
    };
  }>> {
    const headers = await this.getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseURL}${API_ENDPOINTS.POINTS.HISTORY}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 포인트 사용
  async usePoints(request: PointsUseRequest): Promise<ApiResponse<{
    transaction: PointTransaction;
    newBalance: number;
  }>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.POINTS.USE}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return handleApiResponse(response);
  }

  // 만료 예정 포인트 조회 (확장)
  async getExpiringPoints(days?: number): Promise<ApiResponse<{
    expiringPoints: Array<{
      amount: number;
      expiresAt: string;
      daysUntilExpiry: number;
      earnedFrom: string;
    }>;
    totalAmount: number;
    nextExpiring: {
      amount: number;
      expiresAt: string;
      daysUntilExpiry: number;
    };
  }>> {
    const headers = await this.getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (days !== undefined) {
      queryParams.append('days', days.toString());
    }

    const url = `${this.baseURL}${API_ENDPOINTS.POINTS.EXPIRING}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 사용자 등급 정보 조회 (확장)
  async getUserTier(): Promise<ApiResponse<{
    currentTier: UserPointsInfo['tier'];
    progress: UserPointsInfo['tierProgress'];
    benefits: {
      pointMultiplier: number;
      exclusiveCoupons: boolean;
      freeShipping: boolean;
      prioritySupport: boolean;
      specialEvents: boolean;
    };
    nextTierBenefits?: {
      pointMultiplier: number;
      exclusiveCoupons: boolean;
      freeShipping: boolean;
      prioritySupport: boolean;
      specialEvents: boolean;
    };
  }>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.POINTS.TIER}`, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 포인트 정책 조회 (공개 API)
  async getPointsPolicy(): Promise<ApiResponse<{
    earnRates: {
      purchase: number; // 구매 시 적립률 (%)
      review: number;   // 리뷰 작성 시 포인트
      signup: number;   // 회원가입 시 포인트
      referral: number; // 추천인 포인트
    };
    usageRules: {
      minUseAmount: number;
      maxUsePercentage: number;
      minOrderAmount: number;
    };
    expiration: {
      defaultMonths: number;
      tierExceptions: Record<string, number>;
    };
    tierSystem: {
      tiers: Array<{
        name: string;
        minSpent: number;
        minOrders: number;
        benefits: Record<string, any>;
      }>;
    };
  }>> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.POINTS.POLICY}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleApiResponse(response);
  }

  // === 편의 메서드들 ===

  // 주문에 적용 가능한 쿠폰 찾기
  async getApplicableCouponsForOrder(
    orderAmount: number,
    categoryIds?: string[]
  ): Promise<ApiResponse<{
    applicableCoupons: UserCoupon[];
    bestDiscount?: {
      coupon: UserCoupon;
      discount: number;
    };
  }>> {
    const userCouponsResponse = await this.getUserCoupons({ status: 'available' });
    
    if (!userCouponsResponse.data) {
      return { data: { applicableCoupons: [] } };
    }

    const applicableCoupons = userCouponsResponse.data.coupons.filter(userCoupon => {
      const coupon = userCoupon.coupon;
      
      // 최소 주문 금액 체크
      if (coupon.conditions.minOrderAmount && orderAmount < coupon.conditions.minOrderAmount) {
        return false;
      }
      
      // 적용 카테고리 체크
      if (coupon.conditions.applicableCategories && categoryIds) {
        const hasApplicableCategory = coupon.conditions.applicableCategories.some(
          cat => categoryIds.includes(cat)
        );
        if (!hasApplicableCategory) {
          return false;
        }
      }
      
      return userCoupon.isUsable;
    });

    let bestDiscount: { coupon: UserCoupon; discount: number } | undefined;
    
    applicableCoupons.forEach(userCoupon => {
      const coupon = userCoupon.coupon;
      let discount = 0;
      
      if (coupon.discountType === 'percentage') {
        discount = orderAmount * (coupon.discountValue / 100);
        if (coupon.maxDiscountAmount) {
          discount = Math.min(discount, coupon.maxDiscountAmount);
        }
      } else {
        discount = Math.min(coupon.discountValue, orderAmount);
      }
      
      if (!bestDiscount || discount > bestDiscount.discount) {
        bestDiscount = { coupon: userCoupon, discount };
      }
    });

    return {
      data: {
        applicableCoupons,
        bestDiscount,
      },
    };
  }

  // 사용 가능한 포인트 계산 (주문 금액 기준)
  async getUsablePoints(orderAmount: number): Promise<ApiResponse<{
    availablePoints: number;
    maxUsablePoints: number;
    recommendedUse: number;
    savings: number;
  }>> {
    const pointsInfo = await this.getPointsInfo();
    const policy = await this.getPointsPolicy();
    
    if (!pointsInfo.data || !policy.data) {
      return { data: { availablePoints: 0, maxUsablePoints: 0, recommendedUse: 0, savings: 0 } };
    }

    const availablePoints = pointsInfo.data.balance;
    const usageRules = policy.data.usageRules;
    
    // 최소 주문 금액 체크
    if (orderAmount < usageRules.minOrderAmount) {
      return { 
        data: { 
          availablePoints, 
          maxUsablePoints: 0, 
          recommendedUse: 0, 
          savings: 0 
        } 
      };
    }

    // 최대 사용 가능 포인트 계산
    const maxByPercentage = Math.floor(orderAmount * (usageRules.maxUsePercentage / 100));
    const maxUsablePoints = Math.min(availablePoints, maxByPercentage);
    
    // 권장 사용량 (최대 사용량의 80%)
    const recommendedUse = Math.floor(maxUsablePoints * 0.8);
    
    return {
      data: {
        availablePoints,
        maxUsablePoints,
        recommendedUse,
        savings: recommendedUse,
      },
    };
  }
}

// 종합 로열티 서비스 팩토리
export class ComprehensiveLoyaltyServiceFactory {
  static create(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>
  ): BaseComprehensiveLoyaltyService {
    return new BaseComprehensiveLoyaltyService(baseURL, getAuthHeaders);
  }
}