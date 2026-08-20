/**
 * @deprecated 이 페이지는 더 이상 사용되지 않습니다.
 * 소셜 로그인 시 신규 사용자는 자동으로 계정이 생성됩니다.
 * 이 페이지로 직접 접근한 사용자는 로그인 페이지로 리다이렉트됩니다.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { webApiService } from '../../services/apiService';
import { getSocialAuthState, clearSocialAuthState } from '../../utils/socialAuthState';
import { TermsAgreement, TermsState, validateTerms, getDefaultTermsState } from '../common/TermsAgreement';
import { getErrorMessageFromApiError } from '@handy-platform/shared';

export function SocialSignupPage({ onGo }: { onGo: (to: string) => void }) {
  const { t } = useTranslation(['auth', 'common']);
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
      setError(t('auth:social.socialInfoMissing'));
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

      alert(t('auth:social.welcomeUserAlert', { name: response.user?.name }));
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
        <div className="rounded-xl bg-surface px-4 py-3 text-[15px] font-semibold">
          {t('common:signup')}
        </div>
        <div className="mt-8 text-center">
          {!isInitialized ? (
            <>
              <div className="text-lg">{t('auth:social.preparingPage')}</div>
              <div className="mt-2 text-sm text-muted">{t('auth:social.pleaseWait')}</div>
            </>
          ) : (
            <>
              <div className="text-lg">{t('auth:social.socialInfoNotFound')}</div>
              <div className="mt-2 text-sm text-muted">{t('auth:social.redirectingToLogin')}</div>
              <button
                onClick={() => onGo('/login')}
                className="mt-4 rounded-full bg-brand px-4 py-2 text-white hover:bg-brand-600"
              >
                {t('auth:social.goNow')}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const providerName = {
    kakao: 'Kakao',
    google: 'Google',
    naver: 'Naver',
    apple: 'Apple'
  }[socialState.userInfo.provider] || socialState.userInfo.provider;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="rounded-xl bg-surface px-4 py-3 text-[15px] font-semibold">
        {t('auth:social.providerSignup', { provider: providerName })}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* 추가 정보 입력 */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-800">{t('auth:social.additionalInfo')}</div>
          <input
            type="tel"
            value={additionalInfo.phone}
            onChange={(e) => setAdditionalInfo(prev => ({ ...prev, phone: e.target.value }))}
            placeholder={t('auth:social.phonePlaceholderOptional')}
            className="w-full rounded-xl border border-line-strong px-4 py-3 text-sm outline-none focus:border-brand"
            disabled={loading}
          />
        </div>

        {/* 소셜 로그인 정보와 함께 약관 동의 컴포넌트 표시 */}
        <TermsAgreement
          agree={agree}
          onAgreeChange={setAgree}
          loading={loading}
          userInfo={socialState.userInfo}
          title={t('auth:social.termsAgreementTitle')}
          description={t('auth:social.termsAgreementDescription', { provider: providerName })}
        />

        {/* 회원가입 완료 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? t('auth:signup.signingUp') : t('auth:signup.signupComplete')}
        </button>

        {/* 취소 버튼 */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="w-full rounded-full border border-line py-3 text-sm font-medium text-ink hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('common:cancel')}
        </button>
      </form>
    </div>
  );
}