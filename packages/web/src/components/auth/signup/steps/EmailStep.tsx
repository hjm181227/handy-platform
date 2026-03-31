import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StepLayout, StepTitle, StepInput, StepButton } from '../common';

interface EmailStepProps {
  email: string;
  onNext: (email: string) => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
  error?: string | null;
}

// 이메일 유효성 검사
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function EmailStep({
  email: initialEmail,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
  error: externalError,
}: EmailStepProps) {
  const { t } = useTranslation(['auth', 'common']);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 자동 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!email.trim()) {
      setError(t('auth:signup.emailRequired'));
      return;
    }

    if (!isValidEmail(email)) {
      setError(t('auth:signup.emailInvalid'));
      return;
    }

    setError(null);
    onNext(email);
  };

  return (
    <StepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <StepTitle
          title={t('auth:signup.emailTitle')}
          subtitle={t('auth:signup.emailSubtitle')}
        />

        <StepInput
          ref={inputRef}
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error || externalError || undefined}
          autoComplete="email"
        />

        <div className="flex-1" />

        <StepButton
          type="submit"
          disabled={!email.trim()}
        >
          {t('common:next')}
        </StepButton>
      </form>
    </StepLayout>
  );
}
