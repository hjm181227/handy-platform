import { useState, useEffect } from 'react';
import { purchaseApiService } from '../../services/purchaseApiService';
import { reviewService, userService, loyaltyService } from '../../services/apiService';
import type { CustomerOrder, DetailedReview } from '@handy-platform/shared';
import type { NailSizeData } from '@handy-platform/shared/src/services/user/UserService';
import { englishToKoreanFinger, ALL_FINGERS_ENGLISH } from '@handy-platform/shared/src/utils/fingerMapping';
import { PageHeader } from '../layout/PageHeader';
import { ReviewWriteModal, OrderItemForReview } from '../review/ReviewWriteModal';
import { Ruler, RefreshCw, Camera, Download } from 'lucide-react';
import { renderNailSizeChart, downloadNailSizeChart } from '../../utils/nailSizeChartExport';

// 공통 컴포넌트들

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
        className="rounded-lg bg-[#E85A6B] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#D14A5B]"
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

  // 주문 취소 관련 상태
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // 리뷰 작성 관련 상태
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<OrderItemForReview | null>(null);

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

      // purchaseApiService는 항상 success 필드를 반환하도록 수정됨
      if (response.success && response.orders) {
        setOrders(response.orders);
        setPagination(response.pagination);
        setCurrentPage(page);
      } else {
        // API가 실패 응답을 반환한 경우
        throw new Error(response.message || '주문 내역을 불러올 수 없습니다.');
      }
    } catch (err: any) {
      console.error('Orders loading failed:', err);
      const errorMessage = err.message || '주문 내역을 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
      // 에러 발생 시 빈 배열로 초기화
      setOrders([]);
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

  // 주문 취소 핸들러
  const handleCancelOrder = async () => {
    if (!cancellingOrderId) return;

    try {
      setLoading(true);

      // 주문 취소 API 호출
      const response = await purchaseApiService.cancelOrder(cancellingOrderId, cancelReason || '고객 요청');

      if (response.success) {
        alert('주문이 성공적으로 취소되었습니다.');

        // 모달 닫기 및 상태 초기화
        setShowCancelModal(false);
        setCancellingOrderId(null);
        setCancelReason('');

        // 주문 목록 새로고침
        await loadOrders(currentPage, filters);
      } else {
        throw new Error(response.message || '주문 취소에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Order cancellation failed:', err);
      alert(err.message || '주문 취소 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 취소 모달 열기
  const openCancelModal = (orderId: string) => {
    setCancellingOrderId(orderId);
    setShowCancelModal(true);
    setCancelReason('');
  };

  // 취소 모달 닫기
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancellingOrderId(null);
    setCancelReason('');
  };

  // 리뷰 작성 모달 열기
  const openReviewModal = (order: CustomerOrder, item: any) => {
    // UUID 우선순위: productUuid > product.uuid > productId > product.id
    const productId = item.productUuid || item.product?.uuid || item.productId || item.product?.id || '';

    setSelectedOrderItem({
      productId,
      productName: item.productName || item.product?.name || '상품명',
      productImage: item.productImage || item.product?.mainImage || '',
      orderId: order.id,
      orderItemId: item.id,
      options: {
        ...(item.shape && { 쉐입: item.shape }),
        ...(item.size && { 사이즈: item.size }),
        ...(item.color && { 색상: item.color }),
      }
    });
    setShowReviewModal(true);
  };

  // 리뷰 작성 모달 닫기
  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedOrderItem(null);
  };

  // 리뷰 작성 성공
  const handleReviewSuccess = () => {
    alert('리뷰가 등록되었습니다!');
    // 필요시 주문 목록 새로고침
    loadOrders(currentPage, filters);
  };

  useEffect(() => {
    loadOrders(1);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "confirmed": return "bg-[#FFF1F2] text-[#E85A6B]";
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

  // 페이지 헤더 (모든 상태에서 동일하게 사용)
  const orderHeader = (
    <PageHeader
      title="주문 내역"
      onBack={() => onGo("/my")}
      rightActions={[
        {
          icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          onClick: () => onGo("/"),
          ariaLabel: "홈으로"
        }
      ]}
    />
  );

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {orderHeader}
        <div className="p-4 flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E85A6B] mx-auto mb-2"></div>
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
        {orderHeader}
        <div className="p-4 flex justify-center items-center min-h-64">
          <div className="text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => loadOrders(currentPage, filters)}
              className="bg-[#E85A6B] text-white px-6 py-2.5 rounded-lg hover:bg-[#D14A5B] transition-colors"
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
      {orderHeader}

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
                      ? 'bg-[#FFF1F2] border-[#E85A6B]/20 text-[#E85A6B]'
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
          <div className="bg-[#FFF1F2] border border-[#E85A6B]/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#E85A6B]">
                <span>필터 적용:</span>
                {filters.status.length > 0 && (
                  <span className="bg-[#FFF1F2] px-2 py-1 rounded text-xs">
                    상태: {filters.status.map(s => getStatusText(s)).join(', ')}
                  </span>
                )}
                {filters.sortOrder !== 'desc' && (
                  <span className="bg-[#FFF1F2] px-2 py-1 rounded text-xs">
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
                className="text-xs text-[#E85A6B] hover:text-[#E85A6B] hover:underline"
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
                className="bg-[#E85A6B] text-white px-6 py-3 rounded-lg hover:bg-[#D14A5B] transition-colors font-medium"
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
                          {/* 배송완료 시 리뷰 쓰기 버튼 */}
                          {order.status === 'delivered' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openReviewModal(order, item);
                              }}
                              className="flex-shrink-0 px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                            >
                              리뷰 쓰기
                            </button>
                          )}
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

                <div className="font-semibold text-lg text-[#E85A6B]">
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
                    className="flex-1 py-2 px-4 text-sm bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B] transition-colors"
                  >
                    배송조회
                  </button>
                )}
                {(order.status === 'pending' || order.status === 'confirmed') && (
                  <button
                    onClick={() => openCancelModal(order.id)}
                    className="flex-1 py-2 px-4 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
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
                        ? 'bg-[#E85A6B] text-white border-[#E85A6B]'
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

      {/* 주문 취소 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">주문 취소</h3>

            <p className="text-gray-600 mb-4">
              주문을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                취소 사유 (선택사항)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="취소 사유를 입력해주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeCancelModal}
                disabled={loading}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                돌아가기
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? '취소 중...' : '주문 취소'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 리뷰 작성 모달 */}
      {showReviewModal && selectedOrderItem && (
        <ReviewWriteModal
          isOpen={showReviewModal}
          onClose={closeReviewModal}
          onSuccess={handleReviewSuccess}
          orderItem={selectedOrderItem}
          mode="create"
        />
      )}
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
      <PageHeader title="배송중 주문" onBack={() => onGo("/my")} />
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
                <div className="text-sm text-[#E85A6B]">
                  예상 도착일: {order.estimatedDelivery}
                </div>
              </div>
              <button className="w-full py-2 px-4 text-sm bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B]">
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
      <PageHeader title="반품/교환 내역" onBack={() => onGo("/my")} />
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
      <PageHeader title="취소 내역" onBack={() => onGo("/my")} />
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
  const [reviews, setReviews] = useState<DetailedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 수정 모달 상태
  const [editingReview, setEditingReview] = useState<DetailedReview | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // 삭제 확인 상태
  const [deletingReview, setDeletingReview] = useState<DetailedReview | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await reviewService.getUserReviews({
        page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // 서버 응답: { reviews: [...], pagination: {...} }
      const data = response.data || response;
      if (data) {
        setReviews(data.reviews || []);
        setPagination(data.pagination);
        setCurrentPage(page);
      }
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      setError(err.message || '리뷰를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(1);
  }, []);

  const handleEditClick = (review: DetailedReview) => {
    setEditingReview(review);
    setShowEditModal(true);
  };

  const handleDeleteClick = (review: DetailedReview) => {
    setDeletingReview(review);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReview) return;

    try {
      setDeleting(true);
      // productUuid에서 productId 추출 (productUuid.productUuid 필드 우선)
      const productUuidObj = (deletingReview as any).productUuid;
      const productId = typeof productUuidObj === 'object'
        ? (productUuidObj?.productUuid || productUuidObj?.uuid || productUuidObj?._id)
        : productUuidObj || '';
      if (!productId) {
        alert('상품 정보를 찾을 수 없습니다.');
        setDeleting(false);
        return;
      }
      // reviewUuid > uuid > _id > id 우선순위로 reviewId 추출
      const reviewId = (deletingReview as any).reviewUuid || (deletingReview as any).uuid || (deletingReview as any)._id || deletingReview.id;
      if (!reviewId) {
        alert('리뷰 정보를 찾을 수 없습니다.');
        setDeleting(false);
        return;
      }
      await reviewService.deleteReview(productId, reviewId);
      setShowDeleteConfirm(false);
      setDeletingReview(null);
      alert('리뷰가 삭제되었습니다.');
      loadReviews(currentPage);
    } catch (err: any) {
      console.error('Failed to delete review:', err);
      alert(err.message || '리뷰 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingReview(null);
    alert('리뷰가 수정되었습니다.');
    loadReviews(currentPage);
  };

  // 페이지 헤더
  const reviewHeader = (
    <PageHeader
      title="내 리뷰 관리"
      onBack={() => onGo("/my")}
      rightActions={[
        {
          icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          onClick: () => onGo("/"),
          ariaLabel: "홈으로"
        }
      ]}
    />
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {reviewHeader}
        <div className="p-4 flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-gray-500">리뷰를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {reviewHeader}
        <div className="p-4 flex justify-center items-center min-h-64">
          <div className="text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => loadReviews(currentPage)}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
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
      {reviewHeader}

      <div className="p-4 space-y-4">
        {/* 리뷰 개수 표시 */}
        <div className="text-sm text-gray-600">
          총 {pagination?.totalItems || reviews.length}개의 리뷰
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="text-gray-400 text-4xl">✍️</div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">작성한 리뷰가 없습니다</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              구매하신 상품에 대한 리뷰를 작성해주세요!
            </p>
            <button
              onClick={() => onGo('/my/orders')}
              className="bg-[#E85A6B] text-white px-6 py-3 rounded-lg hover:bg-[#D14A5B] transition-colors font-medium"
            >
              주문 내역 보기
            </button>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-white rounded-lg border p-4">
              <div className="flex gap-3 mb-3">
                {/* 리뷰 이미지 또는 상품 이미지 */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  {review.images && review.images.length > 0 ? (
                    <img
                      src={review.images[0].url}
                      alt="리뷰 이미지"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                      📝
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {/* 상품명 - API에서 제공시 표시 */}
                  {(review as any).productName && (
                    <div className="font-medium mb-1 truncate">{(review as any).productName}</div>
                  )}
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({length: 5}).map((_, i) => (
                      <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{review.rating}점</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>

              {/* 리뷰 내용 */}
              <div className="text-sm text-gray-700 mb-3 line-clamp-3">{review.content}</div>

              {/* 리뷰 이미지 썸네일들 */}
              {review.images && review.images.length > 1 && (
                <div className="flex gap-2 mb-3">
                  {review.images.slice(1).map((img, idx) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt={`리뷰 이미지 ${idx + 2}`}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ))}
                </div>
              )}

              {/* 판매자 답변 */}
              {review.reply && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-purple-700">판매자 답변</span>
                    <span className="text-xs text-gray-400">
                      {new Date(review.reply.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{review.reply.content}</p>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(review)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDeleteClick(review)}
                  className="px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pb-4">
            <button
              onClick={() => loadReviews(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="text-sm text-gray-600">
              {currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => loadReviews(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 수정 모달 */}
      {showEditModal && editingReview && (
        <ReviewWriteModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingReview(null);
          }}
          onSuccess={handleEditSuccess}
          existingReview={editingReview}
          mode="edit"
        />
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-4">리뷰 삭제</h3>
            <p className="text-gray-600 mb-6">
              이 리뷰를 삭제하시겠습니까?<br />
              삭제된 리뷰는 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingReview(null);
                }}
                disabled={deleting}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 쿠폰함 페이지
export function CouponsPage({ onGo }: { onGo: (to: string) => void }) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [summary, setSummary] = useState<{ available: number; used: number; expired: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'available' | 'used' | 'expired'>('available');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await loyaltyService.getUserCoupons({ status: tab, limit: 50 });
        const data = (res as any)?.data;
        setCoupons(data?.coupons || []);
        if (data?.summary) {
          setSummary(data.summary);
        }
      } catch (err) {
        console.error('Failed to load coupons:', err);
        setError('쿠폰을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab]);

  const discountText = (coupon: any) => {
    if (!coupon) return '';
    if (coupon.discountType === 'percentage') return `${coupon.discountValue}% 할인`;
    if (coupon.discountType === 'free_shipping') return '무료배송';
    return `${Number(coupon.discountValue || 0).toLocaleString('ko-KR')}원 할인`;
  };

  const TABS: { key: 'available' | 'used' | 'expired'; label: string }[] = [
    { key: 'available', label: `사용 가능${summary ? ` (${summary.available})` : ''}` },
    { key: 'used', label: `사용 완료${summary ? ` (${summary.used})` : ''}` },
    { key: 'expired', label: `기간 만료${summary ? ` (${summary.expired})` : ''}` }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="쿠폰함" onBack={() => onGo("/my")} />

      <div className="bg-white border-b flex">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-[#E85A6B] text-[#E85A6B]' : 'border-transparent text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#E85A6B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-16 px-6">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm border rounded-lg">새로고침</button>
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-300 mb-4">
            <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto" fill="currentColor">
              <path d="M20 12V6H4v6c1.1 0 2 .9 2 2s-.9 2-2 2v4h16v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-4v2.54c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V20H6v-2.54c1.19-.69 2-1.99 2-3.46s-.81-2.77-2-3.46V8h12z"/>
            </svg>
          </div>
          <h3 className="text-base font-medium text-gray-600 mb-1">
            {tab === 'available' ? '사용 가능한 쿠폰이 없습니다' : tab === 'used' ? '사용한 쿠폰이 없습니다' : '만료된 쿠폰이 없습니다'}
          </h3>
          <p className="text-sm text-gray-400">이벤트나 프로모션을 통해 쿠폰을 받아보세요</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {coupons.map((uc: any) => (
            <div
              key={uc.userCouponUuid || uc.id}
              className={`bg-white rounded-lg border p-4 ${uc.isUsable ? '' : 'opacity-60'}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold text-[#E85A6B]">{discountText(uc.coupon)}</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{uc.coupon?.name || '쿠폰'}</p>
                  {uc.coupon?.description && (
                    <p className="text-xs text-gray-500 mt-1">{uc.coupon.description}</p>
                  )}
                </div>
                {uc.status === 'used' && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">사용 완료</span>}
                {uc.isExpired && uc.status !== 'used' && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">기간 만료</span>}
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between text-xs text-gray-500">
                <span>
                  {uc.coupon?.minimumOrderAmount
                    ? `${Number(uc.coupon.minimumOrderAmount).toLocaleString('ko-KR')}원 이상 구매 시`
                    : '최소 주문 금액 없음'}
                </span>
                <span>{uc.expiresAt ? `${String(uc.expiresAt).slice(0, 10)}까지` : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 포인트 페이지
export function PointsPage({ onGo }: { onGo: (to: string) => void }) {
  const [balance, setBalance] = useState<{ balance: number; totalEarned: number; totalUsed: number; expiringAmount: number } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [balanceRes, historyRes] = await Promise.all([
          loyaltyService.getPointsBalance(),
          loyaltyService.getPointsHistory({ limit: 50 })
        ]);
        const balanceData = (balanceRes as any)?.data;
        setBalance({
          balance: balanceData?.balance ?? 0,
          totalEarned: balanceData?.totalEarned ?? 0,
          totalUsed: balanceData?.totalUsed ?? 0,
          expiringAmount: balanceData?.expiringPoints?.totalAmount ?? 0
        });
        setTransactions((historyRes as any)?.data?.transactions || []);
      } catch (err) {
        console.error('Failed to load points:', err);
        setError('포인트 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isEarn = (tx: any) => Number(tx.amount) > 0 || String(tx.type || '').startsWith('earn') || String(tx.type || '').includes('refund');

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="포인트" onBack={() => onGo("/my")} />

      {/* 포인트 요약 */}
      <div className="bg-white border-b p-6">
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">보유 포인트</div>
          <div className="text-3xl font-bold text-[#E85A6B]">
            {loading ? '···' : `${(balance?.balance ?? 0).toLocaleString('ko-KR')}P`}
          </div>
          {!loading && balance && (
            <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
              <span>총 적립 {balance.totalEarned.toLocaleString('ko-KR')}P</span>
              <span>총 사용 {balance.totalUsed.toLocaleString('ko-KR')}P</span>
              {balance.expiringAmount > 0 && (
                <span className="text-red-500">30일 내 소멸 예정 {balance.expiringAmount.toLocaleString('ko-KR')}P</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 포인트 내역 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#E85A6B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-16 px-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-300 mb-4">
            <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H11.5v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.65c.09 1.71 1.37 2.66 2.85 2.97V19h1.72v-1.67c1.52-.29 2.72-1.16 2.72-2.74 0-2.22-1.86-2.97-3.63-3.45z"/>
            </svg>
          </div>
          <h3 className="text-base font-medium text-gray-600 mb-1">포인트 내역이 없습니다</h3>
          <p className="text-sm text-gray-400">구매 및 리뷰 작성 시 포인트가 적립됩니다</p>
        </div>
      ) : (
        <div className="bg-white divide-y">
          {transactions.map((tx: any, index: number) => (
            <div key={tx._id || tx.id || index} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-gray-900">{tx.description || (isEarn(tx) ? '포인트 적립' : '포인트 사용')}</p>
                <p className="text-xs text-gray-400 mt-0.5">{tx.createdAt ? String(tx.createdAt).slice(0, 10) : ''}</p>
              </div>
              <span className={`text-sm font-bold ${isEarn(tx) ? 'text-[#E85A6B]' : 'text-gray-500'}`}>
                {isEarn(tx) ? '+' : ''}{Number(tx.amount || 0).toLocaleString('ko-KR')}P
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 손톱 사이즈 페이지
export function NailSizesPage({ onGo }: { onGo: (to: string) => void }) {
  const [nailSizeData, setNailSizeData] = useState<NailSizeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadNailSizeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getNailSize();
      if (response.success) {
        setNailSizeData(response.data || null);
      } else {
        throw new Error(response.error || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('손톱 사이즈 조회 실패:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNailSizeData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleExportChart = async (format: 'png' | 'jpeg') => {
    if (!nailSizeData || exporting) return;
    try {
      setExporting(true);
      const blob = await renderNailSizeChart(nailSizeData, { format });
      await downloadNailSizeChart(blob, format);
    } catch (err) {
      console.error('이미지 내보내기 실패:', err);
      alert('이미지 내보내기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setExporting(false);
    }
  };

  const isWebViewEnvironment = () => !!(window as any).ReactNativeWebView;

  const goToMeasurement = () => {
    if (isWebViewEnvironment()) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({
        type: 'NAVIGATE_TO_MEASUREMENT',
        data: { screen: 'Measurement' }
      }));
    } else {
      alert('손톱 측정은 모바일 앱에서만 가능합니다.\nHANDY 앱을 다운로드해주세요.');
    }
  };

  const renderFingerGrid = (hand: 'left' | 'right', accentColor: string) => {
    if (!nailSizeData) return null;
    const data = hand === 'left' ? nailSizeData.leftHand : nailSizeData.rightHand;

    return (
      <div className="flex gap-2">
        {ALL_FINGERS_ENGLISH.map((finger) => {
          const size = data[finger];
          const isMeasured = size > 0;
          return (
            <div
              key={`${hand}-${finger}`}
              className="flex-1 rounded-xl border border-[#E5E0DC] py-3 px-2 text-center"
            >
              <div className="text-xs text-[#71717A] mb-1.5">{englishToKoreanFinger(finger)}</div>
              {isMeasured ? (
                <div className="text-lg font-bold" style={{ color: accentColor }}>
                  {size.toFixed(1)}
                </div>
              ) : (
                <div className="text-lg font-medium text-[#D0C9C3]">-</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const pageHeader = (
    <PageHeader
      title="손톱 사이즈"
      onBack={() => onGo('/my')}
      rightActions={[
        {
          icon: <RefreshCw className="w-5 h-5" />,
          onClick: loadNailSizeData,
          ariaLabel: '새로고침'
        }
      ]}
    />
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {pageHeader}
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF4D6D] mx-auto mb-2"></div>
            <p className="text-[#71717A]">불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        {pageHeader}
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center space-y-4">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadNailSizeData}
              className="bg-[#FF4D6D] text-white px-6 py-2.5 rounded-full hover:bg-[#E8435F] transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {pageHeader}

      <div className="max-w-lg mx-auto px-6 py-6 space-y-5">
        {/* 측정 일시 */}
        {nailSizeData && (
          <div className="flex items-center justify-center gap-2 text-[13px] text-[#71717A]">
            <Ruler className="w-4 h-4" />
            <span>{formatDate(nailSizeData.measuredAt)} 측정</span>
          </div>
        )}

        {/* 이미지 내보내기 버튼 */}
        {nailSizeData && (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleExportChart('png')}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E5E0DC] text-sm font-medium text-[#131211] hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              PNG 저장
            </button>
            <button
              onClick={() => handleExportChart('jpeg')}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E5E0DC] text-sm font-medium text-[#131211] hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              JPG 저장
            </button>
          </div>
        )}

        {/* 데이터 없음 */}
        {!nailSizeData && (
          <div className="text-center py-16">
            <div className="text-5xl font-light text-[#D0C9C3] mb-5">--</div>
            <p className="text-[#71717A] mb-6">아직 측정된 손톱 사이즈가 없습니다</p>
            <button
              onClick={goToMeasurement}
              className="bg-[#FF4D6D] text-white px-8 py-3.5 rounded-full text-base font-semibold hover:bg-[#E8435F] transition-colors"
            >
              측정 시작하기
            </button>
          </div>
        )}

        {/* 왼손 */}
        {nailSizeData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#FF4D6D] flex items-center justify-center text-sm font-bold text-white">
                L
              </div>
              <span className="text-base font-bold text-[#131211]">왼손</span>
            </div>
            {renderFingerGrid('left', '#FF4D6D')}
          </div>
        )}

        {/* 오른손 */}
        {nailSizeData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#991B1B] flex items-center justify-center text-sm font-bold text-white">
                R
              </div>
              <span className="text-base font-bold text-[#131211]">오른손</span>
            </div>
            {renderFingerGrid('right', '#991B1B')}
          </div>
        )}

        {/* 다시 측정하기 카드 */}
        <button
          onClick={goToMeasurement}
          className="flex items-center gap-3.5 w-full rounded-2xl bg-[#FFE5EA] border-[1.5px] border-[#FF4D6D] px-5 py-4 text-left hover:bg-[#FFD6DD] transition-colors"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FF4D6D]">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-base font-bold text-[#131211]">사이즈 측정하기</div>
            <div className="text-sm text-[#991B1B]">신용카드를 준비해주세요</div>
          </div>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#FF4D6D]">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// 결제수단 관리 페이지
export function PaymentsPage({ onGo }: { onGo: (to: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="결제수단 관리" onBack={() => onGo("/my")} />
      <div className="text-center py-20">
        <div className="text-gray-300 mb-4">
          <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto" fill="currentColor">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
          </svg>
        </div>
        <h3 className="text-base font-medium text-gray-600 mb-1">등록된 결제수단이 없습니다</h3>
        <p className="text-sm text-gray-400">주문 시 결제수단을 등록할 수 있습니다</p>
      </div>
    </div>
  );
}
