import React, { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';

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
  isSeller: boolean;
  onPurchase?: (quoteId: string) => void;
}

// 상태 설정
const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  pending: { label: '대기중', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  accepted: { label: '수락됨', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: '거절됨', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  expired: { label: '만료됨', bgColor: 'bg-gray-100', textColor: 'text-gray-500' }
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

// API Base URL
const API_BASE_URL = (window as any).__VITE_API_BASE_URL__ || '';

export function QuoteBottomSheet({
  isOpen,
  onClose,
  quoteId,
  isSeller,
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

  // quoteId가 있으면 API에서 조회
  useEffect(() => {
    if (isOpen && quoteId) {
      setLoading(true);
      setError(null);

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
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#E85A6B]" />
            <h2 className="text-lg font-bold text-gray-900">견적서</h2>
            {data && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          {/* 로딩 상태 */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-500">견적서 정보를 불러오는 중...</p>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-gray-500">{error}</p>
            </div>
          )}

          {/* 데이터 표시 */}
          {data && !loading && !error ? (
            <div className="space-y-6">
              {/* 가격 - 강조 표시 */}
              <div className="bg-emerald-50 rounded-2xl p-6 text-center">
                <p className="text-sm text-emerald-600 mb-2">견적 금액</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatPrice(data.price)}
                  <span className="text-lg font-normal text-gray-500">원</span>
                </p>
              </div>

              {/* 제작 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">예상 제작일</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{data.processingDays}일</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">견적일</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{formatDate(data.createdAt)}</p>
                </div>
              </div>

              {/* 연결된 주문서 정보 */}
              {data.customOrder && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    연결된 주문서
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-2">{data.customOrder.title}</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-white text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                        {shapeLabel}
                      </span>
                      <span className="px-2 py-1 bg-white text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                        {lengthLabel}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 판매자 메모 */}
              {data.sellerNotes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    판매자 메모
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{data.sellerNotes}</p>
                  </div>
                </div>
              )}

              {/* 판매자 정보 */}
              {data.sellerName && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                    {data.sellerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{data.sellerName}</p>
                    <p className="text-xs text-gray-500">판매자</p>
                  </div>
                </div>
              )}
            </div>
          ) : !loading && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500">견적서 정보가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div
          className="flex-shrink-0 px-6 pt-4 pb-6 border-t border-gray-200 bg-gray-50"
          style={{ paddingBottom: 'calc(1.5rem + var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)))' }}
        >
          {!isSeller && data && data.status === 'pending' ? (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                닫기
              </button>
              <button
                onClick={handlePurchase}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
              >
                구매하기
              </button>
            </div>
          ) : (
            <button
              onClick={handleClose}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </>
  );
}
