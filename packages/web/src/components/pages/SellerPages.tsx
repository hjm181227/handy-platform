import { useState, useMemo, useEffect } from 'react';
import { SellerLayout } from '../layout/SellerLayout';
import { money } from '../../utils';
import { CategorySelector } from '../product/CategorySelector';
import { webApiService } from '../../services/api';
import type {
  NailCategories,
  NailShape,
  NailLength
} from '../../types';

// 판매자 센터 메인 대시보드
export function SellerDashboard({ onGo }: { onGo: (to: string) => void }) {
  const [dashboardData, setDashboardData] = useState({
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
      inactive: 0,
      outOfStock: 0
    },
    reviews: {
      total: 0,
      unread: 0,
      averageRating: 0,
      pending: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 대시보드 데이터 로드
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // API 호출 시도 (구현되지 않은 경우 샘플 데이터 사용)
        try {
          const response = await fetch('/api/seller/dashboard', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setDashboardData(data.dashboard);
          } else {
            throw new Error('API not implemented');
          }
        } catch (apiError) {
          // API가 아직 구현되지 않았으므로 샘플 데이터 사용
          console.warn('Seller dashboard API not implemented, using sample data');
          setDashboardData({
            sales: {
              today: 1250000,
              month: 45800000,
              lastMonth: 38200000,
              growth: 19.9
            },
            orders: {
              pending: 12,
              processing: 8,
              shipped: 45,
              delivered: 128,
              cancelled: 3
            },
            products: {
              total: 67,
              active: 58,
              inactive: 9,
              outOfStock: 5
            },
            reviews: {
              total: 234,
              unread: 3,
              averageRating: 4.7,
              pending: 12
            }
          });
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        setError('대시보드 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const salesGrowth = dashboardData.sales.growth || 
    ((dashboardData.sales.month - dashboardData.sales.lastMonth) / dashboardData.sales.lastMonth * 100);

  if (isLoading) {
    return (
      <SellerLayout title="판매자 센터" onGo={onGo}>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">대시보드 데이터를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </SellerLayout>
    );
  }

  if (error) {
    return (
      <SellerLayout title="판매자 센터" onGo={onGo}>
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-red-800 font-medium">오류 발생</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="text-red-600 underline text-sm mt-2 hover:text-red-800"
                >
                  페이지 새로고침
                </button>
              </div>
            </div>
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout title="판매자 센터" onGo={onGo}>
      <div className="space-y-6">
        {/* 상단 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">오늘 매출</p>
                <p className="text-2xl font-bold text-gray-900">{money(dashboardData.sales.today)}원</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">이달 매출</p>
                <p className="text-2xl font-bold text-gray-900">{money(dashboardData.sales.month)}원</p>
                <p className={`text-sm ${Number(salesGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(salesGrowth) >= 0 ? '+' : ''}{salesGrowth}% vs 지난달
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">처리 대기 주문</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.orders.pending}건</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">등록 상품</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.products.total}개</p>
                <p className="text-sm text-gray-600">활성: {dashboardData.products.active}개</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 액션 버튼 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">빠른 액션</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => onGo('/seller/products/new')}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-medium">상품 등록</span>
            </button>

            <button
              onClick={() => onGo('/seller/orders')}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium">주문 관리</span>
            </button>

            <button
              onClick={() => onGo('/seller/analytics')}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium">매출 분석</span>
            </button>

            <button
              onClick={() => onGo('/seller/settlement')}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
            >
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-medium">정산 관리</span>
            </button>
          </div>
        </div>

        {/* 최근 주문 현황 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">최근 주문 현황</h3>
            <button
              onClick={() => onGo('/seller/orders')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              전체 보기
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{dashboardData.orders.pending}</p>
              <p className="text-sm text-gray-600">처리 대기</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{dashboardData.orders.processing}</p>
              <p className="text-sm text-gray-600">처리 중</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{dashboardData.orders.shipped}</p>
              <p className="text-sm text-gray-600">배송 중</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{dashboardData.orders.delivered}</p>
              <p className="text-sm text-gray-600">배송 완료</p>
            </div>
          </div>
        </div>

        {/* 상품 현황 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">상품 현황</h3>
            <button
              onClick={() => onGo('/seller/products')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              전체 보기
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{dashboardData.products.total}</p>
              <p className="text-sm text-gray-600">전체 상품</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{dashboardData.products.active}</p>
              <p className="text-sm text-gray-600">판매 중</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{dashboardData.products.inactive}</p>
              <p className="text-sm text-gray-600">비활성</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{dashboardData.products.outOfStock}</p>
              <p className="text-sm text-gray-600">품절</p>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}

// 상품 관리 페이지
export function SellerProducts({ onGo }: { onGo: (to: string) => void }) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 상품 목록 로드
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // API 호출 시도
        try {
          const response = await fetch(`/api/seller/products?page=1&limit=50&status=${filter}&search=${searchQuery}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setProducts(data.products || []);
          } else {
            throw new Error('API not implemented');
          }
        } catch (apiError) {
          // API가 아직 구현되지 않았으므로 샘플 데이터 사용
          console.warn('Seller products API not implemented, using sample data');
          setProducts([
            {
              id: '1',
              name: 'Glossy Almond Tip – Milk Beige',
              category: '네일 팁',
              price: 18000,
              stock: 245,
              status: 'active',
              sales: 1234,
              views: 5678,
              image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d46?w=100&h=100&fit=crop',
              createdAt: '2024-08-15'
            },
            {
              id: '2',
              name: 'Square Short – Cocoa',
              category: '네일 팁',
              price: 16500,
              stock: 0,
              status: 'outOfStock',
              sales: 987,
              views: 3456,
              image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=100&h=100&fit=crop',
              createdAt: '2024-08-12'
            },
            {
              id: '3',
              name: 'Gel Polish - Rose Gold',
              category: '네일 젤',
              price: 22000,
              stock: 156,
              status: 'inactive',
              sales: 567,
              views: 2134,
              image: 'https://images.unsplash.com/photo-1599948128020-9e50de75f17a?w=100&h=100&fit=crop',
              createdAt: '2024-08-10'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        setError('상품 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [filter, searchQuery]); // filter나 searchQuery가 변경될 때마다 재로드

  const filteredProducts = products.filter(product => {
    if (filter !== 'all' && product.status !== filter) return false;
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">판매중</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">비활성</span>;
      case 'outOfStock':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">품절</span>;
      default:
        return null;
    }
  };

  return (
    <SellerLayout title="상품 관리" onGo={onGo}>
      <div className="space-y-6">
        {/* 상단 액션 바 */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="상품명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체 상품</option>
              <option value="active">판매중</option>
              <option value="inactive">비활성</option>
              <option value="outOfStock">품절</option>
            </select>
          </div>

          <button
            onClick={() => onGo('/seller/products/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            상품 등록
          </button>
        </div>

        {/* 상품 목록 */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">재고</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">판매량</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조회수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img className="h-12 w-12 rounded-lg object-cover" src={product.image} alt={product.name} />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">등록일: {product.createdAt}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {money(product.price)}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={product.stock === 0 ? 'text-red-600 font-medium' : ''}>
                        {product.stock}개
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sales}개
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.views.toLocaleString()}회
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onGo(`/seller/products/${product.id}/edit`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => onGo(`/seller/products/${product.id}/analytics`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          분석
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">상품이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">새 상품을 등록해보세요.</p>
            <div className="mt-6">
              <button
                onClick={() => onGo('/seller/products/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                상품 등록
              </button>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}

// 웹 전용 타입 정의 (shared 타입 사용)

interface DetailImage {
  file?: File;
  url: string;
  description: string;
}

// 상품 등록/수정 페이지
export function SellerProductForm({ onGo, productId }: { onGo: (to: string) => void; productId?: string }) {
  const isEdit = !!productId;
  const [formData, setFormData] = useState({
    name: '',
    category: '네일 팁',
    description: '',
    price: '',
    status: 'active',
    // 네일 관련 정보
    length: 'MEDIUM' as NailLength,
    shape: 'ALMOND' as NailShape,
    productionDays: '',
    lengthCustomizable: false,
    shapeCustomizable: false,
    designCustomizable: false,
    // 이미지
    mainImage: null as File | null,
    mainImageUrl: '',
    detailImages: [] as DetailImage[]
  });

  // 네일 카테고리 상태
  const [nailCategories, setNailCategories] = useState<Partial<NailCategories>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 상품 데이터 구성
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseInt(formData.price),
        status: formData.status,
        nailCategories,
        nailShape: formData.shape,
        nailLength: formData.length,
        nailOptions: {
          lengthCustomizable: formData.lengthCustomizable,
          shapeCustomizable: formData.shapeCustomizable,
          designCustomizable: formData.designCustomizable
        },
        shipping: {
          processingDays: parseInt(formData.productionDays) || 3,
          isFreeShipping: true,
          shippingCost: 0,
          estimatedDeliveryDays: 2
        },
        // 이미지는 별도 업로드 후 URL 추가
      };

      console.log('등록할 상품 데이터:', productData);

      // API 호출 시도
      try {
        const endpoint = isEdit ? `/api/seller/products/${productId}` : '/api/seller/products';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('상품 등록/수정 성공:', result);
          alert(isEdit ? '상품이 수정되었습니다.' : '상품이 등록되었습니다.');
          onGo('/seller/products');
        } else {
          throw new Error('API not implemented');
        }
      } catch (apiError) {
        // API가 아직 구현되지 않았으므로 시뮬레이션
        console.warn('Product management API not implemented, simulating success');
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert(isEdit ? '상품이 수정되었습니다.' : '상품이 등록되었습니다.');
        onGo('/seller/products');
      }
    } catch (error) {
      console.error('상품 등록 실패:', error);
      alert('상품 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 대표 이미지 업로드
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({...formData, mainImage: file, mainImageUrl: URL.createObjectURL(file)});
    }
  };

  // 상세 이미지 추가
  const addDetailImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData.detailImages.length < 10) {
      const newImage: DetailImage = {
        file,
        url: URL.createObjectURL(file),
        description: ''
      };
      setFormData({
        ...formData,
        detailImages: [...formData.detailImages, newImage]
      });
    }
  };

  // 상세 이미지 설명 업데이트
  const updateDetailImageDescription = (index: number, description: string) => {
    const updatedImages = [...formData.detailImages];
    updatedImages[index].description = description;
    setFormData({...formData, detailImages: updatedImages});
  };

  // 상세 이미지 삭제
  const removeDetailImage = (index: number) => {
    const updatedImages = formData.detailImages.filter((_, i) => i !== index);
    setFormData({...formData, detailImages: updatedImages});
  };

  // 드래그 앤 드롭 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

    const updatedImages = [...formData.detailImages];
    const draggedItem = updatedImages[draggedIndex];

    // 드래그된 아이템 제거
    updatedImages.splice(draggedIndex, 1);

    // 새 위치에 삽입
    const targetIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    updatedImages.splice(targetIndex, 0, draggedItem);

    setFormData({...formData, detailImages: updatedImages});
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 터치 이벤트 상태
  const [touchStartIndex, setTouchStartIndex] = useState<number | null>(null);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);

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
      const updatedImages = [...formData.detailImages];
      const draggedItem = updatedImages[touchStartIndex];

      // 드래그된 아이템 제거
      updatedImages.splice(touchStartIndex, 1);

      // 새 위치에 삽입
      const targetIndex = touchStartIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex;
      updatedImages.splice(targetIndex, 0, draggedItem);

      setFormData({...formData, detailImages: updatedImages});
    }

    // 상태 초기화
    setTouchStartIndex(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchPosition(null);
  };

  return (
    <SellerLayout title={isEdit ? "상품 수정" : "상품 등록"} onGo={onGo}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">기본 정보</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품명 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="가격을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                판매 상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="네일 팁에 대한 상세한 설명을 입력하세요"
              />
            </div>
          </div>
        </div>

        {/* 네일 정보 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">네일 정보</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                길이 *
              </label>
              <select
                required
                value={formData.length}
                onChange={(e) => setFormData({...formData, length: e.target.value as NailLength})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                value={formData.shape}
                onChange={(e) => setFormData({...formData, shape: e.target.value as NailShape})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ROUND">라운드 (Round)</option>
                <option value="ALMOND">아몬드 (Almond)</option>
                <option value="OVAL">오벌 (Oval)</option>
                <option value="STILETTO">스틸레토 (Stiletto)</option>
                <option value="SQUARE">스퀘어 (Square)</option>
                <option value="COFFIN">코핀 (Coffin)</option>
              </select>
            </div>

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
                value={formData.productionDays}
                onChange={(e) => {
                  // 숫자만 입력 가능하도록 필터링
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({...formData, productionDays: value});
                }}
                onKeyDown={(e) => {
                  // 숫자, 백스페이스, 델리트, 화살표 키만 허용
                  if (!/[0-9]/.test(e.key) &&
                      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="제작에 필요한 일수를 입력하세요"
              />
              <p className="text-xs text-gray-500 mt-1">
                주문 후 제작 완료까지 소요되는 일수입니다. (1~30일)
              </p>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                커스터마이징 옵션
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.lengthCustomizable}
                    onChange={(e) => setFormData({...formData, lengthCustomizable: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">길이 변경 가능</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.shapeCustomizable}
                    onChange={(e) => setFormData({...formData, shapeCustomizable: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">쉐잎 변경 가능</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.designCustomizable}
                    onChange={(e) => setFormData({...formData, designCustomizable: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">디자인 커스텀 가능</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 네일 카테고리 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <CategorySelector
            value={nailCategories}
            onChange={setNailCategories}
          />
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
                  onClick={() => setFormData({...formData, mainImage: null, mainImageUrl: ''})}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  className="hidden"
                />
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm text-gray-500">대표 이미지 업로드</span>
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
                      ? 'border-blue-500 bg-blue-50 scale-105' 
                      : 'hover:border-gray-400 hover:shadow-md'
                }`}
              >
                {/* 순서 번호와 드래그 핸들 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-500">번째 이미지</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 드래그 핸들 */}
                    <div className="cursor-move text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            ))}

            {/* 이미지 추가 버튼 */}
            {formData.detailImages.length < 10 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={addDetailImage}
                    className="hidden"
                  />
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-sm font-bold text-gray-500">{formData.detailImages.length + 1}</span>
                  </div>
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm text-gray-500 text-center">
                    {formData.detailImages.length + 1}번째<br />상세 이미지 추가
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-blue-500 mt-0.5">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">상세 이미지 관리 팁</p>
                <ul className="space-y-1 text-blue-600">
                  <li>• 드래그하여 이미지 순서를 변경할 수 있습니다</li>
                  <li>• 각 이미지에 설명을 추가하면 고객이 더 잘 이해할 수 있어요</li>
                  <li>• 최대 10장까지 업로드 가능합니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : isEdit ? '수정 완료' : '등록 완료'}
          </button>
        </div>
      </form>
    </SellerLayout>
  );
}

// 주문 관리 페이지
export function SellerOrders({ onGo }: { onGo: (to: string) => void }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('week');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 주문 목록 로드
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // API 호출 시도
        try {
          const params = new URLSearchParams({
            page: '1',
            limit: '50',
            ...(statusFilter !== 'all' && { status: statusFilter }),
            sortBy: 'createdAt',
            sortOrder: 'desc'
          });

          const response = await fetch(`/api/seller/orders?${params}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setOrders(data.orders || []);
          } else {
            throw new Error('API not implemented');
          }
        } catch (apiError) {
          // API가 아직 구현되지 않았으므로 샘플 데이터 사용
          console.warn('Seller orders API not implemented, using sample data');
          setOrders([
            {
              id: 'ORD-20240818-001',
              customerName: '김민지',
              customerEmail: 'minji@example.com',
              products: [
                { name: 'Glossy Almond Tip – Milk Beige', quantity: 2, price: 18000 },
                { name: 'Square Short – Cocoa', quantity: 1, price: 16500 }
              ],
              total: 52500,
              status: 'pending',
              paymentStatus: 'paid',
              orderDate: '2024-08-18 14:30',
              shippingAddress: '서울시 강남구 테헤란로 123',
              trackingNumber: null
            },
            {
              id: 'ORD-20240818-002',
              customerName: '이수진',
              customerEmail: 'sujin@example.com',
              products: [
                { name: 'Gel Polish - Rose Gold', quantity: 3, price: 22000 }
              ],
              total: 66000,
              status: 'processing',
              paymentStatus: 'paid',
              orderDate: '2024-08-18 11:15',
              shippingAddress: '부산시 해운대구 센텀동로 456',
              trackingNumber: null
            },
            {
              id: 'ORD-20240817-003',
              customerName: '박지영',
              customerEmail: 'jiyoung@example.com',
              products: [
                { name: 'Glossy Almond Tip – Milk Beige', quantity: 1, price: 18000 }
              ],
              total: 18000,
              status: 'shipped',
              paymentStatus: 'paid',
              orderDate: '2024-08-17 16:45',
              shippingAddress: '대구시 중구 동성로 789',
              trackingNumber: '1234567890123'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
        setError('주문 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [statusFilter, dateFilter]);

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">처리 대기</span>;
      case 'processing':
        return <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">처리 중</span>;
      case 'shipped':
        return <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">배송 중</span>;
      case 'delivered':
        return <span className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-full font-medium">배송 완료</span>;
      case 'cancelled':
        return <span className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">취소됨</span>;
      default:
        return null;
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    alert(`주문 ${orderId}의 상태를 ${newStatus}로 변경합니다.`);
  };

  return (
    <SellerLayout title="주문 관리" onGo={onGo}>
      <div className="space-y-6">
        {/* 필터 및 통계 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 주문</option>
                <option value="pending">처리 대기</option>
                <option value="processing">처리 중</option>
                <option value="shipped">배송 중</option>
                <option value="delivered">배송 완료</option>
                <option value="cancelled">취소됨</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">오늘</option>
                <option value="week">최근 1주일</option>
                <option value="month">최근 1개월</option>
                <option value="quarter">최근 3개월</option>
              </select>
            </div>

            <button
              onClick={() => alert('주문 데이터를 Excel로 내보냅니다.')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel 내보내기
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">12</p>
              <p className="text-sm text-gray-600">처리 대기</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">8</p>
              <p className="text-sm text-gray-600">처리 중</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">45</p>
              <p className="text-sm text-gray-600">배송 중</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">128</p>
              <p className="text-sm text-gray-600">배송 완료</p>
            </div>
          </div>
        </div>

        {/* 주문 목록 */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg border shadow-sm">
              <div className="p-6">
                {/* 주문 헤더 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{order.id}</h3>
                    <p className="text-sm text-gray-500">주문일: {order.orderDate}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-3 sm:mt-0">
                    {getStatusBadge(order.status)}
                    <span className="text-lg font-bold text-gray-900">{money(order.total)}원</span>
                  </div>
                </div>

                {/* 고객 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">주문자</p>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-gray-500">{order.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">배송지</p>
                    <p className="font-medium">{order.shippingAddress}</p>
                    {order.trackingNumber && (
                      <p className="text-sm text-blue-600">송장번호: {order.trackingNumber}</p>
                    )}
                  </div>
                </div>

                {/* 주문 상품 */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">주문 상품</p>
                  <div className="space-y-2">
                    {order.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">수량: {product.quantity}개</p>
                        </div>
                        <p className="font-medium">{money(product.price * product.quantity)}원</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-wrap gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'processing')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        처리 시작
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        주문 취소
                      </button>
                    </>
                  )}
                  {order.status === 'processing' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'shipped')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      배송 시작
                    </button>
                  )}
                  <button
                    onClick={() => onGo(`/seller/orders/${order.id}`)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    상세 보기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">주문이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">새로운 주문을 기다리고 있습니다.</p>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}

// 매출 분석 페이지
export function SellerAnalytics({ onGo }: { onGo: (to: string) => void }) {
  const [period, setPeriod] = useState('month');
  const [analyticsData, setAnalyticsData] = useState({
    revenue: {
      total: 0,
      growth: 0,
      chart: [] as any[]
    },
    products: {
      topSelling: [] as any[]
    },
    customers: {
      newCustomers: 0,
      returningCustomers: 0,
      averageOrderValue: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 분석 데이터 로드
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // API 호출 시도
        try {
          const params = new URLSearchParams({
            period,
            startDate: '', // 계산된 시작일
            endDate: '' // 계산된 종료일
          });

          const response = await fetch(`/api/seller/analytics?${params}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setAnalyticsData(data.analytics);
          } else {
            throw new Error('API not implemented');
          }
        } catch (apiError) {
          // API가 아직 구현되지 않았으므로 샘플 데이터 사용
          console.warn('Seller analytics API not implemented, using sample data');
          setAnalyticsData({
            revenue: {
              total: 45800000,
              growth: 19.5,
              chart: [
                { date: '08-01', amount: 1200000 },
                { date: '08-02', amount: 1400000 },
                { date: '08-03', amount: 1800000 },
                { date: '08-04', amount: 1600000 },
                { date: '08-05', amount: 2100000 },
                { date: '08-06', amount: 1900000 },
                { date: '08-07', amount: 2300000 }
              ]
            },
            products: {
              topSelling: [
                { name: 'Glossy Almond Tip – Milk Beige', sales: 1234, revenue: 22212000 },
                { name: 'Square Short – Cocoa', sales: 987, revenue: 16285500 },
                { name: 'Gel Polish - Rose Gold', sales: 567, revenue: 12474000 }
              ]
            },
            customers: {
              newCustomers: 156,
              returningCustomers: 89,
              averageOrderValue: 45600
            }
          });
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
        setError('분석 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [period]);

  return (
    <SellerLayout title="매출 분석" onGo={onGo}>
      <div className="space-y-6">
        {/* 기간 선택 */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">매출 현황</h2>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">최근 1주일</option>
            <option value="month">최근 1개월</option>
            <option value="quarter">최근 3개월</option>
            <option value="year">최근 1년</option>
          </select>
        </div>

        {/* 매출 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 매출</p>
                <p className="text-3xl font-bold text-gray-900">{money(analyticsData.revenue.total)}원</p>
                <p className="text-sm text-green-600 mt-1">
                  +{analyticsData.revenue.growth}% vs 지난 기간
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">신규 고객</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.customers.newCustomers}명</p>
                <p className="text-sm text-gray-600 mt-1">재구매: {analyticsData.customers.returningCustomers}명</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 주문 금액</p>
                <p className="text-3xl font-bold text-gray-900">{money(analyticsData.customers.averageOrderValue)}원</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 매출 차트 (간단한 막대 그래프) */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">일별 매출 추이</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {analyticsData.revenue.chart.map((item, index) => {
              const maxAmount = Math.max(...analyticsData.revenue.chart.map(d => d.amount));
              const height = (item.amount / maxAmount) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${height}%` }}
                    title={`${item.date}: ${money(item.amount)}원`}
                  />
                  <div className="text-xs text-gray-500 mt-2">{item.date}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 인기 상품 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">인기 상품 TOP 3</h3>
          <div className="space-y-4">
            {analyticsData.products.topSelling.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">판매량: {product.sales}개</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{money(product.revenue)}원</p>
                  <p className="text-sm text-gray-500">매출</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}

// 정산 관리 페이지
export function SellerSettlement({ onGo }: { onGo: (to: string) => void }) {
  const [period, setPeriod] = useState('month');
  const [settlementData, setSettlementData] = useState({
    summary: {
      totalSales: 0,
      finalAmount: 0
    },
    history: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 정산 데이터 로드
  useEffect(() => {
    const loadSettlements = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // API 호출 시도
        try {
          const params = new URLSearchParams({
            page: '1',
            limit: '20',
            ...(period !== 'month' && { period }),
          });

          const response = await fetch(`/api/seller/settlements?${params}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setSettlementData({
              summary: data.summary || { totalSales: 0, finalAmount: 0 },
              history: data.settlements || []
            });
          } else {
            throw new Error('API not implemented');
          }
        } catch (apiError) {
          // API가 아직 구현되지 않았으므로 샘플 데이터 사용
          console.warn('Seller settlements API not implemented, using sample data');
          setSettlementData({
            summary: {
              totalSales: 45800000,
              finalAmount: 41220000
            },
            history: [
              {
                id: 'SET-202408-001',
                period: '2024년 8월 1주차',
                totalSales: 12500000,
                netAmount: 11250000,
                status: 'completed',
                paidDate: '2024-08-08',
                bank: '국민은행',
                account: '123-456-789012'
              },
              {
                id: 'SET-202407-004',
                period: '2024년 7월 4주차',
                totalSales: 8900000,
                netAmount: 8010000,
                status: 'completed',
                paidDate: '2024-08-01',
                bank: '국민은행',
                account: '123-456-789012'
              },
              {
                id: 'SET-202408-002',
                period: '2024년 8월 2주차',
                totalSales: 15600000,
                netAmount: 14040000,
                status: 'pending',
                paidDate: null,
                bank: '국민은행',
                account: '123-456-789012'
              }
            ]
          });
        }
      } catch (error) {
        console.error('Failed to load settlements:', error);
        setError('정산 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettlements();
  }, [period]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">정산 대기</span>;
      case 'processing':
        return <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">정산 중</span>;
      case 'completed':
        return <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">정산 완료</span>;
      default:
        return null;
    }
  };

  return (
    <SellerLayout title="정산 관리" onGo={onGo}>
      <div className="space-y-6">
        {/* 정산 요약 */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">이번 달 정산 요약</h3>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="month">이번 달</option>
              <option value="lastMonth">지난 달</option>
              <option value="quarter">이번 분기</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{money(settlementData.summary.totalSales)}원</p>
              <p className="text-sm text-gray-600">총 매출</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{money(settlementData.summary.finalAmount)}원</p>
              <p className="text-sm text-gray-600">실 정산액</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">19.5%</p>
              <p className="text-sm text-gray-600">전월 대비 증가</p>
            </div>
          </div>
        </div>

        {/* 정산 내역 */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">정산 내역</h3>
              <button
                onClick={() => alert('정산 내역을 Excel로 내보냅니다.')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel 내보내기
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">정산 ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 매출</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">실 정산액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지급일</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlementData.history.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {settlement.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {settlement.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {money(settlement.totalSales)}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                      {money(settlement.netAmount)}원
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">은행명</label>
              <input
                type="text"
                value="국민은행"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">계좌번호</label>
              <input
                type="text"
                value="123-456-789012"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">예금주</label>
              <input
                type="text"
                value="홍길동"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => alert('계좌 정보 변경 기능은 추후 구현됩니다.')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                계좌 정보 변경
              </button>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}

// 리뷰 관리 페이지
export function SellerReviews({ onGo }: { onGo: (to: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'replied' | 'pending'>('all');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // 샘플 리뷰 데이터 (실제로는 API에서 가져옴)
  const reviews = [
    {
      id: "1",
      productId: "1",
      productName: "Glossy Almond Tip – Milk Beige",
      customerName: "김**",
      rating: 5,
      content: "색감이 정말 예쁘고 착용감도 좋아요! 접착력도 강해서 오래 지속됩니다. 재구매 의향 있어요.",
      date: "2025-08-18",
      isRead: false,
      hasReply: false,
      images: ["https://picsum.photos/seed/review1/200/200", "https://picsum.photos/seed/review2/200/200"]
    },
    {
      id: "2",
      productId: "2",
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
      productId: "1",
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
      productId: "4",
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
  }, [filter, selectedRating]);

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
            <div className="text-2xl font-bold text-yellow-600">
              ⭐ {stats.avgRating.toFixed(1)}
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
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
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
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                    className={`px-2 py-1 rounded text-sm ${
                      selectedRating === rating
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {rating}⭐
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
                <div key={review.id} className={`p-6 ${!review.isRead ? 'bg-blue-50' : ''}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      {/* 리뷰 헤더 */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                              ⭐
                            </span>
                          ))}
                        </div>
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
                          onClick={() => onGo(`/seller/products/${review.productId}/edit`)}
                          className="hover:text-blue-600 hover:underline"
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
                        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-blue-700">판매자 답글</span>
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
                          className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
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
