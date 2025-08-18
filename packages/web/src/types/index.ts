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