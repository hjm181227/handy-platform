import { useContext } from 'react';
import { CartContext, CartContextType } from '../contexts/CartContext';

/**
 * 장바구니 훅
 *
 * 사용법:
 * ```tsx
 * const { cartCount, addToCart, handleCheckout } = useCart();
 *
 * // 장바구니에 추가
 * addToCart('product-uuid');
 *
 * // 옵션과 함께 추가
 * addToCart('product-uuid', { size: 'M', color: 'blue' });
 *
 * // 체크아웃
 * handleCheckout();
 *
 * // 장바구니 버튼 클릭 (반응형)
 * handleCartClick();
 * ```
 */
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
