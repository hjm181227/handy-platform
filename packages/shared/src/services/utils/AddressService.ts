import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  KoreanAddress,
  KoreanAddressResponse,
  KoreanAddressListResponse,
  KoreanAddressValidationRequest,
  KoreanAddressValidationResponse
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseAddressService extends BaseApiService {
  // 배송지 목록 조회
  async getAddresses(): Promise<ApiResponse<KoreanAddressListResponse>> {
    return this.request<ApiResponse<KoreanAddressListResponse>>(API_ENDPOINTS.SHIPPING_ADDRESSES.LIST);
  }

  // 배송지 추가
  async createAddress(address: KoreanAddress): Promise<ApiResponse<KoreanAddressResponse>> {
    return this.request<ApiResponse<KoreanAddressResponse>>(API_ENDPOINTS.SHIPPING_ADDRESSES.CREATE, {
      method: 'POST',
      body: JSON.stringify(address),
    });
  }

  // 배송지 수정
  async updateAddress(index: string, address: KoreanAddress): Promise<ApiResponse<KoreanAddressResponse>> {
    return this.request<ApiResponse<KoreanAddressResponse>>(API_ENDPOINTS.SHIPPING_ADDRESSES.UPDATE(index), {
      method: 'PUT',
      body: JSON.stringify(address),
    });
  }

  // 배송지 삭제
  async deleteAddress(index: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(API_ENDPOINTS.SHIPPING_ADDRESSES.DELETE(index), {
      method: 'DELETE',
    });
  }

  // 기본 배송지 설정
  async setDefaultAddress(index: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(API_ENDPOINTS.SHIPPING_ADDRESSES.SET_DEFAULT(index), {
      method: 'POST',
    });
  }

  // 배송지 유효성 검사
  async validateAddress(address: KoreanAddressValidationRequest): Promise<ApiResponse<KoreanAddressValidationResponse>> {
    return this.request<ApiResponse<KoreanAddressValidationResponse>>(API_ENDPOINTS.SHIPPING_ADDRESSES.VALIDATE, {
      method: 'POST',
      body: JSON.stringify(address),
    });
  }
}

export class AddressServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseAddressService {
    return new (class extends BaseAddressService {})(baseURL, getAuthHeaders);
  }
}