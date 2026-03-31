import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TermsOfService, PrivacyPolicy, PersonalDataConsent } from '../pages/PolicyPages';

export interface TermsState {
  terms: boolean;
  privacy: boolean;
  personalData: boolean;
  marketing: boolean;
}

export interface TermsAgreementProps {
  agree: TermsState;
  onAgreeChange: (agree: TermsState) => void;
  loading?: boolean;
  userInfo?: {
    name: string;
    email: string;
    profileImage?: string;
    provider?: string;
  };
  title?: string;
  description?: string;
}

export function TermsAgreement({
  agree,
  onAgreeChange,
  loading = false,
  userInfo,
  title,
  description
}: TermsAgreementProps) {
  const { t } = useTranslation(['auth', 'common']);
  const [showPolicy, setShowPolicy] = useState<'terms' | 'privacy' | 'personalData' | null>(null);

  const displayTitle = title || t('auth:social.termsAgreementTitle');

  const handleAllAgreeChange = (isChecked: boolean) => {
    onAgreeChange({
      terms: isChecked,
      privacy: isChecked,
      personalData: isChecked,
      marketing: isChecked
    });
  };

  const handleIndividualAgreeChange = (key: keyof TermsState, value: boolean) => {
    onAgreeChange({
      ...agree,
      [key]: value
    });
  };

  const isRequiredTermsAgreed = agree.terms && agree.privacy && agree.personalData;
  const isAllAgreed = agree.terms && agree.privacy && agree.personalData && agree.marketing;

  const getProviderLabel = (provider: string) => {
    const names: Record<string, string> = { kakao: 'Kakao', google: 'Google', naver: 'NAVER', apple: 'Apple' };
    return names[provider] || provider;
  };

  return (
    <>
      <div className="space-y-4 rounded-lg border bg-gray-50 px-4 py-4">
        {userInfo && (
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-3">
              {userInfo.profileImage && (
                <img
                  src={userInfo.profileImage}
                  alt={t('mypage:profile.profileImage')}
                  className="w-12 h-12 rounded-full border"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{userInfo.name}</div>
                <div className="text-sm text-gray-600">{userInfo.email}</div>
                {userInfo.provider && (
                  <div className="text-xs text-[#E85A6B] mt-1">
                    {getProviderLabel(userInfo.provider)} {t('auth:social.signingUpWith', { provider: '' }).trim()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-sm font-semibold text-gray-800">{displayTitle}</div>

        {description && (
          <div className="text-sm text-gray-600 bg-[#FFF1F2] p-3 rounded">
            {description}
          </div>
        )}

        {/* 전체 동의 */}
        <label className="flex items-center gap-2 text-sm border-b pb-2">
          <input
            type="checkbox"
            checked={isAllAgreed}
            onChange={(e) => handleAllAgreeChange(e.target.checked)}
            disabled={loading}
            className="rounded"
          />
          <span className="font-medium">{t('auth:signup.agreeAll')}</span>
        </label>

        {/* 이용약관 */}
        <label className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={agree.terms}
              onChange={(e) => handleIndividualAgreeChange('terms', e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <span>{t('auth:signup.serviceTerms')} <span className="text-red-500">({t('common:required')})</span></span>
          </div>
          <button
            type="button"
            onClick={() => setShowPolicy('terms')}
            className="text-[#E85A6B] hover:text-[#D14A5B] text-xs underline"
          >
            {t('common:seeMore')}
          </button>
        </label>

        {/* 개인정보처리방침 */}
        <label className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={agree.privacy}
              onChange={(e) => handleIndividualAgreeChange('privacy', e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <span>{t('auth:signup.privacyTerms')} <span className="text-red-500">({t('common:required')})</span></span>
          </div>
          <button
            type="button"
            onClick={() => setShowPolicy('privacy')}
            className="text-[#E85A6B] hover:text-[#D14A5B] text-xs underline"
          >
            {t('common:seeMore')}
          </button>
        </label>

        {/* 개인정보수집동의서 */}
        <label className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={agree.personalData}
              onChange={(e) => handleIndividualAgreeChange('personalData', e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <span>{t('auth:signup.privacyTerms')} <span className="text-red-500">({t('common:required')})</span></span>
          </div>
          <button
            type="button"
            onClick={() => setShowPolicy('personalData')}
            className="text-[#E85A6B] hover:text-[#D14A5B] text-xs underline"
          >
            {t('common:seeMore')}
          </button>
        </label>

        {/* 마케팅 정보 수신 동의 */}
        <label className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={agree.marketing}
              onChange={(e) => handleIndividualAgreeChange('marketing', e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <span>{t('auth:signup.marketingTerms')} <span className="text-gray-500">({t('common:optional')})</span></span>
          </div>
        </label>

        {/* 필수 약관 안내 */}
        <div className="text-xs text-gray-600 bg-[#FFF1F2] p-2 rounded flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">lightbulb</span>
          {t('auth:signup.termsRequired')}
        </div>

        {/* 필수 약관 미동의시 경고 */}
        {!isRequiredTermsAgreed && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">warning</span>
            {t('auth:signup.termsRequired')}
          </div>
        )}
      </div>

      {/* Policy Modals */}
      {showPolicy === 'terms' && <TermsOfService onClose={() => setShowPolicy(null)} />}
      {showPolicy === 'privacy' && <PrivacyPolicy onClose={() => setShowPolicy(null)} />}
      {showPolicy === 'personalData' && <PersonalDataConsent onClose={() => setShowPolicy(null)} />}
    </>
  );
}

export const validateTerms = (agree: TermsState): string | null => {
  if (!agree.terms || !agree.privacy || !agree.personalData) {
    return null;
  }
  return null;
};

export const getDefaultTermsState = (): TermsState => ({
  terms: false,
  privacy: false,
  personalData: false,
  marketing: false
});
