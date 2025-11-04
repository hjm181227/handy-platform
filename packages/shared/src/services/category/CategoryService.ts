import { BaseApiService } from '../base/BaseApiService';
import { CategoryIconsResponse, CategoryData, CategoryResponse } from '../../types';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Base CategoryService
 * 카테고리 관련 데이터 제공
 */
export abstract class BaseCategoryService extends BaseApiService {
  /**
   * 카테고리 목록 조회
   * Public API (인증 불필요)
   * 실제 서버 엔드포인트: GET /api/categories/icons
   */
  async getCategories(): Promise<CategoryResponse> {
    const response = await this.request<CategoryResponse>(
      API_ENDPOINTS.CATEGORIES.ICONS,
      {
        method: 'GET',
      }
    );

    return response;
  }

  /**
   * 카테고리 아이콘 목록 조회
   * Public API (인증 불필요), 24시간 캐시
   */
  async getCategoryIcons(): Promise<CategoryIconsResponse> {
    const response = await this.request<CategoryIconsResponse>(
      API_ENDPOINTS.CATEGORIES.ICONS,
      {
        method: 'GET',
      }
    );

    return response;
  }
}

export class CategoryServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseCategoryService {
    return new (class extends BaseCategoryService {})(baseURL, getAuthHeaders);
  }
}
