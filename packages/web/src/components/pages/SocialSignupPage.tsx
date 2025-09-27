import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import { getSocialAuthState, clearSocialAuthState } from '../../utils/socialAuthState';
import { TermsAgreement, TermsState, validateTerms, getDefaultTermsState } from '../common/TermsAgreement';
import { getErrorMessageFromApiError } from '@handy-platform/shared';

export function SocialSignupPage({ onGo }: { onGo: (to: string) => void }) {
  const [socialState, setSocialState] = useState(getSocialAuthState());
  const [agree, setAgree] = useState<TermsState>(getDefaultTermsState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState({ phone: '' });
  const [isInitialized, setIsInitialized] = useState(false);

  // 소셜 인증 상태 확인 및 복구 시도
  useEffect(() => {
    console.log('🔍 SocialSignupPage 초기화 중...');
    
    const initializePage = async () => {
      // URL에서 provider 파라미터 확인
      const urlParams = new URLSearchParams(window.location.search);
      const provider = urlParams.get('provider');
      console.log('📝 URL provider 파라미터:', provider);
      
      // 소셜 상태 확인
      const currentSocialState = getSocialAuthState();
      console.log('💾 현재 소셜 상태:', currentSocialState);
      
      if (currentSocialState) {
        setSocialState(currentSocialState);
        console.log('✅ 소셜 상태 복구 성공');
      } else {
        console.warn('❌ 소셜 인증 상태가 없습니다.');
        // 즉시 리다이렉트하지 않고 3초 대기 후 이동
        setTimeout(() => {
          console.log('⏰ 3초 대기 후 로그인 페이지로 이동');
          onGo('/login');
        }, 3000);
      }
      
      setIsInitialized(true);
    };

    initializePage();
  }, [onGo]);

  // 이미 로그인된 사용자는 홈으로 리다이렉트 (단, 소셜 회원가입 진행 중이 아닐 때만)
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // 소셜 회원가입 진행 중이면 인증 체크를 하지 않음
      const currentSocialState = getSocialAuthState();
      if (currentSocialState) {
        console.log('🔄 소셜 회원가입 진행 중이므로 인증 체크를 건너뜀');
        return;
      }

      const isAuthenticated = await webApiService.isAuthenticated();
      if (isAuthenticated) {
        console.log('✅ 이미 로그인된 사용자, 홈으로 리다이렉트');
        onGo('/');
      }
    };
    checkAuthAndRedirect();
  }, [onGo]);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    
    if (!socialState) {
      setError('소셜 로그인 정보가 없습니다. 다시 시도해주세요.');
      return;
    }

    // 약관 동의 검증 (프론트엔드에서만)
    const termsError = validateTerms(agree);
    if (termsError) {
      setError(termsError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 소셜 회원가입 API 호출 - 사용자 정보만 전송
      const response = await webApiService.signupWithOauth({
        provider: socialState.userInfo.provider,
        kakaoUserInfo: {
          id: socialState.userInfo.id,
          email: socialState.userInfo.email,
          name: socialState.userInfo.name,
          profileImage: socialState.userInfo.profileImage
        },
        additionalInfo: {
          phone: additionalInfo.phone || undefined
        }
      });

      // 회원가입 성공 시 토큰 저장
      await webApiService.auth.setAuthToken(response.token, response.user);

      console.log('소셜 회원가입 완료:', response);

      // 소셜 인증 임시 상태 삭제
      clearSocialAuthState();

      // 인증 상태 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('authStateChanged'));

      alert(`환영합니다, ${response.user?.name}님!`);
      onGo('/');

    } catch (error: any) {
      console.error('소셜 회원가입 실패:', error);
      
      const errorMessage = getErrorMessageFromApiError(error);
      setError(errorMessage.message);

    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // 소셜 인증 상태 삭제 후 로그인 페이지로 이동
    clearSocialAuthState();
    onGo('/login');
  };

  // 초기화 중이거나 소셜 상태가 없으면 로딩 화면 표시
  if (!isInitialized || !socialState) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="rounded-lg bg-gray-100 px-4 py-3 text-[15px] font-semibold">
          소셜 회원가입
        </div>
        <div className="mt-8 text-center">
          {!isInitialized ? (
            <>
              <div className="text-lg">페이지를 준비하고 있습니다...</div>
              <div className="mt-2 text-sm text-gray-600">잠시만 기다려주세요</div>
            </>
          ) : (
            <>
              <div className="text-lg">소셜 로그인 정보를 찾을 수 없습니다</div>
              <div className="mt-2 text-sm text-gray-600">3초 후 로그인 페이지로 이동합니다</div>
              <button
                onClick={() => onGo('/login')}
                className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                지금 이동하기
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const providerName = {
    kakao: '카카오',
    google: 'Google',
    naver: 'NAVER',
    apple: 'Apple'
  }[socialState.userInfo.provider] || socialState.userInfo.provider;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="rounded-lg bg-gray-100 px-4 py-3 text-[15px] font-semibold">
        {providerName} 회원가입
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* 추가 정보 입력 */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-800">추가 정보 (선택사항)</div>
          <input
            type="tel"
            value={additionalInfo.phone}
            onChange={(e) => setAdditionalInfo(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="휴대폰 번호 (선택)"
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-blue-500"
            disabled={loading}
          />
        </div>

        {/* 소셜 로그인 정보와 함께 약관 동의 컴포넌트 표시 */}
        <TermsAgreement
          agree={agree}
          onAgreeChange={setAgree}
          loading={loading}
          userInfo={socialState.userInfo}
          title="회원가입 약관 동의"
          description={`${providerName} 계정으로 가입하려면 아래 약관에 동의해주세요.`}
        />

        {/* 회원가입 완료 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? '가입 중...' : '회원가입 완료'}
        </button>

        {/* 취소 버튼 */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          취소
        </button>
      </form>
    </div>
  );
}