import { RouteConfig } from './types';

/**
 * 관리자 라우트 - 관리자 권한이 필요한 페이지들
 */
export const adminRoutes: RouteConfig[] = [
  // 사용자 관리
  {
    path: '/admin/users',
    layout: 'admin',
    requireAuth: true,
    requireRole: 'admin',
  },
  // 판매자 관리
  {
    path: '/admin/sellers',
    layout: 'admin',
    requireAuth: true,
    requireRole: 'admin',
  },
  // 주문 관리
  {
    path: '/admin/orders',
    layout: 'admin',
    requireAuth: true,
    requireRole: 'admin',
  },
  // 상품 관리
  {
    path: '/admin/products',
    layout: 'admin',
    requireAuth: true,
    requireRole: 'admin',
  },
  // 판매자 신청 관리
  {
    path: '/admin/seller-applications',
    layout: 'admin',
    requireAuth: true,
    requireRole: 'admin',
  },
  // 카테고리 관리
  {
    path: '/admin/categories',
    layout: 'admin',
    requireAuth: true,
    requireRole: 'admin',
  },
  // 배너 관리
  {
    path: '/admin/banners',
    layout: 'admin',
    requireAuth: true,
    requireRole: 'admin',
  },
  // 관리자 대시보드 (마지막에 매칭)
  {
    path: '/admin',
    pattern: /^\/admin/,
    layout: 'admin',
    requireAuth: true,
    requireRole: 'admin',
  },
];
