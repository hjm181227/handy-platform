import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { webApiService } from '../../../services/apiService';
import { SellerLayout } from '../../layout/SellerLayout';
import { useAlert } from '../../common';
import type {
  SellerCoupon,
} from '@handy-platform/shared';

interface CouponManagementProps {
  onGo: (path: string) => void;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'expired';
type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';

// Extended form data type with code field
interface CouponFormData {
  name: string;
  description?: string;
  code?: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue: number;
  maxDiscountAmount?: number;
  minimumOrderAmount?: number;
  appliesTo: 'product' | 'quote' | 'both';
  validity: {
    startDate: string;
    endDate: string;
  };
  limits?: {
    totalCount?: number;
    perUserLimit?: number;
  };
  isPublic?: boolean;
}

// Generate random coupon code
const generateCouponCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const initialFormData: CouponFormData = {
  name: '',
  description: '',
  code: generateCouponCode(),
  discountType: 'percentage',
  discountValue: 10,
  maxDiscountAmount: undefined,
  minimumOrderAmount: undefined,
  appliesTo: 'both',
  validity: {
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  limits: {
    totalCount: 100,
    perUserLimit: 1,
  },
  isPublic: true,
};

export function CouponManagement({ onGo }: CouponManagementProps) {
  const { t } = useTranslation('seller');
  const { alert, confirm } = useAlert();
  const [coupons, setCoupons] = useState<SellerCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<SellerCoupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 쿠폰 목록 로드
  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError('');

      const filterParam = statusFilter === 'all' ? undefined : statusFilter;
      const response = await webApiService.seller.getSellerCoupons({
        status: filterParam as 'active' | 'inactive' | 'expired' | undefined,
      });

      // 서버 응답: { success, data: [...], pagination }
      const couponsData = Array.isArray(response.data) ? response.data : (response.data?.coupons || []);
      setCoupons(couponsData);
    } catch (err: any) {
      console.error('쿠폰 목록 로드 실패:', err);
      setError(t('coupons.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [statusFilter]);

  // 쿠폰 생성/수정
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      await alert(t('coupons.nameRequired'), { variant: 'error' });
      return;
    }

    if (!formData.code?.trim()) {
      await alert(t('coupons.codeRequired'), { variant: 'error' });
      return;
    }

    // Validate coupon code format (alphanumeric only)
    if (!/^[A-Z0-9]+$/.test(formData.code)) {
      await alert(t('coupons.codeFormat'), { variant: 'error' });
      return;
    }

    if (formData.discountType !== 'free_shipping' && formData.discountValue <= 0) {
      await alert(t('coupons.discountRequired'), { variant: 'error' });
      return;
    }

    try {
      setSaving(true);

      if (editingCoupon) {
        await webApiService.seller.updateCoupon(editingCoupon.couponUuid, formData);
        await alert(t('coupons.couponUpdated'), { variant: 'success' });
      } else {
        await webApiService.seller.createCoupon(formData);
        await alert(t('coupons.couponCreated'), { variant: 'success' });
      }

      setShowModal(false);
      setEditingCoupon(null);
      setFormData(initialFormData);
      loadCoupons();
    } catch (err: any) {
      console.error('쿠폰 저장 실패:', err);
      await alert(t('coupons.saveFailed', { error: err.message || '' }), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // 쿠폰 상태 변경
  const handleToggleStatus = async (coupon: SellerCoupon) => {
    const action = coupon.isActive ? t('coupons.deactivate') : t('coupons.activate');
    const confirmed = await confirm(t('coupons.toggleConfirm', { action }), {
      title: t('coupons.toggleTitle', { action }),
      confirmText: action,
    });

    if (!confirmed) return;

    try {
      await webApiService.seller.updateCouponStatus(coupon.couponUuid, !coupon.isActive);
      await alert(t('coupons.toggleSuccess', { action }), { variant: 'success' });
      loadCoupons();
    } catch (err: any) {
      console.error('쿠폰 상태 변경 실패:', err);
      await alert(t('coupons.toggleFailed'), { variant: 'error' });
    }
  };

  // 쿠폰 삭제
  const handleDelete = async (coupon: SellerCoupon) => {
    const confirmed = await confirm(t('coupons.deleteConfirm'), {
      title: t('coupons.deleteTitle'),
      confirmText: t('common:delete'),
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await webApiService.seller.deleteCoupon(coupon.couponUuid);
      await alert(t('coupons.deleteSuccess'), { variant: 'success' });
      loadCoupons();
    } catch (err: any) {
      console.error('쿠폰 삭제 실패:', err);
      await alert(t('coupons.deleteFailed'), { variant: 'error' });
    }
  };

  // 수정 모달 열기
  const handleEdit = (coupon: SellerCoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      name: coupon.name,
      description: coupon.description || '',
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minimumOrderAmount: coupon.minimumOrderAmount,
      appliesTo: coupon.appliesTo,
      validity: coupon.validity,
      limits: {
        totalCount: coupon.limits.totalCount,
        perUserLimit: coupon.limits.perUserLimit,
      },
      isPublic: coupon.isPublic,
    });
    setShowModal(true);
  };

  // 새 쿠폰 모달 열기
  const handleCreate = () => {
    setEditingCoupon(null);
    setFormData({
      ...initialFormData,
      code: generateCouponCode(),
    });
    setShowModal(true);
  };

  // 할인 표시 포맷
  const formatDiscount = (coupon: SellerCoupon) => {
    switch (coupon.discountType) {
      case 'percentage':
        return `${coupon.discountValue}%`;
      case 'fixed_amount':
        return `${coupon.discountValue.toLocaleString()}원`;
      case 'free_shipping':
        return t('coupons.freeShippingLabel');
      default:
        return '-';
    }
  };

  // 상태 뱃지
  const getStatusBadge = (coupon: SellerCoupon) => {
    const now = new Date();
    const endDate = new Date(coupon.validity.endDate);

    if (endDate < now) {
      return <span className="px-2 py-1 text-xs rounded-full bg-surface-strong text-gray-600">{t('coupons.statusExpired')}</span>;
    }
    if (!coupon.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">{t('coupons.statusInactive')}</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">{t('coupons.statusActive')}</span>;
  };

  return (
    <SellerLayout title={t('coupons.title')} onGo={onGo}>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('coupons.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('coupons.subtitle')}</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-brand text-white px-4 py-2.5 rounded-full hover:bg-brand-600 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('coupons.createCoupon')}
          </button>
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 border-b border-line">
          {[
            { key: 'all', label: t('coupons.all') },
            { key: 'active', label: t('coupons.active') },
            { key: 'inactive', label: t('coupons.inactiveTab') },
            { key: 'expired', label: t('coupons.expired') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as StatusFilter)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === tab.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 로딩 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
              <p className="text-gray-600">{t('coupons.loadingCoupons')}</p>
            </div>
          </div>
        ) : coupons.length === 0 ? (
          /* 빈 상태 */
          <div className="bg-white rounded-xl shadow-sm border border-line p-12 text-center">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('coupons.noCoupons')}</h3>
            <p className="text-gray-600 mb-6">{t('coupons.noCouponsDesc')}</p>
            <button
              onClick={handleCreate}
              className="bg-brand text-white px-6 py-2.5 rounded-full hover:bg-brand-600 transition-colors font-medium"
            >
              {t('coupons.createFirst')}
            </button>
          </div>
        ) : (
          /* 쿠폰 테이블 */
          <div className="bg-white rounded-xl shadow-sm border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface border-b border-line">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">{t('coupons.couponNameCode')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">{t('coupons.discount')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">{t('coupons.validPeriod')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">{t('coupons.issuedUsed')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">{t('coupons.status')}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">{t('coupons.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {coupons.map((coupon) => (
                    <tr key={coupon.couponUuid} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{coupon.name}</div>
                          <div className="text-sm text-muted font-mono">{coupon.code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-brand">{formatDiscount(coupon)}</div>
                        {coupon.maxDiscountAmount && (
                          <div className="text-xs text-muted">{t('coupons.maxDiscount', { amount: coupon.maxDiscountAmount.toLocaleString() })}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(coupon.validity.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted">
                          ~ {new Date(coupon.validity.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">{coupon.stats?.usedCount || 0}</span>
                          <span className="text-muted"> / {coupon.limits.totalCount}</span>
                        </div>
                        <div className="w-24 h-1.5 bg-surface-strong rounded-full mt-1">
                          <div
                            className="h-full bg-brand rounded-full"
                            style={{
                              width: `${Math.min(((coupon.stats?.usedCount || 0) / coupon.limits.totalCount) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(coupon)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(coupon)}
                            className="p-2 text-muted hover:text-gray-700 hover:bg-surface rounded-lg transition-colors"
                            title={coupon.isActive ? t('coupons.deactivate') : t('coupons.activate')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={coupon.isActive ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M5 13l4 4L19 7'}
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="p-2 text-muted hover:text-brand hover:bg-brand-50 rounded-lg transition-colors"
                            title={t('common:edit')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('common:delete')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 쿠폰 생성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-white border-b border-line px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCoupon ? t('coupons.editCoupon') : t('coupons.createCoupon')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">{t('coupons.basicInfo')}</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('coupons.couponName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                    placeholder={t('coupons.couponNamePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('coupons.couponCode')} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="flex-1 border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand font-mono uppercase"
                      placeholder="SUMMER2024"
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, code: generateCouponCode() })}
                      className="px-4 py-2.5 border border-line rounded-lg text-ink hover:bg-surface transition-colors whitespace-nowrap"
                    >
                      {t('coupons.autoGenerate')}
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1">{t('coupons.couponCodeDesc')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupons.descriptionLabel')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand h-20 resize-none"
                    placeholder={t('coupons.descriptionPlaceholder')}
                  />
                </div>
              </div>

              {/* 할인 설정 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">{t('coupons.discountSettings')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupons.discountType')}</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({ ...formData, discountType: e.target.value as DiscountType })
                      }
                      className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                    >
                      <option value="percentage">{t('coupons.percentageDiscount')}</option>
                      <option value="fixed_amount">{t('coupons.fixedDiscount')}</option>
                      <option value="free_shipping">{t('coupons.freeShipping')}</option>
                    </select>
                  </div>
                  {formData.discountType !== 'free_shipping' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('coupons.discountValue')} {formData.discountType === 'percentage' ? t('coupons.percentageUnit') : t('coupons.fixedUnit')}
                      </label>
                      <input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                        className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                        min={0}
                        max={formData.discountType === 'percentage' ? 100 : undefined}
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {formData.discountType === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupons.maxDiscountAmount')}</label>
                      <input
                        type="number"
                        value={formData.maxDiscountAmount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined })
                        }
                        className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                        placeholder={t('coupons.noLimit')}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupons.minOrderAmount')}</label>
                    <input
                      type="number"
                      value={formData.minimumOrderAmount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, minimumOrderAmount: e.target.value ? Number(e.target.value) : undefined })
                      }
                      className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                      placeholder={t('coupons.noLimit')}
                    />
                  </div>
                </div>
              </div>

              {/* 적용 대상 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">{t('coupons.applyTarget')}</h3>
                <div className="flex gap-4">
                  {[
                    { value: 'product', label: t('coupons.regularProduct') },
                    { value: 'quote', label: t('coupons.quoteProduct') },
                    { value: 'both', label: t('coupons.bothProducts') },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="appliesTo"
                        value={option.value}
                        checked={formData.appliesTo === option.value}
                        onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value as 'product' | 'quote' | 'both' })}
                        className="w-4 h-4 text-brand focus:ring-brand"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 유효 기간 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">{t('coupons.validityPeriod')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupons.startDate')}</label>
                    <input
                      type="date"
                      value={formData.validity.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, validity: { ...formData.validity, startDate: e.target.value } })
                      }
                      className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupons.endDate')}</label>
                    <input
                      type="date"
                      value={formData.validity.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, validity: { ...formData.validity, endDate: e.target.value } })
                      }
                      className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>
              </div>

              {/* 발급 제한 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">{t('coupons.issueLimits')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupons.totalIssueCount')}</label>
                    <input
                      type="number"
                      value={formData.limits?.totalCount || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          limits: { ...formData.limits!, totalCount: Number(e.target.value) },
                        })
                      }
                      className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupons.perUserLimit')}</label>
                    <input
                      type="number"
                      value={formData.limits?.perUserLimit || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          limits: { ...formData.limits!, perUserLimit: Number(e.target.value) },
                        })
                      }
                      className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                      min={1}
                    />
                  </div>
                </div>
              </div>

              {/* 공개 설정 */}
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{t('coupons.publicCoupon')}</h3>
                  <p className="text-sm text-gray-600">{t('coupons.publicCouponDesc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-line px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 border border-line rounded-lg text-ink hover:bg-surface transition-colors font-medium"
              >
                {t('common:cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 bg-brand text-white rounded-full hover:bg-brand-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('productForm.saving')}
                  </>
                ) : editingCoupon ? (
                  t('coupons.editComplete')
                ) : (
                  t('coupons.createComplete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}
