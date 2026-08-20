import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { webApiService, brandService } from '../../services/apiService';
import { TitleBar, ProductGrid } from '../product/ProductGrid';
import { SortDropdown, parseSortValue, PRODUCT_SORT_OPTIONS } from '../common/SortDropdown';
import { Stars } from '../ui';
import type { Product, Brand, BrandsResponse, ProductsResponse } from '@handy-platform/shared';

interface SearchResultsPageProps {
  searchQuery: string;
  onOpen: (productId: string) => void;
  onAdd: (productId: string) => void;
  onLike?: (productId: string) => void;
  likedProducts?: string[];
}

export function SearchResultsPage({ searchQuery, onOpen, onAdd, onLike, likedProducts = [] }: SearchResultsPageProps) {
  const { t } = useTranslation(['product', 'common']);
  // 상품 검색 상태
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // 상품 페이지네이션 상태 (더보기)
  const [productPagination, setProductPagination] = useState<{ currentPage: number; totalPages: number } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  // 실제 검색에 사용된 검색어 (빈 결과 화면의 "전체보기" 등으로 prop과 달라질 수 있음)
  const [activeQuery, setActiveQuery] = useState('');

  // 브랜드 검색 상태
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);

  // 정렬 상태
  const [sortBy, setSortBy] = useState('trending');

  // 공통 상태
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // 브랜드 카드 컴포넌트 (BrandsPage와 동일)
  const BrandCard = ({ brand }: { brand: Brand }) => {
    const isHot = brand.stats.totalProducts >= 5 || brand.stats.totalOrders > 100;

    return (
      <div className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {brand.brandProfile ? (
                <img
                  src={brand.brandProfile}
                  alt={`${brand.brandName} 브랜드 로고`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-gray-600">
                  {brand.brandName.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{brand.brandName}</h3>
              <p className="text-xs text-gray-500">{t('product:search.productCount', { count: brand.stats.totalProducts })}</p>
            </div>
          </div>
          {isHot && (
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-600 font-medium">
              HOT
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Stars v={brand.stats.averageRating} />
            <span className="text-sm font-medium">{brand.stats.averageRating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-brand font-medium">{brand.stats.totalOrders}</span>
            <span>{t('product:search.orders')}</span>
          </div>
        </div>

        <button
          onClick={() => window.location.href = `/brand/${encodeURIComponent(brand.sellerUuid)}`}
          className="w-full rounded-md bg-gray-900 text-white py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          {t('product:search.viewBrand')}
        </button>
      </div>
    );
  };

  // 검색 실행
  const performSearch = async (query: string) => {
    if (!query.trim() && hasSearched) {
      return;
    }

    try {
      setError(null);
      setHasSearched(true);
      setActiveQuery(query);

      console.log('🔍 Performing search with query:', query);

      // 브랜드와 상품 동시 검색
      const searchPromises = [];

      // 브랜드 검색
      setBrandsLoading(true);
      const brandPromise = query.trim()
        ? brandService.getBrands({
            search: query,
            page: '1',
            listNum: '6',
            withItems: false
          })
        : Promise.resolve({ brands: [], pagination: null });
      searchPromises.push(brandPromise);

      // 상품 검색
      setProductsLoading(true);
      const sortParams = parseSortValue(sortBy);
      const productPromise = query.trim()
        ? webApiService.product.searchProducts(query, {
            page: '1',
            limit: '20',
            sortBy: sortParams.sortBy,
            sortOrder: sortParams.sortOrder
          })
        : webApiService.product.getProducts({
            page: '1',
            limit: '20',
            sortBy: sortParams.sortBy,
            sortOrder: sortParams.sortOrder
          });
      searchPromises.push(productPromise);

      // 서로 다른 두 응답을 한 배열에 담아 Promise.all 하므로 결과 타입을 명시한다
      const [brandResponse, productResponse] = (await Promise.all(searchPromises)) as [
        BrandsResponse | { brands: Brand[]; pagination: null },
        ProductsResponse & { error?: string }
      ];

      // 브랜드 결과 처리
      if (brandResponse.brands) {
        setBrands(brandResponse.brands);
      } else {
        setBrands([]);
      }
      setBrandsLoading(false);

      // 상품 결과 처리
      if (productResponse.success && productResponse.data) {
        setProducts(productResponse.data);
        setProductPagination(productResponse.pagination ?? null);
      } else {
        setProducts([]);
        setProductPagination(null);
        if (productResponse.error) {
          setError(`${t('product:search.generalError')}: ${productResponse.error}`);
        }
      }
      setProductsLoading(false);

    } catch (error: any) {
      setBrands([]);
      setProducts([]);
      setProductPagination(null);
      setBrandsLoading(false);
      setProductsLoading(false);

      // 사용자 친화적 에러 메시지 설정
      if (error.message?.includes('fetch')) {
        setError(t('product:search.networkError'));
      } else if (error.status === 400) {
        setError(t('product:search.invalidQuery'));
      } else if (error.status >= 500) {
        setError(t('product:search.serverError'));
      } else {
        setError(t('product:search.generalError'));
      }
    }
  };

  // 다음 페이지 상품 이어서 로드 (더보기)
  const loadMoreProducts = async () => {
    if (loadingMore || !productPagination || productPagination.currentPage >= productPagination.totalPages) {
      return;
    }

    setLoadingMore(true);
    try {
      const sortParams = parseSortValue(sortBy);
      const params = {
        page: String(productPagination.currentPage + 1),
        limit: '20',
        sortBy: sortParams.sortBy,
        sortOrder: sortParams.sortOrder,
      };

      const response = activeQuery.trim()
        ? await webApiService.product.searchProducts(activeQuery, params)
        : await webApiService.product.getProducts(params);

      if (response.success && response.data) {
        const nextItems: Product[] = response.data;
        setProducts(prev => [...prev, ...nextItems]);
        setProductPagination(response.pagination ?? null);
      }
    } catch (err) {
      console.error('상품 더보기 로드 실패:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // 검색어 또는 정렬이 변경될 때마다 검색 실행 (페이지·결과는 performSearch에서 1페이지 기준으로 초기화됨)
  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, sortBy]);

  // 재시도 핸들러
  const handleRetry = () => {
    performSearch(searchQuery);
  };

  const loading = brandsLoading || productsLoading;
  const totalCount = brands.length + products.length;
  const hasBrands = brands.length > 0;
  const hasProducts = products.length > 0;

  // 로딩 상태
  if (loading && !hasSearched) {
    return (
      <>
        <TitleBar title={`${t('product:search.title')}: ${searchQuery || t('product:search.viewAll')}`} desc={`${t('product:search.searching')}`} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-lg">{t('product:search.searching')}</p>
            <p className="text-gray-400 text-sm mt-2">{t('product:search.pleaseWait')}</p>
          </div>
        </div>
      </>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <>
        <TitleBar title={`${t('product:search.title')}: ${searchQuery || t('product:search.viewAll')}`} desc={t('product:search.error')} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('product:search.error')}</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-brand text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
              >
                {t('common:retry')}
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {t('product:search.goHome')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 빈 결과 상태
  if (hasSearched && !hasBrands && !hasProducts && !loading) {
    return (
      <>
        <TitleBar
          title={`${t('product:search.title')}: ${searchQuery || t('product:search.viewAll')}`}
          desc={searchQuery ? t('product:search.noResultsFor', { query: searchQuery }) : t('product:search.noResultsGeneral')}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('product:search.noResults')}</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              {searchQuery ? (
                <>
                  {t('product:search.noResultsFor', { query: searchQuery })}
                  <br />{t('product:search.tryOtherKeywords')}
                </>
              ) : (
                t('product:search.noResultsGeneral')
              )}
            </p>
            <div className="flex gap-3">
              {searchQuery && (
                <button
                  onClick={() => performSearch('')}
                  className="px-6 py-2.5 bg-brand text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
                >
                  {t('product:search.viewAll')}
                </button>
              )}
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {t('product:search.goHome')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 검색 결과 표시
  const titleDesc = searchQuery
    ? t('product:search.resultDesc', { query: searchQuery })
    : t('product:search.allResults');

  return (
    <>
      <TitleBar
        title={`${t('product:search.title')}: ${searchQuery || t('product:search.viewAll')}`}
        desc={titleDesc}
      />

      {/* 검색 결과 요약 */}
      <div className="mx-auto max-w-7xl px-4 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm flex-1">
            {searchQuery && (
              <span className="text-gray-600">
                {t('product:search.searchKeyword')}: <span className="font-semibold text-gray-900">'{searchQuery}'</span>
              </span>
            )}
            <span className="text-gray-600">
              {t('product:search.totalResults', { count: totalCount })}
            </span>
            {hasBrands && (
              <span className="text-gray-500">
                {t('product:search.brandCount', { count: brands.length })}
              </span>
            )}
            {hasProducts && (
              <span className="text-gray-500">
                {t('product:search.productCount', { count: products.length })}
              </span>
            )}
          </div>

          <SortDropdown value={sortBy} onChange={setSortBy} />

          {searchQuery && totalCount > 0 && (
            <button
              onClick={() => performSearch('')}
              className="text-sm text-brand hover:text-brand-600 hover:underline"
            >
              {t('product:search.viewAll')}
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* 브랜드 섹션 */}
        {hasBrands && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>{t('common:brand')}</span>
                <span className="text-lg font-medium text-gray-500">({t('product:search.brandCount', { count: brands.length })})</span>
              </h2>
              {brands.length > 6 && (
                <button
                  onClick={() => window.location.href = '/brands'}
                  className="text-sm text-brand hover:text-brand-600 hover:underline"
                >
                  {t('product:search.viewAllBrands')} →
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {brands.map((brand) => (
                <BrandCard key={brand.sellerUuid} brand={brand} />
              ))}
            </div>
          </section>
        )}

        {/* 상품 섹션 */}
        {hasProducts && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>{t('product:search.title')}</span>
                <span className="text-lg font-medium text-gray-500">({t('product:search.productCount', { count: products.length })})</span>
              </h2>
            </div>

            <ProductGrid
              title=""
              items={products}
              onOpen={onOpen}
              onAdd={onAdd}
              onLike={onLike}
              likedProducts={likedProducts}
            />

            {/* 더보기 버튼 (마지막 페이지면 숨김) */}
            {productPagination && productPagination.currentPage < productPagination.totalPages && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMoreProducts}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-8 py-2.5 border border-brand text-brand rounded-lg hover:bg-brand/10 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></span>
                      {t('product:categoryPage.loadingMore')}
                    </>
                  ) : (
                    t('product:discover.loadMore')
                  )}
                </button>
              </div>
            )}
          </section>
        )}

        {/* 검색 결과가 적을 때 추가 안내 */}
        {totalCount > 0 && totalCount < 5 && (
          <div className="mt-8">
            <div className="bg-brand-50 rounded-lg p-6 text-center">
              <h4 className="text-lg font-medium text-blue-900 mb-2">{t('product:search.wantMore')}</h4>
              <p className="text-brand mb-4">
                {t('product:search.trySuggestion')}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => performSearch('')}
                  className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium"
                >
                  {t('product:search.viewAll')}
                </button>
                <button
                  onClick={() => window.location.href = '/brands'}
                  className="px-4 py-2 border border-blue-300 text-brand rounded-lg hover:bg-brand/10 transition-colors text-sm font-medium"
                >
                  {t('product:search.browseBrands')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
