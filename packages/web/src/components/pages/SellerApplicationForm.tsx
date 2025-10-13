import React, { useState, useEffect } from 'react';
import { sellerApplicationService } from '../../services/apiService';
import { SellerApplicationData } from '@handy-platform/shared/src/services/seller/SellerApplicationService';
import { SellerApplication } from '@handy-platform/shared';

interface SellerApplicationFormProps {
  onGo: (to: string) => void;
}

const SellerApplicationForm: React.FC<SellerApplicationFormProps> = ({ onGo }) => {
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<SellerApplication | null>(null);
  const [formData, setFormData] = useState<SellerApplicationData>({
    brandName: '',
    representativeName: '',
    businessNumber: '',
    businessType: '개인사업자',
    businessCategory: '네일아트',
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
      newErrors['brandName'] = '브랜드명을 입력해주세요';
    }
    if (!formData.businessNumber.trim()) {
      newErrors['businessNumber'] = '사업자등록번호를 입력해주세요';
    }
    if (!formData.contactEmail.trim()) {
      newErrors['contactEmail'] = '연락처 이메일을 입력해주세요';
    }
    if (!formData.contactPhone.trim()) {
      newErrors['contactPhone'] = '연락처 전화번호를 입력해주세요';
    }

    // 사업자 주소 검증
    if (!formData.businessAddress?.street.trim()) {
      newErrors['businessAddress.street'] = '사업자 주소를 입력해주세요';
    }
    if (!formData.businessAddress?.city.trim()) {
      newErrors['businessAddress.city'] = '사업자 시/구를 입력해주세요';
    }
    if (!formData.businessAddress?.state.trim()) {
      newErrors['businessAddress.state'] = '사업자 시/도를 입력해주세요';
    }
    if (!formData.businessAddress?.zipCode.trim()) {
      newErrors['businessAddress.zipCode'] = '사업자 우편번호를 입력해주세요';
    }

    // 계좌 정보 검증
    if (!formData.bankAccount.bankName.trim()) {
      newErrors['bankAccount.bankName'] = '은행명을 입력해주세요';
    }
    if (!formData.bankAccount.accountNumber.trim()) {
      newErrors['bankAccount.accountNumber'] = '계좌번호를 입력해주세요';
    }
    if (!formData.bankAccount.accountHolder.trim()) {
      newErrors['bankAccount.accountHolder'] = '예금주명을 입력해주세요';
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
      newErrors['contactEmail'] = '올바른 이메일 형식을 입력해주세요';
    }

    // 사업자등록번호 형식 검증 (숫자와 하이픈만)
    const businessNumberRegex = /^[0-9-]+$/;
    if (formData.businessNumber && !businessNumberRegex.test(formData.businessNumber)) {
      newErrors['businessNumber'] = '사업자등록번호는 숫자와 하이픈만 입력 가능합니다';
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
      
      alert('판매자 신청이 성공적으로 제출되었습니다. 검토 후 연락드리겠습니다.');
      
      // 신청 상태 새로고침
      checkApplicationStatus();
      
    } catch (error: any) {
      console.error('Application submission failed:', error);
      const errorMessage = error?.message || '신청 제출에 실패했습니다. 다시 시도해주세요.';
      alert(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">신청 상태를 확인하고 있습니다...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">판매자 신청 현황</h1>
            
            <div className="border rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{application.brandName}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {application.status === 'pending' ? '승인 대기중' :
                   application.status === 'approved' ? '승인됨' : '거부됨'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p><span className="font-medium">신청일:</span> {application.createdAt ? new Date(application.createdAt).toLocaleDateString('ko-KR') : ''}</p>
                <p><span className="font-medium">최종 업데이트:</span> {application.updatedAt ? new Date(application.updatedAt).toLocaleDateString('ko-KR') : ''}</p>
                
                {application.status === 'pending' && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                    <p className="text-sm font-medium text-yellow-800">승인 대기중</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      관리자가 신청서를 검토 중입니다. 수정이 필요하시면 아래 '수정하기' 버튼을 눌러주세요.
                    </p>
                  </div>
                )}
                
                {application.status === 'rejected' && application.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 rounded-md">
                    <p className="text-sm font-medium text-red-800">거부 사유:</p>
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
                홈으로 이동
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  수정하기
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  재신청하기
                </button>
              )}
              
              {application.status === 'approved' && (
                <button
                  onClick={() => onGo('/seller')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  판매자 센터로 이동
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
            <h1 className="text-2xl font-bold text-gray-900">판매자 신청</h1>
            <p className="text-gray-600 mt-1">네일아트 상품을 판매하기 위한 정보를 입력해주세요</p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 기본 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="brandName" className="block text-sm font-medium text-gray-700 mb-2">
                    브랜드명/회사명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="brandName"
                    value={formData.brandName}
                    onChange={(e) => handleInputChange('brandName', '', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors['brandName'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="홍길동 네일"
                  />
                  {errors['brandName'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['brandName']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="representativeName" className="block text-sm font-medium text-gray-700 mb-2">
                    대표자명
                  </label>
                  <input
                    type="text"
                    id="representativeName"
                    value={formData.representativeName}
                    onChange={(e) => handleInputChange('representativeName', '', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="홍길동"
                  />
                </div>
              </div>
            </div>

            {/* 사업자 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">사업자 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    사업자등록번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="businessNumber"
                    value={formData.businessNumber}
                    onChange={(e) => handleInputChange('businessNumber', '', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    사업자 형태
                  </label>
                  <select
                    id="businessType"
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', '', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="개인사업자">개인사업자</option>
                    <option value="법인사업자">법인사업자</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="businessCategory" className="block text-sm font-medium text-gray-700 mb-2">
                  업종
                </label>
                <input
                  type="text"
                  id="businessCategory"
                  value={formData.businessCategory}
                  onChange={(e) => handleInputChange('businessCategory', '', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="네일아트"
                />
              </div>
            </div>

            {/* 연락처 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">연락처 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    연락처 이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', '', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    연락처 전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', '', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">사업자 주소</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="businessAddress.street" className="block text-sm font-medium text-gray-700 mb-2">
                    사업자 주소 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="businessAddress.street"
                    value={formData.businessAddress?.street || ''}
                    onChange={(e) => handleInputChange('businessAddress', 'street', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    시/구 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="businessAddress.city"
                    value={formData.businessAddress?.city || ''}
                    onChange={(e) => handleInputChange('businessAddress', 'city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    시/도 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="businessAddress.state"
                    value={formData.businessAddress?.state || ''}
                    onChange={(e) => handleInputChange('businessAddress', 'state', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    우편번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="businessAddress.zipCode"
                    value={formData.businessAddress?.zipCode || ''}
                    onChange={(e) => handleInputChange('businessAddress', 'zipCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    국가
                  </label>
                  <input
                    type="text"
                    id="businessAddress.country"
                    value={formData.businessAddress?.country || ''}
                    onChange={(e) => handleInputChange('businessAddress', 'country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="대한민국"
                  />
                </div>
              </div>
            </div>

            {/* 계좌 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">정산 계좌 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bankAccount.bankName" className="block text-sm font-medium text-gray-700 mb-2">
                    은행명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bankAccount.bankName"
                    value={formData.bankAccount.bankName}
                    onChange={(e) => handleInputChange('bankAccount', 'bankName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                    예금주명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bankAccount.accountHolder"
                    value={formData.bankAccount.accountHolder}
                    onChange={(e) => handleInputChange('bankAccount', 'accountHolder', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors['bankAccount.accountHolder'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="홍길동"
                  />
                  {errors['bankAccount.accountHolder'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['bankAccount.accountHolder']}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="bankAccount.accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    계좌번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bankAccount.accountNumber"
                    value={formData.bankAccount.accountNumber}
                    onChange={(e) => handleInputChange('bankAccount', 'accountNumber', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">📋 안내 사항</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 신청서 제출 후 1-3 영업일 내에 검토 결과를 연락드립니다.</li>
                <li>• 추가 서류가 필요한 경우 별도로 안내해드립니다.</li>
                <li>• 허위 정보 기재 시 신청이 거부될 수 있습니다.</li>
                <li>• 승인 후 판매자 센터에서 상품 등록이 가능합니다.</li>
              </ul>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => onGo('/')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    제출 중...
                  </div>
                ) : (
                  '신청서 제출'
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