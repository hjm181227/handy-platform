import { ApiResponse, ShippingAddress, Product } from '../types';
import { ApiError } from '../utils/apiHelpers';
import { API_ENDPOINTS } from '../config/api';
import { handleApiResponse } from '../utils/apiHelpers';

export class BaseUserManagementService {
  protected baseURL: string;
  protected getAuthHeaders: () => Promise<Record<string, string>>;

  constructor(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>) {
    this.baseURL = baseURL;
    this.getAuthHeaders = getAuthHeaders;
  }

  // 배송지 관리
  async getShippingAddresses(): Promise<ApiResponse<ShippingAddress[]>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USER_MANAGEMENT.ADDRESSES}`, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  async createShippingAddress(address: Omit<ShippingAddress, 'id' | 'userId' | 'createdAt'>): Promise<ApiResponse<ShippingAddress>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USER_MANAGEMENT.ADDRESS_CREATE}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(address),
    });

    return handleApiResponse(response);
  }

  async updateShippingAddress(addressId: string, address: Partial<Omit<ShippingAddress, 'id' | 'userId' | 'createdAt'>>): Promise<ApiResponse<ShippingAddress>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USER_MANAGEMENT.ADDRESS_UPDATE(addressId)}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(address),
    });

    return handleApiResponse(response);
  }

  async deleteShippingAddress(addressId: string): Promise<ApiResponse<void>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USER_MANAGEMENT.ADDRESS_DELETE(addressId)}`, {
      method: 'DELETE',
      headers,
    });

    return handleApiResponse(response);
  }

  async setDefaultAddress(addressId: string): Promise<ApiResponse<void>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USER_MANAGEMENT.ADDRESS_DEFAULT(addressId)}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    return handleApiResponse(response);
  }

  // 위시리스트 관리
  async getWishlist(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ products: Product[]; pagination: any }>> {
    const headers = await this.getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseURL}${API_ENDPOINTS.USER_MANAGEMENT.WISHLIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  async addToWishlist(productId: string): Promise<ApiResponse<void>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USER_MANAGEMENT.WISHLIST_ADD(productId)}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    return handleApiResponse(response);
  }

  async removeFromWishlist(productId: string): Promise<ApiResponse<void>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USER_MANAGEMENT.WISHLIST_REMOVE(productId)}`, {
      method: 'DELETE',
      headers,
    });

    return handleApiResponse(response);
  }

  async isInWishlist(productId: string): Promise<boolean> {
    try {
      const wishlistResponse = await this.getWishlist();
      if (wishlistResponse.data && wishlistResponse.data.products) {
        return wishlistResponse.data.products.some((product: Product) => product.id === productId);
      }
      return false;
    } catch (error) {
      console.warn('Failed to check wishlist status:', error);
      return false;
    }
  }
}

// 사용자 관리 서비스 팩토리
export class UserManagementServiceFactory {
  static create(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>
  ): BaseUserManagementService {
    return new BaseUserManagementService(baseURL, getAuthHeaders);
  }
}