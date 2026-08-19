import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SellerLayout } from '../layout/SellerLayout';
import { money } from '../../utils';
import { categoryOptions } from '../../utils/categoryUtils';
import { CategorySelector } from '../product/CategorySelector';
import { imageService, productService, sellerService, brandService } from '../../services/apiService';
import { Stars } from '../ui';
import { IoMdStar } from 'react-icons/io';
import { FaDollarSign, FaChartLine, FaClipboardList, FaBox, FaPlus, FaWallet, FaExclamationTriangle } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import type { CreateProductRequest, UpdateProductRequest, NailCategories, NailLength, NailShape, NailOptions, ProductType, CustomOrderRequest, PrefillProductResponse } from '../../types';
import { NAIL_SHAPE_NAME, NAIL_LENGTH_NAME } from '@handy-platform/shared';

// 생산 관리 컴포넌트 임포트
import { ProductionSettings } from './seller/ProductionSettings';
import { ProductionStatus } from './seller/ProductionStatus';

// 주문 관리 컴포넌트 임포트
import { OrderManagement } from './seller/OrderManagement';

// 쿠폰 관리 컴포넌트 임포트
import { CouponManagement } from './seller/CouponManagement';

// 판매자 센터 메인 대시보드
export function SellerDashboard({ onGo }: { onGo: (to: string) => void }) {
  const { t } = useTranslation('seller');
  const [ dashboardData, setDashboardData ] = useState({
    sales: {
      today: 0,
      month: 0,
      lastMonth: 0,
      growth: 0
    },
    orders: {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    },
    products: {
      total: 0,
      active: 0,
      inactive: 0
    },
    reviews: {
      total: 0,
      unread: 0,
      averageRating: 0,
      pending: 0
    }
  });
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);

  // 대시보드 데이터 로드
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 3개 API 병렬 호출
        const [orderResponse, productResponse, settlementResponse] = await Promise.all([
          sellerService.getOrderAnalyticsOverview(),
          sellerService.getProductAnalyticsOverview(),
          sellerService.getSettlementSummary()
        ]);

        // API 응답: { success: boolean, data: T }
        const orderStats = (orderResponse as any)?.data;
        const productStats = (productResponse as any)?.data;
        const settlementStats = (settlementResponse as any)?.data;

        // 전월 대비 성장률 계산
        const lastMonthSales = settlementStats?.lastMonthSales || 0;
        const currentMonthSales = settlementStats?.currentMonthSales || orderStats?.monthlyRevenue || 0;
        const growth = lastMonthSales > 0
          ? ((currentMonthSales - lastMonthSales) / lastMonthSales * 100)
          : 0;

        setDashboardData({
          sales: {
            today: orderStats?.todayRevenue || 0,
            month: orderStats?.monthlyRevenue || 0,
            lastMonth: lastMonthSales,
            growth: Math.round(growth * 10) / 10
          },
          orders: {
            pending: orderStats?.pendingOrders || 0,
            processing: orderStats?.statusDistribution?.processing || 0,
            shipped: orderStats?.shippedOrders || 0,
            delivered: orderStats?.completedOrders || 0,
            cancelled: orderStats?.cancelledOrders || 0
          },
          products: {
            total: productStats?.totalProducts ?? 0,
            active: productStats?.activeProducts ?? 0,
            inactive: (productStats?.totalProducts ?? 0) - (productStats?.activeProducts ?? 0)
          },
          reviews: {
            total: productStats?.totalReviews ?? 0,
            unread: 0,
            averageRating: productStats?.averageRating ?? 0,
            pending: 0
          }
        });
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        setError(t('dashboard.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const salesGrowth = dashboardData.sales.growth ||
    ((dashboardData.sales.month - dashboardData.sales.lastMonth) / (dashboardData.sales.lastMonth || 1) * 100);

  if (isLoading) {
    return (
      <SellerLayout title={t('dashboard.title')} onGo={onGo}>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div
                className="w-12 h-12 border-4 border-[#E85A6B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">{t('dashboard.loadingData')}</p>
            </div>
          </div>
        </div>
      </SellerLayout>
    );
  }

  if (error) {
    return (
      <SellerLayout title={t('dashboard.title')} onGo={onGo}>
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <FaExclamationTriangle className="w-6 h-6 text-red-500 mr-3" />
              <div>
                <h3 className="text-red-800 font-medium">{t('dashboard.errorOccurred')}</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-red-600 underline text-sm mt-2 hover:text-red-800"
                >
                  {t('dashboard.refreshPage')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout title={t('dashboard.title')} onGo={onGo}>
      <div className="space-y-6">
        {/* 상단 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 border shadow-sm flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.todaySales')}</p>
              <p className="text-2xl font-bold text-gray-900">{money(dashboardData.sales.today)}</p>
            </div>
            <div className="w-12 h-12 bg-[#FFF1F2] rounded-full flex items-center justify-center flex-shrink-0">
              <FaDollarSign className="w-6 h-6 text-[#E85A6B]" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border shadow-sm flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.monthSales')}</p>
              <p className="text-2xl font-bold text-gray-900">{money(dashboardData.sales.month)}</p>
              <p className={`text-sm ${Number(salesGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(salesGrowth) >= 0 ? '+' : ''}{salesGrowth}% {t('dashboard.vsLastMonth')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaChartLine className="w-6 h-6 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border shadow-sm flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.pendingOrders')}</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.orders.pending}{t('dashboard.countUnit')}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaClipboardList className="w-6 h-6 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border shadow-sm flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.registeredProducts')}</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.products.total}{t('dashboard.itemUnit')}</p>
              <p className="text-sm text-gray-600">{t('dashboard.activeCount', { count: dashboardData.products.active })}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaBox className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* 빠른 액션 버튼 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.quickActions')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => onGo('/seller/products/new')}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#E85A6B] hover:bg-[#FFF1F2] transition-colors"
            >
              <FaPlus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium">{t('dashboard.registerProduct')}</span>
            </button>

            <button
              onClick={() => onGo('/seller/orders')}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <FaClipboardList className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium">{t('dashboard.orderManagement')}</span>
            </button>

            <button
              onClick={() => onGo('/seller/analytics')}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <MdDashboard className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium">{t('dashboard.salesAnalytics')}</span>
            </button>

            <button
              onClick={() => onGo('/seller/settlement')}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
            >
              <FaWallet className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium">{t('dashboard.settlementManagement')}</span>
            </button>
          </div>
        </div>

        {/* 최근 주문 현황 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('dashboard.recentOrders')}</h3>
            <button
              onClick={() => onGo('/seller/orders')}
              className="text-[#E85A6B] hover:text-[#E85A6B] text-sm font-medium"
            >
              {t('dashboard.viewAll')}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{dashboardData.orders.pending}</p>
              <p className="text-sm text-gray-600">{t('dashboard.pendingLabel')}</p>
            </div>
            <div className="text-center p-4 bg-[#FFF1F2] rounded-lg">
              <p className="text-2xl font-bold text-[#E85A6B]">{dashboardData.orders.processing}</p>
              <p className="text-sm text-gray-600">{t('dashboard.processingLabel')}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{dashboardData.orders.shipped}</p>
              <p className="text-sm text-gray-600">{t('dashboard.shippingLabel')}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{dashboardData.orders.delivered}</p>
              <p className="text-sm text-gray-600">{t('dashboard.deliveredLabel')}</p>
            </div>
          </div>
        </div>

        {/* 상품 현황 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('dashboard.productStatus')}</h3>
            <button
              onClick={() => onGo('/seller/products')}
              className="text-[#E85A6B] hover:text-[#E85A6B] text-sm font-medium"
            >
              {t('dashboard.viewAll')}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[#FFF1F2] rounded-lg">
              <p className="text-2xl font-bold text-[#E85A6B]">{dashboardData.products.total}</p>
              <p className="text-sm text-gray-600">{t('dashboard.totalProducts')}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{dashboardData.products.active}</p>
              <p className="text-sm text-gray-600">{t('dashboard.onSale')}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{dashboardData.products.inactive}</p>
              <p className="text-sm text-gray-600">{t('dashboard.inactive')}</p>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}

// 상품 관리 페이지
export function SellerProducts({ onGo }: { onGo: (to: string) => void }) {
  const { t } = useTranslation('seller');
  const [ filter, setFilter ] = useState('all');
  const [ searchQuery, setSearchQuery ] = useState('');
  const [ products, setProducts ] = useState<any[]>([]);
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);

  // 삭제 관련 상태
  const [ showDeleteModal, setShowDeleteModal ] = useState(false);
  const [ productToDelete, setProductToDelete ] = useState<any | null>(null);
  const [ isDeleting, setIsDeleting ] = useState(false);

  // 다중 선택 관련 상태
  const [ selectedProductUuids, setSelectedProductUuids ] = useState<Set<string>>(new Set());
  const [ showBulkDeleteModal, setShowBulkDeleteModal ] = useState(false);

  // 중복 API 호출 방지용 ref (React StrictMode 대응)
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 상품 목록 로드 (중복 호출 방지)
  useEffect(() => {
    // effect 시작 시 이전 상태 리셋 (수정 후 복귀 시에도 항상 새로 로드)
    isLoadingRef.current = false;

    const loadProducts = async () => {
      // 이미 로딩 중이면 중복 호출 방지
      if (isLoadingRef.current) {
        console.log('API call already in progress, skipping...');
        return;
      }

      // 이전 요청이 있으면 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      try {
        isLoadingRef.current = true;
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        console.log('Loading products with filter:', filter, 'search:', searchQuery);

        // API 호출
        try {
          const response = await sellerService.getSellerProducts({
            page: 1,
            limit: 50,
            search: searchQuery.trim() || undefined,
            // 필터에 따른 상태 처리
            ...(filter !== 'all' && { isActive: filter === 'active' })
          });

          // 요청이 취소되었으면 처리하지 않음
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          setProducts(response.data || []);
        } catch (apiError) {
          // 요청이 취소된 경우는 에러로 처리하지 않음
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          console.error('Failed to load seller products:', apiError);
          // API 오류 시 사용자에게 알림 (가짜 샘플 데이터로 대체하지 않는다)
          setError(t('products.loadFailed'));
          setProducts([]);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        setError(t('products.loadFailed'));
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    };

    loadProducts();

    // 컴포넌트 언마운트 시 진행 중인 요청 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isLoadingRef.current = false;
    };
  }, [ filter, searchQuery ]); // filter나 searchQuery가 변경될 때마다 재로드

  // API에서 이미 필터링된 데이터가 오므로 추가 필터링 불필요
  const filteredProducts = products;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">{t('products.onSale')}</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">{t('products.inactive')}</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">{t('products.unknown')}</span>;
    }
  };

  // 삭제 관련 함수들
  const handleDeleteClick = (product: any) => {
    console.log(product);
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      setIsDeleting(true);
      console.log('Deleting product:', productToDelete.productUuid);

      // API 호출
      await sellerService.deleteProduct(productToDelete.productUuid);

      // 성공 시 목록에서 제거
      setProducts(prevProducts =>
        prevProducts.filter(p => p.productUuid !== productToDelete.productUuid)
      );

      // 모달 닫기
      setShowDeleteModal(false);
      setProductToDelete(null);

      // 성공 메시지
      alert(t('products.deleteSuccess'));

    } catch (error) {
      console.error('Product delete failed:', error);
      const errorMessage = error instanceof Error ? error.message : t('products.deleteFailed');
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  // 다중 선택 관련 함수들
  const toggleSelectProduct = (productUuid: string) => {
    setSelectedProductUuids(prev => {
      const next = new Set(prev);
      if (next.has(productUuid)) {
        next.delete(productUuid);
      } else {
        next.add(productUuid);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProductUuids.size === filteredProducts.length) {
      setSelectedProductUuids(new Set());
    } else {
      setSelectedProductUuids(new Set(filteredProducts.map(p => p.productUuid)));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedProductUuids.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const uuids = Array.from(selectedProductUuids);

      // 순차적으로 삭제 (서버 부하 방지)
      for (const uuid of uuids) {
        await sellerService.deleteProduct(uuid);
      }

      // 성공 시 목록에서 제거
      setProducts(prev => prev.filter(p => !selectedProductUuids.has(p.productUuid)));
      setSelectedProductUuids(new Set());
      setShowBulkDeleteModal(false);
      alert(t('products.deleteSuccess'));
    } catch (error) {
      console.error('Bulk delete failed:', error);
      const errorMessage = error instanceof Error ? error.message : t('products.deleteFailed');
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SellerLayout title={t('products.title')} onGo={onGo}>
      <div className="space-y-6">
        {/* 상단 액션 바 */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder={t('products.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor"
                   viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
            >
              <option value="all">{t('products.allProducts')}</option>
              <option value="active">{t('products.onSale')}</option>
              <option value="inactive">{t('products.inactive')}</option>
            </select>
          </div>

          <div className="flex gap-2">
            {selectedProductUuids.size > 0 && (
              <button
                onClick={handleBulkDeleteClick}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                선택 삭제 ({selectedProductUuids.size})
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              disabled={isLoading}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
              title={t('products.refresh')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {t('products.refresh')}
            </button>

            <button
              onClick={() => onGo('/seller/products/bulk-upload')}
              className="px-4 py-2 border border-[#E85A6B] text-[#E85A6B] rounded-lg hover:bg-[#FFF1F2] flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              대량 등록
            </button>

            <button
              onClick={() => onGo('/seller/products/new')}
              className="px-4 py-2 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B] flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              {t('products.registerProduct')}
            </button>
          </div>
        </div>

        {/* 상품 목록 */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E85A6B]"></div>
                <span className="text-gray-600">{t('products.loadingProducts')}</span>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !isLoading && (
            <div className="flex flex-col justify-center items-center py-12 gap-4">
              <div className="text-red-600 text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-lg font-medium">{t('products.errorOccurred')}</p>
                <p className="text-sm text-gray-600 mt-1">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B]"
              >
                {t('common:retry')}
              </button>
            </div>
          )}

          {/* 상품 목록 테이블 */}
          {!isLoading && !error && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={filteredProducts.length > 0 && selectedProductUuids.size === filteredProducts.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-[#E85A6B] rounded border-gray-300 focus:ring-[#E85A6B]"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('products.productHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('products.priceHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('products.statusHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('products.salesHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('products.viewsHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('products.actionsHeader')}
                    </th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.productUuid} className={`hover:bg-gray-50 ${selectedProductUuids.has(product.productUuid) ? 'bg-pink-50' : ''}`}>
                      <td className="px-3 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedProductUuids.has(product.productUuid)}
                          onChange={() => toggleSelectProduct(product.productUuid)}
                          className="h-4 w-4 text-[#E85A6B] rounded border-gray-300 focus:ring-[#E85A6B]"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            className="h-12 w-12 rounded-lg object-cover bg-gray-100"
                            src={product.mainImageUrl || ''}
                            alt={product.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                            }}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">업데이트: {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : product.createdAt}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {money(product.discountedPrice || product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product.status || (product.isActive ? 'active' : 'inactive'))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(product.stats?.ordersCount || 0)}개
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(product.stats?.viewsCount || 0).toLocaleString()}회
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onGo(`/seller/products/${product.productUuid}/edit`)}
                            className="text-[#E85A6B] hover:text-blue-900"
                          >
                            {t('products.edit')}
                          </button>
                          <button
                            onClick={() => onGo(`/seller/products/${product.productUuid}/analytics`)}
                            className="text-green-600 hover:text-green-900"
                          >
                            {t('products.analytics')}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {t('products.deleteProduct')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {/* 빈 상태 표시 */}
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor"
                       viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">{t('products.noProducts')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('products.noProductsDesc')}</p>
                  <div className="mt-6">
                    <button
                      onClick={() => onGo('/seller/products/new')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#E85A6B] hover:bg-[#D14A5B]"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                      </svg>
                      {t('products.registerProduct')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">{t('products.deleteTitle')}</h3>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">
                {t('products.deleteConfirm')}
              </p>
              <p className="text-sm font-medium text-gray-900 mt-2">
                "{productToDelete.name}"
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t('products.deleteIrreversible')}
              </p>
            </div>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {t('common:cancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('products.deleting')}
                  </div>
                ) : (
                  t('common:delete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 다중 삭제 확인 모달 */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">{t('products.deleteTitle')}</h3>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">
                선택한 <span className="font-bold text-red-600">{selectedProductUuids.size}개</span>의 상품을 삭제하시겠습니까?
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t('products.deleteIrreversible')}
              </p>
            </div>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {t('common:cancel')}
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('products.deleting')}
                  </div>
                ) : (
                  `${selectedProductUuids.size}개 삭제`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}

// 웹 전용 타입 정의 (shared 타입 사용)

/**
 * 상품 등록/수정 폼이 들고 있는 상세 이미지.
 * 서버 DetailImage(url/description/order)와 달리, 업로드 실패 시 재시도를 위해
 * 원본 File을 함께 보관하고 order는 제출 시점(index 기반)에 채운다.
 */
interface DetailImage {
  file?: File;
  url: string;
  description?: string;
  order?: number;
}

// 판매 방식(fulfillmentMode) 및 옵션·재고 매트릭스용 상수/타입
type FulfillmentMode = 'made_to_order' | 'stocked';

interface VariantInput {
  stock: string;
  priceModifier: string;
  isActive: boolean;
}


const VARIANT_SHAPES = [ 'ROUND', 'ALMOND', 'OVAL', 'STILETTO', 'SQUARE', 'COFFIN' ] as const;
const VARIANT_LENGTHS = [ 'SHORT', 'MEDIUM', 'LONG' ] as const;

// 조합 키 = shape|length (축 변경 시에도 입력값 보존용)
const variantKey = (shape: string, length: string) => `${shape}|${length}`;

const DEFAULT_VARIANT_INPUT: VariantInput = { stock: '0', priceModifier: '0', isActive: true };

// 네일팁 전용 상품 등록/수정 페이지 (서버 API 스펙 완전 일치)
export function SellerProductForm({ onGo, productUuid }: { onGo: (to: string) => void; productUuid?: string }) {
  const { t } = useTranslation('seller');
  const isEdit = !!productUuid;
  const [ formData, setFormData ] = useState({
    // 상품 유형
    productType: 'original' as ProductType,

    // 기본 정보
    name: '',
    description: '',
    shortDescription: '',
    brand: '네일 제품',
    sku: '',
    price: '',
    salePrice: '',
    discountRate: '',
    stockQuantity: '100',
    processingDays: '3',
    status: 'active',

    // 판매 방식 (기본: 주문 제작 = 기존 동작)
    fulfillmentMode: 'made_to_order' as FulfillmentMode,

    // 네일 전용 필드
    nailShape: 'ROUND' as NailShape,
    nailLength: 'MEDIUM' as NailLength,
    lengthCustomizable: false,
    shapeCustomizable: false,
    designCustomizable: false,

    // 네일 카테고리 (value 값 사용)
    nailCategories: {
      style: [] as string[],
      color: [] as string[],
      texture: [] as string[],
      tpo: [] as string[],
      nation: 'kr' as string
    } as NailCategories,

    // 이미지
    // 업로드 직후에는 원본 File을 함께 들고 있다가(재업로드용) 제출 시 url만 전송한다
    mainImage: null as File | null,
    mainImageUrl: '',
    detailImages: [] as DetailImage[],

    // 상품 옵션
    isFeatured: false,
    isNewProduct: true,
    tags: [] as string[],

    // 커스텀 주문서 연결
    customOrderRequestUuid: ''
  });

  const [ isSubmitting, setIsSubmitting ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);
  const [ isLoading, setIsLoading ] = useState(false);

  // 옵션·재고 매트릭스 상태
  const [ selectedShapes, setSelectedShapes ] = useState<string[]>([]);
  const [ selectedLengths, setSelectedLengths ] = useState<string[]>([]);
  const [ variantInputs, setVariantInputs ] = useState<Record<string, VariantInput>>({});
  const [ bulkStock, setBulkStock ] = useState('');
  const [ bulkModifier, setBulkModifier ] = useState('');
  // 수정 폼 진입 시 서버에 저장돼 있던 판매 방식 (stocked → made_to_order 전환 감지용)
  const [ initialFulfillmentMode, setInitialFulfillmentMode ] = useState<FulfillmentMode>('made_to_order');

  // 체크된 축의 데카르트 곱으로 조합 생성 (표시 순서는 상수 배열 순서 고정)
  const variantCombos = useMemo(() =>
    VARIANT_SHAPES.filter(shape => selectedShapes.includes(shape)).flatMap(shape =>
      VARIANT_LENGTHS.filter(length => selectedLengths.includes(length)).map(length => ({
        shape,
        length,
        key: variantKey(shape, length)
      }))
    ), [ selectedShapes, selectedLengths ]);

  const getVariantInput = (key: string): VariantInput => variantInputs[key] ?? DEFAULT_VARIANT_INPUT;

  const updateVariantInput = (key: string, patch: Partial<VariantInput>) => {
    setVariantInputs(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? DEFAULT_VARIANT_INPUT), ...patch }
    }));
  };

  const toggleShape = (shape: string) => {
    setSelectedShapes(prev => prev.includes(shape) ? prev.filter(s => s !== shape) : [ ...prev, shape ]);
  };

  const toggleLength = (length: string) => {
    setSelectedLengths(prev => prev.includes(length) ? prev.filter(l => l !== length) : [ ...prev, length ]);
  };

  // 일괄 적용 (현재 생성된 조합에만 적용 — 숨겨진 조합의 보존값은 건드리지 않음)
  const applyBulkStock = () => {
    if (bulkStock === '') return;
    const value = String(Math.max(0, parseInt(bulkStock, 10) || 0));
    setVariantInputs(prev => {
      const next = { ...prev };
      variantCombos.forEach(({ key }) => {
        next[key] = { ...(prev[key] ?? DEFAULT_VARIANT_INPUT), stock: value };
      });
      return next;
    });
  };

  const applyBulkModifier = () => {
    if (bulkModifier === '') return;
    const value = String(parseInt(bulkModifier, 10) || 0);
    setVariantInputs(prev => {
      const next = { ...prev };
      variantCombos.forEach(({ key }) => {
        next[key] = { ...(prev[key] ?? DEFAULT_VARIANT_INPUT), priceModifier: value };
      });
      return next;
    });
  };

  // 하단 요약: 총 재고 / 조합 수 / 판매 조합 수
  const variantSummary = useMemo(() => {
    let totalStock = 0;
    let activeCount = 0;
    variantCombos.forEach(({ key }) => {
      const input = variantInputs[key] ?? DEFAULT_VARIANT_INPUT;
      if (input.isActive) {
        activeCount += 1;
        totalStock += Math.max(0, parseInt(input.stock, 10) || 0);
      }
    });
    return { totalStock, activeCount, comboCount: variantCombos.length };
  }, [ variantCombos, variantInputs ]);

  // 커스텀 주문서 모달 관련 상태
  const [ showOrderModal, setShowOrderModal ] = useState(false);
  const [ customOrders, setCustomOrders ] = useState<CustomOrderRequest[]>([]);
  const [ loadingOrders, setLoadingOrders ] = useState(false);

  // 상품 수정 모드일 때 기존 상품 정보 불러오기
  useEffect(() => {
    if (productUuid && isEdit) {
      const loadProductData = async () => {
        try {
          setIsLoading(true);
          setError(null);

          console.log('Loading product data for ID:', productUuid);
          const response = await sellerService.getSellerProduct(productUuid);

          console.log('Full API response:', response);

          if (!response.success || !response.data) {
            throw new Error('Failed to load product data');
          }

          const product = response.data; // 실제 API 응답 구조에 맞게 수정

          console.log('Loaded product data:', product);

          // 상품 데이터 유효성 검증
          if (!product || typeof product !== 'object') {
            throw new Error('Invalid product data received from server');
          }

          // 폼 데이터 업데이트 (API 응답 구조에 맞게, 안전한 접근)
          // 함수형 업데이트로 fulfillmentMode 등 별도 로드 필드 보존
          setFormData(prev => ({
            ...prev,
            // 상품 유형 (서버와 동일하게 소문자 사용)
            productType: (product.productType as ProductType) || 'original',

            // 기본 정보
            name: String(product.name || ''),
            description: String(product.description || ''),
            shortDescription: String(product.shortDescription || ''),
            brand: String(product.brand || 'Seller Store'),
            sku: String(product.sku || ''),

            // 가격 정보 (숫자를 안전하게 문자열로 변환)
            price: product.price ? String(product.price) : '',
            salePrice: product.salePrice ? String(product.salePrice) : '',
            discountRate: product.discountRate !== null && product.discountRate !== undefined ? String(product.discountRate) : '',

            // 재고 및 처리 정보
            stockQuantity: product.stockQuantity ? String(product.stockQuantity) : '100',
            processingDays: product.processingDays ? String(product.processingDays) : '3',
            status: product.status || 'active',

            // 네일 전용 필드
            nailShape: (product.nailShape as NailShape) || 'ROUND',
            nailLength: (product.nailLength as NailLength) || 'MEDIUM',
            lengthCustomizable: product.nailOptions?.lengthCustomizable ?? false,
            shapeCustomizable: product.nailOptions?.shapeCustomizable ?? false,
            designCustomizable: product.nailOptions?.designCustomizable ?? false,
            nailCategories: {
              style: Array.isArray(product.nailCategories?.style) ? product.nailCategories.style : [],
              color: Array.isArray(product.nailCategories?.color) ? product.nailCategories.color : [],
              texture: Array.isArray(product.nailCategories?.texture) ? product.nailCategories.texture : [],
              tpo: Array.isArray(product.nailCategories?.tpo) ? product.nailCategories.tpo : [],
              nation: product.nailCategories?.nation || 'kr'
            },

            // 이미지
            mainImageUrl: String(product.mainImageUrl || ''),
            detailImages: Array.isArray(product.detailImages) ? product.detailImages : [],

            // 상품 옵션
            isFeatured: Boolean(product.isFeatured),
            isNewProduct: Boolean(product.isNewProduct ?? true),
            tags: Array.isArray(product.tags) ? product.tags : []
          }));

        } catch (error) {
          console.error('Failed to load product data:', error);
          setError(t('productForm.loadFailed'));
        } finally {
          setIsLoading(false);
        }
      };

      loadProductData();
    }
  }, [productUuid, isEdit]);

  // 수정 모드: 기존 판매 방식·옵션(variant) 불러오기
  useEffect(() => {
    if (!productUuid || !isEdit) return;

    const loadVariants = async () => {
      try {
        const response = await sellerService.getProductVariants(productUuid);
        if (!response.success || !response.data) return;

        const data = response.data;
        const mode: FulfillmentMode = data.fulfillmentMode === 'stocked' ? 'stocked' : 'made_to_order';
        setInitialFulfillmentMode(mode);
        setFormData(prev => ({ ...prev, fulfillmentMode: mode }));
        setSelectedShapes(Array.isArray(data.axes?.shapes) ? data.axes.shapes : []);
        setSelectedLengths(Array.isArray(data.axes?.lengths) ? data.axes.lengths : []);

        const inputs: Record<string, VariantInput> = {};
        (data.variants || []).forEach(variant => {
          const shape = variant.optionCombination?.find(o => o.optionType === 'shape')?.optionValue;
          const length = variant.optionCombination?.find(o => o.optionType === 'length')?.optionValue;
          if (!shape || !length) return;
          inputs[variantKey(shape, length)] = {
            stock: String(variant.stock ?? 0),
            priceModifier: String(variant.priceModifier ?? 0),
            isActive: Boolean(variant.isActive)
          };
        });
        setVariantInputs(inputs);
      } catch (error) {
        // 옵션 로드 실패는 폼 진입을 막지 않음 (기본값 = 주문 제작)
        console.error('Failed to load product variants:', error);
      }
    };

    loadVariants();
  }, [productUuid, isEdit]);

  // 커스텀 주문서 목록 불러오기
  const handleLoadOrderRequest = async () => {
    setLoadingOrders(true);
    try {
      const response = await sellerService.getCustomOrderRequests();
      if (response.success && response.data) {
        // 이미 등록된 주문서는 필터링 (isRegisteredAsProduct가 true인 경우)
        const availableOrders = response.data.filter(order => !order.isRegisteredAsProduct);
        setCustomOrders(availableOrders);
        setShowOrderModal(true);
      } else {
        alert(t('productForm.orderFormLoadFailed'));
      }
    } catch (error) {
      console.error('Failed to load custom order requests:', error);
      alert('주문서 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoadingOrders(false);
    }
  };

  // 주문서 선택 시 프리필 데이터로 폼 채우기
  const handleSelectOrder = async (requestUuid: string) => {
    try {
      setLoadingOrders(true);
      const response = await sellerService.getPrefillData(requestUuid);

      if (response.success && response.data) {
        const data = response.data;
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          description: data.description || prev.description,
          shortDescription: data.shortDescription || prev.shortDescription,
          brand: data.brand || prev.brand,
          price: data.price ? String(data.price) : prev.price,
          processingDays: data.processingDays ? String(data.processingDays) : prev.processingDays,
          mainImageUrl: data.mainImageUrl || prev.mainImageUrl,
          detailImages: data.detailImages || prev.detailImages,
          nailShape: data.nailShape || prev.nailShape,
          nailLength: data.nailLength || prev.nailLength,
          nailCategories: data.nailCategories || prev.nailCategories,
          productType: 'custom',
          customOrderRequestUuid: data.customOrderRequestUuid,
          stockQuantity: '0', // 커스텀 상품은 재고 0
        }));
        setShowOrderModal(false);
        alert(t('productForm.orderFormApplied'));
      }
    } catch (error: any) {
      console.error('Failed to get prefill data:', error);
      // 이미 등록된 주문서 에러 처리
      if (error?.data?.error === 'This custom order request is already registered as a product') {
        alert(t('productForm.orderFormAlreadyRegistered'));
      } else {
        alert(t('productForm.orderFormPrefillFailed'));
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. 입력 데이터 검증 (서버 API 스펙에 맞게)
      if (!formData.name || formData.name.length < 2 || formData.name.length > 200) {
        throw new Error(t('productForm.nameValidation'));
      }
      if (!formData.description || formData.description.length < 10 || formData.description.length > 2000) {
        throw new Error(t('productForm.descValidation'));
      }
      if (!formData.price || parseInt(formData.price) <= 0) {
        throw new Error(t('productForm.priceValidation'));
      }
      if (!formData.mainImageUrl) {
        throw new Error(t('productForm.mainImageValidation'));
      }
      if (parseInt(formData.processingDays) < 0 || parseInt(formData.processingDays) > 365) {
        throw new Error(t('productForm.processingDaysValidation'));
      }

      // 네일 카테고리 검증
      if (formData.nailCategories.style.length > 3) {
        throw new Error(t('productForm.styleMaxValidation'));
      }
      if (formData.nailCategories.color.length > 3) {
        throw new Error(t('productForm.colorMaxValidation'));
      }
      if (formData.tags.length > 20) {
        throw new Error(t('productForm.tagsMaxValidation'));
      }

      // 판매 방식 검증 + 옵션 payload 구성 (기성 재고)
      const isStocked = formData.fulfillmentMode === 'stocked';
      const variantPayload = isStocked
        ? variantCombos.map(({ shape, length, key }) => {
          const input = getVariantInput(key);
          return {
            optionCombination: [
              { optionType: 'shape' as const, optionValue: shape },
              { optionType: 'length' as const, optionValue: length }
            ],
            stock: Math.max(0, parseInt(input.stock, 10) || 0),
            priceModifier: parseInt(input.priceModifier, 10) || 0,
            isActive: input.isActive
          };
        })
        : [];

      if (isStocked && !variantPayload.some(v => v.isActive)) {
        throw new Error('기성 재고 판매는 판매 중인 옵션 조합이 1개 이상 필요합니다. 제공하는 쉐입·길이를 선택하고 조합의 "판매" 체크를 확인해주세요.');
      }

      const stockedTotalStock = variantPayload
        .filter(v => v.isActive)
        .reduce((sum, v) => sum + v.stock, 0);

      // 2. 상품 데이터 구성
      // 공통 필드 (등록/수정 모두 사용)
      const commonData = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription || formData.description.substring(0, 100),
        brand: formData.brand || '네일아트',
        price: parseInt(formData.price),
        salePrice: formData.salePrice ? parseInt(formData.salePrice) : undefined,
        discountRate: formData.discountRate ? parseInt(formData.discountRate) : null,
        mainImageUrl: formData.mainImageUrl,
        detailImages: formData.detailImages.map((img, index) => ({
          url: img.url,
          description: img.description,
          order: img.order || index + 1
        })),
        stockQuantity: formData.productType === 'custom'
          ? 0
          : (isStocked ? stockedTotalStock : parseInt(formData.stockQuantity)),
        processingDays: parseInt(formData.processingDays),
        nailCategories: formData.nailCategories,
        nailShape: formData.nailShape,
        nailLength: formData.nailLength,
        nailOptions: {
          // 기성 재고 판매는 커스텀 선택 흐름을 쓰지 않음 (조합 선택으로 대체)
          lengthCustomizable: isStocked ? false : formData.lengthCustomizable,
          shapeCustomizable: isStocked ? false : formData.shapeCustomizable,
          designCustomizable: formData.designCustomizable
        },
        isFeatured: formData.isFeatured,
        isNewProduct: formData.isNewProduct,
        tags: formData.tags,
      };

      // 3. API 호출 (등록 vs 수정)
      let response;
      if (isEdit && productUuid) {
        // 수정: customOrderRequestUuid만 제외, productType은 포함 (서버는 소문자 요구)
        const updateData: UpdateProductRequest = {
          ...commonData,
          productUuid: productUuid,
          productType: formData.productType.toLowerCase() as any
        };
        console.log('수정할 상품 데이터:', updateData);
        response = await productService.updateProduct(productUuid, updateData);
      } else {
        // 등록: 모든 필드 포함 (서버는 소문자 productType 요구)
        const productData: CreateProductRequest = {
          ...commonData,
          productType: formData.productType.toLowerCase() as any,
          sku: formData.sku || `NAIL-${Date.now()}`,
          customOrderRequestUuid: formData.customOrderRequestUuid || undefined
        };
        console.log('등록할 상품 데이터:', productData);
        response = await productService.createProduct(productData);
      }

      // 4. 옵션(variant) 저장 — 상품 저장 성공 후
      //    (신규 생성 시 서버 응답의 productUuid 사용, 없으면 productId 폴백 — variants API는 둘 다 허용)
      const savedProductId = isEdit && productUuid
        ? productUuid
        : String((response?.data as any)?.productUuid || (response?.data as any)?.productId || '');

      if (isStocked || (isEdit && initialFulfillmentMode === 'stocked')) {
        try {
          if (!savedProductId) {
            throw new Error('상품 식별자를 확인할 수 없습니다.');
          }
          await sellerService.saveProductVariants(savedProductId, {
            fulfillmentMode: formData.fulfillmentMode,
            // 주문 제작으로 전환 시엔 빈 배열 → 서버가 기존 조합 전체 비활성 처리
            variants: isStocked ? variantPayload : []
          });
        } catch (variantError) {
          console.error('옵션·재고 저장 실패:', variantError);
          const variantMessage = variantError instanceof Error ? variantError.message : '';
          alert(`상품은 저장되었지만 옵션·재고 저장에 실패했습니다. 상품 수정 화면에서 다시 시도해주세요.${variantMessage ? `\n(${variantMessage})` : ''}`);
          onGo('/seller/products');
          return;
        }
      }

      // 5. 성공 처리
      console.log(isEdit ? '상품 수정 성공:' : '상품 등록 성공:', response);
      alert(isEdit ? t('productForm.editSuccess') : t('productForm.createSuccess'));
      onGo('/seller/products');

    } catch (error) {
      // 5. 에러 처리
      const errorMessage = error instanceof Error ? error.message : (isEdit ? t('productForm.editFailed') : t('productForm.createFailed'));
      setError(errorMessage);
      console.error(isEdit ? '상품 수정 실패:' : '상품 등록 실패:', error);
      alert(errorMessage);

    } finally {
      // 6. 로딩 종료
      setIsSubmitting(false);
    }
  };

  // 대표 이미지 업로드 상태
  const [ mainImageUploading, setMainImageUploading ] = useState(false);

  // 대표 이미지 업로드 (즉시 S3 업로드)
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMainImageUploading(true);
    try {
      // 1. presigned URL 요청
      console.log('Requesting presigned URL for main image...');
      const presignedResponse = await imageService.getPresignedUrl({
        filename: file.name,
        contentType: file.type,
        uploadType: 'product-main'
      });
      console.log('Presigned URL received:', presignedResponse);

      // 2. S3에 이미지 업로드
      console.log('Uploading to S3...');
      const uploadHeaders: Record<string, string> = {
        'Content-Type': file.type,
        // Add any additional headers required by the presigned URL (e.g., x-amz-acl)
        ...(presignedResponse.uploadHeaders || {})
      };
      const uploadResponse = await fetch(presignedResponse.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: uploadHeaders,
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.status}`);
      }

      console.log('Image uploaded successfully to S3');

      // 3. 폼 상태 업데이트
      setFormData({
        ...formData,
        mainImage: file,
        mainImageUrl: presignedResponse.imageUrl // S3 URL 사용
      });

    } catch (error) {
      console.error('Main image upload failed:', error);
      // 실패해도 로컬 미리보기는 보여줌
      setFormData({
        ...formData,
        mainImage: file,
        mainImageUrl: URL.createObjectURL(file) // 로컬 미리보기
      });
      alert(t('productForm.imageUploadFailed'));
    } finally {
      setMainImageUploading(false);
    }
  };

  // 상세 이미지 업로드 상태
  const [ detailImageUploading, setDetailImageUploading ] = useState(false);
  const [ failedImages, setFailedImages ] = useState<Set<number>>(new Set());

  // 상세 이미지 추가 (즉시 S3 업로드)
  const addDetailImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || formData.detailImages.length >= 10) return;

    setDetailImageUploading(true);
    try {
      // 1. presigned URL 요청
      console.log('Requesting presigned URL for detail image...');
      const presignedResponse = await imageService.getPresignedUrl({
        filename: file.name,
        contentType: file.type,
        uploadType: 'product-detail'
      });
      console.log('Presigned URL received for detail image:', presignedResponse);

      // 2. S3에 이미지 업로드
      console.log('Uploading detail image to S3...');
      const uploadHeaders: Record<string, string> = {
        'Content-Type': file.type,
        // Add any additional headers required by the presigned URL (e.g., x-amz-acl)
        ...(presignedResponse.uploadHeaders || {})
      };
      const uploadResponse = await fetch(presignedResponse.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: uploadHeaders,
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.status}`);
      }

      console.log('Detail image uploaded successfully to S3');

      // 3. 새 이미지 추가
      const newImage: DetailImage = {
        file,
        url: presignedResponse.imageUrl, // S3 URL 사용
        description: ''
      };

      setFormData({
        ...formData,
        detailImages: [ ...formData.detailImages, newImage ]
      });

    } catch (error) {
      console.error('Detail image upload failed:', error);

      // 실패해도 로컬 미리보기는 추가
      const newImage: DetailImage = {
        file,
        url: URL.createObjectURL(file), // 로컬 미리보기
        description: ''
      };
      const newImages = [ ...formData.detailImages, newImage ];
      setFormData({
        ...formData,
        detailImages: newImages
      });

      // 실패한 이미지 인덱스를 기록
      const newFailedImages = new Set(failedImages);
      newFailedImages.add(newImages.length - 1);
      setFailedImages(newFailedImages);

      alert(t('productForm.detailImageUploadFailed'));
    } finally {
      setDetailImageUploading(false);
    }
  };

  // 상세 이미지 설명 업데이트
  const updateDetailImageDescription = (index: number, description: string) => {
    const updatedImages = [ ...formData.detailImages ];
    updatedImages[index].description = description;
    setFormData({ ...formData, detailImages: updatedImages });
  };

  // 상세 이미지 삭제
  const removeDetailImage = (index: number) => {
    const updatedImages = formData.detailImages.filter((_, i) => i !== index);
    setFormData({ ...formData, detailImages: updatedImages });

    // 실패 목록에서도 제거
    const newFailedImages = new Set(failedImages);
    newFailedImages.delete(index);
    setFailedImages(newFailedImages);
  };

  // 이미지 재업로드
  const retryImageUpload = async (index: number) => {
    const detailImage = formData.detailImages[index];
    if (!detailImage?.file) return;

    setDetailImageUploading(true);
    try {
      console.log(`Retrying upload for image ${index}...`);
      const presignedResponse = await imageService.getPresignedUrl({
        filename: detailImage.file.name,
        contentType: detailImage.file.type,
        uploadType: 'product-detail'
      });

      // S3에 재업로드
      const uploadHeaders: Record<string, string> = {
        'Content-Type': detailImage.file.type,
        // Add any additional headers required by the presigned URL (e.g., x-amz-acl)
        ...(presignedResponse.uploadHeaders || {})
      };
      const uploadResponse = await fetch(presignedResponse.presignedUrl, {
        method: 'PUT',
        body: detailImage.file,
        headers: uploadHeaders,
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 retry upload failed: ${uploadResponse.status}`);
      }

      console.log(`Image ${index} retry upload successful`);

      // 성공 시 URL 업데이트 및 실패 목록에서 제거
      const updatedImages = [ ...formData.detailImages ];
      updatedImages[index] = {
        ...updatedImages[index],
        url: presignedResponse.imageUrl
      };
      setFormData({ ...formData, detailImages: updatedImages });

      const newFailedImages = new Set(failedImages);
      newFailedImages.delete(index);
      setFailedImages(newFailedImages);

    } catch (error) {
      console.error(`Retry upload failed for image ${index}:`, error);
      alert(t('productForm.retryImageUploadFailed'));
    } finally {
      setDetailImageUploading(false);
    }
  };

  // 드래그 앤 드롭 상태
  const [ draggedIndex, setDraggedIndex ] = useState<number | null>(null);
  const [ dragOverIndex, setDragOverIndex ] = useState<number | null>(null);

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  // 드래그 리브
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // 드롭
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updatedImages = [ ...formData.detailImages ];
    const draggedItem = updatedImages[draggedIndex];

    // 드래그된 아이템 제거
    updatedImages.splice(draggedIndex, 1);

    // 새 위치에 삽입
    const targetIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    updatedImages.splice(targetIndex, 0, draggedItem);

    setFormData({ ...formData, detailImages: updatedImages });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 터치 이벤트 상태
  const [ touchStartIndex, setTouchStartIndex ] = useState<number | null>(null);
  const [ touchPosition, setTouchPosition ] = useState<{ x: number; y: number } | null>(null);

  // 터치 시작
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    e.preventDefault();
    setTouchStartIndex(index);
    setDraggedIndex(index);
    const touch = e.touches[0];
    setTouchPosition({ x: touch.clientX, y: touch.clientY });
  };

  // 터치 이동
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchStartIndex === null) return;

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    // 드롭 대상이 될 수 있는 이미지 컨테이너 찾기
    const imageContainer = element?.closest('[data-image-index]');
    if (imageContainer) {
      const targetIndex = parseInt(imageContainer.getAttribute('data-image-index') || '0');
      setDragOverIndex(targetIndex);
    } else {
      setDragOverIndex(null);
    }
  };

  // 터치 종료
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();

    if (touchStartIndex === null || dragOverIndex === null) {
      setTouchStartIndex(null);
      setDraggedIndex(null);
      setDragOverIndex(null);
      setTouchPosition(null);
      return;
    }

    // 드롭 로직 실행
    if (touchStartIndex !== dragOverIndex) {
      const updatedImages = [ ...formData.detailImages ];
      const draggedItem = updatedImages[touchStartIndex];

      // 드래그된 아이템 제거
      updatedImages.splice(touchStartIndex, 1);

      // 새 위치에 삽입
      const targetIndex = touchStartIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
      updatedImages.splice(targetIndex, 0, draggedItem);

      setFormData({ ...formData, detailImages: updatedImages });
    }

    // 상태 초기화
    setTouchStartIndex(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchPosition(null);
  };

  return (
    <SellerLayout title={isEdit ? t('productForm.editTitle') : t('productForm.createTitle')} onGo={onGo}>
      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E85A6B]"></div>
            <span className="text-gray-600">{t('productForm.loadingProduct')}</span>
          </div>
        </div>
      )}

      {!isLoading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 에러 메시지 표시 */}
          {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              <div>
                <h3 className="text-red-800 font-medium">오류가 발생했습니다</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">기본 정보</h3>

          {/* 상품 유형 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              상품 유형 *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, productType: 'original' })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  formData.productType === 'original'
                    ? 'border-[#E85A6B] bg-[#FFF1F2] text-[#E85A6B]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                오리지널
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, productType: 'custom' })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  formData.productType === 'custom'
                    ? 'border-[#E85A6B] bg-[#FFF1F2] text-[#E85A6B]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                커스텀
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              오리지널: 기성품 / 커스텀: 주문제작 상품
            </p>
          </div>

          {/* 커스텀 선택 시 주문서 불러오기 버튼 */}
          {formData.productType === 'custom' && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleLoadOrderRequest}
                disabled={loadingOrders}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingOrders ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {loadingOrders ? '불러오는 중...' : '주문서 불러오기'}
              </button>
              {formData.customOrderRequestUuid && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  주문서가 연결되었습니다
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품명 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
                placeholder="네일 팁 상품명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                가격 (원) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
                placeholder="가격을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                판매 상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
              >
                <option value="active">판매중</option>
                <option value="inactive">판매중지</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품 설명
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
                placeholder="네일 팁에 대한 상세한 설명을 입력하세요"
              />
            </div>
          </div>
        </div>

        {/* 판매 방식 선택 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">판매 방식을 선택해주세요 *</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, fulfillmentMode: 'stocked' })}
              className={`text-left py-4 px-4 rounded-lg border-2 transition-all ${
                formData.fulfillmentMode === 'stocked'
                  ? 'border-[#E85A6B] bg-[#FFF1F2]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`font-semibold ${formData.fulfillmentMode === 'stocked' ? 'text-[#E85A6B]' : 'text-gray-800'}`}>
                📦 기성 재고 판매
              </div>
              <p className="text-xs text-gray-500 mt-1">만들어 둔 상품을 바로 발송</p>
              <p className="text-xs text-gray-500">옵션(쉐입·길이)별 재고 관리</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, fulfillmentMode: 'made_to_order' })}
              className={`text-left py-4 px-4 rounded-lg border-2 transition-all ${
                formData.fulfillmentMode === 'made_to_order'
                  ? 'border-[#E85A6B] bg-[#FFF1F2]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`font-semibold ${formData.fulfillmentMode === 'made_to_order' ? 'text-[#E85A6B]' : 'text-gray-800'}`}>
                🛠 주문 제작
              </div>
              <p className="text-xs text-gray-500 mt-1">주문 받은 후 제작해 발송</p>
              <p className="text-xs text-gray-500">쉐입·길이 커스텀 선택 가능</p>
            </button>
          </div>
        </div>

        {/* 네일 전용 설정 - 서버 API 스펙에 맞게 완전 재구성 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">네일 전용 설정</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {formData.fulfillmentMode === 'made_to_order' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    길이 *
                  </label>
                  <select
                    required
                    value={formData.nailLength}
                    onChange={(e) => setFormData({ ...formData, nailLength: e.target.value as NailLength })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
                  >
                    <option value="SHORT">숏 (Short)</option>
                    <option value="MEDIUM">미디움 (Medium)</option>
                    <option value="LONG">롱 (Long)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    쉐잎 *
                  </label>
                  <select
                    required
                    value={formData.nailShape}
                    onChange={(e) => setFormData({ ...formData, nailShape: e.target.value as NailShape })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
                  >
                    <option value="ROUND">라운드 (Round)</option>
                    <option value="ALMOND">아몬드 (Almond)</option>
                    <option value="OVAL">오벌 (Oval)</option>
                    <option value="STILETTO">스틸레토 (Stiletto)</option>
                    <option value="SQUARE">스퀘어 (Square)</option>
                    <option value="COFFIN">코핀 (Coffin)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제작 소요시간 (일) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="30"
                step="1"
                value={formData.processingDays}
                onChange={(e) => {
                  // 숫자만 입력 가능하도록 필터링
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, processingDays: value });
                }}
                onKeyDown={(e) => {
                  // 숫자, 백스페이스, 델리트, 화살표 키만 허용
                  if (!/[0-9]/.test(e.key) &&
                    ![ 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab' ].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
                placeholder="제작에 필요한 일수를 입력하세요"
              />
              <p className="text-xs text-gray-500 mt-1">
                주문 후 제작 완료까지 소요되는 일수입니다. (1~30일)
              </p>
            </div>

            {formData.fulfillmentMode === 'made_to_order' && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  커스터마이징 옵션
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.lengthCustomizable}
                      onChange={(e) => setFormData({ ...formData, lengthCustomizable: e.target.checked })}
                      className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">길이 변경 가능</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.shapeCustomizable}
                      onChange={(e) => setFormData({ ...formData, shapeCustomizable: e.target.checked })}
                      className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">쉐잎 변경 가능</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.designCustomizable}
                      onChange={(e) => setFormData({ ...formData, designCustomizable: e.target.checked })}
                      className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">디자인 커스텀 가능</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 옵션·재고 매트릭스 (기성 재고 판매) */}
          {formData.fulfillmentMode === 'stocked' && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제공하는 쉐입 *
                </label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {VARIANT_SHAPES.map((shape) => (
                    <label key={shape} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedShapes.includes(shape)}
                        onChange={() => toggleShape(shape)}
                        className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300 rounded"
                      />
                      <span className="ml-1.5 text-sm text-gray-700">{NAIL_SHAPE_NAME[shape] || shape}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제공하는 길이 *
                </label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {VARIANT_LENGTHS.map((length) => (
                    <label key={length} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedLengths.includes(length)}
                        onChange={() => toggleLength(length)}
                        className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300 rounded"
                      />
                      <span className="ml-1.5 text-sm text-gray-700">{NAIL_LENGTH_NAME[length] || length}</span>
                    </label>
                  ))}
                </div>
              </div>

              {variantCombos.length === 0 ? (
                <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  제공할 쉐입과 길이를 각각 1개 이상 선택하면 옵션 조합 표가 생성됩니다.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                            조합 ({variantCombos.length}개 생성)
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">재고</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">추가금 (원)</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-600">판매</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {variantCombos.map(({ shape, length, key }) => {
                          const input = getVariantInput(key);
                          const stockNum = Math.max(0, parseInt(input.stock, 10) || 0);
                          return (
                            <tr key={key} className={input.isActive ? '' : 'bg-gray-50'}>
                              <td className={`px-3 py-2 whitespace-nowrap ${input.isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                                {NAIL_SHAPE_NAME[shape] || shape} · {NAIL_LENGTH_NAME[length] || length}
                                {input.isActive && stockNum === 0 && (
                                  <span className="ml-2 text-xs font-medium text-orange-500">품절</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={input.stock}
                                  onChange={(e) => updateVariantInput(key, { stock: e.target.value.replace(/[^0-9]/g, '') })}
                                  disabled={!input.isActive}
                                  className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="1"
                                  value={input.priceModifier}
                                  onChange={(e) => updateVariantInput(key, { priceModifier: e.target.value.replace(/[^0-9-]/g, '') })}
                                  disabled={!input.isActive}
                                  className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={input.isActive}
                                  onChange={(e) => updateVariantInput(key, { isActive: e.target.checked })}
                                  className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300 rounded"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={bulkStock}
                        onChange={(e) => setBulkStock(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
                        placeholder="재고"
                      />
                      <button
                        type="button"
                        onClick={applyBulkStock}
                        disabled={bulkStock === ''}
                        className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        재고 일괄 적용
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="1"
                        value={bulkModifier}
                        onChange={(e) => setBulkModifier(e.target.value.replace(/[^0-9-]/g, ''))}
                        className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
                        placeholder="추가금"
                      />
                      <button
                        type="button"
                        onClick={applyBulkModifier}
                        disabled={bulkModifier === ''}
                        className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        추가금 일괄 적용
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">
                      총 재고 {variantSummary.totalStock}개
                      <span className="ml-1 font-normal text-gray-500">
                        (조합 {variantSummary.comboCount}개 중 판매 {variantSummary.activeCount}개)
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      대표 쉐입·길이는 첫 번째 판매 조합으로 자동 설정됩니다.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 네일 카테고리 - 서버 API 스펙에 맞게 재구성 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">네일 카테고리</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 스타일 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                스타일 <span className="text-xs text-gray-500">(최대 3개)</span>
              </label>
              <div className="space-y-2">
                {categoryOptions.style.map(style => (
                  <label key={style.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.nailCategories.style.includes(style.value)}
                      onChange={(e) => {
                        const styles = formData.nailCategories.style;
                        const newStyles = e.target.checked
                          ? [...styles, style.value].slice(0, 3) // 최대 3개
                          : styles.filter(s => s !== style.value);
                        setFormData({
                          ...formData,
                          nailCategories: {
                            ...formData.nailCategories,
                            style: newStyles
                          }
                        });
                      }}
                      disabled={!formData.nailCategories.style.includes(style.value) && formData.nailCategories.style.length >= 3}
                      className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{style.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 색상 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                색상 <span className="text-xs text-gray-500">(최대 3개)</span>
              </label>
              <div className="space-y-2">
                {categoryOptions.color.map(color => (
                  <label key={color.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.nailCategories.color.includes(color.value)}
                      onChange={(e) => {
                        const colors = formData.nailCategories.color;
                        const newColors = e.target.checked
                          ? [...colors, color.value].slice(0, 3) // 최대 3개
                          : colors.filter(c => c !== color.value);
                        setFormData({
                          ...formData,
                          nailCategories: {
                            ...formData.nailCategories,
                            color: newColors
                          }
                        });
                      }}
                      disabled={!formData.nailCategories.color.includes(color.value) && formData.nailCategories.color.length >= 3}
                      className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{color.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 텍스처 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                텍스처 <span className="text-xs text-gray-500">(최대 3개)</span>
              </label>
              <div className="space-y-2">
                {categoryOptions.texture.map(texture => (
                  <label key={texture.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.nailCategories.texture.includes(texture.value)}
                      onChange={(e) => {
                        const textures = formData.nailCategories.texture;
                        const newTextures = e.target.checked
                          ? [...textures, texture.value].slice(0, 3) // 최대 3개
                          : textures.filter(t => t !== texture.value);
                        setFormData({
                          ...formData,
                          nailCategories: {
                            ...formData.nailCategories,
                            texture: newTextures
                          }
                        });
                      }}
                      disabled={!formData.nailCategories.texture.includes(texture.value) && formData.nailCategories.texture.length >= 3}
                      className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{texture.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* TPO 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TPO (착용 상황) <span className="text-xs text-gray-500">(최대 3개)</span>
              </label>
              <div className="space-y-2">
                {categoryOptions.tpo.map(tpo => (
                  <label key={tpo.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.nailCategories.tpo.includes(tpo.value)}
                      onChange={(e) => {
                        const tpos = formData.nailCategories.tpo;
                        const newTpos = e.target.checked
                          ? [...tpos, tpo.value].slice(0, 3) // 최대 3개
                          : tpos.filter(t => t !== tpo.value);
                        setFormData({
                          ...formData,
                          nailCategories: {
                            ...formData.nailCategories,
                            tpo: newTpos
                          }
                        });
                      }}
                      disabled={!formData.nailCategories.tpo.includes(tpo.value) && formData.nailCategories.tpo.length >= 3}
                      className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{tpo.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 국가별 스타일 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                국가별 스타일 <span className="text-xs text-gray-500">(1개만 선택)</span>
              </label>
              <div className="flex space-x-4">
                {categoryOptions.nation.map(nation => (
                  <label key={nation.value} className="flex items-center">
                    <input
                      type="radio"
                      name="nation"
                      checked={formData.nailCategories.nation === nation.value}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            nailCategories: {
                              ...formData.nailCategories,
                              nation: nation.value
                            }
                          });
                        }
                      }}
                      className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{nation.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 대표 이미지 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">대표 이미지</h3>

          <div className="flex flex-col items-center">
            {formData.mainImageUrl ? (
              <div className="relative">
                <img
                  src={formData.mainImageUrl}
                  alt="대표 이미지"
                  className="w-48 h-48 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mainImage: null, mainImageUrl: '' })}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <label
                className={`w-48 h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  mainImageUploading ? 'border-[#E85A6B] bg-[#FFF1F2]' : 'border-gray-300 hover:border-[#E85A6B] hover:bg-[#FFF1F2]'
                }`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  disabled={mainImageUploading}
                  className="hidden"
                />
                {mainImageUploading ? (
                  <>
                    <div
                      className="w-12 h-12 border-4 border-[#E85A6B] border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-sm text-[#E85A6B]">업로드 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                    <span className="text-sm text-gray-500">대표 이미지 업로드</span>
                  </>
                )}
              </label>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-4 text-center">
            상품 목록에 표시될 대표 이미지입니다. (필수)
          </p>
        </div>

        {/* 상세 이미지 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">상세 이미지</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.detailImages.map((image, index) => (
              <div
                key={index}
                data-image-index={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={(e) => handleTouchMove(e)}
                onTouchEnd={(e) => handleTouchEnd(e)}
                className={`border rounded-lg p-4 transition-all duration-200 cursor-move select-none ${
                  draggedIndex === index
                    ? 'opacity-50 scale-95 rotate-2'
                    : dragOverIndex === index
                      ? 'border-[#E85A6B] bg-[#FFF1F2] scale-105'
                      : 'hover:border-gray-400 hover:shadow-md'
                }`}
              >
                {/* 순서 번호와 드래그 핸들 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 bg-[#E85A6B] text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-500">번째 이미지</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 업로드 실패 표시 */}
                    {failedImages.has(index) && (
                      <div className="flex items-center gap-1">
                        <div
                          className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">!
                        </div>
                        <span className="text-xs text-red-600">업로드 실패</span>
                      </div>
                    )}

                    {/* 재시도 버튼 */}
                    {failedImages.has(index) && (
                      <button
                        type="button"
                        onClick={() => retryImageUpload(index)}
                        disabled={detailImageUploading}
                        className="px-2 py-1 text-xs bg-[#E85A6B] text-white rounded hover:bg-[#E85A6B] disabled:opacity-50"
                      >
                        재시도
                      </button>
                    )}

                    {/* 드래그 핸들 */}
                    <div className="cursor-move text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16"/>
                      </svg>
                    </div>
                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={() => removeDetailImage(index)}
                      className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* 이미지 */}
                <div className="relative mb-3">
                  <img
                    src={image.url}
                    alt={`상세 이미지 ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  {/* 드래그 중일 때 오버레이 */}
                  {draggedIndex === index && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 rounded flex items-center justify-center">
                      <div className="text-white text-sm font-medium">드래그 중...</div>
                    </div>
                  )}
                </div>

                {/* 설명 입력 */}
                <textarea
                  placeholder="이미지 설명을 입력하세요"
                  value={image.description}
                  onChange={(e) => updateDetailImageDescription(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
                  rows={3}
                />
              </div>
            ))}

            {/* 이미지 추가 버튼 */}
            {formData.detailImages.length < 10 && (
              <div
                className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center transition-colors ${
                  detailImageUploading ? 'border-[#E85A6B] bg-[#FFF1F2]' : 'border-gray-300 hover:border-[#E85A6B] hover:bg-[#FFF1F2]'
                }`}>
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={addDetailImage}
                    disabled={detailImageUploading}
                    className="hidden"
                  />
                  {detailImageUploading ? (
                    <>
                      <div
                        className="w-8 h-8 border-2 border-[#E85A6B] border-t-transparent rounded-full animate-spin mb-2"></div>
                      <span className="text-sm text-[#E85A6B]">업로드 중...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-sm font-bold text-gray-500">{formData.detailImages.length + 1}</span>
                      </div>
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                      </svg>
                      <span className="text-sm text-gray-500 text-center">
                        {formData.detailImages.length + 1}번째<br/>상세 이미지 추가
                      </span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-[#FFF1F2] rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-[#E85A6B] mt-0.5">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="text-sm text-[#E85A6B]">
                <p className="font-medium mb-1">상세 이미지 관리 팁</p>
                <ul className="space-y-1 text-[#E85A6B]">
                  <li>• 드래그하여 이미지 순서를 변경할 수 있습니다</li>
                  <li>• 각 이미지에 설명을 추가하면 고객이 더 잘 이해할 수 있어요</li>
                  <li>• 최대 10장까지 업로드 가능합니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 상품 태그 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">상품 태그</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그 추가 <span className="text-xs text-gray-500">(최대 20개, 엔터 또는 쉽표로 구분)</span>
              </label>
              <input
                type="text"
                placeholder="태그를 입력하고 엔터를 누르세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const value = e.currentTarget.value.trim();
                    if (value && !formData.tags.includes(value) && formData.tags.length < 20) {
                      setFormData({
                        ...formData,
                        tags: [...formData.tags, value]
                      });
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
            </div>

            {/* 태그 목록 */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#FFF1F2] text-[#D14A5B]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = formData.tags.filter((_, i) => i !== index);
                        setFormData({ ...formData, tags: newTags });
                      }}
                      className="ml-2 text-[#E85A6B] hover:text-[#D14A5B]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500">
              상품의 특징, 색상, 스타일 등을 태그로 추가하면 검색에서 찾기 쉬워집니다.
            </p>
          </div>
        </div>

        {/* 상품 옵션 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">상품 옵션</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300 rounded"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900">추천 상품 설정</span>
                  <p className="text-xs text-gray-500">메인 페이지 추천 영역에 노출</p>
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.isNewProduct}
                  onChange={(e) => setFormData({ ...formData, isNewProduct: e.target.checked })}
                  className="h-4 w-4 text-[#E85A6B] focus:ring-[#E85A6B] border-gray-300 rounded"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900">신상품 설정</span>
                  <p className="text-xs text-gray-500">상품에 'NEW' 배지 표시</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => onGo('/seller/products')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('productForm.saving') : isEdit ? t('productForm.editComplete') : t('productForm.registerComplete')}
          </button>
        </div>
        </form>
      )}

      {/* 커스텀 주문서 선택 모달 */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">주문서 선택</h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin w-8 h-8 text-[#E85A6B]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : customOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>등록 가능한 주문서가 없습니다.</p>
                  <p className="text-sm mt-1">새로운 커스텀 주문이 들어오면 여기에 표시됩니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleSelectOrder(order.id)}
                      disabled={loadingOrders}
                      className="w-full p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{order.customerName}</div>
                          {order.requestedDesign && (
                            <div className="text-sm text-gray-600 mt-1 line-clamp-2">{order.requestedDesign}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(order.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {order.nailShape && (
                            <span className="text-xs bg-[#FFF1F2] text-[#E85A6B] px-2 py-0.5 rounded">
                              {order.nailShape}
                            </span>
                          )}
                          {order.nailLength && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {order.nailLength}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowOrderModal(false)}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}

// 주문 관리 페이지
export function SellerOrders({ onGo }: { onGo: (to: string) => void }) {
  return <OrderManagement onGo={onGo} />;
}

// 매출 분석 페이지
export function SellerAnalytics({ onGo }: { onGo: (to: string) => void }) {
  const [ period, setPeriod ] = useState<'6m' | '1y'>('6m');
  const [ analyticsData, setAnalyticsData ] = useState({
    revenue: {
      month: 0,
      today: 0,
      growth: null as number | null,
      chart: [] as { label: string; amount: number; orders: number }[]
    },
    orders: {
      total: 0,
      monthly: 0,
      avgOrderValue: 0
    },
    products: {
      total: 0,
      active: 0,
      lowStock: 0,
      averageRating: 0,
      totalReviews: 0
    }
  });
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);

  // 분석 데이터 로드 (대시보드와 동일한 sellerService 경로 사용)
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [ orderRes, productRes, revenueRes, settlementRes ] = await Promise.all([
          sellerService.getOrderAnalyticsOverview(),
          sellerService.getProductAnalyticsOverview(),
          sellerService.getRevenueAnalytics(period),
          sellerService.getSettlementSummary()
        ]);

        const orderStats = (orderRes as any)?.data;
        const productStats = (productRes as any)?.data;
        const revenueData = (revenueRes as any)?.data?.revenueData || [];
        const settlement = (settlementRes as any)?.data;

        const lastMonthSales = settlement?.lastMonthSales || 0;
        const currentMonthSales = settlement?.currentMonthSales ?? orderStats?.monthlyRevenue ?? 0;
        const growth = lastMonthSales > 0
          ? Math.round(((currentMonthSales - lastMonthSales) / lastMonthSales) * 1000) / 10
          : null;

        const monthlyOrders = orderStats?.monthlyOrders || 0;
        const monthlyRevenue = orderStats?.monthlyRevenue || 0;

        setAnalyticsData({
          revenue: {
            month: monthlyRevenue,
            today: orderStats?.todayRevenue || 0,
            growth,
            chart: revenueData.map((item: any) => ({
              label: `${String(item._id.year).slice(2)}.${String(item._id.month).padStart(2, '0')}`,
              amount: item.revenue,
              orders: item.orderCount
            }))
          },
          orders: {
            total: orderStats?.totalOrders || 0,
            monthly: monthlyOrders,
            avgOrderValue: monthlyOrders > 0 ? Math.round(monthlyRevenue / monthlyOrders) : 0
          },
          products: {
            total: productStats?.totalProducts ?? 0,
            active: productStats?.activeProducts ?? 0,
            lowStock: productStats?.lowStockProducts ?? 0,
            averageRating: productStats?.averageRating ?? 0,
            totalReviews: productStats?.totalReviews ?? 0
          }
        });
      } catch (error) {
        console.error('Failed to load analytics:', error);
        setError('분석 데이터를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [ period ]);

  if (isLoading) {
    return (
      <SellerLayout title="매출 분석" onGo={onGo}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#E85A6B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">분석 데이터를 불러오는 중...</p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  if (error) {
    return (
      <SellerLayout title="매출 분석" onGo={onGo}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout title="매출 분석" onGo={onGo}>
      <div className="space-y-6">
        {/* 기간 선택 */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">매출 현황</h2>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as '6m' | '1y')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-transparent"
          >
            <option value="6m">최근 6개월</option>
            <option value="1y">최근 1년</option>
          </select>
        </div>

        {/* 매출 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">이번 달 매출</p>
                <p className="text-3xl font-bold text-gray-900">{money(analyticsData.revenue.month)}</p>
                {analyticsData.revenue.growth !== null ? (
                  <p className={`text-sm mt-1 ${analyticsData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analyticsData.revenue.growth >= 0 ? '+' : ''}{analyticsData.revenue.growth}% vs 지난 달
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">전월 데이터 없음</p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">이번 달 주문</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.orders.monthly}건</p>
                <p className="text-sm text-gray-600 mt-1">누적 주문: {analyticsData.orders.total}건</p>
              </div>
              <div className="w-12 h-12 bg-[#FFF1F2] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#E85A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 주문 금액 (이번 달)</p>
                <p className="text-3xl font-bold text-gray-900">{money(analyticsData.orders.avgOrderValue)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 월별 매출 차트 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">월별 매출 추이</h3>
          {analyticsData.revenue.chart.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400">
              아직 매출 데이터가 없습니다
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-2">
              {analyticsData.revenue.chart.map((item, index) => {
                const maxAmount = Math.max(...analyticsData.revenue.chart.map(d => d.amount), 1);
                const height = (item.amount / maxAmount) * 100;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-[#E85A6B] rounded-t transition-all duration-300 hover:opacity-80"
                      style={{ height: `${Math.max(height, 1)}%` }}
                      title={`${item.label}: ${money(item.amount)} (주문 ${item.orders}건)`}
                    />
                    <div className="text-xs text-gray-500 mt-2">{item.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 상품 현황 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">상품 현황</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{analyticsData.products.total}</p>
              <p className="text-sm text-gray-600">전체 상품</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{analyticsData.products.active}</p>
              <p className="text-sm text-gray-600">판매 중</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{analyticsData.products.lowStock}</p>
              <p className="text-sm text-gray-600">재고 부족</p>
            </div>
            <div className="text-center p-4 bg-[#FFF1F2] rounded-lg">
              <p className="text-2xl font-bold text-[#E85A6B]">
                {analyticsData.products.averageRating ? analyticsData.products.averageRating.toFixed(1) : '-'}
              </p>
              <p className="text-sm text-gray-600">평균 평점 ({analyticsData.products.totalReviews}개 리뷰)</p>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}

// 정산 관리 페이지
export function SellerSettlement({ onGo }: { onGo: (to: string) => void }) {
  const [ settlementData, setSettlementData ] = useState({
    summary: {
      currentMonthSales: 0,
      lastMonthSales: 0,
      totalPaidAmount: 0,
      totalPendingAmount: 0
    },
    commissionPercentage: null as number | null,
    availableAmount: null as number | null,
    history: [] as any[],
    bankAccount: null as { bankName: string; accountNumber: string; accountHolder: string } | null
  });
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);

  // 정산 데이터 로드 (실제 정산 API 사용 — 가짜 폴백 없음)
  useEffect(() => {
    const loadSettlements = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [ summaryRes, listRes, infoRes, availableRes ] = await Promise.all([
          sellerService.getSettlementSummary(),
          sellerService.getSettlements({ page: 1, limit: 20 }),
          sellerService.getMySellerInfo().catch(() => null),
          sellerService.getAvailableSettlementAmount().catch(() => null)
        ]);

        const summary = (summaryRes as any)?.data || {};
        // 정산 목록 API는 { settlements, pagination }을 최상위로 반환한다
        const listData = (listRes as any)?.data ?? (listRes as any);
        const settlements = listData?.settlements || [];
        const info = (infoRes as any)?.data;
        const available = (availableRes as any)?.data;

        const rawCommission = available?.commissionPercentage ?? info?.commission;
        const commissionPercentage = typeof rawCommission === 'number'
          ? rawCommission
          : (typeof rawCommission?.rate === 'number' ? rawCommission.rate : null);

        setSettlementData({
          summary: {
            currentMonthSales: summary.currentMonthSales || 0,
            lastMonthSales: summary.lastMonthSales || 0,
            totalPaidAmount: summary.totalPaidAmount || 0,
            totalPendingAmount: summary.totalPendingAmount || 0
          },
          commissionPercentage,
          availableAmount: available?.availableAmount ?? null,
          history: settlements.map((s: any) => ({
            id: s._id || s.id,
            period: s.period?.startDate
              ? `${String(s.period.startDate).slice(0, 10)} ~ ${String(s.period.endDate).slice(0, 10)}`
              : '-',
            totalSales: s.summary?.totalSales ?? 0,
            commission: s.summary?.commission ?? 0,
            netAmount: s.summary?.netAmount ?? 0,
            status: s.status,
            paidDate: s.paidAt ? String(s.paidAt).slice(0, 10) : null
          })),
          bankAccount: info?.bankAccount || null
        });
      } catch (error) {
        console.error('Failed to load settlements:', error);
        setError('정산 데이터를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettlements();
  }, []);

  const growth = settlementData.summary.lastMonthSales > 0
    ? Math.round(((settlementData.summary.currentMonthSales - settlementData.summary.lastMonthSales)
        / settlementData.summary.lastMonthSales) * 1000) / 10
    : null;

  const maskAccountNumber = (accountNumber: string) => {
    const digits = accountNumber.replace(/[^0-9]/g, '');
    if (digits.length <= 5) return accountNumber;
    return `${digits.slice(0, 3)}${'*'.repeat(digits.length - 5)}${digits.slice(-2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">정산 대기</span>;
      case 'processing':
        return <span className="px-3 py-1 text-xs bg-[#FFF1F2] text-[#D14A5B] rounded-full font-medium">정산 중</span>;
      case 'completed':
        return <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">정산 완료</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SellerLayout title="정산 관리" onGo={onGo}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#E85A6B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">정산 데이터를 불러오는 중...</p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  if (error) {
    return (
      <SellerLayout title="정산 관리" onGo={onGo}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout title="정산 관리" onGo={onGo}>
      <div className="space-y-6">
        {/* 정산 요약 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">정산 요약</h3>
            {settlementData.commissionPercentage !== null && (
              <span className="text-sm text-gray-500">
                판매 수수료율: <span className="font-semibold text-gray-700">{settlementData.commissionPercentage}%</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-[#FFF1F2] rounded-lg">
              <p className="text-3xl font-bold text-[#E85A6B]">{money(settlementData.summary.currentMonthSales)}</p>
              <p className="text-sm text-gray-600">이번 달 매출 (배송완료 기준)</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{money(settlementData.summary.totalPaidAmount)}</p>
              <p className="text-sm text-gray-600">지급 완료 누계</p>
            </div>
            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{money(settlementData.summary.totalPendingAmount)}</p>
              <p className="text-sm text-gray-600">정산 대기 금액</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">
                {growth !== null ? `${growth >= 0 ? '+' : ''}${growth}%` : '-'}
              </p>
              <p className="text-sm text-gray-600">전월 대비 매출</p>
            </div>
          </div>

          {settlementData.availableAmount !== null && (
            <p className="mt-4 text-sm text-gray-600">
              현재 정산 가능 금액(미정산 배송완료 주문): <span className="font-semibold">{money(settlementData.availableAmount)}</span>
            </p>
          )}
        </div>

        {/* 정산 내역 */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">정산 내역</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">정산 ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 매출</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수수료</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">실 정산액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지급일</th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {settlementData.history.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                    아직 정산 내역이 없습니다
                  </td>
                </tr>
              )}
              {settlementData.history.map((settlement) => (
                <tr key={settlement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {settlement.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {settlement.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {money(settlement.totalSales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {money(settlement.commission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                    {money(settlement.netAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(settlement.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {settlement.paidDate || '-'}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 계좌 정보 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">정산 계좌 정보</h3>
          {settlementData.bankAccount ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">은행명</label>
                  <input
                    type="text"
                    value={settlementData.bankAccount.bankName}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">계좌번호</label>
                  <input
                    type="text"
                    value={maskAccountNumber(settlementData.bankAccount.accountNumber)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">예금주</label>
                  <input
                    type="text"
                    value={settlementData.bankAccount.accountHolder}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                계좌 정보 변경이 필요하면 고객센터로 문의해주세요.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">등록된 정산 계좌가 없습니다. 입점 정보에서 계좌를 등록해주세요.</p>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}

// 리뷰 관리 페이지
export function SellerReviews({ onGo }: { onGo: (to: string) => void }) {
  const [ filter, setFilter ] = useState<'all' | 'unread' | 'replied' | 'pending'>('all');
  const [ selectedRating, setSelectedRating ] = useState<number | null>(null);

  // 샘플 리뷰 데이터 (실제로는 API에서 가져옴)
  const reviews = [
    {
      id: "1",
      productUuid: "1",
      productName: "Glossy Almond Tip – Milk Beige",
      customerName: "김**",
      rating: 5,
      content: "색감이 정말 예쁘고 착용감도 좋아요! 접착력도 강해서 오래 지속됩니다. 재구매 의향 있어요.",
      date: "2025-08-18",
      isRead: false,
      hasReply: false,
      images: [ "https://picsum.photos/seed/review1/200/200", "https://picsum.photos/seed/review2/200/200" ]
    },
    {
      id: "2",
      productUuid: "2",
      productName: "Square Short – Cocoa",
      customerName: "이**",
      rating: 4,
      content: "디자인은 맘에 드는데 사이즈가 조금 작은 것 같아요. 그래도 만족스럽습니다.",
      date: "2025-08-17",
      isRead: true,
      hasReply: true,
      reply: "귀중한 피드백 감사합니다. 사이즈 가이드를 더욱 정확하게 개선하겠습니다.",
      replyDate: "2025-08-17"
    },
    {
      id: "3",
      productUuid: "1",
      productName: "Glossy Almond Tip – Milk Beige",
      customerName: "박**",
      rating: 3,
      content: "배송은 빨랐는데 한 개가 깨져서 왔어요. 교환 요청드립니다.",
      date: "2025-08-16",
      isRead: true,
      hasReply: false
    },
    {
      id: "4",
      productUuid: "4",
      productName: "Oval Short – Mauve",
      customerName: "최**",
      rating: 5,
      content: "완전 예뻐요! 친구들이 어디서 샀냐고 물어봅니다. 추천해요!",
      date: "2025-08-15",
      isRead: true,
      hasReply: true,
      reply: "좋은 리뷰 남겨주셔서 감사합니다! 앞으로도 좋은 제품으로 보답하겠습니다.",
      replyDate: "2025-08-15"
    }
  ];

  const filteredReviews = useMemo(() => {
    let filtered = reviews;

    // 필터 적용
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(r => !r.isRead);
        break;
      case 'replied':
        filtered = filtered.filter(r => r.hasReply);
        break;
      case 'pending':
        filtered = filtered.filter(r => !r.hasReply);
        break;
    }

    // 평점 필터
    if (selectedRating !== null) {
      filtered = filtered.filter(r => r.rating === selectedRating);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ filter, selectedRating ]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const unread = reviews.filter(r => !r.isRead).length;
    const replied = reviews.filter(r => r.hasReply).length;
    const pending = reviews.filter(r => !r.hasReply).length;
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / total;

    return { total, unread, replied, pending, avgRating };
  }, []);

  const markAsRead = (reviewId: string) => {
    // 실제로는 API 호출
    alert(`리뷰 ${reviewId} 읽음 처리`);
  };

  const writeReply = (reviewId: string) => {
    const content = prompt('답글을 입력하세요:');
    if (content) {
      // 실제로는 API 호출
      alert(`리뷰 ${reviewId}에 답글 작성: ${content}`);
    }
  };

  return (
    <SellerLayout title="리뷰 관리" onGo={onGo}>
      <div className="space-y-6">
        {/* 상단 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-sm text-gray-600">전체 리뷰</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-sm text-gray-600">읽지 않음</div>
            <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-sm text-gray-600">답글 완료</div>
            <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-sm text-gray-600">답글 대기</div>
            <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-sm text-gray-600">평균 평점</div>
            <div className="flex items-center gap-2 text-2xl font-bold text-yellow-600">
              <IoMdStar className="w-6 h-6 text-yellow-400" />
              {stats.avgRating.toFixed(1)}
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-[#FFF1F2] text-[#E85A6B] border border-[#E85A6B]/20'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                읽지 않음 ({stats.unread})
              </button>
              <button
                onClick={() => setFilter('replied')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'replied'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                답글 완료
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                답글 대기
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">평점:</span>
              <div className="flex gap-1">
                {[ 1, 2, 3, 4, 5 ].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                    className={`px-2 py-1 rounded text-sm flex items-center gap-1 ${
                      selectedRating === rating
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {rating}<IoMdStar className="w-3.5 h-3.5 text-yellow-400" />
                  </button>
                ))}
                {selectedRating && (
                  <button
                    onClick={() => setSelectedRating(null)}
                    className="px-2 py-1 rounded text-sm bg-gray-200 text-gray-600 hover:bg-gray-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 리뷰 목록 */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">
              리뷰 목록 ({filteredReviews.length})
            </h3>
          </div>

          <div className="divide-y">
            {filteredReviews.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                해당하는 리뷰가 없습니다.
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review.id} className={`p-6 ${!review.isRead ? 'bg-[#FFF1F2]' : ''}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      {/* 리뷰 헤더 */}
                      <div className="flex items-center gap-3 mb-3">
                        <Stars v={review.rating} />
                        <span className="text-sm font-medium text-gray-900">{review.customerName}</span>
                        <span className="text-sm text-gray-500">{review.date}</span>
                        {!review.isRead && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                            읽지 않음
                          </span>
                        )}
                        {review.hasReply && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            답글 완료
                          </span>
                        )}
                      </div>

                      {/* 상품 정보 */}
                      <div className="text-sm text-gray-600 mb-2">
                        <button
                          onClick={() => onGo(`/seller/products/${review.productUuid}/edit`)}
                          className="hover:text-[#E85A6B] hover:underline"
                        >
                          {review.productName}
                        </button>
                      </div>

                      {/* 리뷰 내용 */}
                      <div className="text-gray-800 mb-3">
                        {review.content}
                      </div>

                      {/* 리뷰 이미지 */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {review.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`리뷰 이미지 ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded border"
                            />
                          ))}
                        </div>
                      )}

                      {/* 답글 */}
                      {review.hasReply && review.reply && (
                        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#E85A6B]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-[#E85A6B]">판매자 답글</span>
                            <span className="text-xs text-gray-500">{review.replyDate}</span>
                          </div>
                          <div className="text-sm text-gray-700">{review.reply}</div>
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      {!review.isRead && (
                        <button
                          onClick={() => markAsRead(review.id)}
                          className="px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          읽음 처리
                        </button>
                      )}
                      {!review.hasReply && (
                        <button
                          onClick={() => writeReply(review.id)}
                          className="px-3 py-2 text-sm bg-[#FFF1F2] text-[#E85A6B] rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          답글 작성
                        </button>
                      )}
                      {review.hasReply && (
                        <button
                          onClick={() => writeReply(review.id)}
                          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          답글 수정
                        </button>
                      )}
                      <button
                        onClick={() => alert('신고 처리 기능은 추후 구현됩니다.')}
                        className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        신고 처리
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}

// 브랜드 관리 컴포넌트
export function BrandManagement({ onGo }: { onGo: (path: string) => void }) {
  const [brandInfo, setBrandInfo] = useState<{
    sellerUuid: string;
    brandName: string;
    brandProfile: string | null;
    brandBanner: string | null;
    acceptsCustomOrders: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 편집 상태
  const [isEditingName, setIsEditingName] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // 로고 업로드 상태
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 배너 업로드 상태
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // 커스텀 주문 설정 상태
  const [savingCustomOrder, setSavingCustomOrder] = useState(false);

  // 성공/에러 메시지
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 브랜드 정보 로드
  useEffect(() => {
    loadBrandInfo();
  }, []);

  const loadBrandInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // 현재 로그인한 판매자의 정보 조회 + 커스텀 주문 설정 조회
      const [sellerInfo, customOrderSetting] = await Promise.all([
        sellerService.getMySellerInfo(),
        sellerService.getCustomOrderSetting()
      ]);

      if (sellerInfo && sellerInfo.success && sellerInfo.data) {
        const seller = sellerInfo.data;

        // 브랜드 상세 정보 조회 (brandBanner 포함)
        let brandBanner: string | null = null;
        try {
          const brandDetail = await brandService.getBrandDetail(seller.userUuid);
          brandBanner = brandDetail.data?.brandBanner || null;
        } catch (err) {
          console.log('Brand detail fetch failed, using default banner');
        }

        setBrandInfo({
          sellerUuid: seller.userUuid,
          brandName: seller.brandName || '',
          brandProfile: seller.brandProfile || null,
          brandBanner,
          acceptsCustomOrders: customOrderSetting?.data?.acceptsCustomOrders ?? false
        });
        setNewBrandName(seller.brandName || '');
      } else {
        setError('판매자 정보를 찾을 수 없습니다.');
      }
    } catch (err: any) {
      console.error('브랜드 정보 로드 실패:', err);
      setError(err.message || '브랜드 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 브랜드명 수정
  const handleUpdateName = async () => {
    if (!brandInfo || !newBrandName.trim()) return;

    try {
      setSavingName(true);
      setError(null);

      await sellerService.updateSellerProfile({
        brandName: newBrandName.trim()
      });

      setBrandInfo(prev => prev ? { ...prev, brandName: newBrandName.trim() } : null);
      setIsEditingName(false);
      showSuccess('브랜드명이 변경되었습니다.');
    } catch (err: any) {
      console.error('브랜드명 변경 실패:', err);
      setError(err.message || '브랜드명 변경에 실패했습니다.');
    } finally {
      setSavingName(false);
    }
  };

  // 로고 파일 선택
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 업로드 실행
    handleLogoUpload(file);
  };

  // 로고 업로드
  const handleLogoUpload = async (file: File) => {
    if (!brandInfo) return;

    try {
      setUploadingLogo(true);
      setError(null);

      // 1. presigned URL 획득
      const presignedResponse = await imageService.getPresignedUrl({
        filename: file.name,
        contentType: file.type,
        uploadType: 'brand-profile'
      });

      // 2. S3에 직접 업로드
      await fetch(presignedResponse.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      // 3. 브랜드 프로필 업데이트
      await sellerService.updateSellerProfile({
        brandProfile: presignedResponse.imageUrl
      });

      // 상태 업데이트
      setBrandInfo(prev => prev ? { ...prev, brandProfile: presignedResponse.imageUrl } : null);
      setLogoPreview(null);
      showSuccess('로고 이미지가 변경되었습니다.');
    } catch (err: any) {
      console.error('로고 업로드 실패:', err);
      setError(err.message || '로고 업로드에 실패했습니다.');
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 배너 파일 선택
  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 업로드 실행
    handleBannerUpload(file);
  };

  // 배너 업로드
  const handleBannerUpload = async (file: File) => {
    if (!brandInfo) return;

    try {
      setUploadingBanner(true);
      setError(null);

      // 1. presigned URL 획득
      const presignedResponse = await imageService.getPresignedUrl({
        filename: file.name,
        contentType: file.type,
        uploadType: 'brand-banner'
      });

      // 2. S3에 직접 업로드
      const uploadHeaders: Record<string, string> = {
        'Content-Type': file.type,
        ...(presignedResponse.uploadHeaders || {})
      };
      const uploadResponse = await fetch(presignedResponse.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: uploadHeaders,
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.status}`);
      }

      // 3. 브랜드 배너 업데이트
      await brandService.updateBrandBanner(brandInfo.sellerUuid, {
        brandBanner: presignedResponse.imageUrl
      });

      // 4. 브랜드 정보 새로고침
      const updatedBrand = await brandService.getBrandDetail(brandInfo.sellerUuid);
      setBrandInfo(prev => prev ? { ...prev, brandBanner: updatedBrand.data?.brandBanner || null } : null);

      setBannerPreview(null);
      showSuccess('배너 이미지가 변경되었습니다!');
    } catch (err: any) {1
      console.error('배너 업로드 실패:', err);
      setError(err.message || '배너 업로드에 실패했습니다.');
      setBannerPreview(null);
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  // 성공 메시지 표시
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // 커스텀 주문 설정 토글
  const handleToggleCustomOrder = async () => {
    if (!brandInfo || savingCustomOrder) return;

    try {
      setSavingCustomOrder(true);
      setError(null);

      const newValue = !brandInfo.acceptsCustomOrders;
      const response = await sellerService.updateCustomOrderSetting({
        acceptsCustomOrders: newValue
      });

      // 서버 응답값으로 상태 업데이트
      const updatedValue = response?.data?.acceptsCustomOrders ?? newValue;
      setBrandInfo(prev => prev ? { ...prev, acceptsCustomOrders: updatedValue } : null);
      showSuccess(updatedValue ? '커스텀 주문을 받을 수 있게 설정되었습니다.' : '커스텀 주문이 비활성화되었습니다.');
    } catch (err: any) {
      console.error('커스텀 주문 설정 변경 실패:', err);
      setError(err.message || '커스텀 주문 설정 변경에 실패했습니다.');
    } finally {
      setSavingCustomOrder(false);
    }
  };

  // 편집 취소
  const cancelNameEdit = () => {
    setNewBrandName(brandInfo?.brandName || '');
    setIsEditingName(false);
  };

  if (loading) {
    return (
      <SellerLayout title="브랜드 관리" onGo={onGo}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#E85A6B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">브랜드 정보를 불러오는 중...</p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout title="브랜드 관리" onGo={onGo}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 성공 메시지 */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaExclamationTriangle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* 브랜드 정보 카드 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* 헤더 */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">브랜드 정보</h2>
            <p className="text-sm text-gray-500 mt-1">브랜드 상세페이지에 표시되는 정보입니다.</p>
          </div>

          {/* 로고 섹션 */}
          <div className="p-6 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">브랜드 로고</label>
            <div className="flex items-center gap-6">
              {/* 현재 로고 또는 기본 아이콘 */}
              <div className="relative">
                {(logoPreview || brandInfo?.brandProfile) ? (
                  <img
                    src={logoPreview || brandInfo?.brandProfile || ''}
                    alt="브랜드 로고"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                    <span className="text-3xl font-bold text-gray-400">
                      {brandInfo?.brandName?.charAt(0) || 'B'}
                    </span>
                  </div>
                )}

                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* 업로드 버튼 */}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                    uploadingLogo
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#E85A6B] text-white hover:bg-[#D14A5B]'
                  }`}
                >
                  {uploadingLogo ? '업로드 중...' : '이미지 변경'}
                </label>
                <p className="text-xs text-gray-500">JPG, PNG 형식 / 최대 5MB</p>
              </div>
            </div>
          </div>

          {/* 배너 섹션 */}
          <div className="p-6 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">브랜드 배너</label>
            <div className="space-y-4">
              {/* 현재 배너 또는 기본 이미지 */}
              <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                {(bannerPreview || brandInfo?.brandBanner) ? (
                  <img
                    src={bannerPreview || brandInfo?.brandBanner || ''}
                    alt="브랜드 배너"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500">배너 이미지가 없습니다</p>
                    </div>
                  </div>
                )}

                {uploadingBanner && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-white text-sm">업로드 중...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 업로드 버튼 및 안내 */}
              <div className="flex items-start gap-4">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleBannerFileSelect}
                  className="hidden"
                  id="banner-upload"
                />
                <label
                  htmlFor="banner-upload"
                  className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                    uploadingBanner
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#E85A6B] text-white hover:bg-[#D14A5B]'
                  }`}
                >
                  {uploadingBanner ? '업로드 중...' : '배너 변경'}
                </label>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">권장 사이즈:</span> 1920x600px
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WebP 형식 / 최대 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 브랜드명 섹션 */}
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">브랜드명</label>

            {isEditingName ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B] outline-none"
                  placeholder="브랜드명을 입력하세요"
                  maxLength={200}
                />
                <button
                  onClick={handleUpdateName}
                  disabled={savingName || !newBrandName.trim()}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    savingName || !newBrandName.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#E85A6B] text-white hover:bg-[#D14A5B]'
                  }`}
                >
                  {savingName ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={cancelNameEdit}
                  disabled={savingName}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">{brandInfo?.brandName || '(설정되지 않음)'}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="px-4 py-2 text-sm font-medium text-[#E85A6B] bg-[#FFF1F2] rounded-lg hover:bg-[#E85A6B]/10 transition-colors"
                >
                  수정
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 커스텀 주문 설정 카드 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">커스텀 주문 설정</h2>
            <p className="text-sm text-gray-500 mt-1">고객이 맞춤 주문서를 제출할 수 있도록 설정합니다.</p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">커스텀 주문 받기</label>
                <p className="text-sm text-gray-500 mt-1">
                  활성화하면 고객이 브랜드 페이지에서 맞춤 주문서를 제출할 수 있습니다.
                </p>
              </div>
              <button
                onClick={handleToggleCustomOrder}
                disabled={savingCustomOrder}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#E85A6B] focus:ring-offset-2 ${
                  savingCustomOrder ? 'opacity-50 cursor-not-allowed' : ''
                } ${brandInfo?.acceptsCustomOrders ? 'bg-[#E85A6B]' : 'bg-gray-200'}`}
                role="switch"
                aria-checked={brandInfo?.acceptsCustomOrders}
              >
                <span className="sr-only">커스텀 주문 받기</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    brandInfo?.acceptsCustomOrders ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {brandInfo?.acceptsCustomOrders && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-green-800">
                    <p className="font-medium">커스텀 주문이 활성화되었습니다</p>
                    <p className="mt-1 text-green-700">고객이 브랜드 페이지에서 맞춤 주문서를 제출할 수 있습니다.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 브랜드 페이지 미리보기 카드 */}
        {brandInfo && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">브랜드 페이지 미리보기</h3>
              <p className="text-sm text-gray-500 mt-1">고객에게 보여질 브랜드 페이지 모습입니다</p>
            </div>

            <div className="p-6">
              {/* 미니 프리뷰 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* 배너 미리보기 */}
                <div className="relative h-32 bg-gradient-to-r from-blue-100 to-purple-100">
                  {brandInfo.brandBanner ? (
                    <img
                      src={brandInfo.brandBanner}
                      alt="배너 미리보기"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-sm text-gray-400">배너 이미지가 없습니다</p>
                    </div>
                  )}
                </div>

                {/* 프로필 + 브랜드명 미리보기 */}
                <div className="px-6 py-4 bg-white">
                  <div className="flex items-center gap-4">
                    {/* 프로필 이미지 */}
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden border-2 border-white shadow-lg -mt-10 relative z-10">
                      {brandInfo.brandProfile ? (
                        <img
                          src={brandInfo.brandProfile}
                          alt="프로필 미리보기"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-gray-400">
                            {brandInfo.brandName?.charAt(0) || 'B'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 브랜드명 */}
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">
                        {brandInfo.brandName || '브랜드명 없음'}
                      </h4>
                      <p className="text-sm text-gray-500">브랜드 페이지</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 페이지 보기 버튼 */}
              {brandInfo.sellerUuid && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => onGo(`/brands/${brandInfo.sellerUuid}`)}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#E85A6B] rounded-lg hover:bg-[#D14A5B] transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    전체 페이지 보기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="bg-[#FFF1F2] border border-[#E85A6B]/20 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-[#E85A6B] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-[#D14A5B]">
              <p className="font-medium mb-1">브랜드 정보 안내</p>
              <ul className="list-disc list-inside space-y-1 text-[#E85A6B]">
                <li>브랜드 로고는 정사각형 이미지(512x512px)를 권장합니다.</li>
                <li>브랜드 배너는 가로형 이미지(1920x600px)를 권장합니다.</li>
                <li>브랜드명은 고객에게 노출되는 중요한 정보입니다.</li>
                <li>변경사항은 즉시 브랜드 페이지에 반영됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}

// 생산 관리 컴포넌트들 내보내기
export { ProductionSettings, ProductionStatus, CouponManagement };
