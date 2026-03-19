import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import { ShippingAddressForm } from '../common/ShippingAddressForm';
import type {
  KoreanAddressResponse,
  ShippingAddress
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

  // 배송지 저장 (ShippingAddressForm 콜백)
  const handleSaveAddress = async (addressData: ShippingAddress) => {
    setSaving(true);
    try {
      // ShippingAddress는 이미 ShippingAddressForm에서 서버에 저장됨
      // 여기서는 목록만 새로고침
      await loadAddresses();

      // 폼 닫기
      setShowAddForm(false);
      setEditingAddress(null);
      setError(null);

    } catch (err: any) {
      console.error('배송지 목록 새로고침 실패:', err);
      setError(err.message || '배송지 목록 새로고침에 실패했습니다.');
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
    setShowAddForm(true);
  };

  // 새 주소 추가 시작
  const startAdd = () => {
    setEditingAddress(null);
    setShowAddForm(true);
  };

  // 폼 닫기
  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingAddress(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A6B] mx-auto mb-4"></div>
              <p className="text-gray-600">배송지를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onGo('/my')}
              className="text-gray-800 hover:text-black p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold">배송지 관리</h1>
          </div>
          <button
            onClick={startAdd}
            className="bg-[#E85A6B] text-white px-4 py-2 rounded-lg hover:bg-[#D14A5B] text-sm font-medium"
          >
            + 새 배송지 추가
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

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
              className="bg-[#E85A6B] text-white px-6 py-2 rounded-lg hover:bg-[#D14A5B]"
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
                        <span className="bg-[#FFF1F2] text-[#D14A5B] px-2 py-1 rounded-full text-xs font-medium">
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
                        className="text-[#E85A6B] hover:text-[#E85A6B] text-sm font-medium"
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
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <ShippingAddressForm
                initialData={editingAddress ? {
                  recipientName: editingAddress.recipientName,
                  recipientPhone: editingAddress.recipientPhone,
                  postcode: editingAddress.postcode,
                  roadAddress: editingAddress.roadAddress,
                  jibunAddress: editingAddress.jibunAddress,
                  detailAddress: editingAddress.detailAddress,
                  extraAddress: editingAddress.extraAddress,
                  region: editingAddress.region,
                  deliveryNote: editingAddress.deliveryNote,
                  addressName: editingAddress.addressName,
                  savedAddressIndex: editingAddress.index
                } : undefined}
                onSave={handleSaveAddress}
                onCancel={handleCancelForm}
                showCancelButton={true}
                processing={saving}
                title={editingAddress ? '배송지 수정' : '새 배송지 추가'}
                showAddressName={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
