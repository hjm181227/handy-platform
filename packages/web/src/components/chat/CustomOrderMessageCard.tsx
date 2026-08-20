import React, { useEffect, useState } from 'react';
import { ClipboardList, Calendar, ChevronDown } from 'lucide-react';
import { CustomOrderMessageData } from '../../lib/chat/types';
import { orderService } from '../../services/apiService';

interface CustomOrderMessageCardProps {
  customOrderId: string;
  isMine: boolean;
  onClick: () => void;
}

// 쉐입 한글 변환
const SHAPE_LABELS: Record<string, string> = {
  ROUND: '라운드',
  ALMOND: '아몬드',
  OVAL: '오벌',
  STILETTO: '스틸레토',
  SQUARE: '스퀘어',
  COFFIN: '코핀'
};

// 길이 한글 변환
const LENGTH_LABELS: Record<string, string> = {
  SHORT: '숏',
  MEDIUM: '미디엄',
  LONG: '롱'
};

// 상태 한글 변환 및 색상
const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  pending:       { label: '상담중',   bgColor: 'bg-amber-100',  textColor: 'text-amber-600' },
  quoted:        { label: '견적완료', bgColor: 'bg-purple-100',  textColor: 'text-purple-700' },
  approved:      { label: '결제대기', bgColor: 'bg-green-100',   textColor: 'text-green-700' },
  in_production: { label: '제작중',   bgColor: 'bg-brand-50',    textColor: 'text-brand' },
  completed:     { label: '완료',     bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
  rejected:      { label: '거절됨',   bgColor: 'bg-red-100',     textColor: 'text-red-700' },
  cancelled:     { label: '취소됨',   bgColor: 'bg-gray-100',    textColor: 'text-gray-500' },
};

export function CustomOrderMessageCard({ customOrderId, isMine, onClick }: CustomOrderMessageCardProps) {
  const [data, setData] = useState<CustomOrderMessageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!customOrderId) return;

    setLoading(true);
    setError(false);

    orderService.getCustomOrderDetail(customOrderId)
      .then(res => {
        if (res.success && res.data) {
          const orderDetail = res.data;
          setData({
            customOrderId: orderDetail.id,
            title: orderDetail.title,
            shape: orderDetail.specifications.shape,
            length: orderDetail.specifications.length,
            sizes: orderDetail.specifications.sizes,
            desiredColor: orderDetail.specifications.desiredColor,
            desiredDate: orderDetail.specifications.desiredDate,
            designNotes: orderDetail.specifications.designNotes,
            referenceImages: orderDetail.specifications.referenceImages,
            status: orderDetail.status,
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
  }, [customOrderId]);

  const cardHeader = (
    <div className="flex items-center gap-2 px-3.5 py-3">
      <ClipboardList className="w-[18px] h-[18px] text-brand" />
      <span className="font-bold text-ink text-sm">커스텀 주문서</span>
    </div>
  );

  const cardClass = `w-[280px] max-w-full overflow-hidden bg-white border border-line shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${
    isMine ? 'rounded-[16px_4px_16px_16px]' : 'rounded-[4px_16px_16px_16px]'
  }`;

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
          <p className="text-sm text-muted">주문서를 불러올 수 없습니다</p>
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
  const shapeLabel = SHAPE_LABELS[data.shape] || data.shape;
  const lengthLabel = LENGTH_LABELS[data.length] || data.length;

  // 요청사항 미리보기 (최대 50자)
  const designNotesPreview = data.designNotes
    ? data.designNotes.length > 50
      ? data.designNotes.substring(0, 50) + '...'
      : data.designNotes
    : null;

  // 수령 희망일 포맷
  const formattedDate = data.desiredDate
    ? new Date(data.desiredDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      className={`${cardClass} cursor-pointer transition-all hover:scale-[1.02]`}
      onClick={onClick}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3.5 py-3 rounded-t-2xl">
        <ClipboardList className="w-[18px] h-[18px] text-brand" />
        <span className="font-bold text-ink text-sm">커스텀 주문서</span>
        <span className={`ml-auto px-2 py-0.5 rounded-lg text-[11px] font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* 본문 */}
      <div className="px-3.5 pb-3.5 space-y-2">
        {/* 제목 */}
        <p className="text-sm font-semibold text-ink line-clamp-1">{data.title}</p>
        {data.brandName && (
          <p className="text-xs text-muted">{data.brandName}</p>
        )}

        {/* 쉐입/길이 배지 */}
        <div className="flex gap-1.5">
          <span className="px-2 py-1 bg-white text-ink rounded-md text-[11px] font-medium border border-line-strong">
            {shapeLabel}
          </span>
          <span className="px-2 py-1 bg-white text-ink rounded-md text-[11px] font-medium border border-line-strong">
            {lengthLabel}
          </span>
        </div>

        {/* 수령 희망일 */}
        {formattedDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-medium">희망일: {formattedDate}</span>
          </div>
        )}

        {/* 요청사항 미리보기 */}
        {designNotesPreview && (
          <p className="text-xs text-muted line-clamp-2">
            {designNotesPreview}
          </p>
        )}

        {/* 참고 이미지 썸네일 */}
        {data.referenceImages && data.referenceImages.length > 0 && (
          <div className="flex gap-2">
            {data.referenceImages.slice(0, 2).map((url, idx) => (
              <div
                key={idx}
                className="w-14 h-14 rounded-lg overflow-hidden bg-surface flex-shrink-0"
              >
                <img
                  src={url}
                  alt={`참고 ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {data.referenceImages.length > 2 && (
              <div className="w-14 h-14 rounded-lg bg-surface flex items-center justify-center text-xs text-muted font-medium">
                +{data.referenceImages.length - 2}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 푸터 - 주문서 보기 버튼 */}
      <div
        className="h-10 flex items-center justify-center gap-1 border-t border-black/[0.04] bg-white cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <span className="text-[13px] font-semibold text-muted">주문서 보기</span>
        <ChevronDown className="w-4 h-4 text-muted" />
      </div>
    </div>
  );
}
