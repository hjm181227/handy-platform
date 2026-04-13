import { BaseApiService } from '../base/BaseApiService';
import {
  DesignToolPlan,
  DesignToolPlanId,
  DesignToolSubscribeRequest,
  DesignToolSubscribeResponse,
  SubscriptionState,
  DesignToolPaymentRecord,
  AdminSubscriptionSummary,
  AdminSubscriptionListQuery,
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

const DT = API_ENDPOINTS.DESIGN_TOOL;

/**
 * 공통 wrap 응답 형태.
 * backend는 모든 디자인툴 endpoint에서 `{ success, ...payload }` 구조로 응답한다.
 * mutation(POST)에는 `correlationId`가 함께 온다.
 */
interface WrapResponse {
  success: boolean;
  message?: string;
  error?: string;
  correlationId?: string;
}

export interface PlansResponse extends WrapResponse {
  plans?: DesignToolPlan[];
}

export interface SubscriptionResponse extends WrapResponse {
  subscription?: SubscriptionState;
}

/** change-plan은 free→pro 승급 시 paymentSession을 추가로 반환한다. */
export interface ChangePlanResponse extends SubscriptionResponse {
  paymentSession?: DesignToolSubscribeResponse['paymentSession'];
}

export interface PaymentsPageResponse extends WrapResponse {
  items?: DesignToolPaymentRecord[];
  nextCursor?: string;
}

export interface AdminListResponse extends WrapResponse {
  items?: AdminSubscriptionSummary[];
  page?: number;
  limit?: number;
  total?: number;
}

export interface AdminRefundResponse extends SubscriptionResponse {
  refundedPayment?: DesignToolPaymentRecord;
}

interface PaymentsQuery {
  limit?: number;
  cursor?: string;
}

interface AdminCancelOpts {
  reason?: string;
}

interface AdminRefundOpts {
  reason?: string;
  paymentId?: string;
}

interface AdminGrantOpts {
  plan: DesignToolPlanId;
  expiresAt?: string;
  reason: string;
}

interface BillingMethodUpdateBody {
  authKey: string;
  customerKey: string;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export abstract class BaseDesignToolService extends BaseApiService {
  // ============================================================
  // 공개 정보
  // ============================================================

  async getPlans(): Promise<PlansResponse> {
    return this.request<PlansResponse>(DT.PLANS);
  }

  // ============================================================
  // 신규 가입 (Toss 결제 플로우)
  // ============================================================

  async subscribe(
    request: DesignToolSubscribeRequest,
  ): Promise<DesignToolSubscribeResponse> {
    return this.request<DesignToolSubscribeResponse>(DT.SUBSCRIBE, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 최초 빌링키 발급 + 첫 결제.
   * 카드 변경(기존 구독자의 재빌링)은 updateMyBillingMethod 사용.
   */
  async confirmBilling(data: {
    authKey: string;
    customerKey: string;
    orderId: string;
  }): Promise<DesignToolSubscribeResponse> {
    return this.request<DesignToolSubscribeResponse>(DT.BILLING_CONFIRM, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // 사용자 본인 (me)
  // ============================================================

  async getMySubscription(): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>(DT.ME.SUBSCRIPTION);
  }

  async getMyPayments(opts: PaymentsQuery = {}): Promise<PaymentsPageResponse> {
    const query = buildQuery({ limit: opts.limit, cursor: opts.cursor });
    return this.request<PaymentsPageResponse>(`${DT.ME.PAYMENTS}${query}`);
  }

  /**
   * 구독 취소 (만료일까지 유지).
   * Toss 결제 사용자만 가능. IAP(Apple/Google)는 서버가 400을 반환한다.
   */
  async cancelMySubscription(): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>(DT.ME.CANCEL, { method: 'POST' });
  }

  async changeMyPlan(plan: DesignToolPlanId): Promise<ChangePlanResponse> {
    return this.request<ChangePlanResponse>(DT.ME.CHANGE_PLAN, {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  /**
   * 카드 변경 — Toss billingAuth로 발급받은 새 authKey로 빌링키 재등록.
   */
  async updateMyBillingMethod(
    body: BillingMethodUpdateBody,
  ): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>(DT.ME.BILLING_METHOD, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ============================================================
  // Admin
  // ============================================================

  async adminListSubscriptions(
    query: AdminSubscriptionListQuery = {},
  ): Promise<AdminListResponse> {
    const qs = buildQuery({
      status: query.status,
      plan: query.plan,
      paymentSource: query.paymentSource,
      page: query.page,
      limit: query.limit,
    });
    return this.request<AdminListResponse>(
      `${DT.ADMIN.SUBSCRIPTIONS_LIST}${qs}`,
    );
  }

  async adminGetUserSubscription(
    userUuid: string,
  ): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>(
      DT.ADMIN.USER_SUBSCRIPTION(userUuid),
    );
  }

  async adminGetUserPayments(
    userUuid: string,
    opts: PaymentsQuery = {},
  ): Promise<PaymentsPageResponse> {
    const qs = buildQuery({ limit: opts.limit, cursor: opts.cursor });
    return this.request<PaymentsPageResponse>(
      `${DT.ADMIN.USER_PAYMENTS(userUuid)}${qs}`,
    );
  }

  async adminCancelUser(
    userUuid: string,
    opts: AdminCancelOpts = {},
  ): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>(DT.ADMIN.USER_CANCEL(userUuid), {
      method: 'POST',
      body: JSON.stringify(opts),
    });
  }

  async adminRefundUser(
    userUuid: string,
    opts: AdminRefundOpts = {},
  ): Promise<AdminRefundResponse> {
    return this.request<AdminRefundResponse>(DT.ADMIN.USER_REFUND(userUuid), {
      method: 'POST',
      body: JSON.stringify(opts),
    });
  }

  async adminGrantUser(
    userUuid: string,
    opts: AdminGrantOpts,
  ): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>(DT.ADMIN.USER_GRANT(userUuid), {
      method: 'POST',
      body: JSON.stringify(opts),
    });
  }
}

export class DesignToolServiceFactory {
  static create(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>,
  ): BaseDesignToolService {
    return new (class extends BaseDesignToolService {})(baseURL, getAuthHeaders);
  }
}
