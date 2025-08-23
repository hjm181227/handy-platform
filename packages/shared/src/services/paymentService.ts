import { ApiResponse, PaymentMethod, PaymentStatus } from '../types';
import { API_ENDPOINTS } from '../config/api';
import { handleApiResponse } from '../utils/apiHelpers';

export interface PaymentInitializationRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentInitializationResponse {
  paymentId: string;
  clientSecret?: string;
  redirectUrl?: string;
  status: PaymentStatus;
  expiresAt: string;
  paymentMethod: PaymentMethod;
  instructions?: {
    type: string;
    data: Record<string, any>;
  };
}

export interface PaymentConfirmationRequest {
  paymentId: string;
  confirmationData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PaymentConfirmationResponse {
  success: boolean;
  status: PaymentStatus;
  transactionId: string;
  receipt?: {
    receiptNumber: string;
    paidAt: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
  };
}

export interface RefundRequest {
  amount?: number; // 부분 환불을 위한 금액 (전체 환불이면 생략)
  reason: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  refundId: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  processedAt?: string;
  estimatedCompletionTime?: string;
}

export class BasePaymentService {
  protected baseURL: string;
  protected getAuthHeaders: () => Promise<Record<string, string>>;

  constructor(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>) {
    this.baseURL = baseURL;
    this.getAuthHeaders = getAuthHeaders;
  }

  // 결제 초기화
  async initializePayment(request: PaymentInitializationRequest): Promise<ApiResponse<PaymentInitializationResponse>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PAYMENT_PROCESSING.INITIALIZE}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return handleApiResponse(response);
  }

  // 결제 확인
  async confirmPayment(request: PaymentConfirmationRequest): Promise<ApiResponse<PaymentConfirmationResponse>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PAYMENT_PROCESSING.CONFIRM}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return handleApiResponse(response);
  }

  // 결제 취소
  async cancelPayment(paymentId: string, reason?: string): Promise<ApiResponse<void>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PAYMENT_PROCESSING.CANCEL(paymentId)}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    return handleApiResponse(response);
  }

  // 부분 환불
  async refundPayment(paymentId: string, refundRequest: RefundRequest): Promise<ApiResponse<RefundResponse>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PAYMENT_PROCESSING.REFUND_PARTIAL(paymentId)}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refundRequest),
    });

    return handleApiResponse(response);
  }

  // 결제 상태 조회 (기존 메서드 확장)
  async getPaymentStatus(transactionId: string): Promise<ApiResponse<{
    status: PaymentStatus;
    paymentMethod: PaymentMethod;
    amount: number;
    currency: string;
    createdAt: string;
    completedAt?: string;
    failureReason?: string;
  }>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PAYMENTS.STATUS(transactionId)}`, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 사용 가능한 결제 수단 조회 (기존 메서드 확장)
  async getPaymentMethods(): Promise<ApiResponse<{
    methods: Array<{
      type: PaymentMethod;
      name: string;
      description: string;
      isEnabled: boolean;
      fees?: {
        type: 'percentage' | 'fixed';
        amount: number;
      };
      supportedCurrencies: string[];
      minAmount?: number;
      maxAmount?: number;
    }>;
  }>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PAYMENTS.METHODS}`, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 결제 웹훅 처리 (서버용)
  async processWebhook(webhookData: any, signature?: string): Promise<ApiResponse<{
    processed: boolean;
    eventType: string;
    paymentId?: string;
    orderId?: string;
  }>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (signature) {
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PAYMENT_PROCESSING.WEBHOOK}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(webhookData),
    });

    return handleApiResponse(response);
  }

  // 편의 메서드들
  
  // 신용카드 결제 초기화
  async initializeCreditCardPayment(
    orderId: string,
    amount: number,
    customerInfo: PaymentInitializationRequest['customerInfo'],
    returnUrl?: string
  ): Promise<ApiResponse<PaymentInitializationResponse>> {
    return this.initializePayment({
      orderId,
      amount,
      currency: 'KRW',
      paymentMethod: 'credit_card',
      customerInfo,
      returnUrl,
    });
  }

  // PayPal 결제 초기화
  async initializePayPalPayment(
    orderId: string,
    amount: number,
    customerInfo: PaymentInitializationRequest['customerInfo'],
    returnUrl?: string,
    cancelUrl?: string
  ): Promise<ApiResponse<PaymentInitializationResponse>> {
    return this.initializePayment({
      orderId,
      amount,
      currency: 'USD',
      paymentMethod: 'paypal',
      customerInfo,
      returnUrl,
      cancelUrl,
    });
  }

  // 무통장입금 결제 초기화
  async initializeBankTransferPayment(
    orderId: string,
    amount: number,
    customerInfo: PaymentInitializationRequest['customerInfo']
  ): Promise<ApiResponse<PaymentInitializationResponse>> {
    return this.initializePayment({
      orderId,
      amount,
      currency: 'KRW',
      paymentMethod: 'bank_transfer',
      customerInfo,
    });
  }
}

// 결제 서비스 팩토리
export class PaymentServiceFactory {
  static create(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>
  ): BasePaymentService {
    return new BasePaymentService(baseURL, getAuthHeaders);
  }
}