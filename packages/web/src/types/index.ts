export interface NailCategories {
  style: string[];  // 최대 3개
  color: string[];  // 최대 3개  
  texture: string[]; // 최대 3개
  shape: string;     // 1개만
  length: string;    // 1개만
  tpo: string[];     // 최대 3개
  ab: string;        // 1개만
  nation: string;    // 1개만
}

export type Product = {
  id: string;
  brand: string;
  name: string;
  image: string;
  price: number;
  sale?: number;
  isNew?: boolean;
  tag?: "HOT" | "BEST" | "NEW" | "SALE";
  rating?: number;
  reviews?: number;
  nailCategories?: Partial<NailCategories>; // 네일 전용 카테고리
};

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