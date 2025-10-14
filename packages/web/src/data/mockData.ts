import { Product, CartItem, Cart, ShippingAddress, PaymentMethod, Order } from '@handy-platform/shared';

// Mock 상품 데이터
export const mockProducts: Product[] = [
  {
    id: 'prod_001',
    name: '프리미엄 무선 이어폰',
    description: '노이즈 캔슬링 기능이 탑재된 고품질 무선 이어폰입니다. 최대 30시간 재생 가능하며, 방수 기능까지 지원합니다.',
    price: 129000,
    originalPrice: 159000,
    discountRate: 19,
    images: [
      'https://picsum.photos/400/400?random=1',
      'https://picsum.photos/400/400?random=2',
      'https://picsum.photos/400/400?random=3'
    ],
    category: 'electronics',
    tags: ['무선', '블루투스', '노이즈캔슬링', '방수'],
    sellerUuid: 'seller_001',
    sellerName: 'TechStore',
    rating: 4.8,
    reviewCount: 1247,
    stock: 15,
    isAvailable: true,
    shippingInfo: {
      freeShipping: true,
      estimatedDays: '1-2일',
      shippingCost: 0
    },
    options: [
      {
        name: '색상',
        values: ['블랙', '화이트', '로즈골드'],
        required: true
      },
      {
        name: '보증',
        values: ['1년 무상보증', '2년 유상보증'],
        required: false
      }
    ],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z'
  },
  {
    id: 'prod_002',
    name: '스마트 워치 프로',
    description: '건강 관리와 스마트 기능을 모두 갖춘 차세대 스마트 워치입니다.',
    price: 299000,
    originalPrice: 349000,
    discountRate: 14,
    images: [
      'https://picsum.photos/400/400?random=4',
      'https://picsum.photos/400/400?random=5'
    ],
    category: 'electronics',
    tags: ['스마트워치', '헬스케어', 'GPS'],
    sellerUuid: 'seller_002',
    sellerName: 'SmartGear',
    rating: 4.6,
    reviewCount: 892,
    stock: 8,
    isAvailable: true,
    shippingInfo: {
      freeShipping: true,
      estimatedDays: '2-3일',
      shippingCost: 0
    },
    options: [
      {
        name: '크기',
        values: ['41mm', '45mm'],
        required: true
      },
      {
        name: '밴드',
        values: ['스포츠 밴드', '레더 밴드', '메탈 밴드'],
        required: true
      }
    ],
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z'
  },
  {
    id: 'prod_003',
    name: '프리미엄 백팩',
    description: '비즈니스와 여행에 최적화된 다기능 백팩입니다.',
    price: 89000,
    originalPrice: 120000,
    discountRate: 26,
    images: [
      'https://picsum.photos/400/400?random=6',
      'https://picsum.photos/400/400?random=7'
    ],
    category: 'fashion',
    tags: ['백팩', '비즈니스', '여행'],
    sellerUuid: 'seller_003',
    sellerName: 'LifeStyle',
    rating: 4.7,
    reviewCount: 567,
    stock: 23,
    isAvailable: true,
    shippingInfo: {
      freeShipping: false,
      estimatedDays: '3-5일',
      shippingCost: 3000
    },
    options: [
      {
        name: '색상',
        values: ['블랙', '네이비', '그레이'],
        required: true
      }
    ],
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  }
];

// Mock 장바구니 데이터
export const mockCartItems: CartItem[] = [
  {
    id: 'cart_001',
    productId: 'prod_001',
    product: mockProducts[0],
    quantity: 2,
    selectedOptions: {
      '색상': '블랙',
      '보증': '1년 무상보증'
    },
    price: 129000,
    totalPrice: 258000,
    subtotal: 258000,
    addedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: 'cart_002',
    productId: 'prod_002',
    product: mockProducts[1],
    quantity: 1,
    selectedOptions: {
      '크기': '45mm',
      '밴드': '스포츠 밴드'
    },
    price: 299000,
    totalPrice: 299000,
    subtotal: 299000,
    addedAt: '2024-01-20T11:15:00Z'
  }
];

export const mockCart: Cart = {
  id: 'cart_user_001',
  user: 'user_001',
  items: mockCartItems,
  totals: {
    subtotal: 557000,
    shippingCost: 0,
    tax: 0,
    total: 557000,
    itemCount: 3,
    freeShippingRemaining: 0
  },
  updatedAt: '2024-01-20T11:15:00Z'
};

// Mock 배송지 데이터
export const mockShippingAddresses: ShippingAddress[] = [
  {
    id: 'addr_001',
    userId: 'user_001',
    name: '집 (기본)',
    recipient: '김철수',
    phone: '010-1234-5678',
    zipCode: '06292',
    address: '서울시 강남구 테헤란로 123',
    detailAddress: '456호',
    isDefault: true,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z'
  },
  {
    id: 'addr_002',
    userId: 'user_001',
    name: '회사',
    recipient: '김철수',
    phone: '010-1234-5678',
    zipCode: '06159',
    address: '서울시 강남구 삼성로 789',
    detailAddress: '10층 개발팀',
    isDefault: false,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  }
];

// Mock 결제 수단 데이터
export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'card_001',
    userId: 'user_001',
    type: 'credit_card',
    name: '신한카드 (****1234)',
    provider: 'shinhan',
    cardNumber: '****-****-****-1234',
    expiryDate: '12/26',
    isDefault: true,
    createdAt: '2024-01-05T00:00:00Z'
  },
  {
    id: 'card_002',
    userId: 'user_001',
    type: 'credit_card',
    name: '국민카드 (****5678)',
    provider: 'kb',
    cardNumber: '****-****-****-5678',
    expiryDate: '08/25',
    isDefault: false,
    createdAt: '2024-01-10T00:00:00Z'
  }
];

// Mock API 응답 시뮬레이션 함수들
export const mockApiDelay = (ms: number = 1000) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const mockApiResponse = <T>(data: T, success: boolean = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error occurred',
  timestamp: new Date().toISOString()
});

// Mock 주문 데이터
export const createMockOrder = (cartItems: CartItem[], shippingAddress: ShippingAddress, paymentMethod: PaymentMethod): Order => ({
  id: `order_${Date.now()}`,
  userId: 'user_001',
  items: cartItems.map(item => ({
    id: `order_item_${item.id}`,
    orderId: `order_${Date.now()}`,
    productId: item.productId,
    product: item.product,
    quantity: item.quantity,
    selectedOptions: item.selectedOptions,
    price: item.price,
    totalPrice: item.totalPrice
  })),
  status: 'pending',
  paymentStatus: 'pending',
  shippingAddress,
  paymentMethod: paymentMethod.type,
  paymentProvider: paymentMethod.provider,
  totalAmount: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
  shippingCost: 0,
  discountAmount: 0,
  finalAmount: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
  orderNumber: `ORD${Date.now()}`,
  estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});