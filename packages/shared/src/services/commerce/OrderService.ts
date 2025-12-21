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
  PresignedUrlRequest,
  PresignedUrlResponse
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
        body: JSON.stringify(requestBody)
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

  // 체크아웃 초기화 - 장바구니, 바로구매, 맞춤제작 지원 (백엔드 스펙 준수)
  async initializeCheckout(data?: {
    quoteUuid?: string;
    directItem?: {
      productUuid: string;
      quantity: number;
      options?: Record<string, string>;
    };
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

  // 결제 승인 - 결제 완료 후 최종 승인 (백엔드 스펙 준수)
  async approvePayment(
    orderId: string,
    pgToken: string
  ): Promise<ApiResponse<{
    orderId: string;
    status: string;
    amount: number;
    approvedAt: string;
    redirectUrl: string;
  }>> {
    return this.request<ApiResponse<{
      orderId: string;
      status: string;
      amount: number;
      approvedAt: string;
      redirectUrl: string;
    }>>(
      API_ENDPOINTS.PAYMENT.APPROVE,
      {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          pgToken
        }),
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

  // Presigned URL 요청 (이미지 업로드용)
  async getPresignedUrl(request: PresignedUrlRequest): Promise<ApiResponse<PresignedUrlResponse>> {
    return this.request<ApiResponse<PresignedUrlResponse>>(
      API_ENDPOINTS.UPLOAD.PRESIGNED_URL,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // S3에 이미지 직접 업로드 (Presigned URL 사용)
  async uploadToS3(presignedUrl: string, file: File): Promise<void> {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`S3 업로드 실패: ${response.status} ${response.statusText}`);
    }
  }

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
