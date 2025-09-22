// 공유 타입들을 가져오기 (실제로 export된 것들만)
export type {
  Product,
  ProductImage,
  ProductSpecifications,
  ProductRating,
  ProductReview,
  Seller,
  User,
  ApiResponse,
  PaginationInfo
} from '@handy-platform/shared';

// 웹 전용 타입들
export type NewsCategory = "event" | "nail" | "handy" | "update";

// 네일 관련 타입들
export type NailShape = 'ROUND' | 'ALMOND' | 'OVAL' | 'STILETTO' | 'SQUARE' | 'COFFIN';
export type NailLength = 'SHORT' | 'MEDIUM' | 'LONG';

export interface NailCategories {
  style: string[];   // 최대 3개 (신상, 심플, 화려, 클래식, 키치, 네츄럴)
  color: string[];   // 최대 3개 (레드 계열, 핑크 계열, 뉴트럴, 블랙/화이트)
  texture: string[]; // 최대 3개 (젤, 매트, 글리터)
  shape: string;     // 1개만 (라운드, 아몬드, 오벌, 스퀘어, 코핀)
  length: string;    // 1개만 (Short, Medium, Long)
  tpo: string[];     // 최대 3개 (데일리, 파티, 웨딩, 공연)
  ab: string;        // 1개만 (A/B or 브랜드)
  nation: string;    // 1개만 (K네일, J네일, 기타)
}

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
