import React, { useEffect, useRef, useState } from 'react';
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
  const { currentUser, authLoading, refreshUser } = useAuth();
  const { nav } = useMiniRouter();
  const { alert } = useAlert();
  const hasShownAlert = useRef(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // 인증 확인이 완료되고 사용자가 없으면
    if (!authLoading && !currentUser && !hasShownAlert.current && !retrying) {
      // localStorage에 토큰이 있는지 직접 확인 (AuthContext 동기화 지연 방어)
      const token = localStorage.getItem('accessToken');
      if (token) {
        console.log('[RequireAuth] AuthContext has no user but token exists in localStorage, retrying...');
        setRetrying(true);
        // AuthContext에 사용자 정보 재로드 요청
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        // 잠시 후 다시 확인
        setTimeout(() => setRetrying(false), 1000);
        return;
      }

      hasShownAlert.current = true;
      console.warn('[RequireAuth] User not authenticated, redirecting to:', fallbackPath);

      // Alert 표시 후 로그인 페이지로 이동
      alert('로그인이 필요합니다').then(() => {
        nav(fallbackPath);
      });
    }
  }, [authLoading, currentUser, fallbackPath, nav, alert, retrying]);

  // 인증 확인 중 또는 재시도 중
  if (authLoading || retrying) {
    return <LoadingScreen />;
  }

  // 미인증 사용자 - null 반환 (alert가 표시되고 리다이렉트됨)
  if (!currentUser) {
    return null;
  }

  // 인증된 사용자
  return <>{children}</>;
};
