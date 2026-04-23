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

// 단건 wrap 응답
export interface DecorationResponse {
  success: boolean;
  data: DecorationAsset;
}

// 카테고리 목록 wrap 응답
export interface DecorationCategoryListResponse {
  success: boolean;
  data: {
    categories: DecorationCategory[];
  };
}

// 카테고리 단건 wrap 응답
export interface DecorationCategoryResponse {
  success: boolean;
  data: DecorationCategory;
}

// 삭제 응답
export interface DecorationDeleteResponse {
  success: boolean;
  message?: string;
}

// Presigned URL 응답
export interface DecorationPresignedUrlResponse {
  success: boolean;
  presignedUrl: string;
  imageUrl: string;
  filename: string;
  uploadType: string;
  maxFileSize: string;
  expiresIn: string;
  uploadHeaders?: Record<string, string>;
  constraints: {
    allowedTypes: string[];
    maxFileSize: string;
    minDimensions?: string;
    maxDimensions?: string;
    aspectRatio?: number;
  };
}

export abstract class BaseDecorationService extends BaseApiService {

  // === Admin 데코레이션 관리 ===

  async getDecorations(query: {
    assetType?: 'part' | 'sticker';
    category?: string;
    accessTier?: 'free' | 'paid' | 'pro_only';
    status?: 'active' | 'inactive' | 'pending_review' | 'rejected';
    search?: string;
    sort?: string;
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

  async getDecoration(uuid: string): Promise<DecorationResponse> {
    return this.request<DecorationResponse>(API_ENDPOINTS.ADMIN.DECORATION_DETAIL(uuid));
  }

  async createDecoration(data: Partial<DecorationAsset>): Promise<DecorationResponse> {
    return this.request<DecorationResponse>(API_ENDPOINTS.ADMIN.DECORATIONS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDecoration(uuid: string, data: Partial<DecorationAsset>): Promise<DecorationResponse> {
    return this.request<DecorationResponse>(API_ENDPOINTS.ADMIN.DECORATION_DETAIL(uuid), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDecoration(uuid: string): Promise<DecorationDeleteResponse> {
    return this.request<DecorationDeleteResponse>(API_ENDPOINTS.ADMIN.DECORATION_DETAIL(uuid), {
      method: 'DELETE',
    });
  }

  async toggleDecorationStatus(uuid: string, status: 'active' | 'inactive'): Promise<DecorationResponse> {
    return this.request<DecorationResponse>(API_ENDPOINTS.ADMIN.DECORATION_STATUS(uuid), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // === Admin 카테고리 관리 ===

  async getDecorationCategories(): Promise<DecorationCategoryListResponse> {
    return this.request<DecorationCategoryListResponse>(API_ENDPOINTS.ADMIN.DECORATION_CATEGORIES);
  }

  async createDecorationCategory(data: Partial<DecorationCategory>): Promise<DecorationCategoryResponse> {
    return this.request<DecorationCategoryResponse>(API_ENDPOINTS.ADMIN.DECORATION_CATEGORIES, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDecorationCategory(uuid: string, data: Partial<DecorationCategory>): Promise<DecorationCategoryResponse> {
    return this.request<DecorationCategoryResponse>(API_ENDPOINTS.ADMIN.DECORATION_CATEGORY_DETAIL(uuid), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDecorationCategory(uuid: string): Promise<DecorationDeleteResponse> {
    return this.request<DecorationDeleteResponse>(API_ENDPOINTS.ADMIN.DECORATION_CATEGORY_DETAIL(uuid), {
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
