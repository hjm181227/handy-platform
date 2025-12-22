import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ProductCard } from '../product/ProductCard';
import { productService, brandService } from '../../services/apiService';
import type { Product, ProductsResponse, BrandDetail, ProductType } from '@handy-platform/shared';

// 브랜드별 이미지 매핑 및 테마 설정
interface BrandTheme {
  backgroundImage: string;
  mobileBackgroundImage?: string; // 모바일용 최적화된 이미지
  overlayGradient: string;
  primaryColor: string;
  description: string;
}

const BRAND_THEMES: Record<string, BrandTheme> = {
  'HANDY MADE': {
    backgroundImage: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    mobileBackgroundImage: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    overlayGradient: 'from-purple-600/80 to-pink-600/70',
    primaryColor: 'purple',
    description: '감성적이고 트렌디한 네일아트의 대표 브랜드'
  },
  'HANDY LAB': {
    backgroundImage: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    mobileBackgroundImage: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    overlayGradient: 'from-blue-600/80 to-indigo-600/70',
    primaryColor: 'blue',
    description: '혁신적인 기술과 연구를 바탕으로 한 프리미엄 네일 브랜드'
  },
  'HANDY CARE': {
    backgroundImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    mobileBackgroundImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    overlayGradient: 'from-green-600/80 to-emerald-600/70',
    primaryColor: 'green',
    description: '건강한 네일 케어를 위한 자연 친화적 브랜드'
  },
  'NAIL STUDIO': {
    backgroundImage: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    mobileBackgroundImage: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    overlayGradient: 'from-rose-600/80 to-pink-600/70',
    primaryColor: 'rose',
    description: '전문적인 네일 스튜디오의 노하우를 담은 프리미엄 컬렉션'
  },
  'CRYSTAL NAILS': {
    backgroundImage: 'https://images.unsplash.com/photo-1583001264273-55ff0d04b648?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    mobileBackgroundImage: 'https://images.unsplash.com/photo-1583001264273-55ff0d04b648?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    overlayGradient: 'from-violet-600/80 to-purple-600/70',
    primaryColor: 'violet',
    description: '크리스털처럼 투명하고 아름다운 네일아트의 정수'
  }
};

// 기본 fallback 테마
const DEFAULT_BRAND_THEME: BrandTheme = {
  backgroundImage: 'https://images.unsplash.com/photo-1607748862156-7c548e7e98f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  mobileBackgroundImage: 'https://images.unsplash.com/photo-1607748862156-7c548e7e98f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  overlayGradient: 'from-gray-600/80 to-slate-600/70',
  primaryColor: 'gray',
  description: '고품질 네일아트를 선사하는 프리미엄 브랜드'
};

export function BrandDetailPage({
  sellerUuid,
  onGo,
  onOpen,
  onAdd,
  onLike,
  likedProducts = [],
  onBrandLike,
  isBrandLiked = false
}: {
  sellerUuid: string;
  onGo: (to: string) => void;
  onOpen: (id: string) => void;
  onAdd: (id: string) => void;
  onLike?: (id: string) => void;
  likedProducts?: string[];
  onBrandLike?: (brandId: string) => void;
  isBrandLiked?: boolean;
}) {
  // 정렬 및 필터 상태
  const [sortBy, setSortBy] = useState<'popular' | 'price' | 'latest'>('popular');
  const [priceFilter, setPriceFilter] = useState<{ min: number; max: number } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [productTypeFilter, setProductTypeFilter] = useState<ProductType | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // 브랜드 정보 상태 (독립적)
  const [brandInfo, setBrandInfo] = useState<BrandDetail | null>(null);
  const [brandLoading, setBrandLoading] = useState(true);
  const [brandError, setBrandError] = useState<string | null>(null);
  
  // 상품 목록 상태 (독립적)
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 무한 스크롤을 위한 observer ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  // URL 디코딩 대신 seller UUID 사용
  const decodedSellerUuid = decodeURIComponent(sellerUuid);
  
  // 브랜드 테마 가져오기 (brandInfo의 브랜드명을 통해)
  const brandTheme = BRAND_THEMES[brandInfo?.brandName || ''] || DEFAULT_BRAND_THEME;
  
  // 반응형 이미지 선택
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const currentBackgroundImage = isMobile && brandTheme.mobileBackgroundImage 
    ? brandTheme.mobileBackgroundImage 
    : brandTheme.backgroundImage;
  
  // 이미지 preload를 위한 useEffect
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = currentBackgroundImage;
    link.as = 'image';
    document.head.appendChild(link);
    
    return () => {
      // 안전하게 제거
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [currentBackgroundImage]);

  // 브랜드 정보 가져오기 (독립적)
  useEffect(() => {
    const fetchBrandInfo = async () => {
      try {
        setBrandLoading(true);
        setBrandError(null);
        
        const response = await brandService.getBrandDetail(decodedSellerUuid);
        
        if (response.success && response.data) {
          setBrandInfo(response.data);
        } else {
          setBrandError('브랜드 정보를 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        console.error('Brand info fetch error:', err);
        setBrandError('브랜드 정보를 불러오는 데 오류가 발생했습니다.');
      } finally {
        setBrandLoading(false);
      }
    };

    fetchBrandInfo();
  }, [decodedSellerUuid]);

  // 상품 목록 가져오기 함수
  const fetchProducts = useCallback(async (page: number, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setProductsLoading(true);
        setProductsError(null);
      }

      const filters = {
        sellerUuid: decodedSellerUuid,
        page: page.toString(),
        limit: '20',
        ...(priceFilter && {
          minPrice: priceFilter.min.toString(),
          maxPrice: priceFilter.max.toString()
        }),
        ...(categoryFilter && { search: categoryFilter }),
        ...(productTypeFilter && { productType: productTypeFilter }),
        sortBy: sortBy === 'popular' ? 'trending' as const :
               sortBy === 'price' ? 'price' as const :
               sortBy === 'latest' ? 'createdAt' as const : 'trending' as const,
        sortOrder: sortBy === 'price' ? 'asc' as const : 'desc' as const
      };

      const response: ProductsResponse = await productService.getProducts(filters);

      if (response.success && response.data) {
        if (isLoadMore) {
          // 기존 상품에 추가 (중복 제거)
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newProducts = response.data.filter(p => !existingIds.has(p.id));
            return [...prev, ...newProducts];
          });
        } else {
          setProducts(response.data);
        }
        setPagination(response.pagination);
        setHasMore(response.pagination?.hasNext ?? false);
      } else {
        if (!isLoadMore) {
          setProductsError('상품을 불러오는 데 실패했습니다.');
          setProducts([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('Product fetch error:', err);
      if (!isLoadMore) {
        setProductsError('상품을 불러오는 데 오류가 발생했습니다.');
        setProducts([]);
      }
      setHasMore(false);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setProductsLoading(false);
      }
    }
  }, [decodedSellerUuid, sortBy, priceFilter, categoryFilter, productTypeFilter]);

  // 필터 변경 시 초기 로드
  useEffect(() => {
    setProducts([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [decodedSellerUuid, sortBy, priceFilter, categoryFilter, productTypeFilter, fetchProducts]);

  // 무한 스크롤 - Intersection Observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !productsLoading) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchProducts(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, productsLoading, currentPage, fetchProducts]);

  // 브랜드 통계 계산 (brandInfo의 서버 데이터 우선 사용)
  const brandStats = useMemo(() => {
    if (!brandInfo) {
      return {
        name: '',
        totalProducts: 0,
        activeProducts: 0,
        avgRating: 0,
        totalLikes: 0,
        totalOrders: 0,
        totalReviews: 0,
        totalRevenue: 0,
        responseRate: 0,
        fulfillmentRate: 0,
        priceRange: { min: 0, max: 0 }
      };
    }

    // 서버에서 제공하는 정확한 통계 사용
    const stats = brandInfo.stats;
    const hasProducts = products.length > 0;
    
    return {
      name: brandInfo.brandName,
      totalProducts: stats.totalProducts,
      activeProducts: stats.activeProducts,
      avgRating: stats.averageRating,
      totalLikes: stats.totalLikes,
      totalOrders: stats.totalOrders,
      totalReviews: stats.totalReviews,
      totalRevenue: stats.totalRevenue,
      responseRate: stats.responseRate,
      fulfillmentRate: stats.fulfillmentRate,
      priceRange: hasProducts ? {
        min: Math.min(...products.map(p => p.discountedPrice || p.price)),
        max: Math.max(...products.map(p => p.discountedPrice || p.price))
      } : { min: 0, max: 0 }
    };
  }, [brandInfo, products]);

  // 정렬된 상품 목록 (필터링은 API 레벨에서 처리됨)
  const sortedProducts = products.filter(Boolean);

  // 카테고리별 상품 분류
  const categoryGroups = useMemo(() => {
    const groups = new Map<string, Product[]>();

    products.forEach(product => {
      const categories = product.nailCategories?.style || ['기타'];
      categories.forEach(category => {
        if (!groups.has(category)) {
          groups.set(category, []);
        }
        groups.get(category)!.push(product);
      });
    });

    return Array.from(groups.entries()).map(([category, products]) => ({
      category,
      products: products.slice(0, 8) // 카테고리당 최대 8개까지만
    }));
  }, [products]);

  // 사용 가능한 카테고리 목록
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    products.forEach(product => {
      product.nailCategories?.style?.forEach(category => categories.add(category));
    });
    return Array.from(categories);
  }, [products]);

  // 브랜드 정보 로딩 상태
  if (brandLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="text-center py-20">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">브랜드 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 브랜드 정보 에러 상태
  if (brandError || !brandInfo) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="text-center py-20">
          <h1 className="text-2xl font-semibold mb-2 text-red-600">브랜드를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-4">{brandError || '해당 브랜드가 존재하지 않습니다.'}</p>
          <button
            onClick={() => onGo('/brands')}
            className="rounded-lg bg-black text-white px-6 py-2 hover:bg-gray-800"
          >
            브랜드 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <button
          onClick={() => onGo('/brands')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
            <path d="M19 12H5m7-7l-7 7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline">브랜드 목록으로 돌아가기</span>
          <span className="sm:hidden">돌아가기</span>
        </button>
      </div>

      {/* 브랜드 헤더 */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        {/* 배경 이미지 */}
        <div 
          className={`relative bg-cover bg-center bg-no-repeat text-white min-h-[300px] sm:min-h-[350px] transition-all duration-500 ${
            imageError ? `bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700` : ''
          }`}
          style={{
            backgroundImage: !imageError && imageLoaded ? `url('${currentBackgroundImage}')` : undefined
          }}
        >
          {/* 이미지 프리로딩 및 에러 처리 */}
          <img
            src={currentBackgroundImage}
            alt={`${brandInfo?.brandName} 브랜드 대표 이미지 - ${brandTheme.description}`}
            className="hidden"
            loading="eager"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          
          {/* 접근성을 위한 브랜드 정보 */}
          <div className="sr-only">
            <h2>{brandInfo?.brandName} 브랜드 페이지</h2>
            <p>{brandTheme.description}</p>
          </div>
          
          {/* 로딩 상태 스켈레톤 */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-300 animate-pulse" role="img" aria-label="브랜드 이미지 로딩 중">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] animate-shimmer"></div>
            </div>
          )}
          
          {/* 이미지 로드 실패 시 알림 */}
          {imageError && (
            <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-xs font-medium shadow-lg">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                기본 배경 사용중
              </div>
            </div>
          )}
          
          {/* 그라데이션 오버레이 */}
          <div className={`absolute inset-0 bg-gradient-to-br ${brandTheme.overlayGradient} ${
            !imageLoaded && !imageError ? 'opacity-70' : ''
          }`}></div>
          
          {/* 추가 다크 오버레이 (가독성을 위해) */}
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col space-y-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {/* 브랜드 로고/아바타 */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {brandStats.name.charAt(0)}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{brandStats.name}</h1>
                  <p className="text-white/80 text-base sm:text-lg mb-3">{brandTheme.description}</p>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <span className="text-white/90 font-medium text-sm sm:text-base">{brandStats.avgRating.toFixed(1)}</span>
                    </div>
                    <button
                      onClick={() => onBrandLike?.(sellerUuid)}
                      className="flex items-center gap-1 hover:scale-110 transition-transform"
                      aria-label={isBrandLiked ? '브랜드 좋아요 취소' : '브랜드 좋아요'}
                    >
                      <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${isBrandLiked ? 'text-red-500' : 'text-red-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-white/90 font-medium text-sm sm:text-base">{brandStats.totalLikes + (isBrandLiked ? 1 : 0)}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 브랜드 배지 */}
              <div className="flex flex-row sm:flex-col gap-2 sm:gap-3">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 border border-white/30">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-white font-medium text-xs sm:text-sm">인증 브랜드</span>
                </div>
                {brandStats.totalProducts >= 3 && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full px-3 py-1.5 sm:px-4 sm:py-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <span className="text-white font-medium text-xs sm:text-sm">인기 브랜드</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 브랜드 통계 카드 */}
        <div className="bg-white rounded-b-2xl -mt-4 relative z-10 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center group cursor-pointer">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{brandStats.totalProducts}</div>
              <div className="text-sm text-gray-600">상품 수</div>
            </div>
            
            <div className="text-center group cursor-pointer">
              <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{brandStats.avgRating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">평균 평점</div>
            </div>
            
            <button
              onClick={() => onBrandLike?.(sellerUuid)}
              className="text-center group cursor-pointer hover:scale-105 transition-transform"
              aria-label={isBrandLiked ? '브랜드 좋아요 취소' : '브랜드 좋아요'}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-colors ${
                isBrandLiked ? 'bg-red-200' : 'bg-red-100 group-hover:bg-red-200'
              }`}>
                <svg className={`w-6 h-6 ${isBrandLiked ? 'text-red-600' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{brandStats.totalLikes + (isBrandLiked ? 1 : 0)}</div>
              <div className="text-sm text-gray-600">{isBrandLiked ? '좋아요 완료' : '총 좋아요'}</div>
            </button>
            
            <div className="text-center group cursor-pointer">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {brandStats.priceRange.min.toLocaleString()}~{brandStats.priceRange.max.toLocaleString()}원
              </div>
              <div className="text-sm text-gray-600">가격대</div>
            </div>
          </div>
        </div>
      </div>

      {/* 상품 유형 탭 */}
      <div className="flex gap-2 mb-6">
        {[
          { value: null, label: '전체' },
          { value: 'original' as ProductType, label: '오리지널' },
          { value: 'custom' as ProductType, label: '커스텀' }
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setProductTypeFilter(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              productTypeFilter === tab.value
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 필터 및 정렬 섹션 */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {productTypeFilter === 'original' ? '오리지널 상품' :
               productTypeFilter === 'custom' ? '커스텀 상품' : '전체 상품'}
            </h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {sortedProducts.length}개
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* 필터 토글 버튼 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"/>
              </svg>
              필터
              {(priceFilter || categoryFilter || productTypeFilter) && (
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* 정렬 버튼들 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'popular'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                인기순
              </button>
              <button
                onClick={() => setSortBy('price')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'price'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                가격순
              </button>
              <button
                onClick={() => setSortBy('latest')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'latest'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                최신순
              </button>
            </div>
          </div>
        </div>

        {/* 필터 패널 */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 카테고리 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">카테고리</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setCategoryFilter(null)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !categoryFilter
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    전체
                  </button>
                  {availableCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => setCategoryFilter(category)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                        categoryFilter === category
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* 가격 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">가격대</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setPriceFilter(null)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !priceFilter
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setPriceFilter({ min: 0, max: 50000 })}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      priceFilter?.min === 0 && priceFilter?.max === 50000
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    5만원 이하
                  </button>
                  <button
                    onClick={() => setPriceFilter({ min: 50000, max: 100000 })}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      priceFilter?.min === 50000 && priceFilter?.max === 100000
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    5만원 - 10만원
                  </button>
                  <button
                    onClick={() => setPriceFilter({ min: 100000, max: Infinity })}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      priceFilter?.min === 100000 && priceFilter?.max === Infinity
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    10만원 이상
                  </button>
                </div>
              </div>

              {/* 상품 유형 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">상품 유형</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setProductTypeFilter(null)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !productTypeFilter
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setProductTypeFilter('original')}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      productTypeFilter === 'original'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    오리지널
                  </button>
                  <button
                    onClick={() => setProductTypeFilter('custom')}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      productTypeFilter === 'custom'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    커스텀
                  </button>
                </div>
              </div>

              {/* 필터 초기화 */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setCategoryFilter(null);
                    setPriceFilter(null);
                    setProductTypeFilter(null);
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  필터 초기화
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 상품 목록 */}
      <div className="mb-8">
        {productsLoading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">상품 목록을 불러오는 중...</p>
          </div>
        ) : productsError ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 className="text-lg font-medium text-red-900 mb-2">상품 목록을 불러오지 못했습니다</h3>
            <p className="text-gray-600 mb-4">{productsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 text-white px-6 py-2 hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 상품이 없습니다</h3>
            <p className="text-gray-600">이 브랜드는 아직 상품을 등록하지 않았습니다.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sortedProducts.map((product) => {
                const productId = product.id || product.productUuid;
                return (
                  <ProductCard
                    key={product.id || product.productId}
                    p={product}
                    onOpen={onOpen}
                    onAdd={onAdd}
                    onLike={onLike}
                    isLiked={likedProducts.includes(productId)}
                  />
                );
              })}
            </div>

            {/* 무한 스크롤 로딩 인디케이터 */}
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span>더 불러오는 중...</span>
                </div>
              )}
              {!hasMore && products.length > 0 && (
                <p className="text-gray-400 text-sm">모든 상품을 불러왔습니다</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* 카테고리별 상품 (상품이 많을 때만 표시) */}
      {categoryGroups.length > 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-6">카테고리별 상품</h2>
          {categoryGroups.map(({ category, products: categoryProducts }) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-medium mb-3">{category} ({categoryProducts.length}개)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {categoryProducts.map((product) => {
                  const productId = product.id || product.productUuid;
                  return (
                    <ProductCard key={`${category}-${product.id || product.productId}`} p={product} onOpen={onOpen} onAdd={onAdd} onLike={onLike} isLiked={likedProducts.includes(productId)} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}