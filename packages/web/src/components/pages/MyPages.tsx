import { useState, useEffect } from 'react';
import { products } from '../../data';
import { purchaseApiService } from '../../services/purchaseApiService';
import type { CustomerOrder } from '@handy-platform/shared';

// 공통 컴포넌트들
const BackButton = ({ onBack, title }: { onBack: () => void; title: string }) => (
  <div className="border-b bg-white px-4 py-3">
    <div className="flex items-center gap-3">
      <button onClick={onBack} className="text-gray-600">
        <svg viewBox="0 0 24 24" className="h-6 w-6">
          <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  </div>
);

const EmptyState = ({ title, description, actionText, onAction }: {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}) => (
  <div className="mx-auto max-w-sm px-6 py-20 text-center">
    <div className="mb-4 text-4xl">📦</div>
    <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
    <p className="mb-6 text-sm text-gray-500">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        {actionText}
      </button>
    )}
  </div>
);

// 주문 내역 페이지
export function OrdersPage({ onGo }: { onGo: (to: string) => void }) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 필터 상태
  const [filters, setFilters] = useState({
    status: [] as string[],
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // 실제 API에서 주문 내역 로드
  const loadOrders = async (page: number = 1, filterOptions = filters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await purchaseApiService.getOrders({
        page,
        limit: 10,
        status: filterOptions.status.length > 0 ? filterOptions.status : undefined,
        sortBy: filterOptions.sortBy,
        sortOrder: filterOptions.sortOrder
      });

      console.log('Orders API Response:', response);

      if (response.success && response.orders) {
        setOrders(response.orders);
        setPagination(response.pagination);
        setCurrentPage(page);
      } else {
        throw new Error(response.message || '주문 내역을 불러올 수 없습니다.');
      }
    } catch (err: any) {
      console.error('Orders loading failed:', err);
      setError(err.message || '주문 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
    loadOrders(1, newFilters);
  };

  useEffect(() => {
    loadOrders(1);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "confirmed": return "bg-blue-100 text-blue-700";
      case "processing": return "bg-purple-100 text-purple-700";
      case "shipped": return "bg-orange-100 text-orange-700";
      case "delivered": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case "pending": return "대기 중";
      case "confirmed": return "확인됨";
      case "processing": return "처리 중";
      case "shipped": return "배송됨";
      case "delivered": return "배송완료";
      case "cancelled": return "취소됨";
      default: return status;
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BackButton onBack={() => onGo("/my")} title="주문 내역" />
        <div className="p-4 flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">주문 내역을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BackButton onBack={() => onGo("/my")} title="주문 내역" />
        <div className="p-4 flex justify-center items-center min-h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="주문 내역" />

      {/* 필터 영역 */}
      <div className="bg-white border-b px-4 py-3">
        <div className="space-y-3">
          {/* 주문 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">주문 상태</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: '', label: '전체' },
                { value: 'confirmed', label: '확인됨' },
                { value: 'processing', label: '처리 중' },
                { value: 'shipped', label: '배송됨' },
                { value: 'delivered', label: '배송완료' },
                { value: 'cancelled', label: '취소됨' }
              ].map(status => (
                <button
                  key={status.value}
                  onClick={() => {
                    const newStatus = status.value === ''
                      ? []
                      : filters.status.includes(status.value)
                        ? filters.status.filter(s => s !== status.value)
                        : [...filters.status, status.value];
                    handleFilterChange({ ...filters, status: newStatus });
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    (status.value === '' && filters.status.length === 0) || 
                    (status.value !== '' && filters.status.includes(status.value))
                      ? 'bg-blue-100 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 옵션 */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">정렬</label>
            <button
              onClick={() => handleFilterChange({
                ...filters,
                sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc'
              })}
              className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center gap-1"
            >
              {filters.sortOrder === 'desc' ? '↓' : '↑'}
              {filters.sortOrder === 'desc' ? '최신순' : '오래된순'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 필터 적용 상태 표시 */}
        {(filters.status.length > 0 || filters.sortOrder !== 'desc') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span>필터 적용:</span>
                {filters.status.length > 0 && (
                  <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                    상태: {filters.status.map(s => getStatusText(s)).join(', ')}
                  </span>
                )}
                {filters.sortOrder !== 'desc' && (
                  <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                    정렬: 오래된순
                  </span>
                )}
              </div>
              <button
                onClick={() => handleFilterChange({
                  status: [],
                  sortBy: 'createdAt',
                  sortOrder: 'desc'
                })}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                초기화
              </button>
            </div>
          </div>
        )}

        {/* 결과 개수 표시 */}
        {!loading && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              총 {pagination?.totalItems || orders.length}개의 주문
              {pagination && pagination.totalPages > 1 && (
                <> ({pagination.currentPage}/{pagination.totalPages} 페이지)</>
              )}
            </span>
            {orders.length > 0 && (
              <span className="text-xs">
                {filters.sortOrder === 'desc' ? '최신순' : '오래된순'} 정렬
              </span>
            )}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="text-gray-400 text-4xl">📦</div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">주문 내역이 없습니다</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              아직 주문하신 상품이 없습니다.<br />
              다양한 네일 상품을 둘러보세요!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => onGo('/')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                상품 둘러보기
              </button>
              <button
                onClick={() => onGo('/cart')}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                장바구니 확인
              </button>
            </div>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                  {order.paymentStatus === 'paid' && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      결제완료
                    </span>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>

              <div className="mb-3">
                <div className="font-medium mb-1">
                  주문번호: {order.orderNumber || order.id}
                </div>

                {/* 주문 상품 목록 */}
                <div className="mb-2">
                  {order.items && order.items.length > 0 ? (
                    <div className="space-y-2">
                      {order.items.slice(0, 2).map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName || 'Product'}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                📦
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.productName || '상품명'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {item.shape && item.size && (
                                <span>{item.shape} · {item.size}</span>
                              )}
                              <span>수량 {item.quantity}개</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {item.sellerName || ''}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-sm text-gray-500 text-center py-2">
                          외 {order.items.length - 2}개 상품
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 py-2">상품 정보 없음</div>
                  )}
                </div>

                <div className="font-semibold text-lg text-blue-600">
                  {order.totalAmount?.toLocaleString() || 0}원
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onGo(`/orders/${order.id}`)}
                  className="flex-1 py-2 px-4 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  주문상세
                </button>
                {order.status === 'shipped' && (
                  <button
                    onClick={() => onGo(`/orders/${order.id}/track`)}
                    className="flex-1 py-2 px-4 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    배송조회
                  </button>
                )}
                {(order.status === 'pending' || order.status === 'confirmed') && (
                  <button className="flex-1 py-2 px-4 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                    주문취소
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pb-4">
            <button
              onClick={() => loadOrders(currentPage - 1, filters)}
              disabled={!pagination.hasPrev}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 2);
                const page = startPage + i;
                if (page > pagination.totalPages) return null;

                return (
                  <button
                    key={page}
                    onClick={() => loadOrders(page, filters)}
                    className={`px-3 py-2 text-sm border rounded-lg ${
                      page === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => loadOrders(currentPage + 1, filters)}
              disabled={!pagination.hasNext}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>

            <div className="text-sm text-gray-500 ml-4">
              {pagination.totalItems}개 중 {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, pagination.totalItems)}개
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 배송중 주문 페이지
export function ShippingPage({ onGo }: { onGo: (to: string) => void }) {
  const shippingOrders = [
    {
      id: "2024081801",
      date: "2024-08-18",
      items: ["Glossy Almond Tip – Milk Beige"],
      trackingNumber: "123456789",
      courier: "한진택배",
      status: "배송중",
      estimatedDelivery: "2024-08-20"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="배송중 주문" />
      <div className="p-4 space-y-4">
        {shippingOrders.length === 0 ? (
          <EmptyState
            title="배송중인 주문이 없습니다"
            description="주문하신 상품이 없거나 이미 배송이 완료되었습니다."
            actionText="쇼핑하러 가기"
            onAction={() => onGo("/")}
          />
        ) : (
          shippingOrders.map(order => (
            <div key={order.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">주문일: {order.date}</span>
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                  {order.status}
                </span>
              </div>
              <div className="mb-4">
                <div className="font-medium mb-1">{order.items.join(", ")}</div>
                <div className="text-sm text-gray-600 mb-2">
                  {order.courier} | {order.trackingNumber}
                </div>
                <div className="text-sm text-blue-600">
                  예상 도착일: {order.estimatedDelivery}
                </div>
              </div>
              <button className="w-full py-2 px-4 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                실시간 배송조회
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 반품/교환 내역 페이지
export function ClaimsPage({ onGo }: { onGo: (to: string) => void }) {
  const claims: any[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="반품/교환 내역" />
      <div className="p-4">
        {claims.length === 0 ? (
          <EmptyState
            title="반품/교환 내역이 없습니다"
            description="반품이나 교환 요청 내역이 없습니다."
            actionText="주문 내역 보기"
            onAction={() => onGo("/my/orders")}
          />
        ) : (
          <div className="space-y-4">
            {/* 반품/교환 내역이 있을 때 렌더링 */}
          </div>
        )}
      </div>
    </div>
  );
}

// 취소 내역 페이지
export function CancelPage({ onGo }: { onGo: (to: string) => void }) {
  const cancelledOrders: any[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="취소 내역" />
      <div className="p-4">
        {cancelledOrders.length === 0 ? (
          <EmptyState
            title="취소 내역이 없습니다"
            description="주문 취소 내역이 없습니다."
            actionText="쇼핑하러 가기"
            onAction={() => onGo("/")}
          />
        ) : (
          <div className="space-y-4">
            {/* 취소 내역이 있을 때 렌더링 */}
          </div>
        )}
      </div>
    </div>
  );
}

// 리뷰 관리 페이지
export function ReviewsPage({ onGo }: { onGo: (to: string) => void }) {
  const reviews = [
    { id: 1, product: "Glossy Almond Tip – Milk Beige", rating: 5, content: "색상도 예쁘고 품질이 좋아요!", date: "2024-08-15", image: "https://picsum.photos/id/1060/800/800" },
    { id: 2, product: "Square Short – Cocoa", rating: 4, content: "사이즈가 딱 맞아서 만족합니다.", date: "2024-08-10", image: "https://picsum.photos/id/1059/800/800" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="내 리뷰 관리" />
      <div className="p-4 space-y-4">
        {reviews.map(review => (
          <div key={review.id} className="bg-white rounded-lg border p-4">
            <div className="flex gap-3 mb-3">
              <img src={review.image} className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="font-medium mb-1">{review.product}</div>
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({length: 5}).map((_, i) => (
                    <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                  ))}
                </div>
                <div className="text-xs text-gray-500">{review.date}</div>
              </div>
            </div>
            <div className="text-sm text-gray-700 mb-3">{review.content}</div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50">수정</button>
              <button className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 text-red-600">삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 쿠폰함 페이지
export function CouponsPage({ onGo }: { onGo: (to: string) => void }) {
  const coupons = [
    { id: 1, name: "신규회원 10% 할인", discount: 10, type: "percent", minOrder: 50000, expiry: "2024-12-31", used: false },
    { id: 2, name: "5천원 할인쿠폰", discount: 5000, type: "fixed", minOrder: 30000, expiry: "2024-09-30", used: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="쿠폰함" />
      <div className="p-4 space-y-3">
        {coupons.map(coupon => (
          <div key={coupon.id} className={`bg-white rounded-lg border-2 ${coupon.used ? 'border-gray-200 opacity-50' : 'border-blue-200'} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{coupon.name}</div>
              <div className={`text-lg font-bold ${coupon.used ? 'text-gray-400' : 'text-blue-600'}`}>
                {coupon.type === 'percent' ? `${coupon.discount}%` : `${coupon.discount.toLocaleString()}원`}
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-3">
              {coupon.minOrder.toLocaleString()}원 이상 구매 시 • {coupon.expiry}까지
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-xs px-2 py-1 rounded ${coupon.used ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                {coupon.used ? '사용완료' : '사용가능'}
              </span>
              {!coupon.used && (
                <button className="text-xs text-blue-600 hover:underline">바로사용</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 포인트 페이지
export function PointsPage({ onGo }: { onGo: (to: string) => void }) {
  const currentPoints = 2300;
  const pointHistory = [
    { id: 1, type: "적립", amount: 230, reason: "주문완료 적립", date: "2024-08-15", orderId: "2024081502" },
    { id: 2, type: "사용", amount: -500, reason: "주문 시 포인트 사용", date: "2024-08-12", orderId: "2024081203" },
    { id: 3, type: "적립", amount: 300, reason: "리뷰작성 적립", date: "2024-08-10", orderId: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="포인트" />

      {/* 포인트 요약 */}
      <div className="bg-white border-b p-6">
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">보유 포인트</div>
          <div className="text-3xl font-bold text-blue-600 mb-4">{currentPoints.toLocaleString()}P</div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">
            포인트 사용하기
          </button>
        </div>
      </div>

      {/* 포인트 내역 */}
      <div className="p-4">
        <h3 className="font-medium mb-3">포인트 내역</h3>
        <div className="space-y-3">
          {pointHistory.map(history => (
            <div key={history.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
              <div>
                <div className="font-medium mb-1">{history.reason}</div>
                <div className="text-xs text-gray-500">{history.date}</div>
                {history.orderId && (
                  <div className="text-xs text-gray-400">주문번호: {history.orderId}</div>
                )}
              </div>
              <div className={`font-semibold ${history.type === '적립' ? 'text-blue-600' : 'text-red-600'}`}>
                {history.type === '적립' ? '+' : ''}{history.amount.toLocaleString()}P
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 결제수단 관리 페이지
export function PaymentsPage({ onGo }: { onGo: (to: string) => void }) {
  const [cards] = useState([
    { id: 1, type: "신용카드", name: "KB국민카드", number: "**** **** **** 1234", isDefault: true },
    { id: 2, type: "체크카드", name: "신한카드", number: "**** **** **** 5678", isDefault: false },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton onBack={() => onGo("/my")} title="결제수단 관리" />
      <div className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-medium">등록된 카드</h3>
          <button className="text-sm text-blue-600 hover:underline">+ 카드 추가</button>
        </div>

        <div className="space-y-3">
          {cards.map(card => (
            <div key={card.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{card.name}</div>
                {card.isDefault && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">기본</span>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-3">{card.number}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50">수정</button>
                <button className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 text-red-600">삭제</button>
                {!card.isDefault && (
                  <button className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">기본으로 설정</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
