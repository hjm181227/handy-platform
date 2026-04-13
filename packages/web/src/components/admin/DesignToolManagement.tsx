import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { designToolService } from '../../services/apiService';
import type {
  AdminSubscriptionSummary,
  AdminSubscriptionListQuery,
  DesignToolPaymentRecord,
  DesignToolPlanId,
  SubscriptionState,
  SubscriptionStatus,
  PaymentSource,
} from '@handy-platform/shared';

const STATUS_OPTIONS: { value: SubscriptionStatus | ''; label: string }[] = [
  { value: '', label: '전체 상태' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
  { value: 'in_grace_period', label: 'Grace Period' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'paused', label: 'Paused' },
  { value: 'trial', label: 'Trial' },
  { value: 'none', label: 'None' },
];

const PLAN_OPTIONS: { value: DesignToolPlanId | ''; label: string }[] = [
  { value: '', label: '전체 플랜' },
  { value: 'pro', label: 'Pro' },
  { value: 'free', label: 'Free' },
];

const SOURCE_OPTIONS: { value: PaymentSource | ''; label: string }[] = [
  { value: '', label: '전체 결제 소스' },
  { value: 'toss', label: 'Toss' },
  { value: 'apple', label: 'Apple' },
  { value: 'google', label: 'Google' },
  { value: 'admin', label: 'Admin' },
];

const LIMIT = 30;

const statusBadgeClass = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
      return 'bg-amber-100 text-amber-700';
    case 'in_grace_period':
      return 'bg-amber-100 text-amber-700';
    case 'on_hold':
      return 'bg-red-100 text-red-700';
    case 'paused':
      return 'bg-blue-100 text-blue-700';
    case 'expired':
      return 'bg-red-100 text-red-700';
    case 'trial':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const DesignToolManagement: React.FC = () => {
  const [items, setItems] = useState<AdminSubscriptionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('');
  const [planFilter, setPlanFilter] = useState<DesignToolPlanId | ''>('');
  const [sourceFilter, setSourceFilter] = useState<PaymentSource | ''>('');

  const [selected, setSelected] = useState<AdminSubscriptionSummary | null>(null);
  const [detail, setDetail] = useState<SubscriptionState | null>(null);
  const [detailPayments, setDetailPayments] = useState<DesignToolPaymentRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: AdminSubscriptionListQuery = {
        page,
        limit: LIMIT,
      };
      if (statusFilter) query.status = statusFilter;
      if (planFilter) query.plan = planFilter;
      if (sourceFilter) query.paymentSource = sourceFilter;
      const res = await designToolService.adminListSubscriptions(query);
      if (res.success && res.items) {
        setItems(res.items);
        setTotal(res.total ?? 0);
      } else {
        setError(res.error || '목록을 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, planFilter, sourceFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / LIMIT)), [total]);

  const openDetail = async (item: AdminSubscriptionSummary) => {
    setSelected(item);
    setDetail(null);
    setDetailPayments([]);
    setDetailLoading(true);
    try {
      const [subRes, payRes] = await Promise.all([
        designToolService.adminGetUserSubscription(item.userUuid),
        designToolService.adminGetUserPayments(item.userUuid, { limit: 20 }),
      ]);
      if (subRes.success && subRes.subscription) setDetail(subRes.subscription);
      if (payRes.success && payRes.items) setDetailPayments(payRes.items);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
    setDetailPayments([]);
  };

  const handleCancel = async () => {
    if (!selected) return;
    const reason = prompt('취소 사유 (선택):') || undefined;
    if (!confirm('강제 취소하시겠습니까?')) return;
    setActionLoading(true);
    try {
      const res = await designToolService.adminCancelUser(selected.userUuid, { reason });
      if (res.success && res.subscription) setDetail(res.subscription);
      await load();
      alert('취소되었습니다.');
    } catch (err: any) {
      alert(err?.message || '취소 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async (paymentId?: string) => {
    if (!selected) return;
    const reason = prompt('환불 사유:');
    if (!reason) return;
    if (!confirm('환불하시겠습니까?')) return;
    setActionLoading(true);
    try {
      const res = await designToolService.adminRefundUser(selected.userUuid, {
        reason,
        paymentId,
      });
      if (res.success && res.subscription) setDetail(res.subscription);
      // 결제 이력 재조회
      const payRes = await designToolService.adminGetUserPayments(selected.userUuid, {
        limit: 20,
      });
      if (payRes.success && payRes.items) setDetailPayments(payRes.items);
      await load();
      alert('환불 처리되었습니다.');
    } catch (err: any) {
      alert(err?.message || '환불 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGrant = async (plan: DesignToolPlanId) => {
    if (!selected) return;
    const reason = prompt('권한 부여 사유:');
    if (!reason) return;
    setActionLoading(true);
    try {
      const res = await designToolService.adminGrantUser(selected.userUuid, {
        plan,
        reason,
      });
      if (res.success && res.subscription) setDetail(res.subscription);
      await load();
      alert(`${plan} 권한이 부여되었습니다.`);
    } catch (err: any) {
      alert(err?.message || '권한 부여 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const activeCount = items.filter((i) => i.status === 'active').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">디자인 툴 구독 관리</h1>
        <p className="text-sm text-gray-500">
          전체 구독자 조회, 필터링, 환불/취소/권한 부여 등 운영 액션
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">전체 조회된 구독</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{total.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">현재 페이지 활성 구독</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {activeCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">페이지</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {page} / {totalPages}
          </p>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as SubscriptionStatus | '');
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value as DesignToolPlanId | '');
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          {PLAN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value as PaymentSource | '');
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => load()}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600"
        >
          새로고침
        </button>
      </div>

      {/* 리스트 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
          </div>
        )}
        {!loading && error && (
          <div className="p-6 text-red-600 text-sm">{error}</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="p-12 text-center text-gray-500 text-sm">
            조건에 맞는 구독이 없습니다.
          </div>
        )}
        {!loading && !error && items.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  이메일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  플랜
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  결제 소스
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  만료일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  마지막 결제
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.userUuid} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-900">{item.email}</td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.plan === 'pro'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {item.paymentSource ?? '-'}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {item.expiresAt
                      ? new Date(item.expiresAt).toLocaleDateString('ko-KR')
                      : '-'}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {item.lastPaymentAt
                      ? new Date(item.lastPaymentAt).toLocaleDateString('ko-KR')
                      : '-'}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <button
                      onClick={() => openDetail(item)}
                      className="px-3 py-1.5 text-xs text-pink-700 border border-pink-200 rounded-lg hover:bg-pink-50"
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeDetail}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selected.email}</h3>
                <p className="text-xs text-gray-500 font-mono">{selected.userUuid}</p>
              </div>
              <button
                onClick={closeDetail}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto">
              {detailLoading && (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500" />
                </div>
              )}

              {!detailLoading && detail && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                    <KV label="플랜" value={detail.plan.toUpperCase()} />
                    <KV label="상태" value={detail.status} />
                    <KV label="결제 소스" value={detail.paymentSource ?? '-'} />
                    <KV
                      label="자동갱신"
                      value={detail.autoRenew ? '켜짐' : '꺼짐'}
                    />
                    <KV
                      label="구독일"
                      value={
                        detail.subscribedAt
                          ? new Date(detail.subscribedAt).toLocaleDateString('ko-KR')
                          : '-'
                      }
                    />
                    <KV
                      label="만료일"
                      value={
                        detail.expiresAt
                          ? new Date(detail.expiresAt).toLocaleDateString('ko-KR')
                          : '-'
                      }
                    />
                    <KV
                      label="다음 결제일"
                      value={
                        detail.nextRenewalAt
                          ? new Date(detail.nextRenewalAt).toLocaleDateString('ko-KR')
                          : '-'
                      }
                    />
                    <KV
                      label="결제 수단"
                      value={
                        detail.billingMethodMeta?.maskedNumber
                          ? `${detail.billingMethodMeta.cardCompany ?? ''} ${detail.billingMethodMeta.maskedNumber}`
                          : '-'
                      }
                    />
                  </div>

                  {/* 결제 이력 */}
                  <div className="mb-5">
                    <p className="text-sm font-medium text-gray-900 mb-2">결제 이력</p>
                    {detailPayments.length === 0 ? (
                      <p className="text-xs text-gray-500">기록 없음</p>
                    ) : (
                      <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                        {detailPayments.map((p) => (
                          <li
                            key={p.id}
                            className="p-3 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  ₩{p.amount.toLocaleString()}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full ${
                                    p.status === 'completed'
                                      ? 'bg-green-100 text-green-700'
                                      : p.status === 'refunded'
                                      ? 'bg-gray-100 text-gray-600'
                                      : p.status === 'failed'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </div>
                              <p className="text-gray-500 mt-0.5">
                                {new Date(p.paidAt).toLocaleString('ko-KR')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {p.receiptUrl && (
                                <a
                                  href={p.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-pink-600 hover:underline"
                                >
                                  영수증
                                </a>
                              )}
                              {p.status === 'completed' && !p.refundedAt && (
                                <button
                                  onClick={() => handleRefund(p.id)}
                                  disabled={actionLoading}
                                  className="text-red-600 hover:underline disabled:opacity-50"
                                >
                                  환불
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 액션 */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => handleGrant('pro')}
                disabled={actionLoading}
                className="px-3 py-2 text-xs border border-pink-200 text-pink-700 rounded-lg hover:bg-pink-50 disabled:opacity-50"
              >
                Pro 부여
              </button>
              <button
                onClick={() => handleGrant('free')}
                disabled={actionLoading}
                className="px-3 py-2 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Free 부여
              </button>
              <button
                onClick={handleCancel}
                disabled={
                  actionLoading ||
                  !detail ||
                  detail.status === 'none' ||
                  detail.status === 'cancelled'
                }
                className="px-3 py-2 text-xs border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50"
              >
                강제 취소
              </button>
              <button
                onClick={() => handleRefund()}
                disabled={actionLoading}
                className="px-3 py-2 text-xs border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                최근 결제 환불
              </button>
              <button
                onClick={closeDetail}
                className="px-3 py-2 text-xs bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

export default DesignToolManagement;
