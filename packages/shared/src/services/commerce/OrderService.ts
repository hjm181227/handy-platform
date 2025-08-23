import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  Order, 
  OrdersResponse, 
  Address,
  PaymentMethod,
  Cart
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseOrderService extends BaseApiService {
  // 주문 조회
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
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.ORDERS.LIST}?${queryString}` : API_ENDPOINTS.ORDERS.LIST;
    return this.request<OrdersResponse>(endpoint);
  }

  async getOrder(id: string): Promise<ApiResponse<{ order: Order }>> {
    return this.request<ApiResponse<{ order: Order }>>(API_ENDPOINTS.ORDERS.DETAIL(id));
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
}

export class OrderServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseOrderService {
    return new (class extends BaseOrderService {})(baseURL, getAuthHeaders);
  }
}