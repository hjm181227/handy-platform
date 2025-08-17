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
  url: string;
  filename: string;
  s3Key: string;
  description?: string;
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

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  category: ProductCategory;
  brand: string;
  stock: number;
  sku: string;
  mainImage: ProductImage;
  detailImages: ProductImage[];
  seller: Seller;
  specifications?: ProductSpecifications;
  reviews?: ProductReview[];
  rating: ProductRating;
  featured: boolean;
  isActive: boolean;
  tags?: string[];
  createdAt: string;
}

export type ProductCategory = 
  | 'electronics' 
  | 'clothing' 
  | 'books' 
  | 'home' 
  | 'sports' 
  | 'beauty' 
  | 'toys' 
  | 'food' 
  | 'other';

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: ProductCategory;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  featured?: boolean;
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