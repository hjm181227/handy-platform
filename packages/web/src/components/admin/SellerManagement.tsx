import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';

// 판매자 타입 정의 (서버 API 기반)
interface SellerUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  sellerInfo?: {
    companyName: string;
    businessNumber: string;
    contactPhone: string;
    address: string;
    status: 'pending' | 'verified' | 'rejected';
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
  };
}

interface SellerPagination {
  currentPage: number;
  totalPages: number;
  totalSellers: number;
}

const SellerManagement: React.FC = () => {
  const [sellers, setSellers] = useState<SellerUser[]>([]);
  const [loading, setLoading] = useState(false);

  // 인증 상태 표시 헬퍼 함수
  const getVerificationStatusDisplay = (status?: string) => {
    const statusMap = {
      'verified': { label: '인증됨', className: 'bg-blue-100 text-blue-800' },
      'pending': { label: '검토 중', className: 'bg-yellow-100 text-yellow-800' },
      'rejected': { label: '거부됨', className: 'bg-red-100 text-red-800' }
    };
    return statusMap[status as keyof typeof statusMap] || { label: '미인증', className: 'bg-gray-100 text-gray-800' };
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [verificationFilter, setVerificationFilter] = useState<string>('');
  const [pagination, setPagination] = useState<SellerPagination>({
    currentPage: 1,
    totalPages: 1,
    totalSellers: 0,
  });
  const [selectedSeller, setSelectedSeller] = useState<SellerUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSellers();
  }, [pagination.currentPage, searchQuery, statusFilter, verificationFilter]);

  const loadSellers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.currentPage,
        limit: 20,
        role: 'seller', // 판매자만 조회
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (statusFilter) {
        params.isActive = statusFilter === 'active';
      }
      if (verificationFilter) {
        params.isVerified = verificationFilter === 'verified';
      }

      // 임시로 AdminService의 getUsers를 사용 (실제로는 getSellers API가 필요)
      const response = await adminService.getUsers(params);
      
      // 판매자만 필터링 (서버에서 role=seller로 필터링되지 않는 경우)
      const sellerUsers = response.users.filter(user => user.role === 'seller');
      
      setSellers(sellerUsers as SellerUser[]);
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        totalSellers: sellerUsers.length,
      });
    } catch (error) {
      console.error('Failed to load sellers:', error);
      alert('판매자 목록 로딩에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSellerStatusChange = async (sellerId: string, newStatus: boolean) => {
    try {
      setActionLoading(true);
      // AdminService의 updateUserRole을 사용하여 상태 변경
      await adminService.updateUserRole(sellerId, { 
        role: 'seller',
        isActive: newStatus 
      } as any);
      
      await loadSellers(); // 목록 새로고침
      alert(`판매자가 ${newStatus ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('Failed to update seller status:', error);
      alert('판매자 상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = (seller: SellerUser) => {
    setSelectedSeller(seller);
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

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">판매자 관리</h1>
            <p className="text-gray-600 text-sm mt-1">판매자 계정 및 활동을 관리합니다</p>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span>총 {pagination.totalSellers}명</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>페이지 {pagination.currentPage}/{pagination.totalPages}</span>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="판매자명, 이메일, 회사명으로 검색..."
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
            <option value="">전체 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체 인증</option>
            <option value="verified">인증됨</option>
            <option value="pending">검토 중</option>
            <option value="rejected">거부됨</option>
          </select>
        </div>
      </div>

      {/* 판매자 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">판매자 목록을 불러오는 중...</p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">등록된 판매자가 없습니다.</p>
            <p className="text-gray-500 text-sm">판매자 신청이 승인되면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    판매자 정보
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    회사 정보
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    활동 통계
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
                {sellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {seller.name?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{seller.name}</div>
                          <div className="text-sm text-gray-500">{seller.email}</div>
                          <div className="text-xs text-gray-400">가입: {formatDate(seller.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {seller.sellerInfo?.companyName || '정보 없음'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {seller.sellerInfo?.businessNumber || '-'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {seller.sellerInfo?.contactPhone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div>상품: {seller.sellerInfo?.totalProducts || 0}개</div>
                        <div>주문: {seller.sellerInfo?.totalOrders || 0}건</div>
                        <div className="text-xs text-green-600 font-medium">
                          매출: {formatCurrency(seller.sellerInfo?.totalRevenue || 0)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          seller.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {seller.isActive ? '활성' : '비활성'}
                        </span>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVerificationStatusDisplay(seller.sellerInfo?.status).className}`}>
                            {getVerificationStatusDisplay(seller.sellerInfo?.status).label}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetail(seller)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          상세보기
                        </button>
                        <button
                          onClick={() => handleSellerStatusChange(seller.id, !seller.isActive)}
                          disabled={actionLoading}
                          className={`transition-colors ${
                            seller.isActive
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {seller.isActive ? '비활성화' : '활성화'}
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
                총 {pagination.totalSellers}명 중 {((pagination.currentPage - 1) * 20) + 1}-
                {Math.min(pagination.currentPage * 20, pagination.totalSellers)}명 표시
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

      {/* 판매자 상세 정보 모달 */}
      {showDetailModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">판매자 상세 정보</h3>
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
              {/* 기본 정보 */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">기본 정보</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">이름:</span>
                    <span className="ml-2 text-gray-900">{selectedSeller.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">이메일:</span>
                    <span className="ml-2 text-gray-900">{selectedSeller.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">가입일:</span>
                    <span className="ml-2 text-gray-900">{formatDate(selectedSeller.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">상태:</span>
                    <span className={`ml-2 ${selectedSeller.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedSeller.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 판매자 정보 */}
              {selectedSeller.sellerInfo && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">판매자 정보</h4>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">회사명:</span>
                      <span className="ml-2 text-gray-900">{selectedSeller.sellerInfo.companyName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">사업자등록번호:</span>
                      <span className="ml-2 text-gray-900">{selectedSeller.sellerInfo.businessNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">연락처:</span>
                      <span className="ml-2 text-gray-900">{selectedSeller.sellerInfo.contactPhone}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">주소:</span>
                      <span className="ml-2 text-gray-900">{selectedSeller.sellerInfo.address}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">인증 상태:</span>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVerificationStatusDisplay(selectedSeller.sellerInfo.status).className}`}>
                        {getVerificationStatusDisplay(selectedSeller.sellerInfo.status).label}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 활동 통계 */}
              {selectedSeller.sellerInfo && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">활동 통계</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedSeller.sellerInfo.totalProducts}</div>
                      <div className="text-sm text-blue-800">등록 상품</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedSeller.sellerInfo.totalOrders}</div>
                      <div className="text-sm text-green-800">총 주문</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(selectedSeller.sellerInfo.totalRevenue)}
                      </div>
                      <div className="text-sm text-purple-800">총 매출</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => handleSellerStatusChange(selectedSeller.id, !selectedSeller.isActive)}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedSeller.isActive
                    ? 'text-white bg-red-600 hover:bg-red-700'
                    : 'text-white bg-green-600 hover:bg-green-700'
                } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {actionLoading ? '처리 중...' : (selectedSeller.isActive ? '비활성화' : '활성화')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerManagement;