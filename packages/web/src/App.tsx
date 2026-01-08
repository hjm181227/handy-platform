import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CartProvider } from './contexts/CartContext';
import { LikesProvider } from './contexts/LikesContext';
import { AlertProvider } from './components/common';
import { ToastNotification } from './components/common/ToastNotification';
import { FloatingChatButton } from './components/common/FloatingChatButton';
import { Router } from './Router';
import { useMiniRouter } from './utils';

/**
 * 플로팅 버튼 컨테이너
 * Router 외부에서 nav 함수에 접근하기 위한 래퍼
 */
function FloatingButtonsContainer() {
  const { nav } = useMiniRouter();

  const handleChatButtonClick = () => {
    nav('/chat');
  };

  return <FloatingChatButton onClick={handleChatButtonClick} />;
}

/**
 * 메인 앱 컴포넌트
 *
 * 구조:
 * - AuthProvider: 인증 상태 관리
 * - ToastProvider: 토스트 알림 관리
 * - CartProvider: 장바구니 상태 관리
 * - LikesProvider: 좋아요 상태 관리
 * - AlertProvider: 알림 다이얼로그 관리
 * - Router: 라우팅 및 화면 렌더링
 * - ToastNotification: 전역 토스트 UI
 * - FloatingChatButton: 플로팅 채팅 버튼
 */
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <LikesProvider>
            <AlertProvider>
              <Router />
              <ToastNotification />
              <FloatingButtonsContainer />
            </AlertProvider>
          </LikesProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
