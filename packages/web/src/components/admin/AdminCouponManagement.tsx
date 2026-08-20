import React, { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import { useAlert } from '../common';

// Types
interface AdminCoupon {
  id: string;
  couponUuid?: string;
  code: string;
  name: string;
  description?: string;
  discountType?: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue?: number;
  maxDiscountAmount?: number;
  minimumOrderAmount?: number;
  scope?: { type: 'platform' | 'seller'; sellerUuid?: string };
  appliesTo?: 'product' | 'quote' | 'both';
  validity?: { startDate: string; endDate: string };
  limits?: { totalCount: number; issuedCount: number; perUserLimit: number };
  isActive: boolean;
  isPublic?: boolean;
  issueMethod?: 'auto' | 'claim' | 'code' | 'manual';
  autoTrigger?: 'signup' | 'first_purchase' | 'birthday';
  stats?: { issuedCount: number; usedCount: number; totalDiscountAmount: number };
  createdAt?: string;
  // Creator info - 발급주체
  createdBy?: 'admin' | 'seller';
  creatorId?: string;
  // Alternative field names from API
  usage?: { totalLimit?: number; perUserLimit?: number; usedCount?: number };
  scopeType?: 'platform' | 'seller';
  sellerUuid?: string;
}

// Normalize coupon data from API response
const normalizeCoupon = (coupon: any): AdminCoupon => {
  // Handle createdBy - determines the issuer (platform admin or seller)
  const createdBy = coupon.createdBy || (coupon.scope?.type === 'seller' ? 'seller' : 'admin');

  // Handle scope - could be nested object or flat fields or derived from createdBy
  let scope = coupon.scope;
  if (!scope) {
    if (coupon.scopeType || coupon.sellerUuid) {
      scope = {
        type: coupon.scopeType || (coupon.sellerUuid ? 'seller' : 'platform'),
        sellerUuid: coupon.sellerUuid,
      };
    } else if (createdBy) {
      // Derive scope from createdBy
      scope = {
        type: createdBy === 'seller' ? 'seller' : 'platform',
        sellerUuid: coupon.creatorId,
      };
    }
  }

  // Handle limits - could be 'limits' or 'usage'
  let limits = coupon.limits;
  if (!limits && coupon.usage) {
    limits = {
      totalCount: coupon.usage.totalLimit || 0,
      issuedCount: coupon.usage.usedCount || 0,
      perUserLimit: coupon.usage.perUserLimit || 1,
    };
  }

  // Handle stats - field name variations
  let stats = coupon.stats;
  if (stats) {
    stats = {
      issuedCount: stats.issuedCount || limits?.issuedCount || 0,
      usedCount: stats.usedCount || 0,
      totalDiscountAmount: stats.totalDiscountAmount || stats.totalDiscount || 0,
    };
  }

  return {
    ...coupon,
    id: coupon.id || coupon.couponUuid || coupon._id,
    createdBy,
    scope,
    limits,
    stats,
  };
};

interface CouponOverviewStats {
  totalCoupons: number;
  activeCoupons: number;
  publicCoupons: number;
  inactiveCoupons: number;
  totalUsages: number;
  totalDiscountAmount: number;
  uniqueUsers: number;
  totalDownloads: number;
  conversionRate: number;
}

type StatusFilter = 'all' | 'active' | 'inactive';
type ScopeFilter = 'all' | 'platform' | 'seller';

// Generate random coupon code
const generateCouponCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

interface CreateCouponFormData {
  name: string;
  description: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue: number;
  maxDiscountAmount?: number;
  minimumOrderAmount: number;
  scope: { type: 'platform' | 'seller'; sellerUuid?: string };
  appliesTo: 'product' | 'quote' | 'both';
  validity: { startDate: string; endDate: string };
  limits: { totalCount: number; perUserLimit: number };
  isPublic: boolean;
  issueMethod: 'auto' | 'claim' | 'code' | 'manual';
  autoTrigger?: 'signup' | 'first_purchase' | 'birthday';
}

const initialFormData: CreateCouponFormData = {
  name: '',
  description: '',
  code: generateCouponCode(),
  discountType: 'percentage',
  discountValue: 10,
  maxDiscountAmount: undefined,
  minimumOrderAmount: 0,
  scope: { type: 'platform' },
  appliesTo: 'both',
  validity: {
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  limits: { totalCount: 100, perUserLimit: 1 },
  isPublic: true,
  issueMethod: 'code',
};

const AdminCouponManagement: React.FC = () => {
  const { alert, confirm } = useAlert();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
  const [formData, setFormData] = useState<CreateCouponFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState<CouponOverviewStats | null>(null);
  const [showStats, setShowStats] = useState(true);

  // Load coupons
  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await webApiService.admin.getCoupons({
        page: pagination.currentPage,
        limit: 20,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        scopeType: scopeFilter !== 'all' ? scopeFilter : undefined,
      });

      if (response.data) {
        const normalizedCoupons = (response.data.coupons || []).map(normalizeCoupon);
        setCoupons(normalizedCoupons);
        if (response.data.pagination) {
          setPagination({
            currentPage: response.data.pagination.currentPage,
            totalPages: response.data.pagination.totalPages,
            totalItems: response.data.pagination.totalItems,
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to load coupons:', err);
      setError(err.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await webApiService.admin.getCouponStats();
      if (response.data?.overview) {
        setStats(response.data.overview);
      }
    } catch (err: any) {
      console.error('Failed to load coupon stats:', err);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [pagination.currentPage, statusFilter, scopeFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  // Create/Update coupon
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      await alert('쿠폰명을 입력해주세요.');
      return;
    }

    if (!formData.code?.trim()) {
      await alert('쿠폰 코드를 입력해주세요.');
      return;
    }

    if (formData.discountType !== 'free_shipping' && formData.discountValue <= 0) {
      await alert('할인 값을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
      };

      if (editingCoupon) {
        await webApiService.admin.updateCoupon(editingCoupon.id, payload);
        await alert('쿠폰이 수정되었습니다.');
      } else {
        await webApiService.admin.createCoupon(payload);
        await alert('쿠폰이 생성되었습니다.');
      }

      setShowModal(false);
      setEditingCoupon(null);
      setFormData({ ...initialFormData, code: generateCouponCode() });
      loadCoupons();
      loadStats();
    } catch (err: any) {
      console.error('Failed to save coupon:', err);
      await alert('쿠폰 저장에 실패했습니다: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setSaving(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (coupon: AdminCoupon) => {
    const action = coupon.isActive ? '비활성화' : '활성화';
    const confirmed = await confirm(`이 쿠폰을 ${action}하시겠습니까?`);
    if (!confirmed) return;

    try {
      await webApiService.admin.updateCoupon(coupon.id, { isActive: !coupon.isActive });
      await alert(`쿠폰이 ${action}되었습니다.`);
      loadCoupons();
      loadStats();
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      await alert('상태 변경에 실패했습니다.');
    }
  };

  // Delete coupon
  const handleDelete = async (coupon: AdminCoupon) => {
    const confirmed = await confirm('이 쿠폰을 삭제(비활성화)하시겠습니까?');
    if (!confirmed) return;

    try {
      await webApiService.admin.deleteCoupon(coupon.id);
      await alert('쿠폰이 삭제되었습니다.');
      loadCoupons();
      loadStats();
    } catch (err: any) {
      console.error('Failed to delete coupon:', err);
      await alert('쿠폰 삭제에 실패했습니다.');
    }
  };

  // Edit modal
  const handleEdit = (coupon: AdminCoupon) => {
    setEditingCoupon(coupon);
    const defaultValidity = {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setFormData({
      name: coupon.name,
      description: coupon.description || '',
      code: coupon.code,
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || 0,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minimumOrderAmount: coupon.minimumOrderAmount || 0,
      scope: coupon.scope || { type: 'platform' },
      appliesTo: coupon.appliesTo || 'both',
      validity: coupon.validity ? {
        startDate: coupon.validity.startDate.split('T')[0],
        endDate: coupon.validity.endDate.split('T')[0],
      } : defaultValidity,
      limits: {
        totalCount: coupon.limits?.totalCount || 100,
        perUserLimit: coupon.limits?.perUserLimit || 1,
      },
      isPublic: coupon.isPublic ?? true,
      issueMethod: coupon.issueMethod || 'code',
      autoTrigger: coupon.autoTrigger,
    });
    setShowModal(true);
  };

  // Create modal
  const handleCreate = () => {
    setEditingCoupon(null);
    setFormData({ ...initialFormData, code: generateCouponCode() });
    setShowModal(true);
  };

  // Format helpers
  const formatDiscount = (coupon: AdminCoupon) => {
    switch (coupon.discountType) {
      case 'percentage':
        return `${coupon.discountValue || 0}%`;
      case 'fixed_amount':
        return `${(coupon.discountValue || 0).toLocaleString()}원`;
      case 'free_shipping':
        return '무료배송';
      default:
        return '-';
    }
  };

  const getStatusBadge = (coupon: AdminCoupon) => {
    if (coupon.validity) {
      const now = new Date();
      const endDate = new Date(coupon.validity.endDate);
      if (endDate < now) {
        return <span className="px-2 py-1 text-xs rounded-full bg-surface text-gray-600">만료됨</span>;
      }
    }
    if (!coupon.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">비활성</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">활성</span>;
  };

  const getCreatorBadge = (createdBy?: 'admin' | 'seller', scope?: { type: string }) => {
    // Use createdBy first, fallback to scope.type
    const issuerType = createdBy || scope?.type;
    if (!issuerType) {
      return <span className="px-2 py-1 text-xs rounded-full bg-surface text-gray-600">-</span>;
    }
    if (issuerType === 'admin' || issuerType === 'platform') {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">플랫폼</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">판매자</span>;
  };

  const getIssueMethodLabel = (method?: string) => {
    switch (method) {
      case 'auto':
        return '자동발급';
      case 'claim':
        return '수령형';
      case 'code':
        return '코드입력';
      case 'manual':
        return '수동발급';
      default:
        return '-';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-line p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">쿠폰 관리</h1>
            <p className="text-gray-600 mt-1">
              플랫폼 및 판매자 쿠폰을 관리합니다. 총{' '}
              <span className="font-semibold text-blue-600">{pagination.totalItems}개</span>
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-brand text-white px-4 py-2.5 rounded-full hover:bg-brand-600 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 쿠폰 만들기
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {showStats && stats && (
        <div className="bg-white rounded-xl shadow-sm border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">통계 개요</h2>
            <button
              onClick={() => setShowStats(false)}
              className="text-muted hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">{stats.totalCoupons}</div>
              <div className="text-sm text-blue-600">전체 쿠폰</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">{stats.activeCoupons}</div>
              <div className="text-sm text-green-600">활성 쿠폰</div>
            </div>
            <div className="bg-brand-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-brand-700">{stats.totalDownloads}</div>
              <div className="text-sm text-brand-600">총 발급수</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-700">{stats.totalUsages}</div>
              <div className="text-sm text-orange-600">총 사용수</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700">
                {stats.totalDiscountAmount.toLocaleString()}원
              </div>
              <div className="text-sm text-red-600">총 할인금액</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-line p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">검색 및 필터</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <input
              type="text"
              placeholder="쿠폰명 또는 코드 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadCoupons()}
              className="w-full px-4 py-2.5 border border-line-strong rounded-lg focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-line-strong rounded-lg focus:border-brand focus:ring-1 focus:ring-brand bg-white"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">발급주체</label>
            <select
              value={scopeFilter}
              onChange={(e) => {
                setScopeFilter(e.target.value as ScopeFilter);
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-line-strong rounded-lg focus:border-brand focus:ring-1 focus:ring-brand bg-white"
            >
              <option value="all">전체</option>
              <option value="platform">플랫폼</option>
              <option value="seller">판매자</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
                loadCoupons();
              }}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-brand text-white rounded-full hover:bg-brand-600 disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? '검색 중...' : '검색'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-xl shadow-sm border border-line overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">쿠폰이 없습니다</h3>
            <p className="text-gray-600 mb-4">새 쿠폰을 만들어 고객에게 할인 혜택을 제공하세요</p>
            <button
              onClick={handleCreate}
              className="bg-brand text-white px-6 py-2.5 rounded-full hover:bg-brand-600 transition-colors font-medium"
            >
              첫 쿠폰 만들기
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-line">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">쿠폰명 / 코드</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">할인</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">발급주체</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">유효기간</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">발급/사용</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">상태</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{coupon.name}</div>
                        <div className="text-sm text-muted font-mono">{coupon.code}</div>
                        {coupon.issueMethod && (
                          <div className="text-xs text-muted mt-1">
                            {getIssueMethodLabel(coupon.issueMethod)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-blue-600">{formatDiscount(coupon)}</div>
                      {coupon.maxDiscountAmount && (
                        <div className="text-xs text-muted">최대 {coupon.maxDiscountAmount.toLocaleString()}원</div>
                      )}
                    </td>
                    <td className="px-6 py-4">{getCreatorBadge(coupon.createdBy, coupon.scope)}</td>
                    <td className="px-6 py-4">
                      {coupon.validity ? (
                        <>
                          <div className="text-sm text-gray-900">
                            {new Date(coupon.validity.startDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted">
                            ~ {new Date(coupon.validity.endDate).toLocaleDateString()}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-muted">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted w-8">발급</span>
                          <span className="font-medium text-blue-600">{coupon.limits?.issuedCount || coupon.stats?.issuedCount || 0}</span>
                          <span className="text-muted">/</span>
                          <span className="text-gray-600">{coupon.limits?.totalCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted w-8">사용</span>
                          <span className="font-medium text-green-600">{coupon.stats?.usedCount || 0}</span>
                        </div>
                      </div>
                      <div className="w-24 h-1.5 bg-surface-strong rounded-full mt-2">
                        <div
                          className="h-full bg-brand rounded-full"
                          style={{
                            width: `${coupon.limits?.totalCount ? Math.min(((coupon.limits?.issuedCount || 0) / coupon.limits.totalCount) * 100, 100) : 0}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(coupon)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(coupon)}
                          className="p-2 text-muted hover:text-gray-700 hover:bg-surface-strong rounded-lg transition-colors"
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
                          className="p-2 text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-line flex items-center justify-between">
            <div className="text-sm text-gray-600">
              총 {pagination.totalItems}개 중 {(pagination.currentPage - 1) * 20 + 1}-
              {Math.min(pagination.currentPage * 20, pagination.totalItems)}개
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-line rounded-lg disabled:opacity-50 hover:bg-surface"
              >
                이전
              </button>
              <span className="px-3 py-1 text-gray-700">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-line rounded-lg disabled:opacity-50 hover:bg-surface"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-white border-b border-line px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCoupon ? '쿠폰 수정' : '새 쿠폰 만들기'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-surface-strong rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
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
                    className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                    placeholder="예: 신규회원 10% 할인"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    쿠폰 코드 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="flex-1 border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand font-mono uppercase"
                      placeholder="WELCOME10"
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, code: generateCouponCode() })}
                      className="px-4 py-2.5 border border-line rounded-lg text-gray-700 hover:bg-surface transition-colors whitespace-nowrap"
                    >
                      자동 생성
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand h-20 resize-none"
                    placeholder="쿠폰에 대한 설명"
                  />
                </div>
              </div>

              {/* Issue Method (Admin only) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">발급 방식</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'auto', label: '자동발급', desc: '특정 조건 시 자동' },
                    { value: 'claim', label: '수령형', desc: '고객이 직접 수령' },
                    { value: 'code', label: '코드입력', desc: '코드 입력 시 등록' },
                    { value: 'manual', label: '수동발급', desc: '관리자가 직접 발급' },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, issueMethod: method.value as any })}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        formData.issueMethod === method.value
                          ? 'border-brand bg-brand-50'
                          : 'border-line hover:border-line'
                      }`}
                    >
                      <div className="font-medium text-sm">{method.label}</div>
                      <div className="text-xs text-muted">{method.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Auto Trigger (when issueMethod is auto) */}
                {formData.issueMethod === 'auto' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">자동발급 트리거</label>
                    <div className="flex gap-4">
                      {[
                        { value: 'signup', label: '회원가입' },
                        { value: 'first_purchase', label: '첫 구매' },
                        { value: 'birthday', label: '생일' },
                      ].map((trigger) => (
                        <label key={trigger.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="autoTrigger"
                            value={trigger.value}
                            checked={formData.autoTrigger === trigger.value}
                            onChange={(e) => setFormData({ ...formData, autoTrigger: e.target.value as any })}
                            className="w-4 h-4 text-brand focus:ring-brand"
                          />
                          <span className="text-sm text-gray-700">{trigger.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Discount Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">할인 설정</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">할인 유형</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                      className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">최대 할인 금액 (원)</label>
                      <input
                        type="number"
                        value={formData.maxDiscountAmount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined })
                        }
                        className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
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
                        setFormData({ ...formData, minimumOrderAmount: e.target.value ? Number(e.target.value) : 0 })
                      }
                      className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                      placeholder="제한 없음"
                    />
                  </div>
                </div>
              </div>

              {/* Scope & Target */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">적용 범위</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scopeType"
                      checked={formData.scope.type === 'platform'}
                      onChange={() => setFormData({ ...formData, scope: { type: 'platform' } })}
                      className="w-4 h-4 text-brand focus:ring-brand"
                    />
                    <span className="text-sm text-gray-700">플랫폼 전체</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scopeType"
                      checked={formData.scope.type === 'seller'}
                      onChange={() => setFormData({ ...formData, scope: { type: 'seller', sellerUuid: '' } })}
                      className="w-4 h-4 text-brand focus:ring-brand"
                    />
                    <span className="text-sm text-gray-700">특정 판매자</span>
                  </label>
                </div>

                <h4 className="text-sm font-medium text-gray-700">적용 대상</h4>
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
                        onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value as any })}
                        className="w-4 h-4 text-brand focus:ring-brand"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Validity */}
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
                      className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
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
                      className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">발급 제한</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">총 발급 수량</label>
                    <input
                      type="number"
                      value={formData.limits.totalCount}
                      onChange={(e) =>
                        setFormData({ ...formData, limits: { ...formData.limits, totalCount: Number(e.target.value) } })
                      }
                      className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1인당 사용 제한</label>
                    <input
                      type="number"
                      value={formData.limits.perUserLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, limits: { ...formData.limits, perUserLimit: Number(e.target.value) } })
                      }
                      className="w-full border border-line-strong rounded-lg px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand"
                      min={1}
                    />
                  </div>
                </div>
              </div>

              {/* Public Setting */}
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
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
                  <div className="w-11 h-6 bg-surface-strong peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line-strong after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-line px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 border border-line rounded-lg text-gray-700 hover:bg-surface transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 bg-brand text-white rounded-full hover:bg-brand-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    </div>
  );
};

export default AdminCouponManagement;
