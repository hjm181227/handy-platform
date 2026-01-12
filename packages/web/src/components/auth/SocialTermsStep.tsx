import { useState } from 'react';
import { useAuthModal, SocialNewUserInfo } from '../../contexts/AuthModalContext';
import { webApiService } from '../../services/apiService';
import { Logo } from '../common/Logo';

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
  link?: string;
}

const TERMS: TermItem[] = [
  { key: 'age', label: '만 14세 이상입니다', required: true },
  { key: 'service', label: '서비스 이용약관 동의', required: true, link: '/policy/terms' },
  { key: 'privacy', label: '개인정보 처리방침 동의', required: true, link: '/policy/privacy' },
  { key: 'marketing', label: '마케팅 정보 수신 동의', required: false },
];

interface SocialTermsStepProps {
  userInfo: SocialNewUserInfo;
  onComplete: () => void;
}

export function SocialTermsStep({ userInfo, onComplete }: SocialTermsStepProps) {
  const { close } = useAuthModal();
  const [agreed, setAgreed] = useState<AgreedTerms>({
    service: false,
    privacy: false,
    marketing: false,
    age: false,
  });
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

  const handleSubmit = async () => {
    if (!allRequiredAgreed) return;

    setLoading(true);
    setError('');

    try {
      // 약관 동의 정보 업데이트 API 호출
      await webApiService.auth.updateTermsAgreement({
        serviceTerms: agreed.service,
        privacyPolicy: agreed.privacy,
        marketingConsent: agreed.marketing,
        ageVerification: agreed.age,
      });

      // 인증 상태 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { isNewUser: true }
      }));

      onComplete();
    } catch (err: any) {
      console.error('약관 동의 저장 실패:', err);
      setError(err.message || '약관 동의 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openTermsDetail = (link?: string) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'kakao': return '카카오';
      case 'google': return 'Google';
      case 'apple': return 'Apple';
      default: return provider;
    }
  };

  return (
    <div className="h-full bg-white flex flex-col mx-auto max-w-md px-5 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between h-10 mb-4">
        <button
          onClick={close}
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
          환영합니다!
        </h1>
        <p className="text-gray-500">
          {getProviderName(userInfo.provider)}로 가입을 진행합니다
        </p>
        {userInfo.name && (
          <p className="text-gray-700 mt-1 font-medium">{userInfo.name}님</p>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* 약관 동의 */}
      <div className="flex-1">
        <p className="text-sm text-gray-600 mb-4">
          서비스 이용을 위해 약관에 동의해주세요
        </p>

        {/* 전체 동의 */}
        <button
          type="button"
          onClick={handleToggleAll}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-colors mb-4"
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            allAgreed ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
          }`}>
            {allAgreed && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-lg font-semibold text-gray-900">전체 동의</span>
        </button>

        {/* 구분선 */}
        <div className="border-t border-gray-200 my-4" />

        {/* 개별 약관 */}
        <div className="space-y-2">
          {TERMS.map((term) => (
            <div key={term.key} className="flex items-center justify-between py-3">
              <button
                type="button"
                onClick={() => handleToggle(term.key)}
                className="flex items-center gap-3 flex-1"
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  agreed[term.key] ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  {agreed[term.key] && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-700 text-left">
                  <span className={term.required ? 'text-blue-600' : 'text-gray-400'}>
                    [{term.required ? '필수' : '선택'}]
                  </span>{' '}
                  {term.label}
                </span>
              </button>
              {term.link && (
                <button
                  type="button"
                  onClick={() => openTermsDetail(term.link)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 완료 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!allRequiredAgreed || loading}
        className="w-full rounded-xl bg-blue-600 py-4 text-base font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300 transition-colors mt-6"
      >
        {loading ? '처리 중...' : '동의하고 시작하기'}
      </button>
    </div>
  );
}
