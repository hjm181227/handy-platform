import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import { getErrorMessageFromApiError } from '@handy-platform/shared';
import { TermsOfService, PrivacyPolicy, PersonalDataConsent } from './PolicyPages';

export function SignupPage({ onGo }: { onGo: (to: string) => void }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: ""
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorAction, setErrorAction] = useState("");
  const [agree, setAgree] = useState({
    terms: false,
    privacy: false,
    personalData: false,
    marketing: false
  });
  const [showPolicy, setShowPolicy] = useState<'terms' | 'privacy' | 'personalData' | null>(null);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(""); // 입력 시 에러 메시지 초기화
    setErrorAction("");
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError("이메일, 비밀번호, 이름은 필수 입력사항입니다.");
      return false;
    }

    if (!formData.email.includes('@')) {
      setError("올바른 이메일 주소를 입력해주세요.");
      return false;
    }

    if (formData.password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }

    if (!agree.terms || !agree.privacy || !agree.personalData) {
      setError("필수 약관에 모두 동의해주세요.");
      return false;
    }

    return true;
  };

  const submit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await webApiService.auth.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || undefined
      });
      
      // 회원가입 성공 시 자동으로 토큰 저장
      await webApiService.auth.setAuthToken(response.token, response.user);
      
      console.log('회원가입 성공:', response);
      
      // 인증 상태 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      
      alert(`회원가입 성공! 환영합니다, ${response.user?.name}님!`);
      onGo("/");
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      
      const errorMessage = getErrorMessageFromApiError(error);
      setError(errorMessage.message);
      setErrorAction(errorMessage.action || "");
      
      // USER_ALREADY_EXISTS 에러인 경우 로그인 페이지로 이동 버튼 표시
      if (error?.code === 'USER_ALREADY_EXISTS' || error?.response?.data?.code === 'USER_ALREADY_EXISTS') {
        setErrorAction("로그인하기");
      }
    } finally {
      setLoading(false);
    }
  };

  const fillTestData = () => {
    setFormData({
      email: "newuser@test.com",
      password: "password123",
      confirmPassword: "password123",
      name: "테스트 사용자",
      phone: "010-1234-5678"
    });
    setAgree({
      terms: true,
      privacy: true,
      personalData: true,
      marketing: false
    });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="rounded-lg bg-gray-100 px-4 py-3 text-[15px] font-semibold">
        회원가입
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm">
            <div className="text-red-600 mb-2">{error}</div>
            {errorAction && (
              <button
                type="button"
                onClick={() => {
                  if (errorAction === "로그인하기") {
                    onGo("/login");
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

        {/* 테스트 데이터 버튼 */}
        <button
          type="button"
          onClick={fillTestData}
          className="w-full rounded-lg bg-blue-50 border border-blue-200 py-2 text-sm text-blue-600 hover:bg-blue-100"
        >
          📝 테스트 데이터 자동 입력
        </button>

        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="이메일 주소 *"
          className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-blue-500"
          disabled={loading}
          required
        />

        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="이름 *"
          className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-blue-500"
          disabled={loading}
          required
        />

        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="휴대폰 번호 (선택)"
          className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-blue-500"
          disabled={loading}
        />

        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="비밀번호 (6자 이상) *"
            className="w-full rounded-lg border px-4 py-3 pr-10 text-sm outline-none focus:border-blue-500"
            disabled={loading}
            required
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

        <div className="relative">
          <input
            type={showConfirmPw ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="비밀번호 확인 *"
            className="w-full rounded-lg border px-4 py-3 pr-10 text-sm outline-none focus:border-blue-500"
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="비밀번호 확인 표시 전환"
            disabled={loading}
          >
            {showConfirmPw ? "🙈" : "👁️"}
          </button>
        </div>

        {/* 약관 동의 */}
        <div className="space-y-3 rounded-lg border bg-gray-50 px-4 py-4">
          <div className="text-sm font-semibold text-gray-800">약관 동의</div>
          
          {/* 전체 동의 */}
          <label className="flex items-center gap-2 text-sm border-b pb-2">
            <input
              type="checkbox"
              checked={agree.terms && agree.privacy && agree.personalData && agree.marketing}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setAgree({
                  terms: isChecked,
                  privacy: isChecked,
                  personalData: isChecked,
                  marketing: isChecked
                });
              }}
              disabled={loading}
              className="rounded"
            />
            <span className="font-medium">전체 동의</span>
          </label>

          {/* 이용약관 */}
          <label className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={agree.terms}
                onChange={(e) => setAgree(prev => ({ ...prev, terms: e.target.checked }))}
                disabled={loading}
                className="rounded"
              />
              <span>서비스 이용약관 동의 <span className="text-red-500">(필수)</span></span>
            </div>
            <button
              type="button"
              onClick={() => setShowPolicy('terms')}
              className="text-blue-600 hover:text-blue-800 text-xs underline"
            >
              전문보기
            </button>
          </label>

          {/* 개인정보처리방침 */}
          <label className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={agree.privacy}
                onChange={(e) => setAgree(prev => ({ ...prev, privacy: e.target.checked }))}
                disabled={loading}
                className="rounded"
              />
              <span>개인정보처리방침 동의 <span className="text-red-500">(필수)</span></span>
            </div>
            <button
              type="button"
              onClick={() => setShowPolicy('privacy')}
              className="text-blue-600 hover:text-blue-800 text-xs underline"
            >
              전문보기
            </button>
          </label>

          {/* 개인정보수집동의서 */}
          <label className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={agree.personalData}
                onChange={(e) => setAgree(prev => ({ ...prev, personalData: e.target.checked }))}
                disabled={loading}
                className="rounded"
              />
              <span>개인정보 수집 및 이용 동의 <span className="text-red-500">(필수)</span></span>
            </div>
            <button
              type="button"
              onClick={() => setShowPolicy('personalData')}
              className="text-blue-600 hover:text-blue-800 text-xs underline"
            >
              전문보기
            </button>
          </label>

          {/* 마케팅 정보 수신 동의 */}
          <label className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={agree.marketing}
                onChange={(e) => setAgree(prev => ({ ...prev, marketing: e.target.checked }))}
                disabled={loading}
                className="rounded"
              />
              <span>마케팅 정보 수신 동의 <span className="text-gray-500">(선택)</span></span>
            </div>
            <div className="text-xs text-gray-500">SMS, 이메일</div>
          </label>

          {/* 필수 약관 안내 */}
          <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
            💡 필수 약관에 동의하지 않으시면 회원가입이 제한됩니다.
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>

      {/* 로그인 페이지로 이동 */}
      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600 mr-2">이미 계정이 있으신가요?</span>
        <button
          onClick={() => onGo("/login")}
          className="underline text-blue-600 hover:text-blue-800"
        >
          로그인하기
        </button>
      </div>

      {/* Policy Modals */}
      {showPolicy === 'terms' && <TermsOfService onClose={() => setShowPolicy(null)} />}
      {showPolicy === 'privacy' && <PrivacyPolicy onClose={() => setShowPolicy(null)} />}
      {showPolicy === 'personalData' && <PersonalDataConsent onClose={() => setShowPolicy(null)} />}
    </div>
  );
}