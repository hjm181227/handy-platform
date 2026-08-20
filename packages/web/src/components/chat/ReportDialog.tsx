import React, { useState } from 'react';
import { X, TriangleAlert } from 'lucide-react';
import {
  reportUser,
  REPORT_REASON_LABELS,
  type ReportReason,
} from '../../lib/chat/moderationService';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** 신고 대상 사용자 UUID */
  reportedId: string;
  /** 신고 맥락이 되는 방 (서버 방 ID). 있으면 최근 대화가 근거로 함께 저장된다 */
  roomId?: string | null;
  partnerName: string;
  onReported?: () => void;
}

const REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

export const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  reportedId,
  roomId,
  partnerName,
  onReported,
}) => {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const result = await reportUser({
      reportedId,
      reason,
      roomId: roomId ?? undefined,
      detail: detail.trim() || undefined,
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? '신고 접수에 실패했습니다');
      return;
    }

    setReason('spam');
    setDetail('');
    onReported?.();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-dialog-title"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <TriangleAlert className="w-5 h-5 text-brand" />
              <h2 id="report-dialog-title" className="text-lg font-bold text-gray-900">
                신고하기
              </h2>
            </div>
            <button onClick={onClose} aria-label="닫기">
              <X className="w-6 h-6 text-muted" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{partnerName}</span>
              님을 신고합니다. 접수 시점의 대화 내용이 확인용으로 함께 저장됩니다.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                신고 사유
              </legend>
              <div className="space-y-2">
                {REASONS.map((value) => (
                  <label
                    key={value}
                    className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={value}
                      checked={reason === value}
                      onChange={() => setReason(value)}
                      className="accent-brand"
                    />
                    <span className="text-sm text-gray-900">
                      {REPORT_REASON_LABELS[value]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="report-detail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                상세 내용 <span className="text-gray-400">(선택)</span>
              </label>
              <textarea
                id="report-detail"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="어떤 일이 있었는지 알려주시면 확인에 도움이 됩니다"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                disabled={submitting}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">
                {detail.length}/1000
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {submitting ? '접수 중...' : '신고하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
