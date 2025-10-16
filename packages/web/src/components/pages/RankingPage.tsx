import React, { useState, useMemo } from 'react';
import { products } from '../../data';
import { RankedProductCard } from '../product/RankedProductCard';
import { FaTrophy } from 'react-icons/fa';

type FilterType = 'all' | 'weekly' | 'monthly';

export function RankingPage({
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
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // 기본 랭킹 로직 (평점 기준)
  const getRankedProducts = (productList: typeof products) => {
    return [...productList]
      .filter(product => product.rating && product.rating.average > 0)
      .sort((a, b) => {
        // 1차: 평점 내림차순
        const ratingDiff = (b.rating?.average ?? 0) - (a.rating?.average ?? 0);
        if (ratingDiff !== 0) return ratingDiff;

        // 2차: 리뷰 수 내림차순 (동점일 때)
        const reviewDiff = (b.rating?.count ?? 0) - (a.rating?.count ?? 0);
        if (reviewDiff !== 0) return reviewDiff;

        // 3차: 좋아요 수 내림차순 (여전히 동점일 때)
        return (b.likesCount ?? 0) - (a.likesCount ?? 0);
      });
  };

  // 이주의 베스트 (최근 2주간 주문 많은 상품)
  const getWeeklyBestProducts = () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    return [...products]
      .filter(product => {
        // 최근 2주간 활동이 있는 상품 (주문수, 좋아요 등 기준)
        return (product.stats?.ordersCount ?? 0) > 0 || (product.likesCount ?? 0) > 10;
      })
      .sort((a, b) => {
        // 주문수 기준 정렬
        const orderDiff = (b.stats?.ordersCount ?? 0) - (a.stats?.ordersCount ?? 0);
        if (orderDiff !== 0) return orderDiff;

        // 좋아요 수 기준
        return (b.likesCount ?? 0) - (a.likesCount ?? 0);
      });
  };

  // 이달의 베스트 (이번 달 주문 많은 상품)
  const getMonthlyBestProducts = () => {
    return [...products]
      .filter(product => {
        // 이번 달 활동이 있는 상품
        return (product.stats?.ordersCount ?? 0) > 0 || (product.rating?.count ?? 0) > 5;
      })
      .sort((a, b) => {
        // 주문수 + 평점 조합 정렬
        const scoreA = (a.stats?.ordersCount ?? 0) * 0.7 + (a.rating?.average ?? 0) * 0.3;
        const scoreB = (b.stats?.ordersCount ?? 0) * 0.7 + (b.rating?.average ?? 0) * 0.3;
        return scoreB - scoreA;
      });
  };

  // 필터에 따른 상품 목록
  const filteredProducts = useMemo(() => {
    switch (activeFilter) {
      case 'weekly':
        return getWeeklyBestProducts();
      case 'monthly':
        return getMonthlyBestProducts();
      default:
        return getRankedProducts(products);
    }
  }, [activeFilter]);

  const getFilterTitle = () => {
    return '';
  };

  return (
    <div className="relative">
      {/* 페이지 헤더 */}
      <div className="mx-auto max-w-7xl px-4 py-4 border-b">
        <div>
          <h1 className="text-xl font-semibold">랭킹</h1>
          <p className="text-sm text-gray-600 mt-1">{getFilterTitle()}</p>
        </div>
      </div>

      {/* 랭킹 필터 */}
      <div className="mx-auto max-w-7xl px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setActiveFilter('weekly')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            이주의 베스트
          </button>
          <button
            onClick={() => setActiveFilter('monthly')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            이달의 베스트
          </button>
        </div>
      </div>

      {/* 랭킹 상품 그리드 */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">랭킹 데이터가 없습니다</h3>
            <p className="text-sm text-gray-500">해당 조건의 상품이 없습니다.</p>
          </div>
        ) : (
          <>
            {/* TOP 5 특별 섹션 */}
            {filteredProducts.length >= 5 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaTrophy className="text-yellow-500" />
                  TOP 5
                </h2>

                {/* 모바일: 페이지 단위 슬라이드 (2열 그리드) */}
                <div className="md:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4">
                  <div className="flex">
                    {Array.from({ length: Math.ceil(filteredProducts.slice(0, 5).length / 2) }).map((_, pageIndex) => {
                      const startIndex = pageIndex * 2;
                      const pageProducts = filteredProducts.slice(startIndex, Math.min(startIndex + 2, 5));

                      return (
                        <div
                          key={`page-${pageIndex}`}
                          className="w-full flex-shrink-0 snap-start px-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            {pageProducts.map((product, i) => {
                              const productId = product.id || product.productUuid;
                              const rank = startIndex + i + 1;
                              return (
                                <RankedProductCard
                                  key={product.id || product.productId}
                                  p={product}
                                  rank={rank}
                                  onOpen={onOpen}
                                  onAdd={onAdd}
                                  onLike={onLike}
                                  isLiked={likedProducts.includes(productId)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 페이지 인디케이터 (모바일만) */}
                <div className="md:hidden flex justify-center gap-2 mt-4">
                  {Array.from({ length: Math.ceil(filteredProducts.slice(0, 5).length / 2) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gray-300"
                    />
                  ))}
                </div>

                {/* 데스크톱: 5열 그리드 */}
                <div className="hidden md:grid md:grid-cols-5 md:gap-4">
                  {filteredProducts.slice(0, 5).map((product, index) => {
                    const productId = product.id || product.productUuid;
                    return (
                      <RankedProductCard
                        key={product.id || product.productId}
                        p={product}
                        rank={index + 1}
                        onOpen={onOpen}
                        onAdd={onAdd}
                        onLike={onLike}
                        isLiked={likedProducts.includes(productId)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 전체 랭킹 그리드 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">전체 랭킹</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredProducts.map((product, index) => {
                  const productId = product.id || product.productUuid;
                  return (
                    <div key={product.id || product.productId}>
                      <RankedProductCard
                        p={product}
                        rank={index + 1}
                        onOpen={onOpen}
                        onAdd={onAdd}
                        onLike={onLike}
                        isLiked={likedProducts.includes(productId)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 우측 플로팅 버튼 */}
      <div className="fixed right-6 bottom-6 flex flex-col items-center gap-3">
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