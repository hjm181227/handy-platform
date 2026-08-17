import { BaseApiService } from '../base/BaseApiService';
import {
  ApiResponse,
  Order,
  OrdersResponse,
  Address,
  PaymentMethod,
  Cart,
  CheckoutSession,
  ShippingAddress,
  PaymentPrepareResult,
  PayMethod,
  CreateCustomOrderRequest,
  CreateCustomOrderResponse,
  CustomOrderDetail,
  CustomOrderListResponse,
  UpdateCustomOrderRequest,
  CustomOrderQuotesResponse,
  PublicCustomOrderListResponse,
  ReturnRequest,
  CreateReturnRequestPayload,
  ReturnRequestListResponse,
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';
import { validateResponseId, normalizeOrderId } from '../../utils/uuidUtils';

export abstract class BaseOrderService extends BaseApiService {
  // 주문 조회 - POST /api/orders/list 사용 (백엔드 스펙 준수)
  async getOrders(filters: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<OrdersResponse> {
    // POST 방식으로 변경 - 필터 데이터를 request body로 전송
    const requestBody = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...(filters.status && { status: filters.status.split(',') }), // 문자열을 배열로 변환
      ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
      ...(filters.sortBy && { sortBy: filters.sortBy }),
    };

    const response = await this.request<any>(
      '/api/orders/list',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
        // 필터를 body로 보내려고 POST를 쓸 뿐 실제로는 조회다. 재시도해도 안전하다.
        enableRetry: true
      }
    );

    // 백엔드 응답 형식: { success, items, pagination }
    // 프론트엔드 형식으로 변환: { orders, pagination }
    const normalizedResponse: OrdersResponse = {
      orders: response.items || [],
      pagination: response.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false
      }
    };

    // Validate UUID format in orders response during migration period
    if (normalizedResponse.orders) {
      normalizedResponse.orders.forEach((order, index) => {
        try {
          validateResponseId(order, `Order[${index}]`);
        } catch (error) {
          console.warn(`UUID Migration Warning - Order validation:`, error);
        }
      });
    }

    return normalizedResponse;
  }

  async getOrder(id: string): Promise<ApiResponse<{ order: Order }>> {
    const response = await this.request<ApiResponse<{ order: Order }>>(API_ENDPOINTS.ORDERS.DETAIL(id));

    // Validate UUID format in single order response during migration period
    if (response.data?.order) {
      try {
        validateResponseId(response.data.order, 'Order Detail');
      } catch (error) {
        console.warn(`UUID Migration Warning - Order detail validation:`, error);
      }
    }

    return response;
  }

  // 체크아웃 초기화 - 장바구니, 바로구매, 맞춤제작, 선택 주문 지원 (백엔드 스펙 준수)
  async initializeCheckout(data?: {
    quoteUuid?: string;
    directItem?: {
      productUuid: string;
      quantity: number;
      options?: Record<string, string>;
    };
    // 장바구니 일부만 결제 (선택 주문) — 미지정 시 전체 장바구니
    selectedItems?: Array<{ productUuid: string; options?: Record<string, string> }>;
    estimatedRegion?: 'general' | 'jeju' | 'remote';
  }): Promise<ApiResponse<CheckoutSession>> {
    return this.request<ApiResponse<CheckoutSession>>(
      '/api/checkout/initialize',
      {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }
    );
  }

  // 배송지 검증 - 배송비 재계산 및 최종 금액 확정
  async validateCheckout(
    sessionId: string,
    shippingAddress: ShippingAddress
  ): Promise<ApiResponse<CheckoutSession>> {
    return this.request<ApiResponse<CheckoutSession>>(
      '/api/checkout/validate',
      {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          shippingAddress
        }),
      }
    );
  }

  // 결제 준비 - 주문 생성 및 결제 URL 반환 (백엔드 스펙 준수)
  async preparePayment(
    sessionId: string,
    amount: number,
    payMethod: PayMethod
  ): Promise<ApiResponse<PaymentPrepareResult>> {
    return this.request<ApiResponse<PaymentPrepareResult>>(
      API_ENDPOINTS.PAYMENT.PREPARE,
      {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          amount,
          payMethod
        }),
      }
    );
  }

  // 결제 승인 - 결제 완료 후 최종 승인 (unified-payments-api.md 스펙 준수)
  // 토스페이먼츠: { orderId, payMethod: 'TOSS_PAYMENTS', approvalData: { paymentKey, amount } }
  // 카카오페이/네이버페이: { orderId, payMethod, approvalData: { pgToken } }
  async approvePayment(
    params: {
      orderId: string;
      payMethod?: 'TOSS_PAYMENTS' | 'KAKAO_PAY' | 'NAVER_PAY';
      approvalData?: {
        paymentKey?: string;
        amount?: number;
        pgToken?: string;
      };
      // 레거시 호환 (deprecated)
      paymentKey?: string;
      amount?: number;
      pgToken?: string;
    }
  ): Promise<ApiResponse<{
    success: boolean;
    orderId: string;
    status?: string;
    amount?: number;
    approvedAt?: string;
    redirectUrl?: string;
    error?: string;
  }>> {
    return this.request<ApiResponse<{
      success: boolean;
      orderId: string;
      status?: string;
      amount?: number;
      approvedAt?: string;
      redirectUrl?: string;
      error?: string;
    }>>(
      API_ENDPOINTS.PAYMENT.APPROVE,
      {
        method: 'POST',
        body: JSON.stringify(params),
        // 재시도 금지 (POST 기본값). 서버의 멱등성 체크는 트랜잭션이
        // completed로 확정된 뒤에만 동작하므로, PG 승인이 진행 중인
        // 구간에 재시도가 들어가면 중복 승인이 발생할 수 있다.
        enableRetry: false,
      }
    );
  }

  // 주문 생성
  async createOrder(orderData: {
    shippingAddress: Address;
    paymentMethod: PaymentMethod;
    shippingMethod?: string;
    useCart?: boolean;
    items?: Array<{
      productId: string;
      quantity: number;
      options?: Record<string, string>;
    }>;
    couponId?: string;
    pointsToUse?: number;
    notes?: string;
  }): Promise<ApiResponse<{ order: Order }>> {
    return this.request<ApiResponse<{ order: Order }>>(API_ENDPOINTS.ORDERS.CREATE, {
      method: 'POST',
      body: JSON.stringify({
        useCart: true,
        shippingMethod: 'standard',
        ...orderData,
      }),
    });
  }

  // 주문 관리
  async cancelOrder(id: string, reason?: string): Promise<ApiResponse<{ order: Order }>> {
    return this.request<ApiResponse<{ order: Order }>>(API_ENDPOINTS.ORDERS.CANCEL(id), {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  // 주문 추적
  async trackOrder(id: string): Promise<ApiResponse<{
    orderNumber: string;
    orderStatus: string;
    shipping: {
      status: string;
      progress: number;
      carrier: {
        name: string;
        code: string;
      };
      tracking: {
        number: string;
        url: string;
        history: Array<{
          status: string;
          location: string;
          description: string;
          timestamp: string;
        }>;
      };
      schedule: {
        estimatedDelivery: string;
        actualDelivery?: string;
      };
    };
    statusHistory: Array<{
      status: string;
      note: string;
      date: string;
    }>;
  }>> {
    return this.request(API_ENDPOINTS.ORDERS.TRACK(id));
  }

  // 재주문
  async reorder(id: string): Promise<ApiResponse<{
    cart: Cart;
    summary: {
      totalItemsProcessed: number;
      addedItems: number;
      unavailableItems: number;
      priceChangedItems: number;
    };
    details: {
      addedItems: any[];
      unavailableItems: any[];
      priceChangedItems: any;
    };
  }>> {
    return this.request(API_ENDPOINTS.ORDERS.REORDER(id), {
      method: 'POST',
    });
  }

  // 리뷰 작성 가능한 상품 조회
  async getOrderForReview(id: string): Promise<ApiResponse<{ products: any[] }>> {
    return this.request<ApiResponse<{ products: any[] }>>(API_ENDPOINTS.ORDERS.REVIEW_REMINDER(id), {
      method: 'POST',
    });
  }

  /**
   * Helper method to safely extract order identifier for API calls
   * Handles UUID format during migration period
   * @param order - Order object with id field
   * @returns string - normalized order identifier for API calls
   */
  protected getOrderApiId(order: { id: string }): string {
    return normalizeOrderId(order);
  }

  // ============================================
  // 커스텀 주문 관련 메서드
  // ============================================

  // 커스텀 주문서 생성
  async createCustomOrder(request: CreateCustomOrderRequest): Promise<ApiResponse<CreateCustomOrderResponse>> {
    return this.request<ApiResponse<CreateCustomOrderResponse>>(
      API_ENDPOINTS.CUSTOM_ORDER.CREATE,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // 커스텀 주문서 상세 조회
  async getCustomOrderDetail(uuid: string): Promise<ApiResponse<CustomOrderDetail>> {
    return this.request<ApiResponse<CustomOrderDetail>>(
      API_ENDPOINTS.CUSTOM_ORDER.DETAIL(uuid)
    );
  }

  // 내 커스텀 주문서 목록 조회
  async getMyCustomOrders(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<CustomOrderListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = query ? `${API_ENDPOINTS.CUSTOM_ORDER.LIST}?${query}` : API_ENDPOINTS.CUSTOM_ORDER.LIST;

    return this.request<CustomOrderListResponse>(url);
  }

  // 커스텀 주문서 수정
  async updateCustomOrder(uuid: string, data: UpdateCustomOrderRequest): Promise<ApiResponse<CustomOrderDetail>> {
    return this.request<ApiResponse<CustomOrderDetail>>(
      API_ENDPOINTS.CUSTOM_ORDER.UPDATE(uuid),
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  // 주문서별 견적 목록 조회
  async getCustomOrderQuotes(uuid: string): Promise<CustomOrderQuotesResponse> {
    return this.request<CustomOrderQuotesResponse>(
      API_ENDPOINTS.CUSTOM_ORDER.QUOTES(uuid)
    );
  }

  // 견적서 상세 조회
  async getQuoteDetail(quoteUuid: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(
      API_ENDPOINTS.QUOTES.DETAIL(quoteUuid)
    );
  }

  // ============================================
  // 반품·교환 (RMA) 관련 메서드 — 서버 routes/returns.ts 준수
  // ============================================

  // 반품·교환 신청 (구매자)
  // 오류: 400(미배송완료/30일 초과), 409(멀티셀러 주문/중복 신청) — err.message에 한국어 메시지가 담긴다
  async createReturnRequest(
    payload: CreateReturnRequestPayload
  ): Promise<ApiResponse<{ returnRequest: ReturnRequest }>> {
    return this.request<ApiResponse<{ returnRequest: ReturnRequest }>>(
      API_ENDPOINTS.RETURNS.CREATE,
      {
        method: 'POST',
        body: JSON.stringify({
          imageUrls: [],
          ...payload,
        }),
      }
    );
  }

  // 내 반품·교환 신청 목록 (구매자)
  async getMyReturnRequests(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReturnRequestListResponse> {
    const query = this.buildQueryString({
      page: params?.page,
      limit: params?.limit,
    });
    const url = query ? `${API_ENDPOINTS.RETURNS.MY}?${query}` : API_ENDPOINTS.RETURNS.MY;
    return this.request<ReturnRequestListResponse>(url);
  }

  // 신청 철회 (구매자, requested 상태만)
  async withdrawReturnRequest(
    returnRequestUuid: string
  ): Promise<ApiResponse<{ returnRequest: ReturnRequest }>> {
    return this.request<ApiResponse<{ returnRequest: ReturnRequest }>>(
      API_ENDPOINTS.RETURNS.WITHDRAW(returnRequestUuid),
      { method: 'POST' }
    );
  }

  // 판매자 수신 목록 (판매자 전용) — status는 콤마 구분 다중값 지원
  async getSellerReturnRequests(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ReturnRequestListResponse> {
    const query = this.buildQueryString({
      status: params?.status,
      page: params?.page,
      limit: params?.limit,
    });
    const url = query ? `${API_ENDPOINTS.RETURNS.SELLER}?${query}` : API_ENDPOINTS.RETURNS.SELLER;
    return this.request<ReturnRequestListResponse>(url);
  }

  // 승인 (판매자) — 반품이면 전액 환불까지 자동 수행되어 status가 바로 'completed'가 된다
  async approveReturnRequest(
    returnRequestUuid: string,
    note?: string
  ): Promise<ApiResponse<{ returnRequest: ReturnRequest; refunded: boolean }>> {
    return this.request<ApiResponse<{ returnRequest: ReturnRequest; refunded: boolean }>>(
      API_ENDPOINTS.RETURNS.APPROVE(returnRequestUuid),
      {
        method: 'POST',
        body: JSON.stringify(note ? { note } : {}),
        // 반품 승인은 PG 환불을 동반하므로 재시도 절대 금지
        enableRetry: false,
      }
    );
  }

  // 반려 (판매자) — 사유 5자 이상 필수
  async rejectReturnRequest(
    returnRequestUuid: string,
    rejectReason: string
  ): Promise<ApiResponse<{ returnRequest: ReturnRequest }>> {
    return this.request<ApiResponse<{ returnRequest: ReturnRequest }>>(
      API_ENDPOINTS.RETURNS.REJECT(returnRequestUuid),
      {
        method: 'POST',
        body: JSON.stringify({ rejectReason }),
      }
    );
  }

  // 교환 완료 처리 (판매자, approved 상태의 exchange만)
  async completeReturnRequest(
    returnRequestUuid: string
  ): Promise<ApiResponse<{ returnRequest: ReturnRequest }>> {
    return this.request<ApiResponse<{ returnRequest: ReturnRequest }>>(
      API_ENDPOINTS.RETURNS.COMPLETE(returnRequestUuid),
      { method: 'POST' }
    );
  }

  // 결제 스킵 (스테이징 환경 테스트 전용)
  async skipPayment(orderUuid: string): Promise<ApiResponse<{
    message: string;
    order: {
      orderUuid: string;
      status: string;
      paymentStatus: string;
    };
  }>> {
    return this.request<ApiResponse<{
      message: string;
      order: {
        orderUuid: string;
        status: string;
        paymentStatus: string;
      };
    }>>(
      API_ENDPOINTS.ORDERS.SKIP_PAYMENT(orderUuid),
      {
        method: 'POST',
      }
    );
  }
}

export class OrderServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseOrderService {
    return new (class extends BaseOrderService {})(baseURL, getAuthHeaders);
  }
}
