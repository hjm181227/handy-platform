import { useContext } from 'react';
import { LikesContext, LikesContextType } from '../contexts/LikesContext';

/**
 * 좋아요 훅
 *
 * 사용법:
 * ```tsx
 * const { likedProducts, handleLike, isProductLiked } = useLikes();
 *
 * // 좋아요 토글
 * handleLike('product-uuid');
 *
 * // 좋아요 여부 확인
 * const isLiked = isProductLiked('product-uuid');
 *
 * // 브랜드 좋아요
 * handleBrandLike('brand-uuid');
 * ```
 */
export function useLikes(): LikesContextType {
  const context = useContext(LikesContext);
  if (!context) {
    throw new Error('useLikes must be used within LikesProvider');
  }
  return context;
}
