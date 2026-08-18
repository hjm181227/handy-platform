// API Response Types
/**
 * 서버 표준 에러 페이로드 (utils/response.ts sendError)
 * 실응답: { success: false, error: { code, message } }
 * 일부 레거시 경로/클라이언트 래퍼는 error를 문자열로 넣으므로 union으로 둔다.
 */
export interface ApiErrorDetail {
  code?: string;
  message?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string | ApiErrorDetail;
  /** 일부 엔드포인트가 최상위로 내려주는 에러 코드 */
  errorCode?: string;
  details?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProducts?: number;
  totalOrders?: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Design Tool Types
export type DesignToolPlanId = 'free' | 'pro';

export interface DesignToolPlan {
  planId: DesignToolPlanId;
  name: string;
  price: number;
  features: string[];
  maxProjects: number;
  maxExports: number;
  hasAiFeatures: boolean;
  hasCollaboration: boolean;
}

export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'in_grace_period'
  | 'on_hold'
  | 'paused'
  | 'trial'
  | 'none';

export type PaymentSource = 'toss' | 'apple' | 'google' | 'admin';

export interface BillingMethodMeta {
  cardCompany?: string;
  maskedNumber?: string;
  cardType?: string;
  ownerType?: string;
}

/**
 * 디자인 툴 구독 상태 (신규 RESTful 스펙).
 * 기존 DesignToolAccess의 역할을 대체한다.
 */
export interface SubscriptionState {
  userUuid: string;
  plan: DesignToolPlanId;
  status: SubscriptionStatus;
  paymentSource?: PaymentSource;
  expiresAt?: string;
  nextRenewalAt?: string;
  autoRenew: boolean;
  subscribedAt?: string;
  cancelledAt?: string;
  trialEndsAt?: string;
  amount?: number;
  currency?: string;
  billingMethodMeta?: BillingMethodMeta;
}

/**
 * @deprecated Use SubscriptionState. Maintained as alias for backward compatibility
 * during migration. Consumers should migrate to SubscriptionState field names
 * (plan, status, nextRenewalAt, billingMethodMeta, ...).
 */
export type DesignToolAccess = SubscriptionState;

export interface DesignToolPaymentRecord {
  id: string;
  paidAt: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentSource: Exclude<PaymentSource, 'admin'>;
  productId?: string;
  receiptUrl?: string;
  refundedAt?: string;
  isTrial?: boolean;
}

export interface DesignToolPaymentsPage {
  items: DesignToolPaymentRecord[];
  nextCursor?: string;
}

export interface AdminSubscriptionSummary {
  userUuid: string;
  email: string;
  plan: DesignToolPlanId;
  status: SubscriptionStatus;
  paymentSource?: PaymentSource;
  expiresAt?: string;
  autoRenew: boolean;
  lastPaymentAt?: string;
}

export interface AdminSubscriptionListResponse {
  items: AdminSubscriptionSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminSubscriptionListQuery {
  status?: SubscriptionStatus;
  plan?: DesignToolPlanId;
  paymentSource?: PaymentSource;
  page?: number;
  limit?: number;
}

export interface DesignToolSubscribeRequest {
  planId: DesignToolPlanId;
  paymentMethod?: string;
}

export interface DesignToolPaymentSession {
  orderId: string;
  amount: number;
  clientKey: string;
  orderName: string;
  customerKey?: string;
}

export interface DesignToolSubscribeResponse {
  success: boolean;
  subscription?: SubscriptionState;
  paymentSession?: DesignToolPaymentSession;
  message: string;
}

// User Related Types
/** 회원 등급 — 서버 models/User.ts 의 membershipLevel */
export type MembershipLevel =
  | 'Stylish'
  | 'Gorgeous'
  | 'Stunning'
  | 'Iconic'
  | 'Breathtaking';

export interface User {
  userUuid: string;  // UUID format (f47ac10b-58cc-4372-a567-0e02b2c3d479) - primary identifier
  email: string;
  name: string;
  nickname?: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'seller' | 'admin';
  isActive: boolean;
  address?: Address;
  wishlist?: string[];
  // Added from server API spec (UUID migration v1.1.0+)
  points?: {
    balance: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  };
  membershipLevel?: MembershipLevel;
  membershipLevelStartDate?: string;
  stats?: {
    totalOrders: number;
    totalSpent: number;
    /** 가입일 (마이페이지 요약 응답에 포함) */
    joinedDate?: string;
  };
  designToolAccess?: DesignToolAccess;
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  name?: string;
  phone?: string;
}

// 한국 주소 시스템 타입
export type KoreanRegion = 'seoul' | 'metropolitan' | 'general' | 'jeju' | 'remote';

export interface KoreanAddress {
  recipientName: string;
  recipientPhone: string;
  postcode: string;
  roadAddress: string;
  jibunAddress: string;
  detailAddress: string;
  extraAddress: string;
  region: KoreanRegion;
  deliveryNote?: string;
  addressName?: string;
  isDefault?: boolean;
}

export interface KoreanAddressResponse extends KoreanAddress {
  index: number;
  lastUsed?: string;
  fullAddress: string;
  displayName: string;
}

export interface KoreanAddressListResponse {
  addresses: KoreanAddressResponse[];
  defaultAddressIndex: number;
  totalAddresses: number;
  maxAddresses: number;
}

export interface KoreanAddressValidationRequest extends KoreanAddress {}

export interface KoreanAddressValidationResponse {
  isValid: boolean;
  warnings: string[];
  formattedAddress: {
    full: string;
    delivery: string;
    recipient: string;
  };
  shippingEstimate: {
    region: KoreanRegion;
    estimatedCost: number;
    estimatedDays: number;
  };
  message: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
  isNewUser?: boolean;  // 소셜 로그인 시 신규 가입자 여부
  // @deprecated needsSignup은 더 이상 사용되지 않습니다. 소셜 로그인 시 자동 가입됩니다.
  needsSignup?: boolean;
  kakaoUserInfo?: {
    id: string;
    email: string;
    name: string;
    profileImage?: string;
  };
}

// Product Related Types (네일팁 전용 API 스펙에 맞게 완전 재정의)
export interface DetailImage {
  /** 몽고 서브도큐먼트 _id (서버가 detailImages 배열과 함께 내려준다) */
  _id?: string;
  url: string;
  description?: string;
  order: number;
}

export interface ProductRating {
  average: number;
  count: number;
}

export interface ProductReview {
  id: string;                     // UUID format (b2c3d4e5-f6a7-8901-2345-6789abcdef01) after migration
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

// 네일 전용 카테고리 타입 (서버 API 스펙 기준)
export interface NailCategories {
  style: string[];    // ["신상", "심플", "화려", "아트", "트렌디", "클래식", "시즌", "테마", "키치", "네츄럴"] 최대 3개
  color: string[];    // ["레드", "핑크", "블루", "그린", "블랙/화이트", "브라운", "옐로우", "뉴트럴"] 최대 3개
  texture: string[];  // ["글리터", "메탈", "매트", "벨벳", "젤", "자석"] 최대 3개
  tpo: string[];      // ["데일리", "파티", "웨딩", "공연"] 최대 3개
  nation: string;     // "K네일" | "J네일" | "기타" 1개만
}

// 네일 옵션 타입
export interface NailOptions {
  lengthCustomizable: boolean;    // 길이 커스터마이징 가능 여부
  shapeCustomizable: boolean;     // 모양 커스터마이징 가능 여부
  designCustomizable: boolean;    // 디자인 커스터마이징 가능 여부
}

// 네일 모양 및 길이 타입
export type NailShape = 'ROUND' | 'ALMOND' | 'OVAL' | 'STILETTO' | 'SQUARE' | 'COFFIN';
export type NailLength = 'SHORT' | 'MEDIUM' | 'LONG';

// 판매자 정보
export interface Seller {
  userId: string;
  name: string;
  companyName: string;
  isVerified: boolean;
}

// 소셜 프루프
export interface SocialProof {
  totalMentions: number;
  recentMentions: number;
  averageRating: number;
  trendingScore: number;
}

// 상품 통계
export interface ProductStats {
  viewsCount: number;
  ordersCount: number;
  reviewsCount: number;
}

// 상품 유형 (커스텀/오리지널 구분) - 서버 API 스펙에 맞게 소문자 사용
export type ProductType = 'original' | 'custom';

// 상품 인터페이스 (서버 API 스펙 완전 일치, UUID migration v1.1.0+)
export interface Product {
  productUuid: string;            // UUID format (e87e4b2c-8f9a-4d3c-b2a1-9e8d7c6b5a43) - primary identifier
  productId?: string;             // Sequential ID ("1", "2", "3"...) - legacy compatibility
  /**
   * @deprecated 서버는 응답에서 id 를 제거한다(models/Product.ts toJSON transform).
   * 항상 undefined 이므로 신규 코드는 productUuid 를 쓸 것. `p.productUuid || p.id` 같은
   * 구버전 폴백만 남아 있어 타입만 유지한다.
   */
  id?: string;
  name: string;
  description: string;
  shortDescription?: string;
  brand?: string;
  category?: string;              // 카테고리 속성 추가
  sku?: string;
  price: number;
  salePrice?: number;
  sale?: {                        // sale 속성 추가
    isOnSale: boolean;
    salePrice?: number;
    originalPrice: number;
  };
  discountRate?: number | null;
  discountedPrice: number;
  hasDiscount?: boolean;
  mainImageUrl: string;
  detailImages: DetailImage[];
  stockQuantity: number;
  isInStock: boolean;
  processingDays: number;
  nailCategories: NailCategories;
  nailShape: NailShape;
  nailLength: NailLength;
  nailOptions: NailOptions;
  rating: ProductRating;
  likesCount: number;
  isLiked?: boolean;              // 현재 사용자의 좋아요 여부 (로그인 시에만)
  postsCount?: number;
  isFeatured: boolean;
  isNewProduct: boolean;
  tags: string[];
  /** 판매자 User.userUuid (서버 models/Product.ts). 일부 축약 select 응답에는 없다 */
  sellerUuid?: string;
  /** 판매자 브랜드명 스냅샷 (서버 models/Product.ts) */
  sellerName?: string;
  seller?: Seller;
  stats: ProductStats;
  socialProof?: SocialProof;
  status: 'active' | 'inactive' | 'outOfStock';  // 추가: 상품 상태
  productType?: ProductType;                      // 상품 유형 (커스텀/오리지널)
  createdAt: string;
  updatedAt: string;
}

// 상품 목록 응답 타입
export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    sellerUuid: string | null;
    search: string | null;
    priceRange: {
      min: number | null;
      max: number | null;
    };
    nailShape: string | null;
    nailLength: string | null;
    featured: boolean;
  };
}

// 상품 상세 응답 타입
export interface ProductDetailResponse {
  success: boolean;
  data: Product;
}

// 상품 생성 요청 (서버 API 스펙에 완전 일치)
export interface CreateProductRequest {
  productType?: ProductType;       // 상품 유형 (커스텀/오리지널)
  name: string;                    // Required, max 200 characters
  description: string;             // Required, max 2000 characters
  shortDescription?: string;
  brand?: string;
  sku?: string;
  price: number;                   // Required, > 0
  salePrice?: number;              // Optional, must be < price if provided
  discountRate?: number | null;
  mainImageUrl: string;            // Required
  detailImages?: Array<{
    url: string;
    description?: string;
    order: number;
  }>;
  stockQuantity: number;           // Required, >= 0
  processingDays: number;          // Required, 0-365 days
  nailCategories: NailCategories;
  nailShape: NailShape;
  nailLength: NailLength;
  nailOptions: NailOptions;
  isFeatured?: boolean;
  isNewProduct?: boolean;
  tags?: string[];                 // Max 20 tags
  customOrderRequestUuid?: string; // 커스텀 상품일 때 연결된 주문서 UUID
}

// 상품 업데이트 요청 인터페이스
/**
 * 상품 수정 요청 바디.
 * 서버는 PUT /api/products/:productUuid 경로 파라미터로 대상을 식별하고
 * 바디는 Partial<ProductCreateBody> 만 사용하므로 식별자는 선택 항목이다.
 */
export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  productUuid?: string;
  productId?: string;
}

// 상품 검색/필터 인터페이스 (서버 API 스펙에 완전 일치)
export interface ProductFilters {
  page?: string;           // "1", "2", ... (서버에서 string으로 받음)
  limit?: string;          // "12", "20", ... (서버에서 string으로 받음)
  sellerUuid?: string;
  search?: string;         // 텍스트 검색 (제품명, 설명, 태그)
  minPrice?: string;       // 최소 가격 필터
  maxPrice?: string;       // 최대 가격 필터
  nailShape?: NailShape;   // 네일 모양 필터
  nailLength?: NailLength; // 네일 길이 필터
  featured?: string;       // "true" for featured products
  productType?: ProductType; // 상품 유형 필터 (ORIGINAL/CUSTOM)
  sortBy?: 'price' | 'rating' | 'createdAt' | 'likesCount' | 'trending';
  sortOrder?: 'asc' | 'desc';
}

// 판매자별 상품 조회 필터 (ProductFilters에서 sellerUuid 제외) - 서버 API 스펙에 맞게 변경
export interface SellerProductFilters {
  page?: number;                 // 페이지 번호 (기본값: 1) - 서버는 number 타입 요구
  limit?: number;                // 페이지당 항목 수 (기본값: 20)
  isActive?: boolean;            // 활성 상태별 필터링
  lowStock?: boolean;            // 저재고 제품 필터링 (≤10)
  search?: string;               // 제품명 또는 SKU 검색
  sortBy?: string;               // 정렬 필드 (기본값: "createdAt")
  sortOrder?: 'asc' | 'desc';    // 정렬 순서 (기본값: "desc")
}

// 상품 대량 업데이트 요청
export interface BulkUpdateProductsRequest {
  productIds: string[];
  updates: Partial<UpdateProductRequest>;
}

// 상품 복제 요청
export interface DuplicateProductRequest {
  sourceProductId: string;
  newName?: string;
  newSku?: string;
}

// Cart Related Types (서버 API 스펙에 맞게 확장)
export interface ProductVariant {
  id: string;
  sku: string;
  optionCombination: Array<{
    optionType: string;
    optionValue: string;
  }>;
  priceModifier: number;
}

/**
 * 장바구니 아이템.
 * 서버(GET /api/cart)는 itemsBySeller[].items 에 아래 평탄한 형태로 내려준다:
 *   { productUuid, name, mainImageUrl, options, quantity, price, subtotal }
 * product/productId 는 mock·레거시 화면 호환용으로만 남아 있어 optional 이다.
 */
export interface CartItem {
  // --- 서버 실응답 필드 ---
  productUuid: string;
  name?: string;
  mainImageUrl?: string;
  brand?: string;
  options?: Record<string, string>;
  quantity: number;
  price: number;
  subtotal: number;

  // --- 레거시/호환 필드 ---
  id?: string;
  productId?: string;
  product?: Product;
  variant?: ProductVariant;
  selectedOptions?: Record<string, string>;  // 선택된 옵션들
  totalPrice?: number;
  addedAt?: string;
}

export interface CartTotals {
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  itemCount: number;
  freeShippingRemaining: number;
}

// 판매자 정보 타입
export interface SellerInfo {
  companyName: string;
  isVerified: boolean;
  estimatedDeliveryDays: {
    min: number;
    max: number;
  };
}

// 판매자 신청 관련 타입
export interface SellerApplication {
  sellerInfoId: string;
  userId?: string;
  userUuid?: string;
  brandName: string;
  representativeName?: string;
  businessNumber?: string;
  businessType?: string;
  businessCategory?: string;
  businessSector?: string;
  contactEmail: string;
  contactPhone?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  hasVerificationDocuments: boolean;
  documentsCount: number;
  applicationProgress?: number;
  missingFields?: string[];
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  rejectedAt?: string;
  approvedAt?: string;
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  verificationDocuments?: Array<{
    type: string;
    url: string;
    uploadedAt?: string;
  }>;
  verificationNote?: string;
}

// 판매자별 배송 정보
export interface SellerShipping {
  sellerUuid: string;
  sellerName: string;
  subtotal: number;
  baseShippingCost: number;
  freeShippingThreshold: number;
  shippingCost: number;
  isFreeShipping: boolean;
  freeShippingRemaining: number;
  region: string;
  additionalRegionalCost: number;
  estimatedDeliveryDays: {
    min: number;
    max: number;
  };
  itemCount: number;
}

// 판매자별 그룹화된 장바구니 아이템
export interface CartItemsBySeller {
  sellerUuid: string;
  sellerName: string;
  sellerInfo: SellerInfo;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  shipping: SellerShipping;
}

// 다중 판매자 총액 정보
export interface MultiSellerTotals {
  subtotal: number;
  totalShippingCost: number;
  tax: number;
  total: number;
  itemCount: number;
  sellersShipping: SellerShipping[];
  estimatedProductionTime: number;
  earliestDeliveryDate: string;
  shippingBreakdown: {
    totalSellers: number;
    freeShippingSellers: number;
    paidShippingSellers: number;
    averageDeliveryDays: number;
  };
}

// 장바구니 요약 정보
export interface CartSummary {
  totalSellers: number;
  totalItems: number;
  totalAmount: number;
  hasMultipleSellers: boolean;
  largestSellerItemCount: number;
  sellersWithFreeShipping: number;
}

// 제작 용량 경고
export interface CapacityWarning {
  sellerUuid: string;
  sellerName: string;
  currentMonth: string;
  remainingCapacity: number;
  totalCapacity: number;
  message: string;
}

// 제거된 아이템 정보
export interface RemovedItem {
  productName: string;
  reason: string;
  availableCapacity: number;
  requestedQuantity: number;
  nextAvailableMonth: string;
}

/**
 * 장바구니.
 * 서버 GET /api/cart 는 { itemsBySeller, totals } 만 내려주고,
 * 웹의 mapApiResponseToCart 가 totals 를 CartTotals 형태로 변환한다.
 * 그 외 필드(id/user/totalPrice 등)는 서버 응답에 없으므로 optional 이다.
 */
export interface Cart {
  id?: string;
  user?: string;
  items: CartItem[];
  // 새로운 판매자별 그룹화 정보
  itemsBySeller?: CartItemsBySeller[];
  multiSellerTotals?: MultiSellerTotals;
  summary?: CartSummary;
  // 기존 정보 (하위 호환성)
  totals: CartTotals;
  totalItems?: number;            // 총 아이템 수
  totalPrice?: number;            // 총 가격
  totalDiscount?: number;         // 총 할인 금액
  shippingCost?: number;          // 배송비
  finalPrice?: number;            // 최종 가격
  updatedAt?: string;
}

// Cart API 응답 타입 업데이트
export interface CartResponse {
  success: boolean;
  data: {
    cart: Cart;
  };
  removedItems?: RemovedItem[];
  capacityWarnings?: CapacityWarning[];
  message?: string;
}

// Order Related Types
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * 주문/결제에 저장되는 결제수단.
 * 서버 models/Order.ts 는 types/PaymentTypes.ts 의 PaymentMethod enum 값을 그대로 저장한다.
 * 소문자 값들은 구버전 데이터 호환용으로 남겨둔다.
 */
export type PaymentMethod =
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'TOSS_PAY'
  | 'TOSS_PAYMENTS'
  | 'KAKAO_PAY'
  | 'NAVER_PAY'
  // 레거시(구버전 데이터)
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'bank_transfer'
  | 'cash_on_delivery';

export interface OrderItem {
  productUuid: string;            // 상품 UUID
  productName: string;            // 상품명
  productImage?: string;          // 상품 이미지 URL
  sellerName: string;             // 판매자명
  quantity: number;               // 수량
  price: number;                  // 단가
  subtotal: number;               // 소계 (price * quantity)
  options?: Record<string, any>;  // 선택 옵션
  priceModifier?: number;         // 가격 조정값
}

export interface ShippingDetails {
  id: string;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  carrier: {
    name: string;
    code: string;
  };
}

// Base Order Interface - 공통 필드
export interface BaseOrder {
  id: string;                     // UUID format - 주문 식별자 (orderUuid 매핑)
  orderNumber: string;            // 사람이 읽기 쉬운 주문번호
  status: OrderStatus;            // 주문 상태
  paymentStatus: PaymentStatus;   // 결제 상태
  totalAmount: number;            // 총 주문 금액
  createdAt: string;              // 주문 생성일
  items: OrderItem[];             // 주문 상품 목록
  estimatedDelivery?: string;     // 예상 배송일
  notes?: string;                 // 주문 메모
}

// Customer Order Interface - 소비자가 보는 주문 (다중 판매자 주문)
export interface CustomerOrder extends BaseOrder {
  paymentMethod: PaymentMethod;   // 결제 수단 (필수)
  shippingAddress: ShippingAddress; // 배송 주소 (필수) - ShippingAddress 타입 재사용

  // 다중 판매자 배송 정보 - 각 판매자별로 다른 배송 정보를 가질 수 있음
  sellerShippings?: Array<{
    sellerUuid: string;           // 판매자 UUID
    sellerName: string;           // 판매자명
    items: OrderItem[];           // 해당 판매자의 상품들
    shipping: ShippingDetails;    // 배송 정보
    subtotal: number;             // 판매자별 소계
  }>;
}

// Seller Order Item Interface - 서버 OrderItemResponse 기반
export interface SellerOrderItem {
  productUuid: string;
  shape?: string;
  size?: string;
  quantity: number;
  price: number;

  // 주문 시점 스냅샷 정보
  productName: string;
  sellerName: string;
  productImage?: string;

  // 상세 조회 시 추가 정보
  options?: Record<string, any>;
  sku?: string;
  basePrice?: number;
  priceModifier?: number;
  subtotal?: number;
}

// Seller Order Interface - 서버 SellerOrderResponse 기반 (통일된 필드명)
export interface SellerOrder {
  id: string;              // orderUuid → id (CustomerOrder와 통일) - 필수 필드
  orderNumber: string;
  status: string;
  items: SellerOrderItem[];
  totalAmount: number;     // sellerTotal → totalAmount (CustomerOrder와 통일)
  createdAt: string;
  updatedAt: string;       // 서버 스펙에 추가됨
  estimatedDelivery?: string;
  orderType?: 'normal' | 'custom';  // 주문 타입 (커스텀 주문 식별용)
  customRequestUuid?: string;       // 커스텀 주문서 UUID (커스텀 주문 시 연결)
}

// Seller Order Detail Interface - 서버 SellerOrderDetailData 기반
export interface SellerOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  items: SellerOrderItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
  estimatedDelivery?: string;
  statusHistory?: Array<{
    status: string;
    date: string;
    note?: string;
  }>;
  shippingAddress?: {
    name?: string;                // 마스킹된 이름 "홍**"
    street?: string;              // 마스킹된 주소
    city?: string;
    state?: string;
    zipCode?: string;             // 마스킹된 우편번호 "06***"
    country?: string;
    phone?: string;               // 마스킹된 전화번호 "010-****-5678"
  };
  notes?: string;
}

// Seller Order Pagination - 서버 SellerOrderPagination 기반
export interface SellerOrderPagination {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Legacy Order Interface - 하위 호환성을 위해 유지 (CustomerOrder 기반)
export interface Order extends CustomerOrder {}

// Order Group for Seller Management - 판매자별 주문 그룹핑
export interface SellerOrderGroup {
  sellerUuid: string;
  sellerName: string;
  orders: SellerOrder[];
  totalOrders: number;
  totalAmount: number;
  summary: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

export interface OrdersResponse {
  orders: Order[];
  pagination: PaginationInfo;
}

// WebView Message Types
export type WebViewMessageType =
  | 'NAVIGATION'
  | 'API_CALL'
  | 'AUTH'
  | 'CART'
  | 'NOTIFICATION'
  | 'CAMERA'
  | 'PAYMENT'
  | 'PERMISSIONS'
  | 'OAUTH'                          // OAuth 시스템 브라우저 요청 (Google 등)
  | 'OAUTH_CANCELLED'                 // OAuth 취소/실패 알림 (InAppBrowser에서 취소)
  | 'API_RESPONSE'
  | 'AUTH_RESPONSE'
  | 'CART_RESPONSE'
  | 'CAMERA_RESPONSE'
  | 'PAYMENT_RESPONSE'
  | 'PERMISSIONS_RESPONSE'
  | 'SAVE_IMAGE'                // 이미지를 갤러리에 저장 요청
  | 'SAVE_IMAGE_RESPONSE'       // 이미지 저장 응답
  | 'NAVIGATE_TO_MEASUREMENT'   // 손톱 사이즈 측정 화면으로 이동
  | 'NAVIGATE_TO_SIZES'         // 손톱 사이즈 목록 화면으로 이동
  | 'NAVIGATE_BACK';            // 뒤로가기

export interface WebViewMessage {
  type: WebViewMessageType;
  data: any;
  requestId?: string;
}

// API Call Types
export interface ApiCallData {
  endpoint: string;
  requestId: string;
  [key: string]: any;
}

export interface ApiResponseData {
  success: boolean;
  result?: any;
  error?: string;
  requestId: string;
}

// Camera Types
export interface CameraOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  storageOptions?: {
    skipBackup?: boolean;
    path?: string;
  };
}

export interface ImagePickerResponse {
  uri: string;
  type: string;
  name: string;
  size: number;
}

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Profile: undefined;
  Orders: undefined;
  Login: undefined;
  Register: undefined;
};

// Error Types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  error?: AppError | null;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  name: string;
  nickname: string;
  phone?: string;
  verificationId?: string; // 휴대폰 인증 완료 후 받은 ID (신규 필수)
}

export interface ReviewForm {
  rating: number;
  comment: string;
}

// Analytics Types
export interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
  timestamp: string;
}

// Notification Types

/** 인앱 알림 — 서버 models/Notification.ts */
export type UserNotificationType =
  | 'order_status'
  | 'point_earned'
  | 'promotion'
  | 'system'
  | 'review'
  | 'coupon';

export interface UserNotification {
  _id: string;
  type: UserNotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PushNotification {
  title: string;
  message: string;
  data?: Record<string, any>;
  scheduled?: boolean;
}

// 이미지 업로드 관련 타입
export interface PresignedUrlRequest {
  filename: string;
  contentType: string;  // 다시 필수 필드로 복원
  uploadType: 'product-main' | 'product-detail' | 'review' | 'avatar' | 'category' | 'coupon' | 'qr-code' | 'general' | 'seller-document' | 'banner' | 'brand-profile' | 'brand-banner' | 'custom-order-reference' | 'chat-message' | 'snap';
  fileSize?: number;
}

export interface PresignedUrlResponse {
  success: boolean;
  presignedUrl: string;
  imageUrl: string;
  filename: string;
  uploadType: string;
  maxFileSize: string;
  expiresIn: string;
  uploadHeaders?: Record<string, string>;  // Additional headers required for upload (e.g., x-amz-acl)
  constraints: {
    allowedTypes: string[];
    maxFileSize: string;
    minDimensions?: string;
    maxDimensions?: string;
    aspectRatio?: number;
  };
}

export interface ImageUploadConfig {
  allowedTypes: string[];
  uploadTypes: Record<string, {
    maxFileSize: string;
    minDimensions?: string;
    maxDimensions?: string;
    requiredAspectRatio?: string;
    recommendedAspectRatio?: string;
    description: string;
  }>;
  features: {
    autoOptimization: boolean;
    thumbnailGeneration: boolean;
    exifRemoval: boolean;
    securityScanning: boolean;
    cdnIntegration: boolean;
  };
}

// 쿠폰 관련 타입
export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  maxDiscountAmount?: number;
  conditions: {
    minOrderAmount?: number;
    applicableCategories?: string[];
    newUsersOnly?: boolean;
  };
  validity: {
    startDate: string;
    endDate: string;
  };
  usage: {
    totalLimit?: number;
    perUserLimit?: number;
    usedCount?: number;
  };
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface UserCoupon {
  id: string;
  coupon: Coupon;
  status: 'available' | 'used' | 'expired';
  acquiredAt: string;
  acquiredFrom: 'download' | 'redeem' | 'system';
  usedAt?: string;
  expiresAt: string;
  isUsable: boolean;
}

// 판매자 쿠폰 관련 타입
export interface CreateSellerCouponRequest {
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue: number;
  maxDiscountAmount?: number;
  minimumOrderAmount?: number;
  appliesTo: 'product' | 'quote' | 'both';
  validity: {
    startDate: string;
    endDate: string;
  };
  limits?: {
    totalCount?: number;
    perUserLimit?: number;
  };
  isPublic?: boolean;
}

export interface SellerCoupon {
  couponUuid: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue: number;
  maxDiscountAmount?: number;
  minimumOrderAmount?: number;
  scope: {
    type: 'seller';
    sellerUuid: string;
  };
  appliesTo: 'product' | 'quote' | 'both';
  validity: {
    startDate: string;
    endDate: string;
  };
  limits: {
    totalCount: number;
    issuedCount: number;
    perUserLimit: number;
  };
  isActive: boolean;
  isPublic: boolean;
  stats?: {
    usedCount: number;
    totalDiscount: number;
  };
  createdAt: string;
}

export interface SellerCouponUsageStats {
  summary: {
    totalDownloads: number;
    totalUsed: number;
    totalDiscount: number;
    conversionRate: number;
  };
  dailyStats: Array<{
    date: string;
    downloads: number;
    used: number;
    discount: number;
  }>;
  recentUsage: Array<{
    usedAt: string;
    discountAmount: number;
    orderAmount: number;
  }>;
}

// 포인트 관련 타입
export interface PointTransaction {
  id: string;
  type: 'earn_purchase' | 'earn_review' | 'earn_signup' | 'earn_referral' | 'use_payment' | 'expire' | 'admin_adjust';
  amount: number;
  balance: number;
  description: string;
  relatedOrder?: {
    orderNumber: string;
    status: string;
  };
  expiresAt?: string;
  createdAt: string;
}

export interface UserPointsInfo {
  balance: number;
  totalEarned: number;
  totalUsed: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  tierProgress: {
    currentSpent: number;
    currentOrders: number;
    nextTierRequirements: {
      minSpent: number;
      minOrders: number;
    };
  };
  expiringPoints: {
    totalAmount: number;
    count: number;
    nextExpiring: {
      amount: number;
      expiresAt: string;
      daysUntilExpiry: number;
    };
  };
}

// 리뷰 시스템 타입
export interface ReviewImage {
  url: string;
  filename: string;
  s3Key: string;
  caption?: string;
}

export interface DetailedReview {
  id: string;
  // 서버에서 productUuid를 반환 (객체 또는 문자열 형태)
  productUuid?: string | { _id: string; name?: string; price?: number };
  productId?: string;  // 편의를 위한 추가 필드
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  title?: string;
  content: string;
  images?: ReviewImage[];
  detailRatings?: {
    quality: number;
    price: number;
    shipping: number;
    service: number;
  };
  verifiedPurchase: boolean;
  helpful: {
    upVotes: number;
    downVotes: number;
  };
  userHelpfulVote?: 'up' | 'down';
  reply?: {
    author: {
      name: string;
      role: 'seller' | 'admin';
    };
    content: string;
    createdAt: string;
  };
  tags?: string[];
  createdAt: string;
}

export interface ReviewsResponse {
  reviews: DetailedReview[];
  pagination: PaginationInfo;
  distribution: Record<string, number>; // 1-5 별점 분포
  filters: {
    sortBy: string;
    sortOrder: string;
    rating?: number;
    verifiedOnly: boolean;
  };
}

// OAuth 관련 타입
export interface OAuthProvider {
  provider: 'kakao' | 'google' | 'apple' | 'naver';
  email: string;
  name: string;
  profileImage?: string;
  connectedAt: string;
}

export interface LinkedAccountsResponse {
  linkedAccounts: OAuthProvider[];
  hasPassword: boolean;
  isSocialOnly: boolean;
}

// 판매자 센터 관련 타입
export interface SellerRegistration {
  businessType: 'individual' | 'corporate';
  companyName: string;
  businessNumber: string;
  representative: string;
  phone: string;
  address: Address;
  bankAccount: {
    bank: string;
    accountNumber: string;
    accountHolder: string;
  };
  documents: {
    businessLicense?: string;
    taxRegistration?: string;
    bankStatement?: string;
  };
}

// 판매자 상품 목록 필터 (서버 API 스펙에 맞게 업데이트)
export interface SellerProductFilters {
  page?: number;                 // 페이지 번호 (기본값: 1)
  limit?: number;                // 페이지당 항목 수 (기본값: 20)
  isActive?: boolean;            // 활성 상태별 필터링
  lowStock?: boolean;            // 저재고 제품 필터링 (≤10)
  search?: string;               // 제품명 또는 SKU 검색
  sortBy?: string;               // 정렬 필드 (기본값: "createdAt")
  sortOrder?: 'asc' | 'desc';    // 정렬 순서 (기본값: "desc")
}

// 판매자 상품 분석 개요
export interface SellerProductOverview {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  averageRating: number;
  totalReviews: number;
}


export interface SellerDashboard {
  summary: {
    totalSales: number;
    monthlyRevenue: number;
    totalOrders: number;
    activeProducts: number;
    pendingOrders: number;
    lowStockProducts: number;
  };
  recentOrders: Order[];
  salesChart: {
    period: string;
    data: Array<{
      date: string;
      sales: number;
      orders: number;
    }>;
  };
  topProducts: Array<{
    product: Product;
    salesCount: number;
    revenue: number;
  }>;
}

export interface SellerProductAnalytics {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  outOfStockProducts: number;
  topPerforming: Array<{
    product: Product;
    views: number;
    sales: number;
    revenue: number;
    conversionRate: number;
  }>;
  categoryBreakdown: Record<string, {
    count: number;
    sales: number;
    revenue: number;
  }>;
}

export interface SellerOrderAnalytics {
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  orderTrends: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  statusDistribution: Record<OrderStatus, number>;
}

export interface SettlementInfo {
  id: string;
  sellerUuid: string;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalSales: number;
    commission: number;
    refunds: number;
    adjustments: number;
    netAmount: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt?: string;
  processedAt?: string;
  paidAt?: string;
}

export interface SettlementSummary {
  availableAmount: number;
  pendingAmount: number;
  totalSettled: number;
  currentMonthSales: number;
  lastMonthSales: number;
  lastSettlement?: {
    amount: number;
    paidAt: string;
  };
  nextSettlement?: {
    estimatedAmount: number;
    estimatedDate: string;
  };
}

// 대량 상품 관리 타입
export interface BulkProductOperation {
  productIds: string[];
  operation: 'update_status' | 'update_stock' | 'update_price' | 'delete';
  data: Record<string, any>;
}

export interface BulkOperationResult {
  success: boolean;
  totalProcessed: number;
  successful: string[];
  failed: Array<{
    productId: string;
    error: string;
  }>;
}

// 대량 상품 등록 타입
export interface BulkCreateProductRequest {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  stockQuantity?: number;
  processingDays: number;
  productType?: 'original' | 'custom';
  nailShape?: string;
  nailLength?: string;
  nailCategories?: {
    style?: string[];
    color?: string[];
    texture?: string[];
    tpo?: string[];
    nation?: string;
  };
  nailOptions?: {
    lengthCustomizable?: boolean;
    shapeCustomizable?: boolean;
    designCustomizable?: boolean;
  };
  mainImageUrl: string;
  detailImages?: Array<{ url: string; description?: string; order: number }>;
  tags?: string[];
  isFeatured?: boolean;
  isNewProduct?: boolean;
  status?: string;
}

export interface BulkCreateResult {
  totalSubmitted: number;
  totalCreated: number;
  totalFailed: number;
  results: Array<{
    rowIndex: number;
    success: boolean;
    productUuid?: string;
    productName: string;
    error?: string;
  }>;
}

// 배송지 관리 타입
// 주문 시 사용하는 배송지 (기존)
export interface ShippingAddress {
  id?: string;                    // 저장된 배송지의 경우 포함
  recipientName: string;
  recipientPhone: string;
  postcode: string;
  roadAddress: string;
  jibunAddress?: string;          // 지번 주소 (선택)
  detailAddress: string;
  extraAddress?: string;
  /**
   * 배송 권역. 서버(POST /api/checkout/validate)에서 postcode/roadAddress로
   * 자동 판별하므로 클라이언트 전송 시에는 선택 항목이다.
   */
  region?: 'seoul' | 'metropolitan' | 'general' | 'jeju' | 'remote';
  deliveryNote?: string;
  addressName?: string;
  isDefault?: boolean;           // 기본 배송지 여부
  savedAddressIndex?: number;    // 서버에 저장된 배송지 ID
}

// 사용자가 저장한 배송지 목록 관리용
export interface SavedShippingAddress extends ShippingAddress {
  id: string;
  userId?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

// 배송지 관련 API 요청/응답 타입
export interface CreateShippingAddressRequest {
  recipientName: string;
  phone: string;
  address: string;
  addressDetail?: string;
  zipCode: string;
  memo?: string;
  isDefault?: boolean;
}

export interface UpdateShippingAddressRequest extends CreateShippingAddressRequest {
  id: string;
}

export interface ShippingAddressResponse {
  success: boolean;
  data: SavedShippingAddress[];
  message?: string;
}

// QR 코드 관련 타입
export interface QRCodeData {
  type: 'product' | 'category' | 'promotion' | 'custom';
  data: any;
  metadata?: Record<string, any>;
}

export interface QRCodeResponse {
  success: boolean;
  qrCode: string;
  data: QRCodeData;
  expiresAt?: string;
}

// 생산 관리 관련 타입 (서버 API 스펙에 완전 일치)
export interface ProductionSettings {
  orderCapacity: number;            // 동시 처리 가능 주문 수 (min: 1)
  averageProcessingDays: number;    // 평균 제작 소요일 (1-30)
  isAvailableForOrders: boolean;    // 주문 접수 여부
  specialNotice?: string;           // 특별 안내사항 (최대 500자)
  lastUpdatedAt?: string;           // 마지막 업데이트 시간
}

export interface ProductionCapacity {
  capacityId: string;               // 생산량 ID (형식: sellerUuid_year_month)
  year: number;                     // 년도 (2024-2030)
  month: number;                    // 월 (1-12)
  maxOrders: number;                // 최대 주문 수
  currentOrders: number;            // 현재 주문 수
  remainingOrders: number;          // 남은 주문 수
  utilizationRate: number;          // 가동률 (%)
  isActive: boolean;                // 활성 상태
  baseCapacity?: number;            // 기본 생산량
  extraCapacity?: number;           // 추가 생산량
  boostAmount?: number;             // 임시 부스트량
  statistics?: {
    lastMonthUtilization: number;   // 전월 가동률
  };
  hybridSettings?: {
    maxWaitingDays: number;         // 최대 대기일
    bufferDays: number;             // 버퍼일
    enableDailyLimits: boolean;     // 일간 제한 활성화
  };
  extraCapacityHistory?: ExtraCapacityHistory[];  // 추가 생산량 이력
  temporaryBoosts?: TemporaryBoost[];            // 임시 부스트 이력
}

export interface ExtraCapacityHistory {
  amount: number;                   // 추가 생산량 (1-1000)
  reason: string;                   // 추가 사유 (최대 200자)
  addedAt: string;                 // 추가 시간
  expiresAt?: string;              // 만료 시간 (선택사항)
}

export interface TemporaryBoost {
  amount: number;                   // 부스트량 (1-500)
  reason: string;                   // 부스트 사유 (최대 200자)
  appliedAt: string;               // 적용 시간
  expiresAt: string;               // 만료 시간
  duration: number;                // 지속 기간 (1-30일)
  isActive: boolean;               // 활성 상태
}

export interface ProductionHistory {
  year: number;                     // 년도
  month: number;                    // 월
  monthName: string;               // 월 이름 ("1월", "2월", ...)
  maxOrders: number;                // 최대 주문 수
  currentOrders: number;            // 현재 주문 수
  remainingOrders: number;          // 남은 주문 수
  utilizationRate: number;          // 가동률 (%)
  statistics?: {
    lastMonthUtilization?: number;  // 전월 가동률
  };
}

export interface ProductionHistoryResponse {
  history: ProductionHistory[];     // 생산 이력 배열
  summary: {
    totalOrders: number;            // 총 주문 수
    averageUtilization: number;     // 평균 가동률
    periodStart: string;           // 조회 시작 기간 ("YYYY-MM")
    periodEnd: string;             // 조회 종료 기간 ("YYYY-MM")
  };
}

export interface CurrentCapacityInfo {
  year: number;                     // 현재 년도
  month: number;                    // 현재 월
  maxOrders: number;                // 최대 주문 수
  currentOrders: number;            // 현재 주문 수
  remainingOrders: number;          // 남은 주문 수
  utilizationRate: string;          // 가동률 (문자열, "22.5")
}

// 생산 관리 API 요청 타입들
export interface UpdateProductionSettingsRequest {
  orderCapacity?: number;
  averageProcessingDays?: number;
  isAvailableForOrders?: boolean;
  specialNotice?: string;
}

export interface UpdateProductionCapacityRequest {
  maxOrders: number;                // 수정할 최대 주문 수 (1-2000)
  reason: string;                  // 수정 사유 (필수)
}

export interface AddExtraCapacityRequest {
  extraCapacity: number;            // 추가 생산량 (1-1000, 정수, 필수)
  reason: string;                  // 추가 사유 (최대 200자, 필수)
  expiresAt?: string;              // 만료일 (ISO 날짜 형식, 선택사항)
}

export interface ProductionBoostRequest {
  boostAmount: number;              // 부스트량 (1-500, 정수, 필수)
  reason: string;                  // 부스트 사유 (최대 200자, 필수)
  duration: number;                // 지속 기간 (1-30일, 정수, 필수)
}

// 생산 관리 API 응답 타입들
export interface ProductionSettingsResponse {
  productionSettings: ProductionSettings;
  currentCapacity?: CurrentCapacityInfo;    // 현재 용량 정보
  isConfigured?: boolean;                   // 설정 완료 여부
}

export interface ProductionCapacityResponse {
  success: boolean;
  data: ProductionCapacity;
}

export interface ProductionHistoryApiResponse {
  success: boolean;
  data: ProductionHistoryResponse;
}

// ===== BRAND API TYPES =====

// 브랜드 객체 (서버 API에서 반환되는 브랜드 정보)
export interface Brand {
  sellerUuid: string;           // 판매자 UUID
  sellerInfoId: string;         // 판매자 정보 ID (내부 사용)
  brandName: string;            // 브랜드명
  brandProfile: string | null;  // 브랜드 프로필 이미지 URL
  stats: {
    averageRating: number;      // 평균 평점 (0-5)
    totalProducts: number;      // 총 상품 수
    totalOrders: number;        // 총 주문 수
  };
  createdAt: string;            // ISO 8601 형식 생성일
  products?: Product[];         // 상품 목록 (withItems=true일 때만)
}

// 브랜드 목록 API 응답
export interface BrandsResponse {
  brands: Brand[];
  pagination: PaginationInfo;
  filters: BrandFilters;
}

// 브랜드 필터 파라미터
export interface BrandFilters {
  withItems: boolean;           // 각 브랜드의 상품 포함 여부
  itemListNum: number;          // 브랜드별 상품 수
  search: string | null;        // 브랜드명 검색
  sortBy: string;              // 정렬 기준
  sortOrder: string;           // 정렬 순서
}

// 브랜드 목록 조회 요청 파라미터
export interface BrandListParams {
  page?: string;               // 페이지 번호 (기본값: "1")
  listNum?: string;           // 페이지당 브랜드 수 (기본값: "10")
  withItems?: boolean;         // 상품 포함 여부 ("true" | "false", 기본값: "false")
  itemListNum?: string;       // 브랜드별 상품 수 (기본값: "4")
  search?: string;            // 브랜드명 검색
  sortBy?: 'brandName' | 'averageRating' | 'totalProducts' | 'totalOrders' | 'createdAt'; // 정렬 기준
  sortOrder?: 'asc' | 'desc'; // 정렬 순서 (기본값: "desc")
}

// 브랜드명 변경 요청
export interface UpdateBrandNameRequest {
  brandName: string;           // 새로운 브랜드명 (1-200자)
}

// 브랜드 프로필 이미지 변경 요청
export interface UpdateBrandProfileRequest {
  brandProfile: string;        // 브랜드 프로필 이미지 URL
}

// 브랜드 배너 이미지 변경 요청
export interface UpdateBrandBannerRequest {
  brandBanner: string;         // 브랜드 배너 이미지 URL
}

// 브랜드 상세 정보 (서버 API 스펙)
export interface BrandDetail {
  sellerUuid: string;                    // 판매자 UUID
  brandName: string;                     // 브랜드명
  brandProfile: string | null;           // 브랜드 프로필 이미지 URL
  brandBanner: string | null;            // 브랜드 배너 이미지 URL
  representativeName: string;            // 대표자명
  description: string | null;            // 브랜드 설명
  contact: {
    email: string;                       // 연락처 이메일
    phone: string | null;                // 연락처 전화번호
    businessAddress: Address | null;     // 사업자 주소
  };
  business: {
    businessType: string;                // 업태
    businessCategory: string;            // 업종
    businessNumber: string | null;       // 사업자등록번호
    isVerified: boolean;                 // 검증 상태
  };
  stats: {
    totalProducts: number;               // 총 상품 수
    activeProducts: number;              // 활성 상품 수
    averageRating: number;               // 평균 평점 (0-5)
    totalReviews: number;                // 총 리뷰 수
    totalLikes: number;                  // 총 좋아요 수
    totalOrders: number;                 // 총 주문 수
    totalRevenue: number;                // 총 매출
    responseRate: number;                // 응답률 (0-100)
    fulfillmentRate: number;             // 주문 이행률 (0-100)
  };
  shippingPolicy: {
    baseShippingCost: number;            // 기본 배송비
    freeShippingThreshold: number;       // 무료배송 기준금액
    estimatedDeliveryDays: {
      min: number;                       // 최소 배송일
      max: number;                       // 최대 배송일
    };
  };
  production: {
    averageProcessingDays: number;       // 평균 제작일
    isAvailableForOrders: boolean;       // 주문 접수 가능 여부
    vacationMode: boolean;               // 휴가 모드
    specialNotice: string | null;        // 특별 공지사항
  };
  recentProducts: Product[];             // 최근 상품 목록 (최대 4개)
  memberSince: string;                   // 판매자 가입일 (ISO 8601)
  lastActiveAt: string;                  // 마지막 활동 시간 (ISO 8601)
}

// 브랜드 상세 정보 응답
export interface BrandDetailResponse {
  success: boolean;
  data: BrandDetail;
}

// 브랜드 업데이트 응답
export interface BrandUpdateResponse {
  success: boolean;
  message: string;
  data: {
    sellerUuid: string;
    brandName: string;
    brandProfile: string | null;
    brandBanner?: string | null;
  };
}

// ===== SNAP (네일 갤러리) TYPES =====

export interface SnapImage {
  imageUrl: string;
  thumbnailUrl?: string;
  sortOrder: number;
}

export interface SnapCreator {
  userUuid: string;
  name: string;
  nickname?: string;
  avatar?: string;
}

export interface SnapRelatedProduct {
  productUuid: string;
  name: string;
  mainImageUrl: string;
  price: number;
  salePrice?: number;
}

export interface SnapNailCategories {
  style?: string[];
  color?: string[];
  texture?: string[];
  tpo?: string[];
  nation?: string;
}

export interface Snap {
  id: string;
  snapId: string;
  images: SnapImage[];
  imageUrl: string;
  title?: string;
  description?: string;
  creator: SnapCreator;
  tags: string[];
  nailCategories?: SnapNailCategories;
  nailShape?: string;
  nailLength?: string;
  relatedProducts: SnapRelatedProduct[];
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface SnapListResponse {
  success: boolean;
  data: {
    snaps: Snap[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
}

export interface SnapDetailResponse {
  success: boolean;
  data: Snap;
}

export interface SnapCreateRequest {
  title?: string;
  description?: string;
  images: Array<{ imageUrl: string; imageS3Key?: string; thumbnailUrl?: string; sortOrder: number }>;
  tags?: string[];
  nailCategories?: SnapNailCategories;
  nailShape?: string;
  nailLength?: string;
  relatedProducts?: string[];
}

export interface SnapFeedParams {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'popular' | 'trending';
  tag?: string;
  style?: string;
  color?: string;
  texture?: string;
  tpo?: string;
  nation?: string;
  shape?: string;
  length?: string;
  creator?: string;
}

export interface SnapComment {
  id: string;
  snapUuid: string;
  content: string;
  creator: SnapCreator;
  parentCommentUuid?: string;
  likesCount: number;
  replies?: SnapComment[];
  createdAt: string;
}

export interface SnapCommentListResponse {
  success: boolean;
  data: {
    comments: SnapComment[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
}

export interface SnapPopularTagsResponse {
  success: boolean;
  data: Array<{ tag: string; count: number }>;
}

export interface SnapFeedResponse {
  success: boolean;
  data: {
    snaps: Snap[];
    feedType: 'following' | 'trending';
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
}

// ===== SNAP REPORT (스냅 신고) TYPES =====

export type SnapReportReason = 'spam' | 'inappropriate' | 'copyright' | 'harassment' | 'misinformation' | 'other';

export interface SnapReportRequest {
  reason: SnapReportReason;
  description?: string;
}

export interface SnapReportResponse {
  success: boolean;
  data: {
    reportUuid: string;
  };
}

// ===== FOLLOW (팔로우) TYPES =====

export interface FollowUser {
  userUuid: string;
  name: string;
  nickname?: string;
  avatar?: string;
  isFollowing?: boolean;
  followedAt?: string;
}

export interface FollowListResponse {
  success: boolean;
  data: {
    users: FollowUser[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
}

export interface FollowStatusResponse {
  success: boolean;
  data: {
    isFollowing: boolean;
  };
}

export interface FollowCountsResponse {
  success: boolean;
  data: {
    followerCount: number;
    followingCount: number;
  };
}

export interface FollowActionResponse {
  success: boolean;
  data: {
    isFollowing: boolean;
    targetUserUuid: string;
    followerCount: number;
    followingCount: number;
  };
}

export interface UserProfile {
  userUuid: string;
  name: string;
  nickname?: string;
  avatar?: string;
  followerCount: number;
  followingCount: number;
  snapsCount: number;
  isFollowing?: boolean;
}

export interface UserProfileSnapsResponse {
  success: boolean;
  data: {
    profile: UserProfile | null;
    snaps: Snap[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
}

// ===== LIKES (좋아요) TYPES =====

// 좋아요 타겟 타입
export type TargetType = 'product' | 'brand' | 'post' | 'snap';

// 좋아요 응답 (추가/제거 시)
export interface LikeResponse {
  success: boolean;
  data: {
    isLiked: boolean;
    targetType: TargetType;
    targetUuid: string;
    likesCount: number;
  };
  error?: string;
}

// 좋아요 아이템 (목록 조회 시)
export interface LikeItem {
  targetType: TargetType;
  targetUuid: string;
  targetId: string;
  likedAt: string;
  target: {
    name: string;
    mainImageUrl: string;
    price: number;
    salePrice: number;
    brand: string;
  };
}

// 좋아요 목록 응답
export interface LikesListResponse {
  success: boolean;
  data: LikeItem[];
  error?: string;
}

// ============================================
// Category Icons
// ============================================

// 카테고리 타입
export type CategoryType = 'style' | 'color' | 'texture' | 'shape' | 'length' | 'tpo' | 'nation';

// 카테고리 아이템
export interface CategoryItem {
  name: string;           // 표시 이름 (한글) ex: "심플"
  value: string;          // 영문 값 (데이터 비교용, 소문자) ex: "simple"
  iconUrl?: string;       // 아이콘 이미지 URL
  hexColor?: string;      // 색상 코드 (color 타입만, #RRGGBB 형식)
}

// 카테고리 아이콘 응답 데이터
export interface CategoryIconsData {
  types: CategoryType[];                          // 카테고리 타입 목록 (순서 고정)
  categories: Record<CategoryType, CategoryItem[]>; // 타입별로 그룹화된 카테고리
}

// 카테고리 아이콘 API 응답
export interface CategoryIconsResponse {
  success: boolean;
  data: CategoryIconsData;
  error?: string;
}

// ====================
// Admin Category Types
// ====================

// 어드민용 카테고리 상세 정보
export interface AdminCategory {
  _id: string;
  categoryId: string;
  categoryUuid: string;
  type: CategoryType;
  name: string;
  value: string;
  iconUrl?: string;
  iconS3Key?: string;
  hexColor?: string;
  description?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// 카테고리 목록 응답
export interface AdminCategoryListResponse {
  success: boolean;
  categories: AdminCategory[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCategories: number;
  };
}

// 카테고리 생성 요청
export interface CreateCategoryRequest {
  type: CategoryType;
  name: string;
  value: string;
  iconUrl?: string;
  hexColor?: string;
  description?: string;
}

// 카테고리 수정 요청
export interface UpdateCategoryRequest {
  name?: string;
  value?: string;
  iconUrl?: string;
  hexColor?: string;
  description?: string;
  isActive?: boolean;
}

// 카테고리 생성/수정 응답
export interface AdminCategoryResponse {
  success: boolean;
  message?: string;
  category?: AdminCategory;
  error?: string;
}

// 카테고리 삭제 응답
export interface DeleteCategoryResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

// 공개 카테고리 목록 조회 (사용자용) - CategoryItem은 line 1500에 이미 정의됨
export interface CategoryData {
  types: string[];
  categories: {
    [key: string]: CategoryItem[];
  };
}

export interface CategoryResponse {
  success: boolean;
  data: CategoryData;
}

// ====================
// Admin Banner Types
// ====================

// 어드민용 배너 상세 정보
export interface BannerDetailImage {
  imageUrl: string;
  imageS3Key?: string;
  displayOrder: number;
}

export interface AdminBanner {
  _id: string;
  bannerId: string;
  bannerUuid: string;
  title: string;
  description?: string;
  imageUrl: string;
  imageS3Key?: string;
  redirectUrl?: string;
  brands?: Array<{
    _id: string;
    name: string;
    brandUuid: string;
  }>;
  categories?: Array<{
    _id: string;
    name: string;
    value: string;
    type: string;
  }>;
  detailImages?: BannerDetailImage[];
  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  viewCount: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

// 배너 목록 응답
export interface AdminBannerListResponse {
  success: boolean;
  eventBanners: AdminBanner[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalEventBanners: number;
  };
}

// 배너 생성 요청
export interface CreateBannerRequest {
  title: string;
  description?: string;
  imageUrl: string;
  redirectUrl?: string;
  brands?: string[];
  categories?: string[];
  displayOrder?: number;
  startDate?: string;
  endDate?: string;
  detailImages?: Array<{ imageUrl: string; imageS3Key?: string; displayOrder: number }>;
}

// 배너 수정 요청
export interface UpdateBannerRequest {
  title?: string;
  description?: string;
  imageUrl?: string;
  redirectUrl?: string;
  brands?: string[];
  categories?: string[];
  displayOrder?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  detailImages?: Array<{ imageUrl: string; imageS3Key?: string; displayOrder: number }>;
}

// 배너 생성/수정 응답
export interface AdminBannerResponse {
  success: boolean;
  message?: string;
  eventBanner?: AdminBanner;
  error?: string;
}

// 배너 삭제 응답
export interface DeleteBannerResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ====================
// Public Event Banner Types
// ====================

// 브랜드 정보 (배너에서 참조)
export interface BannerBrandInfo {
  _id: string;
  name: string;
  brandUuid: string;
}

// 카테고리 정보 (배너에서 참조)
export interface BannerCategoryInfo {
  _id: string;
  name: string;
  value: string;
  type: string;
}

// 공개용 이벤트 배너 (서버 API 응답 구조와 일치)
export interface EventBanner {
  _id: string;
  bannerId: string;
  bannerUuid: string;
  title: string;
  description?: string;
  imageUrl: string;
  imageS3Key?: string;
  redirectUrl?: string;
  brands?: BannerBrandInfo[];
  categories?: BannerCategoryInfo[];
  detailImages?: BannerDetailImage[];
  isActive: boolean;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
  viewCount: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

// 공개용 이벤트 배너 목록 응답 (서버 API 응답 구조와 일치)
export interface EventBannerListResponse {
  success: boolean;
  eventBanners: EventBanner[];
}

export interface EventBannerDetailResponse {
  success: boolean;
  eventBanner: EventBanner;
  error?: string;
}

// ==========================================
// Checkout & Payment Types (백엔드 스펙 준수)
// ==========================================

// 체크아웃 세션 타입
export interface CheckoutSession {
  sessionId: string;
  orderType: 'standard' | 'custom';  // standard: 장바구니 기반, custom: 견적서 기반
  status?: 'initialized' | 'validated';
  // 서버 utils/checkoutHelper.ts 의 CheckoutTotals 와 동일
  totals: {
    subtotal: number;
    shippingCost: number;
    tax: number;
    discount: number;
    couponDiscount: number;
    pointsDiscount: number;
    finalTotal: number;
    grandTotal: number;
    itemCount: number;
  };
  productionInfo: {
    estimatedProductionTime: number;
    earliestDeliveryDate: string;
    productionSchedule: Array<{
      sellerId: string;
      sellerName?: string;
      itemCount: number;
      estimatedCompletionDate: string;
      processingDays: number;
    }>;
    totalCapacityRequired: number;
  };
  shippingEstimate?: {
    estimatedCost: number;
    basedOnRegion: string;
    note?: string;
    willBeRecalculatedDuring?: string;
    regionOptions?: Array<{
      region: string;
      label: string;
    }>;
  };
  expiresAt: string;
  estimatedDeliveryDateRange: {
    earliest: string;
    latest: string;
  };
  items: Array<{
    product: Product;
    quantity: number;
    price: number;
    options?: Record<string, string>;
    subtotal: number;
  }>;
  shippingAddress?: ShippingAddress;
}

// 결제 준비 결과 타입
export interface PaymentPrepareResult {
  paymentUrl: string;
  mobilePaymentUrl: string;
  orderId: string;
  transactionId: string;
  payMethod: string;
  amount: number;
  createdAt: string;
}

// 결제 수단 타입
/** 서버 types/PaymentTypes.ts 의 PaymentMethod enum과 일치 */
export type PayMethod =
  | 'KAKAO_PAY'
  | 'NAVER_PAY'
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'TOSS_PAY'
  | 'TOSS_PAYMENTS';

// ============================================
// Daum Postcode API 관련 타입 정의
// ============================================

// Daum Postcode API 응답 데이터 타입
export interface DaumPostcodeData {
  zonecode: string;              // 새 우편번호 (5자리)
  address: string;               // 기본 주소 (도로명 또는 지번)
  roadAddress: string;           // 도로명 주소
  jibunAddress: string;          // 지번 주소
  autoRoadAddress?: string;      // 자동 입력될 도로명 주소
  autoJibunAddress?: string;     // 자동 입력될 지번 주소
  addressType: 'R' | 'J';        // 기본 주소 타입 (R: 도로명, J: 지번)
  userSelectedType: 'R' | 'J';   // 사용자가 선택한 주소 타입
  buildingName: string;          // 건물명
  buildingCode: string;          // 건물 관리 번호
  apartment: 'Y' | 'N';          // 아파트 여부
  sido: string;                  // 도/시 (예: "경기")
  sigungu: string;               // 시/군/구 (예: "성남시 분당구")
  sigunguCode: string;           // 시/군/구 코드
  bname: string;                 // 법정동/법정리명 (예: "백현동")
  bcode: string;                 // 법정동/법정리 코드
  roadname: string;              // 도로명
  roadnameCode: string;          // 도로명 코드
  query: string;                 // 검색어
}

// Daum Postcode 옵션 타입
export interface DaumPostcodeOptions {
  oncomplete?: (data: DaumPostcodeData) => void;  // 주소 선택 완료 시 콜백
  onclose?: () => void;                           // 창 닫기 콜백
  onresize?: (size: { width: number; height: number }) => void;  // 크기 변경 콜백
  width?: string | number;                        // 너비
  height?: string | number;                       // 높이
  animation?: boolean;                            // 애니메이션 사용 여부
  focusInput?: boolean;                           // 입력 필드 자동 포커스
  focusContent?: boolean;                         // 컨텐츠 자동 포커스
  autoMapping?: boolean;                          // 주소 자동 매핑
  shorthand?: boolean;                            // 간략 주소 사용
  pleaseReadGuide?: number;                       // 가이드 팝업 노출 주기 (일)
  pleaseReadGuideTimer?: number;                  // 가이드 팝업 자동 닫힘 시간 (ms)
  maxSuggestItems?: number;                       // 검색 결과 최대 개수
  showMoreHName?: boolean;                        // 지번 상세 주소 노출
  hideMapBtn?: boolean;                           // 지도 버튼 숨김
  hideEngBtn?: boolean;                           // 영문 주소 버튼 숨김
  alwaysShowEngAddr?: boolean;                    // 영문 주소 항상 노출
  zonecodeOnly?: boolean;                         // 우편번호만 검색
  theme?: {                                       // 테마 설정
    bgColor?: string;
    searchBgColor?: string;
    contentBgColor?: string;
    pageBgColor?: string;
    textColor?: string;
    queryTextColor?: string;
    postcodeTextColor?: string;
    emphTextColor?: string;
    outlineColor?: string;
  };
}

// Daum Postcode 서비스 인터페이스
export interface DaumPostcode {
  new (options: DaumPostcodeOptions): DaumPostcodeInstance;
}

export interface DaumPostcodeInstance {
  open(options?: { popupKey?: string; autoClose?: boolean }): void;  // 팝업으로 열기
  embed(element: HTMLElement | null, options?: { autoClose?: boolean; q?: string }): void;  // 임베드(레이어) 방식
}

// 커스텀 주문서 관련 타입
export interface CustomOrderRequest {
  id: string;                    // 주문서 UUID
  customerName: string;          // 고객명
  customerEmail?: string;        // 고객 이메일
  requestedDesign?: string;      // 요청 디자인 설명
  nailShape?: NailShape;         // 요청 네일 쉐입
  nailLength?: NailLength;       // 요청 네일 길이
  attachments?: string[];        // 첨부 이미지 URL 목록
  status: 'pending' | 'quoted' | 'approved' | 'in_production' | 'completed' | 'rejected' | 'cancelled';
  createdAt: string;             // 생성일시
  updatedAt?: string;            // 수정일시
  isRegisteredAsProduct?: boolean; // 이미 상품으로 등록됐는지 여부
}

// 커스텀 주문서 상세 (판매자 조회용) - specifications 포함
export type CustomOrderVisibility = 'public' | 'private';
export type CustomOrderStatus = 'pending' | 'quoted' | 'approved' | 'in_production' | 'completed' | 'rejected' | 'cancelled';

export interface CustomOrderDetail {
  id: string;                    // 주문서 UUID (레거시)
  requestUuid: string;           // 주문서 UUID (백엔드 실제 필드명)
  userUuid: string;              // 주문 고객 UUID
  sellerUuid?: string;           // 판매자 UUID (공개 주문은 없을 수 있음)
  brandName?: string;            // 브랜드명
  visibility: CustomOrderVisibility;
  title: string;                 // 주문서 제목
  baseProductUuid?: string;      // 기반 상품 UUID
  baseProductType?: 'original' | 'custom';
  status: CustomOrderStatus;
  specifications: {
    shape: NailShape;
    length: NailLength;
    sizes: {
      left: {
        thumb: string;
        index: string;
        middle: string;
        ring: string;
        pinky: string;
      };
      right: {
        thumb: string;
        index: string;
        middle: string;
        ring: string;
        pinky: string;
      };
    };
    desiredColor?: string;
    desiredDate?: string;
    designNotes?: string;
    referenceImages?: string[];
  };
  quotesCount?: number;          // 받은 견적 수
  quotes?: QuoteDetail[];        // 견적 목록
  createdAt: string;
  updatedAt?: string;
}

// 주문서 기반 상품 프리필 응답
export interface PrefillProductResponse {
  name: string;
  description: string;
  shortDescription?: string;
  brand?: string;
  price: number;
  processingDays: number;
  mainImageUrl?: string;
  detailImages?: Array<{ url: string; description?: string; order: number }>;
  nailShape: NailShape;
  nailLength: NailLength;
  nailCategories?: NailCategories;
  customOrderRequestUuid: string;
}
// window 객체에 daum.Postcode 타입 추가
declare global {
  interface Window {
    daum?: {
      Postcode: DaumPostcode;
    };
  }
}

// 커스텀 주문서 생성 요청
export interface CreateCustomOrderRequest {
  sellerUuid?: string;           // optional: 없으면 공개 주문
  baseProductUuid?: string;
  baseProductType?: 'original' | 'custom';
  title: string;
  specifications: {
    shape: NailShape;
    length: NailLength;
    sizes: {
      left: { thumb: string; index: string; middle: string; ring: string; pinky: string };
      right: { thumb: string; index: string; middle: string; ring: string; pinky: string };
    };
    quantity?: number;     // 세트 수 (기본 1). 견적 price는 수량 포함 총액
    desiredColor?: string;
    desiredDate?: string;  // ISO 문자열: "2025-12-25"
    designNotes?: string;
    referenceImages?: string[];
  };
}

// 커스텀 주문서 생성 응답
export interface CreateCustomOrderResponse {
  requestUuid: string;
  userUuid: string;
  sellerUuid?: string;
  brandName?: string;
  visibility: CustomOrderVisibility;
  title: string;
  specifications: CreateCustomOrderRequest['specifications'];
  status: CustomOrderStatus;
  createdAt: string;
}

// 커스텀 주문서 수정 요청
export interface UpdateCustomOrderRequest {
  title?: string;
  specifications?: Partial<CreateCustomOrderRequest['specifications']>;
}

// 커스텀 주문서 목록 응답
export interface CustomOrderListResponse {
  success: boolean;
  data: {
    orders: CustomOrderDetail[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// 견적 상세
export interface QuoteDetail {
  quoteUuid: string;
  customRequestUuid: string;
  sellerUuid: string;
  brandName?: string;
  price: number;
  processingDays: number;
  sellerNotes?: string;
  quotationImages?: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt?: string;
  issuedAt: string;
  respondedAt?: string;
  createdAt: string;
}

// 주문서별 견적 목록 응답
export interface CustomOrderQuotesResponse {
  success: boolean;
  data: {
    quotes: QuoteDetail[];
    total: number;
  };
}

// 판매자용 공개 주문서 (추가 메타 포함)
export interface PublicCustomOrder extends CustomOrderDetail {
  buyerNickname: string;
  myQuoteStatus: string | null;
  myQuoteUuid: string | null;
}

// 판매자용 공개 주문서 목록 응답
export interface PublicCustomOrderListResponse {
  success: boolean;
  data: {
    orders: PublicCustomOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// ===== Q&A (상품 문의) =====

export interface ProductQuestion {
  questionUuid: string;
  productUuid: string;
  productName?: string;
  sellerUuid: string;
  userUuid: string;
  userName: string;
  content: string;
  isSecret: boolean;
  status: 'pending' | 'answered' | 'deleted';
  answer?: {
    content: string;
    answeredAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface QuestionsResponse {
  success: boolean;
  data: {
    questions: ProductQuestion[];
    pagination: PaginationInfo;
  };
}

export interface CreateQuestionRequest {
  content: string;
  isSecret?: boolean;
}

export interface UpdateQuestionRequest {
  content?: string;
  isSecret?: boolean;
}

// Decoration Types
export interface DecorationAsset {
  decorationAssetUuid: string;
  assetType: 'part' | 'sticker';
  name: Record<string, string>;
  description?: Record<string, string>;
  category: string;
  tags: { themes: string[] };
  sortOrder: number;
  assets: {
    modelUrl?: string;
    previewUrl: string;
    svgPath?: string;
    viewBox?: string;
  };
  allowedColors: Array<{ color: [number, number, number] }>;
  allowedMaterials: Array<{
    id: string;
    metalness: number;
    roughness: number;
    clearcoat: number;
  }>;
  defaultColor?: string;
  strokeColor?: string;
  accessTier: 'free' | 'paid' | 'pro_only';
  ownerType: 'system' | 'user';
  ownerUserUuid?: string;
  packUuid?: string;
  status: 'active' | 'inactive' | 'pending_review' | 'rejected';
  isDeleted: boolean;
  stats: { usageCount: number; downloadCount: number; favoriteCount: number };
  fileSize?: number;
  fileHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecorationCategory {
  decorationCategoryUuid: string;
  slug: string;
  name: Record<string, string>;
  assetType: 'part' | 'sticker' | 'all';
  sortOrder: number;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DecorationCatalogResponse {
  categories: DecorationCategory[];
  items: DecorationAsset[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// ===== Announcement (공지사항) =====

export interface LocalizedField {
  ko: string;
  en: string;
  ja: string;
}

export type AnnouncementCategory = 'notice' | 'event' | 'update';
export type AnnouncementTarget = 'all' | 'design-tool' | 'platform';
export type AnnouncementStatus = 'draft' | 'published' | 'archived';

export interface Announcement {
  announcementId: string;
  announcementUuid: string;
  title: LocalizedField;
  summary: LocalizedField;
  content: LocalizedField;
  thumbnailUrl?: string;
  thumbnailS3Key?: string;
  contentImages?: { imageUrl: string; imageS3Key?: string; displayOrder: number }[];
  category: AnnouncementCategory;
  target: AnnouncementTarget;
  status: AnnouncementStatus;
  isPinned: boolean;
  isPopup: boolean;
  isBanner: boolean;
  bannerOrder: number;
  displayOrder: number;
  publishedAt?: string;
  expiresAt?: string;
  author?: any;
  authorUuid?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementListResponse {
  success: boolean;
  announcements: Announcement[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AnnouncementDetailResponse {
  success: boolean;
  announcement: Announcement;
}

// ============================================
// 반품·교환 (RMA) 관련 타입
// ============================================

export type ReturnRequestType = 'return' | 'exchange';

export type ReturnRequestStatus =
  | 'requested'   // 접수
  | 'approved'    // 승인 (교환)
  | 'rejected'    // 반려
  | 'completed'   // 완료 (반품 환불 완료 / 교환 완료)
  | 'withdrawn';  // 구매자 철회

export interface ReturnRequestStatusHistory {
  status: ReturnRequestStatus | string;
  date: string;
  note?: string;
}

// 서버 routes/returns.ts의 ReturnRequest 응답 형태
export interface ReturnRequest {
  returnRequestUuid: string;
  orderUuid: string;
  orderNumber: string;
  buyerUuid?: string;
  sellerUuid?: string;
  type: ReturnRequestType;
  reason: string;
  detail?: string;
  imageUrls?: string[];
  status: ReturnRequestStatus;
  rejectReason?: string;
  refund?: {
    required?: boolean;
    processedAt?: string;
  };
  requestedAt?: string;
  processedAt?: string;
  completedAt?: string;
  statusHistory?: ReturnRequestStatusHistory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReturnRequestPayload {
  orderUuid: string;
  type: ReturnRequestType;
  reason: string;         // 2-200자 필수
  detail?: string;        // 최대 2000자
  imageUrls?: string[];   // 최대 10개 URI
}

export interface ReturnRequestPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// GET /api/returns/my, GET /api/returns/seller 응답
export interface ReturnRequestListResponse {
  success: boolean;
  data: {
    requests: ReturnRequest[];
    pagination: ReturnRequestPagination;
  };
}
