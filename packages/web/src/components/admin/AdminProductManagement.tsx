import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/apiService';
import type { AdminProductListItem } from '@handy-platform/shared';

interface ProductPagination {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
}

const PAGE_SIZE = 20;

const AdminProductManagement: React.FC = () => {
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ProductPagination>({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
  });
  const [selectedProduct, setSelectedProduct] = useState<AdminProductListItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 검색어 디바운스 (입력 중 과도한 API 호출 방지)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.getAllProducts({
        page,
        limit: PAGE_SIZE,
        search: searchQuery || undefined,
      });

      setProducts(response.products || []);
      setPagination({
        currentPage: response.pagination?.currentPage || 1,
        totalPages: Math.max(response.pagination?.totalPages || 1, 1),
        totalProducts: response.pagination?.totalProducts || 0,
      });
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('상품 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleFeaturedToggle = async (product: AdminProductListItem) => {
    const nextFeatured = !product.isFeatured;
    const confirmed = window.confirm(
      `'${product.name}' 상품을 추천 상품${nextFeatured ? '으로 지정' : '에서 해제'}하시겠습니까?`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await adminService.updateProductFeatured(product._id, nextFeatured);

      // 모달에 열려있는 상품이면 함께 갱신
      setSelectedProduct(prev =>
        prev && prev._id === product._id ? { ...prev, isFeatured: nextFeatured } : prev
      );

      alert(`상품이 추천 상품${nextFeatured ? '으로 지정' : '에서 해제'}되었습니다.`);
      await loadProducts();
    } catch (err) {
      console.error('Failed to update product featured status:', err);
      alert('추천 상품 설정 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = (product: AdminProductListItem) => {
    setSelectedProduct(product);
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
      day: '2-digit'
    });
  };

  // 상품 상태 배지 (서버 ProductStatus — 읽기 전용 표시)
  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: '판매중' },
      inactive: { bg: 'bg-red-100', text: 'text-red-800', label: '판매중지' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: '임시저장' },
      out_of_stock: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '품절' },
    };

    const config = statusConfig[status as keyof typeof statusConfig]
      || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || '알 수 없음' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getFeaturedBadge = (isFeatured?: boolean) => {
    if (!isFeatured) return null;
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        추천
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
            <p className="text-gray-600 text-sm mt-1">전체 상품을 조회하고 추천 상품을 관리합니다</p>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span>총 {pagination.totalProducts}개</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>페이지 {pagination.currentPage}/{pagination.totalPages}</span>
          </div>
        </div>

        {/* 검색 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="상품명, SKU로 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">상품 목록을 불러오는 중...</p>
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
              onClick={() => loadProducts()}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">
              {searchQuery ? '검색 조건에 맞는 상품이 없습니다.' : '등록된 상품이 없습니다.'}
            </p>
            {searchQuery && (
              <p className="text-gray-500 text-sm">다른 검색 조건을 시도해보세요.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상품 정보
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    판매자
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가격/재고
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    판매 실적
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
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.mainImageUrl ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.mainImageUrl}
                              alt={product.name}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                              없음
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">{product.brand || '-'}</div>
                          <div className="text-xs text-gray-400">{formatDate(product.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.sellerId || '-'}</div>
                      <div className="text-xs text-gray-500 max-w-[10rem] truncate">UUID: {product.sellerUuid || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(product.salePrice ?? product.price)}
                      </div>
                      <div className="text-sm text-gray-500">재고: {product.stockQuantity ?? 0}개</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>주문: {product.stats?.ordersCount ?? 0}건</div>
                      <div className="text-yellow-500">
                        ★ {product.rating?.average?.toFixed(1) ?? '0.0'} ({product.rating?.count ?? 0})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div>{getStatusBadge(product.status)}</div>
                        <div>{getFeaturedBadge(product.isFeatured)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetail(product)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          상세보기
                        </button>
                        <button
                          onClick={() => handleFeaturedToggle(product)}
                          disabled={actionLoading}
                          className={`transition-colors disabled:opacity-50 ${
                            product.isFeatured
                              ? 'text-gray-600 hover:text-gray-900'
                              : 'text-blue-600 hover:text-blue-900'
                          }`}
                        >
                          {product.isFeatured ? '추천 해제' : '추천 지정'}
                        </button>
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
                총 {pagination.totalProducts}개 중 {((pagination.currentPage - 1) * PAGE_SIZE) + 1}-
                {Math.min(pagination.currentPage * PAGE_SIZE, pagination.totalProducts)}개 표시
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

      {/* 상품 상세 정보 모달 */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">상품 상세 정보</h3>
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
              {/* 상품 기본 정보 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  {selectedProduct.mainImageUrl ? (
                    <img
                      src={selectedProduct.mainImageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-semibold text-gray-900">{selectedProduct.name}</h4>
                      {getFeaturedBadge(selectedProduct.isFeatured)}
                    </div>
                    <p className="text-gray-600 mt-2">{selectedProduct.description || '-'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">브랜드:</span>
                      <span className="ml-2 text-gray-900">{selectedProduct.brand || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">SKU:</span>
                      <span className="ml-2 text-gray-900">{selectedProduct.sku || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">가격:</span>
                      <span className="ml-2 text-gray-900 font-semibold">
                        {formatCurrency(selectedProduct.salePrice ?? selectedProduct.price)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">재고:</span>
                      <span className="ml-2 text-gray-900">{selectedProduct.stockQuantity ?? 0}개</span>
                    </div>
                    <div>
                      <span className="text-gray-500">상태:</span>
                      <span className="ml-2">{getStatusBadge(selectedProduct.status)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">등록일:</span>
                      <span className="ml-2 text-gray-900">{formatDate(selectedProduct.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 판매자 정보 */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">판매자 정보</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">판매자 ID:</span>
                    <span className="ml-2 text-gray-900">{selectedProduct.sellerId || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">판매자 UUID:</span>
                    <span className="ml-2 text-gray-900 break-all">{selectedProduct.sellerUuid || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 판매 통계 */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">판매 통계</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedProduct.stats?.ordersCount ?? 0}</div>
                    <div className="text-sm text-blue-800">주문 수</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {selectedProduct.rating?.average?.toFixed(1) ?? '0.0'}
                    </div>
                    <div className="text-sm text-yellow-800">평점</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedProduct.rating?.count ?? 0}</div>
                    <div className="text-sm text-green-800">리뷰 수</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedProduct.stats?.viewsCount ?? 0}</div>
                    <div className="text-sm text-purple-800">조회 수</div>
                  </div>
                </div>
              </div>

              {/* 태그 */}
              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">태그</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => handleFeaturedToggle(selectedProduct)}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-white ${
                  selectedProduct.isFeatured
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {actionLoading ? '처리 중...' : (selectedProduct.isFeatured ? '추천 해제' : '추천 지정')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductManagement;
