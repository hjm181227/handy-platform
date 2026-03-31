import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StepLayout, StepTitle, StepInput, StepButton } from '../common';

interface NameStepProps {
  name: string;
  onNext: (name: string) => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
  error?: string | null;
}

export function NameStep({
  name: initialName,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
  error: externalError,
}: NameStepProps) {
  const { t } = useTranslation(['auth', 'common']);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 자동 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(t('auth:signup.nameRequired'));
      return;
    }

    if (trimmedName.length < 2) {
      setError(t('auth:signup.nameTooShort'));
      return;
    }

    if (trimmedName.length > 50) {
      setError(t('auth:signup.nameTooLong'));
      return;
    }

    setError(null);
    onNext(trimmedName);
  };

  return (
    <StepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <StepTitle
          title={t('auth:signup.nameTitle')}
          subtitle={t('auth:signup.nameSubtitle')}
        />

        <StepInput
          ref={inputRef}
          type="text"
          placeholder={t('auth:signup.namePlaceholderShort')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error || externalError || undefined}
          autoComplete="name"
        />

        <div className="flex-1" />

        <StepButton
          type="submit"
          disabled={!name.trim()}
        >
          {t('common:next')}
        </StepButton>
      </form>
    </StepLayout>
  );
}
