import React, { useEffect, useState } from 'react';
import { Receipt, Timer, Store, MessageSquare, ChevronDown } from 'lucide-react';
import { QuoteMessageData } from '../../lib/chat/types';
import { orderService } from '../../services/apiService';

interface QuoteMessageCardProps {
  quoteId: string;
  isMine: boolean;
  onClick: () => void;
}

// 상태 설정
const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  pending:  { label: '대기중', bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
  accepted: { label: '수락됨', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: '거절됨', bgColor: 'bg-red-100',   textColor: 'text-red-700' },
  expired:  { label: '만료됨', bgColor: 'bg-gray-100',  textColor: 'text-gray-500' }
};

export function QuoteMessageCard({ quoteId, isMine, onClick }: QuoteMessageCardProps) {
  const [data, setData] = useState<QuoteMessageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  useEffect(() => {
    if (!quoteId) return;

    setLoading(true);
    setError(false);

    orderService.getQuoteDetail(quoteId)
      .then(res => {
        if (res.success && res.data) {
          // 백엔드 응답 구조: { quoteUuid, seller, quote, customRequest }
          const { quoteUuid, seller, quote, customRequest } = res.data;
          setData({
            quoteId: quoteUuid || quote?._id,
            customOrderId: customRequest?.requestUuid || '',
            price: quote?.price || 0,
            processingDays: quote?.processingDays || 0,
            sellerNotes: quote?.sellerNotes,
            status: quote?.status || 'pending',
            sellerName: seller?.brandName,
            createdAt: quote?.issuedAt
          });
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [quoteId]);

  const cardClass = `w-[280px] max-w-full overflow-hidden bg-white border border-line ${
    isMine ? 'rounded-[16px_4px_16px_16px]' : 'rounded-[4px_16px_16px_16px]'
  }`;

  const cardHeader = (
    <div className="flex items-center gap-2 px-3.5 py-3">
      <Receipt className="w-[18px] h-[18px] text-green-500" />
      <span className="font-bold text-ink text-sm">견적서</span>
    </div>
  );

  // 로딩 상태
  if (loading) {
    return (
      <div className={cardClass}>
        {cardHeader}
        <div className="p-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
          <span className="ml-2 text-sm text-muted">로딩 중...</span>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !data) {
    return (
      <div className={`${cardClass} cursor-pointer`} onClick={onClick}>
        {cardHeader}
        <div className="p-4 text-center">
          <p className="text-sm text-muted">견적서를 불러올 수 없습니다</p>
          <button
            className="mt-2 text-sm text-brand hover:text-brand-600 font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[data.status] || STATUS_CONFIG.pending;

  // 메모 미리보기 (최대 40자)
  const memoPreview = data.sellerNotes
    ? data.sellerNotes.length > 40
      ? data.sellerNotes.substring(0, 40) + '...'
      : data.sellerNotes
    : null;

  return (
    <div
      className={`${cardClass} cursor-pointer transition-all hover:scale-[1.02]`}
      onClick={onClick}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3.5 py-3">
        <Receipt className="w-[18px] h-[18px] text-green-500" />
        <span className="font-bold text-ink text-sm">견적서</span>
        <span className={`ml-auto px-2 py-[3px] rounded-lg text-[11px] font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* 본문 */}
      <div className="px-3.5 pb-3.5 space-y-2.5">
        {/* 가격 박스 */}
        <div className="bg-[#F0FDF4] rounded-[10px] px-3.5 py-3 space-y-1">
          <p className="text-[11px] font-medium text-[#16A34A]">견적 금액</p>
          <p className="text-[22px] font-bold text-ink leading-tight">
            {formatPrice(data.price)}원
          </p>
        </div>

        {/* 예상 제작일 */}
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Timer className="w-3.5 h-3.5" />
          <span className="font-medium">예상 제작일: {data.processingDays}일</span>
        </div>

        {/* 판매자 정보 */}
        {data.sellerName && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-surface-strong flex items-center justify-center flex-shrink-0">
              <Store className="w-3 h-3 text-muted" />
            </div>
            <span className="text-xs font-medium text-ink">{data.sellerName}</span>
          </div>
        )}

        {/* 메모 미리보기 */}
        {memoPreview && (
          <div className="bg-amber-50 rounded-lg px-2.5 py-2 flex gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 line-clamp-2">{memoPreview}</p>
          </div>
        )}
      </div>

      {/* 푸터 - 견적서 보기 */}
      <div
        className="h-10 flex items-center justify-center gap-1 border-t border-line bg-surface cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <span className="text-[13px] font-semibold text-ink">견적서 보기</span>
      </div>
    </div>
  );
}
