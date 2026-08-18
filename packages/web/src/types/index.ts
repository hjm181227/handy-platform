// 공유 타입들을 가져오기 (실제로 export된 것들만)
export type {
  Product,
  ProductType,
  ProductRating,
  ProductReview,
  Seller,
  User,
  ApiResponse,
  PaginationInfo,
  CustomOrderRequest,
  PrefillProductResponse,
  BulkCreateProductRequest,
  BulkCreateResult,
  CreateProductRequest,
  UpdateProductRequest,
  NailOptions,
  // 서버 models/Product.ts 의 nailCategories 스키마와 일치하는 정의를 사용한다
  NailCategories
} from '@handy-platform/shared';

// 웹 전용 타입들
export type NewsCategory = "event" | "nail" | "handy" | "update";

// 네일 관련 타입들
export type NailShape = 'ROUND' | 'ALMOND' | 'OVAL' | 'STILETTO' | 'SQUARE' | 'COFFIN';
export type NailLength = 'SHORT' | 'MEDIUM' | 'LONG';

export type NewsPost = {
  slug: string;
  title: string;
  category: NewsCategory;
  date: string; // YYYY-MM-DD
  cover: string;
  excerpt: string;
  tags: string[];
  body?: string[];
};

export type Faq = { q: string; a: string };
