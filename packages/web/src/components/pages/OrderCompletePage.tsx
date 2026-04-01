import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../common';
import { webApiService } from '../../services/apiService';
import { money } from '../../utils';
import type { CustomerOrder } from '@handy-platform/shared';

interface OrderCompletePageProps {
  onGo: (path: string) => void;
  orderId: string;
}

export function OrderCompletePage({ onGo, orderId }: OrderCompletePageProps) {
  const { t } = useTranslation(['common', 'order']);
  const { alert, error: showError } = useAlert();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 주문 정보 로드
  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📡 [OrderCompletePage] Fetching order:', orderId);
      const response = await webApiService.order.getOrder(orderId);

      console.log('📡 [OrderCompletePage] Raw response:', response);

      // 서버 응답 구조: { success: true, order: { ... } }
      if (response.success && (response as any).order) {
        console.log('✅ [OrderCompletePage] Order loaded successfully:', (response as any).order);
        setOrder((response as any).order);
      } else {
        console.error('❌ [OrderCompletePage] Invalid response structure:', response);
        throw new Error((response as any).message || t('order:payment.orderLoadError'));
      }
    } catch (err: any) {
      console.error('❌ [OrderCompletePage] Order loading failed:', err);
      setError(err.message || t('common:orderLoadFailed'));
      await showError(err, {
        title: t('common:orderLoadFailed'),
        showRetry: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      loadOrder();
      // 장바구니 비우기 (주문 완료 후)
      webApiService.cart.clearCart().catch(console.error);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common:confirmingOrder')}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">{t('common:orderNotFound')}</h2>
          <p className="text-gray-600 mb-6">{error || t('common:orderLoadFailedDesc')}</p>
          <button
            onClick={() => onGo('/')}
            className="w-full bg-[#E85A6B] text-white py-2 px-4 rounded-lg hover:bg-[#D14A5B]"
          >
            {t('common:goHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 성공 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-500 text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('order:complete.message')}</h1>
          <p className="text-gray-600">
            {t('common:orderNumberLabel')}: <span className="font-semibold text-black">{order.orderNumber}</span>
          </p>
        </div>

        {/* 주문 요약 */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('order:checkout.orderSummary')}</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">{t('order:payment.orderDate')}</span>
              <span>{new Date(order.createdAt).toLocaleString('ko-KR')}</span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">{t('order:payment.paymentAmount')}</span>
              <span className="text-lg font-bold text-[#E85A6B]">{money(order.totalAmount)}</span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">{t('order:payment.paymentMethod')}</span>
              <span>
                {order.paymentMethod === 'CREDIT_CARD' && t('order:payment.creditCard')}
                {order.paymentMethod === 'KAKAO_PAY' && t('order:payment.kakaoPay')}
                {order.paymentMethod === 'NAVER_PAY' && t('order:payment.naverPay')}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('order:payment.orderStatus')}</span>
              <span className="px-2 py-1 bg-[#FFF1F2] text-[#D14A5B] text-sm font-medium rounded-full">
                {order.status === 'pending' && t('order:status.pending')}
                {order.status === 'confirmed' && t('order:status.confirmed')}
                {order.status === 'processing' && t('order:status.preparing')}
                {order.status === 'shipped' && t('order:status.shipped')}
                {order.status === 'delivered' && t('order:status.delivered')}
                {order.status === 'cancelled' && t('order:status.cancelled')}
              </span>
            </div>
          </div>
        </div>

        {/* 주문 상품 */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('order:payment.orderItems')}</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-4 py-4 border-b last:border-b-0">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.productName}</h3>
                  {item.options && Object.keys(item.options).length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      {Object.entries(item.options).map(([key, value]) => (
                        <span key={key}>{key}: {value} </span>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">{t('order:payment.quantityUnit', { count: item.quantity })}</span>
                    <span className="font-semibold">{money(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 배송지 정보 */}
        {order.shippingAddress && (
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{t('order:payment.shippingInfo')}</h2>
            <div className="space-y-2 text-sm">
              <div><strong>{t('order:shipping.recipient')}:</strong> {order.shippingAddress.recipientName}</div>
              <div><strong>{t('order:shipping.phone')}:</strong> {order.shippingAddress.recipientPhone}</div>
              <div>
                <strong>{t('order:shipping.address')}:</strong> ({order.shippingAddress.postcode}) {order.shippingAddress.roadAddress}
                {order.shippingAddress.detailAddress && `, ${order.shippingAddress.detailAddress}`}
              </div>
              {order.shippingAddress.deliveryNote && (
                <div><strong>{t('order:shipping.deliveryMemo')}:</strong> {order.shippingAddress.deliveryNote}</div>
              )}
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="bg-[#FFF1F2] rounded-lg border border-[#E85A6B]/20 p-4 mb-6">
          <h3 className="font-semibold text-[#D14A5B] mb-2">📦 배송 안내</h3>
          <ul className="text-sm text-[#E85A6B] space-y-1">
            <li>• 네일팁은 주문 후 평균 3-5일 내에 제작됩니다.</li>
            <li>• 제작 완료 후 1-2일 내에 배송이 시작됩니다.</li>
            <li>• 배송 정보는 SMS와 이메일로 안내드립니다.</li>
            <li>• 주문 상태는 마이페이지에서 확인할 수 있습니다.</li>
          </ul>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onGo('/my/orders')}
            className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {t('order:complete.goToOrders')}
          </button>
          <button
            onClick={() => onGo('/')}
            className="flex-1 bg-[#E85A6B] text-white py-3 px-6 rounded-lg hover:bg-[#D14A5B] transition-colors font-medium"
          >
            {t('order:complete.continueShopping')}
          </button>
        </div>

        {/* 고객센터 안내 */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>주문 관련 문의사항이 있으시면</p>
          <p>
            고객센터 
            <button 
              onClick={() => alert('고객센터 연결 기능은 추후 구현됩니다.')}
              className="text-[#E85A6B] hover:underline ml-1"
            >
              1588-0000
            </button>
            로 연락해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}