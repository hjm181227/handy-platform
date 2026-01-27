export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:11000',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  // Chat API: production에서는 리버스 프록시(/chat-api), 개발에서는 직접 접속
  chatApiUrl: import.meta.env.VITE_CHAT_API_URL ||
    (import.meta.env.PROD ? '/chat-api' : 'http://16.176.147.141'),
};

export const apiEndpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
  },
  products: {
    list: '/api/products',
    detail: (id: string) => `/api/products/${id}`,
    search: '/api/products/search',
  },
  cart: {
    get: '/api/cart',
    add: '/api/cart/add',
    update: '/api/cart/update',
    remove: '/api/cart/remove',
    clear: '/api/cart/clear',
  },
  checkout: {
    initialize: '/api/checkout/initialize',
    confirm: '/api/checkout/confirm',
    cancel: '/api/checkout/cancel',
  },
  shipping: {
    addresses: '/api/shipping-addresses',
    calculate: '/api/shipping/calculate',
  },
  payment: {
    methods: '/api/payments/methods',
    process: '/api/payments/process',
  }
};

export default config;