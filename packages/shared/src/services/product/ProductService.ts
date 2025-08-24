import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  Product, 
  ProductsResponse, 
  ProductFilters, 
  ProductCategory,
  CreateProductRequest
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseProductService extends BaseApiService {
  // 상품 조회
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.PRODUCTS.LIST}?${queryString}` : API_ENDPOINTS.PRODUCTS.LIST;
    return this.request<ProductsResponse>(endpoint);
  }

  async getProduct(id: string): Promise<ApiResponse<{ product: Product; relatedProducts: Product[] }>> {
    return this.request<ApiResponse<{ product: Product; relatedProducts: Product[] }>>(
      API_ENDPOINTS.PRODUCTS.DETAIL(id)
    );
  }

  async getFeaturedProducts(limit = 8): Promise<ApiResponse<{ products: Product[] }>> {
    return this.request<ApiResponse<{ products: Product[] }>>(
      `${API_ENDPOINTS.PRODUCTS.FEATURED}?limit=${limit}`
    );
  }

  // 카테고리 및 브랜드
  async getCategories(): Promise<ApiResponse<{ categories: ProductCategory[] }>> {
    return this.request<ApiResponse<{ categories: ProductCategory[] }>>(
      API_ENDPOINTS.PRODUCTS.CATEGORIES
    );
  }

  async getBrands(): Promise<ApiResponse<{ brands: string[] }>> {
    return this.request<ApiResponse<{ brands: string[] }>>(
      API_ENDPOINTS.PRODUCTS.BRANDS
    );
  }

  // 검색
  async getSearchSuggestions(query: string): Promise<ApiResponse<{ suggestions: Array<{ id: string; name: string; category: string }> }>> {
    return this.request<ApiResponse<{ suggestions: Array<{ id: string; name: string; category: string }> }>>(
      `${API_ENDPOINTS.PRODUCTS.SEARCH_SUGGESTIONS}?q=${encodeURIComponent(query)}`
    );
  }

  async searchProducts(query: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
    return this.getProducts({
      ...filters,
      search: query
    });
  }

  // 판매자 상품 등록 (판매자만 사용 가능)
  async createProduct(productData: CreateProductRequest): Promise<ApiResponse<{ product: Product }>> {
    return this.request<ApiResponse<{ product: Product }>>(
      API_ENDPOINTS.SELLER.PRODUCT_CREATE,
      {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export class ProductServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseProductService {
    return new (class extends BaseProductService {})(baseURL, getAuthHeaders);
  }
}