import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CartProvider } from './contexts/CartContext';
import { LikesProvider } from './contexts/LikesContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { AlertProvider } from './components/common';
import { ToastNotification } from './components/common/ToastNotification';
import { AuthModal } from './components/auth/AuthModal';
import { Router } from './Router';

/**
 * 메인 앱 컴포넌트
 *
 * 구조:
 * - AuthProvider: 인증 상태 관리
 * - ToastProvider: 토스트 알림 관리
 * - AuthModalProvider: 로그인 모달 관리 (Cart/Likes에서 사용하므로 상위에 배치)
 * - CartProvider: 장바구니 상태 관리
 * - LikesProvider: 좋아요 상태 관리
 * - AlertProvider: 알림 다이얼로그 관리
 * - Router: 라우팅 및 화면 렌더링
 * - ToastNotification: 전역 토스트 UI
 */
export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <AuthModalProvider>
            <CartProvider>
              <LikesProvider>
                <AlertProvider>
                  <Router />
                  <ToastNotification />
                  <AuthModal />
                </AlertProvider>
              </LikesProvider>
            </CartProvider>
          </AuthModalProvider>
        </ToastProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
