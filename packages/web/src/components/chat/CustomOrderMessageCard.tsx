import React, { useEffect, useState } from 'react';
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
  pending: { label: '검토중', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  accepted: { label: '승인됨', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: '거절됨', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  completed: { label: '완료', bgColor: 'bg-blue-100', textColor: 'text-blue-700' }
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

  // 로딩 상태
  if (loading) {
    return (
      <div
        className={`
          w-[280px] rounded-2xl overflow-hidden shadow-md
          ${isMine ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}
        `}
      >
        <div className={`px-4 py-3 ${isMine ? 'bg-blue-100' : 'bg-purple-50'}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="font-semibold text-gray-900 text-sm">커스텀 주문서</span>
          </div>
        </div>
        <div className="p-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-sm text-gray-500">로딩 중...</span>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !data) {
    return (
      <div
        className={`
          w-[280px] rounded-2xl overflow-hidden shadow-md cursor-pointer
          ${isMine ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}
        `}
        onClick={onClick}
      >
        <div className={`px-4 py-3 ${isMine ? 'bg-blue-100' : 'bg-purple-50'}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="font-semibold text-gray-900 text-sm">커스텀 주문서</span>
          </div>
        </div>
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">주문서를 불러올 수 없습니다</p>
          <button
            className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
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
      className={`
        w-[280px] rounded-2xl overflow-hidden shadow-md cursor-pointer
        transition-all hover:shadow-lg hover:scale-[1.02]
        ${isMine ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}
      `}
      onClick={onClick}
    >
      {/* 헤더 */}
      <div className={`px-4 py-3 ${isMine ? 'bg-blue-100' : 'bg-purple-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="font-semibold text-gray-900 text-sm">커스텀 주문서</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-4 space-y-3">
        {/* 제목 */}
        <div>
          <p className="text-sm font-medium text-gray-900 line-clamp-1">{data.title}</p>
          {data.brandName && (
            <p className="text-xs text-gray-500">{data.brandName}</p>
          )}
        </div>

        {/* 쉐입/길이 배지 */}
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
            {shapeLabel}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
            {lengthLabel}
          </span>
        </div>

        {/* 수령 희망일 */}
        {formattedDate && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>희망일: {formattedDate}</span>
          </div>
        )}

        {/* 참고 이미지 썸네일 */}
        {data.referenceImages && data.referenceImages.length > 0 && (
          <div className="flex gap-2">
            {data.referenceImages.slice(0, 2).map((url, idx) => (
              <div
                key={idx}
                className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"
              >
                <img
                  src={url}
                  alt={`참고 ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {data.referenceImages.length > 2 && (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                +{data.referenceImages.length - 2}
              </div>
            )}
          </div>
        )}

        {/* 요청사항 미리보기 */}
        {designNotesPreview && (
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-xs text-gray-600 line-clamp-2">
              {designNotesPreview}
            </p>
          </div>
        )}
      </div>

      {/* 푸터 - 주문서 보기 버튼 */}
      <div className="px-4 pb-4">
        <button
          className={`
            w-full py-2 rounded-lg text-sm font-medium transition-colors
            ${isMine
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-purple-500 text-white hover:bg-purple-600'
            }
          `}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          주문서 보기
        </button>
      </div>
    </div>
  );
}
