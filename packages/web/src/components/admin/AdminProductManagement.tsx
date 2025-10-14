import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';

// 관리자 상품 관리용 타입 정의
interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  sellerUuid: string;
  sellerName: string;
  isActive: boolean;
  isApproved: boolean;
  stock: number;
  totalSold: number;
  rating: number;
  reviewCount: number;
  mainImage: string;
  createdAt: string;
  updatedAt: string;
  specifications?: Record<string, any>;
  tags?: string[];
}

interface ProductPagination {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
}

const AdminProductManagement: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [approvalFilter, setApprovalFilter] = useState<string>('');
  const [pagination, setPagination] = useState<ProductPagination>({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
  });
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 카테고리 옵션
  const categoryOptions = [
    { value: '', label: '전체 카테고리' },
    { value: 'nail-art', label: '네일아트' },
    { value: 'nail-care', label: '네일케어' },
    { value: 'nail-tools', label: '네일도구' },
    { value: 'nail-polish', label: '네일폴리시' },
    { value: 'nail-accessories', label: '네일액세서리' },
  ];

  useEffect(() => {
    loadProducts();
  }, [pagination.currentPage, searchQuery, categoryFilter, statusFilter, approvalFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // 임시 더미 데이터 (실제로는 AdminService에 getAllProducts API가 필요)
      const dummyProducts: AdminProduct[] = [
        {
          id: '1',
          name: '프렌치 네일아트 세트',
          description: '고급 프렌치 네일아트를 위한 완벽한 세트입니다.',
          price: 50000,
          category: 'nail-art',
          brand: '네일마스터',
          sellerUuid: 'seller1',
          sellerName: '네일아트 스튜디오',
          isActive: true,
          isApproved: true,
          stock: 25,
          totalSold: 145,
          rating: 4.8,
          reviewCount: 89,
          mainImage: 'https://picsum.photos/300/300?random=1',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-15T14:30:00Z',
          specifications: {
            material: '고급 아크릴',
            color: '다양한 색상',
            quantity: '12개 세트'
          },
          tags: ['프렌치', '네일아트', '세트', '인기']
        },
        {
          id: '2',
          name: '젤네일 스타터 키트',
          description: '젤네일 초보자를 위한 완벽한 시작 키트입니다.',
          price: 120000,
          category: 'nail-tools',
          brand: '젤네일프로',
          sellerUuid: 'seller2',
          sellerName: '뷰티 네일샵',
          isActive: true,
          isApproved: false,
          stock: 15,
          totalSold: 23,
          rating: 4.2,
          reviewCount: 12,
          mainImage: 'https://picsum.photos/300/300?random=2',
          createdAt: '2024-01-12T11:30:00Z',
          updatedAt: '2024-01-14T16:45:00Z',
          specifications: {
            includes: 'UV램프, 젤, 도구',
            power: '36W',
            warranty: '1년'
          },
          tags: ['젤네일', '초보자', '키트', '신제품']
        },
        {
          id: '3',
          name: '네일 데코 스티커 팩',
          description: '다양한 디자인의 네일 데코 스티커 모음입니다.',
          price: 15000,
          category: 'nail-accessories',
          brand: '네일데코',
          sellerUuid: 'seller1',
          sellerName: '네일아트 스튜디오',
          isActive: false,
          isApproved: true,
          stock: 0,
          totalSold: 267,
          rating: 4.5,
          reviewCount: 156,
          mainImage: 'https://picsum.photos/300/300?random=3',
          createdAt: '2023-12-15T14:20:00Z',
          updatedAt: '2024-01-10T10:15:00Z',
          specifications: {
            quantity: '50개',
            material: '방수 비닐',
            design: '20가지 디자인'
          },
          tags: ['스티커', '데코', '방수', '베스트셀러']
        }
      ];

      // 필터링 적용
      let filteredProducts = dummyProducts;
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.sellerName.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query)
        );
      }

      if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
      }

      if (statusFilter) {
        filteredProducts = filteredProducts.filter(product => 
          statusFilter === 'active' ? product.isActive : !product.isActive
        );
      }

      if (approvalFilter) {
        filteredProducts = filteredProducts.filter(product => 
          approvalFilter === 'approved' ? product.isApproved : !product.isApproved
        );
      }

      setProducts(filteredProducts);
      setPagination({
        currentPage: 1,
        totalPages: Math.ceil(filteredProducts.length / 20),
        totalProducts: filteredProducts.length,
      });

    } catch (error) {
      console.error('Failed to load products:', error);
      alert('상품 목록 로딩에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalChange = async (productId: string, isApproved: boolean) => {
    try {
      setActionLoading(true);
      // 실제로는 AdminService에 updateProductApproval API가 필요
      console.log('상품 승인 상태 변경:', productId, isApproved);
      
      // 로컬 상태 업데이트
      setProducts(prev => prev.map(product => 
        product.id === productId ? { ...product, isApproved, updatedAt: new Date().toISOString() } : product
      ));
      
      alert(`상품이 ${isApproved ? '승인' : '거부'}되었습니다.`);
    } catch (error) {
      console.error('Failed to update product approval:', error);
      alert('상품 승인 상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (productId: string, isActive: boolean) => {
    try {
      setActionLoading(true);
      // 실제로는 AdminService에 updateProductStatus API가 필요
      console.log('상품 활성 상태 변경:', productId, isActive);
      
      // 로컬 상태 업데이트
      setProducts(prev => prev.map(product => 
        product.id === productId ? { ...product, isActive, updatedAt: new Date().toISOString() } : product
      ));
      
      alert(`상품이 ${isActive ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('Failed to update product status:', error);
      alert('상품 상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = (product: AdminProduct) => {
    setSelectedProduct(product);
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
      day: '2-digit'
    });
  };

  const getStatusBadge = (isActive: boolean, isApproved: boolean) => {
    if (!isApproved) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">승인 대기</span>;
    }
    if (!isActive) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">비활성</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">활성</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
            <p className="text-gray-600 text-sm mt-1">전체 상품을 관리하고 승인/거부를 처리합니다</p>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span>총 {pagination.totalProducts}개</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>페이지 {pagination.currentPage}/{pagination.totalPages}</span>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="상품명, 판매자명, 브랜드로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체 승인</option>
            <option value="approved">승인됨</option>
            <option value="pending">승인 대기</option>
          </select>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">상품 목록을 불러오는 중...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">검색 조건에 맞는 상품이 없습니다.</p>
            <p className="text-gray-500 text-sm">다른 검색 조건을 시도해보세요.</p>
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
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img 
                            className="h-12 w-12 rounded-lg object-cover" 
                            src={product.mainImage} 
                            alt={product.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">{product.brand}</div>
                          <div className="text-xs text-gray-400">{formatDate(product.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.sellerName}</div>
                      <div className="text-xs text-gray-500">ID: {product.sellerUuid}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(product.price)}
                      </div>
                      <div className="text-sm text-gray-500">재고: {product.stock}개</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>판매: {product.totalSold}개</div>
                      <div className="text-yellow-500">
                        ★ {product.rating} ({product.reviewCount})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.isActive, product.isApproved)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetail(product)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          상세보기
                        </button>
                        {!product.isApproved && (
                          <button
                            onClick={() => handleApprovalChange(product.id, true)}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                          >
                            승인
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(product.id, !product.isActive)}
                          disabled={actionLoading}
                          className={`transition-colors disabled:opacity-50 ${
                            product.isActive
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {product.isActive ? '비활성화' : '활성화'}
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
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                총 {pagination.totalProducts}개 중 {((pagination.currentPage - 1) * 20) + 1}-
                {Math.min(pagination.currentPage * 20, pagination.totalProducts)}개 표시
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
                  <img 
                    src={selectedProduct.mainImage} 
                    alt={selectedProduct.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedProduct.name}</h4>
                    <p className="text-gray-600 mt-2">{selectedProduct.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">브랜드:</span>
                      <span className="ml-2 text-gray-900">{selectedProduct.brand}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">카테고리:</span>
                      <span className="ml-2 text-gray-900">{selectedProduct.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">가격:</span>
                      <span className="ml-2 text-gray-900 font-semibold">{formatCurrency(selectedProduct.price)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">재고:</span>
                      <span className="ml-2 text-gray-900">{selectedProduct.stock}개</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 판매자 정보 */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">판매자 정보</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">판매자명:</span>
                    <span className="ml-2 text-gray-900">{selectedProduct.sellerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">판매자 ID:</span>
                    <span className="ml-2 text-gray-900">{selectedProduct.sellerUuid}</span>
                  </div>
                </div>
              </div>

              {/* 판매 통계 */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">판매 통계</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedProduct.totalSold}</div>
                    <div className="text-sm text-blue-800">총 판매량</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{selectedProduct.rating}</div>
                    <div className="text-sm text-yellow-800">평점</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedProduct.reviewCount}</div>
                    <div className="text-sm text-green-800">리뷰 수</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {formatCurrency(selectedProduct.price * selectedProduct.totalSold)}
                    </div>
                    <div className="text-sm text-purple-800">총 매출</div>
                  </div>
                </div>
              </div>

              {/* 상품 사양 */}
              {selectedProduct.specifications && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">상품 사양</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-500">{key}:</span>
                          <span className="ml-2 text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
              <div className="flex space-x-3">
                {!selectedProduct.isApproved && (
                  <button
                    onClick={() => handleApprovalChange(selectedProduct.id, true)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? '처리 중...' : '승인'}
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange(selectedProduct.id, !selectedProduct.isActive)}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    selectedProduct.isActive
                      ? 'text-white bg-red-600 hover:bg-red-700'
                      : 'text-white bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {actionLoading ? '처리 중...' : (selectedProduct.isActive ? '비활성화' : '활성화')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductManagement;