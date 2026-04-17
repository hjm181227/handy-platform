import { BaseApiService } from '../base/BaseApiService';
import { ApiResponse, DecorationAsset, DecorationCategory } from '../../types';
import { API_ENDPOINTS } from '../../config/api';

// 데코레이션 목록 응답
export interface DecorationListResponse {
  success: boolean;
  data: {
    items: DecorationAsset[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

// Presigned URL 응답
export interface DecorationPresignedUrlResponse {
  presignedUrl: string;
  fileUrl: string;
}

export abstract class BaseDecorationService extends BaseApiService {

  // === Admin 데코레이션 관리 ===

  async getDecorations(query: {
    assetType?: 'part' | 'sticker';
    category?: string;
    accessTier?: 'free' | 'paid' | 'pro_only';
    status?: 'active' | 'inactive' | 'pending_review' | 'rejected';
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<DecorationListResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const url = queryString
      ? `${API_ENDPOINTS.ADMIN.DECORATIONS}?${queryString}`
      : API_ENDPOINTS.ADMIN.DECORATIONS;
    return this.request<DecorationListResponse>(url);
  }

  async getDecoration(uuid: string): Promise<DecorationAsset> {
    return this.request<DecorationAsset>(API_ENDPOINTS.ADMIN.DECORATION_DETAIL(uuid));
  }

  async createDecoration(data: Partial<DecorationAsset>): Promise<DecorationAsset> {
    return this.request<DecorationAsset>(API_ENDPOINTS.ADMIN.DECORATIONS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDecoration(uuid: string, data: Partial<DecorationAsset>): Promise<DecorationAsset> {
    return this.request<DecorationAsset>(API_ENDPOINTS.ADMIN.DECORATION_DETAIL(uuid), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDecoration(uuid: string): Promise<void> {
    await this.request<void>(API_ENDPOINTS.ADMIN.DECORATION_DETAIL(uuid), {
      method: 'DELETE',
    });
  }

  async toggleDecorationStatus(uuid: string, status: 'active' | 'inactive'): Promise<DecorationAsset> {
    return this.request<DecorationAsset>(API_ENDPOINTS.ADMIN.DECORATION_STATUS(uuid), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // === Admin 카테고리 관리 ===

  async getDecorationCategories(): Promise<DecorationCategory[]> {
    return this.request<DecorationCategory[]>(API_ENDPOINTS.ADMIN.DECORATION_CATEGORIES);
  }

  async createDecorationCategory(data: Partial<DecorationCategory>): Promise<DecorationCategory> {
    return this.request<DecorationCategory>(API_ENDPOINTS.ADMIN.DECORATION_CATEGORIES, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDecorationCategory(uuid: string, data: Partial<DecorationCategory>): Promise<DecorationCategory> {
    return this.request<DecorationCategory>(API_ENDPOINTS.ADMIN.DECORATION_CATEGORY_DETAIL(uuid), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDecorationCategory(uuid: string): Promise<void> {
    await this.request<void>(API_ENDPOINTS.ADMIN.DECORATION_CATEGORY_DETAIL(uuid), {
      method: 'DELETE',
    });
  }

  // === Presigned URL (에셋 업로드용) ===

  async getDecorationPresignedUrl(params: {
    uploadType: 'decoration-model' | 'decoration-preview';
    fileName: string;
    contentType: string;
  }): Promise<DecorationPresignedUrlResponse> {
    return this.request<DecorationPresignedUrlResponse>(API_ENDPOINTS.UPLOAD.PRESIGNED_URL, {
      method: 'POST',
      body: JSON.stringify({
        filename: params.fileName,
        contentType: params.contentType,
        uploadType: params.uploadType,
      }),
    });
  }
}

export class DecorationServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseDecorationService {
    return new (class extends BaseDecorationService {})(baseURL, getAuthHeaders);
  }
}
