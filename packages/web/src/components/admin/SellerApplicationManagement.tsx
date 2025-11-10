import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';
import {
  SellerApplication,
  SellerApplicationListResponse,
  SellerApplicationDetail
} from '@handy-platform/shared';

interface SellerApplicationManagementProps {
  // 프롭스 타입 정의
}

const SellerApplicationManagement: React.FC<SellerApplicationManagementProps> = () => {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'brandName'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 선택된 신청
  const [selectedApplication, setSelectedApplication] = useState<SellerApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 대량 작업
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 입력 모달 상태
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [modalData, setModalData] = useState<{sellerInfoId: string; isBulk?: boolean}>({sellerInfoId: ''});
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');

  useEffect(() => {
    loadApplications();
  }, [pagination.currentPage, statusFilter, searchQuery, sortBy, sortOrder]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null); // 에러 상태 초기화

      const params: any = {
        page: pagination.currentPage,
        limit: 20,
        status: 'pending'
      };

      if (statusFilter) params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      // 실제 서버 API 호출
      const response: SellerApplicationListResponse = await adminService.getSellerApplications(params);
      setApplications(response.items);
      setPagination(response.pagination);

    } catch (error) {
      console.error('Failed to load seller applications:', error);

      // 에러 상태 설정
      setError('판매자 신청 목록을 불러오는데 실패했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.');

      // 기존 데이터 유지 (사용자가 이전 데이터를 볼 수 있도록)
      // setApplications([]);
      // setPagination({
      //   currentPage: 1,
      //   totalPages: 1,
      //   totalItems: 0,
      //   hasNext: false,
      //   hasPrev: false,
      // });
    } finally {
      setLoading(false);
    }
  };

  // 재시도 함수
  const retryLoadApplications = () => {
    loadApplications();
  };

  const handleViewDetail = (sellerInfoId: string) => {
    // 목록에서 해당 항목 찾기
    const application = applications.find(app => app.sellerInfoId === sellerInfoId);
    if (application) {
      setSelectedApplication(application);
      setShowDetailModal(true);
    }
  };

  const handleApprove = async (sellerInfoId: string, verificationNote?: string) => {
    try {
      setActionLoading(true);

      // 실제 서버 API 호출
      await adminService.approveSellerApplication(sellerInfoId, verificationNote);

      // 성공 메시지 (추후 토스트로 교체)
      console.log('판매자 신청이 승인되었습니다.');

      // 목록 새로고침
      loadApplications();
      setShowDetailModal(false);
    } catch (error: any) {
      console.error('Failed to approve application:', error);
      // 에러 처리 (추후 토스트로 교체)
      console.error('신청 승인에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (sellerInfoId: string, rejectionReason: string, verificationNote?: string) => {
    try {
      setActionLoading(true);

      // 실제 서버 API 호출
      await adminService.rejectSellerApplication(sellerInfoId, rejectionReason, verificationNote);

      // 성공 메시지 (추후 토스트로 교체)
      console.log('판매자 신청이 거부되었습니다.');

      // 목록 새로고침
      loadApplications();
      setShowDetailModal(false);
    } catch (error: any) {
      console.error('Failed to reject application:', error);
      // 에러 처리 (추후 토스트로 교체)
      console.error('신청 거부에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject', note?: string) => {
    if (selectedIds.size === 0) {
      console.warn('선택된 신청이 없습니다.');
      return;
    }

    try {
      setActionLoading(true);

      // 실제 서버 API 호출
      const promises = Array.from(selectedIds).map(id => {
        if (action === 'approve') {
          return adminService.approveSellerApplication(id, note);
        } else {
          return adminService.rejectSellerApplication(id, note || '일괄 거부', note);
        }
      });
      await Promise.all(promises);

      // 성공 메시지 (추후 토스트로 교체)
      console.log(`${selectedIds.size}개의 신청이 ${action === 'approve' ? '승인' : '거부'}되었습니다.`);

      setSelectedIds(new Set());
      // 목록 새로고침
      loadApplications();
    } catch (error) {
      console.error(`Failed to ${action} applications:`, error);
      // 에러 처리 (추후 토스트로 교체)
      console.error(`일괄 ${action === 'approve' ? '승인' : '거부'}에 실패했습니다.`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels = {
      pending: '검토 중',
      accepted: '승인됨',
      verified: '승인됨',
      rejected: '거부됨',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map(app => app.sellerInfoId)));
    }
  };

  const handleSelectItem = (sellerInfoId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(sellerInfoId)) {
      newSelected.delete(sellerInfoId);
    } else {
      newSelected.add(sellerInfoId);
    }
    setSelectedIds(newSelected);
  };

  // 모달 관련 함수들
  const openApprovalModal = (sellerInfoId: string, isBulk = false) => {
    setModalData({ sellerInfoId, isBulk });
    setApprovalNote('');
    setShowApprovalModal(true);
  };

  const openRejectionModal = (sellerInfoId: string, isBulk = false) => {
    setModalData({ sellerInfoId, isBulk });
    setRejectionReason('');
    setRejectionNote('');
    setShowRejectionModal(true);
  };

  const closeModals = () => {
    setShowApprovalModal(false);
    setShowRejectionModal(false);
    setModalData({ sellerInfoId: '' });
    setApprovalNote('');
    setRejectionReason('');
    setRejectionNote('');
  };

  const handleApprovalSubmit = () => {
    if (modalData.isBulk) {
      handleBulkAction('approve', approvalNote);
    } else {
      handleApprove(modalData.sellerInfoId, approvalNote);
    }
    closeModals();
  };

  const handleRejectionSubmit = () => {
    if (!rejectionReason.trim()) {
      console.warn('거부 사유를 입력해주세요.');
      return;
    }

    if (modalData.isBulk) {
      handleBulkAction('reject', rejectionReason);
    } else {
      handleReject(modalData.sellerInfoId, rejectionReason, rejectionNote);
    }
    closeModals();
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">판매자 신청 관리</h1>
          <p className="text-gray-600 mt-2">판매자 신청을 검토하고 승인/거부할 수 있습니다</p>
        </div>

        <div className="flex items-center gap-3">
          {/* 통계 */}
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
            <div className="text-sm text-gray-600">총 신청</div>
            <div className="text-lg font-semibold text-gray-900">{pagination.totalItems}</div>
          </div>
        </div>
      </div>

      {/* 에러 배너 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">로딩 오류</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={retryLoadApplications}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? '재시도 중...' : '다시 시도'}
              </button>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 상태 필터 */}
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              상태
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="pending">검토 중</option>
              <option value="accepted">승인됨</option>
              <option value="verified">인증됨</option>
              <option value="rejected">거부됨</option>
            </select>
          </div>

          {/* 검색 */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              검색
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="브랜드명, 대표자명, 이메일"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 정렬 기준 */}
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              정렬 기준
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created">신청일</option>
              <option value="updated">업데이트일</option>
              <option value="brandName">브랜드명</option>
            </select>
          </div>

          {/* 정렬 순서 */}
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
              정렬 순서
            </label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </select>
          </div>
        </div>

        {/* 대량 작업 버튼 */}
        {selectedIds.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {selectedIds.size}개 선택됨
              </span>
              <button
                onClick={() => openApprovalModal('', true)}
                disabled={actionLoading}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                일괄 승인
              </button>
              <button
                onClick={() => openRejectionModal('', true)}
                disabled={actionLoading}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                일괄 거부
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 신청 목록 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <>
            {/* 테이블 헤더 */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700">
                <div className="col-span-1">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="col-span-3">브랜드명</div>
                <div className="col-span-2">대표자명</div>
                <div className="col-span-2">연락처</div>
                <div className="col-span-1">상태</div>
                <div className="col-span-2">신청일</div>
                <div className="col-span-1">작업</div>
              </div>
            </div>

            {/* 스켈레톤 목록 */}
            <div className="divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>

                    <div className="col-span-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>

                    <div className="col-span-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>

                    <div className="col-span-1">
                      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>

                    <div className="col-span-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            {/* 아이콘 */}
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>

            {/* 메시지 */}
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter === 'pending' ? '검토 중인 신청이 없습니다' :
               statusFilter === 'accepted' || statusFilter === 'verified' ? '승인된 신청이 없습니다' :
               statusFilter === 'rejected' ? '거부된 신청이 없습니다' :
               searchQuery ? '검색 결과가 없습니다' : '아직 신청이 없습니다'}
            </h3>
            <p className="text-gray-500 mb-6">
              {statusFilter || searchQuery ? '다른 조건으로 검색해보시거나 필터를 변경해보세요.' : '새로운 판매자 신청이 등록되면 이곳에 표시됩니다.'}
            </p>

            {/* 액션 버튼 */}
            {(statusFilter || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setSearchQuery('');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 테이블 헤더 */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === applications.length && applications.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 shadow-sm"
                  />
                </div>
                <div className="col-span-3">브랜드명</div>
                <div className="col-span-2">대표자명</div>
                <div className="col-span-2">연락처</div>
                <div className="col-span-1">상태</div>
                <div className="col-span-2">신청일</div>
                <div className="col-span-1">작업</div>
              </div>
            </div>

            {/* 테이블 바디 */}
            <div className="divide-y divide-gray-200">
              {applications.map((application) => (
                <div key={application.sellerInfoId} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(application.sellerInfoId)}
                        onChange={() => handleSelectItem(application.sellerInfoId)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm"
                      />
                    </div>

                    <div className="col-span-3">
                      <div className="font-medium text-gray-900">{application.brandName}</div>
                      <div className="text-sm text-gray-500">
                        사업자번호: {application.businessNumber}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="text-gray-900">{application.representativeName || '-'}</div>
                    </div>

                    <div className="col-span-2">
                      <div className="text-sm">
                        <div>{application.contactEmail}</div>
                        <div className="text-gray-500">{application.contactPhone}</div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      {getStatusBadge(application.status)}
                    </div>

                    <div className="col-span-2">
                      <div className="text-sm text-gray-900">
                        {new Date(application.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        서류 {application.documentsCount}개
                      </div>
                    </div>

                    <div className="col-span-1">
                      <button
                        onClick={() => handleViewDetail(application.sellerInfoId)}
                        disabled={actionLoading}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                      >
                        상세보기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-sm text-gray-700">
            총 {pagination.totalItems}개 중 {((pagination.currentPage - 1) * 20) + 1}-{Math.min(pagination.currentPage * 20, pagination.totalItems)}개 표시
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={!pagination.hasPrev || loading}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              이전
            </button>

            <span className="px-3 py-2 text-sm">
              {pagination.currentPage} / {pagination.totalPages}
            </span>

            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={!pagination.hasNext || loading}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  판매자 신청 상세 - {selectedApplication.brandName}
                </h2>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">브랜드명:</span>
                    <span className="ml-2">{selectedApplication.brandName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">대표자명:</span>
                    <span className="ml-2">{selectedApplication.representativeName || '-'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">사업자등록번호:</span>
                    <span className="ml-2">{selectedApplication.businessNumber}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">사업자 형태:</span>
                    <span className="ml-2">{selectedApplication.businessType || '-'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">업종:</span>
                    <span className="ml-2">{selectedApplication.businessCategory || '-'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">상태:</span>
                    <span className="ml-2">{getStatusBadge(selectedApplication.status)}</span>
                  </div>
                </div>
              </div>

              {/* 연락처 정보 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">연락처 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">이메일:</span>
                    <span className="ml-2">{selectedApplication.contactEmail}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">전화번호:</span>
                    <span className="ml-2">{selectedApplication.contactPhone}</span>
                  </div>
                </div>
              </div>

              {/* 서류 제출 현황 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">서류 제출 현황</h3>
                <div className="text-sm">
                  <div>
                    <span className="font-medium text-gray-700">서류 제출 여부:</span>
                    <span className="ml-2">
                      {selectedApplication.hasVerificationDocuments ? (
                        <span className="text-green-600">제출 완료 ({selectedApplication.documentsCount}건)</span>
                      ) : (
                        <span className="text-red-600">미제출</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 거부 사유 (거부된 경우) */}
              {selectedApplication.status === 'rejected' && selectedApplication.rejectionReason && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">거부 사유</h3>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{selectedApplication.rejectionReason}</p>
                    {selectedApplication.verificationNote && (
                      <p className="text-red-600 text-sm mt-2">
                        추가 메모: {selectedApplication.verificationNote}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 작업 버튼 */}
              {selectedApplication.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => openApprovalModal(selectedApplication.sellerInfoId)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? '처리 중...' : '승인'}
                  </button>
                  <button
                    onClick={() => openRejectionModal(selectedApplication.sellerInfoId)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? '처리 중...' : '거부'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 승인 모달 */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalData.isBulk ? `${selectedIds.size}개 신청 승인` : '신청 승인'}
              </h3>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="approvalNote" className="block text-sm font-medium text-gray-700 mb-2">
                  승인 메모 (선택사항)
                </label>
                <textarea
                  id="approvalNote"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="승인 관련 메모를 입력하세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleApprovalSubmit}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? '처리 중...' : '승인'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 거부 모달 */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalData.isBulk ? `${selectedIds.size}개 신청 거부` : '신청 거부'}
              </h3>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                  거부 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="거부 사유를 입력하세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label htmlFor="rejectionNote" className="block text-sm font-medium text-gray-700 mb-2">
                  추가 메모 (선택사항)
                </label>
                <textarea
                  id="rejectionNote"
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="추가 메모를 입력하세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleRejectionSubmit}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? '처리 중...' : '거부'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerApplicationManagement;
