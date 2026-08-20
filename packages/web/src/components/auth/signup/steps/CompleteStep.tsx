import { useTranslation } from 'react-i18next';
import { StepButton } from '../common';

interface CompleteStepProps {
  onComplete: () => void;
  userName?: string;
}

export function CompleteStep({ onComplete, userName }: CompleteStepProps) {
  const { t } = useTranslation(['auth']);
  return (
    <div className="h-full min-h-screen bg-white flex flex-col items-center justify-center px-5 py-10 mx-auto max-w-md overflow-y-auto">
      {/* 축하 아이콘 */}
      <div className="mb-8">
        <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center">
          <span className="text-5xl">🎉</span>
        </div>
      </div>

      {/* 메시지 */}
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
        {t('auth:signup.completeTitle')}
      </h1>

      {userName && (
        <p className="text-lg text-gray-700 mb-4">
          {t('auth:signup.welcomeUser', { name: userName })}
        </p>
      )}

      {/* 포인트 적립 안내 */}
      <div className="mt-4 mb-8 px-6 py-4 bg-brand-50 rounded-xl">
        <p className="text-brand-600 text-center">
          <span className="font-bold text-lg">1,000P</span>
          <span className="text-sm ml-1">{t('auth:signup.pointsEarned')}</span>
        </p>
      </div>

      {/* 혜택 안내 */}
      <div className="w-full max-w-sm mb-8 space-y-3">
        <BenefitItem
          icon="🎁"
          text={t('auth:signup.benefitPoints')}
        />
        <BenefitItem
          icon="🛒"
          text={t('auth:signup.benefitCoupon')}
        />
        <BenefitItem
          icon="🚚"
          text={t('auth:signup.benefitShipping')}
        />
      </div>

      {/* CTA 버튼 */}
      <div className="w-full max-w-sm">
        <StepButton onClick={onComplete}>
          {t('auth:signup.startShopping')}
        </StepButton>
      </div>
    </div>
  );
}

// 혜택 아이템 컴포넌트
function BenefitItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
      <span className="text-xl">{icon}</span>
      <span className="text-gray-700">{text}</span>
    </div>
  );
}
