import React, { useEffect, useState } from 'react';
import { ClipboardList, X, FileText, MessageSquare } from 'lucide-react';
import { CustomOrderMessageData } from '../../lib/chat/types';
import { orderService } from '../../services/apiService';
import { QuoteFormModal } from './QuoteFormModal';

interface CustomOrderBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  customOrderId?: string | null;  // API에서 조회할 주문서 ID
  data?: CustomOrderMessageData | null;  // 직접 전달된 데이터 (폴백용)
  isSeller?: boolean;  // 현재 사용자가 판매자인지 여부
  currentUserUuid?: string;  // 현재 사용자 UUID (견적서 권한 확인용)
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
  pending:       { label: '상담중',   bgColor: 'bg-amber-100',  textColor: 'text-amber-600' },
  quoted:        { label: '견적완료', bgColor: 'bg-purple-100',  textColor: 'text-purple-700' },
  approved:      { label: '결제대기', bgColor: 'bg-green-100',   textColor: 'text-green-700' },
  in_production: { label: '제작중',   bgColor: 'bg-brand-50',    textColor: 'text-brand' },
  completed:     { label: '완료',     bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
  rejected:      { label: '거절됨',   bgColor: 'bg-red-100',     textColor: 'text-red-700' },
  cancelled:     { label: '취소됨',   bgColor: 'bg-gray-100',    textColor: 'text-gray-500' },
};

export function CustomOrderBottomSheet({
  isOpen,
  onClose,
  customOrderId,
  data: initialData,
  isSeller = false,
  currentUserUuid,
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
              sellerUuid: orderDetail.sellerUuid,
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
          <div className="w-10 h-1 bg-line-strong rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 pb-4">
          <ClipboardList className="w-6 h-6 text-brand flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-ink">커스텀 주문서 상세</h2>
            {data && (
              <p className="text-xs text-muted">
                {data.brandName ? `${data.brandName}` : ''}
                {data.status && ` · ${statusConfig.label}`}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center flex-shrink-0"
          >
            <X className="w-6 h-6 text-muted" />
          </button>
        </div>
        <div className="h-px bg-surface" />

        {/* 본문 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          {/* 로딩 상태 */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand mx-auto mb-4"></div>
              <p className="text-muted">주문서 정보를 불러오는 중...</p>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-muted">{error}</p>
            </div>
          )}

          {/* 데이터 표시 */}
          {data && !loading && !error ? (
            <div className="space-y-6">
              {/* 주문 정보 */}
              <div>
                <h3 className="text-[15px] font-bold text-ink mb-3">주문 정보</h3>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="text-sm text-muted w-20">모양</span>
                    <span className="text-sm font-medium text-ink">{shapeLabel}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-muted w-20">길이</span>
                    <span className="text-sm font-medium text-ink">{lengthLabel}</span>
                  </div>
                  {data.title && (
                    <div className="flex">
                      <span className="text-sm text-muted w-20">스타일</span>
                      <span className="text-sm font-medium text-ink">{data.title}</span>
                    </div>
                  )}
                  {data.desiredColor && (
                    <div className="flex">
                      <span className="text-sm text-muted w-20">컬러</span>
                      <span className="text-sm font-medium text-ink">{data.desiredColor}</span>
                    </div>
                  )}
                  {data.desiredDate && (
                    <div className="flex">
                      <span className="text-sm text-muted w-20">희망일</span>
                      <span className="text-sm font-medium text-ink">
                        {new Date(data.desiredDate).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-px bg-surface" />

              {/* 양손 사이즈 */}
              {/* 사이즈 정보 */}
              <div>
                <h3 className="text-[15px] font-bold text-ink mb-3">사이즈 정보</h3>
                <div className="bg-surface rounded-[10px] overflow-hidden">
                  {data.sizes.left ? (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-surface-strong">
                          <th className="px-2 py-2 text-xs font-medium text-muted text-center w-10"></th>
                          {Object.keys(data.sizes.left).map((finger) => (
                            <th key={finger} className="px-2 py-2 text-xs font-medium text-muted text-center">
                              {FINGER_LABELS[finger] || finger}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-surface-strong">
                          <td className="px-2 py-2.5 text-xs font-medium text-muted text-center">왼손</td>
                          {Object.values(data.sizes.left).map((size, idx) => (
                            <td key={idx} className="px-2 py-2.5 text-center text-sm font-medium text-ink">
                              {size}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-2 py-2.5 text-xs font-medium text-muted text-center">오른손</td>
                          {Object.values(data.sizes.right).map((size, idx) => (
                            <td key={idx} className="px-2 py-2.5 text-center text-sm font-medium text-ink">
                              {size}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-surface-strong">
                          {Object.keys(data.sizes).map((finger) => (
                            <th key={finger} className="px-2 py-2 text-xs font-medium text-muted text-center">
                              {FINGER_LABELS[finger] || finger}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {Object.values(data.sizes).map((size, idx) => (
                            <td key={idx} className="px-2 py-2.5 text-center text-sm font-medium text-ink">
                              {String(size)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              <div className="h-px bg-surface" />

              {/* 참고 이미지 */}
              {data.referenceImages && data.referenceImages.length > 0 && (
                <>
                  <div>
                    <h3 className="text-[15px] font-bold text-ink mb-3">참고 이미지</h3>
                    <div className="flex gap-2.5">
                      {data.referenceImages.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(url)}
                          className="w-[100px] h-[100px] rounded-xl overflow-hidden bg-surface hover:opacity-90 transition-opacity flex-shrink-0"
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
                  <div className="h-px bg-surface" />
                </>
              )}

              {/* 요청사항 */}
              {data.designNotes && (
                <div>
                  <h3 className="text-[15px] font-bold text-ink mb-2.5">요청사항</h3>
                  <div className="bg-amber-50 rounded-[10px] p-3.5 flex gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-amber-800 whitespace-pre-wrap">{data.designNotes}</p>
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
          className="flex-shrink-0 px-5 pt-4 pb-8"
          style={{ paddingBottom: 'calc(2rem + var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)))' }}
        >
          {isSeller && data && data.status === 'pending' && currentUserUuid && data.sellerUuid === currentUserUuid ? (
            <button
              onClick={() => setShowQuoteModal(true)}
              className="w-full h-14 bg-ink text-white rounded-2xl hover:bg-ink transition-colors font-semibold text-base flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              견적서 작성하기
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="w-full h-14 bg-ink text-white rounded-2xl hover:bg-ink transition-colors font-semibold text-base"
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
            <X className="w-6 h-6 text-white" />
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
