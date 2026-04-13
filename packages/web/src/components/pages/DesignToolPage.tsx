import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Sparkles, Palette, Crown, ArrowLeft } from 'lucide-react';
import { useDesignToolAccess } from '../../hooks/useDesignToolAccess';
import { isAuthenticated } from '../../services/apiService';
import { requestTossBillingAuth } from '../../hooks/useTossPayments';
import type { DesignToolPlan, DesignToolPlanId } from '@handy-platform/shared';

interface DesignToolPageProps {
  onGo: (to: string) => void;
}

export function DesignToolPage({ onGo }: DesignToolPageProps) {
  const { t } = useTranslation('common');

  // 진입 경로에 따라 뒤로가기 목적지 결정
  const backPath = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('from') === 'shopping' ? '/' : '/my';
  }, []);

  const { access, plans, loading, error, subscribe } = useDesignToolAccess();
  const [subscribing, setSubscribing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const loggedIn = isAuthenticated();

  const handleSubscribe = async (planId: DesignToolPlanId) => {
    if (!loggedIn) {
      onGo('/login');
      return;
    }

    setSubscribing(true);
    setPaymentError(null);

    try {
      if (planId === 'free') {
        const session = await subscribe(planId);
        if (!session) {
          onGo('/design-tool/subscription');
        }
      } else {
        // pro 플랜: 서버에서 결제 세션 + customerKey 반환 → 빌링 인증 요청
        const session = await subscribe(planId);
        if (session) {
          const baseUrl = window.location.origin;
          await requestTossBillingAuth({
            clientKey: session.clientKey || import.meta.env.VITE_TOSS_API_CLIENT_KEY,
            customerKey: session.customerKey,
            amount: session.amount,
            orderId: session.orderId,
            orderName: session.orderName,
            successUrl: `${baseUrl}/design-tool/payment/success?orderId=${session.orderId}`,
            failUrl: `${baseUrl}/design-tool/payment/fail`,
          });
        }
      }
    } catch (err: any) {
      console.error('[DesignToolPage] Payment failed:', err);
      setPaymentError(err.message || t('designTool.paymentError'));
    } finally {
      setSubscribing(false);
    }
  };

  const currentPlan = access?.plan;
  const isActive = access?.status === 'active';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => onGo(backPath)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t('designTool.title')}</h1>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-2xl mb-4">
          <Palette className="w-8 h-8 text-pink-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">HANDY Design Tool</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          {t('designTool.subtitle')}
        </p>
      </div>

      {/* 현재 구독 상태 배너 */}
      {isActive && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-pink-500" />
            <div>
              <p className="font-semibold text-gray-900">
                {t('designTool.currentPlan', { plan: currentPlan === 'pro' ? 'Pro' : 'Free' })}
              </p>
              {access?.expiresAt && (
                <p className="text-sm text-gray-500">
                  {t('designTool.expiresAt', { date: new Date(access.expiresAt).toLocaleDateString() })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => onGo('/design-tool/subscription')}
            className="text-sm text-pink-600 font-medium hover:underline"
          >
            {t('designTool.subscriptionManagement')}
          </button>
        </div>
      )}

      {/* 에러 메시지 */}
      {(error || paymentError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 text-red-600 text-sm">
          {error || paymentError}
        </div>
      )}

      {/* 플랜 비교 카드 */}
      {loading && plans.length === 0 ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {[...plans].sort((a, b) => b.price - a.price).map((plan) => (
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
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{t('designTool.mainFeatures')}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <FeatureCard
            icon={<Palette className="w-6 h-6" />}
            title={t('designTool.feature1Title')}
            description={t('designTool.feature1Desc')}
          />
          {/* AI 디자인 추천 기능 — 미개발 상태로 숨김 처리
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title={t('designTool.feature2Title')}
            description={t('designTool.feature2Desc')}
          />
          */}
          <FeatureCard
            icon={<Crown className="w-6 h-6" />}
            title={t('designTool.feature3Title')}
            description={t('designTool.feature3Desc')}
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
  const { t } = useTranslation('common');

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
            {t('designTool.recommended')}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <div className="mt-2">
          {plan.price === 0 ? (
            <span className="text-3xl font-bold text-gray-900">{t('designTool.free')}</span>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg text-gray-400 line-through">₩{(24900).toLocaleString()}</span>
                <span className="text-xs text-gray-400">{t('designTool.perMonth')}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-pink-600">₩{plan.price.toLocaleString()}</span>
                <span className="text-gray-500 text-sm">{t('designTool.perMonth')}</span>
                <span className="ml-1 inline-block bg-pink-100 text-pink-600 text-xs font-semibold px-2 py-0.5 rounded-full">{t('designTool.webDiscount')}</span>
              </div>
            </div>
          )}
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

      {plan.price > 0 && (
        <button
          onClick={onSelect}
          disabled={disabled}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
            isCurrent
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-pink-500 text-white hover:bg-pink-600'
          }`}
        >
          {isCurrent ? t('designTool.currentPlanButton') : t('designTool.subscribe')}
        </button>
      )}
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
