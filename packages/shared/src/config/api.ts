// API 환경 설정
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// 환경별 API 설정
export const API_CONFIG: Record<string, ApiConfig> = {
  development: {
    baseURL: 'http://localhost:5000',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  production: {
    baseURL: 'http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com',
    timeout: 15000,
    retryAttempts: 5,
    retryDelay: 2000,
  },
};

// 현재 환경 감지
export const getCurrentEnvironment = (): string => {
  // React Native 환경
  if (typeof process !== 'undefined' && process.env?.REACT_NATIVE_ENV) {
    return process.env.REACT_NATIVE_ENV;
  }
  
  // Vite 환경 (웹)
  if (typeof window !== 'undefined' && (window as any).__VITE_ENV__) {
    return (window as any).__VITE_ENV__;
  }
  
  // Node.js 환경
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  
  // 기본값
  return 'development';
};

// 현재 환경의 API 설정 가져오기
export const getApiConfig = (): ApiConfig => {
  const env = getCurrentEnvironment();
  return API_CONFIG[env] || API_CONFIG.development;
};

// API 엔드포인트 구성
export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile',
    LOGOUT: '/api/auth/logout',
    CHANGE_PASSWORD: '/api/auth/change-password',
    WISHLIST: '/api/auth/wishlist',
  },
  
  // 상품
  PRODUCTS: {
    LIST: '/api/products',
    DETAIL: (id: string) => `/api/products/${id}`,
    CATEGORIES: '/api/products/categories',
    BRANDS: '/api/products/brands',
    FEATURED: '/api/products/featured',
    SEARCH_SUGGESTIONS: '/api/products/search/suggestions',
    REVIEWS: (id: string) => `/api/products/${id}/reviews`,
    REVIEW_DETAIL: (productId: string, reviewId: string) => 
      `/api/products/${productId}/reviews/${reviewId}`,
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
  },
  
  // 결제
  PAYMENTS: {
    PROCESS: (orderId: string) => `/api/payments/process/${orderId}`,
    STATUS: (transactionId: string) => `/api/payments/status/${transactionId}`,
    REFUND: (orderId: string) => `/api/payments/refund/${orderId}`,
    METHODS: '/api/payments/methods',
  },
  
  // 이미지 업로드
  UPLOAD: {
    PRESIGNED_URL: '/api/upload/presigned-url',
    CONFIG: '/api/upload/config',
  },
  
  // 관리자
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    USERS: '/api/admin/users',
    USER_STATUS: (id: string) => `/api/admin/users/${id}/status`,
    ORDERS: '/api/admin/orders',
    ORDER_STATUS: (id: string) => `/api/admin/orders/${id}/status`,
    PRODUCTS: '/api/admin/products',
    PRODUCT_STOCK: (id: string) => `/api/admin/products/${id}/stock`,
    PRODUCT_FEATURED: (id: string) => `/api/admin/products/${id}/featured`,
    ANALYTICS_SALES: '/api/admin/analytics/sales',
    ANALYTICS_PRODUCTS: '/api/admin/analytics/products',
  },
};

// 환경별 디버그 설정
export const DEBUG_CONFIG = {
  development: {
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