import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SellerLayout } from '../../layout/SellerLayout';
import { webApiService } from '../../../services/apiService';
import { useAlert } from '../../common';
import { SellerOrder, OrderStatus } from '@handy-platform/shared';
import { SellerOrderCard } from './SellerOrderCard';

interface OrderManagementProps {
  onGo: (path: string) => void;
}

interface OrderFilter {
  status?: OrderStatus[];         // 배열로 변경 (서버 API 스펙 준수)
  search?: string;               // 상품명 검색
  orderNumber?: string;          // 주문번호 검색
  searchType: 'orderNumber' | 'productName';  // 검색 방법
  searchQuery: string;           // 검색어
  page: number;
  limit: number;
  sortBy?: 'create-desc' | 'create-asc' | 'price-desc' | 'price-asc';
}

const ORDER_STATUS_COLORS = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  confirmed: { color: 'bg-blue-100 text-blue-800', icon: '✓' },
  processing: { color: 'bg-purple-100 text-purple-800', icon: '🔄' },
  shipped: { color: 'bg-green-100 text-green-800', icon: '🚛' },
  delivered: { color: 'bg-gray-100 text-gray-800', icon: '📦' },
  cancelled: { color: 'bg-red-100 text-red-800', icon: '❌' },
} as const;


export function OrderManagement({ onGo }: OrderManagementProps) {
  const { t } = useTranslation('seller');
  const { alert, confirm, error: showError, resetRetryCounter } = useAlert();

  const ORDER_STATUS_MAP = {
    pending: { label: t('orders.statusPending'), ...ORDER_STATUS_COLORS.pending },
    confirmed: { label: t('orders.statusConfirmed'), ...ORDER_STATUS_COLORS.confirmed },
    processing: { label: t('orders.statusProcessing'), ...ORDER_STATUS_COLORS.processing },
    shipped: { label: t('orders.statusShipped'), ...ORDER_STATUS_COLORS.shipped },
    delivered: { label: t('orders.statusDelivered'), ...ORDER_STATUS_COLORS.delivered },
    cancelled: { label: t('orders.statusCancelled'), ...ORDER_STATUS_COLORS.cancelled },
  } as const;
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);  // 초기 페이지 로딩
  const [searchLoading, setSearchLoading] = useState(false);  // 검색/필터 로딩
  const [error, setError] = useState<string | null>(null);
  
  // 실제 적용된 필터 (API 호출에 사용)
  const [appliedFilter, setAppliedFilter] = useState<OrderFilter>({
    page: 1,
    limit: 10,
    searchType: 'orderNumber',
    searchQuery: ''
  });
  
  // 사용자가 입력 중인 임시 필터 (UI 표시용)
  const [tempFilter, setTempFilter] = useState<OrderFilter>({
    page: 1,
    limit: 10,
    searchType: 'orderNumber',
    searchQuery: ''
  });
  
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // 주문 목록 로드 (새로운 API 스펙 준수)
  const loadOrders = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }
      setError(null);

      // 검색 파라미터 준비 (appliedFilter 사용)
      const searchParams: any = {
        page: appliedFilter.page,
        limit: appliedFilter.limit,
        status: appliedFilter.status,            // 배열 형태로 전송
        sortBy: appliedFilter.sortBy || 'create-desc'
      };

      // 검색 타입에 따라 적절한 파라미터 설정
      if (appliedFilter.searchQuery.trim()) {
        if (appliedFilter.searchType === 'orderNumber') {
          searchParams.orderNumber = appliedFilter.searchQuery;
        } else if (appliedFilter.searchType === 'productName') {
          searchParams.search = appliedFilter.searchQuery;
        }
      }

      const response = await webApiService.seller.getSellerOrders(searchParams);

      if (response.items) {
        // 서버 응답을 그대로 사용 (매핑 로직 제거)
        console.log('Server response items:', response.items);
        setOrders(response.items as SellerOrder[]);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        setOrders([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('주문 목록 로드 실패:', err);
      setError(t('orders.loadFailed'));
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setSearchLoading(false);
      }
    }
  };

  // 초기 로딩
  useEffect(() => {
    loadOrders(true);
  }, []);

  // appliedFilter 변경 시에만 API 호출 (페이지 변경 제외)
  useEffect(() => {
    if (appliedFilter.page === 1) {
      loadOrders(false);
    }
  }, [appliedFilter.status, appliedFilter.sortBy, appliedFilter.searchQuery, appliedFilter.searchType]);

  // 페이지 변경 시에만 별도 처리
  useEffect(() => {
    if (appliedFilter.page > 1) {
      loadOrders(false);
    }
  }, [appliedFilter.page]);

  // 임시 필터 변경 핸들러 (UI만 업데이트, API 호출 안함)
  const handleTempFilterChange = (newFilter: Partial<OrderFilter>) => {
    setTempFilter(prev => ({ ...prev, ...newFilter }));
  };

  // 필터 적용 핸들러 ("적용" 버튼 클릭 시)
  const applyFilters = () => {
    setAppliedFilter({ ...tempFilter, page: 1 });
    setSelectedOrders(new Set());
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setAppliedFilter(prev => ({ ...prev, page }));
    setTempFilter(prev => ({ ...prev, page }));
  };

  // 상태 토글 핸들러
  const toggleStatus = (status: OrderStatus) => {
    const currentStatus = tempFilter.status || [];
    if (currentStatus.includes(status)) {
      // 이미 선택된 상태면 제거
      handleTempFilterChange({ status: currentStatus.filter(s => s !== status) });
    } else {
      // 선택되지 않은 상태면 추가
      handleTempFilterChange({ status: [...currentStatus, status] });
    }
  };

  // 전체 상태 핸들러
  const handleAllStatus = () => {
    handleTempFilterChange({ status: [] });
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
      const validOrderIds = orders.filter((order): order is SellerOrder & { id: string } => Boolean(order.id)).map(order => order.id);
      setSelectedOrders(new Set(validOrderIds));
    }
  };

  // 주문 상태 업데이트 핸들러 (orderId 사용)
  const updateOrderStatus = async (orderId: string, status: OrderStatus, trackingNumber?: string, carrierInfo?: { code: string; name: string }) => {
    try {
      if (status === 'shipped' && trackingNumber && carrierInfo) {
        // 배송 정보 업데이트
        await webApiService.seller.updateShippingInfo(orderId, {
          carrierCode: carrierInfo.code,
          carrierName: carrierInfo.name,
          trackingNumber,
          shippingDate: new Date().toISOString(),
          note: t('orders.shippingStartedNote', { carrier: carrierInfo.name, tracking: trackingNumber })
        });
      } else {
        // 일반 상태 업데이트
        await webApiService.seller.updateOrderStatus(orderId, {
          status,
          note: status === 'confirmed' ? t('orders.orderConfirmedNote') :
                status === 'cancelled' ? t('orders.orderCancelledNote') : undefined
        });
      }

      // 성공 시 재시도 카운터 리셋
      resetRetryCounter('주문 상태 변경');

      // 주문 목록 새로고침
      await loadOrders();
      
      // 성공 알림
      await alert(t('orders.statusChangeSuccess', { status: ORDER_STATUS_MAP[status as keyof typeof ORDER_STATUS_MAP]?.label || status }), {
        variant: 'success',
        title: t('orders.statusChangeComplete')
      });
    } catch (err: any) {
      console.error('주문 상태 업데이트 실패:', err);
      const result = await showError(err, {
        title: t('orders.statusChangeFailed'),
        showRetry: true
      });
      
      // 재시도 선택 시 다시 실행
      if (result.action === 'retry') {
        await updateOrderStatus(orderId, status, trackingNumber, carrierInfo);
      }
    }
  };

  return (
    <SellerLayout title={t('orders.title')} onGo={onGo}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('orders.loadingOrders')}</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('orders.dataLoadFailed')}</h3>
            <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
            <button
              onClick={() => loadOrders()}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium shadow-sm"
            >
              {t('common:retry')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 상단 필터 및 검색 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* 주문 상태 필터 (최상단) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('orders.orderStatus')}</label>
              <div className="flex flex-wrap gap-2">
                {/* 전체 버튼 */}
                <button
                  onClick={handleAllStatus}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                    (!tempFilter.status || tempFilter.status.length === 0)
                      ? 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t('orders.all')}
                </button>

                {/* 상태별 토글 버튼 */}
                {Object.entries(ORDER_STATUS_MAP).map(([status, config]) => {
                  if (!config) return null;
                  const isSelected = tempFilter.status?.includes(status as OrderStatus) || false;
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status as OrderStatus)}
                      className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center gap-1 sm:gap-1.5 ${
                        isSelected
                          ? `${config.color} border-2 border-current`
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xs">{config.icon}</span>
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 검색 및 정렬 영역 */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex flex-col xl:flex-row gap-3">
                {/* 검색 타입과 입력 */}
                <div className="flex gap-2 flex-1 max-w-md">
                  <select
                    value={tempFilter.searchType}
                    onChange={(e) => handleTempFilterChange({ 
                      searchType: e.target.value as 'orderNumber' | 'productName',
                      searchQuery: '' // 검색 방법이 바뀌면 검색어 초기화
                    })}
                    className="px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200 min-w-[90px] sm:min-w-[110px] text-xs sm:text-sm"
                  >
                    <option value="orderNumber">{t('orders.orderNumber')}</option>
                    <option value="productName">{t('orders.productName')}</option>
                  </select>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={tempFilter.searchType === 'orderNumber' ? t('orders.orderNumberPlaceholder') : t('orders.productNamePlaceholder')}
                      value={tempFilter.searchQuery}
                      onChange={(e) => handleTempFilterChange({ searchQuery: e.target.value })}
                      className="w-full pl-8 pr-3 py-1.5 sm:pl-9 sm:pr-4 sm:py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200 text-xs sm:text-sm"
                    />
                    <svg className="absolute left-2 top-2 sm:left-2.5 sm:top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* 정렬 및 적용 버튼 */}
                <div className="flex gap-2 xl:flex-nowrap flex-wrap">
                  <select
                    value={tempFilter.sortBy || 'create-desc'}
                    onChange={(e) => handleTempFilterChange({ sortBy: e.target.value as any })}
                    className="px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200 text-xs sm:text-sm"
                  >
                    <option value="create-desc">{t('orders.sortNewest')}</option>
                    <option value="create-asc">{t('orders.sortOldest')}</option>
                    <option value="price-desc">{t('orders.sortPriceHigh')}</option>
                    <option value="price-asc">{t('orders.sortPriceLow')}</option>
                  </select>

                  {/* 적용 버튼 - 필터 아이콘으로 변경 */}
                  <button
                    onClick={applyFilters}
                    disabled={searchLoading}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 xl:w-auto w-full justify-center"
                  >
                    {searchLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 border-b-2 border-white"></div>
                        {t('orders.applying')}
                      </>
                    ) : (
                      <>
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        {t('common:apply')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* 주문 목록 */}
          <div className="space-y-4">
            {searchLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{t('orders.searching')}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('orders.noOrders')}</h3>
                <p className="text-gray-500">
                  {appliedFilter.status?.length || appliedFilter.searchQuery.trim()
                    ? t('orders.noFilteredOrders')
                    : t('orders.noOrdersYet')}
                </p>
              </div>
            ) : (
              <>
                {/* 전체 선택 체크박스 및 일괄 처리 버튼 */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOrders.size === orders.length && orders.length > 0}
                        onChange={toggleAllSelection}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {t('orders.selectAll', { count: orders.length })}
                      </span>
                      {selectedOrders.size > 0 && (
                        <span className="text-sm text-blue-600 font-medium">
                          • {t('orders.selectedCount', { count: selectedOrders.size })}
                        </span>
                      )}
                    </label>

                    {/* 일괄 처리 버튼들 */}
                    {selectedOrders.size > 0 && (
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium">
                          {t('orders.batchConfirm')}
                        </button>
                        <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
                          {t('orders.batchShip')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 판매자 주문 카드들 */}
                {(() => {
                  const validOrders = orders.filter((order): order is SellerOrder & { id: string } => Boolean(order.id));
                  return validOrders.map((order) => (
                    <SellerOrderCard
                      key={order.id}
                      order={order}
                      isSelected={selectedOrders.has(order.id)}
                      onToggleSelection={() => toggleOrderSelection(order.id)}
                      onUpdateStatus={updateOrderStatus}
                      onConfirm={confirm}
                    />
                  ));
                })()}
              </>
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, appliedFilter.page - 1))}
                  disabled={appliedFilter.page === 1 || searchLoading}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {t('common:prev')}
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, appliedFilter.page - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={searchLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        pageNum === appliedFilter.page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, appliedFilter.page + 1))}
                  disabled={appliedFilter.page === totalPages || searchLoading}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {t('common:next')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </SellerLayout>
  );
}