import { useState, useEffect } from 'react';
import { useAlert } from '../common';
import { purchaseApiService } from '../../services/purchaseApiService';
import { webApiService } from '../../services/apiService';
import { money } from '../../utils';

interface PaymentSuccessProps {
  onGo: (path: string) => void;
}

export function PaymentSuccess({ onGo }: PaymentSuccessProps) {
  const { alert, error: showError } = useAlert();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  useEffect(() => {
    const approvePaymentAndRedirect = async () => {
      try {
        // URL 파라미터에서 orderId와 pg_token 추출
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        const pgToken = urlParams.get('pg_token');

        console.log('Payment success callback:', { orderId, pgToken });

        if (!orderId || orderId === 'undefined') {
          throw new Error('주문 정보가 올바르지 않습니다.');
        }

        if (!pgToken) {
          throw new Error('결제 토큰 정보가 없습니다.');
        }

        // 결제 승인 API 호출
        console.log('Calling payment approve API...');
        const approvalResponse = await purchaseApiService.approve(orderId, pgToken);

        console.log('Payment approve response:', approvalResponse);

        if (approvalResponse.success && approvalResponse.data) {
          // 승인 성공 - 장바구니 비우기
          console.log('🛒 Clearing cart after successful payment...');
          await webApiService.cart.clearCart().catch((err) => {
            console.error('❌ Failed to clear cart:', err);
          });

          // 주문 상세 페이지로 리다이렉트
          const redirectUrl = approvalResponse.data.redirectUrl || `/orders/${orderId}`;
          console.log('✅ Payment approved, redirecting to:', redirectUrl);

          // 성공 알림
          await alert('결제가 완료되었습니다!', {
            variant: 'success',
            title: '결제 완료'
          });

          // 주문 상세 페이지로 이동
          onGo(redirectUrl);
        } else {
          throw new Error(approvalResponse.message || approvalResponse.error || '결제 승인에 실패했습니다.');
        }

      } catch (error: any) {
        console.error('❌ Payment approval failed:', error);
        await showError(error, {
          title: '결제 승인 실패'
        });
        setPaymentResult({ success: false, error: error.message });
        setIsProcessing(false);
      }
    };

    approvePaymentAndRedirect();
  }, [onGo]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">결제 승인을 처리하고 있습니다...</p>
          <p className="text-gray-500 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (paymentResult?.success === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">결제 승인 실패</h2>
          <p className="text-gray-600 mb-6">{paymentResult.error}</p>
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

          {paymentResult && (
            <div className="space-y-6">
              {/* 주문 정보 */}
              <div className="bg-gray-50 rounded-lg p-6 text-left">
                <h3 className="text-lg font-semibold mb-4">주문 정보</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">주문번호</span>
                    <span className="font-medium">{paymentResult.orderNumber || paymentResult.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">결제수단</span>
                    <span className="font-medium">{paymentResult.payMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">결제금액</span>
                    <span className="font-bold text-blue-600">
                      {money(paymentResult.amount?.total || 0)}원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">주문일시</span>
                    <span className="font-medium">
                      {new Date(paymentResult.approvedAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">주문상태</span>
                    <span className="font-medium text-green-600">
                      {paymentResult.status === 'completed' ? '결제완료' : '처리중'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 주문 상품 */}
              {paymentResult.items && paymentResult.items.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6 text-left">
                  <h3 className="text-lg font-semibold mb-4">주문 상품</h3>
                  <div className="space-y-4">
                    {paymentResult.items.map((item: any, index: number) => (
                      <div key={index} className="flex gap-4 p-3 bg-white rounded-lg">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName || 'Product'}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              📦
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.productName || '상품명'}</h4>
                          <p className="text-sm text-gray-500">판매자: {item.sellerName || ''}</p>
                          <p className="text-sm text-gray-600">수량: {item.quantity}개</p>
                          <p className="text-sm font-medium">{money(item.price || 0)}원</p>
                          {item.subtotal && item.subtotal !== item.price && (
                            <p className="text-sm font-semibold text-blue-600">소계: {money(item.subtotal)}원</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 배송지 정보 */}
              {paymentResult.shippingAddress && (
                <div className="bg-gray-50 rounded-lg p-6 text-left">
                  <h3 className="text-lg font-semibold mb-4">배송지 정보</h3>
                  <div className="space-y-2">
                    <p className="font-medium">{paymentResult.shippingAddress.name || '수령인'}</p>
                    <p className="text-gray-600">{paymentResult.shippingAddress.phone || '연락처'}</p>
                    <p className="text-gray-600">
                      {paymentResult.shippingAddress.street || paymentResult.shippingAddress.address}
                      {paymentResult.shippingAddress.city ? `, ${paymentResult.shippingAddress.city}` : ''}
                      {paymentResult.shippingAddress.state ? `, ${paymentResult.shippingAddress.state}` : ''}
                    </p>
                    <p className="text-gray-600">우편번호: {paymentResult.shippingAddress.zipCode}</p>
                    <p className="text-gray-600">국가: {paymentResult.shippingAddress.country || 'KR'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onGo(`/orders/${paymentResult?.orderId}`)}
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
