import React, { useState, useEffect } from 'react';
import { ProductCard } from '../product/ProductCard';
import { Stars } from '../ui';
import { FaHeart, FaArrowUp, FaSearch } from 'react-icons/fa';
import { brandService } from '../../services/apiService';
import type { Brand, BrandsResponse, BrandListParams } from '@handy-platform/shared';

export function BrandsPage({
  onGo,
  onOpen,
  onAdd,
  onLike,
  likedProducts = []
}: {
  onGo: (to: string) => void;
  onOpen: (id: string) => void;
  onAdd: (id: string) => void;
  onLike?: (id: string) => void;
  likedProducts?: string[];
}) {
  // API 상태 관리
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'brandName' | 'averageRating' | 'totalProducts' | 'totalOrders' | 'createdAt'>('totalProducts');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showProducts, setShowProducts] = useState(true);


  // API에서 브랜드 데이터 가져오기
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: BrandListParams = {
          page: currentPage.toString(),
          listNum: '10',
          withItems: showProducts,
          itemListNum: '6',
          ...(searchQuery && { search: searchQuery }),
          sortBy,
          sortOrder
        };

        const response: BrandsResponse = await brandService.getBrands(params);

        setBrands(response.brands);
        setPagination(response.pagination);
      } catch (err) {
        console.error('Brand fetch error:', err);
        setError('브랜드 목록을 불러오는 데 오류가 발생했습니다.');
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [currentPage, searchQuery, sortBy, sortOrder, showProducts]);

  // 검색 제출 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 검색 시 페이지 초기화
  };

  // 정렬 변경 처리
  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // 브랜드 카드 컴포넌트
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
            <span className="text-blue-600 font-medium">{brand.stats.totalOrders}</span>
            <span>주문</span>
          </div>
        </div>

        <button
          onClick={() => onGo(`/brand/${encodeURIComponent(brand.sellerUuid)}`)}
          className="w-full rounded-md bg-gray-900 text-white py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          브랜드 보기
        </button>
      </div>
    );
  };

  const BrandRow = ({ brand }: { brand: Brand }) => {
    const isHot = brand.stats.totalProducts >= 5 || brand.stats.totalOrders > 100;

    return (
      <section className="mt-6">
        <div className="mb-2 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className="text-[15px] font-semibold">{brand.brandName}</div>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {brand.stats.totalProducts}개
            </span>
            {isHot && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-600">HOT</span>
            )}
          </div>
          <button
            onClick={() => onGo(`/brand/${encodeURIComponent(brand.sellerUuid)}`)}
            className="text-xs text-blue-600 hover:underline"
          >
            브랜드 프로필
          </button>
        </div>
        {brand.products && brand.products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:flex md:gap-4 md:overflow-x-auto pb-2">
            {brand.products.filter(Boolean).map((p) => {
              // 좋아요 API는 UUID를 사용하므로 productUuid 우선 사용
              const productId = p.productUuid || p.id;
              return (
                <div key={p.id || p.productId} className="md:snap-start">
                  <ProductCard p={p} onOpen={onOpen} onAdd={onAdd} onLike={onLike} onGo={onGo} isLiked={likedProducts.includes(productId)} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };


  // 로딩 상태
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="text-center py-20">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">브랜드 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold mb-2 text-red-600">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-600 text-white px-6 py-2 hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mx-auto max-w-7xl px-4 py-5">
        {/* 검색 및 필터 영역 */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* 검색바 */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="브랜드명 검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </form>

            {/* 정렬 및 옵션 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">정렬:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                    setCurrentPage(1);
                  }}
                  className="text-sm border border-gray-300 rounded px-2 py-1 outline-none"
                >
                  <option value="totalProducts-desc">상품 수 많은 순</option>
                  <option value="totalOrders-desc">주문 많은 순</option>
                  <option value="averageRating-desc">평점 높은 순</option>
                  <option value="brandName-asc">브랜드명 순</option>
                  <option value="createdAt-desc">최신 등록순</option>
                </select>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showProducts}
                  onChange={(e) => setShowProducts(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">상품 미리보기</span>
              </label>
            </div>
          </div>
        </div>

        {/* 브랜드 그리드 뷰 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">등록된 브랜드</h2>
            <span className="text-sm text-gray-500">총 {pagination?.totalItems || brands.length}개 브랜드</span>
          </div>

          {brands.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {brands.map((brand) => (
                <BrandCard key={brand.sellerUuid} brand={brand} />
              ))}
            </div>
          )}
        </div>

        {/* 브랜드별 상품 섹션 (상품 미리보기가 활성화된 경우만) */}
        {showProducts && brands.some(brand => brand.products && brand.products.length > 0) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">브랜드별 상품</h2>
            {brands
              .filter(brand => brand.products && brand.products.length > 0)
              .map((brand) => (
                <BrandRow key={`row-${brand.sellerUuid}`} brand={brand} />
              ))
            }
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 우측 플로팅 버튼 */}
      <div className="fixed right-6 bottom-6 flex flex-col items-center gap-3">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="h-12 w-12 rounded-full bg-white border shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        >
          <FaArrowUp className="text-lg" />
        </button>
      </div>
    </div>
  );
}
