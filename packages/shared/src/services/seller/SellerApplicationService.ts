import { BaseApiService } from '../base/BaseApiService';
import { ApiResponse } from '../../types';
import { API_ENDPOINTS } from '../../config/api';

// 판매자 신청 데이터 타입
export interface SellerApplicationData {
  brandName: string;
  representativeName?: string;
  businessNumber: string;
  businessType?: string;
  businessCategory?: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  verificationDocuments?: Array<{
    type: string;
    url: string;
  }>;
}

// 판매자 신청 응답
export interface SellerApplicationResponse {
  message: string;
  user: any;
}

// 내 신청 상태 응답
export interface MyApplicationStatusResponse {
  hasApplication: boolean;
  application?: {
    sellerInfoId: string;
    status: 'pending' | 'approved' | 'rejected';
    brandName: string;
    createdAt: string;
    updatedAt: string;
    rejectionReason?: string;
    verificationNote?: string;
  };
}

export abstract class BaseSellerApplicationService extends BaseApiService {
  /**
   * 판매자 신청 제출
   */
  async submitApplication(data: SellerApplicationData): Promise<ApiResponse<SellerApplicationResponse>> {
    return this.request<ApiResponse<SellerApplicationResponse>>('/api/seller/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 내 신청 상태 조회
   */
  async getMyApplicationStatus(): Promise<ApiResponse<MyApplicationStatusResponse>> {
    return this.request<ApiResponse<MyApplicationStatusResponse>>('/api/seller/application-status');
  }

  /**
   * 신청 취소 (pending 상태일 때만)
   */
  async cancelApplication(): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>('/api/seller/cancel-application', {
      method: 'DELETE',
    });
  }

  /**
   * 신청 정보 수정 (pending 상태일 때만)
   */
  async updateApplication(data: Partial<SellerApplicationData>): Promise<ApiResponse<SellerApplicationResponse>> {
    return this.request<ApiResponse<SellerApplicationResponse>>('/api/seller/update-application', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

// 팩토리 함수
export class SellerApplicationServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseSellerApplicationService {
    return new (class extends BaseSellerApplicationService {})(baseURL, getAuthHeaders);
  }
}