import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  SellerProfile,
  SellerDashboard,
  Product,
  Order,
  Address,
  BulkProductOperation,
  BulkOperationResult,
  SellerProductAnalytics,
  SellerOrderAnalytics,
  SettlementInfo,
  SettlementSummary
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseSellerService extends BaseApiService {
  // 판매자 등록 및 프로필 관리
  async registerSeller(sellerData: {
    companyName: string;
    businessNumber: string;
    contactEmail: string;
    contactPhone: string;
    address: Address;
    bankAccount: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    };
  }): Promise<ApiResponse<{ user: any }>> {
    return this.request<ApiResponse<{ user: any }>>(API_ENDPOINTS.SELLER.REGISTER, {
      method: 'POST',
      body: JSON.stringify(sellerData),
    });
  }

  async getSellerProfile(): Promise<ApiResponse<{ seller: SellerProfile }>> {
    return this.request<ApiResponse<{ seller: SellerProfile }>>(API_ENDPOINTS.SELLER.PROFILE);
  }

  async updateSellerProfile(updates: Partial<SellerProfile>): Promise<ApiResponse<{ seller: SellerProfile }>> {
    return this.request<ApiResponse<{ seller: SellerProfile }>>(API_ENDPOINTS.SELLER.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getSellerDashboard(): Promise<ApiResponse<SellerDashboard>> {
    return this.request<ApiResponse<SellerDashboard>>(API_ENDPOINTS.SELLER.DASHBOARD);
  }

  // 상품 관리
  async getSellerProducts(filters: {
    page?: number;
    limit?: number;
    category?: string;
    isActive?: boolean;
    lowStock?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<ApiResponse<{ products: Product[]; pagination: any }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.SELLER.PRODUCTS}?${queryString}` : API_ENDPOINTS.SELLER.PRODUCTS;
    return this.request<ApiResponse<{ products: Product[]; pagination: any }>>(endpoint);
  }

  async getSellerProduct(id: string): Promise<ApiResponse<{ product: Product }>> {
    return this.request<ApiResponse<{ product: Product }>>(API_ENDPOINTS.SELLER.PRODUCT_DETAIL(id));
  }

  async createProduct(productData: {
    name: string;
    description: string;
    price: number;
    category: string;
    brand?: string;
    mainImage: {
      imageUrl: string;
      filename: string;
    };
    detailImages?: Array<{
      imageUrl: string;
      filename: string;
      description?: string;
    }>;
    stock: number;
    sku?: string;
    specifications?: Record<string, any>;
    tags?: string[];
    discount?: {
      percentage: number;
      startDate: string;
      endDate: string;
    };
  }): Promise<ApiResponse<{ product: Product }>> {
    return this.request<ApiResponse<{ product: Product }>>(API_ENDPOINTS.PRODUCTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, updates: any): Promise<ApiResponse<{ product: Product }>> {
    return this.request<ApiResponse<{ product: Product }>>(API_ENDPOINTS.PRODUCTS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.PRODUCTS.DELETE(id), {
      method: 'DELETE',
    });
  }

  async updateProductStock(id: string, stock: number): Promise<ApiResponse<{ product: Product }>> {
    return this.request<ApiResponse<{ product: Product }>>(API_ENDPOINTS.SELLER.PRODUCT_STOCK(id), {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
    });
  }

  async updateProductStatus(id: string, isActive: boolean): Promise<ApiResponse<{ product: Product }>> {
    return this.request<ApiResponse<{ product: Product }>>(API_ENDPOINTS.SELLER.PRODUCT_STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  // 대량 상품 관리
  async bulkUpdateProducts(operation: BulkProductOperation): Promise<ApiResponse<BulkOperationResult>> {
    return this.request<ApiResponse<BulkOperationResult>>(API_ENDPOINTS.BULK_PRODUCTS.OPERATION, {
      method: 'POST',
      body: JSON.stringify(operation),
    });
  }

  async getBulkOperationStatus(operationId: string): Promise<ApiResponse<BulkOperationResult & { status: string }>> {
    return this.request<ApiResponse<BulkOperationResult & { status: string }>>(
      API_ENDPOINTS.BULK_PRODUCTS.STATUS(operationId)
    );
  }

  // 주문 관리
  async getSellerOrders(filters: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
  } = {}): Promise<ApiResponse<{ orders: Order[]; pagination: any }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.SELLER.ORDERS}?${queryString}` : API_ENDPOINTS.SELLER.ORDERS;
    return this.request<ApiResponse<{ orders: Order[]; pagination: any }>>(endpoint);
  }

  async updateOrderStatus(
    id: string, 
    status: string, 
    note?: string, 
    trackingNumber?: string
  ): Promise<ApiResponse<{ order: Order }>> {
    const body: any = { status };
    if (note) body.note = note;
    if (trackingNumber) body.trackingNumber = trackingNumber;

    return this.request<ApiResponse<{ order: Order }>>(API_ENDPOINTS.SELLER.ORDER_STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // 분석 및 통계
  async getProductAnalytics(): Promise<ApiResponse<SellerProductAnalytics>> {
    return this.request<ApiResponse<SellerProductAnalytics>>(API_ENDPOINTS.SELLER.PRODUCT_ANALYTICS);
  }

  async getOrderAnalytics(): Promise<ApiResponse<SellerOrderAnalytics>> {
    return this.request<ApiResponse<SellerOrderAnalytics>>(API_ENDPOINTS.SELLER.ORDER_ANALYTICS);
  }

  // 정산 관리
  async getSettlements(filters: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<ApiResponse<{ settlements: SettlementInfo[]; pagination: any }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.SELLER.SETTLEMENTS}?${queryString}` : API_ENDPOINTS.SELLER.SETTLEMENTS;
    return this.request<ApiResponse<{ settlements: SettlementInfo[]; pagination: any }>>(endpoint);
  }

  async requestSettlement(period: {
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<{ settlement: SettlementInfo }>> {
    return this.request<ApiResponse<{ settlement: SettlementInfo }>>(API_ENDPOINTS.SELLER.SETTLEMENT_REQUEST, {
      method: 'POST',
      body: JSON.stringify(period),
    });
  }

  async getSettlementSummary(): Promise<ApiResponse<SettlementSummary>> {
    return this.request<ApiResponse<SettlementSummary>>(API_ENDPOINTS.SELLER.SETTLEMENT_SUMMARY);
  }

  async getAvailableSettlementAmount(): Promise<ApiResponse<{
    availableAmount: number;
    grossAmount: number;
    commissionAmount: number;
    commissionPercentage: number;
    orderCount: number;
    orders: any[];
  }>> {
    return this.request(API_ENDPOINTS.SELLER.SETTLEMENT_AVAILABLE);
  }

  // 리뷰 관리
  async getSellerReviews(filters: {
    page?: number;
    limit?: number;
    rating?: number;
    productId?: string;
  } = {}): Promise<ApiResponse<{ reviews: any[]; pagination: any }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.SELLER_REVIEWS.LIST}?${queryString}` : API_ENDPOINTS.SELLER_REVIEWS.LIST;
    return this.request<ApiResponse<{ reviews: any[]; pagination: any }>>(endpoint);
  }

  async replyToReview(reviewId: string, content: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.SELLER_REVIEWS.REPLY(reviewId), {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async updateReviewReply(reviewId: string, content: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.SELLER_REVIEWS.UPDATE_REPLY(reviewId), {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteReviewReply(reviewId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(API_ENDPOINTS.SELLER_REVIEWS.DELETE_REPLY(reviewId), {
      method: 'DELETE',
    });
  }
}

export class SellerServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseSellerService {
    return new (class extends BaseSellerService {})(baseURL, getAuthHeaders);
  }
}