import { useState, useEffect } from 'react';
import { useAlert } from '../common';
import { orderService } from '../../services/apiService';
import { money } from '../../utils';
import type { Order } from '@handy-platform/shared';

interface PaymentSuccessProps {
  onGo: (path: string) => void;
}

export function PaymentSuccess({ onGo }: PaymentSuccessProps) {
  const { alert, error: showError } = useAlert();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderResult = async () => {
      try {
        // URL 파라미터에서 orderId와 status 추출
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        const status = urlParams.get('status');

        console.log('🔵 [PaymentSuccess] Payment callback received:', { orderId, status });

        if (!orderId || orderId === 'undefined') {
          throw new Error('주문 정보가 올바르지 않습니다.');
        }

        // 결제 상태 확인
        if (status !== 'success') {
          const errorMsg = status === 'fail'
            ? '결제 처리 중 오류가 발생했습니다.'
            : status === 'cancel'
            ? '결제가 취소되었습니다.'
            : '결제가 완료되지 않았습니다.';
          throw new Error(errorMsg);
        }

        // 주문 정보 조회 (백엔드에서 이미 승인 완료)
        console.log('📦 [PaymentSuccess] Fetching order details...');
        const response = await orderService.getOrder(orderId);

        console.log('✅ [PaymentSuccess] Order fetched:', response.data);

        if (response.success && response.data?.order) {
          setOrder(response.data.order);

          // 성공 알림
          await alert('결제가 완료되었습니다!', {
            variant: 'success',
            title: '결제 완료'
          });
        } else {
          throw new Error(response.error || '주문 정보를 불러올 수 없습니다.');
        }

      } catch (error: any) {
        console.error('❌ [PaymentSuccess] Failed to fetch order:', error);
        await showError(error, {
          title: '주문 조회 실패'
        });
        setErrorMessage(error.message || '주문 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderResult();
  }, [onGo, alert, showError]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">주문 정보를 불러오고 있습니다...</p>
          <p className="text-gray-500 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">주문 조회 실패</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <div className="space-y-3">
            <button
              onClick={() => onGo('/cart')}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
            >
              장바구니로 돌아가기
            </button>
            <button
              onClick={() => onGo('/')}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
            >
              홈으로
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
          <div className="text-gray-400 text-4xl mb-4">📦</div>
          <h2 className="text-xl font-bold mb-2">주문 정보 없음</h2>
          <p className="text-gray-600 mb-6">주문 정보를 찾을 수 없습니다.</p>
          <button
            onClick={() => onGo('/')}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            홈으로 이동
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
          <h1 className="text-xl font-bold text-green-600">결제 완료</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border p-8 text-center mb-6">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">결제가 완료되었습니다!</h2>
          <p className="text-gray-600 mb-6">주문이 성공적으로 처리되었습니다.</p>

          <div className="space-y-6">
            {/* 주문 정보 */}
            <div className="bg-gray-50 rounded-lg p-6 text-left">
              <h3 className="text-lg font-semibold mb-4">주문 정보</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">주문번호</span>
                  <span className="font-medium">{order.orderNumber || order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제수단</span>
                  <span className="font-medium">
                    {order.paymentMethod === 'KAKAO_PAY' && '카카오페이'}
                    {order.paymentMethod === 'NAVER_PAY' && '네이버페이'}
                    {order.paymentMethod === 'CREDIT_CARD' && '신용카드'}
                    {!['KAKAO_PAY', 'NAVER_PAY', 'CREDIT_CARD'].includes(order.paymentMethod || '') && order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제금액</span>
                  <span className="font-bold text-blue-600">
                    {money(order.totalAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">주문일시</span>
                  <span className="font-medium">
                    {new Date(order.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">주문상태</span>
                  <span className="font-medium text-green-600">
                    {order.status === 'confirmed' && '결제완료'}
                    {order.status === 'pending' && '처리중'}
                    {!['confirmed', 'pending'].includes(order.status || '') && order.status}
                  </span>
                </div>
              </div>
            </div>

            {/* 주문 상품 */}
            {order.items && order.items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6 text-left">
                <h3 className="text-lg font-semibold mb-4">주문 상품</h3>
                <div className="space-y-4">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 p-3 bg-white rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                        {item.product?.mainImageUrl ? (
                          <img
                            src={item.product.mainImageUrl}
                            alt={item.product?.name || 'Product'}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product?.name || '상품명'}</h4>
                        <p className="text-sm text-gray-500">판매자: {item.seller?.name || ''}</p>
                        <p className="text-sm text-gray-600">수량: {item.quantity}개</p>
                        <p className="text-sm font-medium">{money(item.price || 0)}</p>
                        {item.subtotal && item.subtotal !== item.price && (
                          <p className="text-sm font-semibold text-blue-600">소계: {money(item.subtotal)}</p>
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
                <h3 className="text-lg font-semibold mb-4">배송지 정보</h3>
                <div className="space-y-2">
                  <p className="font-medium">{order.shippingAddress.recipientName || '수령인'}</p>
                  <p className="text-gray-600">{order.shippingAddress.phone || '연락처'}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress.address}
                    {order.shippingAddress.addressDetail && `, ${order.shippingAddress.addressDetail}`}
                  </p>
                  <p className="text-gray-600">우편번호: {order.shippingAddress.zipCode}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onGo(`/orders/${order.id}`)}
            className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 font-medium"
          >
            주문 상세보기
          </button>
          <button
            onClick={() => onGo('/')}
            className="border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 font-medium"
          >
            쇼핑 계속하기
          </button>
        </div>
      </div>
    </div>
  );
}
