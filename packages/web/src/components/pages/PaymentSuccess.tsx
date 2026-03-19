import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Package } from 'lucide-react';
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
        // URL 파라미터 추출 (토스페이먼츠 결제 콜백 또는 기존 방식)
        const urlParams = new URLSearchParams(window.location.search);
        const paymentKey = urlParams.get('paymentKey');
        const orderId = urlParams.get('orderId');
        const amount = urlParams.get('amount');
        const status = urlParams.get('status'); // 기존 방식 호환

        console.log('🔵 [PaymentSuccess] Payment callback received:', { paymentKey, orderId, amount, status });

        if (!orderId || orderId === 'undefined') {
          throw new Error('주문 정보가 올바르지 않습니다.');
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
            throw new Error(approveResponse.error || '결제 승인에 실패했습니다.');
          }
        } else if (status && status !== 'completed') {
          // 기존 방식: status 파라미터 확인
          const errorMsg = status === 'fail'
            ? '결제 처리 중 오류가 발생했습니다.'
            : status === 'cancel'
            ? '결제가 취소되었습니다.'
            : '결제가 완료되지 않았습니다.';
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
            throw new Error('결제가 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요.');
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
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A6B] mx-auto mb-4"></div>
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
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">주문 조회 실패</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <div className="space-y-3">
            <button
              onClick={() => onGo('/cart')}
              className="w-full bg-[#E85A6B] text-white py-2 px-4 rounded-lg hover:bg-[#D14A5B]"
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
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">주문 정보 없음</h2>
          <p className="text-gray-600 mb-6">주문 정보를 찾을 수 없습니다.</p>
          <button
            onClick={() => onGo('/')}
            className="w-full bg-[#E85A6B] text-white py-2 px-4 rounded-lg hover:bg-[#D14A5B]"
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
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
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
                    {(() => {
                      const method = order.paymentMethod as string;
                      const methodMap: Record<string, string> = {
                        'KAKAO_PAY': '카카오페이',
                        'NAVER_PAY': '네이버페이',
                        'CREDIT_CARD': '신용카드',
                        'TOSS_PAYMENTS': '토스페이먼츠',
                        'TOSS_PAY': '토스페이',
                        'CARD': '카드결제',
                      };
                      return methodMap[method] || method || '-';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제금액</span>
                  <span className="font-bold text-[#E85A6B]">
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
                        <h4 className="font-medium">{item.productName || '상품명'}</h4>
                        <p className="text-sm text-gray-500">판매자: {item.sellerName || ''}</p>
                        <p className="text-sm text-gray-600">수량: {item.quantity}개</p>
                        <p className="text-sm font-medium">{money(item.price || 0)}</p>
                        {item.subtotal && item.subtotal !== item.price && (
                          <p className="text-sm font-semibold text-[#E85A6B]">소계: {money(item.subtotal)}</p>
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
                  <p className="font-medium">{(order.shippingAddress as any).recipientName || '수령인'}</p>
                  <p className="text-gray-600">{(order.shippingAddress as any).recipientPhone || '연락처'}</p>
                  <p className="text-gray-600">
                    {(order.shippingAddress as any).roadAddress}
                    {(order.shippingAddress as any).detailAddress && `, ${(order.shippingAddress as any).detailAddress}`}
                  </p>
                  <p className="text-gray-600">우편번호: {(order.shippingAddress as any).postcode}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onGo(`/orders/${order.id}`)}
            className="bg-[#E85A6B] text-white py-3 px-6 rounded-lg hover:bg-[#D14A5B] font-medium"
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
