import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import { getErrorMessageFromApiError } from '@handy-platform/shared';
import { TermsAgreement, TermsState, validateTerms, getDefaultTermsState } from '../common/TermsAgreement';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';

export function SignupPage({ onGo }: { onGo: (to: string) => void }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    verificationToken: ""  // SMS 인증 완료 토큰
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorAction, setErrorAction] = useState("");
  const [agree, setAgree] = useState<TermsState>(getDefaultTermsState());

  // SMS 인증 관련 상태
  const [phoneVerificationStep, setPhoneVerificationStep] = useState<'input' | 'pending' | 'verified'>('input');
  const [verificationCode, setVerificationCode] = useState("");
  const [requestId, setRequestId] = useState("");
  const [remainingTime, setRemainingTime] = useState(0);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");

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

  // 타이머 카운트다운
  useEffect(() => {
    if (remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime(t => {
        if (t <= 1) {
          clearInterval(interval);
          setPhoneVerificationStep('input');
          setVerificationError("인증 시간이 만료되었습니다. 다시 시도해주세요.");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingTime]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
    setErrorAction("");
    setVerificationError("");
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name || !formData.phone) {
      setError("이메일, 비밀번호, 이름, 휴대폰 번호는 필수 입력사항입니다.");
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

    // 휴대폰 번호 형식 검증
    const cleanedPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!/^010\d{8}$/.test(cleanedPhone)) {
      setError("올바른 휴대폰 번호를 입력해주세요. (예: 01012345678)");
      return false;
    }

    // SMS 인증 완료 확인
    if (phoneVerificationStep !== 'verified') {
      setError("휴대폰 본인인증을 완료해주세요.");
      return false;
    }

    const termsError = validateTerms(agree);
    if (termsError) {
      setError(termsError);
      return false;
    }

    return true;
  };

  // SMS 인증 코드 발송
  const handleSendVerificationCode = async () => {
    const cleanedPhone = formData.phone.replace(/[^0-9]/g, '');

    if (!/^010\d{8}$/.test(cleanedPhone)) {
      setVerificationError("올바른 휴대폰 번호를 입력해주세요. (예: 01012345678)");
      return;
    }

    setVerificationLoading(true);
    setVerificationError("");

    try {
      // TODO: 실제 SMS 인증 API 연동
      // const response = await verificationService.sendVerificationCode({
      //   phone: cleanedPhone,
      //   type: 'signup'
      // });

      // 임시: 시뮬레이션
      const response = {
        requestId: `req_${Date.now()}`,
        expiresIn: 300  // 5분
      };

      setRequestId(response.requestId);
      setPhoneVerificationStep('pending');
      setRemainingTime(response.expiresIn);
      alert(`인증 코드가 발송되었습니다.\n(개발 중: 임시 코드는 123456입니다)`);
    } catch (error: any) {
      console.error('인증 코드 발송 실패:', error);
      const errorMessage = getErrorMessageFromApiError(error);
      setVerificationError(errorMessage.message || '인증 코드 발송에 실패했습니다.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // SMS 인증 코드 검증
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setVerificationError("6자리 인증 코드를 입력해주세요.");
      return;
    }

    setVerificationLoading(true);
    setVerificationError("");

    try {
      // TODO: 실제 SMS 인증 API 연동
      // const response = await verificationService.verifyCode({
      //   phone: formData.phone.replace(/[^0-9]/g, ''),
      //   code: verificationCode,
      //   requestId: requestId
      // });

      // 임시: 시뮬레이션 (123456이면 성공)
      if (verificationCode === '123456') {
        const response = {
          verified: true,
          verificationToken: `token_${Date.now()}`,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          phone: formData.phone
        };

        setFormData(prev => ({
          ...prev,
          verificationToken: response.verificationToken
        }));
        setPhoneVerificationStep('verified');
        setVerificationCode("");
      } else {
        throw new Error('인증 코드가 올바르지 않습니다.');
      }
    } catch (error: any) {
      console.error('인증 코드 검증 실패:', error);
      const errorMessage = getErrorMessageFromApiError(error);
      setVerificationError(errorMessage.message || '인증 코드가 올바르지 않습니다.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // 재발송
  const handleResendCode = async () => {
    setVerificationCode("");
    setVerificationError("");
    await handleSendVerificationCode();
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
        phone: formData.phone.replace(/[^0-9]/g, ''),  // 숫자만 전송
        verificationToken: formData.verificationToken
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

  // 포맷팅된 타이머 표시
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
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

        {/* 휴대폰 인증 섹션 */}
        <div className="space-y-2">
          {phoneVerificationStep === 'input' && (
            <div className="space-y-2">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="휴대폰 번호 (01012345678) *"
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-blue-500"
                disabled={loading || verificationLoading}
                pattern="^01[0-9]\d{7,8}$"
                required
              />
              <button
                type="button"
                onClick={handleSendVerificationCode}
                className="w-full rounded-lg bg-blue-500 py-2 text-sm text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={loading || verificationLoading || !formData.phone}
              >
                {verificationLoading ? '발송 중...' : '인증 코드 받기'}
              </button>
            </div>
          )}

          {phoneVerificationStep === 'pending' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {formData.phone}로 인증 코드 발송
                </span>
                <span className="text-blue-600 font-medium">
                  남은 시간: {formatTime(remainingTime)}
                </span>
              </div>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="인증 코드 6자리 입력"
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-blue-500"
                disabled={loading || verificationLoading}
                maxLength={6}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  className="flex-1 rounded-lg bg-green-500 py-2 text-sm text-white hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={loading || verificationLoading || verificationCode.length !== 6}
                >
                  {verificationLoading ? '확인 중...' : '인증 확인'}
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="flex-1 rounded-lg bg-gray-500 py-2 text-sm text-white hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={loading || verificationLoading}
                >
                  재발송
                </button>
              </div>
            </div>
          )}

          {phoneVerificationStep === 'verified' && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <p className="text-green-600 text-sm flex items-center gap-2">
                <span>✓</span>
                <span>휴대폰 인증 완료</span>
              </p>
            </div>
          )}

          {verificationError && (
            <div className="text-red-600 text-sm">
              {verificationError}
            </div>
          )}
        </div>

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
            {showPw ? <VscEye className="w-5 h-5" /> : <VscEyeClosed className="w-5 h-5" />}
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
            {showConfirmPw ? <VscEye className="w-5 h-5" /> : <VscEyeClosed className="w-5 h-5" />}
          </button>
        </div>

        {/* 약관 동의 - 공통 컴포넌트 사용 */}
        <TermsAgreement
          agree={agree}
          onAgreeChange={setAgree}
          loading={loading}
        />

        <button
          type="submit"
          disabled={loading || phoneVerificationStep !== 'verified'}
          className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {phoneVerificationStep !== 'verified'
            ? "휴대폰 인증을 완료하세요"
            : (loading ? "가입 중..." : "회원가입")}
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

    </div>
  );
}
