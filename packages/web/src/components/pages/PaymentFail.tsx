import { useEffect, useState } from 'react';

interface PaymentFailProps {
  onGo: (path: string) => void;
}

export function PaymentFail({ onGo }: PaymentFailProps) {
  const [errorInfo, setErrorInfo] = useState<{
    orderId?: string;
    payMethod?: string;
    error?: string;
    code?: string;
    message?: string;
  }>({});

  useEffect(() => {
    // URL 파라미터에서 오류 정보 추출 (토스페이먼츠 및 기존 방식 호환)
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const payMethod = urlParams.get('payMethod');
    const error = urlParams.get('error');
    // 토스페이먼츠 오류 파라미터
    const code = urlParams.get('code');
    const message = urlParams.get('message');

    setErrorInfo({
      orderId: orderId || undefined,
      payMethod: payMethod || undefined,
      error: error || undefined,
      code: code || undefined,
      message: message || undefined,
    });
    console.log('Payment failed:', { orderId, payMethod, error, code, message });
  }, []);

  const getErrorMessage = () => {
    // 토스페이먼츠 에러 메시지 우선
    if (errorInfo.message) {
      return errorInfo.message;
    }

    // 토스페이먼츠 에러 코드에 따른 메시지
    if (errorInfo.code) {
      switch (errorInfo.code) {
        case 'PAY_PROCESS_CANCELED':
          return '사용자가 결제를 취소했습니다.';
        case 'PAY_PROCESS_ABORTED':
          return '결제가 중단되었습니다.';
        case 'REJECT_CARD_COMPANY':
          return '카드사에서 결제를 거부했습니다.';
        case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
          return '일일 결제 한도를 초과했습니다.';
        case 'EXCEED_MAX_PAYMENT_AMOUNT':
          return '결제 금액 한도를 초과했습니다.';
        case 'INVALID_CARD_EXPIRATION':
          return '카드 유효기간이 올바르지 않습니다.';
        case 'INVALID_STOPPED_CARD':
          return '정지된 카드입니다.';
        case 'INVALID_CARD_LOST_OR_STOLEN':
          return '분실/도난 신고된 카드입니다.';
        case 'NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT':
          return '할부가 지원되지 않는 카드입니다.';
        default:
          return `결제 오류가 발생했습니다. (${errorInfo.code})`;
      }
    }

    // 기존 에러 처리
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
        
        {(errorInfo.orderId || errorInfo.code) && (
          <div className="text-sm text-gray-500 mb-6 space-y-1">
            {errorInfo.orderId && <p>주문번호: {errorInfo.orderId}</p>}
            {errorInfo.code && <p>오류 코드: {errorInfo.code}</p>}
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => onGo('/checkout')}
            className="w-full bg-[#E85A6B] text-white py-2 px-4 rounded-lg hover:bg-[#D14A5B]"
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