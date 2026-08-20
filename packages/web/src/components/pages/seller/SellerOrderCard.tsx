import { useState } from 'react';
import { SellerOrder, OrderStatus, CustomOrderDetail, SellerOrderDetail } from '@handy-platform/shared';
import { webApiService } from '../../../services/apiService';
import { CustomOrderModal } from './CustomOrderModal';
import { OrderDetailModal } from './OrderDetailModal';

interface SellerOrderCardProps {
  order: SellerOrder;
  isSelected: boolean;
  onToggleSelection: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, trackingNumber?: string, carrierInfo?: { code: string; name: string }) => Promise<void>;
  onConfirm: (message: string, options?: any) => Promise<boolean>;
}

// 주문 상태 매핑 (판매자 관점)
const ORDER_STATUS_MAP = {
  pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  confirmed: { label: '확인됨', color: 'bg-blue-100 text-blue-800', icon: '✓' },
  processing: { label: '처리중', color: 'bg-brand-100 text-brand-700', icon: '🔄' },
  shipped: { label: '배송중', color: 'bg-green-100 text-green-800', icon: '🚛' },
  delivered: { label: '완료', color: 'bg-surface-strong text-gray-800', icon: '📦' },
  cancelled: { label: '취소됨', color: 'bg-red-100 text-red-800', icon: '❌' },
} as const;

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

export function SellerOrderCard({ order, isSelected, onToggleSelection, onUpdateStatus, onConfirm }: SellerOrderCardProps) {
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState(SHIPPING_CARRIERS[0].code);
  const [updating, setUpdating] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // 커스텀 주문서 모달 상태
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);
  const [customOrderDetail, setCustomOrderDetail] = useState<CustomOrderDetail | null>(null);
  const [customOrderLoading, setCustomOrderLoading] = useState(false);
  const [customOrderError, setCustomOrderError] = useState<string | null>(null);

  // 주문 상세 모달 상태
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [orderDetail, setOrderDetail] = useState<SellerOrderDetail | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderDetailError, setOrderDetailError] = useState<string | null>(null);

  const orderStatusConfig = ORDER_STATUS_MAP[order.status as keyof typeof ORDER_STATUS_MAP];

  // 커스텀 주문서 조회
  const handleViewCustomOrder = async () => {
    if (!order.customRequestUuid) return;

    setShowCustomOrderModal(true);
    setCustomOrderLoading(true);
    setCustomOrderError(null);

    try {
      const response = await webApiService.seller.getCustomOrderDetail(order.customRequestUuid);
      if (response.data) {
        setCustomOrderDetail(response.data);
      } else {
        setCustomOrderError('주문서 정보를 찾을 수 없습니다.');
      }
    } catch (err: any) {
      console.error('커스텀 주문서 조회 실패:', err);
      setCustomOrderError('주문서를 불러오는데 실패했습니다.');
    } finally {
      setCustomOrderLoading(false);
    }
  };

  const handleCloseCustomOrderModal = () => {
    setShowCustomOrderModal(false);
    setCustomOrderDetail(null);
    setCustomOrderError(null);
  };

  // 주문 상세 조회
  const handleViewOrderDetail = async () => {
    // 더블클릭/중복 요청 방지
    if (orderDetailLoading) return;

    setShowOrderDetailModal(true);
    setOrderDetailLoading(true);
    setOrderDetailError(null);

    try {
      // 보안을 위해 orderUuid 사용 (order.id가 UUID)
      const response = await webApiService.seller.getSellerOrderDetail(order.id);
      if (response.data) {
        setOrderDetail(response.data);
      } else {
        setOrderDetailError('주문 정보를 찾을 수 없습니다.');
      }
    } catch (err: any) {
      console.error('주문 상세 조회 실패:', err);
      setOrderDetailError('주문 정보를 불러오는데 실패했습니다.');
    } finally {
      setOrderDetailLoading(false);
    }
  };

  // 주문 상세 모달 닫기 (상태 정리 포함)
  const handleCloseOrderDetailModal = () => {
    setShowOrderDetailModal(false);
    setOrderDetail(null);
    setOrderDetailError(null);
  };

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

  const canConfirm = order.status === 'pending';
  const canShip = order.status === 'processing';
  const canStartProcessing = order.status === 'confirmed';
  const canDeliver = order.status === 'shipped';
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-line overflow-hidden">
      <div className="p-4 sm:p-6">
        {/* 컴팩트한 헤더: 체크박스 + 주문번호 + 상태 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelection}
                className="w-4 h-4 text-brand border-line-strong rounded focus:ring-brand"
              />
            </label>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">주문번호:</span>
              <span className="text-sm font-medium text-gray-900">{order.orderNumber}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${orderStatusConfig.color}`}>
                {orderStatusConfig.icon} {orderStatusConfig.label}
              </span>
              {/* 상세보기 버튼 */}
              <button
                onClick={handleViewOrderDetail}
                disabled={orderDetailLoading}
                className="px-2 py-1 bg-surface text-gray-700 rounded text-xs font-medium hover:bg-surface-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {orderDetailLoading ? '로딩...' : '상세보기'}
              </button>
              {/* 커스텀 주문인 경우 주문서 보기 버튼 */}
              {order.customRequestUuid && (
                <button
                  onClick={handleViewCustomOrder}
                  className="px-2 py-1 bg-brand-50 text-brand rounded-full text-xs font-medium hover:bg-brand-100 transition-colors flex items-center gap-1"
                >
                  <span>📋</span>
                  <span>주문서</span>
                </button>
              )}
            </div>
          </div>

          {/* 주문 메타 정보 - 모바일에서는 숨김 */}
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <span className="text-xs text-muted">{new Date(order.createdAt).toLocaleString('ko-KR', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted">상품 총액:</span>
              <span className="text-base font-semibold text-gray-900">{(order.totalAmount || 0).toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 모바일용 주문 메타 정보 */}
        <div className="sm:hidden flex flex-col gap-2 text-xs mb-4 pl-7">
          <span className="text-muted">{new Date(order.createdAt).toLocaleString('ko-KR', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-muted">상품 총액:</span>
              <span className="text-sm font-semibold text-gray-900">{(order.totalAmount || 0).toLocaleString()}원</span>
            </div>
            <span className="text-muted">상품 {(order.items || []).length}개</span>
          </div>
        </div>

        {/* 처리할 상품 목록 - 메인 콘텐츠 */}
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            처리할 상품 {(order.items || []).length}개
          </h4>

          <div className="space-y-3">
            {(order.items || []).map((item, index) => {
              console.log(`Seller Order Item ${index}:`, item);

              // 안전한 값 추출
              const price = typeof item.price === 'number' ? item.price : 0;
              const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
              const productName = item.productName || '상품명 없음';

              return (
                <div key={index} className="flex items-start gap-3 p-4 bg-brand-50 border border-brand-100 rounded-lg hover:bg-brand-100 transition-colors duration-200">
                  {/* 상품 이미지 - 더 크게 */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    {(item as any).productImage ? (
                      <img
                        src={(item as any).productImage}
                        alt={productName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <svg className="w-10 h-10 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    )}
                  </div>

                  {/* 상품 정보 - 더 prominently */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 truncate">{productName}</h5>

                    {/* 상품 옵션 */}
                    {[item.shape, item.size, (item as any).sku].filter(Boolean).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.shape && (
                          <span className="px-2 py-1 bg-white text-xs font-medium text-gray-600 rounded border">
                            모양: {item.shape}
                          </span>
                        )}
                        {item.size && (
                          <span className="px-2 py-1 bg-white text-xs font-medium text-gray-600 rounded border">
                            크기: {item.size}
                          </span>
                        )}
                        {(item as any).sku && (
                          <span className="px-2 py-1 bg-white text-xs font-medium text-gray-600 rounded border">
                            SKU: {(item as any).sku}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 간소화된 수량 및 가격 정보 */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">수량:</span>
                        <span className="text-sm font-medium text-brand">{quantity}개</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">가격:</span>
                        <span className="text-sm font-medium">{price.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 액션 버튼들 - 하단에 배치 */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-col sm:flex-row gap-2">
            {canConfirm && (
              <button
                onClick={async () => {
                  const confirmed = await onConfirm('이 주문을 확인하시겠습니까?', {
                    variant: 'info',
                    confirmLabel: '주문 확인',
                    cancelLabel: '취소'
                  });
                  if (confirmed && order.id) {
                    await onUpdateStatus(order.id, 'confirmed');
                  }
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-sm font-medium"
              >
                <span className="sm:hidden">확인</span>
                <span className="hidden sm:inline">주문 확인</span>
              </button>
            )}

            {canStartProcessing && (
              <button
                onClick={async () => {
                  const confirmed = await onConfirm('이 주문의 제작을 시작하시겠습니까?', {
                    variant: 'info',
                    confirmLabel: '제작 시작',
                    cancelLabel: '취소'
                  });
                  if (confirmed) {
                    if (order.id) {
                      await onUpdateStatus(order.id, 'processing');
                    }
                  }
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-brand text-white rounded-full hover:bg-brand-600 transition-colors duration-200 text-sm font-medium"
              >
                <span className="sm:hidden">제작</span>
                <span className="hidden sm:inline">제작 시작</span>
              </button>
            )}

            {canShip && (
              <button
                onClick={async () => {
                  const confirmed = await onConfirm('이 주문의 배송 처리를 시작하시겠습니까?', {
                    variant: 'info',
                    confirmLabel: '배송 처리',
                    cancelLabel: '취소'
                  });
                  if (confirmed) {
                    setShowShippingForm(true);
                  }
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
              >
                <span className="sm:hidden">배송</span>
                <span className="hidden sm:inline">배송 처리</span>
              </button>
            )}

            {canDeliver && (
              <button
                onClick={async () => {
                  const confirmed = await onConfirm('배송이 완료되었습니까?', {
                    variant: 'success',
                    confirmLabel: '배송 완료',
                    cancelLabel: '취소'
                  });
                  if (confirmed && order.id) {
                    await onUpdateStatus(order.id, 'delivered');
                  }
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
              >
                <span className="sm:hidden">완료</span>
                <span className="hidden sm:inline">배송 완료</span>
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
                    if (order.id) {
                      await onUpdateStatus(order.id, 'cancelled');
                    }
                  }
                }}
                className="flex-1 sm:flex-none px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 text-sm font-medium"
              >
                주문 취소
              </button>
            )}
          </div>
        </div>

        {/* 배송 정보 입력 폼 */}
        {showShippingForm && (
          <div className="mt-4 p-6 bg-brand-50 rounded-xl border border-brand-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="text-muted hover:text-gray-600 transition-colors duration-200"
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
                  className="w-full px-3 py-2 border border-line rounded-lg focus:border-brand focus:ring-0 transition-colors duration-200"
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
                        : 'border-line focus:border-brand'
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
                className="px-4 py-2 border border-line text-ink rounded-lg hover:bg-surface transition-all duration-200"
              >
                취소
              </button>
              <button
                onClick={handleShippingSubmit}
                disabled={updating || !trackingNumber.trim() || !!trackingError}
                className="px-6 py-2 bg-brand text-white rounded-full hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
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

        {/* 배송 정보 표시 (배송 시작 후) - SellerOrder에는 shipping 정보가 없을 수 있으므로 조건부 렌더링 */}
        {order.status === 'shipped' && order.estimatedDelivery && (
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
                    예상 배송일: {new Date(order.estimatedDelivery).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 커스텀 주문서 모달 */}
      <CustomOrderModal
        isOpen={showCustomOrderModal}
        onClose={handleCloseCustomOrderModal}
        orderDetail={customOrderDetail}
        loading={customOrderLoading}
        error={customOrderError}
      />

      {/* 주문 상세 모달 */}
      <OrderDetailModal
        isOpen={showOrderDetailModal}
        onClose={handleCloseOrderDetailModal}
        orderDetail={orderDetail}
        loading={orderDetailLoading}
        error={orderDetailError}
      />
    </div>
  );
}
