import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  Cart,
  CartResponse
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseCartService extends BaseApiService {
  // 장바구니 조회 (판매자별 그룹화 포함)
  async getCart(region?: string): Promise<CartResponse> {
    const url = region ? `${API_ENDPOINTS.CART.GET}?region=${region}` : API_ENDPOINTS.CART.GET;
    return this.request<CartResponse>(url);
  }

  async getCartCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>(API_ENDPOINTS.CART.COUNT);
  }

  // 장바구니 아이템 관리
  async addToCart(
    productId: string, 
    quantity: number, 
    options?: Record<string, string>
  ): Promise<CartResponse> {
    const body: any = { productId, quantity };
    if (options) {
      body.options = options;
    }

    return this.request<CartResponse>(API_ENDPOINTS.CART.ITEMS, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateCartItem(
    productId: string, 
    quantity?: number, 
    options?: Record<string, string>
  ): Promise<CartResponse> {
    const body: any = {};
    if (quantity !== undefined) {
      body.quantity = quantity;
    }
    // 서버에서 options로 특정 아이템을 구분하므로 항상 포함
    if (options) {
      body.options = options;
    }

    return this.request<CartResponse>(API_ENDPOINTS.CART.ITEM(productId), {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async removeFromCart(
    productId: string, 
    options?: Record<string, string>
  ): Promise<CartResponse> {
    let endpoint = API_ENDPOINTS.CART.ITEM(productId);
    
    if (options) {
      const queryString = new URLSearchParams({ options: JSON.stringify(options) }).toString();
      endpoint += `?${queryString}`;
    }

    return this.request<CartResponse>(endpoint, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.CART.CLEAR, {
      method: 'DELETE',
    });
  }

  // 장바구니 동기화
  async syncCart(items: Array<{
    productId: string;
    quantity: number;
    options?: Record<string, string>;
  }>): Promise<CartResponse & { syncSummary?: any; invalidItems?: any[] }> {
    return this.request<CartResponse & { syncSummary?: any; invalidItems?: any[] }>(
      API_ENDPOINTS.CART.SYNC,
      {
        method: 'POST',
        body: JSON.stringify({ items }),
      }
    );
  }
}

export class CartServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseCartService {
    return new (class extends BaseCartService {})(baseURL, getAuthHeaders);
  }
}