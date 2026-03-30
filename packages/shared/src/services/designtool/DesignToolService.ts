import { BaseApiService } from '../base/BaseApiService';
import {
  ApiResponse,
  DesignToolPlan,
  DesignToolAccess,
  DesignToolSubscribeRequest,
  DesignToolSubscribeResponse,
  DesignToolPlanId,
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseDesignToolService extends BaseApiService {
  // 현재 유저의 디자인 툴 접근 상태 조회
  async getAccess(): Promise<ApiResponse<{ access: DesignToolAccess }>> {
    return this.request<ApiResponse<{ access: DesignToolAccess }>>(API_ENDPOINTS.DESIGN_TOOL.ACCESS);
  }

  // 이용 가능한 플랜 목록 조회
  async getPlans(): Promise<ApiResponse<{ plans: DesignToolPlan[] }>> {
    return this.request<ApiResponse<{ plans: DesignToolPlan[] }>>(API_ENDPOINTS.DESIGN_TOOL.PLANS);
  }

  // 구독 시작
  async subscribe(request: DesignToolSubscribeRequest): Promise<DesignToolSubscribeResponse> {
    return this.request<DesignToolSubscribeResponse>(API_ENDPOINTS.DESIGN_TOOL.SUBSCRIBE, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 구독 취소
  async cancelSubscription(): Promise<ApiResponse<{ subscription: DesignToolAccess }>> {
    return this.request<ApiResponse<{ subscription: DesignToolAccess }>>(API_ENDPOINTS.DESIGN_TOOL.CANCEL, {
      method: 'POST',
    });
  }

  // 플랜 변경
  async changePlan(planId: DesignToolPlanId): Promise<DesignToolSubscribeResponse> {
    return this.request<DesignToolSubscribeResponse>(API_ENDPOINTS.DESIGN_TOOL.CHANGE_PLAN, {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  // 결제 승인 (Toss 결제 완료 후 호출)
  async approveSubscription(data: {
    paymentKey: string;
    orderId: string;
    amount: number;
  }): Promise<DesignToolSubscribeResponse> {
    return this.request<DesignToolSubscribeResponse>(API_ENDPOINTS.DESIGN_TOOL.APPROVE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 빌링키 발급 및 첫 결제 확인 (정기구독)
  async confirmBilling(data: {
    authKey: string;
    customerKey: string;
    orderId: string;
  }): Promise<DesignToolSubscribeResponse> {
    return this.request<DesignToolSubscribeResponse>(API_ENDPOINTS.DESIGN_TOOL.BILLING_CONFIRM, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 관리자: 유저 디자인 툴 접근 관리
  async adminUpdateAccess(userUuid: string, data: {
    hasAccess?: boolean;
    currentPlan?: DesignToolPlanId;
    subscriptionStatus?: string;
  }): Promise<ApiResponse<{ access: DesignToolAccess }>> {
    return this.request<ApiResponse<{ access: DesignToolAccess }>>(API_ENDPOINTS.DESIGN_TOOL.ADMIN_ACCESS(userUuid), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export class DesignToolServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseDesignToolService {
    return new (class extends BaseDesignToolService {})(baseURL, getAuthHeaders);
  }
}
