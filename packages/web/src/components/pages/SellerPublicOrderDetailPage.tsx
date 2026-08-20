// Usage:
// <Route path="/seller/custom-orders/public/:uuid" element={<SellerPublicOrderDetailPage />} />

import { useState, useEffect } from 'react';
import { orderService, sellerService } from '../../services/apiService';
import type { CustomOrderDetail } from '@handy-platform/shared';
import type { NailShape, NailLength } from '@handy-platform/shared';

// ─── Label maps ──────────────────────────────────────────────────────────────

const SHAPE_LABELS: Record<NailShape, string> = {
  ROUND: '라운드',
  ALMOND: '아몬드',
  OVAL: '오벌',
  STILETTO: '스틸레토',
  SQUARE: '스퀘어',
  COFFIN: '코핀',
};

const LENGTH_LABELS: Record<NailLength, string> = {
  SHORT: '숏',
  MEDIUM: '미디엄',
  LONG: '롱',
};

const FINGER_LABELS: Record<string, string> = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  pinky: '소지',
};

const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
      <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
      {children}
    </h2>
  );
}

// ─── Image lightbox ───────────────────────────────────────────────────────────

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(images.length - 1, i + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      role="dialog"
      aria-modal="true"
      aria-label="이미지 크게 보기"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors text-white"
        aria-label="닫기"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image */}
      <img
        src={images[idx]}
        alt={`참고 이미지 ${idx + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={e => e.stopPropagation()}
      />

      {/* Counter */}
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black bg-opacity-40 px-3 py-1 rounded-full">
        {idx + 1} / {images.length}
      </span>

      {/* Nav buttons */}
      {idx > 0 && (
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-colors"
          aria-label="이전 이미지"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {idx < images.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-colors"
          aria-label="다음 이미지"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Quote form modal ─────────────────────────────────────────────────────────

interface QuoteFormModalProps {
  onClose: () => void;
  onSubmit: (data: { price: number; processingDays: number; sellerNotes: string }) => Promise<void>;
  submitting: boolean;
  submitError: string | null;
}

function QuoteFormModal({ onClose, onSubmit, submitting, submitError }: QuoteFormModalProps) {
  const [price, setPrice] = useState('');
  const [processingDays, setProcessingDays] = useState('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const priceNum = Number(price);
    const daysNum = Number(processingDays);

    if (!price || isNaN(priceNum) || priceNum <= 0) {
      setValidationError('견적 가격을 올바르게 입력해주세요.');
      return;
    }
    if (!processingDays || isNaN(daysNum) || daysNum <= 0) {
      setValidationError('제작 기간을 올바르게 입력해주세요.');
      return;
    }

    await onSubmit({ price: priceNum, processingDays: daysNum, sellerNotes });
  };

  const error = validationError || submitError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <span className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 id="quote-modal-title" className="text-base font-semibold text-gray-900">
            견적서 작성
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-5 py-5 space-y-5">
            {/* Price */}
            <div>
              <label htmlFor="quote-price" className="block text-sm font-medium text-gray-700 mb-1.5">
                견적 가격 <span className="text-brand">*</span>
              </label>
              <div className="relative">
                <input
                  id="quote-price"
                  type="number"
                  min="1"
                  step="1"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="예: 50000"
                  required
                  className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
              </div>
              {price && !isNaN(Number(price)) && Number(price) > 0 && (
                <p className="mt-1 text-xs text-gray-500">{formatPrice(Number(price))}원</p>
              )}
            </div>

            {/* Processing days */}
            <div>
              <label htmlFor="quote-days" className="block text-sm font-medium text-gray-700 mb-1.5">
                제작 기간 <span className="text-brand">*</span>
              </label>
              <div className="relative">
                <input
                  id="quote-days"
                  type="number"
                  min="1"
                  step="1"
                  value={processingDays}
                  onChange={e => setProcessingDays(e.target.value)}
                  placeholder="예: 7"
                  required
                  className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">일</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="quote-notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                메모 <span className="text-xs font-normal text-gray-400">(선택)</span>
              </label>
              <textarea
                id="quote-notes"
                rows={3}
                value={sellerNotes}
                onChange={e => setSellerNotes(e.target.value)}
                placeholder="고객에게 전달할 메모를 입력해주세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-6 pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Spinner className="w-4 h-4 text-white" />
                  전송 중...
                </>
              ) : (
                '견적서 보내기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function InlineToast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
        ${type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}
      role="status"
      aria-live="polite"
    >
      {type === 'success' ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {message}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function SellerPublicOrderDetailPage({ uuid, onGo }: { uuid: string; onGo: (to: string) => void }) {

  const [order, setOrder] = useState<CustomOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Quote form
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Already-quoted state: derived from order.quotes if available,
  // or toggled to true after a successful submission
  const [alreadyQuoted, setAlreadyQuoted] = useState(false);
  const [myQuote, setMyQuote] = useState<{
    price: number;
    processingDays: number;
    notes?: string;
    issuedAt: string;
  } | null>(null);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch order detail ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setFetchError(null);

        // Try seller-specific endpoint first (includes myQuoteStatus context)
        const response = await orderService.getCustomOrderDetail(uuid);

        if (cancelled) return;

        const data = (response as any)?.data ?? response;

        if (data) {
          setOrder(data);

          // Check if there's already a quote from this seller in the quotes array
          const quotes = (data as CustomOrderDetail).quotes ?? [];
          if (quotes.length > 0) {
            // We take the first quote as "my quote" since we are the submitting seller
            const q = quotes[0];
            setAlreadyQuoted(true);
            setMyQuote({
              price: q.price,
              processingDays: q.processingDays,
              notes: q.sellerNotes,
              issuedAt: q.issuedAt,
            });
          }
        } else {
          setFetchError('주문서를 찾을 수 없습니다.');
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[SellerPublicOrderDetailPage] fetch error:', err);
          setFetchError(err?.message || '주문서를 불러오는데 실패했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetail();
    return () => { cancelled = true; };
  }, [uuid]);

  // ── Submit quote ────────────────────────────────────────────────────────────

  const handleSubmitQuote = async (data: {
    price: number;
    processingDays: number;
    sellerNotes: string;
  }) => {
    if (!uuid || !order) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const quotePayload = {
        estimatedPrice: data.price,
        estimatedDays: data.processingDays,
        notes: data.sellerNotes || undefined,
      };

      const quoteResponse = await sellerService.createCustomOrderQuote(uuid, quotePayload);
      const createdQuoteUuid = (quoteResponse as any)?.data?.quoteUuid;

      // Optimistically mark as quoted
      setAlreadyQuoted(true);
      setMyQuote({
        price: data.price,
        processingDays: data.processingDays,
        notes: data.sellerNotes || undefined,
        issuedAt: new Date().toISOString(),
      });

      setShowQuoteModal(false);
      showToast('견적서가 전송되었습니다');

      // Optional: send to chat channel — failure must not block success flow
      try {
        const { sendQuoteToChat } = await import('../../lib/chat/orderChatService');
        await sendQuoteToChat(order.userUuid, {
          quoteId: createdQuoteUuid || uuid,
          customOrderId: uuid,
          price: data.price,
          estimatedDays: data.processingDays,
          notes: data.sellerNotes || undefined,
        });
      } catch (chatError) {
        console.warn('채팅 전송 실패:', chatError);
      }

      setTimeout(() => history.back(), 1500);
    } catch (err: any) {
      console.error('[SellerPublicOrderDetailPage] submit quote error:', err);
      setSubmitError(err?.message || '견적서 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const specs = order?.specifications;
  const images = specs?.referenceImages ?? [];

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => history.back()}
            aria-label="뒤로 가기"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900">주문서 상세</h1>
        </div>
      </header>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3" aria-label="불러오는 중">
          <Spinner className="w-8 h-8 text-brand" />
          <span className="text-sm text-gray-500">주문서 불러오는 중...</span>
        </div>
      )}

      {/* ── Fetch error ── */}
      {!loading && fetchError && (
        <div className="flex flex-col items-center justify-center py-20 px-6 gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 text-center">{fetchError}</p>
          <button
            onClick={() => history.back()}
            className="px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors"
          >
            돌아가기
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {!loading && !fetchError && order && specs && (
        <main className="px-4 py-4 pb-28 max-w-2xl mx-auto space-y-3">

          {/* ── Order summary card ── */}
          <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            {/* Title */}
            <div>
              <p className="text-xs text-gray-400 mb-1">주문서 제목</p>
              <p className="text-base font-semibold text-gray-900 leading-snug">{order.title}</p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">고객 ID</p>
                <p className="text-sm font-medium text-gray-800 truncate">{order.userUuid}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">등록일</p>
                <p className="text-sm font-medium text-gray-800">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </section>

          {/* ── Specifications card ── */}
          <section className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
            <SectionHeading>네일 사양</SectionHeading>

            {/* Shape + length */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">쉐입</p>
                <p className="text-sm font-semibold text-gray-900">
                  {SHAPE_LABELS[specs.shape] ?? specs.shape}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">길이</p>
                <p className="text-sm font-semibold text-gray-900">
                  {LENGTH_LABELS[specs.length] ?? specs.length}
                </p>
              </div>
            </div>

            {/* Sizes table */}
            <div>
              <p className="text-xs text-gray-400 mb-2">사이즈 (mm)</p>
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <table className="w-full text-center">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-2 w-12" />
                      {FINGERS.map(finger => (
                        <th key={finger} className="py-2 px-1 text-xs font-medium text-gray-600">
                          {FINGER_LABELS[finger]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(['left', 'right'] as const).map((hand, rowIdx) => {
                      const handSizes = (specs.sizes as any)?.[hand];
                      if (!handSizes) return null;
                      return (
                        <tr
                          key={hand}
                          className={rowIdx === 0 ? 'border-b border-gray-200' : ''}
                        >
                          <td className="py-2.5 px-2 text-xs font-medium text-gray-500">
                            {hand === 'left' ? '왼손' : '오른손'}
                          </td>
                          {FINGERS.map(finger => (
                            <td key={finger} className="py-2.5 px-1">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-brand-50 text-brand text-xs font-bold rounded-full">
                                {handSizes[finger] ?? '-'}
                              </span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Extra requests */}
            {(specs.desiredColor || specs.desiredDate || specs.designNotes) && (
              <div className="space-y-3 pt-1">
                <SectionHeading>추가 요청</SectionHeading>
                {specs.desiredColor && (
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-gray-500 min-w-[80px]">원하는 색상</span>
                    <span className="text-sm font-medium text-gray-900">{specs.desiredColor}</span>
                  </div>
                )}
                {specs.desiredDate && (
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-gray-500 min-w-[80px]">수령 희망일</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(specs.desiredDate)}
                    </span>
                  </div>
                )}
                {specs.designNotes && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">요청사항</p>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {specs.designNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Reference images card ── */}
          {images.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm p-5">
              <SectionHeading>참고 이미지 ({images.length}장)</SectionHeading>
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1"
                    aria-label={`참고 이미지 ${idx + 1} 크게 보기`}
                  >
                    <img
                      src={url}
                      alt={`참고 이미지 ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Already quoted card ── */}
          {alreadyQuoted && myQuote && (
            <section className="bg-white rounded-2xl shadow-sm p-5 border border-brand border-opacity-30">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <p className="text-sm font-semibold text-brand">견적을 이미 보냈습니다</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">견적 가격</span>
                  <span className="text-sm font-bold text-gray-900">{formatPrice(myQuote.price)}원</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">제작 기간</span>
                  <span className="text-sm font-semibold text-gray-900">{myQuote.processingDays}일</span>
                </div>
                {myQuote.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1.5">메모</p>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{myQuote.notes}</p>
                    </div>
                  </div>
                )}
                <div className="pt-1 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    발송일: {formatDate(myQuote.issuedAt)}
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>
      )}

      {/* ── Floating bottom bar (quote CTA) ── */}
      {!loading && !fetchError && order && !alreadyQuoted && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 px-4 py-3 pb-safe">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => {
                setSubmitError(null);
                setShowQuoteModal(true);
              }}
              className="w-full py-3.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-600 active:bg-[#c44158] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              견적서 작성
            </button>
          </div>
        </div>
      )}

      {/* ── Quote form modal ── */}
      {showQuoteModal && (
        <QuoteFormModal
          onClose={() => !submitting && setShowQuoteModal(false)}
          onSubmit={handleSubmitQuote}
          submitting={submitting}
          submitError={submitError}
        />
      )}

      {/* ── Image lightbox ── */}
      {lightboxIndex !== null && images.length > 0 && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <InlineToast message={toast.message} type={toast.type} />}
    </div>
  );
}

