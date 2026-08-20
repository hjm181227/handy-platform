import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['common', 'order']);
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
      setError(err.message || t('common:loadFailed'));
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
      setError(err.message || t('common:loadFailed'));
    } finally {
      setSaving(false);
    }
  };

  // 배송지 삭제
  const handleDelete = async (addressIndex: number) => {
    if (!confirm(t('order:shipping.deleteConfirm'))) return;

    try {
      await webApiService.address.deleteAddress(addressIndex.toString());
      await loadAddresses();
    } catch (err: any) {
      console.error('배송지 삭제 실패:', err);
      setError(t('common:loadFailed'));
    }
  };

  // 기본 배송지 설정
  const handleSetDefault = async (addressIndex: number) => {
    try {
      await webApiService.address.setDefaultAddress(addressIndex.toString());
      await loadAddresses();
    } catch (err: any) {
      console.error('기본 배송지 설정 실패:', err);
      setError(t('common:loadFailed'));
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
      <div className="min-h-screen bg-surface">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
              <p className="text-muted">{t('order:shipping.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onGo('/my')}
              className="text-ink hover:text-ink p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold">{t('order:shipping.manage')}</h1>
          </div>
          <button
            onClick={startAdd}
            className="bg-brand text-white px-4 py-2 rounded-full hover:bg-brand-600 text-sm font-medium"
          >
            {t('order:shipping.addNewShort')}
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
          <div className="bg-white rounded-xl border p-8 text-center">
            <div className="text-muted text-4xl mb-4">📍</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">{t('order:shipping.noAddresses')}</h3>
            <p className="text-muted mb-4">{t('order:shipping.noAddressesDesc')}</p>
            <button
              onClick={startAdd}
              className="bg-brand text-white px-6 py-2 rounded-full hover:bg-brand-600"
            >
              {t('order:shipping.addFirst')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map(address => (
              <div key={address.index} className="bg-white rounded-xl border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-gray-900">
                        {address.addressName || t('order:checkout.addressLabel')}
                      </h3>
                      {address.isDefault && (
                        <span className="bg-brand-50 text-brand-600 px-2 py-1 rounded-full text-xs font-medium">
                          {t('order:shipping.defaultAddress')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{address.recipientName}</p>
                  </div>
                  <div className="flex gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.index)}
                        className="text-brand hover:text-brand text-sm font-medium"
                      >
                        {t('order:shipping.setDefault')}
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(address)}
                      className="text-muted hover:text-ink text-sm font-medium"
                    >
                      {t('order:shipping.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(address.index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      {t('order:shipping.delete')}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-muted min-w-16">{t('order:shipping.phone')}:</span>
                    <span>{address.recipientPhone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted min-w-16">{t('order:shipping.address')}:</span>
                    <div>
                      <div>({address.postcode}) {address.roadAddress}</div>
                      {address.detailAddress && <div>{address.detailAddress}</div>}
                      {address.extraAddress && <div className="text-muted text-sm">{address.extraAddress}</div>}
                    </div>
                  </div>
                  {address.deliveryNote && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted min-w-16">{t('order:shipping.deliveryMemo')}:</span>
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
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                title={editingAddress ? t('order:shipping.editTitle') : t('order:shipping.addTitle')}
                showAddressName={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
