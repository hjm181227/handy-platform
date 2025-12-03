import React, { useState, useEffect } from 'react';
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
  title = '배송지 정보',
  showAddressName = false
}) => {
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
      alert('우편번호 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
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
      alert('필수 정보를 모두 입력해주세요.');
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

      if (response.success && response.data) {
        console.log('✅ [ShippingAddressForm] Address saved successfully:', response.data);

        // 서버 응답 데이터를 부모에게 전달 (선택 처리용)
        const savedAddress: ShippingAddress = {
          id: response.data.index?.toString() || `temp_${Date.now()}`,
          recipientName: response.data.recipientName,
          recipientPhone: response.data.recipientPhone,
          postcode: response.data.postcode,
          roadAddress: response.data.roadAddress,
          detailAddress: response.data.detailAddress || '',
          deliveryNote: response.data.deliveryNote || '',
          region: response.data.region || 'seoul', // 서버가 자동 감지한 region
          isDefault: response.data.isDefault || false,
          ...(response.data.jibunAddress && { jibunAddress: response.data.jibunAddress }),
          ...(response.data.extraAddress && { extraAddress: response.data.extraAddress })
        };

        await onSave(savedAddress);
      } else {
        throw new Error(response.message || '배송지 저장에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('❌ [ShippingAddressForm] Address save failed:', error);
      alert(error.message || '배송지 저장에 실패했습니다. 다시 시도해주세요.');
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
              배송지명
            </label>
            <input
              type="text"
              value={addressName}
              onChange={(e) => setAddressName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="예) 집, 회사, 학교"
            />
          </div>
        )}

        {/* 받는 분 & 연락처 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              받는 분 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.recipientName || ''}
              onChange={(e) => handleFieldChange('recipientName', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="받는 분 성함"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              연락처 <span className="text-red-500">*</span>
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
            우편번호 <span className="text-red-500">*</span>
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
              검색
            </button>
          </div>
        </div>

        {/* 주소 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            주소 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.roadAddress || ''}
            onChange={(e) => handleFieldChange('roadAddress', e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="기본 주소"
          />
        </div>

        {/* 상세 주소 */}
        <div>
          <label className="block text-sm font-medium mb-2">상세 주소</label>
          <input
            type="text"
            value={formData.detailAddress || ''}
            onChange={(e) => handleFieldChange('detailAddress', e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="상세 주소 (아파트 동/호수 등)"
          />
        </div>

        {/* 배송 메모 */}
        <div>
          <label className="block text-sm font-medium mb-2">배송 메모</label>
          <textarea
            value={formData.deliveryNote || ''}
            onChange={(e) => handleFieldChange('deliveryNote', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 h-20 resize-none"
            placeholder="배송 시 요청사항이 있으면 입력해주세요"
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
              기본 배송지로 설정
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
              취소
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!validateForm() || processing}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingAddressForm;