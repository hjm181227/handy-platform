import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';

// 관리자 주문 관리용 타입 정의
interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  sellerName: string;
  sellerUuid: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    zipCode: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    options?: Record<string, any>;
  }>;
}

interface OrderPagination {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
}

const AdminOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [pagination, setPagination] = useState<OrderPagination>({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 주문 상태 옵션
  const statusOptions = [
    { value: '', label: '전체 상태' },
    { value: 'pending', label: '결제 대기' },
    { value: 'paid', label: '결제 완료' },
    { value: 'processing', label: '처리 중' },
    { value: 'shipped', label: '배송 중' },
    { value: 'delivered', label: '배송 완료' },
    { value: 'cancelled', label: '취소됨' },
    { value: 'refunded', label: '환불됨' },
  ];

  useEffect(() => {
    loadOrders();
  }, [pagination.currentPage, searchQuery, statusFilter, dateFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // 임시 더미 데이터 (실제로는 AdminService에 getAllOrders API가 필요)
      const dummyOrders: AdminOrder[] = [
        {
          id: '1',
          orderNumber: 'ORD-2024-001',
          customerName: '김고객',
          customerEmail: 'customer@example.com',
          sellerName: '네일아트 스튜디오',
          sellerUuid: 'seller1',
          status: 'shipped',
          totalAmount: 85000,
          itemCount: 2,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-16T14:20:00Z',
          shippingAddress: {
            name: '김고객',
            street: '서울시 강남구 테헤란로 123',
            city: '서울',
            zipCode: '06142',
            phone: '010-1234-5678'
          },
          items: [
            {
              productId: 'prod1',
              productName: '프렌치 네일아트 세트',
              quantity: 1,
              price: 50000,
              options: { color: 'pink', size: 'medium' }
            },
            {
              productId: 'prod2',
              productName: '네일 스티커 팩',
              quantity: 1,
              price: 35000
            }
          ]
        },
        {
          id: '2',
          orderNumber: 'ORD-2024-002',
          customerName: '이고객',
          customerEmail: 'customer2@example.com',
          sellerName: '뷰티 네일샵',
          sellerUuid: 'seller2',
          status: 'processing',
          totalAmount: 120000,
          itemCount: 3,
          createdAt: '2024-01-14T15:45:00Z',
          updatedAt: '2024-01-15T09:30:00Z',
          shippingAddress: {
            name: '이고객',
            street: '부산시 해운대구 센텀로 456',
            city: '부산',
            zipCode: '48058',
            phone: '010-2345-6789'
          },
          items: [
            {
              productId: 'prod3',
              productName: '젤네일 키트',
              quantity: 2,
              price: 40000
            },
            {
              productId: 'prod4',
              productName: '네일 데코 세트',
              quantity: 1,
              price: 40000
            }
          ]
        }
      ];

      // 필터링 적용
      let filteredOrders = dummyOrders;
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          order.orderNumber.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.customerEmail.toLowerCase().includes(query) ||
          order.sellerName.toLowerCase().includes(query)
        );
      }

      if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
      }

      setOrders(filteredOrders);
      setPagination({
        currentPage: 1,
        totalPages: Math.ceil(filteredOrders.length / 20),
        totalOrders: filteredOrders.length,
      });

    } catch (error) {
      console.error('Failed to load orders:', error);
      alert('주문 목록 로딩에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      // 실제로는 AdminService에 updateOrderStatus API가 필요
      console.log('주문 상태 변경:', orderId, newStatus);
      
      // 로컬 상태 업데이트
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
      ));
      
      alert('주문 상태가 변경되었습니다.');
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('주문 상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = (order: AdminOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
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
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '결제 대기' },
      paid: { bg: 'bg-blue-100', text: 'text-blue-800', label: '결제 완료' },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800', label: '처리 중' },
      shipped: { bg: 'bg-orange-100', text: 'text-orange-800', label: '배송 중' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', label: '배송 완료' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: '취소됨' },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-800', label: '환불됨' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
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
              placeholder="주문번호, 고객명, 판매자명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 주문 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">주문 목록을 불러오는 중...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">검색 조건에 맞는 주문이 없습니다.</p>
            <p className="text-gray-500 text-sm">다른 검색 조건을 시도해보세요.</p>
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
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{order.itemCount}개 상품</div>
                        <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        <div className="text-xs text-gray-400">{order.shippingAddress.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.sellerName}</div>
                      <div className="text-xs text-gray-500">ID: {order.sellerUuid}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
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
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
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
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                총 {pagination.totalOrders}건 중 {((pagination.currentPage - 1) * 20) + 1}-
                {Math.min(pagination.currentPage * 20, pagination.totalOrders)}건 표시
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                  disabled={pagination.currentPage === 1 || loading}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="text-sm text-gray-600">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
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
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">고객 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">이름:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">이메일:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.customerEmail}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">판매자:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.sellerName}</span>
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
                      <span className="ml-2 text-gray-900">{selectedOrder.shippingAddress.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">연락처:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.shippingAddress.phone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">주소:</span>
                      <span className="ml-2 text-gray-900">
                        ({selectedOrder.shippingAddress.zipCode}) {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}
                      </span>
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">옵션</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수량</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">가격</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">소계</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.options ? Object.entries(item.options).map(([key, value]) => 
                              `${key}: ${value}`
                            ).join(', ') : '-'}
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
                        <td colSpan={4} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
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
              <div className="flex space-x-3">
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  disabled={actionLoading}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.slice(1).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={actionLoading}
                >
                  {actionLoading ? '처리 중...' : '상태 변경'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderManagement;