/**
 * 보호된 라우트 설정
 *
 * 이 파일에서 인증이 필요한 페이지와 역할별 접근 권한을 관리합니다.
 * 페이지 추가/제거 시 이 파일만 수정하면 됩니다.
 */

export type UserRole = 'user' | 'seller' | 'admin';

export interface ProtectedRoute {
  path: string;
  requireAuth: boolean;
  requiredRole?: UserRole;
  description?: string;
}

/**
 * 인증이 필요한 라우트 목록
 */
export const PROTECTED_ROUTES: ProtectedRoute[] = [
  // 고객 페이지 (로그인 필요)
  {
    path: '/cart',
    requireAuth: true,
    description: '장바구니',
  },
  {
    path: '/checkout',
    requireAuth: true,
    description: '주문/결제',
  },
  {
    path: '/my',
    requireAuth: true,
    description: '마이페이지',
  },
  {
    path: '/my/orders',
    requireAuth: true,
    description: '주문 내역',
  },
  {
    path: '/my/shipping-address',
    requireAuth: true,
    description: '배송지 관리',
  },
  {
    path: '/my/shipping',
    requireAuth: true,
    description: '배송 조회',
  },
  {
    path: '/my/claims',
    requireAuth: true,
    description: '취소/교환/반품',
  },
  {
    path: '/my/cancel',
    requireAuth: true,
    description: '주문 취소',
  },
  {
    path: '/my/reviews',
    requireAuth: true,
    description: '리뷰 관리',
  },
  {
    path: '/my/coupons',
    requireAuth: true,
    description: '쿠폰',
  },
  {
    path: '/my/points',
    requireAuth: true,
    description: '포인트',
  },
  {
    path: '/my/payments',
    requireAuth: true,
    description: '결제 수단',
  },
  {
    path: '/my/notifications',
    requireAuth: true,
    description: '알림',
  },
  {
    path: '/my/settings',
    requireAuth: true,
    description: '설정',
  },
  {
    path: '/likes',
    requireAuth: true,
    description: '찜한 상품',
  },
  {
    path: '/order-complete',
    requireAuth: true,
    description: '주문 완료',
  },

  // 판매자 페이지 (seller 역할 필요)
  {
    path: '/seller',
    requireAuth: true,
    requiredRole: 'seller',
    description: '판매자 대시보드',
  },
  {
    path: '/seller/register',
    requireAuth: true,
    requiredRole: 'seller',
    description: '판매자 등록',
  },
  {
    path: '/seller/products',
    requireAuth: true,
    requiredRole: 'seller',
    description: '상품 관리',
  },
  {
    path: '/seller/products/new',
    requireAuth: true,
    requiredRole: 'seller',
    description: '상품 등록',
  },
  {
    path: '/seller/products/edit',
    requireAuth: true,
    requiredRole: 'seller',
    description: '상품 수정',
  },
  {
    path: '/seller/orders',
    requireAuth: true,
    requiredRole: 'seller',
    description: '주문 관리',
  },
  {
    path: '/seller/reviews',
    requireAuth: true,
    requiredRole: 'seller',
    description: '리뷰 관리',
  },
  {
    path: '/seller/analytics',
    requireAuth: true,
    requiredRole: 'seller',
    description: '분석',
  },
  {
    path: '/seller/settlement',
    requireAuth: true,
    requiredRole: 'seller',
    description: '정산',
  },
  {
    path: '/seller/production',
    requireAuth: true,
    requiredRole: 'seller',
    description: '생산 관리',
  },
  {
    path: '/seller/production/settings',
    requireAuth: true,
    requiredRole: 'seller',
    description: '생산 설정',
  },
  {
    path: '/seller/production/manage',
    requireAuth: true,
    requiredRole: 'seller',
    description: '생산 관리',
  },
  {
    path: '/seller/production/status',
    requireAuth: true,
    requiredRole: 'seller',
    description: '생산 현황',
  },
  {
    path: '/seller/apply',
    requireAuth: true,
    requiredRole: 'seller',
    description: '판매자 신청',
  },

  // 관리자 페이지 (admin 역할 필요)
  {
    path: '/admin',
    requireAuth: true,
    requiredRole: 'admin',
    description: '관리자 대시보드',
  },
];

/**
 * 특정 경로가 보호된 라우트인지 확인
 * @param pathname 현재 경로
 * @returns 보호 설정 또는 null
 */
export function getProtectedRoute(pathname: string): ProtectedRoute | null {
  // 정확히 일치하는 경로 우선 검색
  const exactMatch = PROTECTED_ROUTES.find((route) => route.path === pathname);
  if (exactMatch) return exactMatch;

  // startsWith로 하위 경로 검색 (예: /admin/users는 /admin에 매칭)
  const prefixMatch = PROTECTED_ROUTES.find((route) =>
    pathname.startsWith(route.path + '/')
  );
  if (prefixMatch) return prefixMatch;

  return null;
}

/**
 * 사용자가 특정 경로에 접근 가능한지 확인
 * @param pathname 접근하려는 경로
 * @param userRole 사용자 역할 (없으면 미인증)
 * @returns { allowed: boolean, reason?: string }
 */
export function checkRouteAccess(
  pathname: string,
  userRole?: UserRole
): { allowed: boolean; reason?: string } {
  const route = getProtectedRoute(pathname);

  // 보호되지 않은 라우트는 누구나 접근 가능
  if (!route) {
    return { allowed: true };
  }

  // 인증 필요한데 로그인 안 됨
  if (route.requireAuth && !userRole) {
    return { allowed: false, reason: 'login_required' };
  }

  // 특정 역할 필요한데 역할이 다름
  if (route.requiredRole && route.requiredRole !== userRole) {
    return { allowed: false, reason: 'insufficient_role' };
  }

  return { allowed: true };
}

/**
 * 역할별로 접근 가능한 라우트 목록 반환
 * @param userRole 사용자 역할
 * @returns 접근 가능한 라우트 배열
 */
export function getAccessibleRoutes(userRole?: UserRole): ProtectedRoute[] {
  if (!userRole) {
    // 미인증 사용자는 보호되지 않은 라우트만 접근 가능
    return [];
  }

  return PROTECTED_ROUTES.filter((route) => {
    if (!route.requireAuth) return true;
    if (!route.requiredRole) return true; // 로그인만 필요
    return route.requiredRole === userRole;
  });
}