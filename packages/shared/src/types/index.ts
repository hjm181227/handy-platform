// API Response Types
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
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

// User Related Types
export interface User {
  id: string;  // UUID format (f47ac10b-58cc-4372-a567-0e02b2c3d479) after migration
  email: string;
  name: string;
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
  stats?: {
    totalOrders: number;
    totalSpent: number;
  };
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
  message: string;
  token: string;
  user: User;
}

// Product Related Types (네일팁 전용 API 스펙에 맞게 완전 재정의)
export interface DetailImage {
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
  style: string[];    // ["신상", "심플", "화려", "클래식", "키치", "내추럴"] 최대 3개
  color: string[];    // ["레드 계열", "핑크 계열", "뉴트럴", "블랙/화이트"] 최대 3개
  texture: string[];  // ["젤", "매트", "글리터"] 최대 3개
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

// 상품 인터페이스 (서버 API 스펙 완전 일치, UUID migration v1.1.0+)
export interface Product {
  id: string;                     // UUID format (e87e4b2c-8f9a-4d3c-b2a1-9e8d7c6b5a43) - primary identifier
  productId?: string;             // Sequential ID ("1", "2", "3"...) - legacy compatibility
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
  seller?: Seller;
  stats: ProductStats;
  socialProof?: SocialProof;
  status: 'active' | 'inactive' | 'outOfStock';  // 추가: 상품 상태
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
}

// 상품 업데이트 요청 인터페이스
export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  productId: string;
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

export interface CartItem {
  productId: string;  // 서버 API 스펙에 맞춰 추가
  product: Product;
  variant?: ProductVariant;
  options?: Record<string, string>;
  selectedOptions?: Record<string, string>;  // 선택된 옵션들
  quantity: number;
  price: number;
  subtotal: number;
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
  userId: string;
  brandName: string;
  representativeName?: string;
  businessNumber: string;
  businessType?: string;
  businessCategory?: string;
  contactEmail: string;
  contactPhone: string;
  status: 'pending' | 'approved' | 'rejected';
  hasVerificationDocuments: boolean;
  documentsCount: number;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  rejectedAt?: string;
  approvedAt?: string;
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

export interface Cart {
  id: string;
  user: string;
  items: CartItem[];
  // 새로운 판매자별 그룹화 정보
  itemsBySeller?: CartItemsBySeller[];
  multiSellerTotals?: MultiSellerTotals;
  summary?: CartSummary;
  // 기존 정보 (하위 호환성)
  totals: CartTotals;
  totalItems: number;             // 총 아이템 수
  totalPrice: number;             // 총 가격
  totalDiscount?: number;         // 총 할인 금액
  shippingCost: number;           // 배송비
  finalPrice: number;             // 최종 가격
  updatedAt: string;
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

export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'bank_transfer'
  | 'cash_on_delivery';

export interface OrderItem {
  product: {
    id: string;                   // UUID format - product identifier
    name: string;
    mainImage: any;               // Updated to match server response type
    brand: string;
    price: number;
    discountedPrice?: number;
  };
  variant?: {
    id: string;
    sku: string;
    priceModifier: number;
  };
  options?: Record<string, string>;
  quantity: number;
  price: number;
  basePrice: number;
  priceModifier: number;
  subtotal: number;
  seller: {
    id: string;                   // UUID format - seller identifier
    name: string;
    companyName: string;
    isVerified: boolean;
  };
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
  shippingAddress: {              // 배송 주소 (필수)
    recipientName: string;        // 받는 분
    phone: string;                // 연락처
    zipCode: string;              // 우편번호
    address: string;              // 주소
    addressDetail?: string;       // 상세주소
    memo?: string;                // 배송메모
  };

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
  | 'API_RESPONSE'
  | 'AUTH_RESPONSE'
  | 'CART_RESPONSE'
  | 'CAMERA_RESPONSE'
  | 'PAYMENT_RESPONSE'
  | 'PERMISSIONS_RESPONSE'
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
  phone?: string;
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
  uploadType: 'product-main' | 'product-detail' | 'review' | 'avatar' | 'category' | 'coupon' | 'qr-code' | 'general';
}

export interface PresignedUrlResponse {
  success: boolean;
  presignedUrl: string;
  imageUrl: string;
  filename: string;
  uploadType: string;
  maxFileSize: string;
  expiresIn: string;
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

// 배송지 관리 타입
// 주문 시 사용하는 배송지 (기존)
export interface ShippingAddress {
  id?: string;                    // 저장된 배송지의 경우 포함
  recipientName: string;
  phone: string;
  address: string;
  addressDetail?: string;
  zipCode: string;
  memo?: string;
  isDefault?: boolean;           // 기본 배송지 여부
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
  weeklyCapacity: number;           // 주간 생산량 (1-500)
  monthlyCapacity: number;          // 월간 생산량 (1-2000, 주별 × 4.3배 이상)
  averageProcessingDays: number;    // 평균 제작 소요일 (1-30)
  isAvailableForOrders: boolean;    // 주문 접수 여부
  vacationMode: boolean;            // 휴가 모드
  vacationStartDate?: string;       // 휴가 시작일 (ISO 날짜)
  vacationEndDate?: string;         // 휴가 종료일 (ISO 날짜)
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
  weeklyCapacity?: number;
  monthlyCapacity?: number;
  averageProcessingDays?: number;
  isAvailableForOrders?: boolean;
  vacationMode?: boolean;
  vacationStartDate?: string;
  vacationEndDate?: string;
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

// 브랜드 상세 정보 (서버 API 스펙)
export interface BrandDetail {
  sellerUuid: string;                    // 판매자 UUID
  brandName: string;                     // 브랜드명
  brandProfile: string | null;           // 브랜드 프로필 이미지 URL
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
  };
}

// ===== SNAP (네일 갤러리) TYPES =====

// 스냅 (네일 아트 갤러리 이미지)
export interface Snap {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  creator: {
    name: string;
    avatar?: string;
  };
  likesCount: number;
  createdAt: string;
  tags?: string[];
  relatedProducts?: string[]; // 연관 상품 ID 목록
}

// ===== LIKES (좋아요) TYPES =====

// 좋아요 타겟 타입
export type TargetType = 'product' | 'brand' | 'post';

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
