import { BaseApiService } from '../base/BaseApiService';
import { API_ENDPOINTS } from '../../config/api';
import {
  SnapListResponse,
  SnapDetailResponse,
  SnapCreateRequest,
  SnapFeedParams,
  SnapCommentListResponse,
  SnapPopularTagsResponse,
  SnapFeedResponse,
  UserProfileSnapsResponse,
  SnapReportRequest,
  SnapReportResponse,
} from '../../types';

export abstract class BaseSnapService extends BaseApiService {

  /**
   * 스냅 피드 목록 조회
   */
  async getSnaps(params?: SnapFeedParams): Promise<SnapListResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.tag) queryParams.append('tag', params.tag);
      if (params.style) queryParams.append('style', params.style);
      if (params.color) queryParams.append('color', params.color);
      if (params.texture) queryParams.append('texture', params.texture);
      if (params.tpo) queryParams.append('tpo', params.tpo);
      if (params.nation) queryParams.append('nation', params.nation);
      if (params.shape) queryParams.append('shape', params.shape);
      if (params.length) queryParams.append('length', params.length);
      if (params.creator) queryParams.append('creator', params.creator);
    }

    const query = queryParams.toString();
    const url = query ? `${API_ENDPOINTS.SNAPS.LIST}?${query}` : API_ENDPOINTS.SNAPS.LIST;

    return this.request<SnapListResponse>(url);
  }

  /**
   * 스냅 상세 조회
   */
  async getSnapDetail(snapUuid: string): Promise<SnapDetailResponse> {
    return this.request<SnapDetailResponse>(API_ENDPOINTS.SNAPS.DETAIL(snapUuid));
  }

  /**
   * 유저별 스냅 목록 조회
   */
  async getUserSnaps(userUuid: string, params?: { page?: number; limit?: number }): Promise<SnapListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = query
      ? `${API_ENDPOINTS.SNAPS.USER_SNAPS(userUuid)}?${query}`
      : API_ENDPOINTS.SNAPS.USER_SNAPS(userUuid);

    return this.request<SnapListResponse>(url);
  }

  /**
   * 인기 태그 조회
   */
  async getPopularTags(): Promise<SnapPopularTagsResponse> {
    return this.request<SnapPopularTagsResponse>(API_ENDPOINTS.SNAPS.POPULAR_TAGS);
  }

  /**
   * 스냅 생성
   */
  async createSnap(data: SnapCreateRequest): Promise<SnapDetailResponse> {
    return this.request<SnapDetailResponse>(API_ENDPOINTS.SNAPS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 스냅 수정
   */
  async updateSnap(snapUuid: string, data: Partial<SnapCreateRequest>): Promise<SnapDetailResponse> {
    return this.request<SnapDetailResponse>(API_ENDPOINTS.SNAPS.UPDATE(snapUuid), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 스냅 삭제
   */
  async deleteSnap(snapUuid: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(API_ENDPOINTS.SNAPS.DELETE(snapUuid), {
      method: 'DELETE',
    });
  }

  /**
   * 팔로잉 피드 조회
   */
  async getFeed(params?: { page?: number; limit?: number }): Promise<SnapFeedResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = query ? `${API_ENDPOINTS.SNAPS.FEED}?${query}` : API_ENDPOINTS.SNAPS.FEED;

    return this.request<SnapFeedResponse>(url);
  }

  /**
   * 유저 프로필 + 스냅 목록 조회
   */
  async getUserProfile(userUuid: string, params?: { page?: number; limit?: number }): Promise<UserProfileSnapsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = query
      ? `${API_ENDPOINTS.SNAPS.USER_SNAPS(userUuid)}?${query}`
      : API_ENDPOINTS.SNAPS.USER_SNAPS(userUuid);

    return this.request<UserProfileSnapsResponse>(url);
  }

  /**
   * 스냅 댓글 목록 조회
   */
  async getComments(snapUuid: string, params?: { page?: number; limit?: number }): Promise<SnapCommentListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = query
      ? `${API_ENDPOINTS.SNAPS.COMMENTS(snapUuid)}?${query}`
      : API_ENDPOINTS.SNAPS.COMMENTS(snapUuid);

    return this.request<SnapCommentListResponse>(url);
  }

  /**
   * 스냅 댓글 작성
   */
  async createComment(snapUuid: string, data: { content: string; parentCommentUuid?: string }): Promise<{ success: boolean; data: any }> {
    return this.request<{ success: boolean; data: any }>(API_ENDPOINTS.SNAPS.COMMENTS(snapUuid), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 스냅 신고
   */
  async reportSnap(snapUuid: string, data: SnapReportRequest): Promise<SnapReportResponse> {
    return this.request<SnapReportResponse>(API_ENDPOINTS.SNAPS.REPORT(snapUuid), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 스냅 댓글 삭제
   */
  async deleteComment(snapUuid: string, commentUuid: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      API_ENDPOINTS.SNAPS.COMMENT_DELETE(snapUuid, commentUuid),
      { method: 'DELETE' }
    );
  }
}

export class SnapServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseSnapService {
    return new (class extends BaseSnapService {})(baseURL, getAuthHeaders);
  }
}
