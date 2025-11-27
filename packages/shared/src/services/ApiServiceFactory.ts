// 모든 서비스 import
import { BaseAuthService, AuthServiceFactory } from './auth/AuthService';
import { BaseProductService, ProductServiceFactory } from './product/ProductService';
import { BaseReviewService, ReviewServiceFactory } from './product/ReviewService';
import { BaseCartService, CartServiceFactory } from './commerce/CartService';
import { BaseOrderService, OrderServiceFactory } from './commerce/OrderService';
import { BasePaymentService, PaymentServiceFactory } from './commerce/PaymentService';
import { BaseSellerService, SellerServiceFactory } from './seller/SellerService';
import { BaseSellerApplicationService, SellerApplicationServiceFactory } from './seller/SellerApplicationService';
import { BaseProductionService, ProductionServiceFactory } from './seller/ProductionService';
import { BaseAdminService, AdminServiceFactory } from './admin/AdminService';
import { BaseLoyaltyService, LoyaltyServiceFactory } from './loyalty/LoyaltyService';
import { BaseImageService, ImageServiceFactory } from './utils/ImageService';
import { BaseShippingService, ShippingServiceFactory } from './utils/ShippingService';
import { BaseQRService, QRServiceFactory } from './utils/QRService';
import { BaseAddressService, AddressServiceFactory } from './utils/AddressService';
import { BaseBrandService, createBrandService } from './brand/BrandService';
import { BaseUserService, UserServiceFactory } from './user/UserService';
import { BaseLikesService, LikesServiceFactory } from './likes/LikesService';
import { BaseCategoryService, CategoryServiceFactory } from './category/CategoryService';
import { BaseBannerService, BannerServiceFactory } from './banner/BannerService';
import { BaseChatService, getChatService } from './chat';

// 통합 API 서비스 인터페이스
export interface IntegratedApiService {
  // 각 서비스 인스턴스
  auth: BaseAuthService;
  product: BaseProductService;
  review: BaseReviewService;
  cart: BaseCartService;
  order: BaseOrderService;
  payment: BasePaymentService;
  seller: BaseSellerService;
  sellerApplication: BaseSellerApplicationService;
  production: BaseProductionService;
  admin: BaseAdminService;
  loyalty: BaseLoyaltyService;
  image: BaseImageService;
  shipping: BaseShippingService;
  qr: BaseQRService;
  address: BaseAddressService;
  brand: BaseBrandService;
  user: BaseUserService;
  likes: BaseLikesService;
  category: BaseCategoryService;
  banner: BaseBannerService;
  chat: BaseChatService;

  // 환경 정보 메서드
  getEnvironmentInfo(): {
    platform: string;
    baseURL: string;
    services: string[];
  };
}

// 추상 통합 API 서비스 클래스
export abstract class BaseIntegratedApiService implements IntegratedApiService {
  public auth: BaseAuthService;
  public product: BaseProductService;
  public review: BaseReviewService;
  public cart: BaseCartService;
  public order: BaseOrderService;
  public payment: BasePaymentService;
  public seller: BaseSellerService;
  public sellerApplication: BaseSellerApplicationService;
  public production: BaseProductionService;
  public admin: BaseAdminService;
  public loyalty: BaseLoyaltyService;
  public image: BaseImageService;
  public shipping: BaseShippingService;
  public qr: BaseQRService;
  public address: BaseAddressService;
  public brand: BaseBrandService;
  public user: BaseUserService;
  public likes: BaseLikesService;
  public category: BaseCategoryService;
  public banner: BaseBannerService;
  public chat: BaseChatService;

  protected baseURL: string;
  protected platform: string;

  protected onTokenExpired?: () => void;

  constructor(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>,
    platform: string,
    onTokenExpired?: () => void
  ) {
    this.baseURL = baseURL;
    this.platform = platform;
    this.onTokenExpired = onTokenExpired;

    // 모든 서비스 인스턴스 생성
    this.auth = AuthServiceFactory.create(baseURL, getAuthHeaders, onTokenExpired);
    this.product = ProductServiceFactory.create(baseURL, getAuthHeaders);
    this.review = ReviewServiceFactory.create(baseURL, getAuthHeaders);
    this.cart = CartServiceFactory.create(baseURL, getAuthHeaders);
    this.order = OrderServiceFactory.create(baseURL, getAuthHeaders);
    this.payment = PaymentServiceFactory.create(baseURL, getAuthHeaders);
    this.seller = SellerServiceFactory.create(baseURL, getAuthHeaders);
    this.sellerApplication = SellerApplicationServiceFactory.create(baseURL, getAuthHeaders);
    this.production = ProductionServiceFactory.create(baseURL, getAuthHeaders);
    this.admin = AdminServiceFactory.create(baseURL, getAuthHeaders);
    this.loyalty = LoyaltyServiceFactory.create(baseURL, getAuthHeaders);
    this.image = ImageServiceFactory.create(baseURL, getAuthHeaders);
    this.shipping = ShippingServiceFactory.create(baseURL, getAuthHeaders);
    this.qr = QRServiceFactory.create(baseURL, getAuthHeaders);
    this.address = AddressServiceFactory.create(baseURL, getAuthHeaders);
    this.brand = createBrandService(baseURL, getAuthHeaders, platform as 'web' | 'mobile');
    this.user = UserServiceFactory.create(baseURL, getAuthHeaders);
    this.likes = LikesServiceFactory.create(baseURL, getAuthHeaders);
    this.category = CategoryServiceFactory.create(baseURL, getAuthHeaders);
    this.banner = BannerServiceFactory.create(baseURL, getAuthHeaders);
    this.chat = getChatService();
  }

  getEnvironmentInfo() {
    return {
      platform: this.platform,
      baseURL: this.baseURL,
      services: [
        'auth',
        'product',
        'review',
        'cart',
        'order',
        'payment',
        'seller',
        'sellerApplication',
        'production',
        'admin',
        'loyalty',
        'image',
        'shipping',
        'qr',
        'address',
        'brand',
        'user',
        'likes',
        'category',
        'banner',
        'chat'
      ],
    };
  }
}

// API 서비스 팩토리
export class ApiServiceFactory {
  static create(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>,
    platform: string,
    onTokenExpired?: () => void
  ): IntegratedApiService {
    return new (class extends BaseIntegratedApiService {})(
      baseURL,
      getAuthHeaders,
      platform,
      onTokenExpired
    );
  }
}

// 편의 함수들
export const createApiService = (
  baseURL: string,
  getAuthHeaders: () => Promise<Record<string, string>>,
  platform: string = 'web',
  onTokenExpired?: () => void
): IntegratedApiService => {
  return ApiServiceFactory.create(baseURL, getAuthHeaders, platform, onTokenExpired);
};

// 개별 서비스 생성 함수들
export const createAuthService = (
  baseURL: string,
  getAuthHeaders: () => Promise<Record<string, string>>
): BaseAuthService => {
  return AuthServiceFactory.create(baseURL, getAuthHeaders);
};

export const createProductService = (
  baseURL: string,
  getAuthHeaders: () => Promise<Record<string, string>>
): BaseProductService => {
  return ProductServiceFactory.create(baseURL, getAuthHeaders);
};

export const createCartService = (
  baseURL: string,
  getAuthHeaders: () => Promise<Record<string, string>>
): BaseCartService => {
  return CartServiceFactory.create(baseURL, getAuthHeaders);
};

export const createOrderService = (
  baseURL: string,
  getAuthHeaders: () => Promise<Record<string, string>>
): BaseOrderService => {
  return OrderServiceFactory.create(baseURL, getAuthHeaders);
};

export const createSellerService = (
  baseURL: string,
  getAuthHeaders: () => Promise<Record<string, string>>
): BaseSellerService => {
  return SellerServiceFactory.create(baseURL, getAuthHeaders);
};

export const createBrandServiceFactory = (
  baseURL: string,
  getAuthHeaders: () => Promise<Record<string, string>>,
  platform: 'web' | 'mobile' = 'web'
): BaseBrandService => {
  return createBrandService(baseURL, getAuthHeaders, platform);
};

// 타입 내보내기
export type {
  BaseAuthService,
  BaseProductService,
  BaseReviewService,
  BaseCartService,
  BaseOrderService,
  BasePaymentService,
  BaseSellerService,
  BaseSellerApplicationService,
  BaseAdminService,
  BaseLoyaltyService,
  BaseImageService,
  BaseShippingService,
  BaseQRService,
  BaseAddressService,
  BaseBrandService,
  BaseUserService,
  BaseLikesService,
};