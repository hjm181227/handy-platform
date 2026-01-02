import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useTossPayments, TossPaymentRequest } from '../../hooks/useTossPayments';

interface TossPaymentWidgetProps {
  amount: number;
  customerKey: string | null; // 사용자 UUID 또는 null(비회원)
  onReady?: () => void;
  onError?: (error: string) => void;
  onPaymentMethodSelect?: (method: { code: string; type?: string }) => void;
}

export interface TossPaymentWidgetRef {
  requestPayment: (options: TossPaymentRequest) => Promise<void>;
}

export const TossPaymentWidget = forwardRef<TossPaymentWidgetRef, TossPaymentWidgetProps>(({
  amount,
  customerKey,
  onReady,
  onError,
  onPaymentMethodSelect,
}, ref) => {
  const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderingRef = useRef(false);

  const {
    isReady,
    error: initError,
    setAmount,
    renderPaymentMethods,
    renderAgreement,
    requestPayment,
  } = useTossPayments({
    clientKey,
    customerKey,
  });

  // 외부에서 requestPayment를 호출할 수 있도록 ref로 노출
  useImperativeHandle(ref, () => ({
    requestPayment: async (options: TossPaymentRequest) => {
      if (!isReady) {
        throw new Error('결제 위젯이 아직 준비되지 않았습니다.');
      }
      return requestPayment(options);
    },
  }), [isReady, requestPayment]);

  // SDK 준비 후 UI 렌더링
  useEffect(() => {
    if (!isReady || isRendered || renderingRef.current) return;

    renderingRef.current = true;

    const renderWidgets = async () => {
      try {
        console.log('[TossPaymentWidget] Starting render...');

        // 1. 금액 설정 (렌더링 전 필수)
        await setAmount(amount);

        // 2. 결제 UI 렌더링
        const paymentMethodWidget = await renderPaymentMethods('#toss-payment-method');

        // 3. 약관 UI 렌더링
        await renderAgreement('#toss-agreement');

        // 4. 결제수단 선택 이벤트 리스너
        if (paymentMethodWidget && onPaymentMethodSelect) {
          paymentMethodWidget.on('paymentMethodSelect', (selectedPaymentMethod) => {
            console.log('[TossPaymentWidget] Payment method selected:', selectedPaymentMethod);
            onPaymentMethodSelect({
              code: selectedPaymentMethod.code,
              type: selectedPaymentMethod.type,
            });
          });
        }

        setIsRendered(true);
        onReady?.();
        console.log('[TossPaymentWidget] Render completed');
      } catch (err: unknown) {
        console.error('[TossPaymentWidget] Render failed:', err);
        const errorMessage = err instanceof Error ? err.message : '결제 위젯 렌더링에 실패했습니다.';
        setRenderError(errorMessage);
        onError?.(errorMessage);
      } finally {
        renderingRef.current = false;
      }
    };

    renderWidgets();
  }, [isReady, amount, isRendered, setAmount, renderPaymentMethods, renderAgreement, onReady, onError, onPaymentMethodSelect]);

  // 금액 변경 시 업데이트
  useEffect(() => {
    if (!isRendered) return;

    const updateAmount = async () => {
      try {
        console.log('[TossPaymentWidget] Updating amount:', amount);
        await setAmount(amount);
      } catch (err: unknown) {
        console.error('[TossPaymentWidget] Amount update failed:', err);
      }
    };

    updateAmount();
  }, [amount, isRendered, setAmount]);

  // 에러 표시
  const error = initError || renderError;
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm font-medium">결제 수단 로드 실패</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <p className="text-gray-500 text-xs mt-2">
          페이지를 새로고침하거나, 잠시 후 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  // 로딩 상태
  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mt-3 text-gray-600 text-sm">결제 수단을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div>
      {/* 결제 수단 선택 UI - 토스페이먼츠 위젯이 자체 스타일 적용 */}
      <div
        id="toss-payment-method"
        ref={paymentMethodRef}
      />

      {/* 이용약관 UI */}
      <div
        id="toss-agreement"
        ref={agreementRef}
      />
    </div>
  );
});

// displayName 설정
TossPaymentWidget.displayName = 'TossPaymentWidget';

// requestPayment 함수를 외부에서 호출할 수 있도록 export
export { useTossPayments };
export type { TossPaymentRequest };
