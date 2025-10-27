import { BaseApiService } from '../base/BaseApiService';
import { LikeResponse, LikesListResponse, TargetType } from '../../types';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Base LikesService
 * 좋아요 기능 제공 (상품, 브랜드, 게시물)
 */
export abstract class BaseLikesService extends BaseApiService {
  /**
   * 좋아요 추가
   * @param targetType - 'product' | 'brand' | 'post'
   * @param targetUuid - 대상의 UUID
   */
  async like(targetType: TargetType, targetUuid: string): Promise<LikeResponse> {
    const response = await this.request<LikeResponse>(
      API_ENDPOINTS.LIKES.LIKE,
      {
        method: 'POST',
        body: JSON.stringify({
          targetType,
          targetUuid,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response;
  }

  /**
   * 좋아요 제거
   * @param targetType - 'product' | 'brand' | 'post'
   * @param targetUuid - 대상의 UUID
   */
  async unlike(targetType: TargetType, targetUuid: string): Promise<LikeResponse> {
    const response = await this.request<LikeResponse>(
      API_ENDPOINTS.LIKES.UNLIKE,
      {
        method: 'POST',
        body: JSON.stringify({
          targetType,
          targetUuid,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response;
  }

  /**
   * 사용자의 좋아요 목록 조회
   * @param targetType - 선택적 필터 (지정하지 않으면 모든 타입)
   */
  async getUserLikes(targetType?: TargetType): Promise<LikesListResponse> {
    const body: any = {};
    if (targetType) {
      body.targetType = targetType;
    }

    const response = await this.request<LikesListResponse>(
      API_ENDPOINTS.LIKES.LIST,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response;
  }
}

export class LikesServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseLikesService {
    return new (class extends BaseLikesService {})(baseURL, getAuthHeaders);
  }
}
