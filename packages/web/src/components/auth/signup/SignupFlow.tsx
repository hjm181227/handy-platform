import { useSignupFlow, SignupStep, AgreedTerms } from '../../../hooks/useSignupFlow';
import {
  TermsStep,
  EmailStep,
  PasswordStep,
  NameStep,
  PhoneVerificationStep,
  CompleteStep,
} from './steps';

interface SignupFlowProps {
  onComplete: () => void;
  onBack: () => void;
  onGoToLogin?: () => void;
}

export function SignupFlow({ onComplete, onBack, onGoToLogin }: SignupFlowProps) {
  const {
    currentStep,
    stepIndex,
    totalSteps,
    direction,
    data,
    loading,
    error,
    nextStep,
    prevStep,
    updateData,
    sendPhoneVerification,
    verifyPhoneCode,
    submitSignup,
  } = useSignupFlow();

  // 약관 동의 단계 완료
  const handleTermsNext = (agreedTerms: AgreedTerms) => {
    updateData('agreedTerms', agreedTerms);
    nextStep();
  };

  // 이메일 단계 완료
  const handleEmailNext = (email: string) => {
    updateData('email', email);
    nextStep();
  };

  // 비밀번호 단계 완료
  const handlePasswordNext = (password: string) => {
    updateData('password', password);
    nextStep();
  };

  // 이름 단계 완료
  const handleNameNext = (name: string) => {
    updateData('name', name);
    nextStep();
  };

  // 휴대폰 인증 완료 → 회원가입 제출
  const handlePhoneVerificationComplete = async () => {
    const result = await submitSignup();
    if (!result.success) {
      // 에러는 useSignupFlow에서 처리됨
    }
    // 성공 시 submitSignup 내부에서 nextStep() 호출됨
  };

  // 뒤로가기 핸들러
  const handleBack = () => {
    if (currentStep === 'terms') {
      onBack(); // 회원가입 플로우 종료
    } else {
      prevStep();
    }
  };

  // 회원가입 완료 후 쇼핑 시작
  const handleComplete = () => {
    onComplete();
  };

  // 현재 단계에 맞는 컴포넌트 렌더링
  const renderStep = () => {
    switch (currentStep) {
      case 'terms':
        return (
          <TermsStep
            onNext={handleTermsNext}
            onBack={handleBack}
            stepIndex={stepIndex + 1}
            totalSteps={totalSteps - 1}
          />
        );

      case 'email':
        return (
          <EmailStep
            email={data.email}
            onNext={handleEmailNext}
            onBack={handleBack}
            stepIndex={stepIndex + 1}
            totalSteps={totalSteps - 1} // complete 단계 제외
            error={error}
          />
        );

      case 'password':
        return (
          <PasswordStep
            password={data.password}
            onNext={handlePasswordNext}
            onBack={handleBack}
            stepIndex={stepIndex + 1}
            totalSteps={totalSteps - 1}
            error={error}
          />
        );

      case 'name':
        return (
          <NameStep
            name={data.name}
            onNext={handleNameNext}
            onBack={handleBack}
            stepIndex={stepIndex + 1}
            totalSteps={totalSteps - 1}
            error={error}
          />
        );

      case 'phone':
        return (
          <PhoneVerificationStep
            phone={data.phone}
            onComplete={handlePhoneVerificationComplete}
            onBack={handleBack}
            stepIndex={stepIndex + 1}
            totalSteps={totalSteps - 1}
            error={error}
            loading={loading}
            sendVerification={sendPhoneVerification}
            verifyCode={verifyPhoneCode}
          />
        );

      case 'complete':
        return (
          <CompleteStep
            onComplete={handleComplete}
            userName={data.name}
          />
        );

      default:
        return null;
    }
  };

  // 애니메이션 클래스 결정
  const animationClass = direction === 'forward'
    ? 'animate-slide-in-right'
    : 'animate-slide-in-left';

  return (
    <div className="signup-flow">
      <div key={currentStep} className={animationClass}>
        {renderStep()}
      </div>
    </div>
  );
}
