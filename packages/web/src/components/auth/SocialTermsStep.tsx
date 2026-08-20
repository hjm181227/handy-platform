import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthModal, SocialNewUserInfo } from '../../contexts/AuthModalContext';
import { webApiService } from '../../services/apiService';
import { Logo } from '../common/Logo';
import { ServiceTermsContent, PrivacyPolicyContent } from '../legal/LegalContent';

interface AgreedTerms {
  service: boolean;
  privacy: boolean;
  marketing: boolean;
  age: boolean;
}

interface TermItem {
  key: keyof AgreedTerms;
  label: string;
  required: boolean;
  hasContent?: boolean;
}

interface SocialTermsStepProps {
  userInfo: SocialNewUserInfo;
  onComplete: () => void;
  onClose?: () => void;
}

export function SocialTermsStep({ userInfo, onComplete, onClose }: SocialTermsStepProps) {
  const { t } = useTranslation(['auth', 'common']);
  const authModal = useAuthModal();
  const handleClose = onClose || authModal?.close || (() => window.history.back());

  const TERMS: TermItem[] = [
    { key: 'age', label: t('auth:signup.ageRequirement'), required: true },
    { key: 'service', label: t('auth:signup.serviceTerms'), required: true, hasContent: true },
    { key: 'privacy', label: t('auth:signup.privacyTerms'), required: true, hasContent: true },
    { key: 'marketing', label: t('auth:signup.marketingTerms'), required: false },
  ];

  const [agreed, setAgreed] = useState<AgreedTerms>({
    service: false,
    privacy: false,
    marketing: false,
    age: false,
  });
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requiredTerms = TERMS.filter(t => t.required);
  const allRequiredAgreed = requiredTerms.every(t => agreed[t.key]);
  const allAgreed = TERMS.every(t => agreed[t.key]);

  const handleToggle = (key: keyof AgreedTerms) => {
    setAgreed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleAll = () => {
    const newValue = !allAgreed;
    setAgreed({
      service: newValue,
      privacy: newValue,
      marketing: newValue,
      age: newValue,
    });
  };

  const toggleExpand = (key: string) => {
    setExpandedTerms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!allRequiredAgreed) return;

    setLoading(true);
    setError('');

    try {
      const response = await webApiService.auth.completeSocialSignup({
        socialUserInfo: {
          provider: userInfo.provider as 'kakao' | 'google' | 'apple' | 'naver',
          providerId: userInfo.userId || '',
          email: userInfo.email || '',
          name: userInfo.name || '',
          profileImage: userInfo.profileImage,
        },
        marketingConsent: agreed.marketing,
      });

      if (response.token && response.user) {
        await webApiService.auth.setAuthToken(response.token, response.user);
        // WebView 환경: 명시적으로 네이티브에 토큰 전달
        if ((window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify({
            type: 'STORE_AUTH_TOKEN',
            data: { token: response.token, user: response.user }
          }));
        }
      }

      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { isNewUser: true }
      }));

      onComplete();
    } catch (err: any) {
      console.error('회원가입 실패:', err);
      setError(err.message || t('auth:social.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = { kakao: 'Kakao', google: 'Google', apple: 'Apple', naver: 'Naver' };
    return names[provider] || provider;
  };

  const renderTermContent = (key: string) => {
    switch (key) {
      case 'service':
        return <ServiceTermsContent />;
      case 'privacy':
        return <PrivacyPolicyContent />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-white flex flex-col mx-auto max-w-md px-5 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between h-10 mb-4">
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <Logo size="md" />
        <div className="w-10" />
      </div>

      {/* 환영 메시지 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('auth:social.welcome')}
        </h1>
        <p className="text-gray-500">
          {t('auth:social.signingUpWith', { provider: getProviderName(userInfo.provider) })}
        </p>
        {userInfo.name && (
          <p className="text-gray-700 mt-1 font-medium">{userInfo.name}</p>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* 약관 동의 */}
      <div className="flex-1 overflow-y-auto">
        <p className="text-sm text-gray-600 mb-4">
          {t('auth:social.termsDescription')}
        </p>

        {/* 전체 동의 */}
        <button
          type="button"
          onClick={handleToggleAll}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-colors mb-4"
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            allAgreed ? 'bg-brand border-brand' : 'border-gray-300'
          }`}>
            {allAgreed && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-lg font-semibold text-gray-900">{t('auth:signup.agreeAll')}</span>
        </button>

        {/* 구분선 */}
        <div className="border-t border-gray-200 my-4" />

        {/* 개별 약관 */}
        <div className="space-y-2">
          {TERMS.map((term) => (
            <div key={term.key} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleToggle(term.key)}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    agreed[term.key] ? 'bg-brand' : 'bg-gray-200'
                  }`}>
                    {agreed[term.key] && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-700 text-left text-sm">
                    <span className={term.required ? 'text-brand' : 'text-gray-400'}>
                      [{term.required ? t('common:required') : t('common:optional')}]
                    </span>{' '}
                    {term.label}
                  </span>
                </button>
                {term.hasContent && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(term.key)}
                    className="text-gray-400 hover:text-gray-600 p-1 transition-transform"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${expandedTerms.has(term.key) ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 약관 내용 토글 영역 */}
              {term.hasContent && expandedTerms.has(term.key) && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="max-h-48 overflow-y-auto p-4">
                    {renderTermContent(term.key)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 완료 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!allRequiredAgreed || loading}
        className="w-full rounded-xl bg-brand py-4 text-base font-semibold text-white hover:bg-brand-600 disabled:bg-gray-300 transition-colors mt-6"
      >
        {loading ? t('auth:signup.processingSignup') : t('auth:signup.agreeAndStart')}
      </button>
    </div>
  );
}
