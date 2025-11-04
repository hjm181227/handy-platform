import { BaseApiService } from '../base/BaseApiService';
import { API_ENDPOINTS } from '../../config/api';
import { EventBannerListResponse } from '../../types';

export abstract class BaseBannerService extends BaseApiService {

  /**
   * 공개 이벤트 배너 목록 조회
   * @param params - 조회 파라미터 (limit)
   * @returns 이벤트 배너 목록
   */
  async getPublicBanners(params?: { limit?: number }): Promise<EventBannerListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const url = params?.limit
      ? `${API_ENDPOINTS.EVENT_BANNERS}?${queryParams.toString()}`
      : API_ENDPOINTS.EVENT_BANNERS;

    return this.request<EventBannerListResponse>(url);
  }
}

export class BannerServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseBannerService {
    return new (class extends BaseBannerService {})(baseURL, getAuthHeaders);
  }
}
