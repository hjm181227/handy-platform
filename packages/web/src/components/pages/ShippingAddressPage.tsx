import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import type { 
  KoreanAddress, 
  KoreanAddressResponse,
  KoreanRegion
} from '@handy-platform/shared';

interface ShippingAddressPageProps {
  onGo: (path: string) => void;
}

export function ShippingAddressPage({ onGo }: ShippingAddressPageProps) {
  const [addresses, setAddresses] = useState<KoreanAddressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<KoreanAddressResponse | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Omit<KoreanAddress, 'isDefault'>>({
    recipientName: '',
    recipientPhone: '',
    postcode: '',
    roadAddress: '',
    jibunAddress: '',
    detailAddress: '',
    extraAddress: '',
    region: 'seoul',
    deliveryNote: '',
    addressName: ''
  });
  const [saving, setSaving] = useState(false);

  // 배송지 목록 로드
  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await webApiService.address.getAddresses();
      
      if (response.success && response.data?.addresses) {
        setAddresses(response.data.addresses);
      } else {
        setAddresses([]);
      }
    } catch (err: any) {
      console.error('배송지 로드 실패:', err);
      setError(err.message || '배송지를 불러오는데 실패했습니다.');
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // 폼 데이터 변경
  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const required = ['recipientName', 'recipientPhone', 'roadAddress', 'postcode'] as const;
    return required.every(field => formData[field].trim());
  };

  // 주소 유효성 검사
  const validateAddress = async () => {
    if (!validateForm()) {
      setError('필수 정보를 모두 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const validationData: KoreanAddress = {
        ...formData,
        jibunAddress: formData.jibunAddress || formData.roadAddress, // 지번주소가 없으면 도로명주소 사용
        isDefault: addresses.length === 0 // 첫 번째 주소는 기본값
      };

      const response = await webApiService.address.validateAddress(validationData);
      
      if (response.success && response.data?.isValid) {
        const { shippingEstimate } = response.data;
        alert(`주소가 유효합니다!\n배송비: ${shippingEstimate.estimatedCost}원\n예상 배송일: ${shippingEstimate.estimatedDays}일`);
      } else {
        setError('유효하지 않은 주소입니다.');
      }
    } catch (err: any) {
      console.error('주소 유효성 검사 실패:', err);
      setError('주소 유효성 검사에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 배송지 저장
  const handleSave = async () => {
    if (!validateForm()) {
      setError('필수 정보를 모두 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const requestData: KoreanAddress = {
        ...formData,
        jibunAddress: formData.jibunAddress || formData.roadAddress, // 지번주소가 없으면 도로명주소 사용
        isDefault: addresses.length === 0 // 첫 번째 주소는 기본값으로
      };

      if (editingAddress) {
        // 수정
        await webApiService.address.updateAddress(editingAddress.index.toString(), requestData);
      } else {
        // 새 추가
        await webApiService.address.createAddress(requestData);
      }

      // 성공 시 목록 새로고침
      await loadAddresses();

      // 폼 초기화
      setFormData({
        recipientName: '',
        recipientPhone: '',
        postcode: '',
        roadAddress: '',
        jibunAddress: '',
        detailAddress: '',
        extraAddress: '',
        region: 'seoul',
        deliveryNote: '',
        addressName: ''
      });
      setEditingAddress(null);
      setShowAddForm(false);

    } catch (err: any) {
      console.error('배송지 저장 실패:', err);
      setError(err.message || '배송지 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 배송지 삭제
  const handleDelete = async (addressIndex: number) => {
    if (!confirm('이 배송지를 삭제하시겠습니까?')) return;

    try {
      await webApiService.address.deleteAddress(addressIndex.toString());
      await loadAddresses();
    } catch (err: any) {
      console.error('배송지 삭제 실패:', err);
      setError('배송지 삭제에 실패했습니다.');
    }
  };

  // 기본 배송지 설정
  const handleSetDefault = async (addressIndex: number) => {
    try {
      await webApiService.address.setDefaultAddress(addressIndex.toString());
      await loadAddresses();
    } catch (err: any) {
      console.error('기본 배송지 설정 실패:', err);
      setError('기본 배송지 설정에 실패했습니다.');
    }
  };

  // 편집 시작
  const startEdit = (address: KoreanAddressResponse) => {
    setEditingAddress(address);
    setFormData({
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      postcode: address.postcode,
      roadAddress: address.roadAddress,
      jibunAddress: address.jibunAddress,
      detailAddress: address.detailAddress,
      extraAddress: address.extraAddress,
      region: address.region,
      deliveryNote: address.deliveryNote || '',
      addressName: address.addressName || ''
    });
    setShowAddForm(true);
  };

  // 새 주소 추가 시작
  const startAdd = () => {
    setEditingAddress(null);
    setFormData({
      recipientName: '',
      recipientPhone: '',
      postcode: '',
      roadAddress: '',
      jibunAddress: '',
      detailAddress: '',
      extraAddress: '',
      region: 'seoul',
      deliveryNote: '',
      addressName: ''
    });
    setShowAddForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">배송지를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onGo('/my')}
              className="text-gray-400 hover:text-gray-600"
            >
              ← 뒤로
            </button>
            <h1 className="text-2xl font-bold">배송지 관리</h1>
          </div>
          <button
            onClick={startAdd}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm font-medium"
          >
            + 새 배송지 추가
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 배송지 목록 */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📍</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">등록된 배송지가 없습니다</h3>
            <p className="text-gray-500 mb-4">자주 사용하는 배송지를 등록해두면 주문이 더욱 편리해집니다.</p>
            <button
              onClick={startAdd}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              첫 번째 배송지 추가
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map(address => (
              <div key={address.index} className="bg-white rounded-lg border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-gray-900">
                        {address.addressName || '배송지'}
                      </h3>
                      {address.isDefault && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          기본배송지
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{address.recipientName}</p>
                  </div>
                  <div className="flex gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.index)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        기본설정
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(address)}
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(address.index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 min-w-16">연락처:</span>
                    <span>{address.recipientPhone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 min-w-16">주소:</span>
                    <div>
                      <div>({address.postcode}) {address.roadAddress}</div>
                      {address.detailAddress && <div>{address.detailAddress}</div>}
                      {address.extraAddress && <div className="text-gray-500 text-sm">{address.extraAddress}</div>}
                    </div>
                  </div>
                  {address.deliveryNote && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-16">배송메모:</span>
                      <span className="text-gray-600">{address.deliveryNote}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 배송지 추가/수정 폼 모달 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    {editingAddress ? '배송지 수정' : '새 배송지 추가'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingAddress(null);
                      setError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      받는 분 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.recipientName}
                      onChange={(e) => handleFormChange('recipientName', e.target.value)}
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
                      value={formData.recipientPhone}
                      onChange={(e) => handleFormChange('recipientPhone', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="010-0000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      우편번호 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.postcode}
                        onChange={(e) => handleFormChange('postcode', e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2"
                        placeholder="12345"
                      />
                      <button 
                        type="button"
                        onClick={() => alert('우편번호 찾기는 추후 구현됩니다.')}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        검색
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      주소 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.roadAddress}
                      onChange={(e) => handleFormChange('roadAddress', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="도로명 주소"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">상세 주소</label>
                    <input
                      type="text"
                      value={formData.detailAddress}
                      onChange={(e) => handleFormChange('detailAddress', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="상세 주소 (아파트 동/호수 등)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">배송지명</label>
                    <input
                      type="text"
                      value={formData.addressName}
                      onChange={(e) => handleFormChange('addressName', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="예: 집, 회사, 학교 등"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">배송 메모</label>
                    <textarea
                      value={formData.deliveryNote}
                      onChange={(e) => handleFormChange('deliveryNote', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 h-20 resize-none"
                      placeholder="배송 시 요청사항이 있으면 입력해주세요"
                    />
                  </div>

                  {/* 주소 유효성 검사 버튼 */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={validateAddress}
                      disabled={saving || !validateForm()}
                      className="w-full border border-blue-500 text-blue-500 py-2 px-4 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {saving ? '검증 중...' : '주소 유효성 검사'}
                    </button>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingAddress(null);
                        setError(null);
                      }}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !validateForm()}
                      className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? '저장 중...' : editingAddress ? '수정' : '추가'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}