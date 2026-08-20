import { useState, useEffect } from 'react';
import { webApiService } from '../../../services/apiService';
import { SellerLayout } from '../../layout/SellerLayout';
import { useAlert } from '../../common';
import type { ReturnRequest } from '@handy-platform/shared';

interface ReturnRequestManagementProps {
  onGo: (path: string) => void;
}

type StatusFilter = 'all' | 'requested' | 'approved' | 'completed' | 'rejected' | 'withdrawn';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'requested', label: '접수' },
  { key: 'approved', label: '승인' },
  { key: 'completed', label: '완료' },
  { key: 'rejected', label: '반려' },
  { key: 'withdrawn', label: '철회' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'requested': return { label: '접수', className: 'bg-yellow-100 text-yellow-700' };
    case 'approved': return { label: '승인', className: 'bg-blue-100 text-blue-700' };
    case 'rejected': return { label: '반려', className: 'bg-red-100 text-red-700' };
    case 'completed': return { label: '완료', className: 'bg-green-100 text-green-700' };
    case 'withdrawn': return { label: '철회', className: 'bg-surface-strong text-muted' };
    default: return { label: status, className: 'bg-surface-strong text-gray-700' };
  }
};

const getTypeBadge = (type: string) =>
  type === 'return'
    ? { label: '반품', className: 'bg-brand-50 text-brand' }
    : { label: '교환', className: 'bg-brand-100 text-brand-700' };

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function ReturnRequestManagement({ onGo }: ReturnRequestManagementProps) {
  const { alert, confirm } = useAlert();

  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('requested');
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 처리 중인 신청 UUID (버튼 중복 클릭 방지)
  const [processingUuid, setProcessingUuid] = useState<string | null>(null);

  // 반려 모달 상태
  const [rejectingRequest, setRejectingRequest] = useState<ReturnRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const loadRequests = async (page: number = 1, filter: StatusFilter = statusFilter) => {
    try {
      setLoading(true);
      setError('');
      const response = await webApiService.order.getSellerReturnRequests({
        status: filter === 'all' ? undefined : filter,
        page,
        limit: 10,
      });
      setRequests(response.data?.requests || []);
      setPagination(response.data?.pagination || null);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('반품·교환 목록 로드 실패:', err);
      setError(err.message || '반품·교환 신청 목록을 불러오지 못했습니다.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // 승인 — 반품이면 전액 환불이 즉시 진행됨
  const handleApprove = async (request: ReturnRequest) => {
    const message = request.type === 'return'
      ? `반품 신청을 승인하시겠습니까?\n\n주문번호: ${request.orderNumber}\n승인 시 전액 환불이 즉시 진행됩니다.`
      : `교환 신청을 승인하시겠습니까?\n\n주문번호: ${request.orderNumber}`;
    const confirmed = await confirm(message);
    if (!confirmed) return;

    try {
      setProcessingUuid(request.returnRequestUuid);
      const response = await webApiService.order.approveReturnRequest(request.returnRequestUuid);
      if (request.type === 'return' && (response.data as any)?.refunded) {
        await alert('반품이 승인되어 전액 환불이 완료되었습니다.', { variant: 'success' });
      } else {
        await alert('교환 신청이 승인되었습니다. 교환 상품 발송 후 완료 처리를 진행해주세요.', { variant: 'success' });
      }
      await loadRequests(currentPage);
    } catch (err: any) {
      console.error('반품·교환 승인 실패:', err);
      // 서버 오류 메시지(환불 실패 사유 등)를 그대로 표시
      await alert(err.message || '신청 승인에 실패했습니다.', { variant: 'danger' });
    } finally {
      setProcessingUuid(null);
    }
  };

  // 반려 모달 열기
  const openRejectModal = (request: ReturnRequest) => {
    setRejectingRequest(request);
    setRejectReason('');
  };

  // 반려 확정
  const handleReject = async () => {
    if (!rejectingRequest) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 5) {
      await alert('반려 사유를 5자 이상 입력해주세요.', { variant: 'danger' });
      return;
    }

    try {
      setRejecting(true);
      await webApiService.order.rejectReturnRequest(rejectingRequest.returnRequestUuid, trimmed);
      setRejectingRequest(null);
      setRejectReason('');
      await alert('신청이 반려되었습니다.', { variant: 'success' });
      await loadRequests(currentPage);
    } catch (err: any) {
      console.error('반품·교환 반려 실패:', err);
      await alert(err.message || '신청 반려에 실패했습니다.', { variant: 'danger' });
    } finally {
      setRejecting(false);
    }
  };

  // 교환 완료 처리
  const handleComplete = async (request: ReturnRequest) => {
    const confirmed = await confirm(
      `교환 완료 처리하시겠습니까?\n\n주문번호: ${request.orderNumber}\n교환 상품 발송이 끝난 뒤에 완료 처리해주세요.`
    );
    if (!confirmed) return;

    try {
      setProcessingUuid(request.returnRequestUuid);
      await webApiService.order.completeReturnRequest(request.returnRequestUuid);
      await alert('교환이 완료 처리되었습니다.', { variant: 'success' });
      await loadRequests(currentPage);
    } catch (err: any) {
      console.error('교환 완료 처리 실패:', err);
      await alert(err.message || '완료 처리에 실패했습니다.', { variant: 'danger' });
    } finally {
      setProcessingUuid(null);
    }
  };

  return (
    <SellerLayout title="반품·교환 관리" onGo={onGo}>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">반품·교환 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            고객의 반품·교환 신청을 확인하고 처리합니다. 반품 승인 시 전액 환불이 즉시 진행됩니다.
          </p>
        </div>

        {/* 상태 필터 탭 */}
        <div className="border-b border-line">
          <div className="flex gap-1 overflow-x-auto">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  statusFilter === tab.key
                    ? 'border-brand text-brand'
                    : 'border-transparent text-muted hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border p-8 text-center space-y-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => loadRequests(currentPage)}
              className="px-4 py-2 text-sm bg-brand text-white rounded-full hover:bg-brand-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl border py-16 text-center">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-base font-medium text-gray-600 mb-1">
              {statusFilter === 'requested' ? '접수된 신청이 없습니다' : '반품·교환 신청이 없습니다'}
            </h3>
            <p className="text-sm text-muted">고객이 반품·교환을 신청하면 이곳에 표시됩니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => {
              const statusBadge = getStatusBadge(request.status);
              const typeBadge = getTypeBadge(request.type);
              const isProcessing = processingUuid === request.returnRequestUuid;
              return (
                <div key={request.returnRequestUuid} className="bg-white rounded-xl border p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeBadge.className}`}>
                          {typeBadge.label}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                        <span className="text-xs text-muted">
                          신청일 {formatDate(request.requestedAt || request.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        주문번호: {request.orderNumber || request.orderUuid}
                      </div>
                      <div className="text-sm text-gray-700">사유: {request.reason}</div>
                      {request.detail && (
                        <div className="text-xs text-muted whitespace-pre-line">{request.detail}</div>
                      )}
                      {request.imageUrls && request.imageUrls.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {request.imageUrls.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt={`첨부 이미지 ${idx + 1}`}
                                className="w-14 h-14 object-cover rounded border"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      {request.status === 'rejected' && request.rejectReason && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                          <div className="text-xs font-medium text-red-700 mb-1">반려 사유</div>
                          <p className="text-sm text-red-600">{request.rejectReason}</p>
                        </div>
                      )}
                      {request.status === 'completed' && (
                        <div className="text-xs text-green-700">
                          {request.type === 'return'
                            ? `반품 승인·전액 환불 완료 (${formatDate(request.completedAt)})`
                            : `교환 완료 (${formatDate(request.completedAt)})`}
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                      {request.status === 'requested' && (
                        <>
                          <button
                            onClick={() => handleApprove(request)}
                            disabled={isProcessing}
                            className="px-4 py-2 text-sm bg-brand text-white rounded-full hover:bg-brand-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {isProcessing ? '처리 중...' : '승인'}
                          </button>
                          <button
                            onClick={() => openRejectModal(request)}
                            disabled={isProcessing}
                            className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            반려
                          </button>
                        </>
                      )}
                      {request.status === 'approved' && request.type === 'exchange' && (
                        <button
                          onClick={() => handleComplete(request)}
                          disabled={isProcessing}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {isProcessing ? '처리 중...' : '교환 완료'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        {!loading && !error && pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pb-4">
            <button
              onClick={() => loadRequests(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="text-sm text-gray-600">
              {currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => loadRequests(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 반려 사유 입력 모달 */}
      {rejectingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">신청 반려</h3>
            <p className="text-sm text-gray-600 mb-4">
              주문번호 {rejectingRequest.orderNumber}의 {rejectingRequest.type === 'return' ? '반품' : '교환'} 신청을 반려합니다.
              반려 사유는 고객에게 그대로 전달됩니다.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="반려 사유를 5자 이상 입력해주세요"
              className="w-full px-3 py-2.5 border border-line-strong rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent resize-none mb-1"
            />
            <p className="text-xs text-muted mb-4">{rejectReason.trim().length}자 / 최소 5자</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectingRequest(null);
                  setRejectReason('');
                }}
                disabled={rejecting}
                className="flex-1 py-2 px-4 border border-line text-ink rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting || rejectReason.trim().length < 5}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {rejecting ? '반려 중...' : '반려하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}
