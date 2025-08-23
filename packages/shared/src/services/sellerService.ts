import { ApiResponse } from '../types';
import { 
  SellerRegistration, 
  SellerProfile, 
  SellerDashboard, 
  SellerProductAnalytics,
  SellerOrderAnalytics,
  SettlementInfo,
  SettlementSummary,
  BulkProductOperation,
  BulkOperationResult,
  Product,
  Order,
  DetailedReview
} from '../types';
import { API_ENDPOINTS } from '../config/api';
import { ApiError, handleApiResponse } from '../utils/apiHelpers';

export class BaseSellerService {
  protected baseURL: string;
  protected getAuthHeaders: () => Promise<Record<string, string>>;

  constructor(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>) {
    this.baseURL = baseURL;
    this.getAuthHeaders = getAuthHeaders;
  }

  // 판매자 등록
  async registerSeller(data: SellerRegistration): Promise<ApiResponse<{ sellerId: string }>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.REGISTER}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleApiResponse(response);
  }

  // 판매자 프로필 조회
  async getSellerProfile(): Promise<ApiResponse<SellerProfile>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.PROFILE}`, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 판매자 프로필 업데이트
  async updateSellerProfile(data: Partial<SellerProfile>): Promise<ApiResponse<SellerProfile>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.UPDATE_PROFILE}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleApiResponse(response);
  }

  // 판매자 대시보드 조회
  async getSellerDashboard(): Promise<ApiResponse<SellerDashboard>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.DASHBOARD}`, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 판매자 상품 목록 조회
  async getSellerProducts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<ApiResponse<{ products: Product[]; pagination: any }>> {
    const headers = await this.getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseURL}${API_ENDPOINTS.SELLER.PRODUCTS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 판매자 상품 생성
  async createSellerProduct(data: any): Promise<ApiResponse<Product>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.PRODUCT_CREATE}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleApiResponse(response);
  }

  // 판매자 상품 업데이트
  async updateSellerProduct(productId: string, data: any): Promise<ApiResponse<Product>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.PRODUCT_UPDATE(productId)}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleApiResponse(response);
  }

  // 판매자 상품 삭제
  async deleteSellerProduct(productId: string): Promise<ApiResponse<void>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.PRODUCT_DELETE(productId)}`, {
      method: 'DELETE',
      headers,
    });

    return handleApiResponse(response);
  }

  // 상품 재고 업데이트
  async updateProductStock(productId: string, stock: number): Promise<ApiResponse<void>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.PRODUCT_STOCK(productId)}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stock }),
    });

    return handleApiResponse(response);
  }

  // 상품 상태 변경
  async updateProductStatus(productId: string, status: string): Promise<ApiResponse<void>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.PRODUCT_STATUS(productId)}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    return handleApiResponse(response);
  }

  // 상품 분석 조회
  async getProductAnalytics(): Promise<ApiResponse<SellerProductAnalytics>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.PRODUCT_ANALYTICS}`, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 판매자 주문 목록 조회
  async getSellerOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{ orders: Order[]; pagination: any }>> {
    const headers = await this.getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseURL}${API_ENDPOINTS.SELLER.ORDERS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 주문 상태 업데이트
  async updateOrderStatus(orderId: string, status: string): Promise<ApiResponse<void>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.ORDER_STATUS(orderId)}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    return handleApiResponse(response);
  }

  // 주문 분석 조회
  async getOrderAnalytics(): Promise<ApiResponse<SellerOrderAnalytics>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.ORDER_ANALYTICS}`, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 정산 목록 조회
  async getSettlements(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{ settlements: SettlementInfo[]; pagination: any }>> {
    const headers = await this.getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseURL}${API_ENDPOINTS.SELLER.SETTLEMENTS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 정산 요청
  async requestSettlement(): Promise<ApiResponse<{ settlementId: string }>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.SETTLEMENT_REQUEST}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    return handleApiResponse(response);
  }

  // 정산 요약 조회
  async getSettlementSummary(): Promise<ApiResponse<SettlementSummary>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.SETTLEMENT_SUMMARY}`, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 정산 가능 금액 조회
  async getAvailableSettlementAmount(): Promise<ApiResponse<{ amount: number }>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER.SETTLEMENT_AVAILABLE}`, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 대량 상품 작업
  async bulkProductOperation(operation: BulkProductOperation): Promise<ApiResponse<{ operationId: string }>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.BULK_PRODUCTS.OPERATION}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation),
    });

    return handleApiResponse(response);
  }

  // 대량 작업 상태 조회
  async getBulkOperationStatus(operationId: string): Promise<ApiResponse<BulkOperationResult>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.BULK_PRODUCTS.STATUS(operationId)}`, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 판매자 리뷰 목록 조회
  async getSellerReviews(params?: {
    page?: number;
    limit?: number;
    productId?: string;
    rating?: number;
    hasReply?: boolean;
  }): Promise<ApiResponse<{ reviews: DetailedReview[]; pagination: any }>> {
    const headers = await this.getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseURL}${API_ENDPOINTS.SELLER_REVIEWS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    return handleApiResponse(response);
  }

  // 리뷰 답글 작성
  async replyToReview(reviewId: string, content: string): Promise<ApiResponse<void>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER_REVIEWS.REPLY(reviewId)}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    return handleApiResponse(response);
  }

  // 리뷰 답글 수정
  async updateReviewReply(reviewId: string, content: string): Promise<ApiResponse<void>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER_REVIEWS.UPDATE_REPLY(reviewId)}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    return handleApiResponse(response);
  }

  // 리뷰 답글 삭제
  async deleteReviewReply(reviewId: string): Promise<ApiResponse<void>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SELLER_REVIEWS.DELETE_REPLY(reviewId)}`, {
      method: 'DELETE',
      headers,
    });

    return handleApiResponse(response);
  }
}

// 판매자 서비스 팩토리
export class SellerServiceFactory {
  static create(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>
  ): BaseSellerService {
    return new BaseSellerService(baseURL, getAuthHeaders);
  }
}