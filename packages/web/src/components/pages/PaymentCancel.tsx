import { useEffect } from 'react';

interface PaymentCancelProps {
  onGo: (path: string) => void;
}

export function PaymentCancel({ onGo }: PaymentCancelProps) {
  useEffect(() => {
    // URL 파라미터에서 주문 정보 추출 (필요시 사용)
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const payMethod = urlParams.get('payMethod');
    
    console.log('Payment cancelled:', { orderId, payMethod });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
        <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">결제가 취소되었습니다</h2>
        <p className="text-gray-600 mb-6">
          결제를 취소하셨습니다. 다시 시도하거나 다른 결제 방법을 선택해주세요.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => onGo('/checkout')}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            결제 다시 시도
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
      </div>
    </div>
  );
}