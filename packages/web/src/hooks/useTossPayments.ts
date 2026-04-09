import { useState, useEffect, useRef, useCallback } from 'react';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';

interface TossWidgets {
  setAmount: (amount: { currency: string; value: number }) => Promise<void>;
  renderPaymentMethods: (options: { selector: string; variantKey?: string }) => Promise<PaymentMethodWidget>;
  renderAgreement: (options: { selector: string; variantKey?: string }) => Promise<AgreementWidget>;
  requestPayment: (options: TossPaymentRequest) => Promise<void>;
  destroy?: () => Promise<void>;
}

export interface PaymentMethodWidget {
  on: (event: string, callback: (selectedPaymentMethod: SelectedPaymentMethod) => void) => void;
  getSelectedPaymentMethod: () => Promise<SelectedPaymentMethod>;
  destroy: () => Promise<void>;
}

export interface AgreementWidget {
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
  // 의존성에서 isReady 제거: isReady 전환 시 cleanup→재초기화 사이클이
  // widgetsRef를 일시적으로 null로 만들어 setAmount/renderPaymentMethods 사이
  // race condition 발생 (setAmount가 null 인스턴스에 무시됨 → renderPaymentMethods가
  // 새 인스턴스에 amount 없이 호출)
  useEffect(() => {
    // 이미 초기화 완료된 경우 스킵
    if (widgetsRef.current) {
      console.log('[useTossPayments] Already initialized, skipping');
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

    let cancelled = false;
    initializingRef.current = true;

    const initializeWidgets = async () => {
      try {
        setError(null);
        console.log('[useTossPayments] Loading TossPayments SDK...');

        const tossPayments = await loadTossPayments(clientKey);
        console.log('[useTossPayments] SDK loaded successfully');

        // 이미 다른 Effect에서 초기화 완료한 경우 (StrictMode 대응)
        if (widgetsRef.current || cancelled) {
          console.log('[useTossPayments] Widgets already created or effect cancelled, skipping');
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

        if (cancelled) {
          widgetsInstance.destroy?.().catch(() => {});
          initializingRef.current = false;
          return;
        }

        // 상태 업데이트 (StrictMode에서도 항상 실행)
        widgetsRef.current = widgetsInstance;
        setWidgets(widgetsInstance);
        setIsReady(true);
        console.log('[useTossPayments] SDK initialized successfully');
      } catch (err: unknown) {
        console.error('[useTossPayments] Initialization failed:', err);
        const errorMessage = err instanceof Error ? err.message : '결제 위젯 초기화에 실패했습니다.';
        if (!cancelled) {
          setError(errorMessage);
        }
      } finally {
        initializingRef.current = false;
      }
    };

    initializeWidgets();

    // unmount 시 widgets 인스턴스 정리
    return () => {
      cancelled = true;
      const w = widgetsRef.current;
      if (w) {
        console.log('[useTossPayments] Destroying widgets instance on unmount');
        w.destroy?.().catch(() => {});
        widgetsRef.current = null;
      }
      initializingRef.current = false;
    };
  }, [clientKey, customerKey]);

  // 금액 설정
  const setAmount = useCallback(async (amount: number) => {
    if (!widgetsRef.current) {
      throw new Error('결제 위젯이 초기화되지 않았습니다.');
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

/**
 * Toss 빌링키 발급 요청 (정기구독용)
 * 위젯 없이 Toss 결제창을 직접 호출하여 카드 등록 후 authKey를 받는다.
 * 성공 시 successUrl로 리다이렉트 (query: authKey, customerKey)
 */
export interface TossBillingAuthRequest {
  clientKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
}

export async function requestTossBillingAuth(options: TossBillingAuthRequest): Promise<void> {
  const { clientKey, customerKey, amount, orderId, orderName, successUrl, failUrl } = options;

  if (!clientKey) {
    throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.');
  }

  const tossPayments = await loadTossPayments(clientKey);

  // SDK v2: payment() 인스턴스를 통해 빌링 인증 요청
  const payment = tossPayments.payment({ customerKey });

  await (payment as any).requestBillingAuth({
    method: 'CARD',
    successUrl,
    failUrl,
  });
}
