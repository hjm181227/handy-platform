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
import { validateResponseId, normalizeProductId, isValidId } from '../../utils/uuidUtils';

export abstract class BaseProductService extends BaseApiService {
  // 상품 조회 (고객용 - 서버 API 스펙 완전 일치)
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.PRODUCTS.LIST}?${queryString}` : API_ENDPOINTS.PRODUCTS.LIST;
    
    const response = await this.request<ProductsResponse>(endpoint);
    
    // Validate UUID format in response products during migration period
    if (response.success && response.data) {
      response.data.forEach((product, index) => {
        try {
          validateResponseId(product, `Product[${index}]`);
        } catch (error) {
          console.warn(`UUID Migration Warning - Product validation:`, error);
        }
      });
    }
    
    return response;
  }

  async getProduct(productId: string): Promise<ProductDetailResponse> {
    const response = await this.request<ProductDetailResponse>(
      API_ENDPOINTS.PRODUCTS.DETAIL(productId)
    );
    
    // Validate UUID format in single product response during migration period
    if (response.success && response.data) {
      try {
        validateResponseId(response.data, 'Product');
      } catch (error) {
        console.warn(`UUID Migration Warning - Product detail validation:`, error);
      }
    }
    
    return response;
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

  /**
   * Helper method to safely extract product identifier for API calls
   * Handles both UUID and legacy productId formats during migration
   * @param product - Product object with id and/or productId fields
   * @returns string - normalized product identifier for API calls
   */
  protected getProductApiId(product: { id?: string; productId?: string }): string {
    try {
      return normalizeProductId(product);
    } catch (error) {
      console.error('UUID Migration Error - Invalid product ID format:', error);
      throw error;
    }
  }

  /**
   * Helper method to validate product ID before API calls
   * @param productId - Product ID to validate
   * @throws Error if ID format is invalid
   */
  protected validateProductId(productId: string): void {
    if (!isValidId(productId)) {
      throw new Error(`Invalid product ID format: ${productId}. Expected UUID or ObjectId format.`);
    }
  }
}

export class ProductServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseProductService {
    return new (class extends BaseProductService {})(baseURL, getAuthHeaders);
  }
}