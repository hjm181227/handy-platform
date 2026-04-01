import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { money } from '../../utils';

// API Base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

// Types based on server API response (flat structure from /api/checkout/available-coupons)
interface AvailableCoupon {
  userCouponUuid: string;
  couponUuid: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue: number;
  maxDiscountAmount?: number;
  minimumOrderAmount?: number;
  scope: { type: 'platform' | 'seller'; sellerUuid?: string };
  appliesTo: 'product' | 'quote' | 'both';
  expiresAt: string;
  potentialDiscount: number;
}

interface AppliedCoupon {
  userCouponUuid: string;
  code: string;
  name: string;
  description?: string;
  discountType: string;
  discountAmount: number;
  freeShipping: boolean;
  scope: { type: string; sellerUuid?: string };
  appliesTo: string;
}

interface CouponSelectorProps {
  sessionId: string;
  orderAmount: number;
  appliedCoupon?: AppliedCoupon | null;
  onCouponApplied: (coupon: AppliedCoupon, updatedTotals: any) => void;
  onCouponRemoved: (updatedTotals: any) => void;
  onError?: (error: string) => void;
}

export function CouponSelector({
  sessionId,
  orderAmount,
  appliedCoupon,
  onCouponApplied,
  onCouponRemoved,
  onError,
}: CouponSelectorProps) {
  const { t } = useTranslation('order');
  const [isExpanded, setIsExpanded] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [codeError, setCodeError] = useState('');

  // Load available coupons when expanded
  useEffect(() => {
    if (isExpanded && availableCoupons.length === 0) {
      loadAvailableCoupons();
    }
  }, [isExpanded, sessionId]);

  const loadAvailableCoupons = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/checkout/available-coupons/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data?.coupons) {
        setAvailableCoupons(data.data.coupons);
      }
    } catch (err) {
      console.error('Failed to load available coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async (userCouponUuid: string) => {
    if (!sessionId || applying) return;

    try {
      setApplying(true);
      setCodeError('');

      const response = await fetch(`${API_BASE_URL}/api/checkout/apply-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ sessionId, userCouponUuid }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        onCouponApplied(data.data.appliedCoupon, data.data.updatedTotals);
        setIsExpanded(false);
      } else {
        const error = data.error || t('checkout.couponApplyFailed');
        setCodeError(error);
        onError?.(error);
      }
    } catch (err: any) {
      const error = err.message || t('checkout.couponApplyFailed');
      setCodeError(error);
      onError?.(error);
    } finally {
      setApplying(false);
    }
  };

  const handleApplyCode = async () => {
    if (!sessionId || !couponCode.trim() || applying) return;

    try {
      setApplying(true);
      setCodeError('');

      const response = await fetch(`${API_BASE_URL}/api/checkout/apply-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ sessionId, couponCode: couponCode.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        onCouponApplied(data.data.appliedCoupon, data.data.updatedTotals);
        setCouponCode('');
        setIsExpanded(false);
      } else {
        setCodeError(data.error || t('checkout.invalidCouponCode'));
      }
    } catch (err: any) {
      setCodeError(err.message || t('checkout.couponCodeCheckFailed'));
    } finally {
      setApplying(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (!sessionId || applying) return;

    try {
      setApplying(true);

      const response = await fetch(`${API_BASE_URL}/api/checkout/remove-coupon/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        onCouponRemoved(data.data.updatedTotals);
      } else {
        onError?.(data.error || t('checkout.couponRemoveFailed'));
      }
    } catch (err: any) {
      onError?.(err.message || t('checkout.couponRemoveFailed'));
    } finally {
      setApplying(false);
    }
  };

  const formatDiscount = (coupon: AvailableCoupon) => {
    switch (coupon.discountType) {
      case 'percentage':
        return `${coupon.discountValue}%`;
      case 'fixed_amount':
        return money(coupon.discountValue);
      case 'free_shipping':
        return t('checkout.freeShippingCoupon');
      default:
        return '-';
    }
  };

  const formatExpiry = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return t('checkout.expiryToday');
    if (diffDays === 1) return t('checkout.expiryTomorrow');
    if (diffDays <= 7) return t('checkout.expiryDaysLeft', { days: diffDays });

    return `~${date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}`;
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[#E85A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <span className="font-semibold text-gray-900">{t('checkout.couponApply')}</span>
          {availableCoupons.length > 0 && !appliedCoupon && (
            <span className="bg-[#FFF1F2] text-[#E85A6B] text-xs px-2 py-0.5 rounded-full font-medium">
              {t('checkout.couponAvailableCount', { count: availableCoupons.length })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {appliedCoupon && (
            <span className="text-[#E85A6B] font-semibold">
              -{money(appliedCoupon.discountAmount)}
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Applied Coupon Display */}
      {appliedCoupon && !isExpanded && (
        <div className="px-6 pb-4 border-t border-gray-100">
          <div className="mt-3 bg-[#FFF1F2] border border-[#E85A6B]/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#E85A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <span className="text-sm font-medium text-[#D14A5B]">{appliedCoupon.name}</span>
                <span className="text-xs text-[#E85A6B] ml-2">-{money(appliedCoupon.discountAmount)}</span>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              disabled={applying}
              className="text-xs text-[#E85A6B] hover:text-[#D14A5B] font-medium disabled:opacity-50"
            >
              {applying ? t('checkout.processing') : t('checkout.remove')}
            </button>
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-4 border-t border-gray-100 space-y-4">
          {/* Applied Coupon */}
          {appliedCoupon && (
            <div className="mt-4 bg-[#FFF1F2] border border-[#E85A6B]/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#E85A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold text-[#D14A5B]">{appliedCoupon.name}</span>
                  </div>
                  <p className="text-sm text-[#E85A6B] mt-1">
                    {t('checkout.couponDiscountLabel')}: <span className="font-bold">{money(appliedCoupon.discountAmount)}</span>
                  </p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  disabled={applying}
                  className="px-3 py-1.5 bg-white border border-blue-300 text-[#E85A6B] text-sm rounded-lg hover:bg-[#FFF1F2] disabled:opacity-50 transition-colors"
                >
                  {applying ? t('checkout.processing') : t('checkout.removeCoupon')}
                </button>
              </div>
            </div>
          )}

          {/* Available Coupons */}
          {!appliedCoupon && (
            <>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">{t('checkout.ownedCoupons')}</h3>

                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E85A6B]"></div>
                    <span className="ml-2 text-sm text-gray-500">{t('checkout.loadingCoupons')}</span>
                  </div>
                ) : availableCoupons.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <p className="text-sm">{t('checkout.noCouponsAvailable')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('checkout.enterCodeBelow')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableCoupons.map((couponItem) => (
                      <button
                        key={couponItem.userCouponUuid}
                        onClick={() => handleApplyCoupon(couponItem.userCouponUuid)}
                        disabled={applying}
                        className="w-full text-left border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-[#FFF1F2] transition-colors disabled:opacity-50 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">
                                {couponItem.name}
                              </span>
                              {couponItem.scope.type === 'seller' && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                  {t('checkout.sellerScope')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatExpiry(couponItem.expiresAt)}
                              </span>
                              {couponItem.minimumOrderAmount && couponItem.minimumOrderAmount > 0 && (
                                <span className="text-xs text-gray-400">
                                  {t('checkout.minimumOrderAmount', { amount: couponItem.minimumOrderAmount.toLocaleString() })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-3">
                            <div className="text-lg font-bold text-[#E85A6B]">
                              -{money(couponItem.potentialDiscount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDiscount(couponItem)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Coupon Code Input */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">{t('checkout.couponCodeInput')}</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCodeError('');
                    }}
                    placeholder={t('checkout.couponCodePlaceholder')}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:border-[#E85A6B] focus:ring-1 focus:ring-[#E85A6B] text-sm uppercase"
                    disabled={applying}
                  />
                  <button
                    onClick={handleApplyCode}
                    disabled={!couponCode.trim() || applying}
                    className="px-4 py-2.5 bg-[#E85A6B] text-white text-sm font-medium rounded-lg hover:bg-[#D14A5B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {applying ? t('checkout.checking') : t('checkout.apply')}
                  </button>
                </div>
                {codeError && (
                  <p className="mt-2 text-sm text-red-600">{codeError}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
