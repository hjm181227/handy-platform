import { useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import { SignupFlow } from '../auth/signup';

export function SignupPage({ onGo }: { onGo: (to: string) => void }) {
  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const isAuthenticated = await webApiService.isAuthenticated();
      if (isAuthenticated) {
        onGo("/");
      }
    };
    checkAuthAndRedirect();
  }, [onGo]);

  // 회원가입 완료 후
  const handleComplete = () => {
    // 인증 상태 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    onGo("/");
  };

  // 뒤로가기 (로그인 페이지로)
  const handleBack = () => {
    onGo("/login");
  };

  return (
    <SignupFlow
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}
