import { useState, useEffect } from 'react';
import { webApiService, brandService } from '../../services/apiService';
import { TitleBar, ProductGrid } from '../product/ProductGrid';
import { SortDropdown, parseSortValue, PRODUCT_SORT_OPTIONS } from '../common/SortDropdown';
import { Stars } from '../ui';
import type { Product, Brand } from '@handy-platform/shared';

interface SearchResultsPageProps {
  searchQuery: string;
  onOpen: (productId: string) => void;
  onAdd: (productId: string) => void;
  onLike?: (productId: string) => void;
  likedProducts?: string[];
}

export function SearchResultsPage({ searchQuery, onOpen, onAdd, onLike, likedProducts = [] }: SearchResultsPageProps) {
  // 상품 검색 상태
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

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
              <p className="text-xs text-gray-500">{brand.stats.totalProducts}개 상품</p>
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
            <span className="text-[#E85A6B] font-medium">{brand.stats.totalOrders}</span>
            <span>주문</span>
          </div>
        </div>

        <button
          onClick={() => window.location.href = `/brand/${encodeURIComponent(brand.sellerUuid)}`}
          className="w-full rounded-md bg-gray-900 text-white py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          브랜드 보기
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

      const [brandResponse, productResponse] = await Promise.all(searchPromises);

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
      } else {
        setProducts([]);
        if (productResponse.error) {
          setError(`검색 중 오류가 발생했습니다: ${productResponse.error}`);
        }
      }
      setProductsLoading(false);

    } catch (error: any) {
      setBrands([]);
      setProducts([]);
      setBrandsLoading(false);
      setProductsLoading(false);

      // 사용자 친화적 에러 메시지 설정
      if (error.message?.includes('fetch')) {
        setError('네트워크 연결을 확인해주세요.');
      } else if (error.status === 400) {
        setError('검색어가 올바르지 않습니다.');
      } else if (error.status >= 500) {
        setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('검색 중 오류가 발생했습니다.');
      }
    }
  };

  // 검색어 또는 정렬이 변경될 때마다 검색 실행
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
        <TitleBar title={`검색: ${searchQuery || "전체"}`} desc="검색 중..." />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#E85A6B] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-lg">검색 중입니다...</p>
            <p className="text-gray-400 text-sm mt-2">잠시만 기다려주세요</p>
          </div>
        </div>
      </>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <>
        <TitleBar title={`검색: ${searchQuery || "전체"}`} desc="검색 오류" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">검색 오류</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B] transition-colors font-medium"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                홈으로 가기
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
          title={`검색: ${searchQuery || "전체"}`}
          desc={searchQuery ? `'${searchQuery}'에 대한 검색 결과가 없습니다` : "등록된 결과가 없습니다"}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">검색 결과 없음</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              {searchQuery ? (
                <>
                  '<span className="font-medium text-gray-900">{searchQuery}</span>'에 대한 검색 결과가 없습니다.
                  <br />다른 키워드로 다시 검색해보세요.
                </>
              ) : (
                '등록된 결과가 없습니다.'
              )}
            </p>
            <div className="flex gap-3">
              {searchQuery && (
                <button
                  onClick={() => performSearch('')}
                  className="px-6 py-2.5 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B] transition-colors font-medium"
                >
                  전체 보기
                </button>
              )}
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                홈으로 가기
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 검색 결과 표시
  const titleDesc = searchQuery
    ? `'${searchQuery}'에 대한 검색 결과`
    : '전체 결과';

  return (
    <>
      <TitleBar
        title={`검색: ${searchQuery || "전체"}`}
        desc={titleDesc}
      />

      {/* 검색 결과 요약 */}
      <div className="mx-auto max-w-7xl px-4 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm flex-1">
            {searchQuery && (
              <span className="text-gray-600">
                검색어: <span className="font-semibold text-gray-900">'{searchQuery}'</span>
              </span>
            )}
            <span className="text-gray-600">
              총 <span className="font-semibold text-[#E85A6B]">{totalCount}개</span> 결과
            </span>
            {hasBrands && (
              <span className="text-gray-500">
                브랜드 <span className="font-medium text-gray-700">{brands.length}개</span>
              </span>
            )}
            {hasProducts && (
              <span className="text-gray-500">
                상품 <span className="font-medium text-gray-700">{products.length}개</span>
              </span>
            )}
          </div>

          <SortDropdown value={sortBy} onChange={setSortBy} />

          {searchQuery && totalCount > 0 && (
            <button
              onClick={() => performSearch('')}
              className="text-sm text-[#E85A6B] hover:text-[#D14A5B] hover:underline"
            >
              전체 보기
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
                <span>브랜드</span>
                <span className="text-lg font-medium text-gray-500">({brands.length}개)</span>
              </h2>
              {brands.length > 6 && (
                <button
                  onClick={() => window.location.href = '/brands'}
                  className="text-sm text-[#E85A6B] hover:text-[#D14A5B] hover:underline"
                >
                  브랜드 전체 보기 →
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
                <span>상품</span>
                <span className="text-lg font-medium text-gray-500">({products.length}개)</span>
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
          </section>
        )}

        {/* 검색 결과가 적을 때 추가 안내 */}
        {totalCount > 0 && totalCount < 5 && (
          <div className="mt-8">
            <div className="bg-[#FFF1F2] rounded-lg p-6 text-center">
              <h4 className="text-lg font-medium text-blue-900 mb-2">더 많은 결과를 찾고 계신가요?</h4>
              <p className="text-[#E85A6B] mb-4">
                다양한 키워드로 검색하거나 카테고리를 둘러보세요.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => performSearch('')}
                  className="px-4 py-2 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B] transition-colors text-sm font-medium"
                >
                  전체 보기
                </button>
                <button
                  onClick={() => window.location.href = '/brands'}
                  className="px-4 py-2 border border-blue-300 text-[#E85A6B] rounded-lg hover:bg-[#E85A6B]/10 transition-colors text-sm font-medium"
                >
                  브랜드 둘러보기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
