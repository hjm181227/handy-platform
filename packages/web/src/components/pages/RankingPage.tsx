import { useState, useEffect, useCallback } from 'react';
import { RankedProductCard } from '../product/RankedProductCard';

type PeriodType = 'weekly' | 'monthly';

interface RankingProduct {
  rank: number;
  product: {
    productUuid: string;
    name: string;
    image: string;
    price: number;
  };
  seller: {
    sellerUuid: string;
    name: string;
  };
  stats: {
    salesCount: number;
    salesAmount: number;
    orderCount: number;
  };
}

interface RankingResponse {
  success: boolean;
  data?: {
    rankings: RankingProduct[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
    meta: {
      period: string;
      categoryType: string | null;
      categoryValue: string | null;
      periodStart: string;
      periodEnd: string;
      calculatedAt: string;
    };
  };
  error?: string;
}

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
  const [activePeriod, setActivePeriod] = useState<PeriodType>('weekly');
  const [rankings, setRankings] = useState<RankingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<RankingResponse['data']['meta'] | null>(null);

  // API 호출
  const fetchRankings = useCallback(async (period: PeriodType) => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/ranking?period=${period}&limit=50`);
      const data: RankingResponse = await response.json();

      if (data.success && data.data) {
        setRankings(data.data.rankings);
        setMeta(data.data.meta);
      } else {
        setError(data.error || '랭킹 데이터를 불러올 수 없습니다.');
        setRankings([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch rankings:', err);
      setError('랭킹 데이터를 불러오는 중 오류가 발생했습니다.');
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 기간 변경 시 데이터 다시 로드
  useEffect(() => {
    fetchRankings(activePeriod);
  }, [activePeriod, fetchRankings]);

  // 랭킹 데이터를 ProductCard 형식으로 변환
  const mapRankingToProduct = (item: RankingProduct) => ({
    id: item.product.productUuid,
    productUuid: item.product.productUuid,
    productId: item.product.productUuid,
    name: item.product.name,
    mainImageUrl: item.product.image,
    price: item.product.price,
    discountedPrice: item.product.price, // 랭킹 API에서는 할인가 정보 없음
    brand: item.seller.name,
    seller: {
      name: item.seller.name,
      userId: item.seller.sellerUuid
    },
    sellerUuid: item.seller.sellerUuid,
    rating: { average: 0, count: 0 },
    stats: {
      ordersCount: item.stats.orderCount,
      salesCount: item.stats.salesCount
    }
  });

  const getPeriodLabel = () => {
    if (!meta) return '';
    const start = new Date(meta.periodStart);
    const end = new Date(meta.periodEnd);
    return `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
  };

  return (
    <div className="relative">
      {/* 페이지 헤더 (데스크톱) */}
      <div className="mx-auto max-w-7xl px-4 py-4 border-b hidden md:block">
        <div>
          <h1 className="text-xl font-semibold">랭킹</h1>
          <p className="text-sm text-gray-600 mt-1">
            {activePeriod === 'weekly' ? '주간' : '월간'} 판매 랭킹
            {meta && ` (${getPeriodLabel()})`}
          </p>
        </div>
      </div>

      {/* 랭킹 필터 */}
      <div className="mx-auto max-w-7xl px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setActivePeriod('weekly')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activePeriod === 'weekly'
                ? 'bg-[#E85A6B] text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            주간 베스트
          </button>
          <button
            onClick={() => setActivePeriod('monthly')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activePeriod === 'monthly'
                ? 'bg-[#E85A6B] text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            월간 베스트
          </button>
        </div>
      </div>

      {/* 랭킹 상품 그리드 */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {loading ? (
          // 로딩 스켈레톤
          <div className="space-y-8">
            <div>
              <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          // 에러 상태
          <div className="text-center py-20">
            <div className="text-red-400 mb-4">
              <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">{error}</h3>
            <button
              onClick={() => fetchRankings(activePeriod)}
              className="mt-4 px-4 py-2 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B] transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : rankings.length === 0 ? (
          // 빈 상태
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">랭킹 데이터가 없습니다</h3>
            <p className="text-sm text-gray-500">아직 집계된 판매 데이터가 없습니다.</p>
          </div>
        ) : (
          <>
            {/* TOP 5 특별 섹션 */}
            {rankings.length >= 5 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">
                  TOP 5
                </h2>

                {/* 모바일: 페이지 단위 슬라이드 (2열 그리드) */}
                <div className="md:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4">
                  <div className="flex">
                    {Array.from({ length: Math.ceil(rankings.slice(0, 5).length / 2) }).map((_, pageIndex) => {
                      const startIndex = pageIndex * 2;
                      const pageProducts = rankings.slice(startIndex, Math.min(startIndex + 2, 5));

                      return (
                        <div
                          key={`page-${pageIndex}`}
                          className="w-full flex-shrink-0 snap-start px-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            {pageProducts.map((item, i) => {
                              const product = mapRankingToProduct(item);
                              const rank = startIndex + i + 1;
                              return (
                                <RankedProductCard
                                  key={item.product.productUuid}
                                  p={product}
                                  rank={rank}
                                  onOpen={onOpen}
                                  onAdd={onAdd}
                                  onLike={onLike}
                                  isLiked={likedProducts.includes(item.product.productUuid)}
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
                  {Array.from({ length: Math.ceil(rankings.slice(0, 5).length / 2) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gray-300"
                    />
                  ))}
                </div>

                {/* 데스크톱: 5열 그리드 */}
                <div className="hidden md:grid md:grid-cols-5 md:gap-4">
                  {rankings.slice(0, 5).map((item, index) => {
                    const product = mapRankingToProduct(item);
                    return (
                      <RankedProductCard
                        key={item.product.productUuid}
                        p={product}
                        rank={index + 1}
                        onOpen={onOpen}
                        onAdd={onAdd}
                        onLike={onLike}
                        isLiked={likedProducts.includes(item.product.productUuid)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 전체 랭킹 그리드 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">전체 랭킹</h2>
              <div className="flex flex-wrap -mx-2">
                {rankings.map((item) => {
                  const product = mapRankingToProduct(item);
                  return (
                    <div key={item.product.productUuid} className="w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-2 mb-4">
                      <RankedProductCard
                        p={product}
                        rank={item.rank}
                        onOpen={onOpen}
                        onAdd={onAdd}
                        onLike={onLike}
                        isLiked={likedProducts.includes(item.product.productUuid)}
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
