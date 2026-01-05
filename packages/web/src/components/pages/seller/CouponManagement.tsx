import { useState, useEffect } from 'react';
import { webApiService } from '../../../services/apiService';
import { SellerLayout } from '../../layout/SellerLayout';
import { useAlert } from '../../common';
import {
  SellerCoupon,
  CreateSellerCouponRequest,
} from '@handy-platform/shared';

interface CouponManagementProps {
  onGo: (path: string) => void;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'expired';
type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';

const initialFormData: CreateSellerCouponRequest = {
  name: '',
  description: '',
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
  const { alert, confirm } = useAlert();
  const [coupons, setCoupons] = useState<SellerCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<SellerCoupon | null>(null);
  const [formData, setFormData] = useState<CreateSellerCouponRequest>(initialFormData);
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
      setError('쿠폰 목록을 불러오는데 실패했습니다.');
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
      await alert('쿠폰명을 입력해주세요.', { variant: 'error' });
      return;
    }

    if (formData.discountType !== 'free_shipping' && formData.discountValue <= 0) {
      await alert('할인 값을 입력해주세요.', { variant: 'error' });
      return;
    }

    try {
      setSaving(true);

      if (editingCoupon) {
        await webApiService.seller.updateCoupon(editingCoupon.couponUuid, formData);
        await alert('쿠폰이 수정되었습니다.', { variant: 'success' });
      } else {
        await webApiService.seller.createCoupon(formData);
        await alert('쿠폰이 생성되었습니다.', { variant: 'success' });
      }

      setShowModal(false);
      setEditingCoupon(null);
      setFormData(initialFormData);
      loadCoupons();
    } catch (err: any) {
      console.error('쿠폰 저장 실패:', err);
      await alert('쿠폰 저장에 실패했습니다: ' + (err.message || '알 수 없는 오류'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // 쿠폰 상태 변경
  const handleToggleStatus = async (coupon: SellerCoupon) => {
    const action = coupon.isActive ? '비활성화' : '활성화';
    const confirmed = await confirm(`이 쿠폰을 ${action}하시겠습니까?`, {
      title: `쿠폰 ${action}`,
      confirmText: action,
    });

    if (!confirmed) return;

    try {
      await webApiService.seller.updateCouponStatus(coupon.couponUuid, !coupon.isActive);
      await alert(`쿠폰이 ${action}되었습니다.`, { variant: 'success' });
      loadCoupons();
    } catch (err: any) {
      console.error('쿠폰 상태 변경 실패:', err);
      await alert('상태 변경에 실패했습니다.', { variant: 'error' });
    }
  };

  // 쿠폰 삭제
  const handleDelete = async (coupon: SellerCoupon) => {
    const confirmed = await confirm('이 쿠폰을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.', {
      title: '쿠폰 삭제',
      confirmText: '삭제',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await webApiService.seller.deleteCoupon(coupon.couponUuid);
      await alert('쿠폰이 삭제되었습니다.', { variant: 'success' });
      loadCoupons();
    } catch (err: any) {
      console.error('쿠폰 삭제 실패:', err);
      await alert('쿠폰 삭제에 실패했습니다.', { variant: 'error' });
    }
  };

  // 수정 모달 열기
  const handleEdit = (coupon: SellerCoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      name: coupon.name,
      description: coupon.description || '',
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
    setFormData(initialFormData);
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
        return '무료배송';
      default:
        return '-';
    }
  };

  // 상태 뱃지
  const getStatusBadge = (coupon: SellerCoupon) => {
    const now = new Date();
    const endDate = new Date(coupon.validity.endDate);

    if (endDate < now) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">만료됨</span>;
    }
    if (!coupon.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">비활성</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">활성</span>;
  };

  return (
    <SellerLayout title="쿠폰 관리" onGo={onGo}>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">쿠폰 관리</h1>
            <p className="text-sm text-gray-600 mt-1">고객에게 제공할 쿠폰을 관리하세요</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 쿠폰 만들기
          </button>
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { key: 'all', label: '전체' },
            { key: 'active', label: '활성' },
            { key: 'inactive', label: '비활성' },
            { key: 'expired', label: '만료됨' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as StatusFilter)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === tab.key
                  ? 'border-blue-600 text-blue-600'
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">쿠폰 목록을 불러오는 중...</p>
            </div>
          </div>
        ) : coupons.length === 0 ? (
          /* 빈 상태 */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">등록된 쿠폰이 없습니다</h3>
            <p className="text-gray-600 mb-6">새 쿠폰을 만들어 고객에게 할인 혜택을 제공하세요</p>
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              첫 쿠폰 만들기
            </button>
          </div>
        ) : (
          /* 쿠폰 테이블 */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">쿠폰명 / 코드</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">할인</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">유효기간</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">발급/사용</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">상태</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coupons.map((coupon) => (
                    <tr key={coupon.couponUuid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{coupon.name}</div>
                          <div className="text-sm text-gray-500 font-mono">{coupon.code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-blue-600">{formatDiscount(coupon)}</div>
                        {coupon.maxDiscountAmount && (
                          <div className="text-xs text-gray-500">최대 {coupon.maxDiscountAmount.toLocaleString()}원</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(coupon.validity.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          ~ {new Date(coupon.validity.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">{coupon.stats?.usedCount || 0}</span>
                          <span className="text-gray-500"> / {coupon.limits.totalCount}</span>
                        </div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                          <div
                            className="h-full bg-blue-500 rounded-full"
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
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title={coupon.isActive ? '비활성화' : '활성화'}
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
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="수정"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
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
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCoupon ? '쿠폰 수정' : '새 쿠폰 만들기'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">기본 정보</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    쿠폰명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="예: 신규 회원 10% 할인"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-20 resize-none"
                    placeholder="쿠폰에 대한 설명을 입력하세요"
                  />
                </div>
              </div>

              {/* 할인 설정 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">할인 설정</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">할인 유형</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({ ...formData, discountType: e.target.value as DiscountType })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="percentage">정률 할인 (%)</option>
                      <option value="fixed_amount">정액 할인 (원)</option>
                      <option value="free_shipping">무료 배송</option>
                    </select>
                  </div>
                  {formData.discountType !== 'free_shipping' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        할인 값 {formData.discountType === 'percentage' ? '(%)' : '(원)'}
                      </label>
                      <input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        min={0}
                        max={formData.discountType === 'percentage' ? 100 : undefined}
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {formData.discountType === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">최대 할인 금액 (원)</label>
                      <input
                        type="number"
                        value={formData.maxDiscountAmount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="제한 없음"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">최소 주문 금액 (원)</label>
                    <input
                      type="number"
                      value={formData.minimumOrderAmount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, minimumOrderAmount: e.target.value ? Number(e.target.value) : undefined })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="제한 없음"
                    />
                  </div>
                </div>
              </div>

              {/* 적용 대상 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">적용 대상</h3>
                <div className="flex gap-4">
                  {[
                    { value: 'product', label: '일반 상품' },
                    { value: 'quote', label: '견적 상품' },
                    { value: 'both', label: '모두' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="appliesTo"
                        value={option.value}
                        checked={formData.appliesTo === option.value}
                        onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value as 'product' | 'quote' | 'both' })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 유효 기간 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">유효 기간</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                    <input
                      type="date"
                      value={formData.validity.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, validity: { ...formData.validity, startDate: e.target.value } })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                    <input
                      type="date"
                      value={formData.validity.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, validity: { ...formData.validity, endDate: e.target.value } })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 발급 제한 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">발급 제한</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">총 발급 수량</label>
                    <input
                      type="number"
                      value={formData.limits?.totalCount || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          limits: { ...formData.limits!, totalCount: Number(e.target.value) },
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1인당 사용 제한</label>
                    <input
                      type="number"
                      value={formData.limits?.perUserLimit || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          limits: { ...formData.limits!, perUserLimit: Number(e.target.value) },
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      min={1}
                    />
                  </div>
                </div>
              </div>

              {/* 공개 설정 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">공개 쿠폰</h3>
                  <p className="text-sm text-gray-600">공개 시 고객이 직접 다운로드 가능</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    저장 중...
                  </>
                ) : editingCoupon ? (
                  '수정 완료'
                ) : (
                  '쿠폰 생성'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}
