import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sellerApplicationService } from '../../services/apiService';
import { SellerApplicationData, SellerApplication } from '@handy-platform/shared';

interface SellerApplicationFormProps {
  onGo: (to: string) => void;
}

const SellerApplicationForm: React.FC<SellerApplicationFormProps> = ({ onGo }) => {
  const { t } = useTranslation('seller');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<SellerApplication | null>(null);
  const [formData, setFormData] = useState<SellerApplicationData>({
    brandName: '',
    representativeName: '',
    businessNumber: '',
    businessType: '개인사업자',
    businessCategory: '네일아트',
    businessSector: '',
    contactEmail: '',
    contactPhone: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '대한민국'
    },
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountHolder: ''
    },
    verificationDocuments: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 신청 상태 확인
  useEffect(() => {
    checkApplicationStatus();
  }, []);

  const checkApplicationStatus = async () => {
    try {
      setLoading(true);
      const response = await sellerApplicationService.getMyApplicationStatus();
      setApplicationStatus(response.data); // response.data가 SellerApplication | null
    } catch (error) {
      console.error('Failed to check application status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    section: keyof SellerApplicationData,
    field: string,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' 
        ? { ...prev[section], [field]: value }
        : value
    }));

    // 에러 제거
    const errorKey = `${section}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 필수 필드 검증
    if (!formData.brandName.trim()) {
      newErrors['brandName'] = t('application.validationBrandName');
    }
    if (!formData.businessNumber.trim()) {
      newErrors['businessNumber'] = t('application.validationBusinessNumber');
    }
    if (!formData.contactEmail.trim()) {
      newErrors['contactEmail'] = t('application.validationContactEmail');
    }
    if (!formData.contactPhone.trim()) {
      newErrors['contactPhone'] = t('application.validationContactPhone');
    }

    // 사업자 주소 검증
    if (!formData.businessAddress?.street.trim()) {
      newErrors['businessAddress.street'] = t('application.validationStreetAddress');
    }
    if (!formData.businessAddress?.city.trim()) {
      newErrors['businessAddress.city'] = t('application.validationCity');
    }
    if (!formData.businessAddress?.state.trim()) {
      newErrors['businessAddress.state'] = t('application.validationState');
    }
    if (!formData.businessAddress?.zipCode.trim()) {
      newErrors['businessAddress.zipCode'] = t('application.validationZipCode');
    }

    // 계좌 정보 검증
    if (!formData.bankAccount.bankName.trim()) {
      newErrors['bankAccount.bankName'] = t('application.validationBankName');
    }
    if (!formData.bankAccount.accountNumber.trim()) {
      newErrors['bankAccount.accountNumber'] = t('application.validationAccountNumber');
    }
    if (!formData.bankAccount.accountHolder.trim()) {
      newErrors['bankAccount.accountHolder'] = t('application.validationAccountHolder');
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
      newErrors['contactEmail'] = t('application.validationEmailFormat');
    }

    // 사업자등록번호 형식 검증 (숫자와 하이픈만)
    const businessNumberRegex = /^[0-9-]+$/;
    if (formData.businessNumber && !businessNumberRegex.test(formData.businessNumber)) {
      newErrors['businessNumber'] = t('application.validationBusinessNumberFormat');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitLoading(true);
      
      // 서버로 전송할 데이터 준비 (businessAddress를 address로 매핑)
      const submitData = {
        ...formData,
        address: formData.businessAddress,
        businessAddress: undefined // 제거
      };
      
      await sellerApplicationService.submitApplication(submitData);
      
      alert(t('application.submitSuccess'));
      
      // 신청 상태 새로고침
      checkApplicationStatus();
      
    } catch (error: any) {
      console.error('Application submission failed:', error);
      const errorMessage = error?.message || t('application.submitFailed');
      alert(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A6B] mx-auto mb-4"></div>
          <p className="text-gray-600">{t('application.checkingStatus')}</p>
        </div>
      </div>
    );
  }

  // 이미 신청한 경우 상태 표시
  if (applicationStatus) {
    const application = applicationStatus;
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('application.applicationStatus')}</h1>
            
            <div className="border rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{application.brandName}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {application.status === 'pending' ? t('application.statusPending') :
                   application.status === 'approved' ? t('application.statusApproved') : t('application.statusRejected')}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p><span className="font-medium">{t('application.applicationDate')}:</span> {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}</p>
                <p><span className="font-medium">{t('application.lastUpdate')}:</span> {application.updatedAt ? new Date(application.updatedAt).toLocaleDateString() : ''}</p>
                
                {application.status === 'pending' && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                    <p className="text-sm font-medium text-yellow-800">{t('application.pendingReview')}</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {t('application.pendingReviewDesc')}
                    </p>
                  </div>
                )}
                
                {application.status === 'rejected' && application.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 rounded-md">
                    <p className="text-sm font-medium text-red-800">{t('application.rejectionReason')}</p>
                    <p className="text-sm text-red-700 mt-1">{application.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onGo('/')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {t('application.goHome')}
              </button>
              
              {application.status === 'pending' && (
                <button
                  onClick={() => {
                    setApplicationStatus(null);
                    setFormData({
                      brandName: application.brandName || '',
                      representativeName: application.representativeName || '',
                      businessNumber: application.businessNumber || '',
                      businessType: application.businessType || '개인사업자',
                      businessCategory: application.businessCategory || '네일아트',
                      contactEmail: application.contactEmail || '',
                      contactPhone: application.contactPhone || '',
                      businessAddress: {
                        street: application.businessAddress?.street || '',
                        city: application.businessAddress?.city || '',
                        state: application.businessAddress?.state || '',
                        zipCode: application.businessAddress?.zipCode || '',
                        country: application.businessAddress?.country || '대한민국'
                      },
                      bankAccount: {
                        bankName: application.bankAccount?.bankName || '',
                        accountNumber: application.bankAccount?.accountNumber || '',
                        accountHolder: application.bankAccount?.accountHolder || ''
                      },
                      verificationDocuments: application.verificationDocuments || []
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-[#E85A6B] text-white rounded-md hover:bg-[#D14A5B] transition-colors"
                >
                  {t('application.editApplication')}
                </button>
              )}
              
              {application.status === 'rejected' && (
                <button
                  onClick={() => {
                    setApplicationStatus(null);
                    setFormData({
                      ...formData,
                      brandName: application.brandName || '',
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-[#E85A6B] text-white rounded-md hover:bg-[#D14A5B] transition-colors"
                >
                  {t('application.reapply')}
                </button>
              )}
              
              {application.status === 'approved' && (
                <button
                  onClick={() => onGo('/seller')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  {t('application.goToSellerCenter')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{t('application.title')}</h1>
            <p className="text-gray-600 mt-1">{t('application.subtitle')}</p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 기본 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('application.basicInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="brandName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.brandName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="brandName"
                    value={formData.brandName}
                    onChange={(e) => handleInputChange('brandName', '', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B] ${
                      errors['brandName'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('application.brandNamePlaceholder')}
                  />
                  {errors['brandName'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['brandName']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="representativeName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.representativeName')}
                  </label>
                  <input
                    type="text"
                    id="representativeName"
                    value={formData.representativeName}
                    onChange={(e) => handleInputChange('representativeName', '', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B]"
                    placeholder={t('application.representativeNamePlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* 사업자 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('application.businessInfo')}
                <span className="text-xs font-normal text-gray-500 ml-2">
                  {t('application.businessInfoNote')}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.businessNumber')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="businessNumber"
                    value={formData.businessNumber}
                    onChange={(e) => handleInputChange('businessNumber', '', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B] ${
                      errors['businessNumber'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123-45-67890"
                  />
                  {errors['businessNumber'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['businessNumber']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.businessType')}
                  </label>
                  <select
                    id="businessType"
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', '', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B]"
                  >
                    <option value="개인사업자">{t('application.individualBusiness')}</option>
                    <option value="법인사업자">{t('application.corporateBusiness')}</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="businessCategory" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('application.businessCategory')}
                </label>
                <input
                  type="text"
                  id="businessCategory"
                  value={formData.businessCategory}
                  onChange={(e) => handleInputChange('businessCategory', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B]"
                  placeholder="전자상거래 소매업"
                />
              </div>

              <div className="mt-4">
                <label htmlFor="businessSector" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('application.businessSector')}
                </label>
                <input
                  type="text"
                  id="businessSector"
                  value={formData.businessSector}
                  onChange={(e) => handleInputChange('businessSector', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B]"
                  placeholder="예: 도소매업"
                />
              </div>
            </div>

            {/* 연락처 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('application.contactInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.contactEmail')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', '', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B] ${
                      errors['contactEmail'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="contact@example.com"
                  />
                  {errors['contactEmail'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['contactEmail']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.contactPhone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', '', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B] ${
                      errors['contactPhone'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="010-1234-5678"
                  />
                  {errors['contactPhone'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['contactPhone']}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 사업자 주소 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('application.businessAddress')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="businessAddress.street" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.streetAddress')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="businessAddress.street"
                    value={formData.businessAddress?.street || ''}
                    onChange={(e) => handleInputChange('businessAddress', 'street', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B] ${
                      errors['businessAddress.street'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="강남대로 456번길 78"
                  />
                  {errors['businessAddress.street'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['businessAddress.street']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="businessAddress.city" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.city')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="businessAddress.city"
                    value={formData.businessAddress?.city || ''}
                    onChange={(e) => handleInputChange('businessAddress', 'city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B] ${
                      errors['businessAddress.city'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="강남구"
                  />
                  {errors['businessAddress.city'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['businessAddress.city']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="businessAddress.state" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.state')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="businessAddress.state"
                    value={formData.businessAddress?.state || ''}
                    onChange={(e) => handleInputChange('businessAddress', 'state', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B] ${
                      errors['businessAddress.state'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="서울특별시"
                  />
                  {errors['businessAddress.state'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['businessAddress.state']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="businessAddress.zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.zipCode')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="businessAddress.zipCode"
                    value={formData.businessAddress?.zipCode || ''}
                    onChange={(e) => handleInputChange('businessAddress', 'zipCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B] ${
                      errors['businessAddress.zipCode'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="06124"
                  />
                  {errors['businessAddress.zipCode'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['businessAddress.zipCode']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="businessAddress.country" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.country')}
                  </label>
                  <input
                    type="text"
                    id="businessAddress.country"
                    value={formData.businessAddress?.country || ''}
                    onChange={(e) => handleInputChange('businessAddress', 'country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B]"
                    placeholder="대한민국"
                  />
                </div>
              </div>
            </div>

            {/* 계좌 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('application.settlementInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bankAccount.bankName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.bankName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bankAccount.bankName"
                    value={formData.bankAccount.bankName}
                    onChange={(e) => handleInputChange('bankAccount', 'bankName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B] ${
                      errors['bankAccount.bankName'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="KB국민은행"
                  />
                  {errors['bankAccount.bankName'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['bankAccount.bankName']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bankAccount.accountHolder" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.accountHolder')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bankAccount.accountHolder"
                    value={formData.bankAccount.accountHolder}
                    onChange={(e) => handleInputChange('bankAccount', 'accountHolder', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B] ${
                      errors['bankAccount.accountHolder'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('application.accountHolderPlaceholder')}
                  />
                  {errors['bankAccount.accountHolder'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['bankAccount.accountHolder']}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="bankAccount.accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.accountNumber')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bankAccount.accountNumber"
                    value={formData.bankAccount.accountNumber}
                    onChange={(e) => handleInputChange('bankAccount', 'accountNumber', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E85A6B] ${
                      errors['bankAccount.accountNumber'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123456-78-901234"
                  />
                  {errors['bankAccount.accountNumber'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['bankAccount.accountNumber']}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 안내 사항 */}
            <div className="bg-[#FFF1F2] border border-[#E85A6B]/20 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#E85A6B] rounded-full"></span>
                {t('application.noticeTitle')}
              </h4>
              <ul className="text-sm text-[#D14A5B] space-y-1">
                <li>• {t('application.notice1')}</li>
                <li>• {t('application.notice2')}</li>
                <li>• {t('application.notice3')}</li>
                <li>• {t('application.notice4')}</li>
              </ul>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => onGo('/')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {t('common:cancel')}
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="flex-1 px-4 py-3 bg-[#E85A6B] text-white rounded-md hover:bg-[#D14A5B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('application.submitting')}
                  </div>
                ) : (
                  t('application.submitForm')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerApplicationForm;