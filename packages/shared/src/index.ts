// Types
export * from './types';

// Utils
export * from './utils/tokenUtils';
export * from './utils/apiHelpers';
export * from './utils/imageUpload';
export * from './utils/oauthService';
export * from './utils/apiTesting';
export * from './utils/errorMessages';
export * from './utils/uuidUtils';


// New Structured Services
export * from './services/ApiServiceFactory';
export * from './services/base/BaseApiService';

// Auth Services
export * from './services/auth/AuthService';

// Product Services
export * from './services/product/ProductService';
export * from './services/product/ReviewService';

// Commerce Services
export * from './services/commerce/CartService';
export * from './services/commerce/OrderService';
export * from './services/commerce/PaymentService';

// Seller Services
export * from './services/seller/SellerService';

// Admin Services
export * from './services/admin/AdminService';

// Loyalty Services
export * from './services/loyalty/LoyaltyService';

// Utility Services
export * from './services/utils/ImageService';
export * from './services/utils/ShippingService';
export * from './services/utils/QRService';
export * from './services/utils/AlertService';
export * from './services/utils/AlertTypes';

// Config
export * from './config/api';

// Styles
export * from './styles/colors';

// Components
export * from './components/icons';

// Re-export commonly used types
export type {
  User,
  Product,
  Cart,
  CartItem,
  Order,
  ApiResponse,
  WebViewMessage,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  SellerProfile,
  SellerDashboard,
  ShippingAddress,
  Coupon,
  UserCoupon,
  PointTransaction,
  UserPointsInfo,
  QRCodeData,
  QRCodeResponse
} from './types';