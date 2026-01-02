import { BaseApiService } from '../base/BaseApiService';
import {
  BrandsResponse,
  BrandListParams,
  UpdateBrandNameRequest,
  UpdateBrandProfileRequest,
  UpdateBrandBannerRequest,
  BrandUpdateResponse,
  BrandDetailResponse
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseBrandService extends BaseApiService {
  /**
   * 브랜드 목록을 조회합니다
   * @param params 브랜드 조회 파라미터 (페이지네이션, 검색, 정렬 등)
   * @returns 브랜드 목록과 페이지네이션 정보
   */
  async getBrands(params: BrandListParams = {}): Promise<BrandsResponse> {
    // 기본값을 설정한 파라미터 객체 생성
    const requestBody = {
      page: params.page || '1',
      listNum: params.listNum || '10',
      withItems: params.withItems !== undefined ? params.withItems : false,
      itemListNum: params.itemListNum || '4',
      ...(params.search && { search: params.search }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder })
    };

    const response = await this.request<BrandsResponse>(API_ENDPOINTS.BRANDS.LIST, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return response;
  }

  /**
   * 특정 브랜드의 상세 정보를 조회합니다
   * @param sellerUuid 판매자 UUID
   * @returns 브랜드 상세 정보
   */
  async getBrandDetail(sellerUuid: string): Promise<BrandDetailResponse> {
    const endpoint = API_ENDPOINTS.BRANDS.DETAIL(sellerUuid);

    const response = await this.request<BrandDetailResponse>(endpoint, {
      method: 'GET',
    });

    return response;
  }

  /**
   * 브랜드명을 변경합니다 (인증 필요)
   * @param sellerUuid 판매자 UUID
   * @param data 새로운 브랜드명
   * @returns 업데이트된 브랜드 정보
   */
  async updateBrandName(sellerUuid: string, data: UpdateBrandNameRequest): Promise<BrandUpdateResponse> {
    const endpoint = API_ENDPOINTS.BRANDS.UPDATE_NAME(sellerUuid);

    const response = await this.request<BrandUpdateResponse>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return response;
  }

  /**
   * 브랜드 프로필 이미지를 변경합니다 (인증 필요)
   * @param sellerUuid 판매자 UUID
   * @param data 새로운 브랜드 프로필 이미지 URL
   * @returns 업데이트된 브랜드 정보
   */
  async updateBrandProfile(sellerUuid: string, data: UpdateBrandProfileRequest): Promise<BrandUpdateResponse> {
    const endpoint = API_ENDPOINTS.BRANDS.UPDATE_PROFILE(sellerUuid);

    const response = await this.request<BrandUpdateResponse>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return response;
  }

  /**
   * 브랜드 배너 이미지를 변경합니다 (인증 필요)
   * @param sellerUuid 판매자 UUID
   * @param data 새로운 브랜드 배너 이미지 URL
   * @returns 업데이트된 브랜드 정보
   */
  async updateBrandBanner(sellerUuid: string, data: UpdateBrandBannerRequest): Promise<BrandUpdateResponse> {
    const endpoint = API_ENDPOINTS.BRANDS.UPDATE_BANNER(sellerUuid);

    const response = await this.request<BrandUpdateResponse>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return response;
  }
}

// Platform-specific implementations
export class WebBrandService extends BaseBrandService {
  // Web-specific implementations can be added here if needed
}

export class MobileBrandService extends BaseBrandService {
  // Mobile-specific implementations can be added here if needed
}

// Factory function
export function createBrandService(
  baseURL: string,
  getAuthHeaders: () => Promise<Record<string, string>>,
  platform: 'web' | 'mobile'
): BaseBrandService {
  switch (platform) {
    case 'web':
      return new WebBrandService(baseURL, getAuthHeaders);
    case 'mobile':
      return new MobileBrandService(baseURL, getAuthHeaders);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
