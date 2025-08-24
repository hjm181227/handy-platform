import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  Order,
  PaymentMethod
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BasePaymentService extends BaseApiService {
  // 결제 처리
  async processPayment(
    orderId: string, 
    paymentData: {
      paymentMethod: PaymentMethod;
      paymentDetails?: Record<string, any>;
    }
  ): Promise<ApiResponse<{ transactionId: string; status: string }>> {
    return this.request<ApiResponse<{ transactionId: string; status: string }>>(
      API_ENDPOINTS.PAYMENTS.PROCESS(orderId),
      {
        method: 'POST',
        body: JSON.stringify(paymentData),
      }
    );
  }

  // 결제 상태 조회
  async getPaymentStatus(transactionId: string): Promise<ApiResponse<{
    status: string;
    order: Order;
  }>> {
    return this.request<ApiResponse<{
      status: string;
      order: Order;
    }>>(API_ENDPOINTS.PAYMENTS.STATUS(transactionId));
  }

  // 환불 요청
  async requestRefund(
    orderId: string, 
    reason: string, 
    amount?: number
  ): Promise<ApiResponse> {
    const body: any = { reason };
    if (amount) {
      body.amount = amount;
    }

    return this.request<ApiResponse>(API_ENDPOINTS.PAYMENTS.REFUND(orderId), {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // 결제 수단 조회
  async getPaymentMethods(): Promise<ApiResponse<{ methods: PaymentMethod[] }>> {
    return this.request<ApiResponse<{ methods: PaymentMethod[] }>>(API_ENDPOINTS.PAYMENTS.METHODS);
  }

  // 확장된 결제 처리 (초기화, 확인, 취소)
  async initializePayment(data: {
    orderId: string;
    paymentMethod: PaymentMethod;
    amount: number;
    currency?: string;
  }): Promise<ApiResponse<{ paymentId: string; clientSecret?: string }>> {
    return this.request<ApiResponse<{ paymentId: string; clientSecret?: string }>>(
      API_ENDPOINTS.PAYMENT_PROCESSING.INITIALIZE,
      {
        method: 'POST',
        body: JSON.stringify({ currency: 'KRW', ...data }),
      }
    );
  }

  async confirmPayment(
    paymentId: string, 
    confirmationData: Record<string, any>
  ): Promise<ApiResponse<{ status: string; order: Order }>> {
    return this.request<ApiResponse<{ status: string; order: Order }>>(
      API_ENDPOINTS.PAYMENT_PROCESSING.CONFIRM,
      {
        method: 'POST',
        body: JSON.stringify({ paymentId, ...confirmationData }),
      }
    );
  }

  async cancelPayment(
    paymentId: string, 
    reason?: string
  ): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.PAYMENT_PROCESSING.CANCEL(paymentId), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async requestPartialRefund(
    paymentId: string, 
    amount: number, 
    reason: string
  ): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.PAYMENT_PROCESSING.REFUND_PARTIAL(paymentId), {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }
}

export class PaymentServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BasePaymentService {
    return new (class extends BasePaymentService {})(baseURL, getAuthHeaders);
  }
}