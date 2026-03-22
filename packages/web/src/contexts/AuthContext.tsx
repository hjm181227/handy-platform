import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@handy-platform/shared';
import { webApiService } from '../services/apiService';

export interface AuthContextType {
  /** 현재 로그인한 사용자 */
  currentUser: User | null;
  /** 인증 상태 확인 중 여부 */
  authLoading: boolean;
  /** 로그인 여부 */
  isAuthenticated: boolean;
  /** 특정 역할 체크 */
  checkRole: (role: 'user' | 'seller' | 'admin') => boolean;
  /** 사용자 정보 갱신 */
  refreshUser: () => Promise<void>;
  /** 로그아웃 */
  logout: () => Promise<void>;
  /** 로그인 (외부에서 호출 후 상태 동기화용) */
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 전역 인증 상태 관리 Provider
 *
 * 기능:
 * - localStorage와 동기화된 사용자 상태 관리
 * - authStateChanged 이벤트 리스닝
 * - 자동 사용자 정보 갱신 (5분마다)
 * - 토큰 만료 처리
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  /**
   * localStorage에서 사용자 정보 로드 (토큰 유효성 확인 포함)
   */
  const loadUserFromStorage = useCallback(async () => {
    try {
      // 토큰이 유효한 경우에만 사용자 정보 로드
      const isAuth = await webApiService.isAuthenticated();
      if (!isAuth) {
        setCurrentUser(null);
        return;
      }
      const user = await webApiService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('[AuthContext] Failed to load user from storage:', error);
      setCurrentUser(null);
    }
  }, []);

  /**
   * 서버에서 최신 사용자 정보 가져와서 갱신
   */
  const refreshUser = useCallback(async () => {
    if (!currentUser) return;

    try {
      const response = await webApiService.auth.getUserProfile();
      if (response.data?.user) {
        // localStorage 업데이트
        const currentToken = await webApiService.auth.getAuthToken();
        await webApiService.auth.setAuthToken(
          currentToken || '',
          response.data.user
        );
        setCurrentUser(response.data.user);
        console.log('[AuthContext] User data refreshed successfully');
      }
    } catch (error) {
      console.error('[AuthContext] Failed to refresh user data:', error);
      // 401 에러인 경우 로그아웃 처리는 BaseApiService에서 자동 처리됨
    }
  }, [currentUser]);

  /**
   * 로그아웃
   */
  const logout = useCallback(async () => {
    try {
      // 서버 로그아웃 + localStorage 정리
      await webApiService.logoutAndClearToken();
      setCurrentUser(null);

      // 다른 컴포넌트에 알림
      window.dispatchEvent(new CustomEvent('authStateChanged'));

      console.log('[AuthContext] Logout successful');
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
      // 실패해도 로컬 상태는 정리
      setCurrentUser(null);
    }
  }, []);

  /**
   * 역할 체크
   */
  const checkRole = useCallback(
    (role: 'user' | 'seller' | 'admin'): boolean => {
      if (!currentUser) return false;
      return currentUser.role === role;
    },
    [currentUser]
  );

  /**
   * 외부에서 사용자 설정 (로그인 후 호출용)
   */
  const setUser = useCallback((user: User | null) => {
    setCurrentUser(user);
  }, []);

  /**
   * 초기 인증 상태 로드
   */
  useEffect(() => {
    const initializeAuth = async () => {
      setAuthLoading(true);

      // WebView 환경이면 네이티브에서 토큰 동기화
      if ((window as any).ReactNativeWebView) {
        try {
          await webApiService.initializeFromNative();
        } catch (error) {
          console.error('[AuthContext] Failed to sync with native:', error);
        }
      }

      // localStorage에서 사용자 정보 로드
      await loadUserFromStorage();

      setAuthLoading(false);
    };

    initializeAuth();
  }, [loadUserFromStorage]);

  /**
   * authStateChanged 이벤트 리스닝
   * 다른 컴포넌트에서 로그인/로그아웃 시 상태 동기화
   */
  useEffect(() => {
    const handleAuthStateChanged = async () => {
      console.log('[AuthContext] Auth state changed event received');
      setAuthLoading(true);
      await loadUserFromStorage();
      setAuthLoading(false);
    };

    window.addEventListener('authStateChanged', handleAuthStateChanged);
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChanged);
    };
  }, [loadUserFromStorage]);

  /**
   * 주기적 사용자 정보 갱신 (5분마다)
   * 역할 변경, 포인트 변경 등을 자동으로 반영
   */
  useEffect(() => {
    if (!currentUser) return;

    console.log('[AuthContext] Starting periodic user data refresh (every 5 minutes)');

    const interval = setInterval(() => {
      console.log('[AuthContext] Refreshing user data...');
      refreshUser();
    }, 5 * 60 * 1000); // 5분

    return () => {
      console.log('[AuthContext] Stopping periodic user data refresh');
      clearInterval(interval);
    };
  }, [currentUser, refreshUser]);

  const value: AuthContextType = {
    currentUser,
    authLoading,
    isAuthenticated: !!currentUser,
    checkRole,
    refreshUser,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
