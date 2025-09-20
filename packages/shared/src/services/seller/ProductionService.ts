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
   */
  async getProductionSettings(): Promise<ProductionSettingsResponse> {
    return this.request<ProductionSettingsResponse>(API_ENDPOINTS.SELLER.PRODUCTION_SETTINGS);
  }

  /**
   * 판매자의 생산 설정을 업데이트합니다.
   */
  async updateProductionSettings(data: UpdateProductionSettingsRequest): Promise<ProductionSettingsResponse> {
    return this.request<ProductionSettingsResponse>(API_ENDPOINTS.SELLER.PRODUCTION_SETTINGS, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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

    if (settings.weeklyCapacity !== undefined) {
      if (settings.weeklyCapacity < 1 || settings.weeklyCapacity > 500) {
        errors.push('주간 생산량은 1~500개 사이여야 합니다.');
      }
    }

    if (settings.monthlyCapacity !== undefined) {
      if (settings.monthlyCapacity < 1 || settings.monthlyCapacity > 2000) {
        errors.push('월간 생산량은 1~2000개 사이여야 합니다.');
      }
      
      // 월간 생산량은 주간 생산량의 4.3배 이상이어야 함
      if (settings.weeklyCapacity !== undefined) {
        const minMonthlyCapacity = Math.ceil(settings.weeklyCapacity * 4.3);
        if (settings.monthlyCapacity < minMonthlyCapacity) {
          errors.push(`월간 생산량은 최소 ${minMonthlyCapacity}개 이상이어야 합니다 (주간 생산량 × 4.3배).`);
        }
      }
    }

    if (settings.averageProcessingDays !== undefined) {
      if (settings.averageProcessingDays < 1 || settings.averageProcessingDays > 30) {
        errors.push('평균 제작 소요일은 1~30일 사이여야 합니다.');
      }
    }

    if (settings.vacationMode === true) {
      if (!settings.vacationStartDate || !settings.vacationEndDate) {
        errors.push('휴가 모드 설정 시 휴가 시작일과 종료일이 필요합니다.');
      } else {
        const startDate = new Date(settings.vacationStartDate);
        const endDate = new Date(settings.vacationEndDate);
        
        if (startDate >= endDate) {
          errors.push('휴가 종료일은 시작일보다 늦어야 합니다.');
        }
        
        if (startDate < new Date()) {
          errors.push('휴가 시작일은 현재 날짜보다 늦어야 합니다.');
        }
      }
    }

    if (settings.specialNotice !== undefined && settings.specialNotice.length > 500) {
      errors.push('특별 안내사항은 500자 이하여야 합니다.');
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