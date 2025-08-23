import { ApiResponse, QRCodeData, QRCodeResponse } from '../types';
import { API_ENDPOINTS } from '../config/api';
import { handleApiResponse } from '../utils/apiHelpers';

export class BaseQRService {
  protected baseURL: string;
  protected getAuthHeaders: () => Promise<Record<string, string>>;

  constructor(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>) {
    this.baseURL = baseURL;
    this.getAuthHeaders = getAuthHeaders;
  }

  // QR 코드 생성
  async generateQRCode(data: QRCodeData): Promise<ApiResponse<QRCodeResponse>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.QR.GENERATE}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleApiResponse(response);
  }

  // QR 코드 처리 (스캔된 QR 코드 해석)
  async processQRCode(qrCode: string): Promise<ApiResponse<{
    type: string;
    data: any;
    action?: string;
    metadata?: Record<string, any>;
  }>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.QR.PROCESS}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qrCode }),
    });

    return handleApiResponse(response);
  }

  // 상품 QR 코드 생성 (편의 메서드)
  async generateProductQRCode(productId: string, metadata?: Record<string, any>): Promise<ApiResponse<QRCodeResponse>> {
    return this.generateQRCode({
      type: 'product',
      data: { productId },
      metadata,
    });
  }

  // 카테고리 QR 코드 생성 (편의 메서드)
  async generateCategoryQRCode(category: string, metadata?: Record<string, any>): Promise<ApiResponse<QRCodeResponse>> {
    return this.generateQRCode({
      type: 'category',
      data: { category },
      metadata,
    });
  }

  // 프로모션 QR 코드 생성 (편의 메서드)
  async generatePromotionQRCode(promotionId: string, metadata?: Record<string, any>): Promise<ApiResponse<QRCodeResponse>> {
    return this.generateQRCode({
      type: 'promotion',
      data: { promotionId },
      metadata,
    });
  }

  // 커스텀 QR 코드 생성 (편의 메서드)
  async generateCustomQRCode(customData: any, metadata?: Record<string, any>): Promise<ApiResponse<QRCodeResponse>> {
    return this.generateQRCode({
      type: 'custom',
      data: customData,
      metadata,
    });
  }
}

// QR 서비스 팩토리
export class QRServiceFactory {
  static create(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>
  ): BaseQRService {
    return new BaseQRService(baseURL, getAuthHeaders);
  }
}