import React, { useEffect, useState } from 'react';
import { CustomOrderMessageData } from '../../lib/chat/types';
import { orderService } from '../../services/apiService';
import { QuoteFormModal } from './QuoteFormModal';

interface CustomOrderBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  customOrderId?: string | null;  // API에서 조회할 주문서 ID
  data?: CustomOrderMessageData | null;  // 직접 전달된 데이터 (폴백용)
  isSeller?: boolean;  // 현재 사용자가 판매자인지 여부
  buyerUuid?: string;  // 구매자 UUID (견적서 전송용)
  onQuoteSent?: () => void;  // 견적서 전송 완료 콜백
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

// 손가락 한글 변환
const FINGER_LABELS: Record<string, string> = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  pinky: '소지'
};

// 상태 설정
const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  pending: { label: '검토중', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  accepted: { label: '승인됨', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: '거절됨', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  completed: { label: '완료', bgColor: 'bg-blue-100', textColor: 'text-blue-700' }
};

export function CustomOrderBottomSheet({
  isOpen,
  onClose,
  customOrderId,
  data: initialData,
  isSeller = false,
  buyerUuid,
  onQuoteSent
}: CustomOrderBottomSheetProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [data, setData] = useState<CustomOrderMessageData | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  // customOrderId가 있으면 API에서 조회
  useEffect(() => {
    if (isOpen && customOrderId && !initialData) {
      setLoading(true);
      setError(null);

      orderService.getCustomOrderDetail(customOrderId)
        .then(res => {
          if (res.success && res.data) {
            // API 응답을 CustomOrderMessageData 형식으로 변환
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
            setError('주문서 정보를 불러올 수 없습니다');
          }
        })
        .catch(err => {
          console.error('[CustomOrderBottomSheet] API error:', err);
          setError('주문서 정보를 불러오는 중 오류가 발생했습니다');
        })
        .finally(() => setLoading(false));
    } else if (initialData) {
      setData(initialData);
    }
  }, [isOpen, customOrderId, initialData]);

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

  if (!isOpen && !isAnimating) return null;

  const statusConfig = data ? STATUS_CONFIG[data.status] || STATUS_CONFIG.pending : STATUS_CONFIG.pending;
  const shapeLabel = data ? SHAPE_LABELS[data.shape] || data.shape : '';
  const lengthLabel = data ? LENGTH_LABELS[data.length] || data.length : '';

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
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-bold text-gray-900">커스텀 주문서</h2>
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
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500">주문서 정보를 불러오는 중...</p>
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
              {/* 제목 */}
              <div className="pb-4 border-b border-gray-100">
                <p className="text-lg font-semibold text-gray-900">{data.title}</p>
                {data.brandName && (
                  <p className="text-sm text-gray-500 mt-1">{data.brandName}</p>
                )}
              </div>

              {/* 기본 정보 - 쉐입/길이 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  기본 정보
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">쉐입</p>
                    <p className="font-medium text-gray-900">{shapeLabel}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">길이</p>
                    <p className="font-medium text-gray-900">{lengthLabel}</p>
                  </div>
                </div>
              </div>

              {/* 양손 사이즈 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  사이즈 정보
                </h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 text-center w-12"></th>
                        {Object.keys(data.sizes.left).map((finger) => (
                          <th key={finger} className="px-2 py-2 text-xs font-medium text-gray-600 text-center">
                            {FINGER_LABELS[finger] || finger}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="px-2 py-2.5 text-xs font-medium text-gray-500 text-center">왼손</td>
                        {Object.values(data.sizes.left).map((size, idx) => (
                          <td key={idx} className="px-2 py-2.5 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 font-bold rounded-full text-sm">
                              {size}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-2 py-2.5 text-xs font-medium text-gray-500 text-center">오른손</td>
                        {Object.values(data.sizes.right).map((size, idx) => (
                          <td key={idx} className="px-2 py-2.5 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 font-bold rounded-full text-sm">
                              {size}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 추가 요청 */}
              {(data.desiredColor || data.desiredDate || data.designNotes) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    추가 요청
                  </h3>
                  <div className="space-y-3">
                    {data.desiredColor && (
                      <div className="flex items-start gap-3">
                        <span className="text-sm text-gray-500 min-w-[80px]">원하는 색상</span>
                        <span className="text-sm font-medium text-gray-900">{data.desiredColor}</span>
                      </div>
                    )}
                    {data.desiredDate && (
                      <div className="flex items-start gap-3">
                        <span className="text-sm text-gray-500 min-w-[80px]">수령 희망일</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(data.desiredDate).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    )}
                    {data.designNotes && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">요청사항</p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{data.designNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 참고 이미지 */}
              {data.referenceImages && data.referenceImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    참고 이미지 ({data.referenceImages.length}장)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {data.referenceImages.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(url)}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={url}
                          alt={`참고 이미지 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !loading && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500">주문서 정보가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div
          className="flex-shrink-0 px-6 pt-4 pb-6 border-t border-gray-200 bg-gray-50"
          style={{ paddingBottom: 'calc(1.5rem + var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)))' }}
        >
          {isSeller && data && data.status === 'pending' ? (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                닫기
              </button>
              <button
                onClick={() => setShowQuoteModal(true)}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
              >
                견적서 작성하기
              </button>
            </div>
          ) : (
            <button
              onClick={handleClose}
              className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
            >
              닫기
            </button>
          )}
        </div>
      </div>

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="확대된 이미지"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      {/* 견적서 작성 모달 */}
      {customOrderId && buyerUuid && (
        <QuoteFormModal
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          customOrderId={customOrderId}
          buyerUuid={buyerUuid}
          onSuccess={() => {
            setShowQuoteModal(false);
            handleClose();
            if (onQuoteSent) onQuoteSent();
          }}
        />
      )}
    </>
  );
}
