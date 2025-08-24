import { PresignedUrlRequest, PresignedUrlResponse, ProductImage } from '../types';
import { ApiError } from './apiHelpers';

export interface ImageUploadOptions {
  file: File | Blob;
  uploadType: 'product-main' | 'product-detail' | 'review' | 'avatar' | 'category' | 'coupon' | 'qr-code' | 'general';
  filename?: string;
  onProgress?: (progress: number) => void;
}

export interface ImageUploadResult {
  success: boolean;
  imageUrl: string;
  tempUrl?: string;
  filename: string;
  uploadType: string;
  error?: string;
}

export class ImageUploadManager {
  private baseURL: string;
  private getAuthHeaders: () => Promise<Record<string, string>>;

  constructor(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>) {
    this.baseURL = baseURL;
    this.getAuthHeaders = getAuthHeaders;
  }

  /**
   * presigned URL을 가져와서 S3에 직접 업로드하는 플로우
   * 1. 서버에서 presigned URL 요청
   * 2. S3 temp 폴더로 직접 업로드
   * 3. 서버에 업로드 완료 통지 (서버가 적절한 폴더로 이동)
   */
  async uploadImage(options: ImageUploadOptions): Promise<ImageUploadResult> {
    const { file, uploadType, filename: customFilename, onProgress } = options;
    
    try {
      // 1. 파일 유효성 검사
      this.validateFile(file);
      
      // 2. 파일명 생성
      const filename = customFilename || this.generateFilename(file, uploadType);
      
      // 3. presigned URL 요청
      const presignedResponse = await this.getPresignedUrl({
        filename,
        contentType: file.type,
        uploadType,
      });

      // 4. S3에 직접 업로드
      await this.uploadToS3(presignedResponse.presignedUrl, file, onProgress);

      // 5. 업로드 성공 결과 반환
      return {
        success: true,
        imageUrl: presignedResponse.imageUrl,
        tempUrl: presignedResponse.presignedUrl,
        filename: presignedResponse.filename,
        uploadType: presignedResponse.uploadType,
      };

    } catch (error) {
      console.error('Image upload failed:', error);
      return {
        success: false,
        imageUrl: '',
        filename: '',
        uploadType,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * 여러 이미지를 동시에 업로드
   */
  async uploadMultipleImages(options: ImageUploadOptions[]): Promise<ImageUploadResult[]> {
    const uploadPromises = options.map(option => this.uploadImage(option));
    return Promise.all(uploadPromises);
  }

  /**
   * 이미지 업로드 후 서버에 메타데이터 전송
   * (상품 등록 시 사용 - 서버가 temp에서 적절한 폴더로 이동)
   */
  async notifyUploadComplete(images: string[], targetPath?: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}/api/upload/complete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        images,
        targetPath, // 예: 'products/{productId}'
      }),
    });

    if (!response.ok) {
      throw new ApiError('Failed to notify upload completion', response.status);
    }
  }

  /**
   * presigned URL 요청
   */
  private async getPresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}/api/upload/presigned-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to get presigned URL', 
        response.status,
        errorData.code
      );
    }

    return response.json();
  }

  /**
   * S3에 직접 업로드
   */
  private async uploadToS3(presignedUrl: string, file: File | Blob, onProgress?: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 진행률 콜백
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 204) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('S3 upload failed: Network error'));
      };

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  /**
   * 파일 유효성 검사
   */
  private validateFile(file: File | Blob): void {
    // 파일 크기 검사 (10MB 제한)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('파일 크기가 10MB를 초과합니다.');
    }

    // 파일 타입 검사
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 지원)');
    }
  }

  /**
   * 파일명 생성
   */
  private generateFilename(file: File | Blob, uploadType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = this.getFileExtension(file);
    
    return `${uploadType}_${timestamp}_${random}${extension}`;
  }

  /**
   * 파일 확장자 추출
   */
  private getFileExtension(file: File | Blob): string {
    if (file instanceof File && file.name) {
      return file.name.substring(file.name.lastIndexOf('.'));
    }
    
    // MIME 타입으로부터 확장자 추정
    switch (file.type) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      default:
        return '.jpg';
    }
  }
}

/**
 * 이미지 크기 조정 (클라이언트 사이드)
 */
export async function resizeImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 비율 계산
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // 캔버스 크기 설정
      canvas.width = width;
      canvas.height = height;

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height);

      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 이미지 미리보기 URL 생성
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 미리보기 URL 해제
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Base64로 이미지 변환 (작은 이미지용)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * ProductImage 배열에서 temp URL을 실제 URL로 업데이트
 */
export function updateImageUrls(images: ProductImage[], uploadResults: ImageUploadResult[]): ProductImage[] {
  return images.map(image => {
    const result = uploadResults.find(r => r.filename === image.filename);
    if (result && result.success) {
      return {
        ...image,
        url: result.imageUrl,
        s3Key: result.filename,
      };
    }
    return image;
  });
}