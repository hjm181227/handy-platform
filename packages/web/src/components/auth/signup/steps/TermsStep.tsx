import { useState } from 'react';
import { StepLayout, StepTitle, StepButton } from '../common';
import type { AgreedTerms } from '../../../../hooks/useSignupFlow';

interface TermsStepProps {
  onNext: (agreedTerms: AgreedTerms) => void;
  onBack?: () => void;
  stepIndex?: number;
  totalSteps?: number;
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

export function TermsStep({ onNext, onBack, stepIndex = 1, totalSteps = 5 }: TermsStepProps) {
  const [agreed, setAgreed] = useState<AgreedTerms>({
    service: false,
    privacy: false,
    marketing: false,
    age: false,
  });

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

  const handleNext = () => {
    if (allRequiredAgreed) {
      onNext(agreed);
    }
  };

  const openTermsDetail = (link?: string) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  return (
    <StepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      showProgress={true}
      showBackButton={!!onBack}
    >
      <StepTitle
        title="서비스 이용을 위해"
        subtitle="약관에 동의해주세요"
      />

      <div className="flex-1 mt-6">
        {/* 전체 동의 */}
        <button
          type="button"
          onClick={handleToggleAll}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-colors mb-4"
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            allAgreed ? 'bg-[#E85A6B] border-[#E85A6B]' : 'border-gray-300'
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
                  agreed[term.key] ? 'bg-[#E85A6B]' : 'bg-gray-200'
                }`}>
                  {agreed[term.key] && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-700">
                  <span className={term.required ? 'text-[#E85A6B]' : 'text-gray-400'}>
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

      <StepButton onClick={handleNext} disabled={!allRequiredAgreed}>
        동의하고 계속하기
      </StepButton>
    </StepLayout>
  );
}
