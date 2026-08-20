import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Crown,
  AlertTriangle,
  Check,
  CreditCard,
  Receipt,
  Info,
} from 'lucide-react';
import { useDesignToolAccess } from '../../hooks/useDesignToolAccess';
import type {
  DesignToolPlanId,
  SubscriptionStatus,
} from '@handy-platform/shared';
import { requestTossBillingAuth } from '../../hooks/useTossPayments';
import { useAuth } from '../../hooks/useAuth';

interface DesignToolSubscriptionPageProps {
  onGo: (to: string) => void;
}

const TOSS_CLIENT_KEY =
  (import.meta as any).env?.VITE_TOSS_CLIENT_KEY ||
  'test_ck_docs_Ovk5rk1EwkEbP0W43n07xlzm';

export function DesignToolSubscriptionPage({ onGo }: DesignToolSubscriptionPageProps) {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const { access, plans, loading, error, cancel, changePlan } =
    useDesignToolAccess();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cardChangeError, setCardChangeError] = useState<string | null>(null);

  const currentPlan = plans.find((p) => p.planId === access?.plan);
  const status: SubscriptionStatus = access?.status ?? 'none';
  const isActive = status === 'active';
  const isCancelled = status === 'cancelled';
  const isPro = access?.plan === 'pro';
  const isTossSubscriber = access?.paymentSource === 'toss';

  const renewalDate = useMemo(() => {
    const iso = access?.nextRenewalAt || access?.expiresAt;
    return iso ? new Date(iso).toLocaleDateString('ko-KR') : null;
  }, [access?.nextRenewalAt, access?.expiresAt]);

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

  const handleChangeCard = async () => {
    setCardChangeError(null);
    if (!currentUser?.userUuid) {
      setCardChangeError(t('designTool.subscription.cardChangeFailed'));
      return;
    }
    try {
      const orderId = `billing-update-${Date.now()}`;
      const origin = window.location.origin;
      await requestTossBillingAuth({
        clientKey: TOSS_CLIENT_KEY,
        customerKey: currentUser.userUuid,
        amount: currentPlan?.price ?? 0,
        orderId,
        orderName: t('designTool.subscription.changeCard'),
        // mode=update → PaymentResult 페이지에서 updateBillingMethod를 호출
        successUrl: `${origin}/design-tool/payment/success?mode=update`,
        failUrl: `${origin}/design-tool/payment/fail?mode=update`,
      });
    } catch (err: any) {
      setCardChangeError(err?.message || t('designTool.subscription.cardChangeFailed'));
    }
  };

  if (loading && !access) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  const statusText: Record<SubscriptionStatus, string> = {
    active: t('designTool.subStatus.active'),
    cancelled: t('designTool.subStatus.cancelledWithExpiry'),
    expired: t('designTool.subStatus.expired'),
    in_grace_period: t('designTool.subStatus.inGracePeriod'),
    on_hold: t('designTool.subStatus.onHold'),
    paused: t('designTool.subStatus.paused'),
    trial: t('designTool.subStatus.trial'),
    none: t('designTool.subStatus.none'),
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => onGo('/my')} className="p-2 hover:bg-surface rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t('designTool.subscriptionManagement')}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* grace / on_hold / paused 상태 배너 */}
      {status === 'in_grace_period' && (
        <StatusBanner
          tone="warn"
          title={t('designTool.subscription.gracePeriodTitle')}
          body={t('designTool.subscription.gracePeriodNotice')}
        />
      )}
      {status === 'on_hold' && (
        <StatusBanner
          tone="danger"
          title={t('designTool.subscription.onHoldTitle')}
          body={t('designTool.subscription.onHoldNotice')}
        />
      )}
      {status === 'paused' && (
        <StatusBanner
          tone="info"
          title={t('designTool.subscription.pausedTitle')}
          body={t('designTool.subscription.pausedNotice')}
        />
      )}

      {/* 현재 구독 상태 */}
      <div className="bg-white border border-line rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <Crown className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">
              {t('designTool.subscription.planLabel', {
                plan: currentPlan?.name || t('designTool.free'),
              })}
            </h2>
            <p className="text-sm text-muted">{statusText[status]}</p>
          </div>
        </div>

        {/* 구독 상세 정보 */}
        <div className="space-y-3 border-t border-line pt-4">
          {access?.subscribedAt && (
            <InfoRow
              label={t('designTool.subscription.startDate')}
              value={new Date(access.subscribedAt).toLocaleDateString('ko-KR')}
            />
          )}

          {/* 다음 결제일 (nextRenewalAt) — 활성/자동갱신 시 */}
          {isPro && isActive && access?.autoRenew && renewalDate && (
            <InfoRow
              label={t('designTool.subscription.nextBillingDate')}
              value={renewalDate}
            />
          )}

          {/* 만료일 — 취소/만료/grace 상태거나 autoRenew=false일 때 */}
          {access?.expiresAt &&
            (isCancelled ||
              !access.autoRenew ||
              status === 'expired' ||
              status === 'in_grace_period') && (
              <InfoRow
                label={t('designTool.subscription.expiryDate')}
                value={new Date(access.expiresAt).toLocaleDateString('ko-KR')}
              />
            )}

          {isPro && (
            <InfoRow
              label={t('designTool.subscription.autoRenew')}
              value={
                access?.autoRenew
                  ? t('designTool.subscription.on')
                  : t('designTool.subscription.off')
              }
            />
          )}

          {currentPlan &&
            (currentPlan.price === 0 ? (
              <InfoRow
                label={t('designTool.subscription.monthlyFee')}
                value={t('designTool.free')}
              />
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">
                  {t('designTool.subscription.monthlyFee')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted line-through">
                    ₩{(7900).toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-brand">
                    ₩{currentPlan.price.toLocaleString()}
                  </span>
                  <span className="text-xs bg-brand-100 text-brand px-1.5 py-0.5 rounded-full font-medium">
                    {t('designTool.webDiscount')}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* 플랜 기능 목록 */}
        {currentPlan && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t('designTool.subscription.includedFeatures')}
            </p>
            <ul className="space-y-2">
              {currentPlan.features.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-sm text-muted"
                >
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 결제 수단 섹션 (Toss 구독자에게만 노출) */}
      {isPro && isTossSubscriber && (
        <div className="bg-white border border-line rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-muted" />
            <h3 className="font-semibold text-gray-900">
              {t('designTool.subscription.billingMethod')}
            </h3>
          </div>
          {access?.billingMethodMeta ? (
            <div className="space-y-1 mb-4">
              <p className="text-sm text-gray-900 font-medium">
                {access.billingMethodMeta.cardCompany || t('designTool.subscription.card')}
                {access.billingMethodMeta.cardType
                  ? ` · ${access.billingMethodMeta.cardType}`
                  : ''}
              </p>
              {access.billingMethodMeta.maskedNumber && (
                <p className="text-sm text-muted font-mono">
                  {access.billingMethodMeta.maskedNumber}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted mb-4">
              {t('designTool.subscription.billingMethodUnknown')}
            </p>
          )}
          <button
            onClick={handleChangeCard}
            disabled={actionLoading}
            className="w-full py-2.5 border border-line text-ink rounded-xl text-sm font-medium hover:bg-surface disabled:opacity-50"
          >
            {t('designTool.subscription.changeCard')}
          </button>
          {cardChangeError && (
            <p className="mt-2 text-xs text-red-500">{cardChangeError}</p>
          )}
        </div>
      )}

      {/* 결제 이력 진입점 */}
      {isPro && (
        <button
          onClick={() => onGo('/my/billing/design-tool')}
          className="w-full flex items-center justify-between bg-white border border-line rounded-2xl p-4 mb-6 hover:bg-surface"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-surface rounded-lg flex items-center justify-center">
              <Receipt className="w-4 h-4 text-muted" />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {t('billing.history')}
            </span>
          </div>
          <span className="text-xs text-muted">→</span>
        </button>
      )}

      {/* 플랜 변경 */}
      {isActive && !isCancelled && (
        <div className="bg-white border border-line rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {t('designTool.subscription.changePlan')}
          </h3>
          {isPro ? (
            <div>
              <p className="text-sm text-muted mb-3">
                {t('designTool.subscription.downgradeDesc')}
              </p>
              <button
                onClick={() => handleChangePlan('free')}
                disabled={actionLoading}
                className="w-full py-3 bg-surface text-ink rounded-full font-medium text-sm hover:bg-surface-strong transition-colors disabled:opacity-50"
              >
                {actionLoading
                  ? t('designTool.subscription.processing')
                  : t('designTool.subscription.downgradeButton')}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted mb-3">
                {t('designTool.subscription.upgradeDesc')}
              </p>
              <button
                onClick={() => handleChangePlan('pro')}
                disabled={actionLoading}
                className="w-full py-3 bg-brand text-white rounded-full font-medium text-sm hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {actionLoading
                  ? t('designTool.subscription.processing')
                  : t('designTool.subscription.upgradeWithPrice', {
                      regularPrice: '7,900',
                      discountPrice: '6,900',
                    })}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 취소된 구독 — 재구독 안내 */}
      {isCancelled && (
        <div className="bg-white border border-line rounded-2xl p-6 mb-6 text-center">
          <p className="text-muted mb-4">
            {t('designTool.subscription.cancelledMessage')}
          </p>
          <button
            onClick={() => onGo('/design-tool/subscription')}
            className="px-6 py-3 bg-brand text-white rounded-full font-medium text-sm hover:bg-brand-600 transition-colors"
          >
            {t('designTool.subscription.resubscribe')}
          </button>
        </div>
      )}

      {/* 구독 없을 때 */}
      {(status === 'none' || status === 'expired') && (
        <div className="bg-white border border-line rounded-2xl p-6 mb-6 text-center">
          <p className="text-muted mb-4">
            {t('designTool.subscription.noActiveSubscription')}
          </p>
          <button
            onClick={() => onGo('/design-tool/subscription')}
            className="px-6 py-3 bg-brand text-white rounded-full font-medium text-sm hover:bg-brand-600 transition-colors"
          >
            {t('designTool.subscription.selectPlan')}
          </button>
        </div>
      )}

      {/* 구독 취소 (만료일까지 유지 — backend Phase A에서는 즉시 해지 미지원) */}
      {isActive && isPro && !isCancelled && isTossSubscriber && (
        <div className="border-t border-line pt-6">
          {showCancelConfirm ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {t('designTool.subscription.cancelConfirmTitle')}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    {t('designTool.subscription.cancelConfirmDesc')}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 bg-surface text-ink rounded-xl text-sm font-medium hover:bg-surface-strong"
                >
                  {t('designTool.subscription.cancelButton')}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  {actionLoading
                    ? t('designTool.subscription.processing')
                    : t('designTool.subscription.cancelSubscription')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-sm text-muted hover:text-red-500 transition-colors"
            >
              {t('designTool.subscription.cancelSubscription')}
            </button>
          )}
        </div>
      )}

      {/* IAP 구독자 안내 — 웹에서 직접 취소 불가 */}
      {isActive && isPro && !isTossSubscriber && access?.paymentSource && (
        <div className="bg-surface border border-line rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" />
          <p className="text-xs text-muted">
            {t('designTool.subscription.iapManageNotice', {
              source:
                access.paymentSource === 'apple'
                  ? 'App Store'
                  : access.paymentSource === 'google'
                  ? 'Google Play'
                  : access.paymentSource,
            })}
          </p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function StatusBanner({
  tone,
  title,
  body,
}: {
  tone: 'warn' | 'danger' | 'info';
  title: string;
  body: string;
}) {
  const palette = {
    warn: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }[tone];
  return (
    <div className={`border rounded-2xl p-4 mb-6 ${palette}`}>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs mt-1 opacity-90">{body}</p>
    </div>
  );
}
