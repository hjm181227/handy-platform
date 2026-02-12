import React, { useEffect, useState } from 'react';
import { Receipt, X, ClipboardList, MessageSquare, Store, ShoppingCart, TriangleAlert } from 'lucide-react';
import { orderService } from '../../services/apiService';

interface QuoteDetail {
  quoteUuid: string;
  customOrderUuid: string;
  price: number;
  processingDays: number;
  sellerNotes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  sellerUuid: string;
  sellerName?: string;
  buyerUuid: string;
  createdAt: string;
  expiresAt?: string;
  customOrder?: {
    title: string;
    shape: string;
    length: string;
  };
}

interface QuoteBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId?: string | null;
  currentUserUuid?: string;
  onPurchase?: (quoteId: string) => void;
}

// 상태 설정
const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  pending:  { label: '대기중', bgColor: 'bg-[#FEF3C7]', textColor: 'text-[#D97706]' },
  accepted: { label: '수락됨', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: '거절됨', bgColor: 'bg-red-100',   textColor: 'text-red-700' },
  expired:  { label: '만료됨', bgColor: 'bg-gray-100',  textColor: 'text-gray-500' }
};

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

export function QuoteBottomSheet({
  isOpen,
  onClose,
  quoteId,
  currentUserUuid,
  onPurchase
}: QuoteBottomSheetProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [data, setData] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 짧은 날짜 포맷 (유효기간용)
  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  // quoteId가 있으면 API에서 조회
  useEffect(() => {
    if (isOpen && quoteId) {
      setLoading(true);
      setError(null);

      orderService.getQuoteDetail(quoteId)
        .then(res => {
          if (res.success && res.data) {
            // 백엔드 응답 구조: { quoteUuid, customRequest, seller, quote }
            const { quoteUuid, customRequest, seller, quote } = res.data;
            setData({
              quoteUuid: quoteUuid,
              customOrderUuid: customRequest?.requestUuid || '',
              price: quote?.price || 0,
              processingDays: quote?.processingDays || 0,
              sellerNotes: quote?.sellerNotes,
              status: quote?.status || 'pending',
              sellerUuid: seller?.userUuid || '',
              sellerName: seller?.brandName,
              buyerUuid: '',
              createdAt: quote?.issuedAt || '',
              expiresAt: quote?.expiresAt,
              customOrder: customRequest ? {
                title: customRequest.title || '',
                shape: customRequest.specifications?.shape || '',
                length: customRequest.specifications?.length || ''
              } : undefined
            });
          } else {
            setError('견적서 정보를 불러올 수 없습니다');
          }
        })
        .catch(err => {
          console.error('[QuoteBottomSheet] API error:', err);
          setError('견적서 정보를 불러오는 중 오류가 발생했습니다');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, quoteId]);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handlePurchase = () => {
    if (data && onPurchase) {
      onPurchase(data.quoteUuid);
    }
  };

  if (!isOpen && !isAnimating) return null;

  const statusConfig = data ? STATUS_CONFIG[data.status] || STATUS_CONFIG.pending : STATUS_CONFIG.pending;
  const shapeLabel = data?.customOrder ? SHAPE_LABELS[data.customOrder.shape] || data.customOrder.shape : '';
  const lengthLabel = data?.customOrder ? LENGTH_LABELS[data.customOrder.length] || data.customOrder.length : '';

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className={`fixed inset-0 z-50 bg-black transition-opacity duration-300 ${
          isAnimating && isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* 바텀 시트 */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${
          isAnimating && isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* 드래그 핸들 */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-[#D0C9C3] rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 pb-4">
          <Receipt className="w-6 h-6 text-green-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[#131211]">견적서 상세</h2>
            {data && (
              <p className="text-xs text-[#A39E99]">
                {data.sellerName || ''}{data.createdAt ? ` · ${formatShortDate(data.createdAt)} 발행` : ''}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center flex-shrink-0"
          >
            <X className="w-6 h-6 text-[#A39E99]" />
          </button>
        </div>
        <div className="h-px bg-[#F5F3F1]" />

        {/* 본문 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          {/* 로딩 상태 */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E85A6B] mx-auto mb-4"></div>
              <p className="text-[#A39E99]">견적서 정보를 불러오는 중...</p>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-[#FEF3C7] rounded-full flex items-center justify-center mx-auto mb-4">
                <TriangleAlert className="w-6 h-6 text-[#D97706]" />
              </div>
              <p className="text-[#A39E99]">{error}</p>
            </div>
          )}

          {/* 데이터 표시 */}
          {data && !loading && !error ? (
            <div className="space-y-6">
              {/* 가격 섹션 */}
              <div className="flex items-end justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#A39E99]">견적 금액</p>
                  <p className="text-[32px] font-bold text-[#131211] leading-tight">
                    {formatPrice(data.price)}원
                  </p>
                </div>
                <span className={`px-2 py-[3px] rounded-md text-[11px] font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                  {statusConfig.label}
                </span>
              </div>

              {/* 정보 그리드 */}
              <div className="space-y-2.5">
                <div className="flex">
                  <span className="text-[13px] text-[#A39E99] flex-1">예상 제작일</span>
                  <span className="text-[13px] font-semibold text-[#131211] flex-1">{data.processingDays}일</span>
                </div>
                {data.expiresAt && (
                  <div className="flex">
                    <span className="text-[13px] text-[#A39E99] flex-1">유효기간</span>
                    <span className="text-[13px] font-semibold text-[#131211] flex-1">{formatShortDate(data.expiresAt)}까지</span>
                  </div>
                )}
                {data.createdAt && (
                  <div className="flex">
                    <span className="text-[13px] text-[#A39E99] flex-1">발행일</span>
                    <span className="text-[13px] font-semibold text-[#131211] flex-1">{formatDate(data.createdAt)}</span>
                  </div>
                )}
              </div>
              <div className="h-px bg-[#F5F3F1]" />

              {/* 연결된 주문서 */}
              {data.customOrder && (
                <>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#131211] mb-2.5">연결된 주문서</h3>
                    <div className="bg-[#F7F5F3] rounded-[10px] p-3.5 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-[#A39E99]" />
                        <span className="text-[13px] font-semibold text-[#131211]">{data.customOrder.title}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="px-2 py-0.5 bg-[#EEEBE8] rounded-md text-[11px] font-medium text-[#131211]">
                          {shapeLabel}
                        </span>
                        <span className="px-2 py-0.5 bg-[#EEEBE8] rounded-md text-[11px] font-medium text-[#131211]">
                          {lengthLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-px bg-[#F5F3F1]" />
                </>
              )}

              {/* 판매자 메모 */}
              {data.sellerNotes && (
                <>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#131211] mb-2.5">판매자 메모</h3>
                    <div className="bg-[#FEF9E7] rounded-[10px] px-3.5 py-3 flex gap-2">
                      <MessageSquare className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] text-[#92400E] whitespace-pre-wrap">{data.sellerNotes}</p>
                    </div>
                  </div>
                  <div className="h-px bg-[#F5F3F1]" />
                </>
              )}

              {/* 판매자 정보 */}
              {data.sellerName && (
                <div>
                  <h3 className="text-[15px] font-bold text-[#131211] mb-2.5">판매자 정보</h3>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#F2EAE3] flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 text-[#A39E99]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#131211]">{data.sellerName}</p>
                      <p className="text-xs text-[#A39E99]">판매자</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : !loading && !error && (
            <div className="text-center py-12">
              <p className="text-[#A39E99]">견적서 정보가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div
          className="flex-shrink-0 px-5 pt-4 pb-8"
          style={{ paddingBottom: 'calc(2rem + var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)))' }}
        >
          {data && (data.status === 'pending' || data.status === 'accepted') && currentUserUuid && currentUserUuid !== data.sellerUuid ? (
            <button
              onClick={handlePurchase}
              className="w-full h-14 bg-[#131211] text-white rounded-2xl hover:bg-[#2a2928] transition-colors font-semibold text-base flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              구매하기
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="w-full h-14 bg-[#131211] text-white rounded-2xl hover:bg-[#2a2928] transition-colors font-semibold text-base"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </>
  );
}
