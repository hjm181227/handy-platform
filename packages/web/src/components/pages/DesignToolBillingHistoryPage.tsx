import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Receipt, ExternalLink } from 'lucide-react';
import { designToolService } from '../../services/apiService';
import type { DesignToolPaymentRecord } from '@handy-platform/shared';

interface DesignToolBillingHistoryPageProps {
  onGo: (to: string) => void;
}

type LoadState = 'idle' | 'loading' | 'loadingMore' | 'error';

export function DesignToolBillingHistoryPage({
  onGo,
}: DesignToolBillingHistoryPageProps) {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<DesignToolPaymentRecord[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts: { append: boolean; cursor?: string }) => {
      setState(opts.append ? 'loadingMore' : 'loading');
      setError(null);
      try {
        const res = await designToolService.getMyPayments({
          limit: 20,
          cursor: opts.cursor,
        });
        if (res.success && res.items) {
          const fetched = res.items;
          setItems((prev) => (opts.append ? [...prev, ...fetched] : fetched));
          setCursor(res.nextCursor);
          setState('idle');
        } else {
          setError(res.error || t('designTool.billing.historyLoadFailed'));
          setState('error');
        }
      } catch (err: any) {
        setError(err?.message || t('designTool.billing.historyLoadFailed'));
        setState('error');
      }
    },
    [t],
  );

  useEffect(() => {
    load({ append: false });
  }, [load]);

  const handleLoadMore = () => {
    if (cursor) load({ append: true, cursor });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => onGo('/design-tool')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t('designTool.billing.history')}</h1>
      </div>

      {state === 'loading' && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
        </div>
      )}

      {state !== 'loading' && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm mb-4">
          {error}
        </div>
      )}

      {state !== 'loading' && !error && items.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">{t('designTool.billing.historyEmpty')}</p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
          {items.map((record) => (
            <BillingRow key={record.id} record={record} />
          ))}
        </ul>
      )}

      {cursor && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={state === 'loadingMore'}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {state === 'loadingMore'
              ? t('designTool.billing.loadingMore')
              : t('designTool.billing.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}

function BillingRow({ record }: { record: DesignToolPaymentRecord }) {
  const { t } = useTranslation('common');
  const statusLabel = t(`designTool.billing.status.${record.status}`);
  const statusClass =
    record.status === 'completed'
      ? 'bg-green-100 text-green-700'
      : record.status === 'refunded'
      ? 'bg-gray-100 text-gray-600'
      : record.status === 'failed'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';

  return (
    <li className="p-4 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            ₩{record.amount.toLocaleString()}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {new Date(record.paidAt).toLocaleString('ko-KR')}
        </p>
        {record.refundedAt && (
          <p className="text-xs text-gray-400 mt-0.5">
            {t('designTool.billing.refundedAt', {
              date: new Date(record.refundedAt).toLocaleDateString('ko-KR'),
            })}
          </p>
        )}
      </div>
      {record.receiptUrl && (
        <a
          href={record.receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-pink-600 font-medium hover:underline shrink-0"
        >
          {t('designTool.billing.viewReceipt')}
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </li>
  );
}
