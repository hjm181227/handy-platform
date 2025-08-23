import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  QRCodeData,
  QRCodeResponse
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseQRService extends BaseApiService {
  // QR 코드 생성
  async generateQRCode(
    data: QRCodeData,
    options: {
      size?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
      margin?: number;
      color?: {
        dark?: string;
        light?: string;
      };
    } = {}
  ): Promise<ApiResponse<{
    qrCodeUrl: string;
    data: QRCodeData;
    options: any;
    expiresAt?: string;
  }>> {
    return this.request(API_ENDPOINTS.QR.GENERATE, {
      method: 'POST',
      body: JSON.stringify({ data, options }),
    });
  }

  // QR 코드 처리 (스캔된 QR 코드 데이터 처리)
  async processQRCode(
    qrCodeData: string,
    metadata?: Record<string, any>
  ): Promise<QRCodeResponse> {
    return this.request<QRCodeResponse>(API_ENDPOINTS.QR.PROCESS, {
      method: 'POST',
      body: JSON.stringify({ qrCodeData, metadata }),
    });
  }

  // 상품용 QR 코드 생성
  async generateProductQRCode(
    productId: string,
    options?: {
      includePrice?: boolean;
      includeDescription?: boolean;
      customData?: Record<string, any>;
    }
  ): Promise<ApiResponse<{
    qrCodeUrl: string;
    data: QRCodeData;
    options: any;
    expiresAt?: string;
  }>> {
    const qrData: QRCodeData = {
      type: 'product',
      data: {
        productId,
        ...options?.customData
      },
      metadata: {
        includePrice: options?.includePrice,
        includeDescription: options?.includeDescription,
        createdAt: new Date().toISOString()
      }
    };

    return this.generateQRCode(qrData);
  }

  // 프로모션용 QR 코드 생성
  async generatePromotionQRCode(
    promotionData: {
      type: 'coupon' | 'discount' | 'event';
      id: string;
      code?: string;
      value?: number;
      description?: string;
    },
    options?: {
      expiresAt?: string;
      usageLimit?: number;
    }
  ): Promise<ApiResponse<{
    qrCodeUrl: string;
    data: QRCodeData;
    options: any;
    expiresAt?: string;
  }>> {
    const qrData: QRCodeData = {
      type: 'promotion',
      data: promotionData,
      metadata: {
        expiresAt: options?.expiresAt,
        usageLimit: options?.usageLimit,
        createdAt: new Date().toISOString()
      }
    };

    return this.generateQRCode(qrData);
  }

  // 카테고리용 QR 코드 생성
  async generateCategoryQRCode(
    categoryId: string,
    filters?: Record<string, any>
  ): Promise<ApiResponse<{
    qrCodeUrl: string;
    data: QRCodeData;
    options: any;
    expiresAt?: string;
  }>> {
    const qrData: QRCodeData = {
      type: 'category',
      data: {
        categoryId,
        filters
      },
      metadata: {
        createdAt: new Date().toISOString()
      }
    };

    return this.generateQRCode(qrData);
  }

  // 커스텀 QR 코드 생성
  async generateCustomQRCode(
    customData: any,
    options: {
      expiresAt?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<ApiResponse<{
    qrCodeUrl: string;
    data: any;
    expiresAt?: string;
  }>> {
    const qrData: QRCodeData = {
      type: 'custom',
      data: customData,
      metadata: {
        ...options.metadata,
        createdAt: new Date().toISOString()
      }
    };

    return this.generateQRCode(qrData);
  }
}

export class QRServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseQRService {
    return new (class extends BaseQRService {})(baseURL, getAuthHeaders);
  }
}