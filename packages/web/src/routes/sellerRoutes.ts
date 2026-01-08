import { RouteConfig } from './types';

/**
 * 판매자 라우트 - 판매자 권한이 필요한 페이지들
 */
export const sellerRoutes: RouteConfig[] = [
  // 상품 수정
  {
    path: '/seller/products/:id/edit',
    pattern: /^\/seller\/products\/(.+)\/edit$/,
    layout: 'seller',
    requireAuth: true,
    requireRole: 'seller',
  },
  // 상품 등록
  {
    path: '/seller/products/new',
    layout: 'seller',
    requireAuth: true,
    requireRole: 'seller',
  },
  // 상품 목록
  {
    path: '/seller/products',
    layout: 'seller',
    requireAuth: true,
    requireRole: 'seller',
  },
  // 브랜드 관리
  {
    path: '/seller/brand',
    layout: 'seller',
    requireAuth: true,
    requireRole: 'seller',
  },
  // 쿠폰 관리
  {
    path: '/seller/coupons',
    layout: 'seller',
    requireAuth: true,
    requireRole: 'seller',
  },
  // 주문 관리
  {
    path: '/seller/orders',
    layout: 'seller',
    requireAuth: true,
    requireRole: 'seller',
  },
  // 리뷰 관리
  {
    path: '/seller/reviews',
    layout: 'seller',
    requireAuth: true,
    requireRole: 'seller',
  },
  // 통계
  {
    path: '/seller/analytics',
    layout: 'seller',
    requireAuth: true,
    requireRole: 'seller',
  },
  // 정산
  {
    path: '/seller/settlement',
    layout: 'seller',
    requireAuth: true,
    requireRole: 'seller',
  },
  // 생산 현황
  {
    path: '/seller/production/status',
    layout: 'seller',
    requireAuth: true,
    requireRole: 'seller',
  },
  // 생산 설정
  {
    path: '/seller/production',
    layout: 'seller',
    requireAuth: true,
    requireRole: 'seller',
  },
  // 판매자 대시보드 (마지막에 매칭)
  {
    path: '/seller',
    layout: 'seller',
    requireAuth: true,
    requireRole: 'seller',
  },
];
