import React from 'react';
import { useTranslation } from 'react-i18next';
import { ServiceTermsContent, PrivacyPolicyContent, PersonalDataConsentContent, SubscriptionRefundPolicyContent } from '../legal/LegalContent';

// 공통 레이아웃 컴포넌트
const PolicyLayout = ({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose max-w-none text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  </div>
);

// 이용약관 컴포넌트
export function TermsOfService({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('nav');
  return (
    <PolicyLayout title={t('footer.termsOfService')} onClose={onClose}>
      <ServiceTermsContent />
    </PolicyLayout>
  );
}

// 개인정보처리방침 컴포넌트
export function PrivacyPolicy({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('nav');
  return (
    <PolicyLayout title={t('footer.privacyPolicy')} onClose={onClose}>
      <PrivacyPolicyContent />
    </PolicyLayout>
  );
}

// 구독 자동갱신 및 환불정책 컴포넌트
export function SubscriptionRefundPolicy({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('nav');
  return (
    <PolicyLayout title={t('footer.subscriptionRefundPolicy', 'Subscription & Refund Policy')} onClose={onClose}>
      <SubscriptionRefundPolicyContent />
    </PolicyLayout>
  );
}

// 개인정보수집동의서 컴포넌트
export function PersonalDataConsent({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('auth');
  return (
    <PolicyLayout title={t('signup.privacyTerms')} onClose={onClose}>
      <PersonalDataConsentContent />
    </PolicyLayout>
  );
}
