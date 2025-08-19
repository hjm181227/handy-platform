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
