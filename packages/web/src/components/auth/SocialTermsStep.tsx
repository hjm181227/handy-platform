import { useState } from 'react';
import { useAuthModal, SocialNewUserInfo } from '../../contexts/AuthModalContext';
import { webApiService } from '../../services/apiService';
import { Logo } from '../common/Logo';

interface AgreedTerms {
  service: boolean;
  privacy: boolean;
  marketing: boolean;
  age: boolean;
}

interface TermItem {
  key: keyof AgreedTerms;
  label: string;
  required: boolean;
  hasContent?: boolean;
}

const TERMS: TermItem[] = [
  { key: 'age', label: '만 14세 이상입니다', required: true },
  { key: 'service', label: '서비스 이용약관 동의', required: true, hasContent: true },
  { key: 'privacy', label: '개인정보 처리방침 동의', required: true, hasContent: true },
  { key: 'marketing', label: '마케팅 정보 수신 동의', required: false },
];

// 서비스 이용약관 내용
const ServiceTermsContent = () => (
  <div className="space-y-4 text-xs text-gray-600">
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제1조(목적)</h4>
      <p>이 약관은 에르모세아르(전자상거래 사업자)가 운영하는 핸디(이하 "홈페이지"라 한다) 및 모바일 애플리케이션에서 제공하는 관련 서비스(이하 "서비스"라 한다)를 이용함에 있어 홈페이지와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제2조(정의)</h4>
      <p>1. "회사"란 에르모세아르가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 거래할 수 있도록 설정한 가상의 영업장을 말합니다.</p>
      <p>2. "이용자"란 "회사"에 접속하여 이 약관에 따라 "회사"가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</p>
      <p>3. "회원"이라 함은 "회사"에 회원등록을 한 자로서 계속적으로 "회사"가 제공하는 서비스를 이용할 수 있는 자를 말합니다.</p>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제3조(약관 등의 명시와 설명 및 개정)</h4>
      <p>1. "회사"는 이 약관의 내용과 상호 및 대표자 성명, 영업소 소재지 주소, 전화번호, 사업자등록번호, 통신판매업 신고번호 등을 이용자가 쉽게 알 수 있도록 서비스의 초기화면에 게시합니다.</p>
      <p>2. "회사"는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제4조(서비스의 제공 및 변경)</h4>
      <p>1. "회사"는 재화 또는 용역에 대한 정보 제공 및 구매계약의 체결, 구매계약이 체결된 재화 또는 용역의 배송, 전자상거래 플랫폼 제공 등의 업무를 수행합니다.</p>
      <p>2. "회사"는 재화의 품절 또는 기술적 사양의 변경 등의 경우에는 장차 체결되는 계약에 의해 제공할 재화 또는 용역의 내용을 변경할 수 있습니다.</p>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제5조(서비스의 중단)</h4>
      <p>"회사"는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제6조(회원가입)</h4>
      <p>이용자는 "회사"가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</p>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제7조(회원 탈퇴 및 자격 상실)</h4>
      <p>회원은 "회사"에 언제든지 탈퇴를 요청할 수 있으며, "회사"는 즉시 회원탈퇴를 처리합니다.</p>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제8조(개인정보보호)</h4>
      <p>"회사"는 이용자의 개인정보를 보호하기 위하여 개인정보처리방침을 수립하고 이를 준수합니다.</p>
    </section>
  </div>
);

// 개인정보 처리방침 내용
const PrivacyPolicyContent = () => (
  <div className="space-y-4 text-xs text-gray-600">
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제1조(개인정보의 수집 및 이용목적)</h4>
      <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
      <ul className="list-disc ml-4 mt-1 space-y-1">
        <li>회원 가입 및 관리</li>
        <li>서비스 제공 및 계약 이행</li>
        <li>고객 상담 및 불만 처리</li>
        <li>마케팅 및 광고에의 활용 (동의 시)</li>
      </ul>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제2조(수집하는 개인정보 항목)</h4>
      <p><strong>필수항목:</strong> 이메일, 이름, 프로필 이미지 (소셜 로그인 시 제공)</p>
      <p><strong>선택항목:</strong> 전화번호, 배송지 주소</p>
      <p><strong>자동수집항목:</strong> IP주소, 쿠키, 방문 기록, 서비스 이용 기록</p>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제3조(개인정보의 보유 및 이용기간)</h4>
      <p>회원 탈퇴 시까지 보유하며, 관계 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 보관합니다:</p>
      <ul className="list-disc ml-4 mt-1 space-y-1">
        <li>계약 또는 청약철회에 관한 기록: 5년</li>
        <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
        <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
      </ul>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제4조(개인정보의 제3자 제공)</h4>
      <p>회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다:</p>
      <ul className="list-disc ml-4 mt-1 space-y-1">
        <li>이용자가 사전에 동의한 경우</li>
        <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
      </ul>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제5조(개인정보의 파기)</h4>
      <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제6조(이용자의 권리)</h4>
      <p>이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 가입 해지를 요청할 수 있습니다.</p>
    </section>
    <section>
      <h4 className="font-semibold text-gray-800 mb-2">제7조(개인정보 보호책임자)</h4>
      <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 개인정보 보호책임자를 지정하고 있습니다.</p>
    </section>
  </div>
);

interface SocialTermsStepProps {
  userInfo: SocialNewUserInfo;
  onComplete: () => void;
  onClose?: () => void;
}

export function SocialTermsStep({ userInfo, onComplete, onClose }: SocialTermsStepProps) {
  const authModal = useAuthModal();
  const handleClose = onClose || authModal?.close || (() => window.history.back());
  const [agreed, setAgreed] = useState<AgreedTerms>({
    service: false,
    privacy: false,
    marketing: false,
    age: false,
  });
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requiredTerms = TERMS.filter(t => t.required);
  const allRequiredAgreed = requiredTerms.every(t => agreed[t.key]);
  const allAgreed = TERMS.every(t => agreed[t.key]);

  const handleToggle = (key: keyof AgreedTerms) => {
    setAgreed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleAll = () => {
    const newValue = !allAgreed;
    setAgreed({
      service: newValue,
      privacy: newValue,
      marketing: newValue,
      age: newValue,
    });
  };

  const toggleExpand = (key: string) => {
    setExpandedTerms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!allRequiredAgreed) return;

    setLoading(true);
    setError('');

    try {
      const response = await webApiService.auth.completeSocialSignup({
        socialUserInfo: {
          provider: userInfo.provider as 'kakao' | 'google' | 'apple' | 'naver',
          providerId: userInfo.userId || '',
          email: userInfo.email || '',
          name: userInfo.name || '',
          profileImage: userInfo.profileImage,
        },
        marketingConsent: agreed.marketing,
      });

      if (response.token && response.user) {
        await webApiService.auth.setAuthToken(response.token, response.user);
      }

      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { isNewUser: true }
      }));

      onComplete();
    } catch (err: any) {
      console.error('회원가입 실패:', err);
      setError(err.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'kakao': return '카카오';
      case 'google': return 'Google';
      case 'apple': return 'Apple';
      case 'naver': return '네이버';
      default: return provider;
    }
  };

  const renderTermContent = (key: string) => {
    switch (key) {
      case 'service':
        return <ServiceTermsContent />;
      case 'privacy':
        return <PrivacyPolicyContent />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-white flex flex-col mx-auto max-w-md px-5 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between h-10 mb-4">
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <Logo size="md" />
        <div className="w-10" />
      </div>

      {/* 환영 메시지 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          환영합니다!
        </h1>
        <p className="text-gray-500">
          {getProviderName(userInfo.provider)}로 가입을 진행합니다
        </p>
        {userInfo.name && (
          <p className="text-gray-700 mt-1 font-medium">{userInfo.name}님</p>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* 약관 동의 */}
      <div className="flex-1 overflow-y-auto">
        <p className="text-sm text-gray-600 mb-4">
          서비스 이용을 위해 약관에 동의해주세요
        </p>

        {/* 전체 동의 */}
        <button
          type="button"
          onClick={handleToggleAll}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-colors mb-4"
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            allAgreed ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
          }`}>
            {allAgreed && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-lg font-semibold text-gray-900">전체 동의</span>
        </button>

        {/* 구분선 */}
        <div className="border-t border-gray-200 my-4" />

        {/* 개별 약관 */}
        <div className="space-y-2">
          {TERMS.map((term) => (
            <div key={term.key} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleToggle(term.key)}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    agreed[term.key] ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    {agreed[term.key] && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-700 text-left text-sm">
                    <span className={term.required ? 'text-blue-600' : 'text-gray-400'}>
                      [{term.required ? '필수' : '선택'}]
                    </span>{' '}
                    {term.label}
                  </span>
                </button>
                {term.hasContent && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(term.key)}
                    className="text-gray-400 hover:text-gray-600 p-1 transition-transform"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${expandedTerms.has(term.key) ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 약관 내용 토글 영역 */}
              {term.hasContent && expandedTerms.has(term.key) && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="max-h-48 overflow-y-auto p-4">
                    {renderTermContent(term.key)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 완료 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!allRequiredAgreed || loading}
        className="w-full rounded-xl bg-blue-600 py-4 text-base font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300 transition-colors mt-6"
      >
        {loading ? '처리 중...' : '동의하고 시작하기'}
      </button>
    </div>
  );
}
