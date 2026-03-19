import { BaseApiService } from '../base/BaseApiService';
import { API_ENDPOINTS } from '../../config/api';
import {
  FollowActionResponse,
  FollowListResponse,
  FollowStatusResponse,
  FollowCountsResponse,
} from '../../types';

export abstract class BaseFollowService extends BaseApiService {

  /**
   * 유저 팔로우
   */
  async follow(userUuid: string): Promise<FollowActionResponse> {
    return this.request<FollowActionResponse>(API_ENDPOINTS.FOLLOWS.FOLLOW(userUuid), {
      method: 'POST',
    });
  }

  /**
   * 유저 언팔로우
   */
  async unfollow(userUuid: string): Promise<FollowActionResponse> {
    return this.request<FollowActionResponse>(API_ENDPOINTS.FOLLOWS.UNFOLLOW(userUuid), {
      method: 'DELETE',
    });
  }

  /**
   * 팔로워 목록 조회
   */
  async getFollowers(userUuid: string, params?: { page?: number; limit?: number }): Promise<FollowListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = query
      ? `${API_ENDPOINTS.FOLLOWS.FOLLOWERS(userUuid)}?${query}`
      : API_ENDPOINTS.FOLLOWS.FOLLOWERS(userUuid);

    return this.request<FollowListResponse>(url);
  }

  /**
   * 팔로잉 목록 조회
   */
  async getFollowing(userUuid: string, params?: { page?: number; limit?: number }): Promise<FollowListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = query
      ? `${API_ENDPOINTS.FOLLOWS.FOLLOWING(userUuid)}?${query}`
      : API_ENDPOINTS.FOLLOWS.FOLLOWING(userUuid);

    return this.request<FollowListResponse>(url);
  }

  /**
   * 팔로우 상태 확인
   */
  async getFollowStatus(userUuid: string): Promise<FollowStatusResponse> {
    return this.request<FollowStatusResponse>(API_ENDPOINTS.FOLLOWS.STATUS(userUuid));
  }

  /**
   * 내 팔로워/팔로잉 수 조회
   */
  async getMyCounts(): Promise<FollowCountsResponse> {
    return this.request<FollowCountsResponse>(API_ENDPOINTS.FOLLOWS.MY_COUNTS);
  }
}

export class FollowServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseFollowService {
    return new (class extends BaseFollowService {})(baseURL, getAuthHeaders);
  }
}
