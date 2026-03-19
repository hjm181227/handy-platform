import React, { useState, useEffect } from 'react';
import { Stars } from '../ui';
import { FaSearch } from 'react-icons/fa';
import { brandService } from '../../services/apiService';
import type { Brand, BrandsResponse, BrandListParams } from '@handy-platform/shared';

type SortOption = {
  key: 'totalOrders' | 'totalProducts' | 'averageRating' | 'createdAt';
  label: string;
  order: 'asc' | 'desc';
};

const SORT_OPTIONS: SortOption[] = [
  { key: 'totalOrders', label: '인기순', order: 'desc' },
  { key: 'totalProducts', label: '상품 많은순', order: 'desc' },
  { key: 'averageRating', label: '평점 높은순', order: 'desc' },
  { key: 'createdAt', label: '최신순', order: 'desc' },
];

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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        setError(null);

        const sort = SORT_OPTIONS[activeSort];
        const params: BrandListParams = {
          page: currentPage.toString(),
          listNum: '20',
          withItems: false,
          ...(searchQuery && { search: searchQuery }),
          sortBy: sort.key,
          sortOrder: sort.order
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
  }, [currentPage, searchQuery, activeSort]);

  const handleSortChange = (index: number) => {
    setActiveSort(index);
    setCurrentPage(1);
  };

  // 브랜드 카드
  const BrandCard = ({ brand }: { brand: Brand }) => {
    const isHot = brand.stats.totalProducts >= 5 || brand.stats.totalOrders > 100;

    return (
      <div
        onClick={() => onGo(`/brand/${encodeURIComponent(brand.sellerUuid)}`)}
        className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2.5 cursor-pointer hover:shadow-md transition-shadow"
      >
        {/* 프로필 이미지 */}
        <div className="w-14 h-14 rounded-full bg-[#FFF1F2] flex items-center justify-center overflow-hidden">
          {brand.brandProfile ? (
            <img
              src={brand.brandProfile}
              alt={brand.brandName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-[#E85A6B]">
              {brand.brandName.charAt(0)}
            </span>
          )}
        </div>

        {/* 브랜드명 */}
        <span className="text-sm font-semibold text-gray-900 text-center leading-tight">
          {brand.brandName}
        </span>

        {/* 별점 */}
        <div className="flex items-center gap-1">
          <Stars v={brand.stats.averageRating} />
          <span className="text-[13px] font-semibold text-gray-800">
            {brand.stats.averageRating.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400">
            ({brand.stats.totalOrders})
          </span>
        </div>

        {/* 상품수 / 주문수 */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-gray-400">
            상품 {brand.stats.totalProducts}개
          </span>
          <span className="text-[11px] font-medium text-[#E85A6B]">
            주문 {brand.stats.totalOrders}+
          </span>
        </div>

        {/* HOT 뱃지 */}
        {isHot && (
          <span className="bg-[#FFF1F2] text-[#E85A6B] text-[10px] font-bold px-2 py-0.5 rounded-lg">
            HOT
          </span>
        )}
      </div>
    );
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-[#E85A6B]/20 border-t-[#E85A6B] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">브랜드 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="text-center py-20">
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[#E85A6B] text-white px-6 py-2 text-sm hover:bg-[#D14A5B]"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 페이지 헤더 (데스크톱) */}
      <div className="mx-auto max-w-7xl px-4 py-4 border-b hidden md:block">
        <div>
          <h1 className="text-xl font-semibold">브랜드</h1>
          <p className="text-sm text-gray-600 mt-1">
            총 {pagination?.totalItems || brands.length}개 브랜드
          </p>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="mx-auto max-w-7xl px-4 py-3 border-b bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {/* 검색바 */}
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="브랜드명으로 검색"
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#E85A6B] focus:ring-1 focus:ring-[#E85A6B] placeholder-gray-400"
            />
          </div>

          {/* 필터 칩 */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {SORT_OPTIONS.map((opt, i) => (
              <button
                key={opt.key}
                onClick={() => handleSortChange(i)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeSort === i
                    ? 'bg-[#E85A6B] text-white'
                    : 'bg-white border hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 브랜드 그리드 */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* 모바일 카운트 */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <span className="text-sm font-semibold text-gray-800">
            총 {pagination?.totalItems || brands.length}개 브랜드
          </span>
        </div>

        {brands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {brands.map((brand) => (
              <BrandCard key={brand.sellerUuid} brand={brand} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                이전
              </button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 text-sm rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-[#E85A6B] text-white'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 우측 플로팅 버튼 */}
      <div className="fixed right-6 bottom-24 flex flex-col items-center gap-3">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="h-12 w-12 rounded-full bg-white border text-xl leading-none shadow-lg hover:shadow-xl transition-shadow"
        >
          ⬆
        </button>
      </div>
    </div>
  );
}
