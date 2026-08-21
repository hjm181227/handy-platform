import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../product/ProductCard';
import { productService, brandService, imageService } from '../../services/apiService';
import type { Product, ProductsResponse, BrandDetail, BrandBusinessInfo, ProductType } from '@handy-platform/shared';
import { useAuth } from '../../hooks/useAuth';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { SortDropdown, PRODUCT_SORT_OPTIONS, parseSortValue } from '../common/SortDropdown';

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
    overlayGradient: 'from-brand-600/80 to-brand/70',
    primaryColor: 'brand',
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
    overlayGradient: 'from-brand-600/80 to-brand/70',
    primaryColor: 'brand',
    description: '전문적인 네일 스튜디오의 노하우를 담은 프리미엄 컬렉션'
  },
  'CRYSTAL NAILS': {
    backgroundImage: 'https://images.unsplash.com/photo-1583001264273-55ff0d04b648?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    mobileBackgroundImage: 'https://images.unsplash.com/photo-1583001264273-55ff0d04b648?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    overlayGradient: 'from-brand-600/80 to-brand/70',
    primaryColor: 'brand',
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
  const { t } = useTranslation('common');

  // 정렬 및 필터 상태
  const [sortBy, setSortBy] = useState('trending');
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

  // 판매자 사업자 정보 (전자상거래법상 신원정보 공개용)
  // 미승인 판매자 등 서버가 404를 주는 경우에는 null로 두고 섹션 자체를 렌더링하지 않는다
  const [businessInfo, setBusinessInfo] = useState<BrandBusinessInfo | null>(null);
  // 기본 펼침 — 전자상거래법 고지이자 카카오 채널 심사 증빙이라 클릭 없이 보여야 한다
  const [showBusinessInfo, setShowBusinessInfo] = useState(true);

  // 인증 상태 (useAuth hook 사용)
  const { currentUser, authLoading } = useAuth();
  const { openLogin } = useAuthModal();

  // 이미지 업로드 상태
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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

  /**
   * UUID로 들어온 브랜드 링크를 브랜드 주소로 바꿔둔다.
   * 셀러가 주소를 설정해 둔 경우에만 동작하며, 히스토리는 쌓지 않는다.
   */
  useEffect(() => {
    const slug = brandInfo?.slug;
    if (!slug) return;
    const current = window.location.pathname;
    if (!/^\/brand\/[^/]+$/.test(current)) return;
    const target = `/brand/${slug}`;
    if (current !== target) {
      window.history.replaceState({}, '', target + window.location.search);
    }
  }, [brandInfo]);

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

  // API 데이터 사용
  const currentBackgroundImage = brandInfo?.brandBanner || '';

  // 이미지 preload를 위한 useEffect
  useEffect(() => {
    if (!currentBackgroundImage) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = currentBackgroundImage;
    link.as = 'image';
    document.head.appendChild(link);

    return () => {
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
          setBrandError(t('brandDetail.brandLoadFailed'));
        }
      } catch (err) {
        console.error('Brand info fetch error:', err);
        setBrandError(t('brandDetail.brandLoadError'));
      } finally {
        setBrandLoading(false);
      }
    };

    fetchBrandInfo();
  }, [decodedSellerUuid]);

  // 판매자 사업자 정보 가져오기 (독립적, 실패해도 페이지에 영향 없음)
  useEffect(() => {
    let cancelled = false;

    const fetchBusinessInfo = async () => {
      try {
        const response = await brandService.getBrandBusinessInfo(decodedSellerUuid);
        if (!cancelled && response.success && response.data) {
          setBusinessInfo(response.data);
        }
      } catch (err) {
        // 미승인·미등록 판매자는 404 → 섹션을 노출하지 않는다 (에러 표시도 하지 않음)
        if (!cancelled) {
          setBusinessInfo(null);
        }
      }
    };

    setBusinessInfo(null);
    setShowBusinessInfo(false);
    fetchBusinessInfo();

    return () => {
      cancelled = true;
    };
  }, [decodedSellerUuid]);

  // 브랜드 소유권 확인 (useAuth 사용)
  const isOwner = useMemo(() => {
    if (!currentUser || !decodedSellerUuid) {
      return false;
    }

    const isMatch = currentUser.userUuid === decodedSellerUuid;

    console.log('🔍 [BrandDetailPage] Ownership check:', {
      currentUserUuid: currentUser.userUuid,
      decodedSellerUuid,
      isOwner: isMatch
    });

    return isMatch;
  }, [currentUser, decodedSellerUuid]);

  // 프로필 이미지 업로드 핸들러
  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(t('brandDetail.fileSizeError'));
      return;
    }

    // 파일 타입 검증
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert(t('brandDetail.unsupportedFormat'));
      return;
    }

    try {
      setUploadingProfile(true);

      // 1. Presigned URL 요청
      const presignedResponse = await imageService.getPresignedUrl({
        filename: file.name,
        contentType: file.type,
        uploadType: 'brand-profile'
      });

      // 2. S3에 직접 업로드
      const uploadHeaders: Record<string, string> = {
        'Content-Type': file.type,
        ...(presignedResponse.uploadHeaders || {})
      };
      const uploadResponse = await fetch(presignedResponse.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: uploadHeaders,
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.status}`);
      }

      // 3. 브랜드 프로필 업데이트
      await brandService.updateBrandProfile(decodedSellerUuid, {
        brandProfile: presignedResponse.imageUrl
      });

      // 4. 브랜드 정보 새로고침
      const updatedBrand = await brandService.getBrandDetail(decodedSellerUuid);
      setBrandInfo(updatedBrand.data);

      alert(t('brandDetail.profileUpdated'));
    } catch (error) {
      console.error('Profile image upload failed:', error);
      alert(t('brandDetail.profileUploadFailed'));
    } finally {
      setUploadingProfile(false);
      // 파일 input 초기화
      if (profileInputRef.current) {
        profileInputRef.current.value = '';
      }
    }
  };

  // 배너 이미지 업로드 핸들러
  const handleBannerImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(t('brandDetail.fileSizeError'));
      return;
    }

    // 파일 타입 검증
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert(t('brandDetail.unsupportedFormat'));
      return;
    }

    try {
      setUploadingBanner(true);

      // 1. Presigned URL 요청
      const presignedResponse = await imageService.getPresignedUrl({
        filename: file.name,
        contentType: file.type,
        uploadType: 'brand-banner'
      });

      // 2. S3에 직접 업로드
      const uploadHeaders: Record<string, string> = {
        'Content-Type': file.type,
        ...(presignedResponse.uploadHeaders || {})
      };
      const uploadResponse = await fetch(presignedResponse.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: uploadHeaders,
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.status}`);
      }

      // 3. 브랜드 배너 업데이트
      await brandService.updateBrandBanner(decodedSellerUuid, {
        brandBanner: presignedResponse.imageUrl
      });

      // 4. 브랜드 정보 새로고침
      const updatedBrand = await brandService.getBrandDetail(decodedSellerUuid);
      setBrandInfo(updatedBrand.data);

      alert(t('brandDetail.bannerUpdated'));
    } catch (error) {
      console.error('Banner image upload failed:', error);
      alert(t('brandDetail.bannerUploadFailed'));
    } finally {
      setUploadingBanner(false);
      // 파일 input 초기화
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

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
        sortBy: parseSortValue(sortBy).sortBy as any,
        sortOrder: parseSortValue(sortBy).sortOrder as any
      };

      const response: ProductsResponse = await productService.getProducts(filters);

      if (response.success && response.data) {
        if (isLoadMore) {
          // 기존 상품에 추가 (중복 제거)
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.productUuid));
            const newProducts = response.data.filter(p => !existingIds.has(p.productUuid));
            return [...prev, ...newProducts];
          });
        } else {
          setProducts(response.data);
        }
        setPagination(response.pagination);
        setHasMore(response.pagination?.hasNext ?? false);
      } else {
        if (!isLoadMore) {
          setProductsError(t('brandDetail.productLoadError'));
          setProducts([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('Product fetch error:', err);
      if (!isLoadMore) {
        setProductsError(t('brandDetail.productLoadErrorDetail'));
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
          <div className="w-16 h-16 border-4 border-brand/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('brandDetail.loadingBrand')}</p>
        </div>
      </div>
    );
  }

  // 브랜드 정보 에러 상태
  if (brandError || !brandInfo) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="text-center py-20">
          <h1 className="text-2xl font-semibold mb-2 text-red-600">{t('brandDetail.brandNotFound')}</h1>
          <p className="text-gray-600 mb-4">{brandError || t('brandDetail.brandNotExist')}</p>
          <button
            onClick={() => onGo('/brands')}
            className="rounded-full bg-brand text-white px-6 py-2 hover:bg-brand-600"
          >
            {t('brandDetail.backToBrands')}
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
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-ink hover:bg-surface rounded-lg transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
            <path d="M19 12H5m7-7l-7 7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline">{t('brandDetail.backToBrands')}</span>
          <span className="sm:hidden">{t('brandDetail.backButton')}</span>
        </button>
      </div>

      {/* 브랜드 헤더 */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        {/* 배경 이미지 */}
        <div
          className={`relative bg-cover bg-center bg-no-repeat text-white min-h-[300px] sm:min-h-[350px] transition-all duration-500 ${
            imageError ? `bg-gradient-to-br from-brand-600 via-brand to-brand-700` : ''
          }`}
          style={{
            backgroundImage: !imageError && imageLoaded ? `url('${currentBackgroundImage}')` : undefined
          }}
        >
          {/* 이미지 프리로딩 및 에러 처리 */}
          <img
            src={currentBackgroundImage}
            alt={t('brandDetail.brandImageAlt', { name: brandInfo?.brandName, description: brandTheme.description })}
            className="hidden"
            loading="eager"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />

          {/* 접근성을 위한 브랜드 정보 */}
          <div className="sr-only">
            <h2>{brandInfo?.brandName} {t('brandDetail.brandPage')}</h2>
            <p>{brandTheme.description}</p>
          </div>

          {/* 로딩 상태 스켈레톤 */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-surface-strong animate-pulse" role="img" aria-label={t('brandDetail.brandImageLoading')}>
              <div className="absolute inset-0 bg-gradient-to-r from-surface-strong via-surface to-surface-strong bg-[length:200%_100%] animate-shimmer"></div>
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
                <div className="relative flex-shrink-0 group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center overflow-hidden">
                    {brandInfo?.brandProfile ? (
                      <img
                        src={brandInfo.brandProfile}
                        alt={brandStats.name}
                        className="w-full h-full rounded-2xl object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<span class="text-2xl sm:text-3xl font-bold text-white">${brandStats.name.charAt(0)}</span>`;
                        }}
                      />
                    ) : (
                      <span className="text-2xl sm:text-3xl font-bold text-white">
                        {brandStats.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* 소유자 전용: Hover 시 편집 버튼 */}
                  {isOwner && !authLoading && (
                    <button
                      onClick={() => profileInputRef.current?.click()}
                      disabled={uploadingProfile}
                      className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      {uploadingProfile ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  )}

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
                      aria-label={isBrandLiked ? t('brandDetail.likeCancel') : t('brandDetail.likeAdd')}
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
                  <span className="text-white font-medium text-xs sm:text-sm">{t('brandDetail.verifiedBrand')}</span>
                </div>
                {brandStats.totalProducts >= 3 && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-brand rounded-full px-3 py-1.5 sm:px-4 sm:py-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <span className="text-white font-medium text-xs sm:text-sm">{t('brandDetail.popularBrand')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 배너 수정 버튼 (소유자만 표시) */}
          {isOwner && !authLoading && (
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              title={t('brandDetail.changeBanner')}
              aria-label={t('brandDetail.changeBanner')}
              className="absolute bottom-6 sm:bottom-8 lg:bottom-12 right-4 sm:right-6 lg:right-8 z-30 bg-white/90 backdrop-blur-sm hover:bg-white hover:shadow-xl text-ink p-3 rounded-lg shadow-lg transition-all flex items-center justify-center cursor-pointer"
            >
              {uploadingBanner ? (
                <div className="w-5 h-5 border-2 border-line border-t-brand rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* 브랜드 통계 카드 */}
        <div className="bg-white rounded-b-2xl -mt-4 relative z-10 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center group cursor-pointer">
              <div className="w-12 h-12 mx-auto mb-3 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{brandStats.totalProducts}</div>
              <div className="text-sm text-gray-600">{t('brandDetail.productCount')}</div>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{brandStats.avgRating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">{t('brandDetail.avgRating')}</div>
            </div>

            <button
              onClick={() => onBrandLike?.(sellerUuid)}
              className="text-center group cursor-pointer hover:scale-105 transition-transform"
              aria-label={isBrandLiked ? t('brandDetail.likeCancel') : t('brandDetail.likeAdd')}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-colors ${
                isBrandLiked ? 'bg-red-200' : 'bg-red-100 group-hover:bg-red-200'
              }`}>
                <svg className={`w-6 h-6 ${isBrandLiked ? 'text-red-600' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{brandStats.totalLikes + (isBrandLiked ? 1 : 0)}</div>
              <div className="text-sm text-gray-600">{isBrandLiked ? t('brandDetail.likeDone') : t('brandDetail.totalLikes')}</div>
            </button>

            <div className="text-center group cursor-pointer">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {brandStats.priceRange.min.toLocaleString()}~{brandStats.priceRange.max.toLocaleString()}{t('won')}
              </div>
              <div className="text-sm text-gray-600">{t('brandDetail.priceRange')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 커스텀 주문하기 버튼 */}
      {!isOwner && (
        <div className="mb-6">
          <button
            onClick={() => {
              if (!currentUser) {
                openLogin();
                return;
              }
              onGo(`/brand/${sellerUuid}/custom-order?brandName=${encodeURIComponent(brandStats.name)}`);
            }}
            className="w-full py-4 bg-gradient-to-r from-brand to-brand-600 text-white rounded-full font-semibold text-lg flex items-center justify-center gap-2 hover:from-brand-600 hover:to-brand-700 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            커스텀 주문하기
          </button>
        </div>
      )}

      {/* 상품 유형 탭 */}
      <div className="flex gap-2 mb-6">
        {[
          { value: null, label: t('brandDetail.allTab') },
          { value: 'original' as ProductType, label: t('brandDetail.originalTab') },
          { value: 'custom' as ProductType, label: t('brandDetail.customTab') }
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setProductTypeFilter(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              productTypeFilter === tab.value
                ? 'bg-ink text-white'
                : 'bg-surface text-ink hover:bg-surface-strong'
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
              {productTypeFilter === 'original' ? t('brandDetail.originalProducts') :
               productTypeFilter === 'custom' ? t('brandDetail.customProducts') : t('brandDetail.allProducts')}
            </h2>
            <span className="px-3 py-1 bg-brand-50 text-brand rounded-full text-sm font-medium">
              {t('count', { count: sortedProducts.length })}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* 필터 토글 버튼 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-strong rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"/>
              </svg>
              {t('brandDetail.filter')}
              {(priceFilter || categoryFilter || productTypeFilter) && (
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* 정렬 드롭다운 */}
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        {/* 필터 패널 */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 카테고리 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t('brandDetail.categoryLabel')}</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setCategoryFilter(null)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !categoryFilter
                        ? 'bg-brand-50 text-brand'
                        : 'bg-surface hover:bg-surface-strong text-ink'
                    }`}
                  >
                    {t('brandDetail.all')}
                  </button>
                  {availableCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => setCategoryFilter(category)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                        categoryFilter === category
                          ? 'bg-brand-50 text-brand'
                          : 'bg-surface hover:bg-surface-strong text-ink'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* 가격 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t('brandDetail.priceRangeLabel')}</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setPriceFilter(null)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !priceFilter
                        ? 'bg-brand-50 text-brand'
                        : 'bg-surface hover:bg-surface-strong text-ink'
                    }`}
                  >
                    {t('brandDetail.all')}
                  </button>
                  <button
                    onClick={() => setPriceFilter({ min: 0, max: 50000 })}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      priceFilter?.min === 0 && priceFilter?.max === 50000
                        ? 'bg-brand-50 text-brand'
                        : 'bg-surface hover:bg-surface-strong text-ink'
                    }`}
                  >
                    {t('brandDetail.under50k')}
                  </button>
                  <button
                    onClick={() => setPriceFilter({ min: 50000, max: 100000 })}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      priceFilter?.min === 50000 && priceFilter?.max === 100000
                        ? 'bg-brand-50 text-brand'
                        : 'bg-surface hover:bg-surface-strong text-ink'
                    }`}
                  >
                    {t('brandDetail.range50to100k')}
                  </button>
                  <button
                    onClick={() => setPriceFilter({ min: 100000, max: Infinity })}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      priceFilter?.min === 100000 && priceFilter?.max === Infinity
                        ? 'bg-brand-50 text-brand'
                        : 'bg-surface hover:bg-surface-strong text-ink'
                    }`}
                  >
                    {t('brandDetail.over100k')}
                  </button>
                </div>
              </div>

              {/* 상품 유형 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t('brandDetail.productTypeLabel')}</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setProductTypeFilter(null)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !productTypeFilter
                        ? 'bg-brand-50 text-brand'
                        : 'bg-surface hover:bg-surface-strong text-ink'
                    }`}
                  >
                    {t('brandDetail.all')}
                  </button>
                  <button
                    onClick={() => setProductTypeFilter('original')}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      productTypeFilter === 'original'
                        ? 'bg-brand-50 text-brand'
                        : 'bg-surface hover:bg-surface-strong text-ink'
                    }`}
                  >
                    {t('brandDetail.original')}
                  </button>
                  <button
                    onClick={() => setProductTypeFilter('custom')}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      productTypeFilter === 'custom'
                        ? 'bg-brand-50 text-brand'
                        : 'bg-surface hover:bg-surface-strong text-ink'
                    }`}
                  >
                    {t('brandDetail.custom')}
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
                  {t('brandDetail.resetFilter')}
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
            <div className="w-16 h-16 border-4 border-brand/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{t('brandDetail.loadingProducts')}</p>
          </div>
        ) : productsError ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 className="text-lg font-medium text-red-900 mb-2">{t('brandDetail.productLoadFailed')}</h3>
            <p className="text-gray-600 mb-4">{productsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-brand text-white px-6 py-2 hover:bg-brand-600"
            >
              {t('retry')}
            </button>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('brandDetail.noProducts')}</h3>
            <p className="text-gray-600">{t('brandDetail.noProductsDesc')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sortedProducts.map((product) => {
                const productId = product.productUuid;
                return (
                  <ProductCard
                    key={product.productUuid}
                    p={product}
                    onOpen={onOpen}
                    onAdd={onAdd}
                    onLike={onLike}
                    onGo={onGo}
                    isLiked={likedProducts.includes(productId)}
                  />
                );
              })}
            </div>

            {/* 무한 스크롤 로딩 인디케이터 */}
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted">
                  <div className="w-5 h-5 border-2 border-line border-t-brand rounded-full animate-spin"></div>
                  <span>{t('brandDetail.loadingMoreProducts')}</span>
                </div>
              )}
              {!hasMore && products.length > 0 && (
                <p className="text-muted text-sm">{t('brandDetail.allProductsLoaded')}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* 카테고리별 상품 (상품이 많을 때만 표시) */}
      {categoryGroups.length > 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-6">{t('brandDetail.categoryProducts')}</h2>
          {categoryGroups.map(({ category, products: categoryProducts }) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-medium mb-3">{category} ({t('count', { count: categoryProducts.length })})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {categoryProducts.map((product) => {
                  const productId = product.id || product.productUuid;
                  return (
                    <ProductCard key={`${category}-${product.id || product.productId}`} p={product} onOpen={onOpen} onAdd={onAdd} onLike={onLike} onGo={onGo} isLiked={likedProducts.includes(productId)} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 판매자 사업자 정보 (전자상거래법상 판매자 신원정보 제공) */}
      {businessInfo && (
        <div className="mt-12 rounded-xl border border-line bg-surface p-5">
          <button
            type="button"
            onClick={() => setShowBusinessInfo(!showBusinessInfo)}
            aria-expanded={showBusinessInfo}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm font-medium text-gray-700">판매자 사업자 정보</span>
            <span className="text-xs text-muted">{showBusinessInfo ? '접기' : '펼치기'}</span>
          </button>

          {showBusinessInfo && (
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-xs text-muted">
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-muted">상호</dt>
                <dd className="text-gray-600">{businessInfo.brandName}</dd>
              </div>
              {businessInfo.representativeName && (
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted">대표자</dt>
                  <dd className="text-gray-600">{businessInfo.representativeName}</dd>
                </div>
              )}
              {businessInfo.businessNumber && (
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted">사업자등록번호</dt>
                  <dd className="text-gray-600">{businessInfo.businessNumber}</dd>
                </div>
              )}
              {businessInfo.mailOrderSalesNumber && (
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted">통신판매업신고번호</dt>
                  <dd className="text-gray-600">{businessInfo.mailOrderSalesNumber}</dd>
                </div>
              )}
              {businessInfo.businessAddress && (
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted">사업장 소재지</dt>
                  <dd className="text-gray-600">{businessInfo.businessAddress}</dd>
                </div>
              )}
              {businessInfo.contactEmail && (
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted">이메일</dt>
                  <dd className="break-all text-gray-600">{businessInfo.contactEmail}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={profileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleProfileImageUpload}
        className="hidden"
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleBannerImageUpload}
        className="hidden"
      />
    </div>
  );
}
