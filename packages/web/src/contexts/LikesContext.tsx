import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { likesService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useAuthModal } from './AuthModalContext';

export interface LikesContextType {
  /** 좋아요한 상품 UUID 목록 */
  likedProducts: string[];
  /** 좋아요한 브랜드 UUID 목록 */
  likedBrands: string[];
  /** 상품 좋아요 토글 */
  handleLike: (productId: string) => Promise<void>;
  /** 브랜드 좋아요 토글 */
  handleBrandLike: (brandId: string) => Promise<void>;
  /** 상품 좋아요 여부 확인 */
  isProductLiked: (productId: string) => boolean;
  /** 브랜드 좋아요 여부 확인 */
  isBrandLiked: (brandId: string) => boolean;
  /** 좋아요 목록 새로고침 */
  refreshLikes: () => Promise<void>;
}

export const LikesContext = createContext<LikesContextType | null>(null);

interface LikesProviderProps {
  children: ReactNode;
}

/**
 * 전역 좋아요 상태 관리 Provider
 *
 * 기능:
 * - 상품/브랜드 좋아요 상태 관리
 * - 낙관적 업데이트 (즉시 UI 반영)
 * - 실패 시 자동 롤백
 */
export const LikesProvider: React.FC<LikesProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { openLogin } = useAuthModal();

  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [likedBrands, setLikedBrands] = useState<string[]>([]);

  /**
   * 좋아요한 상품 목록 로딩
   */
  const loadLikedProducts = useCallback(async () => {
    try {
      const response = await likesService.getUserLikes('product');
      if (response.success && response.data) {
        const likedUuids = response.data.map(item => item.targetUuid);
        setLikedProducts(likedUuids);
      }
    } catch (error: any) {
      console.warn('Failed to load liked products:', error);
      setLikedProducts([]);
    }
  }, []);

  /**
   * 좋아요한 브랜드 목록 로딩
   */
  const loadLikedBrands = useCallback(async () => {
    try {
      const response = await likesService.getUserLikes('brand');
      if (response.success && response.data) {
        const likedUuids = response.data.map(item => item.targetUuid);
        setLikedBrands(likedUuids);
      }
    } catch (error: any) {
      console.warn('Failed to load liked brands:', error);
      setLikedBrands([]);
    }
  }, []);

  /**
   * 좋아요 목록 새로고침
   */
  const refreshLikes = useCallback(async () => {
    await Promise.all([loadLikedProducts(), loadLikedBrands()]);
  }, [loadLikedProducts, loadLikedBrands]);

  /**
   * 상품 좋아요 토글 (낙관적 업데이트)
   */
  const handleLike = useCallback(async (productId: string) => {
    // 로그인 확인
    if (!currentUser) {
      openLogin();
      return;
    }

    const isCurrentlyLiked = likedProducts.includes(productId);

    // 1. 낙관적 업데이트 (즉시 UI 변경)
    setLikedProducts(prev => {
      if (isCurrentlyLiked) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });

    try {
      // 2. API 호출
      if (isCurrentlyLiked) {
        await likesService.unlike('product', productId);
      } else {
        await likesService.like('product', productId);
      }
      // 성공 - 이미 낙관적 업데이트 완료
    } catch (error: any) {
      console.error('Like operation failed:', error);

      // 3. 실패 시 롤백
      setLikedProducts(prev => {
        if (isCurrentlyLiked) {
          return [...prev, productId];
        } else {
          return prev.filter(id => id !== productId);
        }
      });

      const errorMessage = error.message || '좋아요 처리에 실패했습니다.';
      showToast(errorMessage, 'error');
    }
  }, [currentUser, likedProducts, showToast, openLogin]);

  /**
   * 브랜드 좋아요 토글 (낙관적 업데이트)
   */
  const handleBrandLike = useCallback(async (brandId: string) => {
    // 로그인 확인
    if (!currentUser) {
      openLogin();
      return;
    }

    const isCurrentlyLiked = likedBrands.includes(brandId);

    // 1. 낙관적 업데이트
    setLikedBrands(prev => {
      if (isCurrentlyLiked) {
        return prev.filter(id => id !== brandId);
      } else {
        return [...prev, brandId];
      }
    });

    try {
      // 2. API 호출
      if (isCurrentlyLiked) {
        await likesService.unlike('brand', brandId);
      } else {
        await likesService.like('brand', brandId);
      }
      // 성공 - 이미 낙관적 업데이트 완료
    } catch (error: any) {
      console.error('Brand like operation failed:', error);

      // 3. 실패 시 롤백
      setLikedBrands(prev => {
        if (isCurrentlyLiked) {
          return [...prev, brandId];
        } else {
          return prev.filter(id => id !== brandId);
        }
      });

      const errorMessage = error.message || '좋아요 처리에 실패했습니다.';
      showToast(errorMessage, 'error');
    }
  }, [currentUser, likedBrands, showToast, openLogin]);

  /**
   * 상품 좋아요 여부 확인
   */
  const isProductLiked = useCallback((productId: string) => {
    return likedProducts.includes(productId);
  }, [likedProducts]);

  /**
   * 브랜드 좋아요 여부 확인
   */
  const isBrandLiked = useCallback((brandId: string) => {
    return likedBrands.includes(brandId);
  }, [likedBrands]);

  /**
   * 로그인 상태 변경 시 좋아요 목록 로딩
   */
  useEffect(() => {
    if (currentUser) {
      loadLikedProducts();
      loadLikedBrands();
    } else {
      setLikedProducts([]);
      setLikedBrands([]);
    }
  }, [currentUser, loadLikedProducts, loadLikedBrands]);

  const value: LikesContextType = {
    likedProducts,
    likedBrands,
    handleLike,
    handleBrandLike,
    isProductLiked,
    isBrandLiked,
    refreshLikes,
  };

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
};
