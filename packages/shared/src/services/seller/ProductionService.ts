import { BaseApiService } from '../base/BaseApiService';
import {
  ApiResponse,
  ProductionSettingsResponse,
  ProductionCapacityResponse,
  ProductionHistoryApiResponse,
  UpdateProductionSettingsRequest,
  UpdateProductionCapacityRequest,
  AddExtraCapacityRequest,
  ProductionBoostRequest,
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseProductionService extends BaseApiService {
  /**
   * 판매자의 현재 생산 설정을 조회합니다.
   * GET /api/seller/info - 현재 판매자 정보 조회 (생산 설정 포함)
   */
  async getProductionSettings(): Promise<ProductionSettingsResponse> {
    const response = await this.request<any>(API_ENDPOINTS.SELLER.CURRENT_INFO);

    // 서버 응답에서 productionSettings 추출
    // 응답 구조: { success: true, data: { sellerInfo: { productionSettings: {...} } } }
    return {
      productionSettings: response.data?.sellerInfo?.productionSettings || response.data?.productionSettings,
      currentCapacity: response.data?.currentCapacity,
      isConfigured: response.data?.isConfigured
    };
  }

  /**
   * 판매자의 생산 설정을 업데이트합니다.
   * PUT /api/seller/info - 생산 설정 업데이트 (중첩된 구조로 전송)
   */
  async updateProductionSettings(data: UpdateProductionSettingsRequest): Promise<ProductionSettingsResponse> {
    const response = await this.request<any>(API_ENDPOINTS.SELLER.CURRENT_INFO, {
      method: 'PUT',
      body: JSON.stringify({ productionSettings: data }),
    });

    // 서버 응답에서 productionSettings 추출
    return {
      productionSettings: response.data?.sellerInfo?.productionSettings || response.data?.productionSettings
    };
  }

  /**
   * 특정 월의 생산 현황을 조회합니다.
   * @param year 조회할 년도 (2024-2030, 선택사항)
   * @param month 조회할 월 (1-12, 선택사항)
   */
  async getProductionCapacity(year?: number, month?: number): Promise<ProductionCapacityResponse> {
    const endpoint = API_ENDPOINTS.SELLER.PRODUCTION_CAPACITY(year, month);
    return this.request<ProductionCapacityResponse>(endpoint);
  }

  /**
   * 특정 월의 생산 용량을 직접 수정합니다.
   * @param year 수정할 년도 (2024-2030)
   * @param month 수정할 월 (1-12)
   * @param data 수정 데이터 (최대 주문 수, 수정 사유)
   */
  async updateProductionCapacity(
    year: number, 
    month: number, 
    data: UpdateProductionCapacityRequest
  ): Promise<ProductionCapacityResponse> {
    const endpoint = API_ENDPOINTS.SELLER.PRODUCTION_CAPACITY_UPDATE(year, month);
    return this.request<ProductionCapacityResponse>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 최근 12개월간의 생산 현황 히스토리를 조회합니다.
   */
  async getProductionHistory(): Promise<ProductionHistoryApiResponse> {
    return this.request<ProductionHistoryApiResponse>(API_ENDPOINTS.SELLER.PRODUCTION_HISTORY);
  }

  /**
   * 특정 월에 임의의 추가 생산량을 적용합니다.
   * @param year 적용할 년도 (2024-2030)
   * @param month 적용할 월 (1-12)
   * @param data 추가 생산량 데이터
   */
  async addExtraCapacity(
    year: number, 
    month: number, 
    data: AddExtraCapacityRequest
  ): Promise<ProductionCapacityResponse> {
    const endpoint = API_ENDPOINTS.SELLER.PRODUCTION_ADD_EXTRA(year, month);
    return this.request<ProductionCapacityResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 현재 월에 임시 생산량 부스트를 적용합니다.
   * @param data 부스트 데이터 (부스트량, 사유, 지속 기간)
   */
  async applyProductionBoost(data: ProductionBoostRequest): Promise<ProductionCapacityResponse> {
    return this.request<ProductionCapacityResponse>(API_ENDPOINTS.SELLER.PRODUCTION_BOOST, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 현재 월의 생산 현황을 빠르게 조회합니다 (대시보드용)
   */
  async getCurrentCapacity(): Promise<ProductionCapacityResponse> {
    const now = new Date();
    return this.getProductionCapacity(now.getFullYear(), now.getMonth() + 1);
  }

  /**
   * 생산 설정의 유효성을 검증합니다.
   * @param settings 검증할 생산 설정
   */
  validateProductionSettings(settings: UpdateProductionSettingsRequest): string[] {
    const errors: string[] = [];

    // orderCapacity 검증
    if (settings.orderCapacity !== undefined) {
      if (!settings.orderCapacity || settings.orderCapacity < 1) {
        errors.push('적정 생산량은 최소 1개 이상이어야 합니다.');
      }
      if (settings.orderCapacity > 100) {
        errors.push('적정 생산량은 100개 이하로 설정해주세요.');
      }
    }

    // averageProcessingDays 검증
    if (settings.averageProcessingDays !== undefined) {
      if (!settings.averageProcessingDays || settings.averageProcessingDays < 1) {
        errors.push('평균 제작 소요일은 최소 1일 이상이어야 합니다.');
      }
      if (settings.averageProcessingDays > 30) {
        errors.push('평균 제작 소요일은 30일 이하로 설정해주세요.');
      }
    }

    // 특별 안내사항 검증
    if (settings.specialNotice !== undefined && settings.specialNotice.length > 500) {
      errors.push('특별 안내사항은 500자 이내로 작성해주세요.');
    }

    return errors;
  }

  /**
   * 추가 생산량 요청의 유효성을 검증합니다.
   */
  validateExtraCapacity(data: AddExtraCapacityRequest): string[] {
    const errors: string[] = [];

    if (data.extraCapacity < 1 || data.extraCapacity > 1000) {
      errors.push('추가 생산량은 1~1000개 사이여야 합니다.');
    }

    if (!data.reason || data.reason.trim().length === 0) {
      errors.push('추가 사유는 필수 입력 항목입니다.');
    } else if (data.reason.length > 200) {
      errors.push('추가 사유는 200자 이하여야 합니다.');
    }

    if (data.expiresAt) {
      const expiryDate = new Date(data.expiresAt);
      if (expiryDate <= new Date()) {
        errors.push('만료일은 현재 날짜보다 늦어야 합니다.');
      }
    }

    return errors;
  }

  /**
   * 생산량 부스트 요청의 유효성을 검증합니다.
   */
  validateProductionBoost(data: ProductionBoostRequest): string[] {
    const errors: string[] = [];

    if (data.boostAmount < 1 || data.boostAmount > 500) {
      errors.push('부스트량은 1~500개 사이여야 합니다.');
    }

    if (!data.reason || data.reason.trim().length === 0) {
      errors.push('부스트 사유는 필수 입력 항목입니다.');
    } else if (data.reason.length > 200) {
      errors.push('부스트 사유는 200자 이하여야 합니다.');
    }

    if (data.duration < 1 || data.duration > 30) {
      errors.push('지속 기간은 1~30일 사이여야 합니다.');
    }

    return errors;
  }
}

export class ProductionServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseProductionService {
    return new (class extends BaseProductionService {})(baseURL, getAuthHeaders);
  }
}