import { useState, useEffect } from 'react';
import { SellerLayout } from '../../layout/SellerLayout';
import { webApiService } from '../../../services/apiService';
import { useAlert } from '../../common';
import { Order, OrderStatus, PaymentStatus } from '@handy-platform/shared';

interface OrderManagementProps {
  onGo: (path: string) => void;
}

interface OrderFilter {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  page: number;
  limit: number;
}

const ORDER_STATUS_MAP = {
  pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  confirmed: { label: '확인됨', color: 'bg-blue-100 text-blue-800', icon: '✓' },
  processing: { label: '처리중', color: 'bg-purple-100 text-purple-800', icon: '🔄' },
  shipped: { label: '배송중', color: 'bg-green-100 text-green-800', icon: '🚛' },
  delivered: { label: '완료', color: 'bg-gray-100 text-gray-800', icon: '📦' },
  cancelled: { label: '취소됨', color: 'bg-red-100 text-red-800', icon: '❌' },
} as const;

const PAYMENT_STATUS_MAP = {
  pending: { label: '결제 대기', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: '결제 완료', color: 'bg-green-100 text-green-800' },
  failed: { label: '결제 실패', color: 'bg-red-100 text-red-800' },
  cancelled: { label: '결제 취소', color: 'bg-gray-100 text-gray-800' },
  refunded: { label: '환불 완료', color: 'bg-blue-100 text-blue-800' },
} as const;

export function OrderManagement({ onGo }: OrderManagementProps) {
  const { alert, confirm, error: showError, resetRetryCounter } = useAlert();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>({
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // 주문 목록 로드
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await webApiService.seller.getOrders({
        page: filter.page,
        limit: filter.limit,
        status: filter.status,
        paymentStatus: filter.paymentStatus,
        search: filter.search,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      setOrders(response.orders);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      console.error('주문 목록 로드 실패:', err);
      setError('주문 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filter.page, filter.status, filter.paymentStatus]);

  // 검색 처리 (디바운싱)
  useEffect(() => {
    if (!filter.search) {
      loadOrders();
      return;
    }

    const timer = setTimeout(() => {
      loadOrders();
    }, 500);

    return () => clearTimeout(timer);
  }, [filter.search]);

  // 필터 변경 핸들러
  const handleFilterChange = (newFilter: Partial<OrderFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter, page: 1 }));
    setSelectedOrders(new Set());
  };

  // 주문 선택 핸들러
  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  // 전체 선택/해제
  const toggleAllSelection = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(order => order.id)));
    }
  };

  // 주문 상태 업데이트 핸들러
  const updateOrderStatus = async (orderId: string, status: OrderStatus, trackingNumber?: string, carrierInfo?: { code: string; name: string }) => {
    try {
      if (status === 'shipped' && trackingNumber && carrierInfo) {
        // 배송 정보 업데이트
        await webApiService.seller.updateShippingInfo(orderId, {
          carrierCode: carrierInfo.code,
          carrierName: carrierInfo.name,
          trackingNumber,
          shippingDate: new Date().toISOString(),
          note: `배송 시작됨 (${carrierInfo.name}: ${trackingNumber})`
        });
      } else {
        // 일반 상태 업데이트
        await webApiService.seller.updateOrderStatus(orderId, {
          status,
          note: status === 'confirmed' ? '주문이 확인되었습니다.' : 
                status === 'cancelled' ? '주문이 취소되었습니다.' : undefined
        });
      }

      // 성공 시 재시도 카운터 리셋
      resetRetryCounter('주문 상태 변경');

      // 주문 목록 새로고침
      await loadOrders();
      
      // 성공 알림
      await alert(`주문 상태가 ${ORDER_STATUS_MAP[status].label}(으)로 변경되었습니다.`, {
        variant: 'success',
        title: '상태 변경 완료'
      });
    } catch (err: any) {
      console.error('주문 상태 업데이트 실패:', err);
      const result = await showError(err, {
        title: '주문 상태 변경 실패',
        showRetry: true
      });
      
      // 재시도 선택 시 다시 실행
      if (result.action === 'retry') {
        await updateOrderStatus(orderId, status, trackingNumber, carrierInfo);
      }
    }
  };

  return (
    <SellerLayout title="주문 관리" onGo={onGo}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">주문 목록을 불러오는 중...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터 로드 실패</h3>
            <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
            <button
              onClick={loadOrders}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium shadow-sm"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 상단 필터 및 검색 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 검색 */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="주문번호, 고객명으로 검색..."
                    value={filter.search || ''}
                    onChange={(e) => handleFilterChange({ search: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                  />
                  <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* 주문 상태 필터 */}
              <div className="flex gap-2">
                <select
                  value={filter.status || ''}
                  onChange={(e) => handleFilterChange({ status: e.target.value as OrderStatus || undefined })}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                >
                  <option value="">전체 주문</option>
                  {Object.entries(ORDER_STATUS_MAP).map(([status, config]) => (
                    <option key={status} value={status}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filter.paymentStatus || ''}
                  onChange={(e) => handleFilterChange({ paymentStatus: e.target.value as PaymentStatus || undefined })}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                >
                  <option value="">결제 상태</option>
                  {Object.entries(PAYMENT_STATUS_MAP).map(([status, config]) => (
                    <option key={status} value={status}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 선택된 주문 일괄 처리 */}
            {selectedOrders.size > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedOrders.size}개 주문 선택됨
                  </span>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium">
                      일괄 확인
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
                      일괄 배송 처리
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 주문 목록 */}
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">주문이 없습니다</h3>
                <p className="text-gray-500">
                  {filter.status || filter.paymentStatus || filter.search 
                    ? '검색 조건에 맞는 주문이 없습니다.' 
                    : '아직 들어온 주문이 없습니다.'}
                </p>
              </div>
            ) : (
              <>
                {/* 전체 선택 체크박스 */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === orders.length && orders.length > 0}
                      onChange={toggleAllSelection}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      전체 선택 ({orders.length}개)
                    </span>
                  </label>
                </div>

                {/* 주문 카드들 */}
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isSelected={selectedOrders.has(order.id)}
                    onToggleSelection={() => toggleOrderSelection(order.id)}
                    onUpdateStatus={updateOrderStatus}
                    onConfirm={confirm}
                  />
                ))}
              </>
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFilterChange({ page: Math.max(1, filter.page - 1) })}
                  disabled={filter.page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  이전
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, filter.page - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handleFilterChange({ page: pageNum })}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        pageNum === filter.page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handleFilterChange({ page: Math.min(totalPages, filter.page + 1) })}
                  disabled={filter.page === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </SellerLayout>
  );
}

// OrderCard 컴포넌트 (별도 파일로 분리할 예정)
interface OrderCardProps {
  order: Order;
  isSelected: boolean;
  onToggleSelection: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, trackingNumber?: string, carrierInfo?: { code: string; name: string }) => Promise<void>;
  onConfirm: (message: string, options?: any) => Promise<boolean>;
}

// 택배사 정보 정의
const SHIPPING_CARRIERS = [
  { code: 'hanjin', name: '한진택배', trackingUrl: 'https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText=' },
  { code: 'cj', name: 'CJ대한통운', trackingUrl: 'https://www.cjlogistics.com/ko/tool/parcel/tracking?parcelnumber=' },
  { code: 'lotte', name: '롯데택배', trackingUrl: 'https://www.lotteglogis.com/home/reservation/tracking/linkView?invno=' },
  { code: 'logen', name: '로젠택배', trackingUrl: 'https://www.ilogen.com/web/personal/trace/_tab2.jsp?slipno=' },
  { code: 'kdexp', name: '경동택배', trackingUrl: 'https://kdexp.com/service/delivery/delivery_result.asp?barcode=' },
  { code: 'kpost', name: '우체국택배', trackingUrl: 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=' },
  { code: 'daesin', name: '대신택배', trackingUrl: 'http://apps.ds3211.co.kr/freight/internalFreightSearch.cht?billno=' },
  { code: 'epost', name: 'K택배', trackingUrl: 'https://www.kglogis.co.kr/delivery/delivery_result.jsp?item_no=' }
];

// 송장번호 검증 함수
const validateTrackingNumber = (trackingNumber: string, carrierCode: string): { isValid: boolean; message: string } => {
  const cleaned = trackingNumber.replace(/[^0-9]/g, '');
  
  switch (carrierCode) {
    case 'hanjin':
      if (cleaned.length !== 10 && cleaned.length !== 12) {
        return { isValid: false, message: '한진택배 송장번호는 10자리 또는 12자리 숫자입니다.' };
      }
      break;
    case 'cj':
      if (cleaned.length !== 10 && cleaned.length !== 13) {
        return { isValid: false, message: 'CJ대한통운 송장번호는 10자리 또는 13자리 숫자입니다.' };
      }
      break;
    case 'lotte':
      if (cleaned.length !== 11 && cleaned.length !== 13) {
        return { isValid: false, message: '롯데택배 송장번호는 11자리 또는 13자리 숫자입니다.' };
      }
      break;
    case 'logen':
      if (cleaned.length !== 11 && cleaned.length !== 12) {
        return { isValid: false, message: '로젠택배 송장번호는 11자리 또는 12자리 숫자입니다.' };
      }
      break;
    default:
      if (cleaned.length < 8 || cleaned.length > 15) {
        return { isValid: false, message: '송장번호는 8-15자리 숫자여야 합니다.' };
      }
  }
  
  return { isValid: true, message: '' };
};

function OrderCard({ order, isSelected, onToggleSelection, onUpdateStatus, onConfirm }: OrderCardProps) {
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState(SHIPPING_CARRIERS[0].code);
  const [updating, setUpdating] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  const orderStatusConfig = ORDER_STATUS_MAP[order.status as keyof typeof ORDER_STATUS_MAP];
  const paymentStatusConfig = PAYMENT_STATUS_MAP[order.paymentStatus as keyof typeof PAYMENT_STATUS_MAP];

  // 송장번호 입력 시 실시간 검증
  const handleTrackingNumberChange = (value: string) => {
    setTrackingNumber(value);
    if (value.trim()) {
      const validation = validateTrackingNumber(value, selectedCarrier);
      setTrackingError(validation.isValid ? '' : validation.message);
    } else {
      setTrackingError('');
    }
  };

  const handleShippingSubmit = async () => {
    if (!trackingNumber.trim()) {
      setTrackingError('송장번호를 입력해주세요.');
      return;
    }

    const validation = validateTrackingNumber(trackingNumber, selectedCarrier);
    if (!validation.isValid) {
      setTrackingError(validation.message);
      return;
    }

    try {
      setUpdating(true);
      const carrierInfo = SHIPPING_CARRIERS.find(c => c.code === selectedCarrier);
      await onUpdateStatus(order.id, 'shipped', trackingNumber, carrierInfo ? { code: carrierInfo.code, name: carrierInfo.name } : undefined);
      setShowShippingForm(false);
      setTrackingNumber('');
      setTrackingError('');
    } catch (err) {
      // 에러는 상위 컴포넌트에서 처리됨
    } finally {
      setUpdating(false);
    }
  };

  const canShip = order.status === 'confirmed' || order.status === 'processing';
  const canConfirm = order.status === 'pending';
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        {/* 헤더: 주문 정보 및 선택 체크박스 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <label className="flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelection}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  주문번호: {order.orderNumber}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${orderStatusConfig.color}`}>
                  {orderStatusConfig.icon} {orderStatusConfig.label}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentStatusConfig.color}`}>
                  {paymentStatusConfig.label}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>주문일: {new Date(order.createdAt).toLocaleDateString('ko-KR')}</span>
                <span>총 금액: {order.totalAmount.toLocaleString()}원</span>
                <span>상품 {order.items.length}개</span>
              </div>
            </div>
          </div>

          {/* 주문 상태별 액션 버튼 */}
          <div className="flex gap-2">
            {canConfirm && (
              <button
                onClick={() => onUpdateStatus(order.id, 'confirmed')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
              >
                주문 확인
              </button>
            )}
            
            {canShip && (
              <button
                onClick={() => setShowShippingForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
              >
                배송 처리
              </button>
            )}
            
            {canCancel && (
              <button
                onClick={async () => {
                  const confirmed = await onConfirm('정말로 이 주문을 취소하시겠습니까?', {
                    variant: 'danger',
                    confirmLabel: '취소하기',
                    cancelLabel: '돌아가기'
                  });
                  if (confirmed) {
                    await onUpdateStatus(order.id, 'cancelled');
                  }
                }}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 text-sm font-medium"
              >
                주문 취소
              </button>
            )}
          </div>
        </div>

        {/* 주문 상품 목록 */}
        <div className="border-t border-gray-100 pt-4">
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <img
                  src={item.product.mainImage}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                  <p className="text-sm text-gray-600">
                    {item.options && Object.entries(item.options).map(([key, value]) => `${key}: ${value}`).join(', ')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.price.toLocaleString()}원 × {item.quantity}개 = {item.subtotal.toLocaleString()}원
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 배송 정보 입력 폼 */}
        {showShippingForm && (
          <div className="mt-4 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                배송 정보 입력
              </h4>
              <button
                onClick={() => {
                  setShowShippingForm(false);
                  setTrackingError('');
                  setTrackingNumber('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  택배사 선택
                </label>
                <select 
                  value={selectedCarrier}
                  onChange={(e) => {
                    setSelectedCarrier(e.target.value);
                    // 택배사 변경 시 송장번호 재검증
                    if (trackingNumber.trim()) {
                      handleTrackingNumberChange(trackingNumber);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                >
                  {SHIPPING_CARRIERS.map(carrier => (
                    <option key={carrier.code} value={carrier.code}>
                      {carrier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  송장번호
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => handleTrackingNumberChange(e.target.value)}
                  placeholder="송장번호를 입력하세요 (숫자만)"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-0 transition-colors duration-200 ${
                    trackingError 
                      ? 'border-red-300 focus:border-red-500' 
                      : trackingNumber && !trackingError
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {trackingError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {trackingError}
                  </p>
                )}
                {trackingNumber && !trackingError && (
                  <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                    </svg>
                    올바른 송장번호 형식입니다
                  </p>
                )}
              </div>
            </div>

            {/* 택배사별 안내 정보 */}
            <div className="p-3 bg-white/70 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">💡 송장번호 형식 안내:</span>
                {selectedCarrier === 'hanjin' && ' 한진택배는 10자리 또는 12자리 숫자'}
                {selectedCarrier === 'cj' && ' CJ대한통운은 10자리 또는 13자리 숫자'}
                {selectedCarrier === 'lotte' && ' 롯데택배는 11자리 또는 13자리 숫자'}
                {selectedCarrier === 'logen' && ' 로젠택배는 11자리 또는 12자리 숫자'}
                {!['hanjin', 'cj', 'lotte', 'logen'].includes(selectedCarrier) && ' 일반적으로 8-15자리 숫자'}
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowShippingForm(false);
                  setTrackingError('');
                  setTrackingNumber('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                취소
              </button>
              <button
                onClick={handleShippingSubmit}
                disabled={updating || !trackingNumber.trim() || !!trackingError}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    배송 시작
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 배송 정보 표시 (배송 시작 후) */}
        {order.status === 'shipped' && order.shipping.trackingNumber && (
          <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    배송 중
                  </h4>
                  <p className="text-sm text-green-700">
                    <span className="font-medium">{order.shipping.carrier.name}</span>
                    <span className="mx-2">•</span>
                    <span className="font-mono">{order.shipping.trackingNumber}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const carrier = SHIPPING_CARRIERS.find(c => c.name === order.shipping.carrier.name);
                    if (carrier) {
                      window.open(`${carrier.trackingUrl}${order.shipping.trackingNumber}`, '_blank');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  배송 조회
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.shipping.trackingNumber);
                    // TODO: 토스트 알림 추가
                  }}
                  className="px-3 py-2 border border-green-300 text-green-700 rounded-lg text-sm hover:bg-green-100 transition-colors duration-200"
                  title="송장번호 복사"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}