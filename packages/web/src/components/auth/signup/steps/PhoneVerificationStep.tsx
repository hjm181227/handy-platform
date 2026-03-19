import { useState, useEffect, useRef, useCallback } from 'react';
import { StepLayout, StepTitle, StepInput, StepButton } from '../common';

interface PhoneVerificationStepProps {
  phone: string;
  onComplete: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
  error?: string | null;
  loading?: boolean;
  sendVerification: (phone: string) => Promise<{ success: boolean; expiresAt?: string; error?: string }>;
  verifyCode: (code: string) => Promise<{ success: boolean; error?: string }>;
}

// 휴대폰 번호 포맷팅 (010-1234-5678)
const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};

// 휴대폰 번호 유효성 검사
const isValidPhone = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, '');
  return /^01[0-9]{8,9}$/.test(numbers);
};

// 남은 시간 포맷 (mm:ss)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function PhoneVerificationStep({
  phone: initialPhone,
  onComplete,
  onBack,
  stepIndex,
  totalSteps,
  error: externalError,
  loading = false,
  sendVerification,
  verifyCode,
}: PhoneVerificationStepProps) {
  // 휴대폰 입력 상태
  const [phone, setPhone] = useState(initialPhone ? formatPhoneNumber(initialPhone) : '');
  const [codeSent, setCodeSent] = useState(false);

  // 인증 코드 상태
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 타이머 상태
  const [timeLeft, setTimeLeft] = useState(180); // 3분
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 입력 refs
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // 자동 포커스
  useEffect(() => {
    if (!codeSent) {
      phoneInputRef.current?.focus();
    } else {
      codeInputRef.current?.focus();
    }
  }, [codeSent]);

  // 타이머 관리
  useEffect(() => {
    if (codeSent && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [codeSent, timeLeft]);

  // 60초 후 재전송 활성화
  useEffect(() => {
    if (codeSent && timeLeft <= 120) { // 1분 지나면
      setCanResend(true);
    }
  }, [codeSent, timeLeft]);

  // 인증번호 발송
  const handleSendCode = useCallback(async () => {
    if (!isValidPhone(phone)) {
      setError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    setError(null);
    const phoneNumber = phone.replace(/\D/g, '');
    const result = await sendVerification(phoneNumber);

    if (result.success) {
      setCodeSent(true);
      setTimeLeft(180);
      setCanResend(false);
      setCode('');
    } else {
      setError(result.error || '인증번호 발송에 실패했습니다.');
    }
  }, [phone, sendVerification]);

  // 재전송
  const handleResend = useCallback(async () => {
    if (!canResend || loading) return;

    setError(null);
    const phoneNumber = phone.replace(/\D/g, '');
    const result = await sendVerification(phoneNumber);

    if (result.success) {
      setTimeLeft(180);
      setCanResend(false);
      setCode('');
      codeInputRef.current?.focus();
    } else {
      setError(result.error || '인증번호 재발송에 실패했습니다.');
    }
  }, [canResend, loading, phone, sendVerification]);

  // 인증번호 확인
  const handleVerifyCode = useCallback(async () => {
    if (code.length !== 6) {
      setError('6자리 인증번호를 입력해주세요.');
      return;
    }

    if (timeLeft === 0) {
      setError('인증번호가 만료되었습니다. 재전송해주세요.');
      return;
    }

    setError(null);
    const result = await verifyCode(code);

    if (result.success) {
      onComplete();
    } else {
      setError(result.error || '인증번호가 일치하지 않습니다.');
    }
  }, [code, timeLeft, verifyCode, onComplete]);

  // 인증번호 입력 시 자동 검증 (6자리 완성 시)
  const handleCodeChange = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 6);
    setCode(numbers);

    // 6자리 입력 완료 시 자동 검증
    if (numbers.length === 6) {
      setTimeout(() => handleVerifyCode(), 100);
    }
  };

  // 휴대폰 번호 입력 핸들러
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  // 휴대폰 번호 입력 폼
  if (!codeSent) {
    return (
      <StepLayout
        currentStep={stepIndex}
        totalSteps={totalSteps}
        onBack={onBack}
      >
        <div className="flex-1 flex flex-col">
          <StepTitle
            title="휴대폰 번호를 인증해주세요"
            subtitle="본인 확인을 위해 인증이 필요해요"
          />

          <StepInput
            ref={phoneInputRef}
            type="tel"
            placeholder="010-1234-5678"
            value={phone}
            onChange={handlePhoneChange}
            error={error || externalError || undefined}
            autoComplete="tel"
          />

          <div className="flex-1" />

          <StepButton
            onClick={handleSendCode}
            disabled={!isValidPhone(phone) || loading}
            loading={loading}
          >
            인증번호 받기
          </StepButton>
        </div>
      </StepLayout>
    );
  }

  // 인증번호 입력 폼
  return (
    <StepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={() => setCodeSent(false)}
    >
      <div className="flex-1 flex flex-col">
        <StepTitle
          title="인증번호를 입력해주세요"
          subtitle={
            <>
              <span className="text-[#E85A6B] font-medium">{phone}</span>
              으로 전송했어요
            </>
          }
        />

        {/* 인증번호 입력 */}
        <div className="relative">
          <StepInput
            ref={codeInputRef}
            type="text"
            inputMode="numeric"
            placeholder="인증번호 6자리"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            error={error || externalError || undefined}
            autoComplete="one-time-code"
          />

          {/* 타이머 */}
          <div
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium ${
              timeLeft <= 30 ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            {timeLeft > 0 ? formatTime(timeLeft) : '만료'}
          </div>
        </div>

        {/* 재전송 버튼 */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || loading}
            className={`text-sm ${
              canResend && !loading
                ? 'text-[#E85A6B] hover:underline'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? '발송 중...' : '인증번호 재전송'}
          </button>
        </div>

        <div className="flex-1" />

        <StepButton
          onClick={handleVerifyCode}
          disabled={code.length !== 6 || loading}
          loading={loading}
        >
          확인
        </StepButton>
      </div>
    </StepLayout>
  );
}
