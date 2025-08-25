// API Response Types
export interface ApiResponse<T = any> {
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
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'seller' | 'admin';
  isActive: boolean;
  address?: Address;
  wishlist?: string[];
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
  id: string;
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

// 상품 인터페이스 (서버 API 스펙 완전 일치)
export interface Product {
  productId: string;              // Sequential ID ("1", "2", "3"...)
  name: string;
  description: string;
  shortDescription: string;
  brand: string;
  sku: string;
  price: number;
  salePrice?: number;
  discountRate?: number;
  discountedPrice: number;
  hasDiscount: boolean;
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
  postsCount: number;
  isFeatured: boolean;
  isNewProduct: boolean;
  tags: string[];
  seller: Seller;
  stats: ProductStats;
  socialProof: SocialProof;
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
    sellerId: string | null;
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
  sellerId?: string;
  search?: string;         // 텍스트 검색 (제품명, 설명, 태그)
  minPrice?: string;       // 최소 가격 필터
  maxPrice?: string;       // 최대 가격 필터
  nailShape?: NailShape;   // 네일 모양 필터
  nailLength?: NailLength; // 네일 길이 필터
  featured?: string;       // "true" for featured products
  sortBy?: 'price' | 'rating' | 'createdAt' | 'likesCount' | 'trending';
  sortOrder?: 'asc' | 'desc';
}

// 판매자별 상품 조회 필터 (ProductFilters에서 sellerId 제외)
export interface SellerProductFilters extends Omit<ProductFilters, 'sellerId'> {}

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
  product: Product;
  variant?: ProductVariant;
  options?: Record<string, string>;
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

export interface Cart {
  id: string;
  user: string;
  items: CartItem[];
  totals: CartTotals;
  updatedAt: string;
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
    id: string;
    name: string;
    mainImage: string;
    brand: string;
    category: string;
    price: number;
    discountedPrice?: number;
  };
  variant?: ProductVariant;
  options?: Record<string, string>;
  quantity: number;
  price: number;
  basePrice: number;
  priceModifier: number;
  subtotal: number;
  seller: {
    id: string;
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

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  items: OrderItem[];
  shipping: ShippingDetails;
  createdAt: string;
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
  | 'PERMISSIONS_RESPONSE';

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
  contentType: string;
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

export interface SellerProfile {
  id: string;
  userId: string;
  companyName: string;
  businessNumber: string;
  representative: string;
  phone: string;
  address: Address;
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  bankAccount: {
    bank: string;
    accountNumber: string;
    accountHolder: string;
  };
  createdAt: string;
  verifiedAt?: string;
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
  sellerId: string;
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
export interface ShippingAddress {
  id: string;
  userId: string;
  name: string;
  recipient: string;
  phone: string;
  address: Address;
  isDefault: boolean;
  createdAt: string;
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
