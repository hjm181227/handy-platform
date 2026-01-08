import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import { PageHeader } from '../layout/PageHeader';

// 입력 필드 컴포넌트
const FormField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  multiline = false,
  disabled = false,
  error
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  disabled?: boolean;
  error?: string;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      />
    )}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

// 체크박스 컴포넌트
const CheckboxField = ({
  label,
  checked,
  onChange,
  required = false
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
}) => (
  <div className="flex items-start gap-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <label className="text-sm text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  </div>
);

export function SellerRegistrationPage({ onGo }: { onGo: (to: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [user, setUser] = useState<any>(null);

  // 폼 데이터
  const [formData, setFormData] = useState({
    businessName: '',
    businessRegistrationNumber: '',
    businessType: 'individual', // individual, corporate
    representativeName: '',
    contactPhone: '',
    businessAddress: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToCommission: false,
  });

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const response = await webApiService.getCurrentUserProfile();
        if (response.user) {
          setUser(response.user);
          // 기본 정보 자동 입력
          setFormData(prev => ({
            ...prev,
            representativeName: response.user.name || '',
            contactPhone: response.user.phone || '',
          }));
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // 폼 검증
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = '상호명을 입력해주세요.';
    }

    if (!formData.businessRegistrationNumber.trim()) {
      newErrors.businessRegistrationNumber = '사업자등록번호를 입력해주세요.';
    } else if (!/^\d{3}-\d{2}-\d{5}$/.test(formData.businessRegistrationNumber)) {
      newErrors.businessRegistrationNumber = '올바른 사업자등록번호 형식을 입력해주세요. (000-00-00000)';
    }

    if (!formData.representativeName.trim()) {
      newErrors.representativeName = '대표자명을 입력해주세요.';
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = '연락처를 입력해주세요.';
    } else if (!/^010-\d{4}-\d{4}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = '올바른 연락처 형식을 입력해주세요. (010-0000-0000)';
    }

    if (!formData.businessAddress.trim()) {
      newErrors.businessAddress = '사업장 주소를 입력해주세요.';
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = '은행명을 입력해주세요.';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = '계좌번호를 입력해주세요.';
    }

    if (!formData.accountHolder.trim()) {
      newErrors.accountHolder = '예금주명을 입력해주세요.';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = '판매자 이용약관에 동의해주세요.';
    }

    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = '개인정보 처리방침에 동의해주세요.';
    }

    if (!formData.agreeToCommission) {
      newErrors.agreeToCommission = '수수료 정책에 동의해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('입력 정보를 확인해주세요.');
      return;
    }

    if (!confirm('판매자 신청을 제출하시겠습니까? 검토 후 승인 결과를 알려드립니다.')) {
      return;
    }

    setSubmitting(true);
    try {
      // TODO: 실제 API 호출
      // const response = await webApiService.sellerService.registerSeller(formData);

      // 임시로 성공 처리
      await new Promise(resolve => setTimeout(resolve, 2000));

      alert('판매자 신청이 완료되었습니다. 검토 후 승인 결과를 알려드리겠습니다.');
      onGo('/my');
    } catch (error) {
      console.error('판매자 신청 실패:', error);
      alert('판매자 신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="판매자 전환 신청" onBack={() => onGo('/my/settings')} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-gray-600">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 이미 판매자인 경우 판매자 센터로 이동할 수 있는 UI 표시
  if (user?.role === 'seller') {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="판매자 센터" onBack={() => onGo('/my/settings')} />
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-lg border p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-green-600 text-3xl">verified</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">이미 판매자입니다</h2>
            <p className="text-gray-600 mb-6">
              이미 판매자 권한이 있습니다.<br />
              판매자 센터에서 상품을 관리하세요.
            </p>
            <button
              onClick={() => onGo('/seller')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
            >
              판매자 센터로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="판매자 전환 신청" onBack={() => onGo('/my/settings')} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 안내 섹션 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">판매자 신청 안내</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 신청 후 2-3일 내 검토 완료</li>
                <li>• 승인 후 상품 등록 및 판매 가능</li>
                <li>• 판매 수수료: 5% (부가세 별도)</li>
                <li>• 정산은 매월 말일 기준</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
          <div className="space-y-4">
            <FormField
              label="사업 형태"
              value={formData.businessType === 'individual' ? '개인사업자' : '법인사업자'}
              onChange={() => {}}
              disabled
            />

            <FormField
              label="상호명"
              value={formData.businessName}
              onChange={(value) => setFormData(prev => ({ ...prev, businessName: value }))}
              placeholder="예: 핸디 네일샵"
              required
              error={errors.businessName}
            />

            <FormField
              label="사업자등록번호"
              value={formData.businessRegistrationNumber}
              onChange={(value) => setFormData(prev => ({ ...prev, businessRegistrationNumber: value }))}
              placeholder="000-00-00000"
              required
              error={errors.businessRegistrationNumber}
            />

            <FormField
              label="대표자명"
              value={formData.representativeName}
              onChange={(value) => setFormData(prev => ({ ...prev, representativeName: value }))}
              placeholder="홍길동"
              required
              error={errors.representativeName}
            />

            <FormField
              label="연락처"
              value={formData.contactPhone}
              onChange={(value) => setFormData(prev => ({ ...prev, contactPhone: value }))}
              placeholder="010-0000-0000"
              required
              error={errors.contactPhone}
            />

            <FormField
              label="사업장 주소"
              value={formData.businessAddress}
              onChange={(value) => setFormData(prev => ({ ...prev, businessAddress: value }))}
              placeholder="서울시 강남구 테헤란로 123"
              required
              error={errors.businessAddress}
            />
          </div>
        </div>

        {/* 정산 정보 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">정산 계좌 정보</h2>
          <div className="space-y-4">
            <FormField
              label="은행명"
              value={formData.bankName}
              onChange={(value) => setFormData(prev => ({ ...prev, bankName: value }))}
              placeholder="국민은행"
              required
              error={errors.bankName}
            />

            <FormField
              label="계좌번호"
              value={formData.accountNumber}
              onChange={(value) => setFormData(prev => ({ ...prev, accountNumber: value }))}
              placeholder="123456-78-901234"
              required
              error={errors.accountNumber}
            />

            <FormField
              label="예금주명"
              value={formData.accountHolder}
              onChange={(value) => setFormData(prev => ({ ...prev, accountHolder: value }))}
              placeholder="홍길동"
              required
              error={errors.accountHolder}
            />
          </div>
        </div>

        {/* 약관 동의 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">약관 동의</h2>
          <div className="space-y-4">
            <CheckboxField
              label="판매자 이용약관에 동의합니다."
              checked={formData.agreeToTerms}
              onChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked }))}
              required
            />
            {errors.agreeToTerms && <p className="text-sm text-red-600 ml-7">{errors.agreeToTerms}</p>}

            <CheckboxField
              label="개인정보 처리방침에 동의합니다."
              checked={formData.agreeToPrivacy}
              onChange={(checked) => setFormData(prev => ({ ...prev, agreeToPrivacy: checked }))}
              required
            />
            {errors.agreeToPrivacy && <p className="text-sm text-red-600 ml-7">{errors.agreeToPrivacy}</p>}

            <CheckboxField
              label="판매 수수료 정책에 동의합니다."
              checked={formData.agreeToCommission}
              onChange={(checked) => setFormData(prev => ({ ...prev, agreeToCommission: checked }))}
              required
            />
            {errors.agreeToCommission && <p className="text-sm text-red-600 ml-7">{errors.agreeToCommission}</p>}
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="bg-white rounded-lg border p-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? '신청 중...' : '판매자 신청하기'}
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            신청 후 2-3일 내 검토를 거쳐 승인 결과를 안내해드립니다.
          </p>
        </div>
      </div>
    </div>
  );
}