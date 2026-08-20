import { useState, useEffect } from 'react';
import { orderService } from '../../services/apiService';
import type { CustomOrderDetail, QuoteDetail } from '@handy-platform/shared';
import { ArrowLeft, Clock, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '견적 대기중', color: '#F59E0B', bg: '#FEF3C7' },
  quoted: { label: '견적 발급됨', color: '#3B82F6', bg: '#DBEAFE' },
  approved: { label: '견적 승인됨', color: '#10B981', bg: '#D1FAE5' },
  in_production: { label: '제작 중', color: '#8B5CF6', bg: '#EDE9FE' },
  completed: { label: '완료', color: '#059669', bg: '#D1FAE5' },
  rejected: { label: '거절됨', color: '#EF4444', bg: '#FEE2E2' },
  cancelled: { label: '취소됨', color: '#6B7280', bg: '#F3F4F6' },
};

const SHAPE_LABELS: Record<string, string> = {
  ROUND: '라운드', SQUARE: '스퀘어', OVAL: '오벌',
  ALMOND: '아몬드', STILETTO: '스틸레토', COFFIN: '코핀', BALLERINA: '발레리나',
};

const LENGTH_LABELS: Record<string, string> = {
  SHORT: '숏', MEDIUM: '미디엄', LONG: '롱',
};

interface CustomOrderDetailPageProps {
  uuid: string;
  onGo: (to: string) => void;
}

export function CustomOrderDetailPage({ uuid, onGo }: CustomOrderDetailPageProps) {
  const [order, setOrder] = useState<CustomOrderDetail | null>(null);
  const [quotes, setQuotes] = useState<QuoteDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [detailRes, quotesRes] = await Promise.all([
        orderService.getCustomOrderDetail(uuid),
        orderService.getCustomOrderQuotes(uuid).catch(() => ({ success: false, data: { quotes: [], total: 0 } })),
      ]);

      if (detailRes.success && detailRes.data) {
        setOrder(detailRes.data);
      }

      if (quotesRes.success && quotesRes.data) {
        setQuotes(quotesRes.data.quotes || []);
      }
    } catch (err: any) {
      console.error('Failed to load custom order detail:', err);
      setError(err.message || '주문서를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [uuid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-lg mx-auto px-5 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-40 bg-gray-200 rounded-2xl" />
            <div className="h-32 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-lg mx-auto px-5 py-6 text-center">
          <p className="text-red-600 mb-4">{error || '주문서를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => onGo('/my/custom-orders')}
            className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-600"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const specs = order.specifications;
  const isPending = order.status === 'pending';

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-line">
        <div className="max-w-lg mx-auto flex items-center px-4 h-12">
          <button onClick={() => onGo('/my/custom-orders')} className="p-1 -ml-1">
            <ArrowLeft size={22} className="text-ink" />
          </button>
          <h1 className="flex-1 text-center text-[15px] font-semibold text-ink">주문서 상세</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-4 flex flex-col gap-3">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
          >
            {statusInfo.label}
          </span>
          <span className="text-xs text-muted">
            {new Date(order.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>

        {/* Order Info Card */}
        <div className="rounded-2xl bg-white border border-line p-4">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-lg font-bold text-ink">{order.title}</h2>
          </div>

          {order.visibility === 'public' && (
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand mb-3">
              공개 주문
            </span>
          )}

          {/* Specifications */}
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">네일 모양</span>
              <span className="font-medium text-ink">{SHAPE_LABELS[specs.shape] || specs.shape}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">네일 길이</span>
              <span className="font-medium text-ink">{LENGTH_LABELS[specs.length] || specs.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">주문 수량</span>
              <span className="font-medium text-ink">{(specs as any).quantity || 1}세트</span>
            </div>
            {specs.desiredColor && (
              <div className="flex justify-between">
                <span className="text-muted">원하는 컬러</span>
                <span className="font-medium text-ink">{specs.desiredColor}</span>
              </div>
            )}
            {specs.desiredDate && (
              <div className="flex justify-between">
                <span className="text-muted">수령 희망일</span>
                <span className="font-medium text-ink">{new Date(specs.desiredDate).toLocaleDateString('ko-KR')}</span>
              </div>
            )}
            {specs.designNotes && (
              <div>
                <span className="text-muted text-xs block mb-1">요청사항</span>
                <p className="text-sm text-ink bg-surface rounded-lg p-3">{specs.designNotes}</p>
              </div>
            )}
          </div>

          {/* Reference Images */}
          {specs.referenceImages && specs.referenceImages.length > 0 && (
            <div className="mt-3">
              <span className="text-muted text-xs block mb-2">참고 이미지</span>
              <div className="flex gap-2 overflow-x-auto">
                {specs.referenceImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImageModal(img)}
                    className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-line"
                  >
                    <img src={img} alt={`참고 이미지 ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nail Sizes */}
          <div className="mt-4 pt-3 border-t border-surface">
            <span className="text-muted text-xs block mb-2">손톱 사이즈</span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {(['left', 'right'] as const).map((hand) => (
                <div key={hand}>
                  <span className="font-medium text-ink block mb-1">{hand === 'left' ? '왼손' : '오른손'}</span>
                  <div className="space-y-0.5 text-muted">
                    {(['thumb', 'index', 'middle', 'ring', 'pinky'] as const).map((finger) => {
                      const labels = { thumb: '엄지', index: '검지', middle: '중지', ring: '약지', pinky: '소지' };
                      const value = specs.sizes[hand]?.[finger];
                      return value ? (
                        <div key={finger} className="flex justify-between">
                          <span>{labels[finger]}</span>
                          <span className="text-ink">{value}mm</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quotes Section */}
        <div className="rounded-2xl bg-white border border-line p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-ink">받은 견적</h3>
            <span className="text-xs text-muted">{quotes.length}건</span>
          </div>

          {quotes.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted">
              {isPending ? (
                <div className="flex flex-col items-center gap-2">
                  <Clock size={28} className="text-line-strong" />
                  <p>아직 받은 견적이 없습니다.</p>
                  <p className="text-xs">판매자들의 견적을 기다려주세요!</p>
                </div>
              ) : (
                <p>견적 정보가 없습니다.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {quotes.map((quote) => {
                const isExpanded = expandedQuote === quote.quoteUuid;
                const quoteStatusMap: Record<string, { label: string; color: string }> = {
                  pending: { label: '검토 대기', color: '#F59E0B' },
                  accepted: { label: '수락됨', color: '#10B981' },
                  rejected: { label: '거절됨', color: '#EF4444' },
                  expired: { label: '만료됨', color: '#6B7280' },
                };
                const qs = quoteStatusMap[quote.status] || quoteStatusMap.pending;

                return (
                  <div key={quote.quoteUuid} className="border border-line rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedQuote(isExpanded ? null : quote.quoteUuid)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-sm font-semibold text-ink text-left">
                            {quote.brandName || '판매자'}
                          </div>
                          <div className="text-xs text-muted">
                            {quote.price.toLocaleString()}원 · {quote.processingDays}일 소요
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold" style={{ color: qs.color }}>
                          {qs.label}
                        </span>
                        {isExpanded ? <ChevronUp size={16} className="text-line-strong" /> : <ChevronDown size={16} className="text-line-strong" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-surface">
                        <div className="mt-2 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted">견적 가격</span>
                            <span className="font-bold text-ink">{quote.price.toLocaleString()}원</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">제작 기간</span>
                            <span className="text-ink">{quote.processingDays}일</span>
                          </div>
                          {quote.sellerNotes && (
                            <div>
                              <span className="text-muted text-xs block mb-1">판매자 메모</span>
                              <p className="text-sm text-ink bg-surface rounded-lg p-2">{quote.sellerNotes}</p>
                            </div>
                          )}
                          <div className="text-xs text-muted">
                            발행일: {new Date(quote.issuedAt).toLocaleDateString('ko-KR')}
                          </div>
                        </div>

                        {/* Chat button to discuss with seller */}
                        <button
                          onClick={() => onGo(`/chat/${quote.sellerUuid}`)}
                          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-ink text-white text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                        >
                          <MessageCircle size={16} />
                          판매자에게 채팅하기
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cancel Button for pending orders */}
        {isPending && (
          <button
            onClick={() => {
              if (confirm('주문서를 취소하시겠습니까?')) {
                // Cancel would be handled via API - for now navigate back
                onGo('/my/custom-orders');
              }
            }}
            className="text-sm text-muted underline text-center py-2"
          >
            주문서 취소
          </button>
        )}
      </div>

      {/* Image Lightbox */}
      {imageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}
        >
          <img
            src={imageModal}
            alt="참고 이미지"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
