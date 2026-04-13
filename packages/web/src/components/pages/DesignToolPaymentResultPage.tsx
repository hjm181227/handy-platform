import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useDesignToolAccess } from '../../hooks/useDesignToolAccess';

interface DesignToolPaymentResultPageProps {
  onGo: (to: string) => void;
  type: 'success' | 'fail';
}

export function DesignToolPaymentResultPage({ onGo, type }: DesignToolPaymentResultPageProps) {
  const { t } = useTranslation('common');
  const { confirmBilling, updateBillingMethod } = useDesignToolAccess(false);
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [mode, setMode] = useState<'new' | 'update'>('new');
  const confirmedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isUpdate = params.get('mode') === 'update';
    setMode(isUpdate ? 'update' : 'new');

    if (type === 'fail') {
      setStatus('failed');
      setErrorMessage(params.get('message') || t('designTool.payment.defaultError'));
      return;
    }

    if (confirmedRef.current) return;
    confirmedRef.current = true;

    const authKey = params.get('authKey');
    const customerKey = params.get('customerKey');
    const orderId = params.get('orderId');

    if (!authKey || !customerKey) {
      setStatus('failed');
      setErrorMessage(t('designTool.payment.authError'));
      return;
    }

    const confirmPayment = async () => {
      const success = isUpdate
        ? await updateBillingMethod(authKey, customerKey)
        : await confirmBilling(authKey, customerKey, orderId || '');
      if (success) {
        setStatus('completed');
      } else {
        setStatus('failed');
        setErrorMessage(
          isUpdate
            ? t('designTool.subscription.cardChangeFailed')
            : t('designTool.payment.registrationFailed'),
        );
      }
    };

    confirmPayment();
  }, [type, confirmBilling, updateBillingMethod, t]);

  if (status === 'processing') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('designTool.payment.processing')}</h2>
        <p className="text-gray-500">{t('designTool.payment.pleaseWait')}</p>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {mode === 'update'
            ? t('designTool.subscription.cardChangeSuccess')
            : t('designTool.payment.subscriptionComplete')}
        </h2>
        <p className="text-gray-500 mb-8">
          {mode === 'update'
            ? t('designTool.subscription.cardChangeSuccessDesc')
            : t('designTool.payment.subscriptionActivated')}
        </p>
        <button
          onClick={() => onGo('/design-tool')}
          className="w-full py-3 bg-pink-500 text-white rounded-xl font-semibold hover:bg-pink-600"
        >
          {t('designTool.payment.goToSubscription')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('designTool.payment.paymentFailed')}</h2>
      <p className="text-gray-500 mb-8">{errorMessage}</p>
      <div className="space-y-3">
        <button
          onClick={() => onGo('/design-tool')}
          className="w-full py-3 bg-pink-500 text-white rounded-xl font-semibold hover:bg-pink-600"
        >
          {t('designTool.payment.retry')}
        </button>
        <button
          onClick={() => onGo('/')}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
        >
          {t('designTool.payment.goHome')}
        </button>
      </div>
    </div>
  );
}
