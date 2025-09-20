import { webApiService } from './apiService';
import { mockApiService, USE_MOCK_API } from './mockApiService';
import { Cart, CartItem, ShippingAddress, PaymentMethod } from '@handy-platform/shared';
import { API_BASE_URL } from '@handy-platform/shared/src/config/api';

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

  // 배송지 관련 API
  async getShippingAddresses() {
    if (USE_MOCK_API) {
      return mockApiService.shipping.getShippingAddresses();
    }
    // 실제 API는 auth 서비스에서 사용자 주소를 관리
    return webApiService.auth.getAddresses();
  }

  async addShippingAddress(address: Omit<ShippingAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    if (USE_MOCK_API) {
      return mockApiService.shipping.addShippingAddress(address);
    }
    return webApiService.auth.addAddress(address);
  }

  async updateShippingAddress(addressId: string, updates: Partial<ShippingAddress>) {
    if (USE_MOCK_API) {
      return mockApiService.shipping.updateShippingAddress(addressId, updates);
    }
    return webApiService.auth.updateAddress(addressId, updates);
  }

  async deleteShippingAddress(addressId: string) {
    if (USE_MOCK_API) {
      return mockApiService.shipping.deleteShippingAddress(addressId);
    }
    return webApiService.auth.deleteAddress(addressId);
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

  // 주문 생성
  async createPendingOrder(cart: Cart) {
    if (USE_MOCK_API) {
      return mockApiService.order.createPendingOrder(cart);
    }
    // 실제 API 호출
    const orderRequest = {
      items: cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        options: item.selectedOptions || {}
      })),
      region: 'seoul'
    };
    return webApiService.order.createOrder(orderRequest);
  }

  // 주문 조회
  async getOrder(orderId: string) {
    if (USE_MOCK_API) {
      return mockApiService.order.getOrder(orderId);
    }
    return webApiService.order.getOrderById(orderId);
  }

  async processPayment(paymentData: {
    orderId: string;
    paymentMethod: string;
    shippingAddress: ShippingAddress;
    amount: number;
  }) {
    if (USE_MOCK_API) {
      // Mock API용 데이터 변환
      const mockPaymentData = {
        orderId: paymentData.orderId,
        paymentMethod: paymentData.paymentMethod,
        shippingAddress: paymentData.shippingAddress,
        totalAmount: paymentData.amount
      };
      return mockApiService.payment.processPayment(mockPaymentData);
    }
    // 실제 API 호출
    return webApiService.payment.processPayment(paymentData);
  }

  // 통합 결제 API 메서드들
  async preparePayment(data: {
    orderId: string;
    amount: number;
    itemName: string;
    payMethod: string;
    quantity?: number;
    callbackUrls?: {
      success?: string;
      cancel?: string;
      fail?: string;
    };
  }) {
    if (USE_MOCK_API) {
      // Mock에서는 간단한 결제 URL 반환
      return {
        success: true,
        data: {
          paymentUrl: `https://pay.mock.com/payment?orderId=${data.orderId}`,
          transactionId: `TXN_${Date.now()}`,
          orderId: data.orderId,
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

  async approvePayment(data: {
    orderId: string;
    payMethod: string;
    approvalData: {
      pgToken?: string;
      [key: string]: any;
    };
  }) {
    if (USE_MOCK_API) {
      // Mock에서는 성공 응답 반환
      return {
        success: true,
        data: {
          orderId: data.orderId,
          transactionId: `TXN_${Date.now()}`,
          payMethod: data.payMethod,
          amount: {
            total: 10000,
            tax: 909,
            taxFree: 0,
            discount: 0
          },
          approvedAt: new Date().toISOString(),
          itemName: '테스트 상품'
        }
      };
    }

    // 실제 통합 결제 API 호출
    const token = await webApiService.auth.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/payment/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    return response.json();
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

  // 상품 관련 API
  async getProducts(params?: { category?: string; search?: string; limit?: number }) {
    if (USE_MOCK_API) {
      return mockApiService.product.getProducts(params);
    }
    return webApiService.product.getProducts(params || {});
  }

  async getProduct(productId: string) {
    if (USE_MOCK_API) {
      return mockApiService.product.getProduct(productId);
    }
    return webApiService.product.getProduct(productId);
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