import React, { useCallback, useEffect, useState } from 'react';
import { config } from '../../config/environment';
import { REPORT_REASON_LABELS, type ReportReason } from '../../lib/chat/moderationService';

const CHAT_API_URL = config.chatApiUrl;
const PAGE_SIZE = 20;

type ReportStatus = 'open' | 'reviewing' | 'resolved';

const STATUS_LABELS: Record<ReportStatus, string> = {
  open: '미처리',
  reviewing: '확인 중',
  resolved: '처리 완료',
};

const STATUS_STYLES: Record<ReportStatus, string> = {
  open: 'bg-red-100 text-red-700',
  reviewing: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
};

interface ReportSummary {
  id: string;
  reporterId: string;
  reportedId: string;
  reporterName: string;
  reportedName: string;
  roomId: string | null;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  createdAt: string;
  messageCount: number;
}

interface SnapshotMessage {
  id?: string;
  senderId: string;
  senderName: string;
  messageType?: string;
  text?: string;
  createdAt?: string;
}

interface ReportDetail extends ReportSummary {
  snapshot: { capturedAt?: string; messages: SnapshotMessage[] } | null;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const formatDateTime = (value?: string): string => {
  if (!value) return '';
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 채팅 신고 처리 콘솔.
 *
 * 신고 접수 API는 채팅 서버에 있고, 관리자 판정은 채팅 서버의
 * CHAT_ADMIN_IDS 환경변수로 한다(메인 서버 JWT에 role 클레임이 없기 때문).
 * 따라서 이 화면은 관리자 계정이라도 그 목록에 등록돼 있지 않으면 403을 받는다.
 */
const ChatReportManagement: React.FC = () => {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('open');
  const [openCount, setOpenCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: '0' });
      if (statusFilter !== 'all') query.set('status', statusFilter);

      const response = await fetch(`${CHAT_API_URL}/admin/reports?${query}`, {
        headers: authHeaders(),
      });

      if (response.status === 403) {
        throw new Error(
          '채팅 서버의 관리자 목록(CHAT_ADMIN_IDS)에 이 계정이 등록되어 있지 않습니다.'
        );
      }
      if (!response.ok) {
        throw new Error('신고 목록을 불러오지 못했습니다');
      }

      const data = await response.json();
      setReports(data.reports ?? []);
      setOpenCount(data.openCount ?? 0);
      setHasMore(Boolean(data.pagination?.hasMore));
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const openDetail = async (reportId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`${CHAT_API_URL}/admin/reports/${reportId}`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error('신고 상세를 불러오지 못했습니다');
      setSelected(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setDetailLoading(false);
    }
  };

  const changeStatus = async (reportId: string, status: ReportStatus) => {
    setActionBusy(true);
    try {
      const response = await fetch(`${CHAT_API_URL}/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('상태를 변경하지 못했습니다');

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      setSelected((prev) => (prev && prev.id === reportId ? { ...prev, status } : prev));
      void fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">채팅 신고 관리</h1>
          <p className="text-sm text-muted mt-1">
            미처리 {openCount}건
            {hasMore && <span className="ml-2">· 최근 {PAGE_SIZE}건만 표시됩니다</span>}
          </p>
        </div>
        <button
          onClick={() => void fetchReports()}
          className="px-4 py-2 text-sm border border-line rounded-lg hover:bg-surface"
        >
          새로고침
        </button>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2 mb-4">
        {(['open', 'reviewing', 'resolved', 'all'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              statusFilter === value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-ink border-line hover:bg-surface'
            }`}
          >
            {value === 'all' ? '전체' : STATUS_LABELS[value]}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-muted">불러오는 중...</div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center text-muted">
          {statusFilter === 'open' ? '미처리 신고가 없습니다.' : '해당하는 신고가 없습니다.'}
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 whitespace-nowrap">접수일시</th>
                <th className="px-4 py-3 whitespace-nowrap">신고자</th>
                <th className="px-4 py-3 whitespace-nowrap">대상</th>
                <th className="px-4 py-3 whitespace-nowrap">사유</th>
                <th className="px-4 py-3">상세</th>
                <th className="px-4 py-3 whitespace-nowrap">상태</th>
                <th className="px-4 py-3 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {formatDateTime(report.createdAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{report.reporterName}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {report.reportedName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {REPORT_REASON_LABELS[report.reason] ?? report.reason}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-600">
                    {report.detail || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[report.status]}`}
                    >
                      {STATUS_LABELS[report.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => void openDetail(report.id)}
                      className="px-3 py-1.5 text-xs border border-line rounded-lg hover:bg-surface"
                    >
                      대화 보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 상세 — 접수 시점 대화 스냅샷 */}
      {(selected || detailLoading) && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => !actionBusy && setSelected(null)}
          />
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-xl flex flex-col">
              {detailLoading || !selected ? (
                <div className="p-10 text-center text-muted">불러오는 중...</div>
              ) : (
                <>
                  <div className="px-6 py-4 border-b border-line">
                    <h2 className="text-lg font-bold text-gray-900">
                      {selected.reportedName} 신고 내역
                    </h2>
                    <p className="text-sm text-muted mt-1">
                      {formatDateTime(selected.createdAt)} · 신고자 {selected.reporterName} ·{' '}
                      {REPORT_REASON_LABELS[selected.reason] ?? selected.reason}
                    </p>
                    {selected.detail && (
                      <p className="mt-3 text-sm text-gray-700 bg-surface rounded-lg px-3 py-2">
                        {selected.detail}
                      </p>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      접수 시점 대화
                      {selected.snapshot?.capturedAt && (
                        <span className="ml-2 font-normal text-muted">
                          ({formatDateTime(selected.snapshot.capturedAt)} 기준)
                        </span>
                      )}
                    </h3>

                    {!selected.snapshot || selected.snapshot.messages.length === 0 ? (
                      <p className="text-sm text-muted">
                        보관된 대화가 없습니다. (방 정보 없이 접수된 신고)
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {[...selected.snapshot.messages]
                          .sort(
                            (a, b) =>
                              new Date(a.createdAt || 0).getTime() -
                              new Date(b.createdAt || 0).getTime()
                          )
                          .map((message, index) => {
                            const isReported = message.senderId === selected.reportedId;
                            return (
                              <div
                                key={message.id ?? index}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                  isReported
                                    ? 'bg-red-50 border border-red-100'
                                    : 'bg-surface border border-gray-100'
                                }`}
                              >
                                <div className="flex items-baseline justify-between gap-3 mb-0.5">
                                  <span className="font-semibold text-gray-900">
                                    {message.senderName}
                                    {isReported && (
                                      <span className="ml-2 text-xs font-normal text-red-600">
                                        신고 대상
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs text-muted whitespace-nowrap">
                                    {formatDateTime(message.createdAt)}
                                  </span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap break-words">
                                  {message.messageType === 'image'
                                    ? '(이미지)'
                                    : message.text || '(내용 없음)'}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 border-t border-line flex items-center justify-between gap-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[selected.status]}`}
                    >
                      {STATUS_LABELS[selected.status]}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelected(null)}
                        disabled={actionBusy}
                        className="px-4 py-2 text-sm bg-surface text-ink rounded-lg hover:bg-surface-strong disabled:opacity-50"
                      >
                        닫기
                      </button>
                      {selected.status !== 'reviewing' && (
                        <button
                          onClick={() => void changeStatus(selected.id, 'reviewing')}
                          disabled={actionBusy}
                          className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                        >
                          확인 중으로 표시
                        </button>
                      )}
                      {selected.status !== 'resolved' && (
                        <button
                          onClick={() => void changeStatus(selected.id, 'resolved')}
                          disabled={actionBusy}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          처리 완료
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatReportManagement;
