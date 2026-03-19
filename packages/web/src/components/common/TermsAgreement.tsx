import { useState } from 'react';
import { TermsOfService, PrivacyPolicy, PersonalDataConsent } from '../pages/PolicyPages';

export interface TermsState {
  terms: boolean;
  privacy: boolean;
  personalData: boolean;
  marketing: boolean;
}

export interface TermsAgreementProps {
  /** 약관 동의 상태 */
  agree: TermsState;
  /** 약관 동의 상태 변경 콜백 */
  onAgreeChange: (agree: TermsState) => void;
  /** 로딩 상태 */
  loading?: boolean;
  /** 사용자 정보 (소셜 로그인 시 표시용) */
  userInfo?: {
    name: string;
    email: string;
    profileImage?: string;
    provider?: string;
  };
  /** 컴포넌트 제목 */
  title?: string;
  /** 추가 설명 메시지 */
  description?: string;
}

export function TermsAgreement({
  agree,
  onAgreeChange,
  loading = false,
  userInfo,
  title = "약관 동의",
  description
}: TermsAgreementProps) {
  const [showPolicy, setShowPolicy] = useState<'terms' | 'privacy' | 'personalData' | null>(null);

  // 전체 동의 처리
  const handleAllAgreeChange = (isChecked: boolean) => {
    onAgreeChange({
      terms: isChecked,
      privacy: isChecked,
      personalData: isChecked,
      marketing: isChecked
    });
  };

  // 개별 약관 동의 처리
  const handleIndividualAgreeChange = (key: keyof TermsState, value: boolean) => {
    onAgreeChange({
      ...agree,
      [key]: value
    });
  };

  // 필수 약관이 모두 동의되었는지 확인
  const isRequiredTermsAgreed = agree.terms && agree.privacy && agree.personalData;
  
  // 전체 동의 체크 상태
  const isAllAgreed = agree.terms && agree.privacy && agree.personalData && agree.marketing;

  return (
    <>
      <div className="space-y-4 rounded-lg border bg-gray-50 px-4 py-4">
        {/* 소셜 로그인 사용자 정보 표시 */}
        {userInfo && (
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-3">
              {userInfo.profileImage && (
                <img 
                  src={userInfo.profileImage} 
                  alt="프로필" 
                  className="w-12 h-12 rounded-full border"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{userInfo.name}</div>
                <div className="text-sm text-gray-600">{userInfo.email}</div>
                {userInfo.provider && (
                  <div className="text-xs text-[#E85A6B] mt-1">
                    {userInfo.provider === 'kakao' && '카카오'}
                    {userInfo.provider === 'google' && 'Google'}
                    {userInfo.provider === 'naver' && 'NAVER'}
                    {userInfo.provider === 'apple' && 'Apple'} 계정으로 가입
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-sm font-semibold text-gray-800">{title}</div>
        
        {description && (
          <div className="text-sm text-gray-600 bg-[#FFF1F2] p-3 rounded">
            {description}
          </div>
        )}
        
        {/* 전체 동의 */}
        <label className="flex items-center gap-2 text-sm border-b pb-2">
          <input
            type="checkbox"
            checked={isAllAgreed}
            onChange={(e) => handleAllAgreeChange(e.target.checked)}
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
              onChange={(e) => handleIndividualAgreeChange('terms', e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <span>서비스 이용약관 동의 <span className="text-red-500">(필수)</span></span>
          </div>
          <button
            type="button"
            onClick={() => setShowPolicy('terms')}
            className="text-[#E85A6B] hover:text-[#D14A5B] text-xs underline"
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
              onChange={(e) => handleIndividualAgreeChange('privacy', e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <span>개인정보처리방침 동의 <span className="text-red-500">(필수)</span></span>
          </div>
          <button
            type="button"
            onClick={() => setShowPolicy('privacy')}
            className="text-[#E85A6B] hover:text-[#D14A5B] text-xs underline"
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
              onChange={(e) => handleIndividualAgreeChange('personalData', e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <span>개인정보 수집 및 이용 동의 <span className="text-red-500">(필수)</span></span>
          </div>
          <button
            type="button"
            onClick={() => setShowPolicy('personalData')}
            className="text-[#E85A6B] hover:text-[#D14A5B] text-xs underline"
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
              onChange={(e) => handleIndividualAgreeChange('marketing', e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <span>마케팅 정보 수신 동의 <span className="text-gray-500">(선택)</span></span>
          </div>
          <div className="text-xs text-gray-500">SMS, 이메일</div>
        </label>

        {/* 필수 약관 안내 */}
        <div className="text-xs text-gray-600 bg-[#FFF1F2] p-2 rounded flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">lightbulb</span>
          필수 약관에 동의하지 않으시면 회원가입이 제한됩니다.
        </div>

        {/* 필수 약관 미동의시 경고 */}
        {!isRequiredTermsAgreed && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">warning</span>
            필수 약관에 모두 동의해주세요.
          </div>
        )}
      </div>

      {/* Policy Modals */}
      {showPolicy === 'terms' && <TermsOfService onClose={() => setShowPolicy(null)} />}
      {showPolicy === 'privacy' && <PrivacyPolicy onClose={() => setShowPolicy(null)} />}
      {showPolicy === 'personalData' && <PersonalDataConsent onClose={() => setShowPolicy(null)} />}
    </>
  );
}

// 약관 유효성 검사 유틸리티
export const validateTerms = (agree: TermsState): string | null => {
  if (!agree.terms || !agree.privacy || !agree.personalData) {
    return "필수 약관에 모두 동의해주세요.";
  }
  return null;
};

// 기본 약관 상태
export const getDefaultTermsState = (): TermsState => ({
  terms: false,
  privacy: false,
  personalData: false,
  marketing: false
});