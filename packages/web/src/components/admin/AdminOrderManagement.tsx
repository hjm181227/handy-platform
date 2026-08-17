import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/apiService';
import type { AdminOrderListItem } from '@handy-platform/shared';

interface OrderPagination {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
}

const PAGE_SIZE = 20;

const AdminOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<OrderPagination>({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderListItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 주문 상태 옵션 (서버 OrderStatus enum과 동일)
  const statusOptions = [
    { value: '', label: '전체 상태' },
    { value: 'pending', label: '주문 접수' },
    { value: 'confirmed', label: '주문 확인' },
    { value: 'processing', label: '처리 중' },
    { value: 'shipped', label: '배송 중' },
    { value: 'delivered', label: '배송 완료' },
    { value: 'cancelled', label: '취소됨' },
  ];

  const getStatusLabel = (status: string) =>
    statusOptions.find(option => option.value === status)?.label || status;

  // 검색어 디바운스 (입력 중 과도한 API 호출 방지)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.getAllOrders({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });

      setOrders(response.orders || []);
      setPagination({
        currentPage: response.pagination?.currentPage || 1,
        totalPages: Math.max(response.pagination?.totalPages || 1, 1),
        totalOrders: response.pagination?.totalOrders || 0,
      });
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('주문 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (order: AdminOrderListItem, newStatus: string) => {
    if (newStatus === order.status) return;

    const confirmed = window.confirm(
      `주문 ${order.orderNumber}의 상태를 '${getStatusLabel(newStatus)}'(으)로 변경하시겠습니까?`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await adminService.updateOrderStatus(order._id, { status: newStatus });

      // 모달에 열려있는 주문이면 함께 갱신
      setSelectedOrder(prev =>
        prev && prev._id === order._id ? { ...prev, status: newStatus as AdminOrderListItem['status'] } : prev
      );

      alert('주문 상태가 변경되었습니다.');
      await loadOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('주문 상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = (order: AdminOrderListItem) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800' },
      shipped: { bg: 'bg-orange-100', text: 'text-orange-800' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {getStatusLabel(status)}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const paymentConfig = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: '결제 대기' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: '결제 완료' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: '결제 실패' },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-600', label: '환불됨' },
    };

    const config = paymentConfig[paymentStatus as keyof typeof paymentConfig] || paymentConfig.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatShippingAddress = (order: AdminOrderListItem) => {
    const addr = order.shippingAddress;
    if (!addr) return '-';
    const postcode = addr.postcode ? `(${addr.postcode}) ` : '';
    return `${postcode}${addr.roadAddress || ''} ${addr.detailAddress || ''}`.trim() || '-';
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">주문 관리</h1>
            <p className="text-gray-600 text-sm mt-1">전체 주문을 관리하고 모니터링합니다</p>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span>총 {pagination.totalOrders}건</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>페이지 {pagination.currentPage}/{pagination.totalPages}</span>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="주문번호로 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 주문 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">주문 목록을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => loadOrders()}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">
              {searchQuery || statusFilter ? '검색 조건에 맞는 주문이 없습니다.' : '등록된 주문이 없습니다.'}
            </p>
            {(searchQuery || statusFilter) && (
              <p className="text-gray-500 text-sm">다른 검색 조건을 시도해보세요.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주문 정보
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    고객 정보
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    판매자
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주문 금액
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{order.items?.length || 0}개 상품</div>
                        <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.user?.name || '알 수 없음'}</div>
                        <div className="text-sm text-gray-500">{order.user?.email || '-'}</div>
                        <div className="text-xs text-gray-400">{order.shippingAddress?.recipientPhone || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.items?.[0]?.sellerName || '-'}</div>
                      {order.items && order.items.length > 1 && (
                        <div className="text-xs text-gray-500">외 {order.items.length - 1}개 상품</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div>{getStatusBadge(order.status)}</div>
                        <div>{getPaymentStatusBadge(order.paymentStatus)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetail(order)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          상세보기
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          disabled={actionLoading}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {statusOptions.slice(1).map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                총 {pagination.totalOrders}건 중 {((pagination.currentPage - 1) * PAGE_SIZE) + 1}-
                {Math.min(pagination.currentPage * PAGE_SIZE, pagination.totalOrders)}건 표시
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={pagination.currentPage === 1 || loading}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="text-sm text-gray-600">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={pagination.currentPage === pagination.totalPages || loading}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 주문 상세 정보 모달 */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">주문 상세 정보</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* 주문 기본 정보 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">주문 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">주문번호:</span>
                      <span className="ml-2 text-gray-900 font-medium">{selectedOrder.orderNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">주문일시:</span>
                      <span className="ml-2 text-gray-900">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">최근 업데이트:</span>
                      <span className="ml-2 text-gray-900">{formatDate(selectedOrder.updatedAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">상태:</span>
                      <span className="ml-2">{getStatusBadge(selectedOrder.status)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">결제 상태:</span>
                      <span className="ml-2">{getPaymentStatusBadge(selectedOrder.paymentStatus)}</span>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div>
                        <span className="text-gray-500">운송장 번호:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">고객 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">이름:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.user?.name || '알 수 없음'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">이메일:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.user?.email || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 배송지 정보 */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">배송지 정보</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">받는 분:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.shippingAddress?.recipientName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">연락처:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.shippingAddress?.recipientPhone || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">주소:</span>
                      <span className="ml-2 text-gray-900">{formatShippingAddress(selectedOrder)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 주문 상품 */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">주문 상품</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">판매자</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">옵션</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수량</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">가격</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">소계</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(selectedOrder.items || []).map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.sellerName || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {[
                              item.shape ? `쉐입: ${item.shape}` : null,
                              item.size ? `사이즈: ${item.size}` : null,
                            ].filter(Boolean).join(', ') || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          총 결제 금액:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {formatCurrency(selectedOrder.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">상태 변경:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder, e.target.value)}
                  disabled={actionLoading}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.slice(1).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {actionLoading && <span className="text-sm text-gray-500">처리 중...</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderManagement;
