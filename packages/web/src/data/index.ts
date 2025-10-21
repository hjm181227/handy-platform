import { Product, NewsPost, NewsCategory, Faq, Snap } from '@handy-platform/shared';

export const products: Product[] = [
  { 
    productId: "1", 
    name: "Glossy Almond Tip – Milk Beige",
    description: "우유빛 베이지 컬러의 글로시 아몬드 네일팁입니다. 자연스럽고 세련된 느낌을 연출할 수 있어 데일리룩에 완벽하게 어울립니다.",
    shortDescription: "우유빛 베이지 글로시 아몬드 팁",
    brand: "HANDY MADE",
    sku: "HM-GAT-MB-001",
    price: 19000,
    salePrice: 14250, // 25% 할인
    stockQuantity: 50,
    processingDays: 1,
    mainImageUrl: "https://picsum.photos/id/1060/800/800",
    detailImages: [
      { url: "https://picsum.photos/id/1061/800/800", description: "상세 이미지 1", order: 1 },
      { url: "https://picsum.photos/id/1062/800/800", description: "상세 이미지 2", order: 2 }
    ],
    nailCategories: {
      style: ["신상", "심플"],
      color: ["뉴트럴", "핑크 계열"],
      texture: ["젤"],
      tpo: ["데일리", "파티"],
      nation: "K네일"
    },
    nailShape: "ALMOND",
    nailLength: "SHORT",
    nailOptions: {
      lengthCustomizable: true,
      shapeCustomizable: true,
      designCustomizable: false
    },
    rating: { average: 4.7, count: 214 },
    likesCount: 89,
    postsCount: 12,
    isFeatured: true,
    isNewProduct: true,
    isInStock: true,
    discountRate: 25,
    discountedPrice: 14250,
    hasDiscount: true,
    stats: {
      viewsCount: 1250,
      ordersCount: 156,
      reviewsCount: 214
    },
    seller: {
      userId: "seller-001",
      name: "핸디 메이드",
      companyName: "핸디 메이드 컴퍼니",
      isVerified: true
    },
    socialProof: {
      totalMentions: 450,
      recentMentions: 24,
      averageRating: 4.7,
      trendingScore: 85
    },
    tags: ["HOT", "NEW"],
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-08-20T00:00:00Z"
  },
  {
    productId: "2",
    name: "Square Short – Cocoa",
    description: "따뜻한 코코아 컬러의 스퀘어 쇼트 네일팁입니다. 단정하고 깔끔한 느낌으로 오피스룩에 적합합니다.",
    shortDescription: "따뜻한 코코아 컬러 스퀘어 쇼트 팁",
    brand: "HANDY LAB",
    sku: "HM-SS-CC-002",
    price: 16000,
    stockQuantity: 75,
    processingDays: 1,
    mainImageUrl: "https://picsum.photos/id/1059/800/800",
    nailCategories: {
      style: ["심플", "모던"],
      color: ["브라운 계열", "뉴트럴"],
      texture: ["매트"],
      tpo: ["오피스", "데일리"],
      nation: "K네일"
    },
    nailShape: "SQUARE",
    nailLength: "SHORT",
    nailOptions: {
      lengthCustomizable: true,
      shapeCustomizable: true,
      designCustomizable: false
    },
    rating: { average: 4.5, count: 156 },
    likesCount: 67,
    postsCount: 8,
    isFeatured: false,
    isNewProduct: true,
    isInStock: true,
    discountRate: 0,
    discountedPrice: 16000,
    hasDiscount: false,
    stats: {
      viewsCount: 890,
      ordersCount: 123,
      reviewsCount: 156
    },
    seller: {
      userId: "seller-001",
      name: "핸디 메이드",
      companyName: "핸디 메이드 컴퍼니",
      isVerified: true
    },
    socialProof: {
      totalMentions: 280,
      recentMentions: 15,
      averageRating: 4.5,
      trendingScore: 72
    },
    tags: ["BEST"],
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: "2024-08-18T00:00:00Z"
  },
  { 
    productId: "3",
    name: "Coffin Long – Black",
    description: "시크하고 강렬한 블랙 컬러의 코핀 롱 네일팁입니다. 특별한 날이나 파티에 완벽한 선택입니다.",
    shortDescription: "시크한 블랙 코핀 롱 팁",
    brand: "HANDY CARE",
    sku: "HC-CLB-003",
    price: 22000,
    stockQuantity: 30,
    processingDays: 2,
    mainImageUrl: "https://picsum.photos/id/1058/800/800",
    nailCategories: {
      style: ["드라마틱", "시크"],
      color: ["블랙", "다크"],
      texture: ["글로시"],
      tpo: ["파티", "이벤트"],
      nation: "K네일"
    },
    nailShape: "COFFIN",
    nailLength: "LONG",
    nailOptions: {
      lengthCustomizable: true,
      shapeCustomizable: true,
      designCustomizable: true
    },
    rating: { average: 4.8, count: 98 },
    likesCount: 112,
    postsCount: 15,
    isFeatured: true,
    isNewProduct: true,
    isInStock: true,
    discountRate: 0,
    discountedPrice: 22000,
    hasDiscount: false,
    stats: {
      viewsCount: 1450,
      ordersCount: 87,
      reviewsCount: 98
    },
    seller: {
      userId: "seller-001",
      name: "핸디 메이드",
      companyName: "핸디 메이드 컴퍼니",
      isVerified: true
    },
    socialProof: {
      totalMentions: 320,
      recentMentions: 22,
      averageRating: 4.8,
      trendingScore: 88
    },
    tags: ["SALE"],
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-08-19T00:00:00Z"
  },
  { 
    productId: "4",
    name: "Round Medium – Pink Pearl",
    description: "은은한 핑크 펄 컬러의 라운드 미디움 네일팁입니다. 로맨틱하고 우아한 느낌을 연출합니다.",
    shortDescription: "은은한 핑크 펄 라운드 미디움 팁",
    brand: "NAIL STUDIO",
    sku: "NS-RMP-004",
    price: 18000,
    stockQuantity: 40,
    processingDays: 1,
    mainImageUrl: "https://picsum.photos/id/1057/800/800",
    nailCategories: {
      style: ["로맨틱", "우아"],
      color: ["핑크 계열", "펄"],
      texture: ["펜더", "펄"],
      tpo: ["데이트", "웨딩"],
      nation: "K네일"
    },
    nailShape: "ROUND",
    nailLength: "MEDIUM",
    nailOptions: {
      lengthCustomizable: true,
      shapeCustomizable: true,
      designCustomizable: false
    },
    rating: { average: 4.6, count: 167 },
    likesCount: 95,
    postsCount: 18,
    isFeatured: false,
    isNewProduct: false,
    isInStock: true,
    discountRate: 0,
    discountedPrice: 18000,
    hasDiscount: false,
    stats: {
      viewsCount: 1100,
      ordersCount: 134,
      reviewsCount: 167
    },
    seller: {
      userId: "seller-001",
      name: "핸디 메이드",
      companyName: "핸디 메이드 컴퍼니",
      isVerified: true
    },
    socialProof: {
      totalMentions: 290,
      recentMentions: 18,
      averageRating: 4.6,
      trendingScore: 75
    },
    tags: [],
    createdAt: "2024-02-10T00:00:00Z",
    updatedAt: "2024-08-17T00:00:00Z"
  },
  { 
    productId: "5",
    name: "Oval Short – French White",
    description: "클래식한 프렌치 화이트 컬러의 오벌 쇼트 네일팁입니다. 언제나 우아하고 깔끔한 스타일링이 가능합니다.",
    shortDescription: "클래식 프렌치 화이트 오벌 쇼트 팁",
    brand: "CRYSTAL NAILS",
    sku: "CN-OSF-005",
    price: 17000,
    stockQuantity: 60,
    processingDays: 1,
    mainImageUrl: "https://picsum.photos/id/1056/800/800",
    nailCategories: {
      style: ["클래식", "프렌치"],
      color: ["화이트", "뉴트럴"],
      texture: ["글로시"],
      tpo: ["오피스", "웨딩", "데일리"],
      nation: "K네일"
    },
    nailShape: "OVAL",
    nailLength: "SHORT",
    nailOptions: {
      lengthCustomizable: true,
      shapeCustomizable: true,
      designCustomizable: false
    },
    rating: { average: 4.9, count: 203 },
    likesCount: 156,
    postsCount: 25,
    isFeatured: true,
    isNewProduct: false,
    isInStock: true,
    discountRate: 0,
    discountedPrice: 17000,
    hasDiscount: false,
    stats: {
      viewsCount: 1680,
      ordersCount: 178,
      reviewsCount: 203
    },
    seller: {
      userId: "seller-001",
      name: "핸디 메이드",
      companyName: "핸디 메이드 컴퍼니",
      isVerified: true
    },
    socialProof: {
      totalMentions: 380,
      recentMentions: 28,
      averageRating: 4.9,
      trendingScore: 92
    },
    tags: ["BEST"],
    createdAt: "2024-02-15T00:00:00Z",
    updatedAt: "2024-08-16T00:00:00Z"
  }
];

export const newsCategories: NewsCategory[] = [
  { id: "trend", name: "트렌드", slug: "trend" },
  { id: "tutorial", name: "튜토리얼", slug: "tutorial" }, 
  { id: "product", name: "신제품", slug: "product" },
  { id: "event", name: "이벤트", slug: "event" }
];

// 카테고리 라벨 매핑
export const catLabel = {
  event: "이벤트",
  nail: "네일", 
  handy: "핸디",
  update: "업데이트",
  trend: "트렌드",
  tutorial: "튜토리얼",
  product: "신제품"
} as const;

export const newsPosts: NewsPost[] = [
  {
    id: "1",
    title: "2024 가을 네일 트렌드 미리보기",
    excerpt: "올 가을 주목받을 네일 컬러와 디자인을 미리 만나보세요.",
    content: "올 가을 네일 트렌드는...",
    category: "trend",
    date: "2024-08-20",
    image: "https://picsum.photos/id/1051/600/400",
    featured: true
  },
  {
    id: "2", 
    title: "홈 네일아트 기초 가이드",
    excerpt: "집에서도 쉽게 할 수 있는 네일아트 기초 테크닉을 알려드립니다.",
    content: "홈 네일아트의 첫걸음은...",
    category: "tutorial",
    date: "2024-08-18",
    image: "https://picsum.photos/id/1050/600/400",
    featured: false
  }
];

export const faqs: Faq[] = [
  {
    id: "1",
    category: "주문/배송",
    question: "주문 후 배송까지 얼마나 걸리나요?",
    answer: "일반적으로 주문 확인 후 1-2일 내에 제작이 완료되며, 배송은 제작 완료 후 1-2일이 소요됩니다."
  },
  {
    id: "2",
    category: "제품",
    question: "네일팁 사이즈는 어떻게 선택하나요?",
    answer: "주문 시 손가락별 사이즈를 측정하여 선택하실 수 있습니다. 사이즈 가이드를 참고해 주세요."
  },
  {
    id: "3",
    category: "사용법",
    question: "네일팁 제거는 어떻게 하나요?",
    answer: "전용 리무버나 아세톤을 사용하여 천천히 제거하시면 됩니다. 무리하게 제거하지 마세요."
  }
];

// 스냅 (네일 갤러리) 더미 데이터
export const snaps: Snap[] = [
  {
    id: "snap-1",
    imageUrl: "https://picsum.photos/seed/nail-1/600/800",
    title: "Glossy Pink Gradient",
    description: "핑크 그라데이션 글로시 네일 디자인",
    creator: {
      name: "민지",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-1"
    },
    likesCount: 234,
    createdAt: "2024-08-20T10:30:00Z",
    tags: ["핑크", "그라데이션", "글로시", "데일리"],
    relatedProducts: ["1", "4"]
  },
  {
    id: "snap-2",
    imageUrl: "https://picsum.photos/seed/nail-2/600/800",
    title: "French Manicure",
    description: "클래식 프렌치 매니큐어",
    creator: {
      name: "수현",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-2"
    },
    likesCount: 412,
    createdAt: "2024-08-19T14:20:00Z",
    tags: ["프렌치", "클래식", "화이트", "웨딩"],
    relatedProducts: ["5"]
  },
  {
    id: "snap-3",
    imageUrl: "https://picsum.photos/seed/nail-3/600/800",
    title: "Black & Gold Glitter",
    description: "블랙 베이스에 골드 글리터 포인트",
    creator: {
      name: "지은",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-3"
    },
    likesCount: 567,
    createdAt: "2024-08-18T09:15:00Z",
    tags: ["블랙", "골드", "글리터", "파티"],
    relatedProducts: ["3"]
  },
  {
    id: "snap-4",
    imageUrl: "https://picsum.photos/seed/nail-4/600/800",
    title: "Nude Marble",
    description: "은은한 누드 마블 패턴",
    creator: {
      name: "유진",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-4"
    },
    likesCount: 189,
    createdAt: "2024-08-17T16:45:00Z",
    tags: ["누드", "마블", "심플", "오피스"],
    relatedProducts: ["2"]
  },
  {
    id: "snap-5",
    imageUrl: "https://picsum.photos/seed/nail-5/600/800",
    title: "Cherry Blossom Art",
    description: "벚꽃 디자인의 봄 네일",
    creator: {
      name: "혜진",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-5"
    },
    likesCount: 623,
    createdAt: "2024-08-16T11:00:00Z",
    tags: ["벚꽃", "봄", "핑크", "아트"],
    relatedProducts: ["1", "4"]
  },
  {
    id: "snap-6",
    imageUrl: "https://picsum.photos/seed/nail-6/600/800",
    title: "Matte Brown Minimalist",
    description: "매트 브라운 미니멀 디자인",
    creator: {
      name: "서연",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-6"
    },
    likesCount: 345,
    createdAt: "2024-08-15T13:30:00Z",
    tags: ["매트", "브라운", "미니멀", "데일리"],
    relatedProducts: ["2"]
  },
  {
    id: "snap-7",
    imageUrl: "https://picsum.photos/seed/nail-7/600/800",
    title: "Holographic Chrome",
    description: "홀로그램 크롬 네일",
    creator: {
      name: "다은",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-7"
    },
    likesCount: 789,
    createdAt: "2024-08-14T10:20:00Z",
    tags: ["홀로그램", "크롬", "트렌디", "파티"],
    relatedProducts: ["3"]
  },
  {
    id: "snap-8",
    imageUrl: "https://picsum.photos/seed/nail-8/600/800",
    title: "Pastel Rainbow",
    description: "파스텔 무지개 색상 믹스",
    creator: {
      name: "채원",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-8"
    },
    likesCount: 456,
    createdAt: "2024-08-13T15:40:00Z",
    tags: ["파스텔", "무지개", "여름", "키치"],
    relatedProducts: ["1", "4", "5"]
  },
  {
    id: "snap-9",
    imageUrl: "https://picsum.photos/seed/nail-9/600/800",
    title: "Burgundy Velvet",
    description: "버건디 벨벳 텍스처",
    creator: {
      name: "하은",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-9"
    },
    likesCount: 298,
    createdAt: "2024-08-12T12:10:00Z",
    tags: ["버건디", "벨벳", "가을", "우아"],
    relatedProducts: ["3"]
  },
  {
    id: "snap-10",
    imageUrl: "https://picsum.photos/seed/nail-10/600/800",
    title: "Pearl White Elegance",
    description: "화이트 펄 우아한 스타일",
    creator: {
      name: "소은",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-10"
    },
    likesCount: 512,
    createdAt: "2024-08-11T09:25:00Z",
    tags: ["화이트", "펄", "우아", "웨딩"],
    relatedProducts: ["5"]
  },
  {
    id: "snap-11",
    imageUrl: "https://picsum.photos/seed/nail-11/600/800",
    title: "Geometric Patterns",
    description: "기하학 패턴 디자인",
    creator: {
      name: "예린",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-11"
    },
    likesCount: 367,
    createdAt: "2024-08-10T14:50:00Z",
    tags: ["기하학", "패턴", "모던", "트렌디"],
    relatedProducts: ["2"]
  },
  {
    id: "snap-12",
    imageUrl: "https://picsum.photos/seed/nail-12/600/800",
    title: "Ocean Blue Wave",
    description: "바다 파도 블루 그라데이션",
    creator: {
      name: "아린",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-12"
    },
    likesCount: 441,
    createdAt: "2024-08-09T11:35:00Z",
    tags: ["블루", "그라데이션", "여름", "시원"],
    relatedProducts: ["1"]
  },
  {
    id: "snap-13",
    imageUrl: "https://picsum.photos/seed/nail-13/600/800",
    title: "Rose Gold Glam",
    description: "로즈골드 글램 스타일",
    creator: {
      name: "나은",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-13"
    },
    likesCount: 678,
    createdAt: "2024-08-08T16:20:00Z",
    tags: ["로즈골드", "글램", "파티", "화려"],
    relatedProducts: ["3", "4"]
  },
  {
    id: "snap-14",
    imageUrl: "https://picsum.photos/seed/nail-14/600/800",
    title: "Mint Green Fresh",
    description: "민트 그린 청량한 느낌",
    creator: {
      name: "윤아",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-14"
    },
    likesCount: 223,
    createdAt: "2024-08-07T10:05:00Z",
    tags: ["민트", "그린", "청량", "봄"],
    relatedProducts: ["1", "5"]
  },
  {
    id: "snap-15",
    imageUrl: "https://picsum.photos/seed/nail-15/600/800",
    title: "Purple Galaxy",
    description: "퍼플 갤럭시 우주 디자인",
    creator: {
      name: "시은",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-15"
    },
    likesCount: 556,
    createdAt: "2024-08-06T13:45:00Z",
    tags: ["퍼플", "갤럭시", "우주", "신비"],
    relatedProducts: ["3"]
  },
  {
    id: "snap-16",
    imageUrl: "https://picsum.photos/seed/nail-16/600/800",
    title: "Peach Ombre",
    description: "복숭아 옹브레 그라데이션",
    creator: {
      name: "은지",
      avatar: "https://i.pravatar.cc/150?u=nail-artist-16"
    },
    likesCount: 392,
    createdAt: "2024-08-05T15:15:00Z",
    tags: ["복숭아", "옹브레", "그라데이션", "여름"],
    relatedProducts: ["1", "4"]
  }
];