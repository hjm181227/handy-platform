// API 환경 설정
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// 환경별 API 설정
export const API_CONFIG: Record<string, ApiConfig> = {
  local: {
    baseURL: 'http://localhost:11000',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  development: {
    baseURL: 'http://15.165.5.64:3001',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  stage: {
    baseURL: 'http://15.165.5.64:3001',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  production: {
    baseURL: 'http://15.165.5.64:3000',
    timeout: 15000,
    retryAttempts: 5,
    retryDelay: 2000,
  },
};

// 현재 환경 감지
export const getCurrentEnvironment = (): string => {
  // 명시적 로컬 환경 설정
  if (typeof process !== 'undefined' && process.env?.API_ENV === 'local') {
    return 'local';
  }
  if (typeof window !== 'undefined' && (window as any).__API_ENV__ === 'local') {
    return 'local';
  }

  // React Native 환경
  if (typeof process !== 'undefined' && process.env?.REACT_NATIVE_ENV) {
    return process.env.REACT_NATIVE_ENV;
  }

  // Vite 환경 (웹) - 전역 변수 사용
  if (typeof window !== 'undefined') {
    // Vite에서 설정한 환경 변수 확인
    const viteMode = (window as any).__VITE_MODE__ || (globalThis as any).__VITE_MODE__;
    if (viteMode) {
      if (viteMode === 'local') return 'local';
      if (viteMode === 'development') return 'development';
      if (viteMode === 'stage') return 'stage';
      if (viteMode === 'production') return 'production';
    }
  }

  // 웹에서 전역 변수 확인
  if (typeof window !== 'undefined') {
    const windowEnv = (window as any).__VITE_ENV__ || (window as any).__APP_ENV__;
    if (windowEnv) return windowEnv;
  }

  // Node.js 환경
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    // 로컬 개발 환경 자동 감지 (localhost 포트 체크)
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      if (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1') {
        return 'local';
      }
    }
    return process.env.NODE_ENV;
  }

  // 웹 환경에서 hostname 기반 자동 감지
  if (typeof window !== 'undefined') {
    const hostname = window.location?.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'local';
    }
  }

  // 기본값
  return 'development';
};

// 웹 환경에서 프록시 사용 여부 감지 (프록시는 사용하지 않음)
export const shouldUseProxy = (): boolean => {
  // 프록시를 사용하지 않고 직접 서버 URL로 연결
  return false;
};

// 현재 환경의 API 설정 가져오기
export const getApiConfig = (): ApiConfig => {
  const env = getCurrentEnvironment();
  const config = API_CONFIG[env] || API_CONFIG.development;
  
  // 항상 실제 서버 URL 사용
  return config;
};

// API Base URL (편의용)
export const API_BASE_URL = getApiConfig().baseURL;

// API 엔드포인트 구성 (서버 스펙에 맞게 확장)
export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile',
    UPDATE_PROFILE: '/api/auth/profile',
    LOGOUT: '/api/auth/logout',
    CHANGE_PASSWORD: '/api/auth/change-password',
    WISHLIST_ADD: (productId: string) => `/api/auth/wishlist/${productId}`,
    WISHLIST_REMOVE: (productId: string) => `/api/auth/wishlist/${productId}`,
  },

  // OAuth
  OAUTH: {
    KAKAO: '/api/auth/oauth/kakao',
    GOOGLE: '/api/auth/oauth/google',
    APPLE: '/api/auth/oauth/apple',
    NAVER: '/api/auth/oauth/naver',
    LINK: (provider: string) => `/api/auth/oauth/link/${provider}`,
    UNLINK: (provider: string) => `/api/auth/oauth/unlink/${provider}`,
    LINKED: '/api/auth/oauth/linked',
  },

  // 상품
  PRODUCTS: {
    LIST: '/api/products',
    DETAIL: (id: string) => `/api/products/${id}`,
    CREATE: '/api/products',
    UPDATE: (id: string) => `/api/products/${id}`,
    DELETE: (id: string) => `/api/products/${id}`,
    CATEGORIES: '/api/products/categories',
    BRANDS: '/api/products/brands',
    FEATURED: '/api/products/featured',
    SEARCH_SUGGESTIONS: '/api/products/search/suggestions',

    // 리뷰
    REVIEWS: (id: string) => `/api/products/${id}/reviews`,
    REVIEW_CREATE: (id: string) => `/api/products/${id}/reviews`,
    REVIEW_UPDATE: (productId: string, reviewId: string) =>
      `/api/products/${productId}/reviews/${reviewId}`,
    REVIEW_DELETE: (productId: string, reviewId: string) =>
      `/api/products/${productId}/reviews/${reviewId}`,
    REVIEW_HELPFUL: (productId: string, reviewId: string) =>
      `/api/products/${productId}/reviews/${reviewId}/helpful`,
    REVIEW_REPORT: (productId: string, reviewId: string) =>
      `/api/products/${productId}/reviews/${reviewId}/report`,
    REVIEW_REPLY: (productId: string, reviewId: string) =>
      `/api/products/${productId}/reviews/${reviewId}/reply`,
  },

  // 장바구니
  CART: {
    GET: '/api/cart',
    ITEMS: '/api/cart/items',
    ITEM: (productId: string) => `/api/cart/items/${productId}`,
    CLEAR: '/api/cart',
    COUNT: '/api/cart/count',
    SYNC: '/api/cart/sync',
  },

  // 주문
  ORDERS: {
    LIST: '/api/orders',
    CREATE: '/api/orders',
    DETAIL: (id: string) => `/api/orders/${id}`,
    CANCEL: (id: string) => `/api/orders/${id}/cancel`,
    TRACK: (id: string) => `/api/orders/${id}/track`,
    REORDER: (id: string) => `/api/orders/${id}/reorder`,
    REVIEW_REMINDER: (id: string) => `/api/orders/${id}/review-reminder`,
  },

  // 배송
  SHIPPING: {
    METHODS: '/api/shipping/methods',
    CALCULATE: '/api/shipping/calculate',
    CARRIERS: '/api/shipping/carriers',
  },

  // 결제
  PAYMENTS: {
    PROCESS: (orderId: string) => `/api/payments/process/${orderId}`,
    STATUS: (transactionId: string) => `/api/payments/status/${transactionId}`,
    REFUND: (orderId: string) => `/api/payments/refund/${orderId}`,
    METHODS: '/api/payments/methods',
  },

  // 쿠폰
  COUPONS: {
    USER_COUPONS: '/api/user/coupons',
    DOWNLOAD: (couponId: string) => `/api/coupons/${couponId}/download`,
    REDEEM: '/api/coupons/redeem',
    AVAILABLE: '/api/coupons/available',
    PUBLIC: '/api/coupons/public',
  },

  // 포인트
  POINTS: {
    BALANCE: '/api/user/points',
    HISTORY: '/api/user/points/history',
    USE: '/api/user/points/use',
    EXPIRING: '/api/user/points/expiring',
    TIER: '/api/user/tier',
    POLICY: '/api/points/policy',
  },

  // 이미지 업로드
  UPLOAD: {
    PRESIGNED_URL: '/api/upload/presigned-url',
    CONFIG: '/api/upload/config',
    METADATA: '/api/upload/metadata',
    METADATA_DETAIL: (imageId: string) => `/api/upload/metadata/${imageId}`,
    TRANSFORM: '/api/upload/transform',
    STATS: '/api/upload/stats',
    DELETE: (imageId: string) => `/api/upload/metadata/${imageId}`,
  },

  // 사용자 리뷰
  USER: {
    REVIEWS: '/api/user/reviews',
  },

  // 관리자
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',

    // 사용자 관리
    USERS: '/api/admin/users',
    USER_STATUS: (id: string) => `/api/admin/users/${id}/status`,

    // 주문 관리
    ORDERS: '/api/admin/orders',
    ORDER_STATUS: (id: string) => `/api/admin/orders/${id}/status`,

    // 상품 관리
    PRODUCTS: '/api/admin/products',
    PRODUCT_STOCK: (id: string) => `/api/admin/products/${id}/stock`,
    PRODUCT_FEATURED: (id: string) => `/api/admin/products/${id}/featured`,

    // 분석
    ANALYTICS_SALES: '/api/admin/analytics/sales',
    ANALYTICS_PRODUCTS: '/api/admin/analytics/products',

    // 쿠폰 관리
    COUPONS: '/api/admin/coupons',
    COUPON_DETAIL: (id: string) => `/api/admin/coupons/${id}`,
    COUPON_CREATE: '/api/admin/coupons',
    COUPON_UPDATE: (id: string) => `/api/admin/coupons/${id}`,
    COUPON_DELETE: (id: string) => `/api/admin/coupons/${id}`,
    COUPON_STATS: '/api/admin/coupons/stats/overview',

    // 이미지 관리
    IMAGE_HEALTH: '/api/upload/health',
    IMAGE_CLEANUP: '/api/upload/cleanup',
    IMAGE_MANUAL_CLEANUP: '/api/upload/manual-cleanup',
    IMAGE_METADATA: '/api/upload/admin/metadata',

    // 판매자 관리
    SELLERS: '/api/admin/sellers',
    SELLER_VERIFY: (id: string) => `/api/admin/sellers/${id}/verify`,
    SELLER_DETAIL: (id: string) => `/api/admin/sellers/${id}`,
  },

  // 판매자 센터
  SELLER: {
    REGISTER: '/api/seller/register',
    PROFILE: '/api/seller/profile',
    UPDATE_PROFILE: '/api/seller/profile',
    DASHBOARD: '/api/seller/dashboard',

    // 상품 관리
    PRODUCTS: '/api/seller/products',
    PRODUCT_CREATE: '/api/seller/products',
    PRODUCT_UPDATE: (id: string) => `/api/seller/products/${id}`,
    PRODUCT_DELETE: (id: string) => `/api/seller/products/${id}`,
    PRODUCT_STOCK: (id: string) => `/api/seller/products/${id}/stock`,
    PRODUCT_STATUS: (id: string) => `/api/seller/products/${id}/status`,
    PRODUCT_ANALYTICS: '/api/seller/products/analytics/overview',

    // 주문 관리
    ORDERS: '/api/seller/orders',
    ORDER_STATUS: (id: string) => `/api/seller/orders/${id}/status`,
    ORDER_ANALYTICS: '/api/seller/orders/analytics/overview',

    // 정산 관리
    SETTLEMENTS: '/api/seller/settlement',
    SETTLEMENT_REQUEST: '/api/seller/settlement/request',
    SETTLEMENT_SUMMARY: '/api/seller/settlement/summary/overview',
    SETTLEMENT_AVAILABLE: '/api/seller/settlement/available/amount',
  },

  // QR 코드
  QR: {
    GENERATE: '/api/qr/generate',
    PROCESS: '/api/qr/process',
  },

  // 사용자 관리 (배송지, 위시리스트 등)
  USER_MANAGEMENT: {
    ADDRESSES: '/api/user/addresses',
    ADDRESS_CREATE: '/api/user/addresses',
    ADDRESS_UPDATE: (id: string) => `/api/user/addresses/${id}`,
    ADDRESS_DELETE: (id: string) => `/api/user/addresses/${id}`,
    ADDRESS_DEFAULT: (id: string) => `/api/user/addresses/${id}/default`,
    WISHLIST: '/api/user/wishlist',
    WISHLIST_ADD: (productId: string) => `/api/user/wishlist/${productId}`,
    WISHLIST_REMOVE: (productId: string) => `/api/user/wishlist/${productId}`,
  },

  // 대량 상품 작업
  BULK_PRODUCTS: {
    OPERATION: '/api/seller/products/bulk',
    STATUS: (operationId: string) => `/api/seller/products/bulk/${operationId}/status`,
  },

  // 리뷰 관리 (판매자용)
  SELLER_REVIEWS: {
    LIST: '/api/seller/reviews',
    REPLY: (reviewId: string) => `/api/seller/reviews/${reviewId}/reply`,
    UPDATE_REPLY: (reviewId: string) => `/api/seller/reviews/${reviewId}/reply`,
    DELETE_REPLY: (reviewId: string) => `/api/seller/reviews/${reviewId}/reply`,
  },

  // 결제 처리 (확장)
  PAYMENT_PROCESSING: {
    INITIALIZE: '/api/payments/initialize',
    CONFIRM: '/api/payments/confirm',
    CANCEL: (paymentId: string) => `/api/payments/${paymentId}/cancel`,
    REFUND_PARTIAL: (paymentId: string) => `/api/payments/${paymentId}/refund/partial`,
    WEBHOOK: '/api/payments/webhook',
  },
};

// 환경별 디버그 설정
export const DEBUG_CONFIG = {
  development: {
    enableApiLogs: true,
    enableNetworkLogs: true,
    enableErrorLogs: true,
  },
  stage: {
    enableApiLogs: true,
    enableNetworkLogs: true,
    enableErrorLogs: true,
  },
  production: {
    enableApiLogs: false,
    enableNetworkLogs: false,
    enableErrorLogs: true,
  },
};

export const getDebugConfig = () => {
  const env = getCurrentEnvironment();
  return DEBUG_CONFIG[env as keyof typeof DEBUG_CONFIG] || DEBUG_CONFIG.development;
};
