import { useState } from 'react';
import { ArrowLeft, Crown, AlertTriangle, Check } from 'lucide-react';
import { useDesignToolAccess } from '../../hooks/useDesignToolAccess';
import type { DesignToolPlanId } from '@handy-platform/shared';

interface DesignToolSubscriptionPageProps {
  onGo: (to: string) => void;
}

export function DesignToolSubscriptionPage({ onGo }: DesignToolSubscriptionPageProps) {
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
      onGo('/design-tool');
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
        <h1 className="text-xl font-bold">구독 관리</h1>
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
              {currentPlan?.name || '무료'} 플랜
            </h2>
            <p className="text-sm text-gray-500">
              {isActive && '활성'}
              {isCancelled && '취소됨 (만료일까지 이용 가능)'}
              {access?.subscriptionStatus === 'expired' && '만료됨'}
              {access?.subscriptionStatus === 'none' && '구독 없음'}
              {access?.subscriptionStatus === 'trial' && '체험 중'}
            </p>
          </div>
        </div>

        {/* 구독 상세 정보 */}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          {access?.subscribedAt && (
            <InfoRow label="구독 시작일" value={new Date(access.subscribedAt).toLocaleDateString('ko-KR')} />
          )}
          {access?.expiresAt && (
            <InfoRow label="만료일" value={new Date(access.expiresAt).toLocaleDateString('ko-KR')} />
          )}
          {isPro && (
            <InfoRow label="자동 갱신" value={access?.autoRenew ? '활성' : '비활성'} />
          )}
          {currentPlan && (
            currentPlan.price === 0 ? (
              <InfoRow label="월 요금" value="무료" />
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">월 요금</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 line-through">₩{(35000).toLocaleString()}</span>
                  <span className="text-sm font-medium text-pink-600">₩{currentPlan.price.toLocaleString()}</span>
                  <span className="text-xs bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full font-medium">웹 할인</span>
                </div>
              </div>
            )
          )}
        </div>

        {/* 플랜 기능 목록 */}
        {currentPlan && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">포함된 기능</p>
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
          <h3 className="font-semibold text-gray-900 mb-4">플랜 변경</h3>
          {isPro ? (
            <div>
              <p className="text-sm text-gray-500 mb-3">무료 플랜으로 다운그레이드 할 수 있습니다.</p>
              <button
                onClick={() => handleChangePlan('free')}
                disabled={actionLoading}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {actionLoading ? '처리 중...' : '무료 플랜으로 변경'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                프로 플랜으로 업그레이드하여 모든 기능을 이용하세요.
              </p>
              <button
                onClick={() => handleChangePlan('pro')}
                disabled={actionLoading}
                className="w-full py-3 bg-pink-500 text-white rounded-xl font-medium text-sm hover:bg-pink-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? '처리 중...' : (
                  <>프로 플랜으로 업그레이드 (<span className="line-through text-gray-300">₩35,000</span> ₩29,900/월)</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 취소된 구독 — 재구독 안내 */}
      {isCancelled && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 text-center">
          <p className="text-gray-500 mb-4">구독이 취소되었습니다. 만료일까지 서비스를 이용할 수 있습니다.</p>
          <button
            onClick={() => onGo('/design-tool')}
            className="px-6 py-3 bg-pink-500 text-white rounded-xl font-medium text-sm hover:bg-pink-600 transition-colors"
          >
            다시 구독하기
          </button>
        </div>
      )}

      {/* 구독 없을 때 */}
      {(access?.subscriptionStatus === 'none' || access?.subscriptionStatus === 'expired') && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 text-center">
          <p className="text-gray-500 mb-4">현재 활성 구독이 없습니다.</p>
          <button
            onClick={() => onGo('/design-tool')}
            className="px-6 py-3 bg-pink-500 text-white rounded-xl font-medium text-sm hover:bg-pink-600 transition-colors"
          >
            플랜 선택하기
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
                  <p className="font-semibold text-gray-900">구독을 취소하시겠습니까?</p>
                  <p className="text-sm text-gray-500 mt-1">
                    만료일까지 서비스를 계속 이용할 수 있습니다. 이후 무료 플랜으로 전환됩니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  {actionLoading ? '처리 중...' : '구독 취소'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              구독 취소
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
