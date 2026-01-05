import { BaseApiService } from '../base/BaseApiService';
import {
  ApiResponse,
  SellerDashboard,
  Product,
  Order,
  Address,
  BulkProductOperation,
  BulkOperationResult,
  SellerProductAnalytics,
  SellerOrderAnalytics,
  SettlementInfo,
  SettlementSummary,
  ProductionSettings,
  ProductionCapacity,
  ProductionHistory,
  ProductionHistoryResponse,
  UpdateProductionSettingsRequest,
  UpdateProductionCapacityRequest,
  AddExtraCapacityRequest,
  ProductionBoostRequest,
  SellerOrder,
  SellerOrderDetail,
  SellerOrderPagination,
  CustomOrderRequest,
  CustomOrderDetail,
  PrefillProductResponse
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseSellerService extends BaseApiService {
  // 판매자 정보 조회
  async getSellerInfo(sellerUuid: string): Promise<{
    success: boolean;
    data: {
      sellerUuid: string;
      brandName: string;
      description?: string;
      isActive: boolean;
      createdAt: string;
      // 기타 브랜드 정보
    };
  }> {
    return this.request<{
      success: boolean;
      data: {
        sellerUuid: string;
        brandName: string;
        description?: string;
        isActive: boolean;
        createdAt: string;
      };
    }>(API_ENDPOINTS.SELLER.INFO(sellerUuid));
  }

  // 상품 관리 (서버 API 스펙에 완전 일치)
  async getSellerProducts(filters: {
    page?: number;                  // 페이지 번호 (기본값: 1)
    limit?: number;                 // 페이지당 항목 수 (기본값: 20)
    isActive?: boolean;             // 활성 상태별 필터링
    lowStock?: boolean;             // 저재고 제품 필터링 (≤10)
    search?: string;                // 제품명 또는 SKU 검색
    sortBy?: string;                // 정렬 필드 (기본값: "createdAt")
    sortOrder?: 'asc' | 'desc';     // 정렬 순서 (기본값: "desc")
  } = {}): Promise<{
    success: boolean;
    data: Product[];
    pagination: any;
  }> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString ? `${API_ENDPOINTS.SELLER.PRODUCTS}?${queryString}` : API_ENDPOINTS.SELLER.PRODUCTS;

    const response = await this.request<{
      success: boolean;
      data: Product[];
      pagination: any;
    }>(endpoint);

    // UUID validation for seller products
    if (response.data) {
      response.data.forEach((product, index) => {
        try {
          // Validate product UUID format
          if (product.productUuid) {
            console.debug(`[Seller Products] Product[${index}] ID: ${product.productUuid}`);
          }
        } catch (error) {
          console.warn(`UUID Migration Warning - Seller Product validation:`, error);
        }
      });
    }

    return response;
  }

  async getSellerProduct(id: string): Promise<{ success: boolean; data: Product }> {
    return this.request<{ success: boolean; data: Product }>(API_ENDPOINTS.SELLER.PRODUCT_DETAIL(id));
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

  // PATCH /:id/stock - 제품 재고 업데이트 (서버 API 스펙 일치)
  async updateProductStock(id: string, stock: number): Promise<ApiResponse<{
    success: boolean;
    message: string;
    product?: Product;
  }>> {
    return this.request<ApiResponse<{
      success: boolean;
      message: string;
      product?: Product;
    }>>(API_ENDPOINTS.SELLER.PRODUCT_STOCK(id), {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
    });
  }

  // PATCH /:id/status - 제품 활성 상태 업데이트 (서버 API 스펙 일치)
  async updateProductStatus(id: string, isActive: boolean): Promise<ApiResponse<{
    success: boolean;
    message: string;
    product?: Product;
  }>> {
    return this.request<ApiResponse<{
      success: boolean;
      message: string;
      product?: Product;
    }>>(API_ENDPOINTS.SELLER.PRODUCT_STATUS(id), {
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

  // 주문 관리 (멀티셀러 지원 - 서버 API 스펙 완전 일치)
  async getSellerOrders(filters: {
    page?: number;                  // 페이지 번호 (기본값: 1)
    limit?: number;                 // 페이지당 항목 수 (기본값: 20)
    status?: string[];              // 주문 상태별 필터링 (배열)
    search?: string;                // 주문번호로 검색
    sortBy?: 'create-desc' | 'create-asc' | 'price-desc' | 'price-asc'; // 정렬 방식
  } = {}): Promise<{
    items: SellerOrder[];
    pagination: SellerOrderPagination;
  }> {
    // POST 메서드로 body에 JSON 전송 (서버 API 스펙 준수)
    const requestBody: any = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      status: filters.status || [],
      search: filters.search,
      sortBy: filters.sortBy || 'create-desc'
    };

    // search 파라미터는 값이 있을 때만 추가 (빈 문자열 방지)
    if (filters.search && filters.search.trim()) {
      requestBody.search = filters.search.trim();
    }

    console.log('🔍 [getSellerOrders] Request body:', requestBody);

    const response = await this.request<{
      items: SellerOrder[];
      pagination: SellerOrderPagination;
    }>(API_ENDPOINTS.SELLER.ORDERS, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    console.log('✅ [getSellerOrders] Response:', response);

    // UUID validation for seller orders during migration period
    if (response.items) {
      response.items.forEach((order, index) => {
        try {
          // Validate order ID format (id instead of orderUuid after server unification)
          if (order.id) {
            console.debug(`[Seller Orders] Order[${index}] ID: ${order.id}`);
          }
        } catch (error) {
          console.warn(`UUID Migration Warning - Seller Order validation:`, error);
        }
      });
    }

    return response;
  }

  // 특정 주문의 상세 정보 조회 (서버 API 스펙 일치)
  async getSellerOrderDetail(orderUuid: string): Promise<{
    success: boolean;
    data: SellerOrderDetail;
  }> {
    return this.request<{
      success: boolean;
      data: SellerOrderDetail;
    }>(API_ENDPOINTS.SELLER.ORDER_DETAIL(orderUuid));
  }

  // 주문 상태 업데이트 (서버 API 스펙 일치)
  async updateOrderStatus(
    orderUuid: string,
    updates: {
      status: string;
      note?: string;
      trackingNumber?: string;
      carrierCode?: string;    // 배송 처리 시 필수
      carrierName?: string;    // 배송 처리 시 필수
    }
  ): Promise<{
    message: string;
    order: {
      _id: string;
      orderNumber: string;
      status: string;
      trackingNumber?: string;
    };
  }> {
    console.log('🚛 [updateOrderStatus] Request:', {
      orderUuid,
      endpoint: API_ENDPOINTS.SELLER.ORDER_STATUS(orderUuid),
      updates
    });
    return this.request<{
      message: string;
      order: any;
    }>(API_ENDPOINTS.SELLER.ORDER_STATUS(orderUuid), {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // 배송 정보 업데이트 (별도 메서드)
  async updateShippingInfo(
    orderUuid: string,
    shippingInfo: {
      carrierCode: string;
      carrierName: string;
      trackingNumber: string;
      shippingDate?: string;
      estimatedDeliveryDate?: string;
      note?: string;
    }
  ): Promise<{
    message: string;
    order: {
      _id: string;
      orderNumber: string;
      status: string;
      trackingNumber?: string;
    };
  }> {
    return this.updateOrderStatus(orderUuid, {
      status: 'shipped',
      trackingNumber: shippingInfo.trackingNumber,
      carrierCode: shippingInfo.carrierCode,     // 서버 필수 필드
      carrierName: shippingInfo.carrierName,     // 서버 필수 필드
      note: shippingInfo.note || `배송 시작됨 (${shippingInfo.carrierName}: ${shippingInfo.trackingNumber})`
    });
  }

  // 주문 상태 일괄 업데이트
  async bulkUpdateOrderStatus(
    orderIds: string[],
    updates: {
      status: string;
      note?: string;
    }
  ): Promise<ApiResponse<{
    successCount: number;
    failedOrders: { orderId: string; error: string }[];
  }>> {
    return this.request<ApiResponse<{
      successCount: number;
      failedOrders: { orderId: string; error: string }[];
    }>>(API_ENDPOINTS.SELLER.ORDERS, {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'bulk_update_status',
        orderIds,
        updates
      }),
    });
  }

  // 배송 정보 일괄 업데이트
  async bulkUpdateShipping(
    shippingUpdates: Array<{
      orderId: string;
      carrierCode: string;
      carrierName: string;
      trackingNumber: string;
      note?: string;
    }>
  ): Promise<ApiResponse<{
    successCount: number;
    failedOrders: { orderId: string; error: string }[];
  }>> {
    return this.request<ApiResponse<{
      successCount: number;
      failedOrders: { orderId: string; error: string }[];
    }>>(API_ENDPOINTS.SELLER.ORDERS, {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'bulk_update_shipping',
        updates: shippingUpdates
      }),
    });
  }

  // GET /analytics/overview - 제품 분석 개요 (서버 API 스펙 일치)
  async getProductAnalyticsOverview(): Promise<ApiResponse<{
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    averageRating: number;
    totalReviews: number;
  }>> {
    return this.request<ApiResponse<{
      totalProducts: number;
      activeProducts: number;
      lowStockProducts: number;
      averageRating: number;
      totalReviews: number;
    }>>(API_ENDPOINTS.SELLER.PRODUCT_ANALYTICS);
  }

  // GET /analytics/overview - 주문 분석 개요 (서버 API 스펙 일치)
  async getOrderAnalyticsOverview(): Promise<ApiResponse<SellerOrderAnalytics>> {
    return this.request<ApiResponse<SellerOrderAnalytics>>(API_ENDPOINTS.SELLER.ORDER_ANALYTICS);
  }

  // 기존 메서드들 (하위 호환성 유지)
  async getProductAnalytics(): Promise<ApiResponse<SellerProductAnalytics>> {
    // Note: 서버 API 응답이 변경되어 기존 SellerProductAnalytics와 다름
    // 새로운 getProductAnalyticsOverview() 사용 권장
    return this.getProductAnalyticsOverview() as any;
  }

  async getOrderAnalytics(): Promise<ApiResponse<SellerOrderAnalytics>> {
    return this.getOrderAnalyticsOverview();
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

  // 생산 관리 API (서버 스펙 완전 일치)

  // GET /production-settings - 생산 설정 조회
  async getProductionSettings(): Promise<ApiResponse<{
    productionSettings: ProductionSettings;
    currentCapacity?: {
      year: number;
      month: number;
      maxOrders: number;
      currentOrders: number;
      remainingOrders: number;
      utilizationRate: string;
    };
    isConfigured?: boolean;
  }>> {
    // GET /api/seller/info - 현재 판매자 정보 조회 (생산 설정 포함)
    const response = await this.request<any>(API_ENDPOINTS.SELLER.CURRENT_INFO);

    // 응답 구조에서 productionSettings 추출
    // 서버 응답: { success: true, data: { sellerInfo: { productionSettings: {...} } } }
    return {
      success: response.success,
      data: {
        productionSettings: response.data?.sellerInfo?.productionSettings || response.data?.productionSettings,
        currentCapacity: response.data?.currentCapacity,
        isConfigured: response.data?.isConfigured
      }
    };
  }

  // PUT /api/seller/info - 생산 설정 업데이트
  async updateProductionSettings(settings: UpdateProductionSettingsRequest): Promise<ApiResponse<{
    productionSettings: ProductionSettings;
  }>> {
    // PUT /api/seller/info with nested productionSettings
    const response = await this.request<any>(API_ENDPOINTS.SELLER.CURRENT_INFO, {
      method: 'PUT',
      body: JSON.stringify({ productionSettings: settings }),
    });

    // 응답 구조에서 productionSettings 추출
    return {
      success: response.success,
      data: {
        productionSettings: response.data?.sellerInfo?.productionSettings || response.data?.productionSettings
      }
    };
  }

  // GET /production-capacity/:year?/:month? - 특정 월 생산 현황 조회
  async getProductionCapacity(year?: number, month?: number): Promise<ApiResponse<ProductionCapacity>> {
    return this.request(API_ENDPOINTS.SELLER.PRODUCTION_CAPACITY(year, month));
  }

  // PUT /production-capacity/:year/:month - 특정 월 생산 용량 수정
  async updateProductionCapacity(
    year: number,
    month: number,
    data: UpdateProductionCapacityRequest
  ): Promise<ApiResponse<ProductionCapacity>> {
    return this.request(API_ENDPOINTS.SELLER.PRODUCTION_CAPACITY_UPDATE(year, month), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // GET /production-history - 생산 히스토리 조회
  async getProductionHistory(): Promise<ApiResponse<ProductionHistoryResponse>> {
    return this.request(API_ENDPOINTS.SELLER.PRODUCTION_HISTORY);
  }

  // POST /production-capacity/:year/:month/add-extra - 임의 추가 생산량 적용
  async addExtraProductionCapacity(
    year: number,
    month: number,
    data: AddExtraCapacityRequest
  ): Promise<ApiResponse<ProductionCapacity>> {
    return this.request(API_ENDPOINTS.SELLER.PRODUCTION_ADD_EXTRA(year, month), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // POST /production-capacity/boost - 임시 생산량 부스트 적용
  async boostProductionCapacity(data: ProductionBoostRequest): Promise<ApiResponse<ProductionCapacity>> {
    return this.request(API_ENDPOINTS.SELLER.PRODUCTION_BOOST, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 배송 정책 관리 API (서버 스펙 완전 일치)

  // GET /shipping - 배송 정책 조회
  async getShippingPolicy(): Promise<ApiResponse<{
    shippingPolicy: {
      baseShippingCost: number;
      freeShippingThreshold: number;
      isActive: boolean;
      shippingRegions: Array<{
        region: string;
        additionalCost: number;
        isServiceable: boolean;
      }>;
      estimatedDeliveryDays: {
        min: number;
        max: number;
      };
      specialInstructions?: string;
      lastUpdatedAt: string;
    };
    isConfigured: boolean;
  }>> {
    return this.request(API_ENDPOINTS.SELLER.SHIPPING_POLICY);
  }

  // PUT /shipping - 배송 정책 설정/업데이트
  async updateShippingPolicy(policy: {
    baseShippingCost?: number;
    freeShippingThreshold?: number;
    isActive?: boolean;
    shippingRegions?: Array<{
      region: string;
      additionalCost: number;
      isServiceable: boolean;
    }>;
    estimatedDeliveryDays?: {
      min: number;
      max: number;
    };
    specialInstructions?: string;
  }): Promise<ApiResponse<{
    shippingPolicy: any;
  }>> {
    return this.request(API_ENDPOINTS.SELLER.SHIPPING_POLICY, {
      method: 'PUT',
      body: JSON.stringify(policy),
    });
  }

  // PUT /shipping/regions - 지역별 배송 설정 업데이트
  async updateShippingRegions(regions: Array<{
    region: string;
    additionalCost: number;
    isServiceable: boolean;
  }>): Promise<ApiResponse<{
    regions: any[];
    message: string;
  }>> {
    return this.request(API_ENDPOINTS.SELLER.SHIPPING_REGIONS, {
      method: 'PUT',
      body: JSON.stringify({ regions }),
    });
  }

  // PATCH /shipping/toggle - 배송 서비스 활성화/비활성화
  async toggleShippingService(isActive: boolean): Promise<ApiResponse<{
    isActive: boolean;
    lastUpdatedAt: string;
  }>> {
    return this.request(API_ENDPOINTS.SELLER.SHIPPING_TOGGLE, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  // POST /shipping/preview - 배송 정책 미리보기
  async previewShippingPolicy(
    policy: any,
    params?: { region?: string; subtotal?: number }
  ): Promise<ApiResponse<{
    preview: {
      testConditions: {
        region: string;
        subtotal: number;
      };
      calculatedShipping: {
        baseShippingCost: number;
        additionalCost: number;
        shippingCost: number;
        isFreeShipping: boolean;
        freeShippingRemaining: number;
        isServiceable: boolean;
      };
      policy: any;
    };
  }>> {
    const queryString = params ? this.buildQueryString(params) : '';
    const endpoint = queryString ? `${API_ENDPOINTS.SELLER.SHIPPING_PREVIEW}?${queryString}` : API_ENDPOINTS.SELLER.SHIPPING_PREVIEW;

    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(policy),
    });
  }

  // ==================== 커스텀 주문서 관련 API ====================

  // GET /seller/custom-orders - 커스텀 주문서 목록 조회
  async getCustomOrderRequests(): Promise<ApiResponse<CustomOrderRequest[]>> {
    return this.request<ApiResponse<CustomOrderRequest[]>>(
      API_ENDPOINTS.SELLER.CUSTOM_ORDERS
    );
  }

  // GET /seller/custom-orders/:requestUuid - 커스텀 주문서 상세 조회
  async getCustomOrderDetail(requestUuid: string): Promise<ApiResponse<CustomOrderDetail>> {
    return this.request<ApiResponse<CustomOrderDetail>>(
      API_ENDPOINTS.SELLER.CUSTOM_ORDER_DETAIL(requestUuid)
    );
  }

  // POST /seller/custom-orders/:requestUuid/quote - 견적서 발급
  async createCustomOrderQuote(
    requestUuid: string,
    quoteData: {
      estimatedPrice: number;
      estimatedDays: number;
      notes?: string;
    }
  ): Promise<ApiResponse<{ message: string; quoteUuid?: string }>> {
    return this.request<ApiResponse<{ message: string; quoteUuid?: string }>>(
      API_ENDPOINTS.SELLER.CUSTOM_ORDER_QUOTE(requestUuid),
      {
        method: 'POST',
        // 백엔드 API가 기대하는 필드명으로 변환
        body: JSON.stringify({
          price: quoteData.estimatedPrice,
          processingDays: quoteData.estimatedDays,
          sellerNotes: quoteData.notes,
        }),
      }
    );
  }

  // PATCH /seller/custom-orders/:requestUuid/quote - 견적서 수정
  async updateCustomOrderQuote(
    requestUuid: string,
    quoteData: {
      estimatedPrice?: number;
      estimatedDays?: number;
      notes?: string;
    }
  ): Promise<ApiResponse<{ message: string }>> {
    // 백엔드 API가 기대하는 필드명으로 변환
    const apiData: Record<string, unknown> = {};
    if (quoteData.estimatedPrice !== undefined) apiData.price = quoteData.estimatedPrice;
    if (quoteData.estimatedDays !== undefined) apiData.processingDays = quoteData.estimatedDays;
    if (quoteData.notes !== undefined) apiData.sellerNotes = quoteData.notes;

    return this.request<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.SELLER.CUSTOM_ORDER_QUOTE(requestUuid),
      {
        method: 'PATCH',
        body: JSON.stringify(apiData),
      }
    );
  }

  // POST /seller/custom-orders/:requestUuid/complete - 제작 완료
  async completeCustomOrder(
    requestUuid: string,
    completionData?: {
      notes?: string;
    }
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.SELLER.CUSTOM_ORDER_COMPLETE(requestUuid),
      {
        method: 'POST',
        body: JSON.stringify(completionData || {}),
      }
    );
  }

  // GET /products/prefill/:requestUuid - 주문서 기반 상품 프리필 데이터 조회
  async getPrefillData(requestUuid: string): Promise<ApiResponse<PrefillProductResponse>> {
    return this.request<ApiResponse<PrefillProductResponse>>(
      API_ENDPOINTS.PRODUCTS.PREFILL(requestUuid)
    );
  }

  // GET /seller/custom-order - 커스텀 주문 설정 조회
  async getCustomOrderSetting(): Promise<{
    success: boolean;
    data: { acceptsCustomOrders: boolean };
  }> {
    return this.request<{
      success: boolean;
      data: { acceptsCustomOrders: boolean };
    }>(API_ENDPOINTS.SELLER.CUSTOM_ORDER_SETTING);
  }

  // PATCH /seller/custom-order - 커스텀 주문 설정 변경
  async updateCustomOrderSetting(data: {
    acceptsCustomOrders: boolean;
  }): Promise<{
    success: boolean;
    data: { acceptsCustomOrders: boolean };
  }> {
    return this.request<{
      success: boolean;
      data: { acceptsCustomOrders: boolean };
    }>(API_ENDPOINTS.SELLER.CUSTOM_ORDER_SETTING, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ==================== 현재 로그인한 판매자 정보 관련 API ====================

  // GET /seller/info - 현재 로그인한 판매자 정보 조회
  async getMySellerInfo(): Promise<{
    success: boolean;
    data: {
      sellerInfoId: string;
      userId: string;
      brandName: string;
      brandProfile: string | null;
      acceptsCustomOrders: boolean;
      representativeName: string;
      businessNumber: string;
      businessType: string;
      businessCategory: string;
      contactEmail: string;
      contactPhone: string;
      isVerified: boolean;
      isActive: boolean;
      status: string;
      createdAt: string;
      updatedAt: string;
    };
    message: string;
  }> {
    return this.request<{
      success: boolean;
      data: {
        sellerInfoId: string;
        userId: string;
        brandName: string;
        brandProfile: string | null;
        acceptsCustomOrders: boolean;
        representativeName: string;
        businessNumber: string;
        businessType: string;
        businessCategory: string;
        contactEmail: string;
        contactPhone: string;
        isVerified: boolean;
        isActive: boolean;
        status: string;
        createdAt: string;
        updatedAt: string;
      };
      message: string;
    }>(API_ENDPOINTS.SELLER.MY_INFO);
  }

  // PUT /seller/info - 판매자 정보 수정 (커스텀 주문 설정 포함)
  async updateSellerInfo(data: {
    acceptsCustomOrders?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    seller: {
      sellerUuid: string;
      brandName: string;
      acceptsCustomOrders: boolean;
    };
  }> {
    return this.request<{
      success: boolean;
      message: string;
      seller: {
        sellerUuid: string;
        brandName: string;
        acceptsCustomOrders: boolean;
      };
    }>(API_ENDPOINTS.SELLER.MY_INFO, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PUT /seller/profile - 브랜드 정보 수정 (브랜드명, 로고)
  async updateSellerProfile(data: {
    brandName?: string;
    brandProfile?: string;
  }): Promise<{
    message: string;
    user: any;
  }> {
    return this.request<{
      message: string;
      user: any;
    }>(API_ENDPOINTS.SELLER.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export class SellerServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseSellerService {
    return new (class extends BaseSellerService {})(baseURL, getAuthHeaders);
  }
}
