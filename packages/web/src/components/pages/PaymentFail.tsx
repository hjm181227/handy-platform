import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PaymentFailProps {
  onGo: (path: string) => void;
}

export function PaymentFail({ onGo }: PaymentFailProps) {
  const { t } = useTranslation(['common', 'order']);
  const [errorInfo, setErrorInfo] = useState<{
    orderId?: string;
    payMethod?: string;
    error?: string;
    code?: string;
    message?: string;
  }>({});

  useEffect(() => {
    // URL 파라미터에서 오류 정보 추출 (토스페이먼츠 및 기존 방식 호환)
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const payMethod = urlParams.get('payMethod');
    const error = urlParams.get('error');
    // 토스페이먼츠 오류 파라미터
    const code = urlParams.get('code');
    const message = urlParams.get('message');

    setErrorInfo({
      orderId: orderId || undefined,
      payMethod: payMethod || undefined,
      error: error || undefined,
      code: code || undefined,
      message: message || undefined,
    });
    console.log('Payment failed:', { orderId, payMethod, error, code, message });
  }, []);

  const getErrorMessage = () => {
    // 토스페이먼츠 에러 메시지 우선
    if (errorInfo.message) {
      return errorInfo.message;
    }

    // 토스페이먼츠 에러 코드에 따른 메시지
    if (errorInfo.code) {
      switch (errorInfo.code) {
        case 'PAY_PROCESS_CANCELED':
          return t('order:payment.errorCancelled');
        case 'PAY_PROCESS_ABORTED':
          return t('order:payment.errorAborted');
        case 'REJECT_CARD_COMPANY':
          return t('order:payment.errorCardRejected');
        case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
          return t('order:payment.errorDailyLimit');
        case 'EXCEED_MAX_PAYMENT_AMOUNT':
          return t('order:payment.errorAmountLimit');
        case 'INVALID_CARD_EXPIRATION':
          return t('order:payment.errorCardExpired');
        case 'INVALID_STOPPED_CARD':
          return t('order:payment.errorCardStopped');
        case 'INVALID_CARD_LOST_OR_STOLEN':
          return t('order:payment.errorCardLostStolen');
        case 'NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT':
          return t('order:payment.errorInstallmentNotSupported');
        default:
          return t('order:payment.errorPaymentGeneric', { code: errorInfo.code });
      }
    }

    // 기존 에러 처리
    if (errorInfo.error) {
      switch (errorInfo.error) {
        case 'TIMEOUT':
          return t('order:payment.errorTimeout');
        case 'INSUFFICIENT_FUNDS':
          return t('order:payment.errorInsufficientFunds');
        case 'CARD_ERROR':
          return t('order:payment.errorCardInfo');
        case 'NETWORK_ERROR':
          return t('order:payment.errorNetwork');
        default:
          return errorInfo.error;
      }
    }
    return t('order:payment.errorProcessingPayment');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
        <div className="text-red-500 text-4xl mb-4">❌</div>
        <h2 className="text-xl font-bold mb-2">{t('common:paymentFailedTitle')}</h2>
        <p className="text-gray-600 mb-2">
          {getErrorMessage()}
        </p>
        
        {(errorInfo.orderId || errorInfo.code) && (
          <div className="text-sm text-gray-500 mb-6 space-y-1">
            {errorInfo.orderId && <p>{t('common:orderNumberLabel')}: {errorInfo.orderId}</p>}
            {errorInfo.code && <p>{t('common:errorCodeLabel')}: {errorInfo.code}</p>}
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => {
              const allowed = ['cart', 'direct', 'custom'];
              const cached = sessionStorage.getItem('checkout_session');
              let url = '/checkout';
              if (cached) { try { const { mode } = JSON.parse(cached); if (mode && allowed.includes(mode) && mode !== 'cart') url = `/checkout?mode=${mode}`; } catch {} }
              onGo(url);
            }}
            className="w-full bg-[#E85A6B] text-white py-2 px-4 rounded-lg hover:bg-[#D14A5B]"
          >
            {t('common:retryCheckout')}
          </button>
          <button
            onClick={() => onGo('/cart')}
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
          >
            {t('common:goToCart')}
          </button>
          <button
            onClick={() => onGo('/')}
            className="w-full text-gray-500 py-2 px-4 rounded-lg hover:bg-gray-50"
          >
            {t('common:goToHome')}
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>{t('common:needHelp')}</strong><br />
            {t('common:customerService')}: 1588-0000<br />
            {t('common:customerServiceHours')}
          </p>
        </div>
      </div>
    </div>
  );
}