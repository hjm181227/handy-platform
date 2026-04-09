import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { purchaseApiService } from '../../services/purchaseApiService';

interface PaymentCancelProps {
  onGo: (path: string) => void;
}

export function PaymentCancel({ onGo }: PaymentCancelProps) {
  const { t } = useTranslation(['common', 'order']);
  const [isLoading, setIsLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState<{
    orderId?: string;
    payMethod?: string;
  }>({});

  useEffect(() => {
    const loadOrderAndRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('orderId');
      const payMethod = urlParams.get('payMethod');

      console.log('Payment cancelled:', { orderId, payMethod });
      setOrderInfo({ orderId: orderId || undefined, payMethod: payMethod || undefined });

      // 주문 정보 조회 및 SessionStorage에 저장
      if (orderId) {
        try {
          const orderResponse = await purchaseApiService.getOrder(orderId);

          if (orderResponse.success && orderResponse.order) {
            const order = orderResponse.order;

            // 타임스탬프와 함께 복원 정보 저장
            const restoreData = {
              shippingAddress: order.shippingAddress,
              paymentMethod: order.paymentMethod,
              orderId: orderId,
              timestamp: Date.now()
            };

            sessionStorage.setItem('restored-checkout', JSON.stringify(restoreData));
            console.log('✅ Checkout restoration data saved:', restoreData);
          }
        } catch (error) {
          console.error('Failed to load order for restoration:', error);
          // 에러가 발생해도 체크아웃으로 이동
        }
      }

      // 2초 후 체크아웃으로 리다이렉트 (캐시된 세션에서 mode 복원)
      const allowedModes = ['cart', 'direct', 'custom'];
      let savedMode = sessionStorage.getItem('checkout_mode') || '';
      const cachedSession = sessionStorage.getItem('checkout_session');
      if (cachedSession) {
        try { savedMode = JSON.parse(cachedSession).mode || savedMode; } catch { /* ignore */ }
      }
      let checkoutUrl = '/checkout';
      if (savedMode && allowedModes.includes(savedMode) && savedMode !== 'cart') {
        checkoutUrl = `/checkout?mode=${savedMode}`;
      }
      setTimeout(() => {
        setIsLoading(false);
        onGo(checkoutUrl);
      }, 2000);
    };

    loadOrderAndRedirect();
  }, [onGo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
          <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">{t('common:paymentCancelledTitle')}</h2>
          <p className="text-gray-600 mb-4">
            {t('common:paymentCancelled')}
          </p>

          {orderInfo.orderId && (
            <p className="text-sm text-gray-500 mb-6">
              {t('common:orderNumberLabel')}: {orderInfo.orderId}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#E85A6B]"></div>
            <p className="text-sm">{t('common:redirecting')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
        <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">{t('common:paymentCancelledTitle')}</h2>
        <p className="text-gray-600 mb-6">
          {t('common:paymentCancelledDesc')}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => {
              const allowed = ['cart', 'direct', 'custom'];
              let mode = sessionStorage.getItem('checkout_mode') || '';
              const cached = sessionStorage.getItem('checkout_session');
              if (cached) { try { mode = JSON.parse(cached).mode || mode; } catch {} }
              let url = '/checkout';
              if (mode && allowed.includes(mode) && mode !== 'cart') url = `/checkout?mode=${mode}`;
              onGo(url);
            }}
            className="w-full bg-[#E85A6B] text-white py-2 px-4 rounded-lg hover:bg-[#D14A5B]"
          >
            {t('common:retryPayment')}
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
      </div>
    </div>
  );
}