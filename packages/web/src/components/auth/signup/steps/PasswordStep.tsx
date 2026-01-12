import { useState, useEffect, useRef } from 'react';
import { StepLayout, StepTitle, StepInput, StepButton } from '../common';

interface PasswordStepProps {
  password: string;
  onNext: (password: string) => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
  error?: string | null;
}

// 비밀번호 요구사항 검사
const checkPasswordRequirements = (password: string) => ({
  minLength: password.length >= 8,
  hasLetterAndNumber: /[a-zA-Z]/.test(password) && /\d/.test(password),
});

export function PasswordStep({
  password: initialPassword,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
  error: externalError,
}: PasswordStepProps) {
  const [password, setPassword] = useState(initialPassword);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const requirements = checkPasswordRequirements(password);
  const isValid = requirements.minLength && requirements.hasLetterAndNumber;

  // 자동 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    if (!isValid) {
      setError('비밀번호 요구사항을 충족해주세요.');
      return;
    }

    setError(null);
    onNext(password);
  };

  return (
    <StepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <StepTitle
          title="비밀번호를 설정해주세요"
          subtitle="안전한 비밀번호로 계정을 보호해요"
        />

        <StepInput
          ref={inputRef}
          type="password"
          placeholder="비밀번호 입력"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error || externalError || undefined}
          showPasswordToggle
          autoComplete="new-password"
        />

        {/* 비밀번호 요구사항 표시 */}
        <div className="mt-4 space-y-2">
          <RequirementItem
            met={requirements.minLength}
            text="8자 이상"
          />
          <RequirementItem
            met={requirements.hasLetterAndNumber}
            text="영문, 숫자 포함"
          />
        </div>

        <div className="flex-1" />

        <StepButton
          type="submit"
          disabled={!isValid}
        >
          다음
        </StepButton>
      </form>
    </StepLayout>
  );
}

// 요구사항 아이템 컴포넌트
function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
          met ? 'bg-green-500' : 'bg-gray-200'
        }`}
      >
        {met && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-sm ${met ? 'text-green-600' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  );
}
