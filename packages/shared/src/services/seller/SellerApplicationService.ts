import { BaseApiService } from '../base/BaseApiService';
import { ApiResponse, SellerApplication } from '../../types';
import { API_ENDPOINTS } from '../../config/api';

// 판매자 신청 데이터 타입
export interface SellerApplicationData {
  brandName: string;
  representativeName?: string;
  businessNumber: string;
  mailOrderSalesNumber?: string; // 통신판매업 신고번호 (선택, 예: 2024-용인기흥-2437)
  businessType?: string;
  businessCategory?: string;
  businessSector?: string;
  contactEmail: string;
  contactPhone: string;
  address?: {
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
  acceptsCustomOrders?: boolean;
}

export interface SellerApplicationStatus {
  exists: boolean;
  sellerInfoId?: string;
  status: 'not_started' | 'draft' | 'pending' | 'approved' | 'rejected';
  progress: number;
  isComplete: boolean;
  missingFields: string[];
  rejectionReason?: string;
  verificationNote?: string;
  submittedAt?: string;
  approvedAt?: string;
  updatedAt?: string;
}

export interface SellerApplicationDraftDetail extends SellerApplicationStatus {
  application: SellerApplicationData & { sellerInfoId: string };
}

// 판매자 신청 응답
export interface SellerApplicationResponse {
  message: string;
  user: any;
}

// 내 신청 상태 응답 (서버 실제 응답 구조)
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

// 판매자 정보 API 응답 (실제 서버 응답 구조)
export interface SellerInfoResponse {
  user: {
    userId: string;
    role: string;
    name: string;
  };
  sellerInfo: SellerApplication | null;
  hasSellerInfo: boolean;
}

export abstract class BaseSellerApplicationService extends BaseApiService {
  /**
   * 판매자 신청 제출
   */
  async submitApplication(data: SellerApplicationData): Promise<ApiResponse<SellerApplicationResponse>> {
    await this.saveDraft(data);
    return this.request<ApiResponse<SellerApplicationResponse>>('/api/seller/application/submit', {
      method: 'POST',
    });
  }

  /**
   * 내 신청 상태 조회
   */
  async getMyApplicationStatus(): Promise<ApiResponse<SellerApplicationStatus>> {
    return this.request<ApiResponse<SellerApplicationStatus>>('/api/seller/application/status');
  }

  async getMyApplication(): Promise<ApiResponse<SellerApplicationDraftDetail>> {
    return this.request<ApiResponse<SellerApplicationDraftDetail>>('/api/seller/application');
  }

  async saveDraft(data: Partial<SellerApplicationData>): Promise<ApiResponse<SellerApplicationStatus>> {
    const { address, ...rest } = data;
    return this.request<ApiResponse<SellerApplicationStatus>>('/api/seller/application/draft', {
      method: 'PUT',
      body: JSON.stringify({ ...rest, businessAddress: data.businessAddress || address }),
    });
  }

  async submitSavedApplication(): Promise<ApiResponse<SellerApplicationStatus>> {
    return this.request<ApiResponse<SellerApplicationStatus>>('/api/seller/application/submit', {
      method: 'POST',
    });
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
    return this.saveDraft(data) as unknown as Promise<ApiResponse<SellerApplicationResponse>>;
  }
}

// 팩토리 함수
export class SellerApplicationServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseSellerApplicationService {
    return new (class extends BaseSellerApplicationService {})(baseURL, getAuthHeaders);
  }
}
