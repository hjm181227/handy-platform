import { BaseApiService } from '../base/BaseApiService';
import { API_ENDPOINTS } from '../../config/api';
import {
  AnnouncementListResponse,
  AnnouncementDetailResponse,
  AnnouncementStatus,
  Announcement,
} from '../../types';

export abstract class BaseAnnouncementService extends BaseApiService {

  // === Public ===

  /**
   * 공개 공지사항 목록 조회
   */
  async getAnnouncements(params?: {
    target?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<AnnouncementListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.target) queryParams.append('target', params.target);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = query
      ? `${API_ENDPOINTS.ANNOUNCEMENTS}?${query}`
      : API_ENDPOINTS.ANNOUNCEMENTS;

    return this.request<AnnouncementListResponse>(url);
  }

  /**
   * 공개 공지사항 상세 조회
   */
  async getAnnouncementDetail(uuid: string): Promise<AnnouncementDetailResponse> {
    return this.request<AnnouncementDetailResponse>(API_ENDPOINTS.ANNOUNCEMENT_DETAIL(uuid));
  }

  // === Admin ===

  /**
   * 어드민 공지사항 목록 조회
   */
  async getAdminAnnouncements(params?: {
    status?: string;
    category?: string;
    target?: string;
    page?: number;
    limit?: number;
  }): Promise<AnnouncementListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.target) queryParams.append('target', params.target);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = query
      ? `${API_ENDPOINTS.ADMIN.ANNOUNCEMENTS}?${query}`
      : API_ENDPOINTS.ADMIN.ANNOUNCEMENTS;

    return this.request<AnnouncementListResponse>(url);
  }

  /**
   * 어드민 공지사항 상세 조회
   */
  async getAdminAnnouncementDetail(uuid: string): Promise<AnnouncementDetailResponse> {
    return this.request<AnnouncementDetailResponse>(API_ENDPOINTS.ADMIN.ANNOUNCEMENT_DETAIL(uuid));
  }

  /**
   * 공지사항 생성
   */
  async createAnnouncement(data: Partial<Announcement>): Promise<AnnouncementDetailResponse> {
    return this.request<AnnouncementDetailResponse>(API_ENDPOINTS.ADMIN.ANNOUNCEMENTS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 공지사항 수정
   */
  async updateAnnouncement(uuid: string, data: Partial<Announcement>): Promise<AnnouncementDetailResponse> {
    return this.request<AnnouncementDetailResponse>(API_ENDPOINTS.ADMIN.ANNOUNCEMENT_DETAIL(uuid), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 공지사항 삭제
   */
  async deleteAnnouncement(uuid: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(API_ENDPOINTS.ADMIN.ANNOUNCEMENT_DETAIL(uuid), {
      method: 'DELETE',
    });
  }

  /**
   * 공지사항 상태 변경 (publish / archive)
   */
  async updateAnnouncementStatus(uuid: string, status: AnnouncementStatus): Promise<AnnouncementDetailResponse> {
    return this.request<AnnouncementDetailResponse>(API_ENDPOINTS.ADMIN.ANNOUNCEMENT_STATUS(uuid), {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * 공지사항 고정/해제 토글
   */
  async toggleAnnouncementPin(uuid: string): Promise<AnnouncementDetailResponse> {
    return this.request<AnnouncementDetailResponse>(API_ENDPOINTS.ADMIN.ANNOUNCEMENT_PIN(uuid), {
      method: 'PUT',
    });
  }
}

export class AnnouncementServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseAnnouncementService {
    return new (class extends BaseAnnouncementService {})(baseURL, getAuthHeaders);
  }
}
