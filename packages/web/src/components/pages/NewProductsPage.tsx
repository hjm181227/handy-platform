import { useState, useEffect, useCallback, useRef } from 'react';
import { webApiService } from '../../services/apiService';
import type { Product } from '@handy-platform/shared';
import { ProductCard } from '../product/ProductCard';

interface NewProductsPageProps {
  onGo: (path: string) => void;
  onOpen: (productId: string) => void;
  onAdd: (productId: string) => void;
  onLike: (productId: string) => void;
  likedProducts: string[];
}

// 정렬 옵션
const sortOptions = [
  { value: 'createdAt', label: '최신순' },
  { value: 'price-asc', label: '가격 낮은순' },
  { value: 'price-desc', label: '가격 높은순' },
  { value: 'rating', label: '평점순' }
];

export function NewProductsPage({
  onGo,
  onOpen,
  onAdd,
  onLike,
  likedProducts
}: NewProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');

  const observerRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 20;

  // API 파라미터 구성
  const buildApiParams = useCallback((pageNum: number) => {
    const params: Record<string, string> = {
      page: pageNum.toString(),
      limit: ITEMS_PER_PAGE.toString(),
      isNew: 'true'
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

    return params;
  }, [sortBy]);

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
        setError('상품을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to fetch new products:', err);
      setError(err.message || '상품을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildApiParams]);

  // 초기 로드 및 정렬 변경 시
  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    fetchProducts(1, false);
  }, [sortBy, fetchProducts]);

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

  // 정렬 변경 핸들러
  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <h1 className="text-xl font-semibold">신상품</h1>
          <p className="text-sm text-gray-600 mt-1">방금 등록된 따끈따끈한 새 상품</p>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="sticky top-[52px] z-20 bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 상품 수 */}
            <span className="text-sm text-gray-600">
              {totalItems > 0 ? `${totalItems.toLocaleString()}개 상품` : ''}
            </span>

            {/* 정렬 드롭다운 */}
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
                  <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-2" />
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
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
            <p className="text-gray-500 mb-2">아직 신상품이 없습니다.</p>
            <button
              onClick={() => onGo('/')}
              className="text-blue-600 hover:underline text-sm"
            >
              홈으로 가기
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
                  <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-sm text-gray-500">불러오는 중...</span>
                </div>
              )}
              {!hasMore && products.length > 0 && (
                <p className="text-sm text-gray-400">모든 상품을 불러왔습니다.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
