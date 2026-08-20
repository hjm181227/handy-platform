import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../../services/apiService';
import type { CustomOrderDetail, CustomOrderListResponse, CustomOrderStatus } from '@handy-platform/shared';

// ============================================================
// Types & Constants
// ============================================================

type FilterTab = 'all' | 'pending' | 'quoted' | 'in_progress' | 'completed';

interface FilterConfig {
  label: string;
  tab: FilterTab;
}

const FILTER_TABS: FilterConfig[] = [
  { label: '전체', tab: 'all' },
  { label: '대기중', tab: 'pending' },
  { label: '견적받음', tab: 'quoted' },
  { label: '진행중', tab: 'in_progress' },
  { label: '완료', tab: 'completed' },
];

const STATUS_LABELS: Record<CustomOrderStatus, string> = {
  pending: '대기중',
  quoted: '견적완료',
  approved: '결제대기',
  in_production: '제작중',
  completed: '완료',
  rejected: '거절됨',
  cancelled: '취소됨',
};

const STATUS_BADGE_CLASSES: Record<CustomOrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  quoted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  in_production: 'bg-brand-100 text-brand-700',
  completed: 'bg-surface text-muted',
  rejected: 'bg-red-100 text-red-600',
  cancelled: 'bg-red-50 text-red-400',
};

const NAIL_SHAPE_LABELS: Record<string, string> = {
  ROUND: '라운드',
  ALMOND: '아몬드',
  OVAL: '오벌',
  STILETTO: '스틸레토',
  SQUARE: '스퀘어',
  COFFIN: '코핀',
};

const NAIL_LENGTH_LABELS: Record<string, string> = {
  SHORT: '숏',
  MEDIUM: '미디엄',
  LONG: '롱',
};

// ============================================================
// Helpers
// ============================================================

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Maps a UI filter tab to the API status parameter.
 * Returns undefined for tabs that require client-side filtering (quoted, in_progress).
 */
function tabToApiStatus(tab: FilterTab): string | undefined {
  switch (tab) {
    case 'all':
      return undefined;
    case 'pending':
      return 'pending';
    case 'quoted':
      // "견적받음" = pending orders that have received at least one quote.
      // The API doesn't expose this as a distinct status, so we fetch all
      // pending orders and filter client-side.
      return 'pending';
    case 'in_progress':
      // The API accepts comma-separated values but the service signature
      // accepts a single string. Fetch without status filter and filter
      // client-side, or fetch 'approved' then supplement with 'in_production'.
      // Simplest: fetch without a status filter and let filterOrders() handle it.
      return undefined;
    case 'completed':
      return 'completed';
    default:
      return undefined;
  }
}

/**
 * Client-side filter applied after API fetch.
 */
function filterOrders(orders: CustomOrderDetail[], tab: FilterTab): CustomOrderDetail[] {
  switch (tab) {
    case 'all':
      return orders;
    case 'pending':
      // "대기중": pending with no quotes
      return orders.filter(o => o.status === 'pending' && !(o.quotesCount && o.quotesCount > 0));
    case 'quoted':
      // "견적받음": pending with at least one quote
      return orders.filter(o => o.status === 'pending' && (o.quotesCount ?? 0) > 0);
    case 'in_progress':
      return orders.filter(o => o.status === 'approved' || o.status === 'in_production');
    case 'completed':
      return orders.filter(o => o.status === 'completed');
    default:
      return orders;
  }
}

// ============================================================
// Sub-components
// ============================================================

function BackIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24" role="status" aria-label="로딩 중">
      <div className="w-10 h-10 border-4 border-line border-t-brand rounded-full animate-spin" />
      <p className="mt-3 text-sm text-muted">불러오는 중...</p>
    </div>
  );
}

interface StatusBadgeProps {
  status: CustomOrderStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const classes = STATUS_BADGE_CLASSES[status] ?? 'bg-surface text-muted';
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

interface QuotesBadgeProps {
  count: number;
}

function QuotesBadge({ count }: QuotesBadgeProps) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-brand-50 text-brand text-xs font-semibold px-2 py-0.5 rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2H7l-4 4V5z" />
      </svg>
      견적 {count}건
    </span>
  );
}

interface OrderCardProps {
  order: CustomOrderDetail;
  onClick: (id: string) => void;
}

function OrderCard({ order, onClick }: OrderCardProps) {
  const shapeLabel = NAIL_SHAPE_LABELS[order.specifications.shape] ?? order.specifications.shape;
  const lengthLabel = NAIL_LENGTH_LABELS[order.specifications.length] ?? order.specifications.length;
  const quotesCount = order.quotesCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => onClick(order.requestUuid || order.id)}
      className="w-full text-left bg-white rounded-xl shadow-sm border border-line p-4 active:bg-surface transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      aria-label={`${order.title} 상세 보기`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left: title + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <StatusBadge status={order.status} />
            {quotesCount > 0 && <QuotesBadge count={quotesCount} />}
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
            {order.title}
          </p>
        </div>
        {/* Right: chevron */}
        <ChevronRightIcon />
      </div>

      {/* Nail specs + date */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-xs text-muted">
          {shapeLabel} · {lengthLabel}
        </span>
        <span className="text-xs text-muted">
          등록일 {formatDate(order.createdAt)}
        </span>
      </div>
    </button>
  );
}

interface EmptyStateProps {
  onNavigateToNew: () => void;
}

function EmptyState({ onNavigateToNew }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4" aria-hidden="true">
        <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-base font-semibold text-gray-800 mb-1">아직 작성한 주문서가 없습니다</p>
      <p className="text-sm text-muted mb-6">나만의 커스텀 네일을 주문해보세요</p>
      <button
        type="button"
        onClick={onNavigateToNew}
        className="px-6 py-2.5 bg-brand text-white text-sm font-semibold rounded-full hover:bg-brand-600 active:bg-[#C03A5A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        주문서 작성하기
      </button>
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================

/**
 * CustomOrderManagementPage
 *
 * Usage example (in Router.tsx):
 *   import { CustomOrderManagementPage } from './components/pages/CustomOrderManagementPage';
 *   // Route: /my/custom-orders
 *   screen = <RequireAuth><CustomOrderManagementPage /></RequireAuth>;
 */
export function CustomOrderManagementPage({ onGo }: { onGo: (to: string) => void }) {

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [allOrders, setAllOrders] = useState<CustomOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const PAGE_LIMIT = 10;

  // Fetch a page of orders from the API.
  // When appending (load-more) we keep the existing list; otherwise we replace it.
  const fetchOrders = useCallback(
    async (page: number, tab: FilterTab, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          setError(null);
        }

        const apiStatus = tabToApiStatus(tab);
        const response: CustomOrderListResponse = await orderService.getMyCustomOrders({
          status: apiStatus,
          page,
          limit: PAGE_LIMIT,
        });

        if (response.success && response.data) {
          const fetched = response.data.orders ?? [];
          const pagination = response.data.pagination;

          setTotalPages(pagination.totalPages);
          setCurrentPage(pagination.page);

          if (append) {
            setAllOrders(prev => [...prev, ...fetched]);
          } else {
            setAllOrders(fetched);
          }
        } else {
          throw new Error('주문 목록을 불러올 수 없습니다.');
        }
      } catch (err: any) {
        console.error('[CustomOrderManagementPage] fetchOrders failed:', err);
        setError(err?.message ?? '주문 목록을 불러오는 중 오류가 발생했습니다.');
        if (!append) {
          setAllOrders([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Initial load and tab change: reset to page 1.
  useEffect(() => {
    setCurrentPage(1);
    setTotalPages(1);
    fetchOrders(1, activeTab, false);
  }, [activeTab, fetchOrders]);

  const handleTabChange = (tab: FilterTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  const handleLoadMore = () => {
    if (loadingMore || currentPage >= totalPages) return;
    const nextPage = currentPage + 1;
    fetchOrders(nextPage, activeTab, true);
  };

  const handleOrderClick = (id: string) => {
    onGo(`/my/custom-orders/${id}`);
  };

  const handleNavigateToNew = () => {
    onGo('/custom-order/new');
  };

  // Apply client-side filter for tabs that require it (quoted, in_progress).
  const visibleOrders = filterOrders(allOrders, activeTab);
  const hasMore = currentPage < totalPages;

  return (
    <div className="min-h-screen bg-surface">
      {/* ---- Sticky Header ---- */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => history.back()}
            className="p-1 text-ink hover:text-ink rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="뒤로 가기"
          >
            <BackIcon />
          </button>
          <h1 className="text-base font-bold text-gray-900">커스텀 주문 관리</h1>
        </div>

        {/* ---- Filter Tabs ---- */}
        <div className="max-w-2xl mx-auto border-t border-line">
          <nav
            className="flex overflow-x-auto scrollbar-hide"
            aria-label="주문 상태 필터"
            role="tablist"
          >
            {FILTER_TABS.map(({ label, tab }) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabChange(tab)}
                  className={`
                    flex-shrink-0 px-4 py-2.5 text-sm whitespace-nowrap
                    ${isActive
                      ? 'text-gray-900 font-bold'
                      : 'text-muted font-medium'
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ---- Main Content ---- */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Loading state (initial) */}
        {loading && <Spinner />}

        {/* Error state */}
        {!loading && error && (
          <div
            className="bg-red-50 border border-red-200 rounded-xl p-4 my-4 text-sm text-red-600"
            role="alert"
          >
            <p className="font-medium mb-1">오류가 발생했습니다</p>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => fetchOrders(1, activeTab, false)}
              className="mt-2 text-brand font-medium underline underline-offset-2 hover:no-underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && visibleOrders.length === 0 && (
          <EmptyState onNavigateToNew={handleNavigateToNew} />
        )}

        {/* Order list */}
        {!loading && !error && visibleOrders.length > 0 && (
          <>
            <ul className="space-y-3" role="list" aria-label="커스텀 주문 목록">
              {visibleOrders.map(order => (
                <li key={order.requestUuid || order.id}>
                  <OrderCard order={order} onClick={handleOrderClick} />
                </li>
              ))}
            </ul>

            {/* Load more */}
            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-2.5 bg-white border border-line text-sm font-medium text-ink rounded-full hover:bg-surface active:bg-surface-strong disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-busy={loadingMore}
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-line border-t-muted rounded-full animate-spin" aria-hidden="true" />
                      불러오는 중
                    </span>
                  ) : (
                    '더 보기'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

