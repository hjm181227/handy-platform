import { Product, NewsPost, NewsCategory, Faq } from '../types';

export const products: Product[] = [
  { 
    id: "1", 
    brand: "HANDY MADE", 
    name: "Glossy Almond Tip – Milk Beige", 
    image: "https://picsum.photos/id/1060/800/800", 
    price: 19000, 
    sale: 25, 
    isNew: true, 
    tag: "HOT", 
    rating: 4.7, 
    reviews: 214,
    nailCategories: {
      style: ["신상", "심플"],
      color: ["뉴트럴", "핑크 계열"],
      texture: ["젤"],
      shape: "아몬드",
      length: "Short",
      tpo: ["데일리", "파티"],
      nation: "K네일"
    }
  },
  { 
    id: "2", 
    brand: "HANDY MADE", 
    name: "Square Short – Cocoa", 
    image: "https://picsum.photos/id/1059/800/800", 
    price: 16000, 
    sale: 10, 
    tag: "SALE", 
    rating: 4.3, 
    reviews: 88,
    nailCategories: {
      style: ["심플", "네츄럴"],
      color: ["뉴트럴"],
      texture: ["매트"],
      shape: "스퀘어",
      length: "Short",
      tpo: ["데일리"],
      nation: "K네일"
    }
  },
  { 
    id: "3", 
    brand: "HANDY LAB", 
    name: "Gel Press – Clear Fit", 
    image: "https://picsum.photos/id/1070/800/800", 
    price: 12000, 
    isNew: true, 
    tag: "NEW", 
    rating: 4.5, 
    reviews: 61,
    nailCategories: {
      style: ["신상"],
      texture: ["젤"],
      tpo: ["데일리"],
      ab: "브랜드"
    }
  },
  { 
    id: "4", 
    brand: "HANDY MADE", 
    name: "Oval Short – Mauve", 
    image: "https://picsum.photos/id/1080/800/800", 
    price: 21000, 
    sale: 30, 
    tag: "BEST", 
    rating: 4.8, 
    reviews: 302,
    nailCategories: {
      style: ["클래식", "심플"],
      color: ["핑크 계열"],
      texture: ["매트"],
      shape: "오벌",
      length: "Short",
      tpo: ["데일리", "웨딩"],
      nation: "K네일"
    }
  },
  { 
    id: "5", 
    brand: "HANDY CARE", 
    name: "Cuticle Oil – Rose", 
    image: "https://picsum.photos/id/1084/800/800", 
    price: 9000, 
    rating: 4.2, 
    reviews: 41,
    nailCategories: {
      style: ["네츄럴"],
      tpo: ["데일리"],
      ab: "브랜드"
    }
  },
  { 
    id: "6", 
    brand: "HANDY MADE", 
    name: "French Line – Ivory", 
    image: "https://picsum.photos/id/1062/800/800", 
    price: 18000, 
    sale: 15, 
    rating: 4.4, 
    reviews: 77,
    nailCategories: {
      style: ["클래식"],
      color: ["블랙/화이트"],
      texture: ["젤"],
      shape: "라운드",
      length: "Medium",
      tpo: ["웨딩", "공연"],
      nation: "K네일"
    }
  },
  { 
    id: "7", 
    brand: "HANDY LAB", 
    name: "Sizer Card v2", 
    image: "https://picsum.photos/id/1056/800/800", 
    price: 3000, 
    tag: "BEST", 
    rating: 4.0, 
    reviews: 19,
    nailCategories: {
      tpo: ["데일리"],
      ab: "브랜드"
    }
  },
  { 
    id: "8", 
    brand: "HANDY MADE", 
    name: "Matte Coffin – Black", 
    image: "https://picsum.photos/id/1050/800/800", 
    price: 17000, 
    sale: 35, 
    tag: "SALE", 
    rating: 4.6, 
    reviews: 139,
    nailCategories: {
      style: ["화려", "키치"],
      color: ["블랙/화이트"],
      texture: ["매트"],
      shape: "코핀",
      length: "Long",
      tpo: ["파티", "공연"],
      nation: "K네일"
    }
  },
];

export const newsPosts: NewsPost[] = [
  {
    slug: "grand-opening-popup",
    title: "HANDY 팝업 스토어 GRAND OPEN",
    category: "event",
    date: "2025-08-14",
    cover: "https://images.unsplash.com/photo-1515165562835-c3b8c0f0b3a0?q=80&w=1200",
    excerpt: "주말 한정 사은품 증정 · 무료 사이징 부스 운영!",
    tags: ["오프라인", "사은품", "이벤트"],
    body: [
      "8/16(토)~8/18(월) 성수 팝업에서 사이징 상담과 신상 라인을 체험하세요.",
      "현장 구매 고객 대상 한정 굿즈 증정(소진 시 종료).",
      "운영시간: 11:00~20:00, 입장 무료.",
    ],
  },
  {
    slug: "nail-art-howto-french-line",
    title: "3분 완성: 프렌치 라인 네일 아트 가이드",
    category: "nail",
    date: "2025-08-10",
    cover: "https://images.unsplash.com/photo-1616394584738-74e3d9a4b6e8?q=80&w=1200",
    excerpt: "초보도 가능한 라인 잡기 · 톤 추천 · 유지 팁까지.",
    tags: ["튜토리얼", "프렌치", "팁"],
    body: [
      "베이스는 미색·아이보리 톤이 가장 무난합니다.",
      "라인은 얇게 두 번 겹칠수록 번짐이 적어요.",
      "마무리 탑젤은 큐티클 포함해 얇게 1코트.",
    ],
  },
  {
    slug: "handy-app-0-9-0",
    title: "HANDY 앱 0.9.0 업데이트 — 사이징 카드 v2",
    category: "update",
    date: "2025-08-05",
    cover: "https://images.unsplash.com/photo-1551033406-611cf9a28f67?q=80&w=1200",
    excerpt: "카메라 보정·측정 정확도 개선, 알림함 신설.",
    tags: ["앱 업데이트", "사이징"],
    body: [
      "새 사이징 카드 v2를 사용하면 측정 오차가 평균 23% 감소합니다.",
      "푸시 알림함에서 배송/쿠폰/이벤트를 한 곳에서 확인.",
      "버그 픽스 및 성능 향상.",
    ],
  },
  {
    slug: "handy-collab-artist",
    title: "ARTIST 콜라보 캡슐 컬렉션 공개",
    category: "handy",
    date: "2025-08-02",
    cover: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200",
    excerpt: "국내 아티스트 3인과 함께한 리미티드 아트 팁.",
    tags: ["콜라보", "신상"],
    body: [
      "각 아티스트의 드로잉을 팁 표면에 UV 인쇄로 구현했습니다.",
      "8월 한정 수량으로 판매합니다.",
    ],
  },
  {
    slug: "end-summer-deal",
    title: "END OF SUMMER DEAL — 최대 40% 세일",
    category: "event",
    date: "2025-08-01",
    cover: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200",
    excerpt: "시즌오프 + 베스트 라인 묶음 혜택.",
    tags: ["세일", "프로모션"],
    body: ["기간: 8/1~8/20", "일부 품목 제외, 재고 소진 시 조기 종료될 수 있습니다."],
  },
  {
    slug: "nail-trend-aw25",
    title: "AW25 네일 트렌드 리포트",
    category: "handy",
    date: "2025-07-30",
    cover: "https://images.unsplash.com/photo-1520975924531-8b6a9bcd5f43?q=80&w=1200",
    excerpt: "네츄럴 텍스처와 미니멀 파스텔 톤이 부상.",
    tags: ["트렌드", "리포트"],
    body: ["톤온톤 그라데이션과 매트 텍스처 조합이 키 포인트.", "라운드·아몬드 쉐입이 강세입니다."],
  },
];

export const catLabel: Record<NewsCategory, string> = {
  event: "이벤트",
  nail: "네일아트",
  handy: "HANDY 소식",
  update: "업데이트",
};

export const faqs: Faq[] = [
  { q: "주문/배송 조회는 어디서 하나요?", a: "MY > 주문 내역에서 실시간 배송상태를 확인할 수 있어요. 앱에서는 알림함에서도 확인 가능합니다." },
  { q: "반품/교환은 어떻게 신청하나요?", a: "MY > 반품/교환 내역에서 신청하세요. 수거지와 사유를 입력하면 접수됩니다. 포장 상태를 꼭 확인해 주세요." },
  { q: "결제수단 변경/영수증 발급이 가능한가요?", a: "결제 완료 후 수단 변경은 불가합니다. 현금영수증/세금계산서는 MY > 결제/영수증에서 발급됩니다." },
  { q: "계정/비밀번호를 잊어버렸어요.", a: "로그인 화면에서 '비밀번호 재설정'을 이용하세요. 이메일 인증이 어려우면 고객센터로 연락 주세요." },
  { q: "사이징 기능이 동작하지 않아요.", a: "앱 권한(카메라/저장공간)을 허용했는지 확인하고, 조명 환경에서 다시 시도해 보세요. 계속 안 되면 1:1 상담으로 문의해 주세요." },
];