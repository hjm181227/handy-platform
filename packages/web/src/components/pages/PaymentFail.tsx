import { useEffect, useState } from 'react';

interface PaymentFailProps {
  onGo: (path: string) => void;
}

export function PaymentFail({ onGo }: PaymentFailProps) {
  const [errorInfo, setErrorInfo] = useState<{
    orderId?: string;
    payMethod?: string;
    error?: string;
  }>({});

  useEffect(() => {
    // URL 파라미터에서 오류 정보 추출
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const payMethod = urlParams.get('payMethod');
    const error = urlParams.get('error');
    
    setErrorInfo({ orderId, payMethod, error });
    console.log('Payment failed:', { orderId, payMethod, error });
  }, []);

  const getErrorMessage = () => {
    if (errorInfo.error) {
      switch (errorInfo.error) {
        case 'TIMEOUT':
          return '결제 시간이 초과되었습니다.';
        case 'INSUFFICIENT_FUNDS':
          return '잔액이 부족합니다.';
        case 'CARD_ERROR':
          return '카드 정보가 올바르지 않습니다.';
        case 'NETWORK_ERROR':
          return '네트워크 오류가 발생했습니다.';
        default:
          return errorInfo.error;
      }
    }
    return '결제 처리 중 오류가 발생했습니다.';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
        <div className="text-red-500 text-4xl mb-4">❌</div>
        <h2 className="text-xl font-bold mb-2">결제 실패</h2>
        <p className="text-gray-600 mb-2">
          {getErrorMessage()}
        </p>
        
        {errorInfo.orderId && (
          <p className="text-sm text-gray-500 mb-6">
            주문번호: {errorInfo.orderId}
          </p>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => onGo('/checkout')}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            다시 시도
          </button>
          <button
            onClick={() => onGo('/cart')}
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
          >
            장바구니로 돌아가기
          </button>
          <button
            onClick={() => onGo('/')}
            className="w-full text-gray-500 py-2 px-4 rounded-lg hover:bg-gray-50"
          >
            홈으로
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>도움이 필요하신가요?</strong><br />
            고객센터: 1588-0000<br />
            운영시간: 평일 09:00-18:00
          </p>
        </div>
      </div>
    </div>
  );
}