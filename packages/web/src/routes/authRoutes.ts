import { RouteConfig } from './types';

/**
 * 인증 필요 라우트 - 로그인이 필요한 페이지들
 */
export const authRoutes: RouteConfig[] = [
  // 체크아웃
  {
    path: '/checkout',
    layout: 'main',
    requireAuth: true,
  },
  // 주문 완료
  {
    path: '/orders/:id',
    pattern: /^\/orders\/(.+)$/,
    layout: 'main',
    requireAuth: true,
  },
  // 찜한 목록
  {
    path: '/likes',
    pattern: /^\/likes/,
    layout: 'main',
    requireAuth: true,
  },
  // 마이페이지 - 주문 내역
  {
    path: '/my/orders',
    layout: 'main',
    requireAuth: true,
  },
  // 마이페이지 - 배송지 관리
  {
    path: '/my/shipping-address',
    layout: 'main',
    requireAuth: true,
  },
  // 마이페이지 - 배송 현황
  {
    path: '/my/shipping',
    layout: 'main',
    requireAuth: true,
  },
  // 마이페이지 - 클레임 내역
  {
    path: '/my/claims',
    layout: 'main',
    requireAuth: true,
  },
  // 마이페이지 - 취소 내역
  {
    path: '/my/cancel',
    layout: 'main',
    requireAuth: true,
  },
  // 마이페이지 - 리뷰 관리
  {
    path: '/my/reviews',
    layout: 'main',
    requireAuth: true,
  },
  // 마이페이지 - 쿠폰
  {
    path: '/my/coupons',
    layout: 'main',
    requireAuth: true,
  },
  // 마이페이지 - 포인트
  {
    path: '/my/points',
    layout: 'main',
    requireAuth: true,
  },
  // 마이페이지 - 결제 수단
  {
    path: '/my/payments',
    layout: 'main',
    requireAuth: true,
  },
  // 마이페이지 - 알림
  {
    path: '/my/notifications',
    layout: 'main',
    requireAuth: true,
  },
  // 마이페이지 - 설정
  {
    path: '/my/settings',
    layout: 'main',
    requireAuth: true,
  },
  // 마이페이지 메인 (마지막에 매칭)
  {
    path: '/my',
    pattern: /^\/my/,
    layout: 'main',
    requireAuth: true,
  },
  // 판매자 등록 신청
  {
    path: '/seller/register',
    layout: 'main',
    requireAuth: true,
  },
  // 판매자 신청서
  {
    path: '/seller/apply',
    layout: 'main',
    requireAuth: true,
  },
];
