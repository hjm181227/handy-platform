import React, { useState } from 'react';
import { Receipt, X } from 'lucide-react';
import { sellerService } from '../../services/apiService';
import { sendQuoteToChat } from '../../lib/chat/orderChatService';

interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customOrderId: string;
  buyerUuid: string;  // 구매자 UUID (채팅방 ID로 사용)
  onSuccess?: () => void;
}

export function QuoteFormModal({
  isOpen,
  onClose,
  customOrderId,
  buyerUuid,
  onSuccess
}: QuoteFormModalProps) {
  const [price, setPrice] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 가격 입력 핸들러 (숫자만 허용, 천단위 콤마 포맷팅)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPrice(value);
  };

  // 가격 표시 포맷팅
  const formatDisplayPrice = (value: string) => {
    if (!value) return '';
    return new Intl.NumberFormat('ko-KR').format(parseInt(value));
  };

  // 예상 제작일 입력 핸들러 (숫자만 허용)
  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (parseInt(value) <= 365 || value === '') {
      setEstimatedDays(value);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setPrice('');
    setEstimatedDays('');
    setNotes('');
    setError(null);
  };

  // 모달 닫기
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 견적서 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!price || parseInt(price) <= 0) {
      setError('가격을 입력해주세요');
      return;
    }
    if (!estimatedDays || parseInt(estimatedDays) <= 0) {
      setError('예상 제작일을 입력해주세요');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. 견적서 생성 API 호출
      const quoteResponse = await sellerService.createCustomOrderQuote(customOrderId, {
        estimatedPrice: parseInt(price),
        estimatedDays: parseInt(estimatedDays),
        notes: notes.trim() || undefined
      });

      if (!quoteResponse.success) {
        throw new Error(String(quoteResponse.error || '견적서 생성에 실패했습니다'));
      }

      // 2. 응답에서 quoteId 추출 (백엔드에서 data.quoteUuid 반환)
      const quoteId = (quoteResponse as any).data?.quoteUuid;

      if (!quoteId) {
        console.warn('[QuoteFormModal] No quoteId returned from API, skipping chat message');
        // quoteId가 없어도 성공 처리
        handleClose();
        if (onSuccess) onSuccess();
        return;
      }

      // 3. 채팅으로 견적서 전송
      const chatResult = await sendQuoteToChat(buyerUuid, {
        quoteId,
        customOrderId,
        price: parseInt(price),
        estimatedDays: parseInt(estimatedDays),
        notes: notes.trim() || undefined
      });

      if (!chatResult.success) {
        // 견적서는 저장됐지만 구매자에게 전달되지 않았다. 모달을 닫아버리면
        // 판매자는 전달된 줄 알고 답을 기다리게 되므로 여기서 멈추고 알린다.
        console.warn('[QuoteFormModal] Quote saved but chat delivery failed:', chatResult.error);
        setError(
          `견적서는 저장됐지만 구매자에게 전달하지 못했습니다. 채팅방에서 다시 보내주세요. (${chatResult.error ?? '전송 실패'})`
        );
        return;
      }

      // 4. 성공 처리
      handleClose();
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error('[QuoteFormModal] Error:', err);
      setError(err instanceof Error ? err.message : '견적서 생성 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-[60] bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* 모달 */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#E85A6B]" />
              <h2 className="text-lg font-bold text-gray-900">견적서 작성</h2>
            </div>
            <button
              onClick={handleClose}
              className="w-6 h-6 flex items-center justify-center flex-shrink-0"
            >
              <X className="w-6 h-6 text-[#A39E99]" />
            </button>
          </div>

          {/* 본문 - 폼 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* 가격 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                견적 금액 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatDisplayPrice(price)}
                  onChange={handlePriceChange}
                  placeholder="0"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-semibold text-right"
                  disabled={loading}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>

            {/* 예상 제작일 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예상 제작일 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={estimatedDays}
                  onChange={handleDaysChange}
                  placeholder="0"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-semibold text-right"
                  disabled={loading}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">일</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">제작 완료까지 예상되는 기간을 입력해주세요</p>
            </div>

            {/* 메모 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모 <span className="text-gray-400">(선택)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="구매자에게 전달할 메모를 입력해주세요"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-sm"
                disabled={loading}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">{notes.length}/500</p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>전송 중...</span>
                  </>
                ) : (
                  <span>견적서 보내기</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
