import { useState, useEffect } from 'react';
import { sellerService } from '../../services/apiService';
import type { PublicCustomOrder, PublicCustomOrderListResponse } from '@handy-platform/shared';
import type { NailShape, NailLength } from '@handy-platform/shared';

// Usage:
// <Route path="/seller/custom-orders/public" element={<SellerPublicOrdersPage />} />

const SHAPE_LABELS: Record<NailShape, string> = {
  ROUND: '라운드',
  ALMOND: '아몬드',
  OVAL: '오벌',
  STILETTO: '스틸레토',
  SQUARE: '스퀘어',
  COFFIN: '코핀',
};

const LENGTH_LABELS: Record<NailLength, string> = {
  SHORT: '숏',
  MEDIUM: '미디엄',
  LONG: '롱',
};

const PAGE_LIMIT = 10;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function SellerPublicOrdersPage({ onGo }: { onGo: (to: string) => void }) {

  const [orders, setOrders] = useState<PublicCustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchOrders = async (targetPage: number, append: boolean) => {
    try {
      if (targetPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response: PublicCustomOrderListResponse = await sellerService.getPublicCustomOrders({
        page: targetPage,
        limit: PAGE_LIMIT,
      });

      if (response.success && response.data) {
        const incoming = response.data.orders;
        setOrders(prev => (append ? [...prev, ...incoming] : incoming));

        const { page: currentPage, totalPages } = response.data.pagination;
        setHasMore(currentPage < totalPages);
      } else {
        setError('주문 목록을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('[SellerPublicOrdersPage] fetch error:', err);
      setError(err.message || '주문 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, false);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchOrders(nextPage, true);
  };

  const handleOrderClick = (orderId: string) => {
    onGo(`/seller/custom-orders/public/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => history.back()}
            aria-label="뒤로 가기"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900">실시간 고객 주문 확인</h1>
        </div>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto">
        {/* Loading state (initial) */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg
              className="animate-spin w-8 h-8 text-[#E85A6B]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm text-gray-500">주문 목록 불러오는 중...</span>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600 text-center">{error}</p>
            <button
              onClick={() => fetchOrders(1, false)}
              className="px-4 py-2 bg-[#E85A6B] text-white text-sm font-medium rounded-lg hover:bg-[#d44d5e] transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500">현재 공개된 주문서가 없습니다</p>
          </div>
        )}

        {/* Order list */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map(order => {
              const specs = order.specifications;
              const shapeLabel = specs?.shape ? (SHAPE_LABELS[specs.shape] ?? specs.shape) : null;
              const lengthLabel = specs?.length ? (LENGTH_LABELS[specs.length] ?? specs.length) : null;
              const nailSpec = [shapeLabel, lengthLabel].filter(Boolean).join(' / ');

              return (
                <button
                  key={order.requestUuid || order.id}
                  onClick={() => handleOrderClick(order.requestUuid || order.id)}
                  className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md active:scale-[0.99] transition-all duration-150"
                >
                  {/* Top row: nickname + quote sent badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#FCE8EB] flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-[#E85A6B]"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-gray-800 truncate">
                        {order.buyerNickname}
                      </span>
                    </div>

                    {order.myQuoteStatus !== null && (
                      <span className="flex-shrink-0 px-2 py-0.5 bg-[#FCE8EB] text-[#E85A6B] text-xs font-medium rounded-full">
                        견적 보냄
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                    {order.title}
                  </p>

                  {/* Nail spec */}
                  {nailSpec && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs text-gray-500">네일 사양</span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs font-medium text-gray-700">{nailSpec}</span>
                    </div>
                  )}

                  {/* Desired date */}
                  {specs?.desiredDate && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs text-gray-500">희망 수령일</span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs font-medium text-gray-700">
                        {formatDate(specs.desiredDate)}
                      </span>
                    </div>
                  )}

                  {/* Bottom row: registered date + quotes count */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      등록일 {formatDate(order.createdAt)}
                    </span>

                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-xs text-gray-500">
                        받은 견적 <span className="font-semibold text-gray-700">{order.quotesCount ?? 0}</span>건
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Load more button */}
            {hasMore && (
              <div className="pt-2 pb-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-3 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4 text-[#E85A6B]"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      불러오는 중...
                    </>
                  ) : (
                    '더 보기'
                  )}
                </button>
              </div>
            )}

            {/* Bottom padding when no load more */}
            {!hasMore && <div className="pb-6" />}
          </div>
        )}
      </main>
    </div>
  );
}

