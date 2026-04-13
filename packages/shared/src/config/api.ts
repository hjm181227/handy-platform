// API 환경 설정
export interface ApiConfig {
  baseURL: string;
  chatURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// 환경별 API 설정
export const API_CONFIG: Record<string, ApiConfig> = {
  local: {
    baseURL: 'http://localhost:11000',
    chatURL: 'http://localhost:11000',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  development: {
    baseURL: 'http://localhost:11000',
    chatURL: 'http://localhost:11000',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  stage: {
    baseURL: 'https://api.stage-handy.com',
    chatURL: 'https://chat.stage-handy.com',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  production: {
    baseURL: 'https://api.h-andy.com',
    chatURL: 'https://chat.h-andy.com',
    timeout: 15000,
    retryAttempts: 5,
    retryDelay: 2000,
  },
};

// 현재 환경 감지
export const getCurrentEnvironment = (): string => {
  // 1. React Native 환경 체크 (최우선 - 플랫폼 분리)
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    // BuildConfig는 React Native 네이티브 빌드에서만 사용 가능
    // 웹 환경에서는 이 분기에 절대 진입하지 않음

    // BuildConfig 실패 시 process.env 확인
    if (typeof process !== 'undefined' && process.env?.REACT_NATIVE_ENV) {
      console.log('🟢 [API_CONFIG] React Native process.env:', process.env.REACT_NATIVE_ENV);
      return process.env.REACT_NATIVE_ENV;
    }

    // React Native 기본값
    console.log('🟡 [API_CONFIG] React Native detected, using stage as fallback');
    return 'stage';
  }

  // 2. 웹 환경 체크 (window가 있으면 웹)
  if (typeof window !== 'undefined') {
    // 2a. 명시적 로컬 환경 설정
    if ((window as any).__API_ENV__ === 'local') {
      return 'local';
    }

    // 2b. Vercel 배포 환경 - hostname 기반 감지
    const hostname = window.location?.hostname;
    if (hostname) {
      if (hostname.includes('stage-handy.com')) {
        console.log('🟢 [API_CONFIG] Detected staging from hostname:', hostname);
        return 'stage';
      }
      if (hostname.includes('h-andy.com') && !hostname.includes('stage')) {
        console.log('🟢 [API_CONFIG] Detected production from hostname:', hostname);
        return 'production';
      }
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'local';
      }
    }

    // 2c. Vite 빌드 타임 모드
    const viteMode = (window as any).__VITE_MODE__;
    if (viteMode) {
      console.log('🟢 [API_CONFIG] Detected Vite mode:', viteMode);
      return viteMode; // 'local', 'development', 'stage', 'production'
    }
  }

  // 3. Node.js 환경 (서버사이드 렌더링 등)
  if (typeof process !== 'undefined') {
    if (process.env?.API_ENV === 'local') {
      return 'local';
    }
    if (process.env?.NODE_ENV) {
      return process.env.NODE_ENV;
    }
  }

  // 4. 기본값
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

  console.log('🔧 [API_CONFIG] Current environment:', env);
  console.log('🔧 [API_CONFIG] API Base URL:', config.baseURL);

  // 항상 실제 서버 URL 사용
  return config;
};

// API Base URL (편의용) - Vite 환경변수 우선 사용
export const API_BASE_URL =
  (typeof window !== 'undefined' && (globalThis as any).__VITE_API_BASE_URL__) ||
  getApiConfig().baseURL;

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
    UPDATE_TERMS: '/api/auth/terms',
    WISHLIST_ADD: (productId: string) => `/api/auth/wishlist/${productId}`,
    WISHLIST_REMOVE: (productId: string) => `/api/auth/wishlist/${productId}`,
  },

  // 휴대폰 인증
  PHONE: {
    SEND: '/api/auth/phone/send',                               // POST - 인증번호 발송
    VERIFY: '/api/auth/phone/verify',                           // POST - 인증번호 확인
    STATUS: (verificationId: string) => `/api/auth/phone/status/${verificationId}`, // GET - 인증 상태 조회
  },

  // OAuth (경로: /api/auth/oauth/...)
  OAUTH: {
    KAKAO: '/api/auth/oauth/kakao',
    KAKAO_AUTH_DATA: (stateId: string) => `/api/auth/oauth/kakao/auth-data/${stateId}`,  // 카카오 OAuth 인증 데이터 조회 (일회용)
    GOOGLE: '/api/auth/oauth/google',
    GOOGLE_AUTH_DATA: (stateId: string) => `/api/auth/oauth/google/auth-data/${stateId}`,
    APPLE: '/api/auth/oauth/apple',
    APPLE_AUTH_DATA: (stateId: string) => `/api/auth/oauth/apple/auth-data/${stateId}`,
    NAVER: '/api/auth/oauth/naver',
    NAVER_AUTH_DATA: (stateId: string) => `/api/auth/oauth/naver/auth-data/${stateId}`,  // 네이버 OAuth 인증 데이터 조회 (일회용)
    COMPLETE_SIGNUP: '/api/auth/oauth/social/complete-signup',  // 소셜 회원가입 완료 (약관 동의 후)
    SIGNUP: (provider: string) => `/api/auth/oauth/${provider}/signup`,
    LINK: (provider: string) => `/api/auth/oauth/link/${provider}`,
    UNLINK: (provider: string) => `/api/auth/oauth/unlink/${provider}`,
    LINKED: '/api/auth/oauth/linked',
  },

  // 상품 (서버 API 스펙에 완전 일치)
  PRODUCTS: {
    LIST: '/api/products',                                    // GET / - 상품 목록 조회
    DETAIL: (productId: string) => `/api/products/${productId}`,  // GET /:productId - 상품 상세
    SELLER_PRODUCTS: (sellerId: string) => `/api/products/seller/${sellerId}`, // GET /seller/:sellerId
    CREATE: '/api/products',                                 // POST / - 상품 생성 (판매자/관리자)
    UPDATE: (productId: string) => `/api/products/${productId}`,     // PUT /:productId - 상품 수정
    DELETE: (productId: string) => `/api/products/${productId}`,     // DELETE /:productId - 상품 삭제

    // 주문서 기반 프리필 (커스텀 상품 등록용)
    PREFILL: (requestUuid: string) => `/api/products/prefill/${requestUuid}`,  // GET /prefill/:requestUuid

    // 리뷰 시스템
    REVIEWS: (productId: string) => `/api/products/${productId}/reviews`,
    REVIEW_CREATE: (productId: string) => `/api/products/${productId}/reviews`,
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

    // Q&A 시스템
    QUESTIONS: (productUuid: string) => `/api/products/${productUuid}/questions`,
    QUESTION_CREATE: (productUuid: string) => `/api/products/${productUuid}/questions`,
    QUESTION_UPDATE: (questionUuid: string) => `/api/products/questions/${questionUuid}`,
    QUESTION_DELETE: (questionUuid: string) => `/api/products/questions/${questionUuid}`,
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
    SKIP_PAYMENT: (orderUuid: string) => `/api/orders/${orderUuid}/skip-payment`,
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

  // 사용자 정보 및 프로필
  USERS: {
    NAIL_SIZE: '/api/users/me/nail-size',  // GET, PATCH
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

    // 카테고리 관리
    CATEGORIES_LIST: '/api/admin/categories',
    CATEGORIES_CREATE: '/api/admin/categories',
    CATEGORIES_UPDATE: (id: string) => `/api/admin/categories/${id}`,
    CATEGORIES_DELETE: (id: string) => `/api/admin/categories/${id}`,
    CATEGORIES_TOGGLE: (id: string) => `/api/admin/categories/${id}/activate`,

    // 이벤트 배너 관리
    EVENT_BANNERS_LIST: '/api/admin/event-banners',
    EVENT_BANNERS_DETAIL: (id: string) => `/api/admin/event-banners/${id}`,
    EVENT_BANNERS_CREATE: '/api/admin/event-banners',
    EVENT_BANNERS_UPDATE: (id: string) => `/api/admin/event-banners/${id}`,
    EVENT_BANNERS_DELETE: (id: string) => `/api/admin/event-banners/${id}`,
    EVENT_BANNERS_TOGGLE: (id: string) => `/api/admin/event-banners/${id}/activate`,

    // 스냅 관리
    SNAPS_LIST: '/api/admin/snaps',
    SNAPS_STATUS: (snapUuid: string) => `/api/admin/snaps/${snapUuid}/status`,
    SNAPS_DELETE: (snapUuid: string) => `/api/admin/snaps/${snapUuid}`,

    // 스냅 신고 관리
    SNAP_REPORTS: '/api/admin/snaps/reports',
    SNAP_REPORT_STATUS: (reportUuid: string) => `/api/admin/snaps/reports/${reportUuid}`,
  },

  // 판매자 센터 (서버 API 스펙에 완전 일치)
  SELLER: {
    // 판매자 등록 및 프로필
    REGISTER: '/api/seller/register',              // POST /register
    PROFILE: '/api/seller/profile',                // GET /profile
    UPDATE_PROFILE: '/api/seller/profile',         // PUT /profile
    DASHBOARD: '/api/seller/dashboard',            // GET /dashboard
    INFO: (sellerUuid: string) => `/api/seller/info/${sellerUuid}`, // GET /info/:sellerUuid - 판매자 기본 정보
    CURRENT_INFO: '/api/seller/info',              // GET /info - 현재 로그인한 판매자 정보 (생산 설정 포함)
    MY_INFO: '/api/seller/info',                   // GET/PUT /info - 현재 로그인한 판매자 정보 조회/수정

    // 상품 관리 (판매자 전용)
    PRODUCTS: '/api/seller/products',                                    // GET / - 판매자 상품 목록
    PRODUCT_DETAIL: (productId: string) => `/api/seller/products/${productId}`,  // GET /:id
    PRODUCT_STOCK: (productId: string) => `/api/seller/products/${productId}/stock`,     // PATCH /:id/stock
    PRODUCT_STATUS: (productId: string) => `/api/seller/products/${productId}/status`,   // PATCH /:id/status
    PRODUCT_ANALYTICS: '/api/seller/products/analytics/overview',        // GET /analytics/overview

    // 주문 관리 (멀티셀러 지원)
    ORDERS: '/api/seller/orders',                                        // POST / (필터링 데이터 전송)
    ORDER_DETAIL: (orderUuid: string) => `/api/seller/orders/${orderUuid}`,      // GET /:orderUuid
    ORDER_STATUS: (orderUuid: string) => `/api/seller/orders/${orderUuid}/status`, // PATCH /:orderUuid/status
    ORDER_ANALYTICS: '/api/seller/orders/analytics/overview',           // GET /analytics/overview

    // 정산 관리
    SETTLEMENTS: '/api/seller/settlement',                               // GET /
    SETTLEMENT_REQUEST: '/api/seller/settlement/request',                // POST /request
    SETTLEMENT_SUMMARY: '/api/seller/settlement/summary/overview',       // GET /summary/overview
    SETTLEMENT_AVAILABLE: '/api/seller/settlement/available/amount',     // GET /available/amount

    // 생산 관리
    // 참고: 생산 설정은 CURRENT_INFO (/api/seller/info) 엔드포인트를 통해 조회/업데이트합니다
    PRODUCTION_CAPACITY: (year?: number, month?: number) =>
      `/api/seller/production-capacity${year ? `/${year}` : ''}${month ? `/${month}` : ''}`, // GET
    PRODUCTION_CAPACITY_UPDATE: (year: number, month: number) =>
      `/api/seller/production-capacity/${year}/${month}`,               // PUT
    PRODUCTION_HISTORY: '/api/seller/production-history',               // GET
    PRODUCTION_ADD_EXTRA: (year: number, month: number) =>
      `/api/seller/production-capacity/${year}/${month}/add-extra`,     // POST
    PRODUCTION_BOOST: '/api/seller/production-capacity/boost',          // POST

    // 배송 정책 관리
    SHIPPING_POLICY: '/api/seller/shipping',                            // GET/PUT
    SHIPPING_REGIONS: '/api/seller/shipping/regions',                   // PUT
    SHIPPING_TOGGLE: '/api/seller/shipping/toggle',                     // PATCH
    // 커스텀 주문서 관리
    CUSTOM_ORDERS: '/api/seller/custom-orders',                      // GET - 커스텀 주문서 목록
    CUSTOM_ORDERS_PUBLIC: '/api/seller/custom-orders/public',        // GET - 공개 커스텀 주문서 목록
    CUSTOM_ORDER_DETAIL: (requestUuid: string) => `/api/seller/custom-orders/${requestUuid}`, // GET - 커스텀 주문서 상세
    CUSTOM_ORDER_QUOTE: (requestUuid: string) => `/api/seller/custom-orders/${requestUuid}/quote`, // POST/PATCH - 견적서 발급/수정
    CUSTOM_ORDER_COMPLETE: (requestUuid: string) => `/api/seller/custom-orders/${requestUuid}/complete`, // POST - 제작 완료
    CUSTOM_ORDER_SETTING: '/api/seller/custom-order',                 // GET, PATCH - 커스텀 주문 설정 조회/변경

    SHIPPING_PREVIEW: '/api/seller/shipping/preview',                   // POST

    // 쿠폰 관리
    COUPONS: '/api/seller/coupons',                                     // GET, POST - 쿠폰 목록/생성
    COUPON_DETAIL: (couponUuid: string) => `/api/seller/coupons/${couponUuid}`,     // GET, PUT, DELETE - 쿠폰 상세/수정/삭제
    COUPON_STATUS: (couponUuid: string) => `/api/seller/coupons/${couponUuid}/status`, // PATCH - 활성화/비활성화
    COUPON_USAGE: (couponUuid: string) => `/api/seller/coupons/${couponUuid}/usage`,   // GET - 사용 통계

    // Q&A 관리
    PRODUCT_QUESTIONS: '/api/seller/product-questions',                              // GET - Q&A 목록 조회
    PRODUCT_QUESTIONS_STATS: '/api/seller/product-questions/stats',                  // GET - Q&A 통계
    PRODUCT_QUESTION_ANSWER: (questionUuid: string) => `/api/seller/product-questions/${questionUuid}/answer`, // POST, PUT, DELETE - 답변 관리
  },

  // QR 코드
  QR: {
    GENERATE: '/api/qr/generate',
    PROCESS: '/api/qr/process',
  },

  // 브랜드 관리
  BRANDS: {
    LIST: '/api/brands/list',                                                    // POST /list - 브랜드 목록 조회
    DETAIL: (sellerUuid: string) => `/api/brands/${sellerUuid}`,                 // GET /:sellerUuid - 브랜드 상세 정보
    PRODUCTS: (sellerUuid: string) => `/api/brands/${sellerUuid}/products`,      // GET /:sellerUuid/products - 브랜드 상품 목록
    UPDATE_NAME: (sellerUuid: string) => `/api/brands/${sellerUuid}/name`,       // PUT /:sellerUuid/name - 브랜드명 변경
    UPDATE_PROFILE: (sellerUuid: string) => `/api/brands/${sellerUuid}/profile`, // PUT /:sellerUuid/profile - 브랜드 프로필 변경
    UPDATE_BANNER: (sellerUuid: string) => `/api/brands/${sellerUuid}/banner`,   // PUT /:sellerUuid/banner - 브랜드 배너 변경
  },

  // 배송지 관리 (한국 주소 시스템)
  SHIPPING_ADDRESSES: {
    LIST: '/api/shipping-addresses',
    CREATE: '/api/shipping-addresses',
    UPDATE: (index: string) => `/api/shipping-addresses/${index}`,
    DELETE: (index: string) => `/api/shipping-addresses/${index}`,
    SET_DEFAULT: (index: string) => `/api/shipping-addresses/${index}/set-default`,
    VALIDATE: '/api/shipping-addresses/validate',
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
    BULK_CREATE: '/api/seller/products/bulk-create',
    TEMPLATE: '/api/seller/products/bulk-create/template',
  },

  // 리뷰 관리 (판매자용)
  SELLER_REVIEWS: {
    LIST: '/api/seller/reviews',
    REPLY: (reviewId: string) => `/api/seller/reviews/${reviewId}/reply`,
    UPDATE_REPLY: (reviewId: string) => `/api/seller/reviews/${reviewId}/reply`,
    DELETE_REPLY: (reviewId: string) => `/api/seller/reviews/${reviewId}/reply`,
  },

  // 통합 결제 API (단수형 payment)
  PAYMENT: {
    PREPARE: '/api/payment/prepare',
    APPROVE: '/api/payment/approve',
  },

  // 결제 처리 (확장)
  PAYMENT_PROCESSING: {
    INITIALIZE: '/api/payments/initialize',
    CONFIRM: '/api/payments/confirm',
    CANCEL: (paymentId: string) => `/api/payments/${paymentId}/cancel`,
    REFUND_PARTIAL: (paymentId: string) => `/api/payments/${paymentId}/refund/partial`,
    WEBHOOK: '/api/payments/webhook',
  },

  // 좋아요
  LIKES: {
    LIKE: '/api/likes/like',                    // POST - 좋아요 추가
    UNLIKE: '/api/likes/unlike',                // POST - 좋아요 제거
    LIST: '/api/likes',                         // POST - 사용자 좋아요 목록
  },

  // 카테고리 아이콘
  CATEGORIES: {
    ICONS: '/api/categories/icons',             // GET - 카테고리 아이콘 목록 조회 (Public, 24시간 캐시)
  },

  // 이벤트 배너 (Public)
  EVENT_BANNERS: '/api/event-banners',          // GET - 공개 이벤트 배너 목록 조회
  EVENT_BANNER_DETAIL: (id: string) => `/api/event-banners/${id}`, // GET - 공개 이벤트 배너 상세 조회

  // 스냅 (네일 갤러리)
  SNAPS: {
    LIST: '/api/snaps',
    DETAIL: (snapUuid: string) => `/api/snaps/${snapUuid}`,
    CREATE: '/api/snaps',
    UPDATE: (snapUuid: string) => `/api/snaps/${snapUuid}`,
    DELETE: (snapUuid: string) => `/api/snaps/${snapUuid}`,
    USER_SNAPS: (userUuid: string) => `/api/snaps/user/${userUuid}`,
    POPULAR_TAGS: '/api/snaps/tags/popular',
    COMMENTS: (snapUuid: string) => `/api/snaps/${snapUuid}/comments`,
    COMMENT_DELETE: (snapUuid: string, commentUuid: string) => `/api/snaps/${snapUuid}/comments/${commentUuid}`,
    FEED: '/api/snaps/feed',
    REPORT: (snapUuid: string) => `/api/snaps/${snapUuid}/report`,
  },

  // 팔로우
  FOLLOWS: {
    FOLLOW: (userUuid: string) => `/api/follows/${userUuid}`,
    UNFOLLOW: (userUuid: string) => `/api/follows/${userUuid}`,
    FOLLOWERS: (userUuid: string) => `/api/follows/${userUuid}/followers`,
    FOLLOWING: (userUuid: string) => `/api/follows/${userUuid}/following`,
    STATUS: (userUuid: string) => `/api/follows/${userUuid}/status`,
    MY_COUNTS: '/api/follows/me/counts',
  },

  // 커스텀 주문
  CUSTOM_ORDER: {
    CREATE: '/api/custom-orders',               // POST - 커스텀 주문서 생성
    LIST: '/api/custom-orders',                 // GET - 내 커스텀 주문서 목록
    DETAIL: (uuid: string) => `/api/custom-orders/${uuid}`, // GET - 커스텀 주문서 상세 조회
    UPDATE: (uuid: string) => `/api/custom-orders/${uuid}`, // PUT - 커스텀 주문서 수정
    QUOTES: (uuid: string) => `/api/custom-orders/${uuid}/quotes`, // GET - 주문서별 견적 목록
  },

  // 디자인 툴 (RESTful — Phase A)
  DESIGN_TOOL: {
    // 유지되는 legacy 엔드포인트 (신규 가입 플로우 전용)
    PLANS: '/api/design-tool/plans',
    SUBSCRIBE: '/api/design-tool/subscribe',                 // Toss 결제 세션 생성
    BILLING_CONFIRM: '/api/design-tool/billing/confirm',     // 최초 빌링키 발급 + 첫 결제

    // 사용자 본인 구독 관리
    ME: {
      SUBSCRIPTION: '/api/design-tool/me/subscription',
      PAYMENTS: '/api/design-tool/me/subscription/payments',
      CANCEL: '/api/design-tool/me/subscription/cancel',
      CHANGE_PLAN: '/api/design-tool/me/subscription/change-plan',
      BILLING_METHOD: '/api/design-tool/me/subscription/billing-method',
    },

    // 운영자(Admin) 구독 관리
    ADMIN: {
      SUBSCRIPTIONS_LIST: '/api/design-tool/admin/subscriptions',
      USER_SUBSCRIPTION: (userUuid: string) =>
        `/api/design-tool/admin/users/${userUuid}/subscription`,
      USER_PAYMENTS: (userUuid: string) =>
        `/api/design-tool/admin/users/${userUuid}/subscription/payments`,
      USER_CANCEL: (userUuid: string) =>
        `/api/design-tool/admin/users/${userUuid}/subscription/cancel`,
      USER_REFUND: (userUuid: string) =>
        `/api/design-tool/admin/users/${userUuid}/subscription/refund`,
      USER_GRANT: (userUuid: string) =>
        `/api/design-tool/admin/users/${userUuid}/subscription/grant`,
    },
  },

  // 견적서
  QUOTES: {
    DETAIL: (quoteUuid: string) => `/api/quotes/${quoteUuid}`,       // GET - 견적서 상세 조회
    ACCEPT: (quoteUuid: string) => `/api/quotes/${quoteUuid}/accept`, // POST - 견적서 수락
    REJECT: (quoteUuid: string) => `/api/quotes/${quoteUuid}/reject`, // POST - 견적서 거절
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
