import { RouteConfig } from './types';

/**
 * 공개 라우트 - 인증 없이 접근 가능한 페이지들
 */
export const publicRoutes: RouteConfig[] = [
  // 채팅방 상세 (인증 없이도 접근 가능, 내부에서 처리)
  {
    path: '/chat/:roomId',
    pattern: /^\/chat\/(.+)$/,
    layout: 'none',
  },
  // 커스텀 주문서
  {
    path: '/product/:id/custom-order',
    pattern: /^\/product\/(.+)\/custom-order$/,
    layout: 'main',
  },
  // 상품 상세
  {
    path: '/product/:id',
    pattern: /^\/product\/(.+)$/,
    layout: 'main',
  },
  // 브랜드 상세
  {
    path: '/brand/:sellerUuid',
    pattern: /^\/brand\/(.+)$/,
    layout: 'main',
  },
  // 브랜드 목록
  {
    path: '/brands',
    layout: 'main',
  },
  // 스냅
  {
    path: '/snap',
    pattern: /^\/snap/,
    layout: 'main',
  },
  // 뉴스 상세
  {
    path: '/news/:slug',
    pattern: /^\/news\/(.+)$/,
    layout: 'main',
  },
  // 뉴스 목록
  {
    path: '/news',
    layout: 'main',
  },
  // 랭킹
  {
    path: '/ranking',
    pattern: /^\/ranking/,
    layout: 'main',
  },
  // 세일
  {
    path: '/sale',
    pattern: /^\/sale/,
    layout: 'main',
  },
  // 추천
  {
    path: '/recommend',
    pattern: /^\/recommend/,
    layout: 'main',
  },
  // 신상
  {
    path: '/new',
    pattern: /^\/new/,
    layout: 'main',
  },
  // 트렌드
  {
    path: '/trend',
    pattern: /^\/trend/,
    layout: 'main',
  },
  // 프로모션 상세
  {
    path: '/promo/:slug',
    pattern: /^\/promo\/(.+)$/,
    layout: 'main',
  },
  // 카테고리 상품
  {
    path: '/cat/:group/:name',
    pattern: /^\/cat\/(.+)$/,
    layout: 'main',
  },
  // 검색 결과
  {
    path: '/search',
    pattern: /^\/search/,
    layout: 'main',
  },
  // 카테고리 페이지 (모바일)
  {
    path: '/category',
    layout: 'main',
  },
  // 도움말
  {
    path: '/help',
    pattern: /^\/help/,
    layout: 'main',
  },
  // 장바구니 (로그인 없이도 접근 가능)
  {
    path: '/cart',
    pattern: /^\/cart/,
    layout: 'main',
  },
  // 결제 관련
  {
    path: '/payment/success',
    layout: 'main',
  },
  {
    path: '/payment/result',
    layout: 'main',
  },
  {
    path: '/payment/cancel',
    layout: 'main',
  },
  {
    path: '/payment/fail',
    layout: 'main',
  },
  {
    path: '/payment/test',
    layout: 'main',
  },
  // 고객지원
  {
    path: '/support/contact',
    layout: 'main',
  },
  {
    path: '/support/faq',
    layout: 'main',
  },
  // 프로모션
  {
    path: '/promo/plus',
    layout: 'main',
  },
  // 회사 소개 페이지들
  {
    path: '/about/회사 소개',
    layout: 'main',
  },
  {
    path: '/about/비즈니스 소개',
    layout: 'main',
  },
  {
    path: '/about/뉴스룸',
    layout: 'main',
  },
  {
    path: '/about/채용 정보',
    layout: 'main',
  },
  {
    path: '/about/공지사항',
    layout: 'main',
  },
  // 메가 푸터 페이지들
  {
    path: '/contact-inquiry',
    layout: 'main',
  },
  {
    path: '/footer-faq',
    layout: 'main',
  },
  {
    path: '/about-company',
    layout: 'main',
  },
  {
    path: '/about-business',
    layout: 'main',
  },
  {
    path: '/about-newsroom',
    layout: 'main',
  },
  {
    path: '/about-careers',
    layout: 'main',
  },
  {
    path: '/about-notice',
    layout: 'main',
  },
  // 파트너 문의
  {
    path: '/partner/:type',
    pattern: /^\/partner\/(.+)$/,
    layout: 'main',
  },
  // 정책 페이지
  {
    path: '/policy/:type',
    pattern: /^\/policy\/(.+)$/,
    layout: 'main',
  },
  // SNS 페이지
  {
    path: '/sns/:platform',
    pattern: /^\/sns\/(.+)$/,
    layout: 'main',
  },
  // 로그인/회원가입
  {
    path: '/login',
    pattern: /^\/login/,
    layout: 'main',
  },
  {
    path: '/auth/social/signup',
    pattern: /^\/auth\/social\/signup/,
    layout: 'main',
  },
  {
    path: '/signup',
    pattern: /^\/signup/,
    layout: 'main',
  },
  // 채팅 목록
  {
    path: '/chat',
    layout: 'none',
  },
];
