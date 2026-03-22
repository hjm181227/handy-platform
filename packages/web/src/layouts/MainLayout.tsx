import React from 'react';
import { useMiniRouter } from '../utils';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';
import { AlertProvider } from '../components/common';
import { TopDarkNav } from '../components/layout/TopDarkNav';
import { MainHeader } from '../components/layout/MainHeader';
import { MobilePageHeader } from '../components/layout/MobilePageHeader';
import { FooterMega } from '../components/layout/Footer';
import { CartDrawer } from '../components/layout/Drawers';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { CategoryModal } from '../components/common/CategoryModal';
import { ToastNotification } from '../components/common/ToastNotification';
import { useUnreadNotificationCount } from '../components/common/NotificationBell';

interface MainLayoutProps {
  children: React.ReactNode;
  /** 현재 경로 */
  pathname: string;
  /** 헤더 숨김 여부 */
  hideHeader?: boolean;
  /** 푸터 숨김 여부 */
  hideFooter?: boolean;
}

/**
 * 메인 레이아웃 컴포넌트
 *
 * 기능:
 * - PC/모바일 반응형 헤더
 * - 푸터와 하단 네비게이션
 * - 장바구니 드로어
 * - 카테고리 모달
 * - 플로팅 채팅 버튼
 */
export function MainLayout({ children, pathname, hideHeader = false, hideFooter = false }: MainLayoutProps) {
  const { nav } = useMiniRouter();
  const { currentUser, authLoading, setUser } = useAuth();
  const { showToast } = useToast();
  const {
    cartCount,
    drawerOpen: drawer,
    categoryModalOpen: catOpen,
    loadCartCount,
    handleCheckout,
    handleCartClick,
    closeDrawer,
    openCategoryModal,
    closeCategoryModal,
  } = useCart();

  // 알림 미읽음 수
  const { count: notificationCount } = useUnreadNotificationCount();

  // 페이지 타입 판단
  const isHomePage = pathname === '/';
  const isChatPage = pathname === '/chat' || pathname.startsWith('/chat/');

  // 채팅 버튼 클릭 핸들러
  const handleChatButtonClick = () => {
    nav('/chat');
  };

  // 모바일 헤더 설정 결정
  const getMobileHeaderProps = () => {
    // 카테고리 페이지 - CategoryModal이 자체 헤더 관리
    if (pathname === '/category') {
      return null;
    }
    // 스냅 페이지
    if (pathname.startsWith('/snap')) {
      return {
        title: 'SNAP',
        showChat: true,
        showNotification: true,
        notificationCount,
        showSearch: true,
        searchPlaceholder: '스냅 검색',
        cartCount,
        onChat: handleChatButtonClick,
        onNotification: () => nav('/my/notifications'),
        onGo: nav
      };
    }
    // 좋아요 페이지
    if (pathname.startsWith('/likes')) {
      return {
        title: '찜한 목록',
        showChat: true,
        showCart: true,
        cartCount,
        onChat: handleChatButtonClick,
        onCart: handleCartClick,
        onGo: nav
      };
    }
    // 마이페이지 (메인 페이지만)
    if (pathname === '/my') {
      return {
        title: '마이페이지',
        showChat: true,
        showSettings: true,
        showCart: true,
        cartCount,
        onChat: handleChatButtonClick,
        onSettings: () => nav('/my/settings'),
        onCart: handleCartClick,
        onGo: nav
      };
    }
    // 상품 상세 페이지
    if (pathname.startsWith('/product/')) {
      return {
        showBack: true,
        showHome: true,
        showChat: true,
        showSearch: true,
        showCart: true,
        cartCount,
        onBack: () => history.back(),
        onHome: () => nav('/'),
        onChat: handleChatButtonClick,
        onSearch: () => {},
        onCart: handleCartClick,
        onGo: nav
      };
    }
    // 장바구니 페이지
    if (pathname.startsWith('/cart')) {
      return {
        title: '장바구니',
        showBack: true,
        showHome: true,
        showChat: true,
        cartCount,
        onBack: () => history.back(),
        onHome: () => nav('/'),
        onChat: handleChatButtonClick,
        onGo: nav
      };
    }
    // 랭킹 페이지
    if (pathname.startsWith('/ranking')) {
      return {
        title: '랭킹',
        showBack: true,
        onBack: () => nav('/'),
        onGo: nav
      };
    }
    // 브랜드 페이지
    if (pathname.startsWith('/brands')) {
      return {
        title: '브랜드',
        showBack: true,
        onBack: () => nav('/'),
        onGo: nav
      };
    }
    // 신상품 페이지
    if (pathname.startsWith('/new')) {
      return {
        title: '신상품',
        showBack: true,
        onBack: () => nav('/'),
        onGo: nav
      };
    }
    // 추천 페이지
    if (pathname.startsWith('/recommend')) {
      return {
        title: '추천',
        showBack: true,
        onBack: () => nav('/'),
        onGo: nav
      };
    }
    return null;
  };

  const mobileHeaderProps = getMobileHeaderProps();

  return (
    <AlertProvider>
      {/* 전체 컨테이너: flex 구조로 sticky 헤더 작동 */}
      <div className="flex flex-col min-h-screen">
        {/* 헤더 */}
        {!hideHeader && (
          <>
            {/* PC 헤더 - TopDarkNav + MainHeader */}
            <div className="handy-sticky-header hidden md:block" data-apphide={isHomePage ? "false" : "true"}>
              <TopDarkNav onOpenCategories={openCategoryModal} onGo={nav} />
              <MainHeader
                cartCount={cartCount}
                onCart={handleCartClick}
                onGo={nav}
                currentPath={pathname}
                onAuthStateChange={setUser}
                authLoading={authLoading}
                onCategoryOpen={openCategoryModal}
              />
            </div>

            {/* 모바일 헤더 (페이지별) */}
            {isHomePage && (
              <div className="handy-sticky-header block md:hidden">
                <MainHeader
                  cartCount={cartCount}
                  onCart={handleCartClick}
                  onGo={nav}
                  currentPath={pathname}
                  onAuthStateChange={setUser}
                  authLoading={authLoading}
                  onCategoryOpen={openCategoryModal}
                  onChat={handleChatButtonClick}
                />
              </div>
            )}
            {mobileHeaderProps && (
              <MobilePageHeader className="block md:hidden" {...mobileHeaderProps} />
            )}
          </>
        )}

        {/* 본문 콘텐츠 */}
        <div className="flex-1">
          {children}
        </div>
      </div>

      {/* 푸터와 드로어 */}
      {!hideFooter && !isChatPage && (
        <>
          <FooterMega onGo={nav} />
          <CartDrawer
            open={drawer}
            onClose={closeDrawer}
            onCheckout={handleCheckout}
            onCartUpdate={loadCartCount}
            currentUser={currentUser}
            showToast={showToast}
          />
          <CategoryModal
            isOpen={catOpen}
            onClose={closeCategoryModal}
            onNavigate={nav}
          />
          <MobileBottomNav
            currentPath={pathname}
            onGo={nav}
            onCategoryOpen={openCategoryModal}
          />
        </>
      )}

      {/* Toast Notification */}
      <ToastNotification />
    </AlertProvider>
  );
}
