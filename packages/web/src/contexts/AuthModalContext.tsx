import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

// 모달 뷰 타입
export type AuthModalView = 'login' | 'signup' | 'email-login' | null;

interface AuthModalContextType {
  isOpen: boolean;
  currentView: AuthModalView;
  openLogin: () => void;
  openSignup: () => void;
  openEmailLogin: () => void;
  close: () => void;
  setView: (view: AuthModalView) => void;
}

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AuthModalView>(null);

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

  const close = useCallback(() => {
    setIsOpen(false);
    // 애니메이션 완료 후 뷰 초기화
    setTimeout(() => setCurrentView(null), 300);
  }, []);

  const setView = useCallback((view: AuthModalView) => {
    if (view === null) {
      close();
    } else {
      setCurrentView(view);
      setIsOpen(true);
    }
  }, [close]);

  // 뒤로가기 버튼 처리 (히스토리 조작 없이)
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = () => {
      // 모달이 열려있을 때 뒤로가기하면 모달 닫기
      close();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, close]);

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
        openLogin,
        openSignup,
        openEmailLogin,
        close,
        setView,
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
