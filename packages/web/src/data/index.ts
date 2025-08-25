import { Product, NewsPost, NewsCategory, Faq } from '@handy-platform/shared';

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
      customizable: true,
      availableLengths: ["SHORT", "MEDIUM"],
      availableShapes: ["ALMOND", "ROUND"]
    },
    stats: {
      rating: { average: 4.7, count: 214 },
      views: 1250,
      likes: 89,
      sales: 156
    },
    status: "ACTIVE",
    tags: ["HOT", "NEW"],
    metadata: {
      createdAt: "2024-01-15T00:00:00Z",
      updatedAt: "2024-08-20T00:00:00Z",
      createdBy: "seller-001",
      featured: true,
      trending: true
    }
  },
  { 
    productId: "2",
    name: "Square Short – Cocoa",
    description: "따뜻한 코코아 컬러의 스퀘어 쇼트 네일팁입니다. 단정하고 깔끔한 느낌으로 오피스룩에 적합합니다.",
    shortDescription: "따뜻한 코코아 컬러 스퀘어 쇼트 팁",
    brand: "HANDY MADE",
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
      customizable: true,
      availableLengths: ["SHORT", "MEDIUM"],
      availableShapes: ["SQUARE", "ROUND"]
    },
    stats: {
      rating: { average: 4.5, count: 156 },
      views: 890,
      likes: 67,
      sales: 123
    },
    status: "ACTIVE",
    tags: ["BEST"],
    metadata: {
      createdAt: "2024-01-20T00:00:00Z",
      updatedAt: "2024-08-18T00:00:00Z",
      createdBy: "seller-001",
      featured: false,
      trending: false
    }
  },
  { 
    productId: "3",
    name: "Coffin Long – Black",
    description: "시크하고 강렬한 블랙 컬러의 코핀 롱 네일팁입니다. 특별한 날이나 파티에 완벽한 선택입니다.",
    shortDescription: "시크한 블랙 코핀 롱 팁",
    brand: "HANDY MADE",
    sku: "HM-CLB-003",
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
      customizable: true,
      availableLengths: ["MEDIUM", "LONG"],
      availableShapes: ["COFFIN", "ALMOND"]
    },
    stats: {
      rating: { average: 4.8, count: 98 },
      views: 1450,
      likes: 112,
      sales: 87
    },
    status: "ACTIVE",
    tags: ["SALE"],
    metadata: {
      createdAt: "2024-02-01T00:00:00Z",
      updatedAt: "2024-08-19T00:00:00Z",
      createdBy: "seller-001",
      featured: true,
      trending: true
    }
  },
  { 
    productId: "4",
    name: "Round Medium – Pink Pearl",
    description: "은은한 핑크 펄 컬러의 라운드 미디움 네일팁입니다. 로맨틱하고 우아한 느낌을 연출합니다.",
    shortDescription: "은은한 핑크 펄 라운드 미디움 팁",
    brand: "HANDY MADE",
    sku: "HM-RMP-004",
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
      customizable: true,
      availableLengths: ["SHORT", "MEDIUM", "LONG"],
      availableShapes: ["ROUND", "OVAL"]
    },
    stats: {
      rating: { average: 4.6, count: 167 },
      views: 1100,
      likes: 95,
      sales: 134
    },
    status: "ACTIVE",
    tags: [],
    metadata: {
      createdAt: "2024-02-10T00:00:00Z",
      updatedAt: "2024-08-17T00:00:00Z",
      createdBy: "seller-001",
      featured: false,
      trending: false
    }
  },
  { 
    productId: "5",
    name: "Oval Short – French White",
    description: "클래식한 프렌치 화이트 컬러의 오벌 쇼트 네일팁입니다. 언제나 우아하고 깔끔한 스타일링이 가능합니다.",
    shortDescription: "클래식 프렌치 화이트 오벌 쇼트 팁",
    brand: "HANDY MADE",
    sku: "HM-OSF-005",
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
      customizable: true,
      availableLengths: ["SHORT", "MEDIUM"],
      availableShapes: ["OVAL", "ROUND"]
    },
    stats: {
      rating: { average: 4.9, count: 203 },
      views: 1680,
      likes: 156,
      sales: 178
    },
    status: "ACTIVE",
    tags: ["BEST"],
    metadata: {
      createdAt: "2024-02-15T00:00:00Z",
      updatedAt: "2024-08-16T00:00:00Z",
      createdBy: "seller-001",
      featured: true,
      trending: false
    }
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