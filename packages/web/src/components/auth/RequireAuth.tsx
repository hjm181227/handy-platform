import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMiniRouter } from '../../utils';
import { useAlert } from '../common';
import { LoadingScreen } from './LoadingScreen';

interface RequireAuthProps {
  /** 렌더링할 자식 컴포넌트 */
  children: React.ReactNode;
  /** 미인증 시 리다이렉트할 경로 (기본값: /login) */
  fallbackPath?: string;
}

/**
 * 로그인이 필요한 페이지를 감싸는 가드 컴포넌트
 *
 * @example
 * ```tsx
 * <RequireAuth>
 *   <MyPage />
 * </RequireAuth>
 * ```
 *
 * @example 커스텀 리다이렉트 경로
 * ```tsx
 * <RequireAuth fallbackPath="/welcome">
 *   <ProfilePage />
 * </RequireAuth>
 * ```
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  fallbackPath = '/login',
}) => {
  const { currentUser, authLoading } = useAuth();
  const { nav } = useMiniRouter();
  const { alert } = useAlert();
  const hasShownAlert = useRef(false);

  useEffect(() => {
    // 인증 확인이 완료되고 사용자가 없으면 알림 후 리다이렉트
    if (!authLoading && !currentUser && !hasShownAlert.current) {
      hasShownAlert.current = true;
      console.warn('[RequireAuth] User not authenticated, redirecting to:', fallbackPath);

      // Alert 표시 후 로그인 페이지로 이동
      alert('로그인이 필요합니다').then(() => {
        nav(fallbackPath);
      });
    }
  }, [authLoading, currentUser, fallbackPath, nav, alert]);

  // 인증 확인 중
  if (authLoading) {
    return <LoadingScreen />;
  }

  // 미인증 사용자 - null 반환 (alert가 표시되고 리다이렉트됨)
  if (!currentUser) {
    return null;
  }

  // 인증된 사용자
  return <>{children}</>;
};
