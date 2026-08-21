import { BaseApiService } from '../base/BaseApiService';
import {
  BrandsResponse,
  BrandListParams,
  UpdateBrandNameRequest,
  UpdateBrandProfileRequest,
  UpdateBrandBannerRequest,
  BrandUpdateResponse,
  BrandDetailResponse,
  BrandBusinessInfoResponse,
  BrandSlugAvailabilityResponse,
  BrandSlugUpdateResponse
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
   * 판매자 사업자 정보를 조회합니다 (비인증)
   *
   * 전자상거래법상 판매자 신원정보 공개용이며, 승인된 판매자만 데이터를 반환합니다.
   * 미승인/미등록 판매자는 서버가 404를 반환하므로 호출부에서 ApiError(status 404)를 처리해야 합니다.
   *
   * @param sellerUuid 판매자 UUID
   * @returns 상호, 대표자, 사업자등록번호, 사업장 소재지, 통신판매업 신고번호(있을 때), 이메일
   */
  async getBrandBusinessInfo(sellerUuid: string): Promise<BrandBusinessInfoResponse> {
    const endpoint = API_ENDPOINTS.BRANDS.BUSINESS_INFO(sellerUuid);

    const response = await this.request<BrandBusinessInfoResponse>(endpoint, {
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

  /**
   * 브랜드 주소(slug) 사용 가능 여부를 확인합니다 (인증 필요)
   *
   * 규칙: 영문 소문자·숫자·하이픈, 2~40자, 하이픈으로 시작/끝 불가, 예약어 불가
   *
   * @param slug 확인할 브랜드 주소
   * @returns 사용 가능 여부와 불가 사유
   */
  async checkBrandSlug(slug: string): Promise<BrandSlugAvailabilityResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('slug', slug);

    const endpoint = `${API_ENDPOINTS.BRANDS.SLUG_AVAILABLE}?${queryParams.toString()}`;

    const response = await this.request<BrandSlugAvailabilityResponse>(endpoint, {
      method: 'GET',
    });

    return response;
  }

  /**
   * 브랜드 주소(slug)를 변경합니다 (인증 + 셀러 권한 필요)
   *
   * 형식 오류는 400, 이미 선점된 주소는 409로 응답하며
   * 서버가 내려주는 error 메시지를 그대로 사용자에게 보여준다.
   *
   * @param sellerUuid 판매자 UUID
   * @param slug 새로운 브랜드 주소
   * @returns 변경된 브랜드 주소 정보
   */
  async updateBrandSlug(sellerUuid: string, slug: string): Promise<BrandSlugUpdateResponse> {
    const endpoint = API_ENDPOINTS.BRANDS.UPDATE_SLUG(sellerUuid);

    const response = await this.request<BrandSlugUpdateResponse>(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ slug }),
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
