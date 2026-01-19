import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { cartService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useMiniRouter } from '../utils';
import { useResponsiveCart } from '../hooks/useResponsiveCart';
import { useAuthModal } from './AuthModalContext';

export interface CartContextType {
  /** 장바구니 아이템 수 */
  cartCount: number;
  /** PC용 장바구니 Drawer 열림 상태 */
  drawerOpen: boolean;
  /** 카테고리 모달 열림 상태 */
  categoryModalOpen: boolean;
  /** 장바구니 개수 새로고침 */
  loadCartCount: () => Promise<void>;
  /** 장바구니에 상품 추가 */
  addToCart: (productId: string, options?: Record<string, string>) => Promise<void>;
  /** 체크아웃 진행 */
  handleCheckout: () => Promise<void>;
  /** 장바구니 버튼 클릭 핸들러 (반응형) */
  handleCartClick: () => void;
  /** Drawer 열기 */
  openDrawer: () => void;
  /** Drawer 닫기 */
  closeDrawer: () => void;
  /** 카테고리 모달 열기 */
  openCategoryModal: () => void;
  /** 카테고리 모달 닫기 */
  closeCategoryModal: () => void;
}

export const CartContext = createContext<CartContextType | null>(null);

interface CartProviderProps {
  children: ReactNode;
}

/**
 * 전역 장바구니 상태 관리 Provider
 *
 * 기능:
 * - 장바구니 개수 관리
 * - 장바구니 추가/체크아웃
 * - PC/모바일 반응형 장바구니 UI 관리
 * - 카테고리 모달 상태 관리
 */
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { nav } = useMiniRouter();
  const { isMobile } = useResponsiveCart();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { openLogin } = useAuthModal();

  const [cartCount, setCartCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  /**
   * 장바구니 개수 로딩 (로그인된 사용자만)
   */
  const loadCartCount = useCallback(async () => {
    console.log('🔄 [CartContext] loadCartCount started');
    try {
      const response = await cartService.getCartCount();
      console.log('📦 [CartContext] API Response:', response);

      if (response.success && response.data) {
        const newCount = response.data.count || 0;
        console.log('✅ [CartContext] Setting count to:', newCount);
        setCartCount(newCount);
      } else {
        console.warn('⚠️ [CartContext] Invalid response, setting count to 0');
        setCartCount(0);
      }
    } catch (error) {
      console.error('❌ [CartContext] loadCartCount error:', error);
      setCartCount(0);
    }
  }, []);

  /**
   * 장바구니에 상품 추가 (로그인된 사용자만)
   */
  const addToCart = useCallback(async (productId: string, options?: Record<string, string>) => {
    // 로그인 확인
    if (!currentUser) {
      openLogin();
      return;
    }

    try {
      const response = await cartService.addToCart(productId, 1, options || {});
      if (response.success) {
        await loadCartCount(); // 카운트 새로고침
      } else {
        throw new Error('장바구니 추가에 실패했습니다.');
      }

      // 성공 피드백
      const message = options ? `선택한 옵션과 함께 장바구니에 담았어요` : `장바구니에 담았어요`;
      showToast(message, 'success');
    } catch (error: any) {
      console.error('Add to cart failed:', error);
      const errorMessage = error.message || '장바구니 추가에 실패했습니다.';
      showToast(errorMessage, 'error');
    }
  }, [currentUser, showToast, nav, loadCartCount]);

  /**
   * 체크아웃 처리
   */
  const handleCheckout = useCallback(async () => {
    // 로그인 확인
    if (!currentUser) {
      openLogin();
      return;
    }

    try {
      // 장바구니 데이터 가져오기
      const cartResponse = await cartService.getCart();
      console.log('🛒 [CartContext] Cart response:', cartResponse);

      if (!cartResponse.success || !cartResponse.data) {
        showToast('장바구니 정보를 불러올 수 없습니다.', 'error');
        return;
      }

      // 실제 서버 응답 구조: data.itemsBySeller[] 또는 data.cart
      const cartData = cartResponse.data;
      const itemsBySeller = (cartData as any).itemsBySeller || (cartData as any).cart?.itemsBySeller;

      // 장바구니가 비어있는지 확인
      if (!itemsBySeller || itemsBySeller.length === 0) {
        showToast('장바구니가 비어있습니다.', 'error');
        return;
      }

      console.log('✅ [CartContext] Navigating to cart checkout');

      // 장바구니 체크아웃은 서버가 장바구니를 직접 읽으므로 sessionStorage 불필요
      // mode 파라미터로 체크아웃 방식 구분
      nav('/checkout?mode=cart');
      setDrawerOpen(false);

      // WebView 환경에서 네이티브 알림
      try {
        (window as any).ReactNativeWebView?.postMessage(JSON.stringify({type:"checkout"}));
      } catch {}

    } catch (error: any) {
      console.error('❌ [CartContext] handleCheckout error:', error);
      showToast(error.message || '체크아웃 진행 중 오류가 발생했습니다.', 'error');
    }
  }, [currentUser, showToast, nav]);

  /**
   * 장바구니 클릭 핸들러 (반응형, 로그인된 사용자만)
   */
  const handleCartClick = useCallback(() => {
    // 로그인 확인
    if (!currentUser) {
      openLogin();
      return;
    }

    if (isMobile) {
      nav('/cart'); // 모바일: 페이지로 이동
    } else {
      setDrawerOpen(true); // PC: Drawer 열기
    }
  }, [currentUser, isMobile, openLogin, nav]);

  /**
   * 로그인 상태 변경 시 장바구니 로딩
   */
  useEffect(() => {
    if (currentUser) {
      loadCartCount();
    } else {
      setCartCount(0);
    }
  }, [currentUser, loadCartCount]);

  const value: CartContextType = {
    cartCount,
    drawerOpen,
    categoryModalOpen,
    loadCartCount,
    addToCart,
    handleCheckout,
    handleCartClick,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    openCategoryModal: () => setCategoryModalOpen(true),
    closeCategoryModal: () => setCategoryModalOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
