import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  Cart 
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseCartService extends BaseApiService {
  // 장바구니 조회
  async getCart(): Promise<ApiResponse<{ cart: Cart }>> {
    return this.request<ApiResponse<{ cart: Cart }>>(API_ENDPOINTS.CART.GET);
  }

  async getCartCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>(API_ENDPOINTS.CART.COUNT);
  }

  // 장바구니 아이템 관리
  async addToCart(
    productId: string, 
    quantity: number, 
    options?: Record<string, string>
  ): Promise<ApiResponse<{ cart: Cart }>> {
    const body: any = { productId, quantity };
    if (options) {
      body.options = options;
    }

    return this.request<ApiResponse<{ cart: Cart }>>(API_ENDPOINTS.CART.ITEMS, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateCartItem(
    productId: string, 
    quantity?: number, 
    options?: Record<string, string>
  ): Promise<ApiResponse<{ cart: Cart }>> {
    const body: any = {};
    if (quantity !== undefined) {
      body.quantity = quantity;
    }
    if (options) {
      body.options = options;
    }

    return this.request<ApiResponse<{ cart: Cart }>>(API_ENDPOINTS.CART.ITEM(productId), {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async removeFromCart(
    productId: string, 
    options?: Record<string, string>
  ): Promise<ApiResponse<{ cart: Cart }>> {
    let endpoint = API_ENDPOINTS.CART.ITEM(productId);
    
    if (options) {
      const queryString = new URLSearchParams({ options: JSON.stringify(options) }).toString();
      endpoint += `?${queryString}`;
    }

    return this.request<ApiResponse<{ cart: Cart }>>(endpoint, {
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
  }>): Promise<ApiResponse<{ cart: Cart; syncSummary: any; invalidItems: any[] }>> {
    return this.request<ApiResponse<{ cart: Cart; syncSummary: any; invalidItems: any[] }>>(
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