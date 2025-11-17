import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMiniRouter } from '../../utils';
import { useAlert } from '../common';
import { LoadingScreen } from './LoadingScreen';

type UserRole = 'user' | 'seller' | 'admin';

interface RequireRoleProps {
  /** 렌더링할 자식 컴포넌트 */
  children: React.ReactNode;
  /** 필요한 역할 */
  requiredRole: UserRole;
  /** 권한 부족 시 리다이렉트할 경로 (기본값: /) */
  fallbackPath?: string;
  /** 미인증 시 리다이렉트할 경로 (기본값: /login) */
  loginPath?: string;
}

const roleNames: Record<UserRole, string> = {
  user: '일반 사용자',
  seller: '판매자',
  admin: '관리자',
};

/**
 * 특정 역할이 필요한 페이지를 감싸는 가드 컴포넌트
 *
 * @example 판매자 전용 페이지
 * ```tsx
 * <RequireRole requiredRole="seller">
 *   <SellerDashboard />
 * </RequireRole>
 * ```
 *
 * @example 관리자 전용 페이지
 * ```tsx
 * <RequireRole requiredRole="admin" fallbackPath="/">
 *   <AdminPanel />
 * </RequireRole>
 * ```
 */
export const RequireRole: React.FC<RequireRoleProps> = ({
  children,
  requiredRole,
  fallbackPath = '/',
  loginPath = '/login',
}) => {
  const { currentUser, authLoading, checkRole } = useAuth();
  const { nav } = useMiniRouter();
  const { alert } = useAlert();
  const hasShownAlert = useRef(false);

  useEffect(() => {
    if (authLoading || hasShownAlert.current) return;

    // 미인증 사용자 → 로그인 페이지로
    if (!currentUser) {
      hasShownAlert.current = true;
      console.warn('[RequireRole] User not authenticated, redirecting to:', loginPath);
      alert('로그인이 필요합니다').then(() => {
        nav(loginPath);
      });
      return;
    }

    // 권한 부족 → fallbackPath로
    if (!checkRole(requiredRole)) {
      hasShownAlert.current = true;
      console.warn(
        `[RequireRole] User role "${currentUser.role}" does not match required role "${requiredRole}", redirecting to:`,
        fallbackPath
      );
      alert(`${roleNames[requiredRole]} 권한이 필요합니다`).then(() => {
        nav(fallbackPath);
      });
    }
  }, [authLoading, currentUser, requiredRole, checkRole, loginPath, fallbackPath, nav, alert]);

  // 인증 확인 중
  if (authLoading) {
    return <LoadingScreen />;
  }

  // 미인증 사용자 또는 권한 부족 - null 반환 (alert가 표시되고 리다이렉트됨)
  if (!currentUser || !checkRole(requiredRole)) {
    return null;
  }

  // 권한 있음
  return <>{children}</>;
};
