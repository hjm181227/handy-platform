import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  PresignedUrlRequest,
  PresignedUrlResponse,
  ImageUploadConfig
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseImageService extends BaseApiService {
  // Presigned URL 관련
  async getPresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    return this.request<PresignedUrlResponse>(API_ENDPOINTS.UPLOAD.PRESIGNED_URL, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getUploadConfig(uploadType?: string): Promise<ImageUploadConfig> {
    const queryString = uploadType ? `?uploadType=${uploadType}` : '';
    return this.request<ImageUploadConfig>(`${API_ENDPOINTS.UPLOAD.CONFIG}${queryString}`);
  }

  // 이미지 업로드 완료 알림
  async notifyUploadComplete(images: string[], targetPath?: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/upload/complete', {
      method: 'POST',
      body: JSON.stringify({ images, targetPath }),
    });
  }

  // 이미지 메타데이터 관련
  async getImageMetadata(imageId: string): Promise<ApiResponse<{
    id: string;
    filename: string;
    originalFilename: string;
    url: string;
    uploadType: string;
    uploadedBy: {
      name: string;
      email: string;
    };
    contentType: string;
    fileSize: number;
    dimensions: {
      width: number;
      height: number;
    };
    thumbnails: Array<{
      size: string;
      url: string;
      fileSize: number;
    }>;
    optimization: {
      isOptimized: boolean;
      originalSize: number;
      optimizedSize: number;
      compressionRatio: number;
      quality: number;
    };
    usage: {
      relatedEntityType: string;
      relatedEntityId: string;
      usageCount: number;
      isActive: boolean;
    };
    security: {
      isScanned: boolean;
      scanResult: string;
      exifRemoved: boolean;
    };
    stats: {
      viewCount: number;
      downloadCount: number;
    };
    status: string;
    uploadedAt: string;
  }>> {
    return this.request(API_ENDPOINTS.UPLOAD.METADATA_DETAIL(imageId));
  }

  async getUserImages(filters: {
    uploadType?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<ApiResponse<{
    images: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.UPLOAD.METADATA}?${queryString}` : API_ENDPOINTS.UPLOAD.METADATA;
    return this.request(endpoint);
  }

  // 이미지 변환
  async transformImage(data: {
    imageUrl: string;
    transformations: {
      width?: number;
      height?: number;
      format?: 'jpeg' | 'png' | 'webp' | 'avif';
      quality?: number;
      rotate?: number;
      flip?: boolean;
      blur?: number;
      sharpen?: boolean;
      grayscale?: boolean;
      crop?: {
        left: number;
        top: number;
        width: number;
        height: number;
      };
    };
  }): Promise<ApiResponse<{
    originalUrl: string;
    transformedUrl: string;
    transformations: any;
    fileSize: number;
    expiresIn: string;
  }>> {
    return this.request(API_ENDPOINTS.UPLOAD.TRANSFORM, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 이미지 사용 통계
  async getImageStats(filters: {
    days?: number;
    includeAll?: boolean;
  } = {}): Promise<ApiResponse<{
    usage: {
      byType: Array<{
        _id: string;
        count: number;
        totalSize: number;
        avgSize: number;
      }>;
      total: {
        totalImages: number;
        totalSize: number;
        avgSize: number;
      };
    };
    statusBreakdown: Array<{
      _id: string;
      count: number;
      totalSize: number;
    }>;
    period: string;
  }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.UPLOAD.STATS}?${queryString}` : API_ENDPOINTS.UPLOAD.STATS;
    return this.request(endpoint);
  }

  // 이미지 삭제
  async deleteImage(imageId: string, deleteFromS3 = false): Promise<ApiResponse<{
    imageId: string;
    deletedFromS3: boolean;
  }>> {
    const queryString = deleteFromS3 ? '?deleteFromS3=true' : '';
    return this.request(`${API_ENDPOINTS.UPLOAD.DELETE(imageId)}${queryString}`, {
      method: 'DELETE',
    });
  }
}

export class ImageServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseImageService {
    return new (class extends BaseImageService {})(baseURL, getAuthHeaders);
  }
}