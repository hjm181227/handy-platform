// 모든 서비스 import
import { BaseAuthService, AuthServiceFactory } from './auth/AuthService';
import { BaseProductService, ProductServiceFactory } from './product/ProductService';
import { BaseReviewService, ReviewServiceFactory } from './product/ReviewService';
import { BaseCartService, CartServiceFactory } from './commerce/CartService';
import { BaseOrderService, OrderServiceFactory } from './commerce/OrderService';
import { BasePaymentService, PaymentServiceFactory } from './commerce/PaymentService';
import { BaseSellerService, SellerServiceFactory } from './seller/SellerService';
import { BaseLoyaltyService, LoyaltyServiceFactory } from './loyalty/LoyaltyService';
import { BaseImageService, ImageServiceFactory } from './utils/ImageService';
import { BaseShippingService, ShippingServiceFactory } from './utils/ShippingService';
import { BaseQRService, QRServiceFactory } from './utils/QRService';

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
  loyalty: BaseLoyaltyService;
  image: BaseImageService;
  shipping: BaseShippingService;
  qr: BaseQRService;

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
  public loyalty: BaseLoyaltyService;
  public image: BaseImageService;
  public shipping: BaseShippingService;
  public qr: BaseQRService;

  protected baseURL: string;
  protected platform: string;

  constructor(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>,
    platform: string
  ) {
    this.baseURL = baseURL;
    this.platform = platform;

    // 모든 서비스 인스턴스 생성
    this.auth = AuthServiceFactory.create(baseURL, getAuthHeaders);
    this.product = ProductServiceFactory.create(baseURL, getAuthHeaders);
    this.review = ReviewServiceFactory.create(baseURL, getAuthHeaders);
    this.cart = CartServiceFactory.create(baseURL, getAuthHeaders);
    this.order = OrderServiceFactory.create(baseURL, getAuthHeaders);
    this.payment = PaymentServiceFactory.create(baseURL, getAuthHeaders);
    this.seller = SellerServiceFactory.create(baseURL, getAuthHeaders);
    this.loyalty = LoyaltyServiceFactory.create(baseURL, getAuthHeaders);
    this.image = ImageServiceFactory.create(baseURL, getAuthHeaders);
    this.shipping = ShippingServiceFactory.create(baseURL, getAuthHeaders);
    this.qr = QRServiceFactory.create(baseURL, getAuthHeaders);
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
        'loyalty',
        'image',
        'shipping',
        'qr'
      ],
    };
  }
}

// API 서비스 팩토리
export class ApiServiceFactory {
  static create(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>,
    platform: string
  ): IntegratedApiService {
    return new (class extends BaseIntegratedApiService {})(
      baseURL,
      getAuthHeaders,
      platform
    );
  }
}

// 편의 함수들
export const createApiService = (
  baseURL: string,
  getAuthHeaders: () => Promise<Record<string, string>>,
  platform: string = 'web'
): IntegratedApiService => {
  return ApiServiceFactory.create(baseURL, getAuthHeaders, platform);
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

// 타입 내보내기
export type {
  BaseAuthService,
  BaseProductService,
  BaseReviewService,
  BaseCartService,
  BaseOrderService,
  BasePaymentService,
  BaseSellerService,
  BaseLoyaltyService,
  BaseImageService,
  BaseShippingService,
  BaseQRService,
};