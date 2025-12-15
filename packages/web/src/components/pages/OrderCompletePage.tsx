import { useState, useEffect } from 'react';
import { useAlert } from '../common';
import { webApiService } from '../../services/apiService';
import { money } from '../../utils';
import type { CustomerOrder } from '@handy-platform/shared';

interface OrderCompletePageProps {
  onGo: (path: string) => void;
  orderId: string;
}

export function OrderCompletePage({ onGo, orderId }: OrderCompletePageProps) {
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
        throw new Error((response as any).message || '주문 정보를 불러올 수 없습니다.');
      }
    } catch (err: any) {
      console.error('❌ [OrderCompletePage] Order loading failed:', err);
      setError(err.message || '주문 조회에 실패했습니다.');
      await showError(err, {
        title: '주문 조회 실패',
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
          <p className="text-gray-600">주문 정보를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">주문 정보를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">{error || '올바르지 않은 주문 번호입니다.'}</p>
          <button
            onClick={() => onGo('/')}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            홈으로 돌아가기
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
          <h1 className="text-2xl font-bold mb-2">주문이 완료되었습니다!</h1>
          <p className="text-gray-600">
            주문번호: <span className="font-semibold text-black">{order.orderNumber}</span>
          </p>
        </div>

        {/* 주문 요약 */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">주문 정보</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">주문일시</span>
              <span>{new Date(order.createdAt).toLocaleString('ko-KR')}</span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">결제금액</span>
              <span className="text-lg font-bold text-blue-600">{money(order.totalAmount)}</span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">결제방법</span>
              <span>
                {order.paymentMethod === 'CREDIT_CARD' && '신용카드'}
                {order.paymentMethod === 'KAKAO_PAY' && '카카오페이'}
                {order.paymentMethod === 'NAVER_PAY' && '네이버페이'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">주문상태</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {order.status === 'pending' && '결제대기'}
                {order.status === 'confirmed' && '결제완료'}
                {order.status === 'processing' && '제작중'}
                {order.status === 'shipped' && '배송중'}
                {order.status === 'delivered' && '배송완료'}
                {order.status === 'cancelled' && '주문취소'}
              </span>
            </div>
          </div>
        </div>

        {/* 주문 상품 */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">주문 상품</h2>
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
                    <span className="text-gray-600">수량: {item.quantity}개</span>
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
            <h2 className="text-lg font-semibold mb-4">배송지 정보</h2>
            <div className="space-y-2 text-sm">
              <div><strong>받는 분:</strong> {order.shippingAddress.recipientName}</div>
              <div><strong>연락처:</strong> {order.shippingAddress.recipientPhone}</div>
              <div>
                <strong>주소:</strong> ({order.shippingAddress.postcode}) {order.shippingAddress.roadAddress}
                {order.shippingAddress.detailAddress && `, ${order.shippingAddress.detailAddress}`}
              </div>
              {order.shippingAddress.deliveryNote && (
                <div><strong>배송메모:</strong> {order.shippingAddress.deliveryNote}</div>
              )}
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">📦 배송 안내</h3>
          <ul className="text-sm text-blue-700 space-y-1">
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
            주문 내역 보기
          </button>
          <button
            onClick={() => onGo('/')}
            className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            쇼핑 계속하기
          </button>
        </div>

        {/* 고객센터 안내 */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>주문 관련 문의사항이 있으시면</p>
          <p>
            고객센터 
            <button 
              onClick={() => alert('고객센터 연결 기능은 추후 구현됩니다.')}
              className="text-blue-500 hover:underline ml-1"
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