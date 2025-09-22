import React, { useState, useEffect } from 'react';
import { ShippingAddress } from '@handy-platform/shared';

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
  const [formData, setFormData] = useState<Partial<ShippingAddress>>(() => ({
    recipientName: '',
    phone: '',
    zipCode: '',
    address: '',
    addressDetail: '',
    memo: '',
    isDefault: false,
    ...initialData
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
      formData.phone?.trim() &&
      formData.zipCode?.trim() &&
      formData.address?.trim()
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    const addressToSave: ShippingAddress = {
      id: formData.id || '',
      recipientName: formData.recipientName!,
      phone: formData.phone!,
      zipCode: formData.zipCode!,
      address: formData.address!,
      addressDetail: formData.addressDetail || '',
      memo: formData.memo || '',
      isDefault: formData.isDefault || false,
      ...(showAddressName && { addressName })
    };

    try {
      await onSave(addressToSave);
    } catch (error) {
      console.error('Address save failed:', error);
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
              value={formData.phone || ''}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
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
              value={formData.zipCode || ''}
              onChange={(e) => handleFieldChange('zipCode', e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="12345"
            />
            <button
              onClick={() => {
                // TODO: 우편번호 찾기 API 연동
                // - Daum 우편번호 서비스 또는 행정안전부 주소 API 연동
                // - 팝업 또는 모달로 주소 검색 기능 구현
                // - 선택한 주소를 zipCode, address 필드에 자동 입력
                alert('우편번호 찾기는 추후 구현됩니다.');
              }}
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
            value={formData.address || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="기본 주소"
          />
        </div>

        {/* 상세 주소 */}
        <div>
          <label className="block text-sm font-medium mb-2">상세 주소</label>
          <input
            type="text"
            value={formData.addressDetail || ''}
            onChange={(e) => handleFieldChange('addressDetail', e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="상세 주소 (아파트 동/호수 등)"
          />
        </div>

        {/* 배송 메모 */}
        <div>
          <label className="block text-sm font-medium mb-2">배송 메모</label>
          <textarea
            value={formData.memo || ''}
            onChange={(e) => handleFieldChange('memo', e.target.value)}
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