import { useState, useRef, useCallback, useMemo } from 'react';
import { Check, Sparkles, Palette, Crown, CreditCard, ArrowLeft } from 'lucide-react';
import { useDesignToolAccess } from '../../hooks/useDesignToolAccess';
import { isAuthenticated } from '../../services/apiService';
import { TossPaymentWidget, TossPaymentWidgetRef } from '../payment/TossPaymentWidget';
import type { DesignToolPlan, DesignToolPlanId } from '@handy-platform/shared';

interface DesignToolPageProps {
  onGo: (to: string) => void;
}

interface PaymentSessionData {
  orderId: string;
  amount: number;
  clientKey: string;
  orderName: string;
}

export function DesignToolPage({ onGo }: DesignToolPageProps) {
  // 진입 경로에 따라 뒤로가기 목적지 결정
  const backPath = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('from') === 'shopping' ? '/' : '/my';
  }, []);

  const { access, plans, loading, error, subscribe } = useDesignToolAccess();
  const [subscribing, setSubscribing] = useState(false);
  const [paymentSession, setPaymentSession] = useState<PaymentSessionData | null>(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const tossWidgetRef = useRef<TossPaymentWidgetRef>(null);
  const loggedIn = isAuthenticated();

  const customerKey = useMemo(() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.sub || null;
      }
    } catch (e) {
      console.warn('[DesignToolPage] Failed to extract customerKey from token');
    }
    return null;
  }, []);

  const handleSubscribe = async (planId: DesignToolPlanId) => {
    if (!loggedIn) {
      onGo('/login');
      return;
    }

    setSubscribing(true);
    setPaymentError(null);

    if (planId === 'free') {
      const session = await subscribe(planId);
      setSubscribing(false);
      if (!session) {
        // free plan: subscribe returns null (no payment session), access is updated
        onGo('/design-tool/subscription');
      }
    } else {
      // pro 플랜: 결제 세션 반환
      const session = await subscribe(planId);
      setSubscribing(false);
      if (session) {
        setPaymentSession(session);
      }
    }
  };

  const handleRequestPayment = useCallback(async () => {
    if (!tossWidgetRef.current || !paymentSession) return;

    try {
      const baseUrl = window.location.origin;
      await tossWidgetRef.current.requestPayment({
        orderId: paymentSession.orderId,
        orderName: paymentSession.orderName,
        successUrl: `${baseUrl}/design-tool/payment/success`,
        failUrl: `${baseUrl}/design-tool/payment/fail`,
      });
    } catch (err: any) {
      console.error('Payment request failed:', err);
      setPaymentError(err.message || '결제 요청에 실패했습니다.');
    }
  }, [paymentSession]);

  const handleCancelPayment = () => {
    setPaymentSession(null);
    setPaymentReady(false);
    setPaymentError(null);
  };

  const currentPlan = access?.currentPlan;
  const isActive = access?.subscriptionStatus === 'active';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => onGo(backPath)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">디자인 툴</h1>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-2xl mb-4">
          <Palette className="w-8 h-8 text-pink-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">HANDY Design Tool</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          나만의 네일 디자인을 만들어보세요. AI 기반 디자인 도구로 쉽고 빠르게 커스텀 네일아트를 제작할 수 있습니다.
        </p>
      </div>

      {/* 현재 구독 상태 배너 */}
      {isActive && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-pink-500" />
            <div>
              <p className="font-semibold text-gray-900">
                현재 {currentPlan === 'pro' ? '프로' : '무료'} 플랜 이용 중
              </p>
              {access?.expiresAt && (
                <p className="text-sm text-gray-500">
                  만료일: {new Date(access.expiresAt).toLocaleDateString('ko-KR')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => onGo('/design-tool/subscription')}
            className="text-sm text-pink-600 font-medium hover:underline"
          >
            구독 관리
          </button>
        </div>
      )}

      {/* 에러 메시지 */}
      {(error || paymentError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 text-red-600 text-sm">
          {error || paymentError}
        </div>
      )}

      {/* Toss 결제 위젯 */}
      {paymentSession && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={handleCancelPayment} className="p-1 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">프로 플랜 결제</h2>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">결제 금액</span>
              <span className="text-xl font-bold text-gray-900">
                ₩{paymentSession.amount.toLocaleString()}
              </span>
            </div>
          </div>
          <TossPaymentWidget
            ref={tossWidgetRef}
            amount={paymentSession.amount}
            customerKey={customerKey}
            onReady={() => setPaymentReady(true)}
            onError={(err) => setPaymentError(err)}
          />
          <button
            onClick={handleRequestPayment}
            disabled={!paymentReady}
            className="w-full mt-4 py-4 bg-pink-500 text-white rounded-xl font-semibold text-base hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {paymentReady ? '결제하기' : '결제 수단 불러오는 중...'}
          </button>
        </div>
      )}

      {/* 플랜 비교 카드 */}
      {paymentSession ? null : loading && plans.length === 0 ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {plans.map((plan) => (
            <PlanCard
              key={plan.planId}
              plan={plan}
              isCurrent={isActive && currentPlan === plan.planId}
              onSelect={() => handleSubscribe(plan.planId)}
              disabled={subscribing || (isActive && currentPlan === plan.planId)}
              isPopular={plan.planId === 'pro'}
            />
          ))}
        </div>
      )}

      {/* 기능 상세 섹션 */}
      <div className="border-t border-gray-100 pt-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">주요 기능</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Palette className="w-6 h-6" />}
            title="직관적 디자인 에디터"
            description="드래그 앤 드롭으로 간편하게 네일 디자인을 제작할 수 있습니다."
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="AI 디자인 추천"
            description="트렌드 분석 기반 AI가 최적의 디자인을 추천해드립니다."
          />
          <FeatureCard
            icon={<Crown className="w-6 h-6" />}
            title="커스텀 주문 연동"
            description="완성된 디자인으로 바로 커스텀 주문을 요청할 수 있습니다."
          />
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  onSelect,
  disabled,
  isPopular,
}: {
  plan: DesignToolPlan;
  isCurrent: boolean;
  onSelect: () => void;
  disabled: boolean;
  isPopular: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border-2 p-6 transition-all ${
        isPopular
          ? 'border-pink-400 shadow-lg shadow-pink-100'
          : 'border-gray-200 hover:border-gray-300'
      } ${isCurrent ? 'bg-pink-50/50' : 'bg-white'}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            추천
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold text-gray-900">
            {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
          </span>
          {plan.price > 0 && <span className="text-gray-500 text-sm">/월</span>}
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={disabled}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
          isCurrent
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isPopular
              ? 'bg-pink-500 text-white hover:bg-pink-600'
              : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {isCurrent ? '현재 플랜' : plan.price === 0 ? '무료로 시작하기' : '구독하기'}
      </button>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm mb-4 text-pink-500">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
