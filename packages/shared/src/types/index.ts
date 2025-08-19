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

// Product Related Types
export interface ProductImage {
  id?: string;          // 이미지 고유 ID (DB용)
  url: string;          // 실제 이미지 URL (CDN 포함)
  filename: string;     // 원본 파일명
  description?: string; // 이미지 설명 (ALT 텍스트용)
  sortOrder?: number;   // 이미지 순서
  isMain?: boolean;     // 메인 이미지 여부
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

export interface ProductSpecifications {
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  color?: string;
  material?: string;
  [key: string]: any;
}

export interface Seller {
  id: string;
  name: string;
  sellerInfo: {
    companyName: string;
    isVerified?: boolean;
  };
}

// Nail Category Types
export interface NailCategories {
  style: string[];  // 최대 3개
  color: string[];  // 최대 3개  
  texture: string[]; // 최대 3개
  shape: string;     // 1개만
  length: string;    // 1개만
  tpo: string[];     // 최대 3개
  ab: string;        // 1개만
  nation: string;    // 1개만
}

// 네일 상품 옵션 인터페이스
export interface NailProductOptions {
  lengthCustomizable: boolean;    // 길이 커스텀 가능 여부
  shapeCustomizable: boolean;     // 모양 커스텀 가능 여부
  designCustomizable: boolean;    // 디자인 커스텀 가능 여부
}

// 업로드용 상품 이미지 인터페이스 (프론트엔드 전용)
export interface ProductImageUpload extends ProductImage {
  file?: File;              // 업로드용 파일 객체
  preview?: string;         // 미리보기 URL (로컬)
}

// 배송 정보 인터페이스
export interface ShippingInfo {
  weight?: number;          // 배송 무게
  isFreeShipping: boolean;  // 무료배송 여부
  shippingCost: number;     // 배송비
  processingDays: number;   // 처리 일수 (제작 소요시간)
  estimatedDeliveryDays: number; // 예상 배송일
}

// 재고 관리 인터페이스
export interface InventoryInfo {
  stockQuantity: number;        // 재고 수량
  lowStockThreshold: number;    // 낮은 재고 임계값
  isUnlimitedStock: boolean;    // 무제한 재고 여부
  isInStock: boolean;           // 재고 있음 여부
}

// SEO 메타데이터 인터페이스
export interface SEOMetadata {
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  slug: string;  // URL용 슬러그
}

// 완전한 상품 인터페이스
export interface Product {
  // 기본 정보
  id: string;
  name: string;
  description: string;
  category: string;  // 네일 팁, 젤 네일, 네일 아트 등
  brand: string;
  sku?: string;
  
  // 가격 정보
  price: number;
  originalPrice?: number;      // 원가 (할인 전 가격)
  discountedPrice?: number;    // 할인 적용 가격
  salePercentage?: number;     // 할인율
  cost?: number;               // 원가 (내부용)
  
  // 상태 및 메타
  status: ProductStatus;
  isActive: boolean;
  featured: boolean;
  isNew?: boolean;
  isFeatured?: boolean;        // 추천 상품 여부
  isLimited?: boolean;         // 한정판 여부
  tags?: string[];
  
  // 이미지
  mainImage: ProductImage;
  detailImages: ProductImage[];
  
  // 네일 전용 정보
  nailCategories?: Partial<NailCategories>;
  nailShape?: NailShape;
  nailLength?: NailLength;
  nailOptions?: NailProductOptions;
  
  // 메타데이터 및 스펙
  specifications?: ProductSpecifications;
  
  // 리뷰 및 평점
  reviews?: ProductReview[];
  rating: ProductRating;
  
  // 재고
  stock: number;  // 기존 호환성을 위해 유지
  inventory?: InventoryInfo;
  
  // 배송
  shipping?: ShippingInfo;
  
  // 판매자
  seller: Seller;
  
  // SEO
  seo?: SEOMetadata;
  
  // 시간 정보
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
}


// 네일 모양 및 길이 타입
export type NailShape = 'ROUND' | 'ALMOND' | 'OVAL' | 'STILETTO' | 'SQUARE' | 'COFFIN';
export type NailLength = 'SHORT' | 'MEDIUM' | 'LONG';

// 상품 상태 타입
export type ProductStatus = 'active' | 'inactive' | 'draft' | 'out_of_stock';

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

// 상품 생성 요청 인터페이스 (클라이언트 -> 서버)
export interface CreateProductRequest {
  // 기본 정보
  name: string;
  description: string;
  category: string;  // 네일 팁, 젤 네일, 네일 아트 등
  brand?: string;
  
  // 가격 정보
  price: number;
  originalPrice?: number;
  
  // 상태
  status: ProductStatus;
  
  // 네일 전용 정보
  nailCategories?: Partial<NailCategories>;
  nailShape?: NailShape;
  nailLength?: NailLength;
  nailOptions?: NailProductOptions;
  
  // 재고 정보
  stockQuantity?: number;
  lowStockThreshold?: number;
  isUnlimitedStock?: boolean;
  
  // 배송 정보
  weight?: number;
  isFreeShipping?: boolean;
  shippingCost?: number;
  processingDays: number;  // 제작 소요시간 (필수)
  estimatedDeliveryDays?: number;
  
  // SEO (선택사항)
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  slug?: string;
  
  // 기타
  specifications?: ProductSpecifications;
  tags?: string[];
}

// 상품 업데이트 요청 인터페이스
export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

// 상품 이미지 업로드 요청
export interface ProductImageUploadRequest {
  productId: string;
  files: File[];
  descriptions?: string[];
  isMainImage?: boolean[];
}

// 상품 검색/필터 인터페이스 (확장)
export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;  // 네일 팁, 젤 네일, 네일 아트 등
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'name' | 'price' | 'createdAt' | 'rating' | 'sales';
  sortOrder?: 'asc' | 'desc';
  featured?: boolean;
  status?: ProductStatus;
  
  // 네일 전용 필터
  nailShape?: NailShape;
  nailLength?: NailLength;
  nailCategories?: Partial<NailCategories>;
  
  // 판매자 필터
  sellerId?: string;
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

// Cart Related Types
export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  id: string;
  user: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
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
    images: ProductImage[];
  };
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  createdAt: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  trackingNumber?: string;
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