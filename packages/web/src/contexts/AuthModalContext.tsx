import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

// 모달 뷰 타입
export type AuthModalView = 'login' | 'signup' | 'email-login' | 'social-terms' | null;

// 소셜 로그인 신규 가입자 정보
export interface SocialNewUserInfo {
  provider: 'kakao' | 'google' | 'apple' | 'naver';
  userId: string;
  email?: string;
  name?: string;
  profileImage?: string;
}

interface AuthModalContextType {
  isOpen: boolean;
  currentView: AuthModalView;
  socialNewUser: SocialNewUserInfo | null;
  openLogin: () => void;
  openSignup: () => void;
  openEmailLogin: () => void;
  openSocialTerms: (userInfo: SocialNewUserInfo) => void;
  close: () => void;
  setView: (view: AuthModalView) => void;
  setSocialNewUser: (userInfo: SocialNewUserInfo | null) => void;
}

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AuthModalView>(null);
  const [socialNewUser, setSocialNewUser] = useState<SocialNewUserInfo | null>(null);

  const openLogin = useCallback(() => {
    setCurrentView('login');
    setIsOpen(true);
  }, []);

  const openSignup = useCallback(() => {
    setCurrentView('signup');
    setIsOpen(true);
  }, []);

  const openEmailLogin = useCallback(() => {
    setCurrentView('email-login');
    setIsOpen(true);
  }, []);

  const openSocialTerms = useCallback((userInfo: SocialNewUserInfo) => {
    setSocialNewUser(userInfo);
    setCurrentView('social-terms');
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // 애니메이션 완료 후 뷰 초기화
    setTimeout(() => {
      setCurrentView(null);
      setSocialNewUser(null);
    }, 300);
  }, []);

  const setView = useCallback((view: AuthModalView) => {
    if (view === null) {
      close();
    } else {
      setCurrentView(view);
      setIsOpen(true);
    }
  }, [close]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        currentView,
        socialNewUser,
        openLogin,
        openSignup,
        openEmailLogin,
        openSocialTerms,
        close,
        setView,
        setSocialNewUser,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return context;
}
