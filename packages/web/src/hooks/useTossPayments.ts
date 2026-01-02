import { useState, useEffect, useRef, useCallback } from 'react';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';

interface TossWidgets {
  setAmount: (amount: { currency: string; value: number }) => Promise<void>;
  renderPaymentMethods: (options: { selector: string; variantKey?: string }) => Promise<PaymentMethodWidget>;
  renderAgreement: (options: { selector: string; variantKey?: string }) => Promise<AgreementWidget>;
  requestPayment: (options: TossPaymentRequest) => Promise<void>;
}

interface PaymentMethodWidget {
  on: (event: string, callback: (selectedPaymentMethod: SelectedPaymentMethod) => void) => void;
  getSelectedPaymentMethod: () => Promise<SelectedPaymentMethod>;
  destroy: () => Promise<void>;
}

interface AgreementWidget {
  on: (event: string, callback: (status: AgreementStatus) => void) => void;
  destroy: () => Promise<void>;
}

interface SelectedPaymentMethod {
  code: string;
  type?: string;
  easyPay?: {
    provider: string;
  };
}

interface AgreementStatus {
  agreedRequiredTerms: boolean;
}

export interface TossPaymentRequest {
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerEmail?: string;
  customerName?: string;
  customerMobilePhone?: string;
  taxFreeAmount?: number;
  metadata?: Record<string, string>;
}

interface UseTossPaymentsOptions {
  clientKey: string;
  customerKey: string | null; // null이면 ANONYMOUS 사용
}

interface UseTossPaymentsReturn {
  widgets: TossWidgets | null;
  isReady: boolean;
  error: string | null;
  setAmount: (amount: number) => Promise<void>;
  renderPaymentMethods: (selector: string, variantKey?: string) => Promise<PaymentMethodWidget | null>;
  renderAgreement: (selector: string, variantKey?: string) => Promise<AgreementWidget | null>;
  requestPayment: (options: TossPaymentRequest) => Promise<void>;
}

export function useTossPayments({ clientKey, customerKey }: UseTossPaymentsOptions): UseTossPaymentsReturn {
  const [widgets, setWidgets] = useState<TossWidgets | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgetsRef = useRef<TossWidgets | null>(null);
  const initializingRef = useRef(false);

  // SDK 초기화 (React 18 StrictMode 호환)
  useEffect(() => {
    // 이미 초기화 완료된 경우 스킵
    if (widgetsRef.current) {
      console.log('[useTossPayments] Already initialized, skipping');
      if (!isReady) {
        setIsReady(true);
      }
      return;
    }

    // 이미 초기화 중인 경우 스킵
    if (initializingRef.current) {
      console.log('[useTossPayments] Already initializing, skipping');
      return;
    }

    console.log('[useTossPayments] Starting initialization...', { clientKey: clientKey ? '***' : 'undefined', customerKey: customerKey ? '***' : 'null' });

    if (!clientKey) {
      console.error('[useTossPayments] Client key is missing!');
      setError('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.');
      return;
    }

    initializingRef.current = true;

    const initializeWidgets = async () => {
      try {
        setError(null);
        console.log('[useTossPayments] Loading TossPayments SDK...');

        const tossPayments = await loadTossPayments(clientKey);
        console.log('[useTossPayments] SDK loaded successfully');

        // 이미 다른 Effect에서 초기화 완료한 경우 (StrictMode 대응)
        if (widgetsRef.current) {
          console.log('[useTossPayments] Widgets already created by another effect, skipping');
          initializingRef.current = false;
          return;
        }

        // 회원/비회원 결제 분기
        // customerKey 유효성 검사: 최소 2자, 영문/숫자/특수문자 포함
        let validCustomerKey = customerKey;
        if (customerKey) {
          const isValid = customerKey.length >= 2 && /^[a-zA-Z0-9\-_=.@]+$/.test(customerKey);
          if (!isValid) {
            console.warn('[useTossPayments] Invalid customerKey format, using ANONYMOUS:', customerKey);
            validCustomerKey = null;
          }
        }

        const widgetOptions = validCustomerKey
          ? { customerKey: validCustomerKey }
          : { customerKey: ANONYMOUS };

        console.log('[useTossPayments] Creating widgets instance with options:', {
          isAnonymous: !validCustomerKey,
        });

        const widgetsInstance = tossPayments.widgets(widgetOptions) as unknown as TossWidgets;
        console.log('[useTossPayments] Widgets instance created');

        // 상태 업데이트 (StrictMode에서도 항상 실행)
        widgetsRef.current = widgetsInstance;
        setWidgets(widgetsInstance);
        setIsReady(true);
        console.log('[useTossPayments] SDK initialized successfully');
      } catch (err: unknown) {
        console.error('[useTossPayments] Initialization failed:', err);
        const errorMessage = err instanceof Error ? err.message : '결제 위젯 초기화에 실패했습니다.';
        setError(errorMessage);
      } finally {
        initializingRef.current = false;
      }
    };

    initializeWidgets();

    // StrictMode에서 cleanup이 호출되어도 상태를 초기화하지 않음
    // widgetsRef로 중복 초기화를 방지
  }, [clientKey, customerKey, isReady]);

  // 금액 설정
  const setAmount = useCallback(async (amount: number) => {
    if (!widgetsRef.current) {
      console.warn('[useTossPayments] Widgets not initialized');
      return;
    }

    try {
      console.log('[useTossPayments] Setting amount:', amount);
      await widgetsRef.current.setAmount({
        currency: 'KRW',
        value: amount,
      });
    } catch (err: unknown) {
      console.error('[useTossPayments] setAmount failed:', err);
      throw err;
    }
  }, []);

  // 결제 UI 렌더링
  const renderPaymentMethods = useCallback(async (selector: string, variantKey = 'DEFAULT'): Promise<PaymentMethodWidget | null> => {
    if (!widgetsRef.current) {
      throw new Error('결제 위젯이 초기화되지 않았습니다.');
    }

    console.log('[useTossPayments] Rendering payment methods...');
    return widgetsRef.current.renderPaymentMethods({
      selector,
      variantKey,
    });
  }, []);

  // 약관 UI 렌더링
  const renderAgreement = useCallback(async (selector: string, variantKey = 'AGREEMENT'): Promise<AgreementWidget | null> => {
    if (!widgetsRef.current) {
      throw new Error('결제 위젯이 초기화되지 않았습니다.');
    }

    console.log('[useTossPayments] Rendering agreement...');
    return widgetsRef.current.renderAgreement({
      selector,
      variantKey,
    });
  }, []);

  // 결제 요청
  const requestPayment = useCallback(async (options: TossPaymentRequest) => {
    if (!widgetsRef.current) {
      throw new Error('결제 위젯이 초기화되지 않았습니다.');
    }

    console.log('[useTossPayments] Requesting payment:', options);
    return widgetsRef.current.requestPayment(options);
  }, []);

  return {
    widgets,
    isReady,
    error,
    setAmount,
    renderPaymentMethods,
    renderAgreement,
    requestPayment,
  };
}
