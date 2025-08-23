import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import { getErrorMessageFromApiError } from '@handy-platform/shared';

export function LoginPage({ onGo }: { onGo: (to: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [auto, setAuto] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorAction, setErrorAction] = useState("");

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

  const submit = async (e?: React.FormEvent<HTMLFormElement>) => {
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
        // 자동 로그인 설정 저장 (로컬 스토리지에 플래그만 저장)
        localStorage.setItem('autoLogin', 'true');
      }
      
      console.log('로그인 성공:', response);
      
      // 인증 상태 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      
      onGo("/");
    } catch (error: any) {
      console.error('로그인 실패:', error);
      
      const errorMessage = getErrorMessageFromApiError(error);
      setError(errorMessage.message);
      setErrorAction(errorMessage.action || "");
      
      // USER_NOT_FOUND 에러인 경우 회원가입 페이지로 이동 버튼 표시
      if (error?.code === 'USER_NOT_FOUND' || error?.response?.data?.code === 'USER_NOT_FOUND') {
        setErrorAction("회원가입하기");
      }
    } finally {
      setLoading(false);
    }
  };

  const oauth = (provider: "kakao" | "apple" | "google" | "naver") => {
    try {
      (window as any).ReactNativeWebView?.postMessage(
        JSON.stringify({ type: "oauth", provider })
      );
    } catch {}
    // 데모: 해당 경로로 라우팅만
    onGo(`/auth/${provider}`);
  };

  // 간단 아이콘
  const KakaoI = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M12 4C7.58 4 4 6.9 4 10.47c0 2.2 1.47 4.13 3.68 5.26L6.8 19.9a.6.6 0 0 0 .9.69l3.76-2.2c.18.01.36.02.54.02 4.42 0 8-2.9 8-6.47C20 6.9 16.42 4 12 4z"
        fill="currentColor"
      />
    </svg>
  );
  const AppleI = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M16.36 12.2c0-2.3 1.88-3.35 1.96-3.4-1.08-1.58-2.75-1.8-3.35-1.82-1.42-.14-2.8.83-3.53.83-.74 0-1.86-.81-3.05-.79-1.57.02-3 .91-3.8 2.31-1.63 2.83-.42 7.02 1.17 9.32.78 1.12 1.71 2.38 2.93 2.34 1.18-.05 1.63-.76 3.06-.76s1.83.76 3.06.73c1.27-.02 2.07-1.14 2.84-2.26.89-1.29 1.26-2.54 1.27-2.6-.03-.01-2.43-.93-2.56-3.9zM14.9 4.9c.64-.77 1.08-1.85.96-2.93-.92.04-2.03.61-2.69 1.38-.59.69-1.11 1.78-.97 2.83 1.02.08 2.06-.52 2.7-1.28z"
        fill="currentColor"
      />
    </svg>
  );
  const GoogleI = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#EA4335" d="M12 10.2v3.84h5.45C17.02 16.9 14.77 18.6 12 18.6a6.6 6.6 0 1 1 0-13.2c1.78 0 3.39.68 4.64 1.78l2.62-2.62A10.5 10.5 0 0 0 12 1.5C6.2 1.5 1.5 6.2 1.5 12S6.2 22.5 12 22.5c5.4 0 9.9-3.9 10.35-9.0.05-.54.05-1.08.05-1.3H12z"/>
      <path fill="#4285F4" d="M23.35 12.2c0-.43-.04-.86-.1-1.26H12v3.84h6.4a5.5 5.5 0 0 1-2.38 3.62l3.62 2.8c2.11-1.95 3.31-4.83 3.31-9z"/>
      <path fill="#FBBC05" d="M6.64 14.26a6.6 6.6 0 0 1 0-4.52L3.02 6.9a10.5 10.5 0 0 0 0 10.2l3.62-2.84z"/>
      <path fill="#34A853" d="M12 22.5c2.77 0 5.1-.92 6.8-2.5l-3.62-2.8c-1 .7-2.26 1.1-3.18 1.1a6.6 6.6 0 0 1-6.36-4.0L3.02 17.1C4.73 20.4 8.1 22.5 12 22.5z"/>
    </svg>
  );
  const NaverI = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <rect width="24" height="24" rx="4" fill="#03C75A" />
      <path d="M8 7h3.5l3 4.7V7H18v10h-3.5l-3-4.7V17H8V7z" fill="white" />
    </svg>
  );

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="rounded-lg bg-gray-100 px-4 py-3 text-[15px] font-semibold">
        로그인/회원가입
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm">
            <div className="text-red-600 mb-2">{error}</div>
            {errorAction && (
              <button
                type="button"
                onClick={() => {
                  if (errorAction === "회원가입하기") {
                    onGo("/signup");
                  } else {
                    setError("");
                    setErrorAction("");
                  }
                }}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                {errorAction}
              </button>
            )}
          </div>
        )}
        
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
            setErrorAction("");
          }}
          placeholder="이메일 주소"
          className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-blue-500"
          disabled={loading}
        />

        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
              setErrorAction("");
            }}
            placeholder="비밀번호"
            className="w-full rounded-lg border px-4 py-3 pr-10 text-sm outline-none focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="비밀번호 표시 전환"
            disabled={loading}
          >
            {showPw ? "🙈" : "👁️"}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />
            자동 로그인
          </label>
          <div className="flex items-center gap-2">
            <a
              href="/find/id"
              onClick={(e) => {
                e.preventDefault();
                onGo("/find/id");
              }}
              className="hover:underline"
            >
              아이디 찾기
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="/find/pw"
              onClick={(e) => {
                e.preventDefault();
                onGo("/find/pw");
              }}
              className="hover:underline"
            >
              비밀번호 찾기
            </a>
          </div>
        </div>
      </form>

      {/* 소셜 로그인 */}
      <div className="mt-4 space-y-2">
        <button
          onClick={() => oauth("kakao")}
          className="w-full rounded-lg bg-[#FEE500] py-3 text-sm font-medium text-black inline-flex items-center justify-center gap-2"
        >
          <KakaoI /> 카카오 로그인
        </button>
        <button
          onClick={() => oauth("apple")}
          className="w-full rounded-lg bg-white border py-3 text-sm font-medium inline-flex items-center justify-center gap-2"
        >
          <AppleI /> Apple 로그인
        </button>
        <button
          onClick={() => oauth("google")}
          className="w-full rounded-lg bg-white border py-3 text-sm font-medium inline-flex items-center justify-center gap-2"
        >
          <GoogleI /> Google 로그인
        </button>
        <button
          onClick={() => oauth("naver")}
          className="w-full rounded-lg py-3 text-sm font-medium text-white inline-flex items-center justify-center gap-2"
          style={{ backgroundColor: "#03C75A" }}
        >
          <NaverI /> NAVER 로그인
        </button>
      </div>

      {/* 가입 유도 */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <span className="text-sm text-gray-700">가입만 해도 즉시 20% 할인</span>
        <button
          onClick={() => onGo("/signup")}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          회원가입
        </button>
      </div>

      {/* 비회원 주문 조회 */}
      <div className="mt-10 text-center text-sm">
        <span className="text-gray-600 mr-2">비회원으로 주문하셨나요?</span>
        <a
          href="/guest/orders"
          onClick={(e) => {
            e.preventDefault();
            onGo("/guest/orders");
          }}
          className="underline"
        >
          비회원 주문 조회
        </a>
      </div>
    </div>
  );
}