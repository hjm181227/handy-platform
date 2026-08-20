import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Package } from 'lucide-react';
import { useAlert } from '../common';
import { orderService } from '../../services/apiService';
import { money } from '../../utils';
import type { Order } from '@handy-platform/shared';

interface PaymentSuccessProps {
  onGo: (path: string) => void;
}

export function PaymentSuccess({ onGo }: PaymentSuccessProps) {
  const { t } = useTranslation(['common', 'order']);
  const { alert, error: showError } = useAlert();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderResult = async () => {
      try {
        // URL 파라미터 추출 (토스페이먼츠 결제 콜백 또는 기존 방식)
        const urlParams = new URLSearchParams(window.location.search);
        const paymentKey = urlParams.get('paymentKey');
        const orderId = urlParams.get('orderId');
        const amount = urlParams.get('amount');
        const status = urlParams.get('status'); // 기존 방식 호환

        console.log('🔵 [PaymentSuccess] Payment callback received:', { paymentKey, orderId, amount, status });

        if (!orderId || orderId === 'undefined') {
          throw new Error(t('order:payment.invalidOrder'));
        }

        // 토스페이먼츠 결제 승인 처리
        if (paymentKey && amount) {
          console.log('💳 [PaymentSuccess] Approving Toss payment...');

          // 백엔드 결제 승인 API 호출 (unified-payments-api.md 형식)
          const approveResponse = await orderService.approvePayment({
            orderId,
            payMethod: 'TOSS_PAYMENTS',
            approvalData: {
              paymentKey,
              amount: parseInt(amount, 10),
            },
          });

          console.log('✅ [PaymentSuccess] Toss payment approved:', approveResponse);

          if (!approveResponse.success) {
            throw new Error(approveResponse.error || t('order:payment.approvalFailed'));
          }

          // 결제 확정 — 체크아웃 캐시 전체 정리
          sessionStorage.removeItem('checkout_session');
          sessionStorage.removeItem('checkout_mode');
          sessionStorage.removeItem('checkoutData');
        } else if (status && status !== 'completed') {
          // 기존 방식: status 파라미터 확인
          const errorMsg = status === 'fail'
            ? t('order:payment.errorProcessingPayment')
            : status === 'cancel'
            ? t('order:payment.cancelled')
            : t('order:payment.paymentNotCompleted');
          throw new Error(errorMsg);
        }

        // 주문 정보 조회
        console.log('📦 [PaymentSuccess] Fetching order details...');
        const response = await orderService.getOrder(orderId);

        console.log('✅ [PaymentSuccess] Order fetched:', response);

        // 서버 응답: { success: true, order: { ... } } (data 래핑 없음)
        if (response.success && (response as any).order) {
          const order = (response as any).order;

          // Order 결제 상태 검증 (중요!)
          if (order.paymentStatus !== 'paid') {
            console.error('❌ [PaymentSuccess] Order payment not completed:', {
              paymentStatus: order.paymentStatus,
              status: order.status
            });
            throw new Error(t('order:payment.paymentNotCompleted'));
          }

          // Order 주문 상태 검증 (경고)
          if (order.status !== 'confirmed') {
            console.warn('⚠️ [PaymentSuccess] Order status is not confirmed:', order.status);
            // confirmed가 아니어도 paymentStatus가 paid면 허용 (백엔드 업데이트 지연 가능)
          }

          console.log('✅ [PaymentSuccess] Order payment verified:', {
            paymentStatus: order.paymentStatus,
            status: order.status
          });

          setOrder(order);

          // 견적서 체크아웃 캐시 정리
          const referrer = document.referrer || '';
          const refUrl = new URL(referrer, window.location.origin);
          const qUuid = refUrl.searchParams.get('quoteUuid');
          if (qUuid) sessionStorage.removeItem(`quote_checkout_${qUuid}`);

          // 성공 알림
          await alert(t('order:payment.successMessage'), {
            variant: 'success',
            title: t('order:payment.successTitle')
          });
        } else {
          throw new Error(response.error || t('order:payment.orderLoadError'));
        }

      } catch (error: any) {
        console.error('❌ [PaymentSuccess] Failed to fetch order:', error);
        await showError(error, {
          title: t('common:orderLoadFailed')
        });
        setErrorMessage(error.message || t('order:payment.orderLoadingError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderResult();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{t('common:loadingOrder')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('common:pleaseWait')}</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('common:orderLoadFailed')}</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <div className="space-y-3">
            <button
              onClick={() => onGo('/cart')}
              className="w-full bg-brand text-white py-2 px-4 rounded-lg hover:bg-brand-600"
            >
              {t('common:goToCart')}
            </button>
            <button
              onClick={() => onGo('/')}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
            >
              {t('common:goToHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('common:orderNotFound')}</h2>
          <p className="text-gray-600 mb-6">{t('common:orderNotFoundDesc')}</p>
          <button
            onClick={() => onGo('/')}
            className="w-full bg-brand text-white py-2 px-4 rounded-lg hover:bg-brand-600"
          >
            {t('common:goHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-green-600">{t('order:payment.successTitle')}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border p-8 text-center mb-6">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('order:payment.successMessage')}</h2>
          <p className="text-gray-600 mb-6">{t('order:payment.orderProcessed')}</p>

          <div className="space-y-6">
            {/* 주문 정보 */}
            <div className="bg-gray-50 rounded-lg p-6 text-left">
              <h3 className="text-lg font-semibold mb-4">{t('order:checkout.orderSummary')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('common:orderNumberLabel')}</span>
                  <span className="font-medium">{order.orderNumber || order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('order:payment.paymentMethod')}</span>
                  <span className="font-medium">
                    {(() => {
                      const method = order.paymentMethod as string;
                      const methodMap: Record<string, string> = {
                        'KAKAO_PAY': t('order:payment.kakaoPay'),
                        'NAVER_PAY': t('order:payment.naverPay'),
                        'CREDIT_CARD': t('order:payment.creditCard'),
                        'TOSS_PAYMENTS': t('order:payment.tossPayments'),
                        'TOSS_PAY': t('order:payment.tossPay'),
                        'CARD': t('order:payment.cardPayment'),
                      };
                      return methodMap[method] || method || '-';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('order:payment.paymentAmount')}</span>
                  <span className="font-bold text-brand">
                    {money(order.totalAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('order:payment.orderDate')}</span>
                  <span className="font-medium">
                    {new Date(order.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('order:payment.orderStatus')}</span>
                  <span className="font-medium text-green-600">
                    {order.status === 'confirmed' && t('order:payment.paidStatus')}
                    {order.status === 'pending' && t('order:payment.processingStatus')}
                    {!['confirmed', 'pending'].includes(order.status || '') && order.status}
                  </span>
                </div>
              </div>
            </div>

            {/* 주문 상품 */}
            {order.items && order.items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6 text-left">
                <h3 className="text-lg font-semibold mb-4">{t('order:payment.orderItems')}</h3>
                <div className="space-y-4">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 p-3 bg-white rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName || 'Product'}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.productName || t('order:payment.productName')}</h4>
                        <p className="text-sm text-gray-500">{t('order:payment.sellerLabel')}: {item.sellerName || ''}</p>
                        <p className="text-sm text-gray-600">{t('order:payment.quantityUnit', { count: item.quantity })}</p>
                        <p className="text-sm font-medium">{money(item.price || 0)}</p>
                        {item.subtotal && item.subtotal !== item.price && (
                          <p className="text-sm font-semibold text-brand">{t('order:payment.subtotal')}: {money(item.subtotal)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 배송지 정보 */}
            {order.shippingAddress && (
              <div className="bg-gray-50 rounded-lg p-6 text-left">
                <h3 className="text-lg font-semibold mb-4">{t('order:payment.shippingInfo')}</h3>
                <div className="space-y-2">
                  <p className="font-medium">{(order.shippingAddress as any).recipientName || t('order:shipping.recipient')}</p>
                  <p className="text-gray-600">{(order.shippingAddress as any).recipientPhone || t('order:shipping.phone')}</p>
                  <p className="text-gray-600">
                    {(order.shippingAddress as any).roadAddress}
                    {(order.shippingAddress as any).detailAddress && `, ${(order.shippingAddress as any).detailAddress}`}
                  </p>
                  <p className="text-gray-600">{t('order:payment.postcode')}: {(order.shippingAddress as any).postcode}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onGo(`/orders/${order.id}`)}
            className="bg-brand text-white py-3 px-6 rounded-lg hover:bg-brand-600 font-medium"
          >
            {t('common:goToOrders')}
          </button>
          <button
            onClick={() => onGo('/')}
            className="border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 font-medium"
          >
            {t('order:complete.continueShopping')}
          </button>
        </div>
      </div>
    </div>
  );
}
