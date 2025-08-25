import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  Product, 
  ProductsResponse, 
  ProductDetailResponse,
  ProductFilters, 
  SellerProductFilters,
  CreateProductRequest,
  UpdateProductRequest
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseProductService extends BaseApiService {
  // 상품 조회 (고객용 - 서버 API 스펙 완전 일치)
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.PRODUCTS.LIST}?${queryString}` : API_ENDPOINTS.PRODUCTS.LIST;
    return this.request<ProductsResponse>(endpoint);
  }

  async getProduct(productId: string): Promise<ProductDetailResponse> {
    return this.request<ProductDetailResponse>(
      API_ENDPOINTS.PRODUCTS.DETAIL(productId)
    );
  }

  // 판매자별 상품 조회 (공개)
  async getProductsBySeller(sellerId: string, filters: SellerProductFilters = {}): Promise<ProductsResponse> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString 
      ? `${API_ENDPOINTS.PRODUCTS.SELLER_PRODUCTS(sellerId)}?${queryString}` 
      : API_ENDPOINTS.PRODUCTS.SELLER_PRODUCTS(sellerId);
    return this.request<ProductsResponse>(endpoint);
  }

  // 검색 (기존 getProducts를 통해 처리)
  async searchProducts(query: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
    return this.getProducts({
      ...filters,
      search: query
    });
  }

  // 상품 관리 (판매자/관리자 전용 - 인증 필요)
  async createProduct(productData: CreateProductRequest): Promise<ApiResponse<{ productId: string; name: string; price: number; stockQuantity: number; status: string; createdAt: string }>> {
    return this.request<ApiResponse<{ productId: string; name: string; price: number; stockQuantity: number; status: string; createdAt: string }>>(
      API_ENDPOINTS.PRODUCTS.CREATE,
      {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  async updateProduct(productId: string, productData: UpdateProductRequest): Promise<ApiResponse<{ productId: string; name: string; price: number; salePrice?: number; stockQuantity: number; status: string; updatedAt: string }>> {
    return this.request<ApiResponse<{ productId: string; name: string; price: number; salePrice?: number; stockQuantity: number; status: string; updatedAt: string }>>(
      API_ENDPOINTS.PRODUCTS.UPDATE(productId),
      {
        method: 'PUT',
        body: JSON.stringify(productData),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  async deleteProduct(productId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.PRODUCTS.DELETE(productId),
      {
        method: 'DELETE',
      }
    );
  }
}

export class ProductServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseProductService {
    return new (class extends BaseProductService {})(baseURL, getAuthHeaders);
  }
}