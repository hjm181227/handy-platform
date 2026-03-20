import { Product, NewsPost, NewsCategory, Faq, Snap } from '@handy-platform/shared';

// 상품 데이터는 실제 API에서 로드 (더미 데이터 제거)
export const products: Product[] = [];

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

// 스냅 데이터는 실제 API에서 로드 (더미 데이터 제거)
export const snaps: Snap[] = [];
