import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShippingAddress, KoreanAddress } from '@handy-platform/shared';
import { webApiService } from '../../services/apiService';

interface ShippingAddressFormProps {
  initialData?: Partial<ShippingAddress>;
  onSave: (address: ShippingAddress) => Promise<void>;
  onCancel?: () => void;
  showCancelButton?: boolean;
  processing?: boolean;
  title?: string;
  showAddressName?: boolean;
}

export const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({
  initialData = {},
  onSave,
  onCancel,
  showCancelButton = true,
  processing = false,
  title: titleProp,
  showAddressName = false
}) => {
  const { t } = useTranslation('order');
  const title = titleProp ?? t('shipping.shippingInfo');
  // 전화번호 하이픈 자동 포맷팅
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 11);

    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
    } else if (limitedNumbers.length <= 10) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 6)}-${limitedNumbers.slice(6)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`;
    }
  };

  const [formData, setFormData] = useState<Partial<ShippingAddress>>(() => ({
    recipientName: '',
    recipientPhone: '',
    postcode: '',
    roadAddress: '',
    detailAddress: '',
    deliveryNote: '',
    region: 'seoul',
    isDefault: false,
    ...initialData,
    // initialData의 전화번호가 있으면 포맷팅
    ...(initialData.recipientPhone && { recipientPhone: formatPhoneNumber(initialData.recipientPhone) })
  }));

  const [addressName, setAddressName] = useState<string>(() => 
    (initialData as any)?.addressName || ''
  );

  const handleFieldChange = (field: keyof ShippingAddress, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    return !!(
      formData.recipientName?.trim() &&
      formData.recipientPhone?.trim() &&
      formData.postcode?.trim() &&
      formData.roadAddress?.trim()
    );
  };

  // 우편번호 찾기 (Daum Postcode API)
  const handlePostcodeSearch = () => {
    if (typeof window === 'undefined' || !window.daum || !window.daum.Postcode) {
      alert(t('shipping.postcodeServiceLoading'));
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data: any) {
        // 주소 데이터 추출
        const postcode = data.zonecode;
        const roadAddress = data.roadAddress;
        const jibunAddress = data.jibunAddress;
        const buildingName = data.buildingName;
        const sido = data.sido;

        // region 자동 감지
        let region: 'seoul' | 'metropolitan' | 'general' | 'jeju' | 'remote' = 'general';
        if (sido.includes('서울')) region = 'seoul';
        else if (sido.includes('경기') || sido.includes('인천')) region = 'metropolitan';
        else if (sido.includes('제주')) region = 'jeju';
        else if (sido.includes('울릉') || sido.includes('백령')) region = 'remote';

        // extraAddress 생성
        const extraAddress = buildingName ? `(${buildingName})` : '';

        // formData 업데이트
        handleFieldChange('postcode', postcode);
        handleFieldChange('roadAddress', roadAddress);
        handleFieldChange('jibunAddress', jibunAddress);
        handleFieldChange('extraAddress', extraAddress);
        handleFieldChange('region', region);

        console.log('✅ 주소 선택 완료:', { postcode, roadAddress, region });
      },
      width: '100%',
      height: '100%'
    }).open();
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert(t('shipping.fillRequired'));
      return;
    }

    // ✅ 배송지 저장 API 요청 데이터 (region 제외 - 서버에서 postcode로 자동 감지)
    const addressData: KoreanAddress = {
      recipientName: formData.recipientName!,
      recipientPhone: formData.recipientPhone!,
      postcode: formData.postcode!,
      roadAddress: formData.roadAddress!,
      detailAddress: formData.detailAddress || '',
      deliveryNote: formData.deliveryNote || '',
      // Optional fields
      ...(formData.jibunAddress && { jibunAddress: formData.jibunAddress }),
      ...(formData.extraAddress && { extraAddress: formData.extraAddress }),
      ...(showAddressName && addressName && { addressName })
    };

    try {
      console.log('📡 [ShippingAddressForm] Saving address to server...');

      // ✅ 배송지 저장 API 호출
      const response = await webApiService.address.createAddress(addressData);

      if (response.success && response.data?.address) {
        console.log('✅ [ShippingAddressForm] Address saved successfully:', response.data.address);

        // 서버 응답 데이터를 부모에게 전달 (선택 처리용)
        const savedAddress: ShippingAddress = {
          id: response.data.address.index?.toString() || `temp_${Date.now()}`,
          recipientName: response.data.address.recipientName,
          recipientPhone: response.data.address.recipientPhone,
          postcode: response.data.address.postcode,
          roadAddress: response.data.address.roadAddress,
          detailAddress: response.data.address.detailAddress || '',
          deliveryNote: response.data.address.deliveryNote || '',
          region: response.data.address.region || 'seoul', // 서버가 자동 감지한 region
          isDefault: response.data.address.isDefault || false,
          ...(response.data.address.jibunAddress && { jibunAddress: response.data.address.jibunAddress }),
          ...(response.data.address.extraAddress && { extraAddress: response.data.address.extraAddress })
        };

        await onSave(savedAddress);
      } else {
        throw new Error(response.message || t('shipping.saveFailed'));
      }
    } catch (error: any) {
      console.error('❌ [ShippingAddressForm] Address save failed:', error);
      alert(error.message || t('shipping.saveFailedRetry'));
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {showCancelButton && onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* 배송지명 (선택적) */}
        {showAddressName && (
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('shipping.addressName')}
            </label>
            <input
              type="text"
              value={addressName}
              onChange={(e) => setAddressName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder={t('shipping.addressNamePlaceholder')}
            />
          </div>
        )}

        {/* 받는 분 & 연락처 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('shipping.recipientName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.recipientName || ''}
              onChange={(e) => handleFieldChange('recipientName', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder={t('shipping.recipientNamePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('shipping.phone')} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.recipientPhone || ''}
              onChange={(e) => handleFieldChange('recipientPhone', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="010-0000-0000"
            />
          </div>
        </div>

        {/* 우편번호 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('shipping.zipCode')} <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 max-w-xs">
            <input
              type="text"
              value={formData.postcode || ''}
              onChange={(e) => handleFieldChange('postcode', e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="12345"
            />
            <button
              onClick={handlePostcodeSearch}
              type="button"
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 whitespace-nowrap"
            >
              {t('shipping.postcodeSearch')}
            </button>
          </div>
        </div>

        {/* 주소 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('shipping.address')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.roadAddress || ''}
            onChange={(e) => handleFieldChange('roadAddress', e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder={t('shipping.addressPlaceholder')}
          />
        </div>

        {/* 상세 주소 */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('shipping.detailAddress')}</label>
          <input
            type="text"
            value={formData.detailAddress || ''}
            onChange={(e) => handleFieldChange('detailAddress', e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder={t('shipping.detailAddressPlaceholder')}
          />
        </div>

        {/* 배송 메모 */}
        <div>
          <label className="block text-sm font-medium mb-2">{t('shipping.memo')}</label>
          <textarea
            value={formData.deliveryNote || ''}
            onChange={(e) => handleFieldChange('deliveryNote', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 h-20 resize-none"
            placeholder={t('shipping.deliveryNotePlaceholder')}
          />
        </div>

        {/* 기본 배송지 설정 */}
        {showAddressName && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault || false}
              onChange={(e) => handleFieldChange('isDefault', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isDefault" className="text-sm text-gray-700">
              {t('shipping.setDefault')}
            </label>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-3 pt-4">
          {showCancelButton && onCancel && (
            <button
              onClick={onCancel}
              disabled={processing}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {t('shipping.cancel')}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!validateForm() || processing}
            className="px-6 py-2 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? t('shipping.saving') : t('shipping.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingAddressForm;