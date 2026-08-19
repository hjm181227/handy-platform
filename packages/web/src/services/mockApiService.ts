import { 
  mockProducts, 
  mockCart, 
  mockCartItems, 
  mockShippingAddresses, 
  mockPaymentMethods, 
  createMockOrder,
  mockApiDelay, 
  mockApiResponse 
} from '../data/mockData';
import type {
  MockCart,
  MockCartItem,
  MockOrder,
  MockOrderItem,
  MockPaymentMethod,
  MockShippingAddress
} from '../data/mockData';

/**
 * Mock API Service
 * 실제 서버 API가 준비되면 이 파일을 삭제하고 실제 API 서비스로 교체
 *
 * 타입은 shared(현행 서버 스펙)가 아니라 mockData.ts 의 구버전 목 타입을 쓴다.
 * (USE_MOCK_API 는 false 이므로 런타임에서는 사용되지 않는다.)
 */

/** 결제 전 임시 주문 (구버전 스펙 — 현행 Order 와 다름) */
interface MockPendingOrder {
  id: string;
  items: MockCartItem[];
  totalItems?: number;
  totalPrice?: number;
  totalDiscount?: number;
  shippingCost?: number;
  finalPrice?: number;
  status: string;
  paymentStatus: string;
  shippingAddress: MockShippingAddress | null;
  paymentMethod: MockPaymentMethod | null;
  createdAt: string;
  updatedAt: string;
}

// Mock 장바구니 서비스
export class MockCartService {
  private cart: MockCart = { ...mockCart };

  // 호환성을 위한 Cart 변환 헬퍼
  private addCompatibilityFields(cart: MockCart) {
    return {
      ...cart,
      totalPrice: cart.totals.subtotal,
      finalPrice: cart.totals.total,
      totalItems: cart.totals.itemCount,
      totalDiscount: 0, // Mock에서는 할인 없음
      shippingCost: cart.totals.shippingCost
    };
  }

  async getCart(): Promise<any> {
    await mockApiDelay(800);
    return mockApiResponse(this.addCompatibilityFields(this.cart));
  }

  async addToCart(productId: string, quantity: number, selectedOptions: Record<string, string>): Promise<any> {
    await mockApiDelay(600);
    
    const product = mockProducts.find(p => p.id === productId);
    if (!product) {
      return mockApiResponse(null, false);
    }

    // 같은 상품과 옵션이 있는지 확인
    const existingItemIndex = this.cart.items.findIndex(
      item => item.productId === productId && 
               JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
    );

    if (existingItemIndex >= 0) {
      // 기존 아이템 수량 증가
      this.cart.items[existingItemIndex].quantity += quantity;
      this.cart.items[existingItemIndex].totalPrice = 
        this.cart.items[existingItemIndex].quantity * product.price;
      this.cart.items[existingItemIndex].subtotal = 
        this.cart.items[existingItemIndex].quantity * product.price;
    } else {
      // 새 아이템 추가
      const newItem: MockCartItem = {
        id: `cart_${Date.now()}`,
        productId,
        product,
        quantity,
        selectedOptions,
        price: product.price,
        totalPrice: product.price * quantity,
        subtotal: product.price * quantity,
        addedAt: new Date().toISOString()
      };
      this.cart.items.push(newItem);
    }

    // 장바구니 합계 재계산
    this.updateCartTotals();

    return mockApiResponse(this.addCompatibilityFields(this.cart));
  }

  async updateCartItem(itemId: string, quantity: number): Promise<any> {
    await mockApiDelay(500);
    
    const itemIndex = this.cart.items.findIndex(item => item.id === itemId);
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        this.cart.items.splice(itemIndex, 1);
      } else {
        this.cart.items[itemIndex].quantity = quantity;
        this.cart.items[itemIndex].totalPrice = 
          this.cart.items[itemIndex].price * quantity;
        this.cart.items[itemIndex].subtotal = 
          this.cart.items[itemIndex].price * quantity;
      }
      this.updateCartTotals();
    }

    return mockApiResponse(this.addCompatibilityFields(this.cart));
  }

  async removeCartItem(itemId: string): Promise<any> {
    await mockApiDelay(500);
    
    this.cart.items = this.cart.items.filter(item => item.id !== itemId);
    this.updateCartTotals();

    return mockApiResponse(this.addCompatibilityFields(this.cart));
  }

  async clearCart(): Promise<any> {
    await mockApiDelay(500);
    
    this.cart.items = [];
    this.updateCartTotals();

    return mockApiResponse(this.addCompatibilityFields(this.cart));
  }

  private updateCartTotals() {
    const itemCount = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = this.cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const shippingCost = subtotal >= 50000 ? 0 : 3000; // 5만원 이상 무료배송
    const total = subtotal + shippingCost;
    const freeShippingRemaining = subtotal < 50000 ? 50000 - subtotal : 0;

    this.cart.totals = {
      subtotal,
      shippingCost,
      tax: 0,
      total,
      itemCount,
      freeShippingRemaining
    };
    this.cart.updatedAt = new Date().toISOString();
  }
}

// Mock 배송지 서비스
export class MockShippingService {
  private addresses: MockShippingAddress[] = [...mockShippingAddresses];

  async getShippingAddresses(): Promise<any> {
    await mockApiDelay(600);
    return mockApiResponse(this.addresses);
  }

  // 호출부(purchaseApiService)는 현행 shared 타입을 넘기므로 목에서는 형태를 강제하지 않는다
  async addShippingAddress(address: any): Promise<any> {
    await mockApiDelay(800);
    
    const newAddress: MockShippingAddress = {
      ...address,
      id: `addr_${Date.now()}`,
      userId: 'user_001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 기본 배송지로 설정하는 경우 다른 주소들의 기본 설정 해제
    if (newAddress.isDefault) {
      this.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    this.addresses.push(newAddress);
    return mockApiResponse(newAddress);
  }

  async updateShippingAddress(addressId: string, updates: Partial<MockShippingAddress>): Promise<any> {
    await mockApiDelay(700);
    
    const addressIndex = this.addresses.findIndex(addr => addr.id === addressId);
    if (addressIndex >= 0) {
      this.addresses[addressIndex] = {
        ...this.addresses[addressIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // 기본 배송지로 변경하는 경우
      if (updates.isDefault) {
        this.addresses.forEach((addr, index) => {
          if (index !== addressIndex) {
            addr.isDefault = false;
          }
        });
      }

      return mockApiResponse(this.addresses[addressIndex]);
    }

    return mockApiResponse(null, false);
  }

  async deleteShippingAddress(addressId: string): Promise<any> {
    await mockApiDelay(500);
    
    const addressIndex = this.addresses.findIndex(addr => addr.id === addressId);
    if (addressIndex >= 0) {
      this.addresses.splice(addressIndex, 1);
      return mockApiResponse({ success: true });
    }

    return mockApiResponse(null, false);
  }
}

// Mock 결제 서비스
export class MockPaymentService {
  private paymentMethods: MockPaymentMethod[] = [...mockPaymentMethods];

  async getPaymentMethods(): Promise<any> {
    await mockApiDelay(500);
    return mockApiResponse(this.paymentMethods);
  }

  async addPaymentMethod(paymentData: any): Promise<any> {
    await mockApiDelay(1000);
    
    const newPaymentMethod: MockPaymentMethod = {
      ...paymentData,
      id: `card_${Date.now()}`,
      userId: 'user_001',
      createdAt: new Date().toISOString()
    };

    // 기본 결제수단으로 설정하는 경우
    if (newPaymentMethod.isDefault) {
      this.paymentMethods.forEach(method => {
        method.isDefault = false;
      });
    }

    this.paymentMethods.push(newPaymentMethod);
    return mockApiResponse(newPaymentMethod);
  }

  async processPayment(paymentData: any): Promise<any> {
    await mockApiDelay(2000); // 결제 처리 시간 시뮬레이션
    
    // 90% 확률로 결제 성공 시뮬레이션
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      return mockApiResponse({
        paymentId: `pay_${Date.now()}`,
        transactionId: `txn_${Date.now()}`,
        orderId: paymentData.orderId,
        amount: paymentData.totalAmount || paymentData.amount,
        status: 'completed'
      });
    } else {
      return mockApiResponse(null, false, '결제 처리 중 오류가 발생했습니다.');
    }
  }
}

// Mock 주문 서비스
export class MockOrderService {
  private orders: MockPendingOrder[] = [];
  
  async createPendingOrder(cart: any): Promise<any> {
    await mockApiDelay(800);
    
    const order: MockPendingOrder = {
      id: `order_${Date.now()}`,
      items: cart.items,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice,
      totalDiscount: cart.totalDiscount,
      shippingCost: cart.shippingCost,
      finalPrice: cart.finalPrice,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shippingAddress: null,
      paymentMethod: null,
      paymentStatus: 'pending'
    };
    
    this.orders.push(order);
    return mockApiResponse(order);
  }
  
  async getOrders(): Promise<any> {
    await mockApiDelay(500);
    return mockApiResponse(this.orders);
  }
  
  async getOrder(orderId: string): Promise<any> {
    await mockApiDelay(400);
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('주문을 찾을 수 없습니다.');
    }
    return mockApiResponse(order);
  }
}

// Mock 상품 서비스
export class MockProductService {
  async getProducts(params?: { category?: string; search?: string; limit?: number | string }): Promise<any> {
    await mockApiDelay(800);
    
    let filteredProducts = [...mockProducts];
    
    if (params?.category) {
      filteredProducts = filteredProducts.filter(p => p.category === params.category);
    }
    
    if (params?.search) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(params.search!.toLowerCase()) ||
        p.description.toLowerCase().includes(params.search!.toLowerCase())
      );
    }
    
    if (params?.limit) {
      filteredProducts = filteredProducts.slice(0, Number(params.limit));
    }
    
    return mockApiResponse({
      products: filteredProducts,
      total: filteredProducts.length,
      page: 1,
      limit: params?.limit || 10
    });
  }

  async getProduct(productId: string): Promise<any> {
    await mockApiDelay(600);
    
    const product = mockProducts.find(p => p.id === productId);
    return mockApiResponse(product);
  }
}

// 통합 Mock API 서비스
export const mockApiService = {
  cart: new MockCartService(),
  shipping: new MockShippingService(),
  payment: new MockPaymentService(),
  order: new MockOrderService(),
  product: new MockProductService()
};

// 실제 API로 전환하기 위한 플래그
export const USE_MOCK_API = false; // 실제 API 사용