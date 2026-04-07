import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Crown, AlertTriangle, Check } from 'lucide-react';
import { useDesignToolAccess } from '../../hooks/useDesignToolAccess';
import type { DesignToolPlanId } from '@handy-platform/shared';

interface DesignToolSubscriptionPageProps {
  onGo: (to: string) => void;
}

export function DesignToolSubscriptionPage({ onGo }: DesignToolSubscriptionPageProps) {
  const { t } = useTranslation('common');
  const { access, plans, loading, error, cancel, changePlan, refresh } = useDesignToolAccess();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const currentPlan = plans.find((p) => p.planId === access?.currentPlan);
  const isActive = access?.subscriptionStatus === 'active';
  const isCancelled = access?.subscriptionStatus === 'cancelled';
  const isPro = access?.currentPlan === 'pro';

  const handleCancel = async () => {
    setActionLoading(true);
    const success = await cancel();
    setActionLoading(false);
    if (success) {
      setShowCancelConfirm(false);
    }
  };

  const handleChangePlan = async (planId: DesignToolPlanId) => {
    if (planId === 'pro') {
      // pro 업그레이드는 결제가 필요하므로 결제 페이지로 이동
      onGo('/design-tool/subscription');
      return;
    }
    setActionLoading(true);
    await changePlan(planId);
    setActionLoading(false);
  };

  if (loading && !access) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => onGo('/my')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t('designTool.subscriptionManagement')}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 현재 구독 상태 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
            <Crown className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">
              {t('designTool.subscription.planLabel', { plan: currentPlan?.name || t('designTool.free') })}
            </h2>
            <p className="text-sm text-gray-500">
              {isActive && t('designTool.subStatus.active')}
              {isCancelled && t('designTool.subStatus.cancelledWithExpiry')}
              {access?.subscriptionStatus === 'expired' && t('designTool.subStatus.expired')}
              {access?.subscriptionStatus === 'none' && t('designTool.subStatus.none')}
              {access?.subscriptionStatus === 'trial' && t('designTool.subStatus.trial')}
            </p>
          </div>
        </div>

        {/* 구독 상세 정보 */}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          {access?.subscribedAt && (
            <InfoRow label={t('designTool.subscription.startDate')} value={new Date(access.subscribedAt).toLocaleDateString('ko-KR')} />
          )}
          {access?.expiresAt && (
            <InfoRow label={t('designTool.subscription.expiryDate')} value={new Date(access.expiresAt).toLocaleDateString('ko-KR')} />
          )}
          {isPro && (
            <InfoRow label={t('designTool.subscription.autoRenew')} value={access?.autoRenew ? t('designTool.subscription.on') : t('designTool.subscription.off')} />
          )}
          {currentPlan && (
            currentPlan.price === 0 ? (
              <InfoRow label={t('designTool.subscription.monthlyFee')} value={t('designTool.free')} />
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{t('designTool.subscription.monthlyFee')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 line-through">₩{(24900).toLocaleString()}</span>
                  <span className="text-sm font-medium text-pink-600">₩{currentPlan.price.toLocaleString()}</span>
                  <span className="text-xs bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full font-medium">{t('designTool.webDiscount')}</span>
                </div>
              </div>
            )
          )}
        </div>

        {/* 플랜 기능 목록 */}
        {currentPlan && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">{t('designTool.subscription.includedFeatures')}</p>
            <ul className="space-y-2">
              {currentPlan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-pink-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 플랜 변경 */}
      {isActive && !isCancelled && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{t('designTool.subscription.changePlan')}</h3>
          {isPro ? (
            <div>
              <p className="text-sm text-gray-500 mb-3">{t('designTool.subscription.downgradeDesc')}</p>
              <button
                onClick={() => handleChangePlan('free')}
                disabled={actionLoading}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {actionLoading ? t('designTool.subscription.processing') : t('designTool.subscription.downgradeButton')}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                {t('designTool.subscription.upgradeDesc')}
              </p>
              <button
                onClick={() => handleChangePlan('pro')}
                disabled={actionLoading}
                className="w-full py-3 bg-pink-500 text-white rounded-xl font-medium text-sm hover:bg-pink-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? t('designTool.subscription.processing') : t('designTool.subscription.upgradeWithPrice', { regularPrice: '24,900', discountPrice: '21,900' })}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 취소된 구독 — 재구독 안내 */}
      {isCancelled && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 text-center">
          <p className="text-gray-500 mb-4">{t('designTool.subscription.cancelledMessage')}</p>
          <button
            onClick={() => onGo('/design-tool/subscription')}
            className="px-6 py-3 bg-pink-500 text-white rounded-xl font-medium text-sm hover:bg-pink-600 transition-colors"
          >
            {t('designTool.subscription.resubscribe')}
          </button>
        </div>
      )}

      {/* 구독 없을 때 */}
      {(access?.subscriptionStatus === 'none' || access?.subscriptionStatus === 'expired') && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 text-center">
          <p className="text-gray-500 mb-4">{t('designTool.subscription.noActiveSubscription')}</p>
          <button
            onClick={() => onGo('/design-tool/subscription')}
            className="px-6 py-3 bg-pink-500 text-white rounded-xl font-medium text-sm hover:bg-pink-600 transition-colors"
          >
            {t('designTool.subscription.selectPlan')}
          </button>
        </div>
      )}

      {/* 구독 취소 */}
      {isActive && isPro && !isCancelled && (
        <div className="border-t border-gray-100 pt-6">
          {showCancelConfirm ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">{t('designTool.subscription.cancelConfirmTitle')}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('designTool.subscription.cancelConfirmDesc')}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
                >
                  {t('designTool.subscription.cancelButton')}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  {actionLoading ? t('designTool.subscription.processing') : t('designTool.subscription.cancelSubscription')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              {t('designTool.subscription.cancelSubscription')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
