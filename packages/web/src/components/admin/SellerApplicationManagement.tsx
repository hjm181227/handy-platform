import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/apiService';
import {
  SellerApplication,
  SellerApplicationDetail,
} from '@handy-platform/shared';

type ApplicationStatus = '' | 'draft' | 'pending' | 'approved' | 'rejected';

const statusStyle: Record<string, string> = {
  draft: 'bg-surface text-gray-700',
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusLabel: Record<string, string> = {
  draft: '작성 중',
  pending: '심사 대기',
  approved: '승인 완료',
  rejected: '보완 요청',
};

const fieldLabel: Record<string, string> = {
  brandName: '브랜드명',
  representativeName: '대표자명',
  businessNumber: '사업자등록번호',
  businessType: '업태',
  businessCategory: '업종·종목',
  contactEmail: '담당자 이메일',
  contactPhone: '담당자 연락처',
  businessAddress: '사업장 주소',
  bankAccount: '정산 계좌',
  verificationDocuments: '사업자등록증',
};

const emptyPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  hasNext: false,
  hasPrev: false,
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[status] || statusStyle.draft}`}>
      {statusLabel[status] || status}
    </span>
  );
}

function Info({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm text-gray-900">{value || '-'}</dd>
    </div>
  );
}

const SellerApplicationManagement: React.FC = () => {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<SellerApplicationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [commission, setCommission] = useState(10);
  const [verificationNote, setVerificationNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const loadApplications = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getSellerApplications({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        sortBy: 'created',
        sortOrder: 'desc',
      });
      setApplications(response.items || []);
      setPagination(response.pagination || emptyPagination);
    } catch (requestError: any) {
      console.error('Failed to load seller applications:', requestError);
      setError(requestError?.message || '입점 신청 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => loadApplications(1), 250);
    return () => window.clearTimeout(timer);
  }, [statusFilter, search]);

  const openDetail = async (sellerInfoId: string) => {
    try {
      setDetailLoading(true);
      setError('');
      const response = await adminService.getSellerApplicationDetail(sellerInfoId);
      setSelected(response.data);
      setCommission(response.data.commission ?? 10);
      setVerificationNote('');
      setRejectionReason('');
    } catch (requestError: any) {
      setError(requestError?.message || '신청 상세 정보를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setAction(null);
    setVerificationNote('');
    setRejectionReason('');
  };

  const openVerificationDocument = async (documentUrl: string) => {
    const popup = window.open('', '_blank');
    if (popup) popup.opener = null;
    try {
      const accessUrl = await adminService.getSellerDocumentAccessUrl(documentUrl);
      if (popup) popup.location.href = accessUrl;
      else window.open(accessUrl, '_blank', 'noopener,noreferrer');
    } catch (requestError: any) {
      popup?.close();
      setError(requestError?.message || '증빙서류 열람 링크를 만들지 못했습니다.');
    }
  };

  const submitApproval = async () => {
    if (!selected || commission < 0 || commission > 50) return;
    try {
      setActionLoading(true);
      await adminService.approveSellerApplication(selected.sellerInfoId, {
        commission,
        verificationNote: verificationNote.trim() || undefined,
      });
      closeDetail();
      await loadApplications(1);
    } catch (requestError: any) {
      setError(requestError?.message || '승인 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const submitRejection = async () => {
    if (!selected) return;
    if (rejectionReason.trim().length < 10) {
      setError('보완 요청 사유를 10자 이상 입력해 주세요.');
      return;
    }
    try {
      setActionLoading(true);
      await adminService.rejectSellerApplication(
        selected.sellerInfoId,
        rejectionReason.trim(),
        verificationNote.trim() || undefined,
      );
      closeDetail();
      await loadApplications(1);
    } catch (requestError: any) {
      setError(requestError?.message || '보완 요청 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const salesExample = 100000;
  const feeExample = Math.round(salesExample * commission / 100);

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand">PARTNER OPERATIONS</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-950">입점 신청 심사</h1>
          <p className="mt-2 text-sm text-gray-600">브랜드 정보와 증빙서류를 확인하고 수수료 조건을 확정합니다.</p>
        </div>
        <div className="rounded-2xl border border-line bg-white px-5 py-3 shadow-sm">
          <p className="text-xs text-muted">현재 조건의 신청</p>
          <p className="mt-1 text-2xl font-bold text-gray-950">{pagination.totalItems}건</p>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-gray-950 p-5 text-white lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted">현재 기본 판매 수수료</p>
              <p className="mt-1 text-3xl font-bold">10%</p>
            </div>
            <div className="max-w-md text-sm leading-6 text-gray-300">
              승인 시 브랜드별로 0~50% 범위에서 조정할 수 있습니다. 계약서와 관리자 입력값이 일치하는지 확인한 뒤 승인하세요.
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">승인 전 확인</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-800">
            <li>• 사업자번호와 등록증 일치</li>
            <li>• 대표자와 예금주 관계 확인</li>
            <li>• 계약 수수료 입력 확인</li>
          </ul>
        </div>
      </section>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-semibold">닫기</button>
        </div>
      )}

      <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus)}
            className="rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            <option value="pending">심사 대기</option>
            <option value="approved">승인 완료</option>
            <option value="rejected">보완 요청</option>
            <option value="draft">작성 중</option>
            <option value="">제출된 신청 전체</option>
          </select>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="브랜드명, 대표자명 또는 이메일 검색"
            className="rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
          <button onClick={() => loadApplications(1)} disabled={loading} className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
            새로고침
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_100px_120px] gap-4 border-b bg-surface px-6 py-3 text-xs font-semibold text-muted md:grid">
          <span>브랜드</span><span>담당자</span><span>신청 완성도</span><span>상태</span><span>접수일</span>
        </div>
        {loading ? (
          <div className="space-y-3 p-6">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-surface" />)}</div>
        ) : applications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-semibold text-gray-900">해당하는 신청이 없습니다</p>
            <p className="mt-1 text-sm text-muted">검색어나 상태 조건을 변경해 보세요.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {applications.map((application) => (
              <button
                key={application.sellerInfoId}
                onClick={() => openDetail(application.sellerInfoId)}
                className="grid w-full gap-3 px-6 py-5 text-left transition hover:bg-brand-50 md:grid-cols-[1.4fr_1fr_1fr_100px_120px] md:items-center md:gap-4"
              >
                <div>
                  <p className="font-semibold text-gray-950">{application.brandName}</p>
                  <p className="mt-1 text-xs text-muted">{application.businessNumber || '사업자번호 미입력'}</p>
                </div>
                <div className="text-sm text-gray-700">
                  <p>{application.representativeName || '-'}</p>
                  <p className="mt-1 truncate text-xs text-muted">{application.contactEmail}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{application.applicationProgress ?? 0}%</span>
                    <span>서류 {application.documentsCount || 0}개</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${application.applicationProgress ?? 0}%` }} />
                  </div>
                </div>
                <div><StatusBadge status={application.status} /></div>
                <div className="text-xs text-muted">
                  {new Date(application.submittedAt || application.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {pagination.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3">
          <button disabled={!pagination.hasPrev || loading} onClick={() => loadApplications(pagination.currentPage - 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">이전</button>
          <span className="text-sm text-gray-600">{pagination.currentPage} / {pagination.totalPages}</span>
          <button disabled={!pagination.hasNext || loading} onClick={() => loadApplications(pagination.currentPage + 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">다음</button>
        </nav>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"><div className="rounded-2xl bg-white px-7 py-5 text-sm shadow-xl">신청 상세 정보를 불러오는 중입니다…</div></div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && closeDetail()}>
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b bg-white px-6 py-5 md:px-8">
              <div>
                <div className="flex items-center gap-3"><h2 className="text-2xl font-bold text-gray-950">{selected.brandName}</h2><StatusBadge status={selected.status} /></div>
                <p className="mt-1 text-sm text-muted">신청번호 {selected.sellerInfoId}</p>
              </div>
              <button onClick={closeDetail} className="rounded-full p-2 text-2xl text-muted hover:bg-surface-strong">×</button>
            </header>

            <div className="space-y-7 p-6 md:p-8">
              <section>
                <div className="flex items-center justify-between"><h3 className="font-bold text-gray-950">신청 완성도</h3><span className="text-sm font-semibold text-brand-600">{selected.applicationProgress ?? 0}%</span></div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface"><div className="h-full bg-brand" style={{ width: `${selected.applicationProgress ?? 0}%` }} /></div>
                {!!selected.missingFields?.length && (
                  <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">누락 항목: {selected.missingFields.map((field) => fieldLabel[field] || field).join(', ')}</div>
                )}
              </section>

              <section className="rounded-2xl border border-line p-5">
                <h3 className="font-bold text-gray-950">사업자 및 담당자 정보</h3>
                <dl className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Info label="대표자명" value={selected.representativeName} />
                  <Info label="사업자등록번호" value={selected.businessNumber} />
                  <Info label="업태" value={selected.businessType} />
                  <Info label="업종·종목" value={selected.businessCategory} />
                  <Info label="담당자 이메일" value={selected.contactEmail} />
                  <Info label="담당자 연락처" value={selected.contactPhone} />
                </dl>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-line p-5">
                  <h3 className="font-bold text-gray-950">사업장 주소</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-700">
                    {[selected.businessAddress?.state, selected.businessAddress?.city, selected.businessAddress?.street, selected.businessAddress?.zipCode].filter(Boolean).join(' ') || '-'}
                  </p>
                </div>
                <div className="rounded-2xl border border-line p-5">
                  <h3 className="font-bold text-gray-950">정산 계좌</h3>
                  <dl className="mt-3 grid grid-cols-2 gap-4"><Info label="은행" value={selected.bankAccount?.bankName} /><Info label="예금주" value={selected.bankAccount?.accountHolder} /><div className="col-span-2"><Info label="계좌번호" value={selected.bankAccount?.accountNumber} /></div></dl>
                </div>
              </section>

              <section className="rounded-2xl border border-line p-5">
                <h3 className="font-bold text-gray-950">제출 서류</h3>
                {selected.verificationDocuments?.length ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {selected.verificationDocuments.map((document, index) => (
                      <button type="button" key={`${document.url}-${index}`} onClick={() => openVerificationDocument(document.url)} className="rounded-xl border border-line p-4 text-left text-sm font-medium text-brand-600 hover:bg-brand-50">
                        {document.type === 'business_registration' ? '사업자등록증' : document.type} {index + 1} · 새 창에서 보기
                      </button>
                    ))}
                  </div>
                ) : <p className="mt-3 text-sm text-red-700">제출된 증빙서류가 없습니다.</p>}
              </section>

              {selected.status === 'rejected' && selected.rejectionReason && (
                <section className="rounded-2xl border border-red-200 bg-red-50 p-5"><h3 className="font-bold text-red-900">최근 보완 요청</h3><p className="mt-2 text-sm leading-6 text-red-800">{selected.rejectionReason}</p></section>
              )}

              <section className="rounded-2xl border border-line p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-950">심사 변경 이력</h3>
                  <span className="text-xs text-muted">최근 100건</span>
                </div>
                {selected.auditLogs?.length ? (
                  <ol className="mt-4 space-y-4">
                    {selected.auditLogs.map((log) => (
                      <li key={log.auditUuid} className="rounded-xl border border-gray-100 bg-surface p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={log.nextStatus} />
                            <span className="text-sm font-semibold text-gray-900">
                              {log.action === 'approved' ? '입점 승인' : '보완 요청'}
                            </span>
                          </div>
                          <time className="text-xs text-muted">{new Date(log.createdAt).toLocaleString('ko-KR')}</time>
                        </div>
                        <p className="mt-2 text-sm text-gray-700">
                          담당자: {log.actor.name || log.actor.email || log.actor.userId}
                          {log.actor.name && log.actor.email ? ` (${log.actor.email})` : ''}
                        </p>
                        {log.action === 'approved' && log.nextCommission !== undefined && (
                          <p className="mt-1 text-sm text-gray-700">확정 수수료: {log.nextCommission}%</p>
                        )}
                        {log.rejectionReason && <p className="mt-2 text-sm leading-6 text-red-800">보완 사유: {log.rejectionReason}</p>}
                        {log.verificationNote && <p className="mt-2 text-xs leading-5 text-gray-600">내부 메모: {log.verificationNote}</p>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 text-sm text-muted">아직 기록된 심사 이력이 없습니다. 기존 처리 건은 이 기능 적용 이후부터 기록됩니다.</p>
                )}
              </section>

              {selected.status === 'pending' && !action && (
                <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
                  <button onClick={() => setAction('reject')} className="flex-1 rounded-xl border border-red-300 px-5 py-3 font-semibold text-red-700">보완 요청</button>
                  <button onClick={() => setAction('approve')} disabled={(selected.applicationProgress ?? 0) < 100} className="flex-1 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300">수수료 확정 후 승인</button>
                </div>
              )}

              {action === 'approve' && (
                <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
                  <h3 className="text-lg font-bold text-green-950">승인 조건 확정</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block"><span className="text-sm font-medium text-green-950">판매 수수료율</span><div className="mt-2 flex items-center"><input type="number" min="0" max="50" step="0.1" value={commission} onChange={(event) => setCommission(Number(event.target.value))} className="w-full rounded-xl border border-green-300 px-4 py-3" /><span className="-ml-10 mr-4 text-sm">%</span></div></label>
                    <div className="rounded-xl bg-white p-4 text-sm text-gray-700"><p>판매액 100,000원 기준</p><p className="mt-1 font-semibold">수수료 {feeExample.toLocaleString()}원 · 정산 예정 {(salesExample - feeExample).toLocaleString()}원</p></div>
                  </div>
                  <textarea value={verificationNote} onChange={(event) => setVerificationNote(event.target.value)} rows={3} maxLength={500} placeholder="승인 메모(선택)" className="mt-4 w-full rounded-xl border border-green-300 p-3" />
                  <div className="mt-4 flex gap-3"><button onClick={() => setAction(null)} className="flex-1 rounded-xl border bg-white px-4 py-3 font-semibold">취소</button><button onClick={submitApproval} disabled={actionLoading || commission < 0 || commission > 50} className="flex-1 rounded-xl bg-green-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{actionLoading ? '처리 중…' : `${commission}%로 승인`}</button></div>
                </section>
              )}

              {action === 'reject' && (
                <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <h3 className="text-lg font-bold text-red-950">보완 요청</h3>
                  <div className="mt-3 flex flex-wrap gap-2">{['사업자등록증을 선명하게 다시 제출해 주세요.', '정산 계좌의 예금주 정보를 확인해 주세요.', '사업자 정보와 신청 정보가 일치하지 않습니다.'].map((reason) => <button key={reason} onClick={() => setRejectionReason(reason)} className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs text-red-800">{reason}</button>)}</div>
                  <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={4} maxLength={1000} placeholder="신청자가 무엇을 수정해야 하는지 구체적으로 입력해 주세요. (10자 이상)" className="mt-4 w-full rounded-xl border border-red-300 p-3" />
                  <textarea value={verificationNote} onChange={(event) => setVerificationNote(event.target.value)} rows={2} maxLength={500} placeholder="내부 심사 메모(선택)" className="mt-3 w-full rounded-xl border border-red-300 p-3" />
                  <div className="mt-4 flex gap-3"><button onClick={() => setAction(null)} className="flex-1 rounded-xl border bg-white px-4 py-3 font-semibold">취소</button><button onClick={submitRejection} disabled={actionLoading || rejectionReason.trim().length < 10} className="flex-1 rounded-xl bg-red-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{actionLoading ? '처리 중…' : '보완 요청 보내기'}</button></div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SellerApplicationManagement;
