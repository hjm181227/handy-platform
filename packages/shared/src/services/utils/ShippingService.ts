import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  Address
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseShippingService extends BaseApiService {
  // 배송 방법 조회
  async getShippingMethods(filters: {
    state?: string;
    city?: string;
    zipCode?: string;
  } = {}): Promise<ApiResponse<{
    methods: Array<{
      id: string;
      name: string;
      description: string;
      baseCost: number;
      estimatedDays: { min: number; max: number };
      available: boolean;
    }>;
    carriers: Array<{
      id: string;
      name: string;
      code: string;
      services: any[];
    }>;
  }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.SHIPPING.METHODS}?${queryString}` : API_ENDPOINTS.SHIPPING.METHODS;
    return this.request(endpoint);
  }

  // 배송비 계산
  async calculateShipping(data: {
    items: Array<{
      price: number;
      quantity: number;
      weight?: number;
      dimensions?: {
        length: number;
        width: number;
        height: number;
      };
    }>;
    shippingAddress: Address;
    shippingMethod?: string;
  }): Promise<ApiResponse<{
    subtotal: number;
    shippingCost: {
      base: number;
      remoteAreaSurcharge: number;
      weightSurcharge: number;
      total: number;
    };
    tax: number;
    totalAmount: number;
    freeShippingQualified: boolean;
    freeShippingRemaining: number;
    shippingDetails: {
      method: string;
      estimatedDays: { min: number; max: number };
      totalWeight: number;
      volumeWeight: number;
      chargeableWeight: number;
      isRemoteArea: boolean;
    };
  }>> {
    return this.request(API_ENDPOINTS.SHIPPING.CALCULATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 배송업체 조회
  async getCarriers(): Promise<ApiResponse<{
    carriers: Array<{
      id: string;
      name: string;
      nameEn: string;
      code: string;
      contact: {
        phone: string;
        website: string;
        customerService: string;
      };
      services: Array<{
        name: string;
        code: string;
        description: string;
        estimatedDays: { min: number; max: number };
        cost: number;
        isActive: boolean;
      }>;
      isActive: boolean;
    }>;
  }>> {
    return this.request(API_ENDPOINTS.SHIPPING.CARRIERS);
  }
}

export class ShippingServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseShippingService {
    return new (class extends BaseShippingService {})(baseURL, getAuthHeaders);
  }
}