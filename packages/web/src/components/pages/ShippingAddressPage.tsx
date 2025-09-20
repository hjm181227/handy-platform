import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import type { ShippingAddress, SavedShippingAddress } from '@handy-platform/shared';

interface ShippingAddressPageProps {
  onGo: (path: string) => void;
}

export function ShippingAddressPage({ onGo }: ShippingAddressPageProps) {
  const [addresses, setAddresses] = useState<SavedShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<SavedShippingAddress | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<ShippingAddress>({
    recipientName: '',
    phone: '',
    address: '',
    addressDetail: '',
    zipCode: '',
    memo: ''
  });
  const [saving, setSaving] = useState(false);

  // 배송지 목록 로드
  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      // 임시로 샘플 데이터 사용 (API가 구현되면 교체)
      const sampleAddresses: SavedShippingAddress[] = [
        {
          id: '1',
          recipientName: '김철수',
          phone: '010-1234-5678',
          address: '서울특별시 강남구 테헤란로 123',
          addressDetail: '456호',
          zipCode: '06234',
          memo: '부재시 경비실에 맡겨주세요',
          isDefault: true,
          createdAt: '2025-09-01T10:00:00Z'
        },
        {
          id: '2',
          recipientName: '김영희',
          phone: '010-9876-5432',
          address: '서울특별시 마포구 홍익로 45',
          addressDetail: '101동 202호',
          zipCode: '04041',
          memo: '문 앞에 놓아주세요',
          isDefault: false,
          createdAt: '2025-09-05T15:30:00Z'
        }
      ];
      setAddresses(sampleAddresses);
    } catch (err: any) {
      console.error('배송지 로드 실패:', err);
      setError('배송지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // 폼 데이터 변경
  const handleFormChange = (field: keyof ShippingAddress, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const required = ['recipientName', 'phone', 'address', 'zipCode'];
    return required.every(field => formData[field as keyof ShippingAddress].trim());
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

      if (editingAddress) {
        // 수정
        const updatedAddress = {
          ...editingAddress,
          ...formData
        };
        setAddresses(prev => 
          prev.map(addr => addr.id === editingAddress.id ? updatedAddress : addr)
        );
      } else {
        // 새 추가
        const newAddress: SavedShippingAddress = {
          ...formData,
          id: Date.now().toString(),
          isDefault: addresses.length === 0, // 첫 번째 주소는 기본값으로
          createdAt: new Date().toISOString()
        };
        setAddresses(prev => [...prev, newAddress]);
      }

      // 폼 초기화
      setFormData({
        recipientName: '',
        phone: '',
        address: '',
        addressDetail: '',
        zipCode: '',
        memo: ''
      });
      setEditingAddress(null);
      setShowAddForm(false);

    } catch (err: any) {
      console.error('배송지 저장 실패:', err);
      setError('배송지 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 배송지 삭제
  const handleDelete = async (addressId: string) => {
    if (!confirm('이 배송지를 삭제하시겠습니까?')) return;

    try {
      setAddresses(prev => {
        const filtered = prev.filter(addr => addr.id !== addressId);
        // 기본 배송지가 삭제된 경우 첫 번째를 기본으로 설정
        if (filtered.length > 0) {
          const hasDefault = filtered.some(addr => addr.isDefault);
          if (!hasDefault) {
            filtered[0].isDefault = true;
          }
        }
        return filtered;
      });
    } catch (err: any) {
      console.error('배송지 삭제 실패:', err);
      setError('배송지 삭제에 실패했습니다.');
    }
  };

  // 기본 배송지 설정
  const handleSetDefault = async (addressId: string) => {
    try {
      setAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
        }))
      );
    } catch (err: any) {
      console.error('기본 배송지 설정 실패:', err);
      setError('기본 배송지 설정에 실패했습니다.');
    }
  };

  // 편집 시작
  const startEdit = (address: SavedShippingAddress) => {
    setEditingAddress(address);
    setFormData({
      recipientName: address.recipientName,
      phone: address.phone,
      address: address.address,
      addressDetail: address.addressDetail,
      zipCode: address.zipCode,
      memo: address.memo
    });
    setShowAddForm(true);
  };

  // 새 주소 추가 시작
  const startAdd = () => {
    setEditingAddress(null);
    setFormData({
      recipientName: '',
      phone: '',
      address: '',
      addressDetail: '',
      zipCode: '',
      memo: ''
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
              <div key={address.id} className="bg-white rounded-lg border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{address.recipientName}</h3>
                    {address.isDefault && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        기본배송지
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
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
                      onClick={() => handleDelete(address.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 min-w-16">연락처:</span>
                    <span>{address.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 min-w-16">주소:</span>
                    <div>
                      <div>({address.zipCode}) {address.address}</div>
                      {address.addressDetail && <div>{address.addressDetail}</div>}
                    </div>
                  </div>
                  {address.memo && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-16">배송메모:</span>
                      <span className="text-gray-600">{address.memo}</span>
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
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
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
                        value={formData.zipCode}
                        onChange={(e) => handleFormChange('zipCode', e.target.value)}
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
                      value={formData.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="기본 주소"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">상세 주소</label>
                    <input
                      type="text"
                      value={formData.addressDetail}
                      onChange={(e) => handleFormChange('addressDetail', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="상세 주소 (아파트 동/호수 등)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">배송 메모</label>
                    <textarea
                      value={formData.memo}
                      onChange={(e) => handleFormChange('memo', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 h-20 resize-none"
                      placeholder="배송 시 요청사항이 있으면 입력해주세요"
                    />
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