import { useState, useEffect, useRef } from 'react';
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
      setError('이름을 입력해주세요.');
      return;
    }

    if (trimmedName.length < 2) {
      setError('이름은 2자 이상이어야 합니다.');
      return;
    }

    if (trimmedName.length > 50) {
      setError('이름은 50자 이하여야 합니다.');
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
          title="이름을 입력해주세요"
          subtitle="배송 시 사용되는 실명을 입력해주세요"
        />

        <StepInput
          ref={inputRef}
          type="text"
          placeholder="이름"
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
          다음
        </StepButton>
      </form>
    </StepLayout>
  );
}
