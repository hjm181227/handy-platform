import React, { useEffect, useState } from 'react';
import { Receipt, Clock, Store } from 'lucide-react';
import { QuoteMessageData } from '../../lib/chat/types';

interface QuoteMessageCardProps {
  quoteId: string;
  isMine: boolean;
  onClick: () => void;
}

// 상태 설정
const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  pending: { label: '대기중', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  accepted: { label: '수락됨', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: '거절됨', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  expired: { label: '만료됨', bgColor: 'bg-gray-100', textColor: 'text-gray-500' }
};

// API Base URL
const API_BASE_URL = (window as any).__VITE_API_BASE_URL__ || '';

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

    const token = localStorage.getItem('accessToken');

    fetch(`${API_BASE_URL}/quotes/${quoteId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
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

  // 로딩 상태
  if (loading) {
    return (
      <div
        className={`
          w-[280px] rounded-2xl overflow-hidden shadow-md
          ${isMine ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}
        `}
      >
        <div className={`px-4 py-3 ${isMine ? 'bg-blue-100' : 'bg-emerald-50'}`}>
          <div className="flex items-center gap-2">
            <Receipt className="w-[18px] h-[18px] text-[#E85A6B]" />
            <span className="font-semibold text-gray-900 text-sm">견적서</span>
          </div>
        </div>
        <div className="p-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
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
        <div className={`px-4 py-3 ${isMine ? 'bg-blue-100' : 'bg-emerald-50'}`}>
          <div className="flex items-center gap-2">
            <Receipt className="w-[18px] h-[18px] text-[#E85A6B]" />
            <span className="font-semibold text-gray-900 text-sm">견적서</span>
          </div>
        </div>
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">견적서를 불러올 수 없습니다</p>
          <button
            className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
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
      <div className={`px-4 py-3 ${isMine ? 'bg-blue-100' : 'bg-emerald-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-[18px] h-[18px] text-[#E85A6B]" />
            <span className="font-semibold text-gray-900 text-sm">견적서</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-4 space-y-3">
        {/* 가격 - 강조 */}
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-xs text-emerald-600 mb-1">견적 금액</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatPrice(data.price)}
            <span className="text-sm font-normal text-gray-500">원</span>
          </p>
        </div>

        {/* 제작 기간 */}
        <div className="flex items-center gap-2 text-sm text-[#A39E99]">
          <Clock className="w-4 h-4" />
          <span>예상 제작일: <strong className="text-[#131211]">{data.processingDays}일</strong></span>
        </div>

        {/* 판매자 정보 */}
        {data.sellerName && (
          <div className="flex items-center gap-2 text-sm text-[#A39E99]">
            <div className="w-5 h-5 bg-[#F2EAE3] rounded-full flex items-center justify-center">
              <Store className="w-3 h-3 text-[#A39E99]" />
            </div>
            <span>{data.sellerName}</span>
          </div>
        )}

        {/* 메모 미리보기 */}
        {data.sellerNotes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <p className="text-xs text-gray-700 line-clamp-2">{data.sellerNotes}</p>
          </div>
        )}
      </div>

      {/* 푸터 - 견적서 보기 버튼 */}
      <div className="px-4 pb-4">
        <button
          className={`
            w-full py-2 rounded-lg text-sm font-medium transition-colors
            ${isMine
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }
          `}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          견적서 보기
        </button>
      </div>
    </div>
  );
}
