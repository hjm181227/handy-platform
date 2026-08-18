import type { NewsPost, NewsCategory } from '../types';

/**
 * NEWS 화면(components/pages/NewsPage.tsx) 전용 콘텐츠.
 * 상품·스냅 등 나머지 데이터는 전부 실제 API에서 로드하므로 여기에 두지 않는다.
 */

// 카테고리 라벨 매핑 (NewsCategory 와 키가 일치해야 한다)
export const catLabel: Record<NewsCategory, string> = {
  event: "이벤트",
  nail: "네일아트",
  handy: "HANDY 소식",
  update: "업데이트",
};

export const newsPosts: NewsPost[] = [
  {
    slug: "seongsu-popup-sizing-booth",
    title: "성수 팝업 · 사이징 부스 오픈",
    category: "event",
    date: "2024-08-16",
    cover: "https://picsum.photos/id/1062/600/400",
    excerpt: "성수 팝업스토어에서 손톱 사이즈를 무료로 측정해 드립니다.",
    tags: ["이벤트", "사이징", "팝업"],
    body: [
      "성수 팝업스토어에 HANDY 사이징 부스를 엽니다.",
      "현장에서 손톱 사이즈를 측정하고, 측정 결과를 그대로 주문서에 담아갈 수 있습니다.",
      "별도 예약 없이 방문 순서대로 진행되며, 측정은 1인당 약 5분 소요됩니다.",
    ],
  },
  {
    slug: "2024-fall-nail-trend",
    title: "2024 가을 네일 트렌드 미리보기",
    category: "nail",
    date: "2024-08-20",
    cover: "https://picsum.photos/id/1051/600/400",
    excerpt: "올 가을 주목받을 네일 컬러와 디자인을 미리 만나보세요.",
    tags: ["신상", "트렌드", "프렌치"],
    body: [
      "올 가을 네일 트렌드는 '차분한 채도'로 요약됩니다.",
      "버건디·모카·올리브처럼 톤을 한 단계 낮춘 컬러가 베이스로 쓰이고,",
      "포인트는 얇은 프렌치 라인이나 미니멀한 크롬 마감으로 가볍게 얹는 방식이 주를 이룹니다.",
    ],
  },
  {
    slug: "home-nailart-basic-guide",
    title: "홈 네일아트 기초 가이드",
    category: "nail",
    date: "2024-08-18",
    cover: "https://picsum.photos/id/1050/600/400",
    excerpt: "집에서도 쉽게 할 수 있는 네일아트 기초 테크닉을 알려드립니다.",
    tags: ["튜토리얼", "팁", "홈케어"],
    body: [
      "홈 네일아트의 첫걸음은 큐티클 정리와 표면 정돈입니다.",
      "베이스 코트를 얇게 두 번 올리면 컬러가 훨씬 고르게 발립니다.",
      "마지막 탑코트는 손톱 끝(엣지)까지 감싸듯 발라야 리프팅을 막을 수 있습니다.",
    ],
  },
  {
    slug: "handy-nail-measure-update",
    title: "손톱 측정 정확도 개선 업데이트",
    category: "update",
    date: "2024-08-22",
    cover: "https://picsum.photos/id/1069/600/400",
    excerpt: "카드 기준 실측 검출을 적용해 측정 오차를 크게 줄였습니다.",
    tags: ["업데이트", "사이징"],
    body: [
      "카드 실측 검출 방식을 새로 적용해 손톱 측정 오차를 대폭 줄였습니다.",
      "촬영 가이드도 함께 개편되어, 카드 배치와 조명에 대한 안내가 화면에 표시됩니다.",
      "측정 결과는 커스텀 주문서 사이즈에 그대로 이어서 사용할 수 있습니다.",
    ],
  },
];
