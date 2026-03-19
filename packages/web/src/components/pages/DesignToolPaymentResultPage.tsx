import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useDesignToolAccess } from '../../hooks/useDesignToolAccess';

interface DesignToolPaymentResultPageProps {
  onGo: (to: string) => void;
  type: 'success' | 'fail';
}

export function DesignToolPaymentResultPage({ onGo, type }: DesignToolPaymentResultPageProps) {
  const { approve } = useDesignToolAccess(false);
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const approvedRef = useRef(false);

  useEffect(() => {
    if (type === 'fail') {
      const params = new URLSearchParams(window.location.search);
      setStatus('failed');
      setErrorMessage(params.get('message') || '결제가 실패했습니다.');
      return;
    }

    if (approvedRef.current) return;
    approvedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = Number(params.get('amount'));

    if (!paymentKey || !orderId || !amount) {
      setStatus('failed');
      setErrorMessage('결제 정보가 올바르지 않습니다.');
      return;
    }

    const approvePayment = async () => {
      const success = await approve(paymentKey, orderId, amount);
      if (success) {
        setStatus('completed');
      } else {
        setStatus('failed');
        setErrorMessage('결제 승인에 실패했습니다. 고객센터에 문의해주세요.');
      }
    };

    approvePayment();
  }, [type, approve]);

  if (status === 'processing') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">결제 처리 중...</h2>
        <p className="text-gray-500">잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 완료!</h2>
        <p className="text-gray-500 mb-8">프로 플랜이 활성화되었습니다.</p>
        <button
          onClick={() => onGo('/design-tool/subscription')}
          className="w-full py-3 bg-pink-500 text-white rounded-xl font-semibold hover:bg-pink-600"
        >
          구독 관리로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h2>
      <p className="text-gray-500 mb-8">{errorMessage}</p>
      <div className="space-y-3">
        <button
          onClick={() => onGo('/design-tool')}
          className="w-full py-3 bg-pink-500 text-white rounded-xl font-semibold hover:bg-pink-600"
        >
          다시 시도하기
        </button>
        <button
          onClick={() => onGo('/')}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
