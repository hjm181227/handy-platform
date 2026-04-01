import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A6B] disabled:bg-gray-100 ${
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
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A6B] disabled:bg-gray-100 ${
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
      className="mt-1 w-4 h-4 text-[#E85A6B] border-gray-300 rounded focus:ring-[#E85A6B]"
    />
    <label className="text-sm text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  </div>
);

export function SellerRegistrationPage({ onGo }: { onGo: (to: string) => void }) {
  const { t } = useTranslation('seller');
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
        const profileUser = response?.data?.user;
        if (profileUser) {
          setUser(profileUser);
          // 기본 정보 자동 입력
          setFormData(prev => ({
            ...prev,
            representativeName: profileUser.name || '',
            contactPhone: profileUser.phone || '',
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
      newErrors.businessName = t('registration.validationBusinessName');
    }

    if (!formData.businessRegistrationNumber.trim()) {
      newErrors.businessRegistrationNumber = t('registration.validationBusinessNumber');
    } else if (!/^\d{3}-\d{2}-\d{5}$/.test(formData.businessRegistrationNumber)) {
      newErrors.businessRegistrationNumber = t('registration.validationBusinessNumberFormat');
    }

    if (!formData.representativeName.trim()) {
      newErrors.representativeName = t('registration.validationRepresentativeName');
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = t('registration.validationContactPhone');
    } else if (!/^010-\d{4}-\d{4}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = t('registration.validationContactPhoneFormat');
    }

    if (!formData.businessAddress.trim()) {
      newErrors.businessAddress = t('registration.validationBusinessAddress');
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = t('registration.validationBankName');
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = t('registration.validationAccountNumber');
    }

    if (!formData.accountHolder.trim()) {
      newErrors.accountHolder = t('registration.validationAccountHolder');
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = t('registration.validationAgreeToTerms');
    }

    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = t('registration.validationAgreeToPrivacy');
    }

    if (!formData.agreeToCommission) {
      newErrors.agreeToCommission = t('registration.validationAgreeToCommission');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async () => {
    if (!validateForm()) {
      alert(t('registration.checkInput'));
      return;
    }

    if (!confirm(t('registration.submitConfirm'))) {
      return;
    }

    setSubmitting(true);
    try {
      // TODO: 실제 API 호출
      // const response = await webApiService.sellerService.registerSeller(formData);

      // 임시로 성공 처리
      await new Promise(resolve => setTimeout(resolve, 2000));

      alert(t('registration.submitSuccess'));
      onGo('/my');
    } catch (error) {
      console.error('판매자 신청 실패:', error);
      alert(t('registration.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title={t('registration.title')} onBack={() => onGo('/my/settings')} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-gray-600">{t('registration.loading')}</div>
        </div>
      </div>
    );
  }

  // 이미 판매자인 경우 판매자 센터로 이동할 수 있는 UI 표시
  if (user?.role === 'seller') {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title={t('registration.sellerCenterTitle')} onBack={() => onGo('/my/settings')} />
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-lg border p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-green-600 text-3xl">verified</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('registration.alreadySeller')}</h2>
            <p className="text-gray-600 mb-6">
              {t('registration.alreadySellerDesc')}<br />
              {t('registration.manageProducts')}
            </p>
            <button
              onClick={() => onGo('/seller')}
              className="w-full bg-[#E85A6B] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#D14A5B]"
            >
              {t('registration.goToSellerCenter')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title={t('registration.title')} onBack={() => onGo('/my/settings')} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 안내 섹션 */}
        <div className="bg-[#FFF1F2] border border-[#E85A6B]/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-[#E85A6B] text-xl">ℹ️</div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">{t('registration.guideTitle')}</h3>
              <ul className="text-sm text-[#D14A5B] space-y-1">
                <li>• {t('registration.guideReview')}</li>
                <li>• {t('registration.guideApproval')}</li>
                <li>• {t('registration.guideCommission')}</li>
                <li>• {t('registration.guideSettlement')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('registration.basicInfo')}</h2>
          <div className="space-y-4">
            <FormField
              label={t('registration.businessType')}
              value={formData.businessType === 'individual' ? t('registration.individualBusiness') : t('registration.corporateBusiness')}
              onChange={() => {}}
              disabled
            />

            <FormField
              label={t('registration.businessName')}
              value={formData.businessName}
              onChange={(value) => setFormData(prev => ({ ...prev, businessName: value }))}
              placeholder={t('registration.businessNamePlaceholder')}
              required
              error={errors.businessName}
            />

            <FormField
              label={t('registration.businessNumber')}
              value={formData.businessRegistrationNumber}
              onChange={(value) => setFormData(prev => ({ ...prev, businessRegistrationNumber: value }))}
              placeholder={t('registration.businessNumberPlaceholder')}
              required
              error={errors.businessRegistrationNumber}
            />

            <FormField
              label={t('registration.representativeName')}
              value={formData.representativeName}
              onChange={(value) => setFormData(prev => ({ ...prev, representativeName: value }))}
              placeholder={t('registration.representativeNamePlaceholder')}
              required
              error={errors.representativeName}
            />

            <FormField
              label={t('registration.contactPhone')}
              value={formData.contactPhone}
              onChange={(value) => setFormData(prev => ({ ...prev, contactPhone: value }))}
              placeholder={t('registration.contactPhonePlaceholder')}
              required
              error={errors.contactPhone}
            />

            <FormField
              label={t('registration.businessAddress')}
              value={formData.businessAddress}
              onChange={(value) => setFormData(prev => ({ ...prev, businessAddress: value }))}
              placeholder={t('registration.businessAddressPlaceholder')}
              required
              error={errors.businessAddress}
            />
          </div>
        </div>

        {/* 정산 정보 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('registration.settlementInfo')}</h2>
          <div className="space-y-4">
            <FormField
              label={t('registration.bankName')}
              value={formData.bankName}
              onChange={(value) => setFormData(prev => ({ ...prev, bankName: value }))}
              placeholder={t('registration.bankNamePlaceholder')}
              required
              error={errors.bankName}
            />

            <FormField
              label={t('registration.accountNumber')}
              value={formData.accountNumber}
              onChange={(value) => setFormData(prev => ({ ...prev, accountNumber: value }))}
              placeholder={t('registration.accountNumberPlaceholder')}
              required
              error={errors.accountNumber}
            />

            <FormField
              label={t('registration.accountHolder')}
              value={formData.accountHolder}
              onChange={(value) => setFormData(prev => ({ ...prev, accountHolder: value }))}
              placeholder={t('registration.representativeNamePlaceholder')}
              required
              error={errors.accountHolder}
            />
          </div>
        </div>

        {/* 약관 동의 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('registration.termsAgreement')}</h2>
          <div className="space-y-4">
            <CheckboxField
              label={t('registration.agreeToTerms')}
              checked={formData.agreeToTerms}
              onChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked }))}
              required
            />
            {errors.agreeToTerms && <p className="text-sm text-red-600 ml-7">{errors.agreeToTerms}</p>}

            <CheckboxField
              label={t('registration.agreeToPrivacy')}
              checked={formData.agreeToPrivacy}
              onChange={(checked) => setFormData(prev => ({ ...prev, agreeToPrivacy: checked }))}
              required
            />
            {errors.agreeToPrivacy && <p className="text-sm text-red-600 ml-7">{errors.agreeToPrivacy}</p>}

            <CheckboxField
              label={t('registration.agreeToCommission')}
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
            className="w-full bg-[#E85A6B] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#D14A5B] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? t('registration.submitting') : t('registration.submitApplication')}
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            {t('registration.submitNote')}
          </p>
        </div>
      </div>
    </div>
  );
}