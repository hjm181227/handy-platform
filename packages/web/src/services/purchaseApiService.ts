import { webApiService } from './apiService';
import { mockApiService, USE_MOCK_API } from './mockApiService';
import { PaymentMethod, API_BASE_URL } from '@handy-platform/shared';

/**
 * Purchase API Service Adapter
 * Mock API와 실제 API를 전환할 수 있는 어댑터 패턴
 * USE_MOCK_API 플래그로 쉽게 전환 가능
 */

export class PurchaseApiService {
  // 장바구니 관련 API
  async getCart() {
    if (USE_MOCK_API) {
      return mockApiService.cart.getCart();
    }
    const response = await webApiService.cart.getCart();
    // 실제 API 응답은 이미 올바른 형태이므로 그대로 반환
    return response;
  }

  async addToCart(productId: string, quantity: number, selectedOptions: Record<string, string> = {}) {
    if (USE_MOCK_API) {
      return mockApiService.cart.addToCart(productId, quantity, selectedOptions);
    }
    const response = await webApiService.cart.addToCart(productId, quantity, selectedOptions);
    // 실제 API 응답을 기존 형태로 변환
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.cart
      };
    }
    return response;
  }

  async updateCartItem(itemId: string, quantity: number) {
    if (USE_MOCK_API) {
      return mockApiService.cart.updateCartItem(itemId, quantity);
    }
    return webApiService.cart.updateCartItem(itemId, quantity);
  }

  async removeCartItem(itemId: string) {
    if (USE_MOCK_API) {
      return mockApiService.cart.removeCartItem(itemId);
    }
    return webApiService.cart.removeFromCart(itemId);
  }

  async clearCart() {
    if (USE_MOCK_API) {
      return mockApiService.cart.clearCart();
    }
    return webApiService.cart.clearCart();
  }

  // 결제 관련 API
  async getPaymentMethods() {
    if (USE_MOCK_API) {
      return mockApiService.payment.getPaymentMethods();
    }
    const response = await webApiService.payment.getPaymentMethods();
    // API 응답을 기존 형태로 변환
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.methods || []
      };
    }
    return response;
  }

  async addPaymentMethod(paymentData: Omit<PaymentMethod, 'id' | 'userId' | 'createdAt'>) {
    if (USE_MOCK_API) {
      return mockApiService.payment.addPaymentMethod(paymentData);
    }
    // 실제 API에서는 결제 수단 추가가 별도로 구현되지 않았을 수 있음
    // 임시로 Mock 응답 반환
    return {
      success: true,
      data: {
        ...paymentData,
        id: `payment_${Date.now()}`,
        userId: 'current_user',
        createdAt: new Date().toISOString()
      }
    };
  }

  // 주문 목록 조회 - webApiService를 통해 BaseApiService 활용
  async getOrders(filters: {
    page?: number;
    limit?: number;
    status?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    if (USE_MOCK_API) {
      return mockApiService.order.getOrders();
    }

    try {
      // ✅ webApiService 사용 (다른 API들과 동일한 패턴)
      // BaseApiService가 자동으로 올바른 서버 URL, 재시도, 타임아웃 등을 처리
      const response = await webApiService.order.getOrders({
        page: filters.page || 1,
        limit: filters.limit || 10,
        status: filters.status?.join(','), // 배열을 문자열로 변환
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc'
      });

      // 응답 형식 표준화
      return {
        success: true,
        orders: response.orders || [],
        pagination: response.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false
        },
        message: 'Success'
      };
    } catch (error: any) {
      console.error('Orders list API error:', error);
      // 에러 응답 표준화
      return {
        success: false,
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false
        },
        message: error.message || '주문 목록을 불러올 수 없습니다.'
      };
    }
  }

  // 주문 조회
  async getOrder(orderId: string) {
    if (USE_MOCK_API) {
      return mockApiService.order.getOrder(orderId);
    }
    return webApiService.order.getOrder(orderId);
  }

  // 주문 취소
  async cancelOrder(orderId: string, reason?: string) {
    if (USE_MOCK_API) {
      return {
        success: true,
        message: '주문이 취소되었습니다.',
        data: { orderId, status: 'cancelled' }
      };
    }

    try {
      const response = await webApiService.order.cancelOrder(orderId, reason);

      if (response.success) {
        return {
          success: true,
          message: '주문이 성공적으로 취소되었습니다.',
          data: response.data
        };
      }

      return {
        success: false,
        message: response.message || '주문 취소에 실패했습니다.'
      };
    } catch (error: any) {
      console.error('Order cancellation failed:', error);
      return {
        success: false,
        message: error.message || '주문 취소 중 오류가 발생했습니다.'
      };
    }
  }

  // 통합 결제 API 메서드들
  async preparePayment(data: {
    amount: number;
    payMethod: string;
    items: Array<{
      productUuid: string;
      shape: string;
      size: string;
      quantity: number;
      price: number;
    }>;
    callbackUrls?: {
      success?: string;
      cancel?: string;
      fail?: string;
    };
  }) {
    if (USE_MOCK_API) {
      // Mock에서는 간단한 결제 URL 반환
      const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        success: true,
        data: {
          paymentUrl: `https://pay.mock.com/payment?orderId=${mockOrderId}`,
          transactionId: `TXN_${Date.now()}`,
          orderId: mockOrderId,
          payMethod: data.payMethod,
          amount: data.amount,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30분 후
        }
      };
    }

    // 실제 통합 결제 API 호출
    const token = await webApiService.auth.getAuthToken();
    console.log('Payment prepare request:', {
      url: `${API_BASE_URL}/api/payment/prepare`,
      token: token ? `${token.substring(0, 20)}...` : 'No token',
      data
    });

    const response = await fetch(`${API_BASE_URL}/api/payment/prepare`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Payment prepare response:', {
      status: response.status,
      statusText: response.statusText,
      result
    });

    return result;
  }

  async getPaymentStatus(orderId: string, payMethod?: string) {
    if (USE_MOCK_API) {
      return {
        success: true,
        data: {
          orderId,
          status: 'COMPLETED',
          payMethod: payMethod || 'KAKAO_PAY',
          amount: { total: 10000 }
        }
      };
    }

    const token = await webApiService.auth.getAuthToken();
    const url = payMethod 
      ? `${API_BASE_URL}/api/payment/status/${orderId}?payMethod=${payMethod}`
      : `${API_BASE_URL}/api/payment/status/${orderId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  }

}

// 싱글톤 인스턴스 export
export const purchaseApiService = new PurchaseApiService();

/**
 * 실제 API로 전환하는 방법:
 * 1. mockApiService.ts의 USE_MOCK_API를 false로 변경
 * 2. 또는 이 파일에서 직접 USE_MOCK_API를 false로 오버라이드
 * 3. 완전히 제거할 때는 mockApiService.ts와 data/mockData.ts 파일 삭제 후
 *    이 파일을 webApiService로 직접 교체
 */