import { SellerOrderDetail } from '@handy-platform/shared';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetail: SellerOrderDetail | null;
  loading: boolean;
  error: string | null;
}

// 주문 상태 매핑
const ORDER_STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  confirmed: { label: '확인됨', color: 'bg-blue-100 text-blue-800', icon: '✓' },
  processing: { label: '처리중', color: 'bg-brand-100 text-brand-700', icon: '🔄' },
  shipped: { label: '배송중', color: 'bg-green-100 text-green-800', icon: '🚛' },
  delivered: { label: '완료', color: 'bg-surface-strong text-gray-800', icon: '📦' },
  cancelled: { label: '취소됨', color: 'bg-red-100 text-red-800', icon: '❌' },
};

export function OrderDetailModal({ isOpen, onClose, orderDetail, loading, error }: OrderDetailModalProps) {
  if (!isOpen) return null;

  const statusConfig = orderDetail ? ORDER_STATUS_MAP[orderDetail.status] || ORDER_STATUS_MAP.pending : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-brand-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📋</span>
            주문 상세 정보
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-100 transition-colors"
          >
            <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand mb-4"></div>
              <p className="text-muted">주문 정보를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : orderDetail ? (
            <div className="space-y-6">
              {/* 주문 기본 정보 */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <p className="text-sm text-muted mb-1">주문번호</p>
                  <p className="text-lg font-semibold text-gray-900">{orderDetail.orderNumber}</p>
                </div>
                {statusConfig && (
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.color}`}>
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                )}
              </div>

              {/* 주문 일시 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-xs text-muted mb-1">주문일시</p>
                  <p className="font-medium text-gray-900">
                    {new Date(orderDetail.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                {orderDetail.estimatedDelivery && (
                  <div className="bg-surface rounded-lg p-3">
                    <p className="text-xs text-muted mb-1">예상 배송일</p>
                    <p className="font-medium text-gray-900">
                      {new Date(orderDetail.estimatedDelivery).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>

              {/* 상품 목록 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand rounded-full"></span>
                  주문 상품 ({orderDetail.items?.length || 0}개)
                </h3>
                <div className="space-y-3">
                  {(orderDetail.items || []).map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-brand-50 border border-brand-100 rounded-lg">
                      {/* 상품 이미지 */}
                      <div className="w-16 h-16 bg-surface rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {(item as any).productImage ? (
                          <img
                            src={(item as any).productImage}
                            alt={item.productName || '상품'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        )}
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{item.productName || '상품명 없음'}</h4>
                        {/* 옵션 정보 */}
                        {(item.shape || item.size || (item as any).sku) && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.shape && (
                              <span className="px-2 py-0.5 bg-white text-xs text-gray-600 rounded border">
                                모양: {item.shape}
                              </span>
                            )}
                            {item.size && (
                              <span className="px-2 py-0.5 bg-white text-xs text-gray-600 rounded border">
                                크기: {item.size}
                              </span>
                            )}
                            {(item as any).sku && (
                              <span className="px-2 py-0.5 bg-white text-xs text-gray-600 rounded border">
                                SKU: {(item as any).sku}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-gray-600">수량: <span className="font-medium text-brand">{item.quantity || 0}개</span></span>
                          <span className="text-gray-600">가격: <span className="font-medium">{(item.price || 0).toLocaleString()}원</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 배송지 정보 */}
              {orderDetail.shippingAddress && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full"></span>
                    배송지 정보
                  </h3>
                  <div className="bg-surface rounded-lg p-4 space-y-2">
                    {orderDetail.shippingAddress.name && (
                      <div className="flex items-start gap-3">
                        <span className="text-sm text-muted min-w-[60px]">수령인</span>
                        <span className="text-sm font-medium text-gray-900">{orderDetail.shippingAddress.name}</span>
                      </div>
                    )}
                    {orderDetail.shippingAddress.phone && (
                      <div className="flex items-start gap-3">
                        <span className="text-sm text-muted min-w-[60px]">연락처</span>
                        <span className="text-sm font-medium text-gray-900">{orderDetail.shippingAddress.phone}</span>
                      </div>
                    )}
                    {(orderDetail.shippingAddress.street || orderDetail.shippingAddress.city) && (
                      <div className="flex items-start gap-3">
                        <span className="text-sm text-muted min-w-[60px]">주소</span>
                        <span className="text-sm font-medium text-gray-900">
                          {[
                            orderDetail.shippingAddress.zipCode && `(${orderDetail.shippingAddress.zipCode})`,
                            orderDetail.shippingAddress.city,
                            orderDetail.shippingAddress.state,
                            orderDetail.shippingAddress.street
                          ].filter(Boolean).join(' ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-2">* 개인정보 보호를 위해 일부 정보가 마스킹 처리되어 있습니다.</p>
                </div>
              )}

              {/* 상태 변경 이력 */}
              {orderDetail.statusHistory && orderDetail.statusHistory.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full"></span>
                    상태 변경 이력
                  </h3>
                  <div className="relative">
                    {/* 타임라인 라인 */}
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-line"></div>

                    <div className="space-y-3">
                      {orderDetail.statusHistory.map((history, index) => {
                        const historyStatus = ORDER_STATUS_MAP[history.status] || { label: history.status, color: 'bg-surface-strong text-gray-800', icon: '•' };
                        return (
                          <div key={index} className="flex items-start gap-3 relative pl-6">
                            {/* 타임라인 점 */}
                            <div className={`absolute left-0 w-4 h-4 rounded-full border-2 border-white ${index === 0 ? 'bg-brand' : 'bg-line-strong'}`}></div>

                            <div className="flex-1 bg-surface rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${historyStatus.color}`}>
                                  {historyStatus.icon} {historyStatus.label}
                                </span>
                                <span className="text-xs text-muted">
                                  {new Date(history.date).toLocaleString('ko-KR')}
                                </span>
                              </div>
                              {history.note && (
                                <p className="text-sm text-gray-600">{history.note}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 메모 */}
              {orderDetail.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full"></span>
                    주문 메모
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{orderDetail.notes}</p>
                  </div>
                </div>
              )}

              {/* 총 결제 금액 */}
              <div className="pt-4 border-t border-line">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700">총 결제 금액</span>
                  <span className="text-2xl font-bold text-brand [font-variant-numeric:tabular-nums]">
                    {(orderDetail.totalAmount || 0).toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted">주문 정보가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-line bg-surface">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-brand text-white rounded-full hover:bg-brand-600 transition-colors font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
