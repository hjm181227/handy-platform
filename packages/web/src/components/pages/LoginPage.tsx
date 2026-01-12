import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import { initKakaoSdk } from '../../utils/kakaoSdk';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';

export function LoginPage({ onGo }: { onGo: (to: string) => void }) {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [auto, setAuto] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 이미 로그인된 사용자는 홈으로 리다이렉트 & 카카오 SDK 초기화
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const isAuthenticated = await webApiService.isAuthenticated();
      if (isAuthenticated) {
        onGo("/");
      }
    };

    const initSdk = async () => {
      try {
        await initKakaoSdk();
      } catch (error) {
        console.warn('카카오 SDK 초기화 실패:', error);
      }
    };

    checkAuthAndRedirect();
    initSdk();
  }, [onGo]);

  const handleEmailLogin = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력하세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await webApiService.loginAndStoreToken({ email, password });

      if (auto) {
        localStorage.setItem('autoLogin', 'true');
      }

      window.dispatchEvent(new CustomEvent('authStateChanged'));
      onGo("/");
    } catch (error: any) {
      console.error('로그인 실패:', error);
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "kakao" | "apple" | "google") => {
    setLoading(true);
    setError("");

    try {
      // React Native WebView 환경인 경우
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(
          JSON.stringify({ type: "oauth", provider })
        );
        return;
      }

      if (provider === "kakao") {
        await handleKakaoLogin();
      } else if (provider === "google") {
        setError("Google 로그인은 준비 중입니다.");
      } else if (provider === "apple") {
        setError("Apple 로그인은 iOS 앱에서만 사용 가능합니다.");
      }
    } catch (error: any) {
      console.error(`${provider} 로그인 실패:`, error);
      setError(error.message || `${provider} 로그인에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    if (!window.Kakao) {
      throw new Error('카카오 SDK가 로드되지 않았습니다.');
    }

    if (!window.Kakao.isInitialized()) {
      const appKey = import.meta.env.VITE_KAKAO_APP_KEY;
      window.Kakao.init(appKey);
    }

    if (!window.Kakao.Auth || !window.Kakao.Auth.login) {
      throw new Error('카카오 Auth 모듈을 사용할 수 없습니다.');
    }

    const accessToken = await new Promise<string>((resolve, reject) => {
      window.Kakao.Auth.login({
        success: (authObj: any) => {
          if (authObj?.access_token) {
            resolve(authObj.access_token);
          } else {
            reject(new Error('액세스 토큰을 받지 못했습니다.'));
          }
        },
        fail: () => {
          reject(new Error('카카오 로그인이 취소되었습니다.'));
        }
      });
    });

    const response = await webApiService.oauthLogin('kakao', accessToken);

    // 소셜 로그인 성공 (신규 사용자는 자동으로 계정 생성됨)
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: { isNewUser: response.isNewUser }
    }));
    onGo("/");

    // 신규 가입자인 경우 환영 메시지 표시 (선택적)
    if (response.isNewUser) {
      console.log('🎉 새로운 회원님 환영합니다!');
    }
  };

  // 아이콘 컴포넌트
  const KakaoIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M12 4C7.58 4 4 6.9 4 10.47c0 2.2 1.47 4.13 3.68 5.26L6.8 19.9a.6.6 0 0 0 .9.69l3.76-2.2c.18.01.36.02.54.02 4.42 0 8-2.9 8-6.47C20 6.9 16.42 4 12 4z"
        fill="currentColor"
      />
    </svg>
  );

  const AppleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M16.36 12.2c0-2.3 1.88-3.35 1.96-3.4-1.08-1.58-2.75-1.8-3.35-1.82-1.42-.14-2.8.83-3.53.83-.74 0-1.86-.81-3.05-.79-1.57.02-3 .91-3.8 2.31-1.63 2.83-.42 7.02 1.17 9.32.78 1.12 1.71 2.38 2.93 2.34 1.18-.05 1.63-.76 3.06-.76s1.83.76 3.06.73c1.27-.02 2.07-1.14 2.84-2.26.89-1.29 1.26-2.54 1.27-2.6-.03-.01-2.43-.93-2.56-3.9zM14.9 4.9c.64-.77 1.08-1.85.96-2.93-.92.04-2.03.61-2.69 1.38-.59.69-1.11 1.78-.97 2.83 1.02.08 2.06-.52 2.7-1.28z"
        fill="currentColor"
      />
    </svg>
  );

  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#EA4335" d="M5.27 9.76A6.97 6.97 0 0 1 12 5.03c1.66 0 3.16.56 4.35 1.5l3.25-3.25A11.94 11.94 0 0 0 12 0C7.39 0 3.4 2.6 1.39 6.41l3.88 3.35z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.76-3.09c-1.08.72-2.45 1.16-4.17 1.16-3.18 0-5.88-2.11-6.85-4.97l-3.91 3.02C3.34 21.35 7.3 24 12 24z"/>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.76 3.09c2.2-2.03 3.46-5.02 3.46-8.91z"/>
      <path fill="#FBBC05" d="M5.15 14.19A7.12 7.12 0 0 1 4.75 12c0-.76.14-1.5.37-2.19L1.24 6.46A11.93 11.93 0 0 0 0 12c0 1.92.45 3.74 1.24 5.35l3.91-3.16z"/>
    </svg>
  );

  // 이메일 로그인 폼
  if (showEmailLogin) {
    return (
      <div className="h-screen bg-white mx-auto max-w-md px-5 py-6 flex flex-col overflow-y-auto">
        {/* 뒤로가기 */}
        <button
          onClick={() => setShowEmailLogin(false)}
          className="flex items-center justify-center w-10 h-10 -ml-2 mb-4 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인</h1>
        <p className="text-gray-500 mb-8">이메일로 로그인하세요</p>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="이메일 주소"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-base outline-none focus:border-blue-600 transition-colors"
            disabled={loading}
          />

          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="비밀번호"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 pr-12 text-base outline-none focus:border-blue-600 transition-colors"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showPw ? <VscEye className="w-5 h-5" /> : <VscEyeClosed className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 text-gray-600">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              자동 로그인
            </label>
            <button
              type="button"
              onClick={() => onGo("/find/pw")}
              className="text-gray-500 hover:text-gray-700"
            >
              비밀번호 찾기
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-4 text-base font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-500 text-sm">계정이 없으신가요? </span>
          <button
            onClick={() => onGo("/signup")}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            회원가입
          </button>
        </div>
      </div>
    );
  }

  // 시작 화면 (소셜 로그인 우선)
  return (
    <div className="h-screen bg-white flex flex-col mx-auto max-w-md px-5 overflow-y-auto">
      {/* 상단 여백 */}
      <div className="flex-1 min-h-[20px]" />

      {/* 로고 및 태그라인 */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Handy</h1>
        <p className="text-gray-500 text-lg">나를 위한 네일아트, 핸디</p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* 소셜 로그인 버튼 */}
      <div className="space-y-3">
        {/* Apple 로그인 - iOS 앱에서만 표시 (WebView 감지) */}
        {(window as any).ReactNativeWebView && (
          <button
            onClick={() => handleSocialLogin("apple")}
            disabled={loading}
            className="w-full rounded-xl bg-black py-4 text-base font-medium text-white inline-flex items-center justify-center gap-3 hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
          >
            <AppleIcon />
            Apple로 계속하기
          </button>
        )}

        {/* 카카오 로그인 */}
        <button
          onClick={() => handleSocialLogin("kakao")}
          disabled={loading}
          className="w-full rounded-xl py-4 text-base font-medium text-gray-900 inline-flex items-center justify-center gap-3 disabled:bg-gray-200 transition-colors"
          style={{ backgroundColor: loading ? '#e5e7eb' : '#FEE500' }}
        >
          <KakaoIcon />
          카카오로 계속하기
        </button>

        {/* Google 로그인 */}
        <button
          onClick={() => handleSocialLogin("google")}
          disabled={loading}
          className="w-full rounded-xl border-2 border-gray-200 bg-white py-4 text-base font-medium text-gray-700 inline-flex items-center justify-center gap-3 hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
        >
          <GoogleIcon />
          Google로 계속하기
        </button>
      </div>

      {/* 구분선 */}
      <div className="flex items-center my-8">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="mx-4 text-sm text-gray-400">또는</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      {/* 이메일로 시작하기 */}
      <button
        onClick={() => onGo("/signup")}
        disabled={loading}
        className="w-full rounded-xl border-2 border-gray-900 bg-white py-4 text-base font-medium text-gray-900 hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
      >
        이메일로 시작하기
      </button>

      {/* 기존 계정 로그인 링크 */}
      <div className="mt-6 text-center">
        <span className="text-gray-500 text-sm">이미 계정이 있나요? </span>
        <button
          onClick={() => setShowEmailLogin(true)}
          className="text-blue-600 text-sm font-medium hover:underline"
        >
          로그인
        </button>
      </div>

      {/* 하단 여백 */}
      <div className="flex-1 min-h-[40px]" />
    </div>
  );
}
