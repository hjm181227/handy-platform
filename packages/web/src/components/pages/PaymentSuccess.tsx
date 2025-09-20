import { useState, useEffect } from 'react';
import { useAlert } from '../common';
import { purchaseApiService } from '../../services/purchaseApiService';
import { money } from '../../utils';

interface PaymentSuccessProps {
  onGo: (path: string) => void;
}

export function PaymentSuccess({ onGo }: PaymentSuccessProps) {
  const { alert, error: showError } = useAlert();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  useEffect(() => {
    const processPaymentApproval = async () => {
      try {
        // URL 파라미터에서 결제 정보 추출
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        const pgToken = urlParams.get('pgToken');
        const payMethod = urlParams.get('payMethod');

        if (!orderId || !pgToken || !payMethod) {
          throw new Error('결제 정보가 올바르지 않습니다.');
        }

        // 결제 승인 처리
        const approveResponse = await purchaseApiService.approvePayment({
          orderId,
          payMethod,
          approvalData: { pgToken }
        });

        if (approveResponse.success) {
          setPaymentResult(approveResponse.data);
          
          // 성공 알림
          await alert('결제가 완료되었습니다!', {
            variant: 'success',
            title: '결제 완료'
          });
        } else {
          throw new Error(approveResponse.error || '결제 승인에 실패했습니다.');
        }

      } catch (error: any) {
        console.error('Payment approval failed:', error);
        await showError(error, {
          title: '결제 승인 실패'
        });
        setPaymentResult({ success: false, error: error.message });
      } finally {
        setIsProcessing(false);
      }
    };

    processPaymentApproval();
  }, []);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">결제를 완료하는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (paymentResult?.success === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">결제 실패</h2>
          <p className="text-gray-600 mb-6">{paymentResult.error}</p>
          <div className="space-y-3">
            <button
              onClick={() => onGo('/checkout')}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
            >
              다시 시도
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
            <div className="bg-gray-50 rounded-lg p-6 text-left">
              <h3 className="text-lg font-semibold mb-4">결제 정보</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">주문번호</span>
                  <span className="font-medium">{paymentResult.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제수단</span>
                  <span className="font-medium">{paymentResult.payMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">상품명</span>
                  <span className="font-medium">{paymentResult.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제금액</span>
                  <span className="font-bold text-blue-600">
                    {money(paymentResult.amount?.total || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제일시</span>
                  <span className="font-medium">
                    {new Date(paymentResult.approvedAt).toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>
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