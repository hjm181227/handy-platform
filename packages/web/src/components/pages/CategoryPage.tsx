import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { webApiService } from '../../services/apiService';
import type { Product } from '@handy-platform/shared';
import { ProductCard } from '../product/ProductCard';
import { PageHeader } from '../layout/PageHeader';
import { getCategoryDisplayName } from '../../utils/categoryUtils';

interface CategoryPageProps {
  categoryType: string;
  categoryValue: string;
  onGo: (path: string) => void;
  onOpen: (productId: string) => void;
  onAdd: (productId: string) => void;
  onLike: (productId: string) => void;
  likedProducts: string[];
}

// 정렬 옵션
const SORT_OPTION_KEYS = [
  { value: 'trending', labelKey: 'categoryPage.sortTrending' },
  { value: 'createdAt', labelKey: 'categoryPage.sortLatest' },
  { value: 'price-asc', labelKey: 'categoryPage.sortPriceAsc' },
  { value: 'price-desc', labelKey: 'categoryPage.sortPriceDesc' },
  { value: 'rating', labelKey: 'categoryPage.sortRating' }
];

export function CategoryPage({
  categoryType,
  categoryValue,
  onGo,
  onOpen,
  onAdd,
  onLike,
  likedProducts
}: CategoryPageProps) {
  const { t } = useTranslation(['product', 'common']);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('trending');

  const observerRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 12;

  // API 파라미터 구성
  const buildApiParams = useCallback((pageNum: number) => {
    const params: Record<string, string> = {
      page: pageNum.toString(),
      limit: ITEMS_PER_PAGE.toString()
    };

    // 정렬 파라미터
    if (sortBy === 'price-asc') {
      params.sortBy = 'price';
      params.sortOrder = 'asc';
    } else if (sortBy === 'price-desc') {
      params.sortBy = 'price';
      params.sortOrder = 'desc';
    } else {
      params.sortBy = sortBy;
      params.sortOrder = 'desc';
    }

    // 카테고리 필터 적용
    switch (categoryType) {
      case 'style':
        params.style = categoryValue;
        break;
      case 'color':
        params.color = categoryValue;
        break;
      case 'texture':
        params.texture = categoryValue;
        break;
      case 'tpo':
        params.tpo = categoryValue;
        break;
      case 'nation':
        params.nation = categoryValue;
        break;
      case 'shape':
        // nailShape은 영문 대문자로 변환 (value가 이미 영문 소문자)
        params.nailShape = categoryValue.toUpperCase();
        break;
      case 'length':
        // nailLength는 영문 대문자로 변환 (value가 이미 영문 소문자)
        params.nailLength = categoryValue.toUpperCase();
        break;
    }

    return params;
  }, [categoryType, categoryValue, sortBy]);

  // 상품 로드
  const fetchProducts = useCallback(async (pageNum: number, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = buildApiParams(pageNum);
      const response = await webApiService.product.getProducts(params);

      if (response.success) {
        const newProducts = response.data || [];

        if (isLoadMore) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }

        // 페이지네이션 정보 업데이트
        const pagination = response.pagination;
        if (pagination) {
          setTotalItems(pagination.totalItems);
          setHasMore(pagination.hasNext);
        } else {
          setHasMore(newProducts.length === ITEMS_PER_PAGE);
        }
      } else {
        setError(t('categoryPage.loadFailed'));
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.message || t('categoryPage.loadError'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildApiParams]);

  // 초기 로드 및 필터 변경 시
  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    fetchProducts(1, false);
  }, [categoryType, categoryValue, sortBy, fetchProducts]);

  // 무한 스크롤 - Intersection Observer
  useEffect(() => {
    if (!observerRef.current || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(nextPage, true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, page, fetchProducts]);

  // 타이틀 생성 (value -> name 변환)
  const getTitle = () => {
    return getCategoryDisplayName(categoryType, categoryValue);
  };

  // 정렬 변경 핸들러
  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <PageHeader
        title={getTitle()}
        onBack={() => history.back()}
      />

      {/* 필터 바 */}
      <div className="sticky top-[52px] z-20 bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 상품 수 */}
            <span className="text-sm text-gray-600">
              {totalItems > 0 ? t('categoryPage.productCount', { count: totalItems }) : ''}
            </span>

            {/* 정렬 드롭다운 */}
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {SORT_OPTION_KEYS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        {loading ? (
          // 로딩 스켈레톤
          <div className="flex flex-wrap -mx-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-2 mb-4">
                <div className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // 에러 상태
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchProducts(1, false)}
              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              {t('common:retry')}
            </button>
          </div>
        ) : products.length === 0 ? (
          // 빈 상태
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">{t('categoryPage.noProducts')}</p>
            <button
              onClick={() => onGo('/category')}
              className="text-brand hover:underline text-sm"
            >
              {t('categoryPage.browseOther')}
            </button>
          </div>
        ) : (
          <>
            {/* 상품 그리드 */}
            <div className="flex flex-wrap -mx-2">
              {products.map((product) => {
                const productId = product.productUuid || product.productId || '';
                return (
                  <div key={productId} className="w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-2 mb-4">
                    <ProductCard
                      p={product}
                      onOpen={onOpen}
                      onAdd={onAdd}
                      onLike={onLike}
                      onGo={onGo}
                      isLiked={likedProducts.includes(productId)}
                    />
                  </div>
                );
              })}
            </div>

            {/* 무한 스크롤 트리거 */}
            <div ref={observerRef} className="h-20 flex items-center justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border-2 border-brand/20 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-sm text-gray-500">{t('categoryPage.loadingMore')}</span>
                </div>
              )}
              {!hasMore && products.length > 0 && (
                <p className="text-sm text-gray-400">{t('categoryPage.allLoaded')}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
