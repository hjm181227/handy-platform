import React, { useState, useEffect } from 'react';
import { AdminUser, AdminUsersResponse, UserRoleUpdateRequest } from '@handy-platform/shared';
import type {
  DesignToolPlanId,
  DesignToolPaymentRecord,
  SubscriptionState,
} from '@handy-platform/shared';
import { adminService, designToolService } from '../../services/apiService';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  });
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);
  const [showDesignToolModal, setShowDesignToolModal] = useState(false);
  const [designToolLoading, setDesignToolLoading] = useState(false);
  const [dtModalTab, setDtModalTab] = useState<'manage' | 'history'>('manage');
  const [dtPayments, setDtPayments] = useState<DesignToolPaymentRecord[]>([]);
  const [dtPaymentsLoading, setDtPaymentsLoading] = useState(false);
  const [dtSubscription, setDtSubscription] = useState<SubscriptionState | null>(null);

  // 통합된 adminService 사용 (토큰 관리 자동화)

  useEffect(() => {
    loadUsers();
  }, [pagination.currentPage, searchQuery, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.currentPage,
        limit: 30,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (roleFilter) {
        params.role = roleFilter;
      }
      if (statusFilter) {
        params.isActive = statusFilter === 'active';
      }

      const response: AdminUsersResponse = await adminService.getUsers(params);
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('사용자 목록 로딩에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: 'user' | 'admin' | 'seller') => {
    if (!selectedUser) return;

    try {
      setRoleChangeLoading(true);
      
      const roleChangeData: UserRoleUpdateRequest = {
        role: newRole,
      };

      // 판매자로 변경하는 경우 기본 정보 추가
      if (newRole === 'seller') {
        roleChangeData.sellerInfo = {
          brandName: `${selectedUser.name}'s Store`,
          contactEmail: selectedUser.email,
          contactPhone: selectedUser.phone || undefined,
        };
      }

      await adminService.updateUserRole(selectedUser.id, roleChangeData);
      
      // 성공 시 사용자 목록 새로고침
      await loadUsers();
      setShowRoleModal(false);
      setSelectedUser(null);
      alert(`${selectedUser.name}님의 권한이 ${getRoleDisplayName(newRole)}로 변경되었습니다.`);
      
    } catch (error) {
      console.error('Role change failed:', error);
      alert('권한 변경에 실패했습니다.');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const handleStatusToggle = async (user: AdminUser) => {
    try {
      await adminService.updateUserStatus(user.userUuid, !user.isActive);
      await loadUsers();
      alert(`${user.name}님의 계정이 ${!user.isActive ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('Status toggle failed:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const openDesignToolModal = async (user: AdminUser) => {
    setSelectedUser(user);
    setShowDesignToolModal(true);
    setDtModalTab('manage');
    setDtPayments([]);
    setDtSubscription(user.designToolAccess ?? null);
    try {
      const res = await designToolService.adminGetUserSubscription(user.userUuid);
      if (res.success && res.subscription) {
        setDtSubscription(res.subscription);
      }
    } catch (err) {
      console.error('Failed to fetch subscription detail:', err);
    }
  };

  const loadDtPayments = async () => {
    if (!selectedUser) return;
    setDtPaymentsLoading(true);
    try {
      const res = await designToolService.adminGetUserPayments(
        selectedUser.userUuid,
        { limit: 50 },
      );
      if (res.success && res.items) {
        setDtPayments(res.items);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setDtPaymentsLoading(false);
    }
  };

  const handleDtGrant = async (planId: DesignToolPlanId) => {
    if (!selectedUser) return;
    const reason = prompt('권한 부여 사유를 입력하세요:');
    if (!reason) return;
    try {
      setDesignToolLoading(true);
      const res = await designToolService.adminGrantUser(selectedUser.userUuid, {
        plan: planId,
        reason,
      });
      if (res.success && res.subscription) {
        setDtSubscription(res.subscription);
      }
      await loadUsers();
      alert(`${selectedUser.name}님에게 ${planId} 플랜 권한이 부여되었습니다.`);
    } catch (error) {
      console.error('Grant failed:', error);
      alert('권한 부여에 실패했습니다.');
    } finally {
      setDesignToolLoading(false);
    }
  };

  const handleDtCancel = async () => {
    if (!selectedUser) return;
    const reason = prompt('취소 사유를 입력하세요:') || undefined;
    if (!confirm(`${selectedUser.name}님의 구독을 강제 취소하시겠습니까?`)) return;
    try {
      setDesignToolLoading(true);
      const res = await designToolService.adminCancelUser(selectedUser.userUuid, {
        reason,
      });
      if (res.success && res.subscription) {
        setDtSubscription(res.subscription);
      }
      await loadUsers();
      alert('구독이 취소되었습니다.');
    } catch (error) {
      console.error('Cancel failed:', error);
      alert('구독 취소에 실패했습니다.');
    } finally {
      setDesignToolLoading(false);
    }
  };

  const handleDtRefund = async (paymentId?: string) => {
    if (!selectedUser) return;
    const reason = prompt('환불 사유를 입력하세요:');
    if (!reason) return;
    if (!confirm(`${selectedUser.name}님의 결제를 환불하시겠습니까?`)) return;
    try {
      setDesignToolLoading(true);
      const res = await designToolService.adminRefundUser(selectedUser.userUuid, {
        reason,
        paymentId,
      });
      if (res.success && res.subscription) {
        setDtSubscription(res.subscription);
      }
      await loadDtPayments();
      await loadUsers();
      alert('환불이 처리되었습니다.');
    } catch (error) {
      console.error('Refund failed:', error);
      alert('환불에 실패했습니다.');
    } finally {
      setDesignToolLoading(false);
    }
  };

  const getDesignToolBadge = (user: AdminUser) => {
    const access = user.designToolAccess;
    if (!access || access.status === 'none') {
      return { label: '없음', color: 'bg-gray-100 text-gray-500' };
    }
    if (access.plan === 'pro' && access.status === 'active') {
      return { label: 'Pro', color: 'bg-pink-100 text-pink-700' };
    }
    if (access.plan === 'free' && access.status === 'active') {
      return { label: 'Free', color: 'bg-green-100 text-green-700' };
    }
    if (access.status === 'cancelled') {
      return { label: '취소됨', color: 'bg-yellow-100 text-yellow-700' };
    }
    if (access.status === 'expired') {
      return { label: '만료', color: 'bg-red-100 text-red-700' };
    }
    if (access.status === 'in_grace_period') {
      return { label: 'Grace', color: 'bg-amber-100 text-amber-700' };
    }
    if (access.status === 'on_hold') {
      return { label: 'On Hold', color: 'bg-red-100 text-red-700' };
    }
    if (access.status === 'paused') {
      return { label: 'Paused', color: 'bg-blue-100 text-blue-700' };
    }
    return { label: access.plan, color: 'bg-gray-100 text-gray-600' };
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'seller': return '판매자';
      case 'user': return '일반 사용자';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'seller': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
            <p className="text-gray-600 mt-1">전체 사용자 <span className="font-semibold text-blue-600">{pagination.totalUsers}명</span></p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>실시간 업데이트</span>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">검색 및 필터</h3>
          <p className="text-sm text-gray-600">사용자를 검색하고 필터링하세요</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <div className="relative">
              <input
                type="text"
                placeholder="이름 또는 이메일 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">권한</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            >
              <option value="">모든 권한</option>
              <option value="user">일반 사용자</option>
              <option value="seller">판매자</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            >
              <option value="">모든 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{loading ? '검색 중...' : '검색'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">사용자 목록</h3>
          <p className="text-sm text-gray-600">총 {users.length}명의 사용자가 표시되고 있습니다</p>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-gray-600 font-medium">사용자 목록을 불러오는 중...</p>
            <p className="text-sm text-gray-500 mt-1">잠시만 기다려주세요</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">검색 결과가 없습니다</p>
            <p className="text-sm text-gray-500 mt-1">다른 검색어나 필터를 시도해보세요</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    권한
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    디자인 툴
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.userUuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
                            <span className="text-white font-semibold text-sm">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-gray-400 flex items-center mt-1">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const badge = getDesignToolBadge(user);
                        return (
                          <button
                            onClick={() => openDesignToolModal(user)}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badge.color} hover:opacity-80 transition-opacity cursor-pointer`}
                          >
                            {badge.label}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRoleModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          권한 변경
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user)}
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            user.isActive
                              ? 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300'
                              : 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300'
                          }`}
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {user.isActive ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                          {user.isActive ? '비활성화' : '활성화'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              {/* 정보 표시 */}
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  총 <span className="font-semibold text-gray-900">{pagination.totalUsers}</span>명 중{' '}
                  <span className="font-semibold text-blue-600">{(pagination.currentPage - 1) * 30 + 1}</span>-
                  <span className="font-semibold text-blue-600">{Math.min(pagination.currentPage * 30, pagination.totalUsers)}</span>명 표시
                </div>
                <div className="text-sm text-gray-500">
                  페이지당 30명
                </div>
              </div>

              {/* 페이지네이션 컨트롤 */}
              <div className="flex items-center space-x-2">
                {/* 처음으로 */}
                <button
                  disabled={pagination.currentPage <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: 1 }))}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="첫 페이지"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M21 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* 이전 */}
                <button
                  disabled={pagination.currentPage <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  이전
                </button>

                {/* 페이지 번호들 */}
                <div className="flex items-center space-x-1">
                  {(() => {
                    const current = pagination.currentPage;
                    const total = pagination.totalPages;
                    const pages = [];
                    
                    // 페이지 번호 계산 로직
                    let start = Math.max(1, current - 2);
                    let end = Math.min(total, current + 2);
                    
                    // 시작 부분 조정
                    if (end - start < 4 && total > 5) {
                      if (start === 1) {
                        end = Math.min(total, 5);
                      } else if (end === total) {
                        start = Math.max(1, total - 4);
                      }
                    }
                    
                    // 첫 페이지 표시
                    if (start > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: 1 }))}
                          className="inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        >
                          1
                        </button>
                      );
                      
                      if (start > 2) {
                        pages.push(
                          <span key="ellipsis1" className="inline-flex items-center justify-center w-10 h-10 text-sm text-gray-400">
                            ...
                          </span>
                        );
                      }
                    }
                    
                    // 중간 페이지들
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: i }))}
                          className={`inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                            i === current
                              ? 'bg-blue-600 text-white border border-blue-600'
                              : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    // 마지막 페이지 표시
                    if (end < total) {
                      if (end < total - 1) {
                        pages.push(
                          <span key="ellipsis2" className="inline-flex items-center justify-center w-10 h-10 text-sm text-gray-400">
                            ...
                          </span>
                        );
                      }
                      
                      pages.push(
                        <button
                          key={total}
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: total }))}
                          className="inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        >
                          {total}
                        </button>
                      );
                    }
                    
                    return pages;
                  })()}
                </div>

                {/* 다음 */}
                <button
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* 마지막으로 */}
                <button
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: pagination.totalPages }))}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="마지막 페이지"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M3 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 권한 변경 모달 */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
            {/* 모달 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">권한 변경</h3>
                  <p className="text-sm text-gray-600">{selectedUser.name}님의 권한을 변경합니다</p>
                </div>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-white/50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 모달 콘텐츠 */}
            <div className="px-6 py-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">현재 권한</p>
                <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium">
                  {getRoleDisplayName(selectedUser.role)}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-900 mb-3">새로운 권한 선택</p>
                {['user', 'seller', 'admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role as 'user' | 'seller' | 'admin')}
                    disabled={roleChangeLoading || selectedUser.role === role}
                    className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-all duration-200 group ${
                      selectedUser.role === role
                        ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          role === 'admin' ? 'bg-red-100 text-red-600' :
                          role === 'seller' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {role === 'admin' ? '👑' : role === 'seller' ? '🏪' : '👤'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{getRoleDisplayName(role as any)}</p>
                          <p className="text-xs text-gray-500">
                            {role === 'admin' ? '모든 관리 권한' : 
                             role === 'seller' ? '상품 판매 권한' : 
                             '일반 사용자 권한'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedUser.role === role && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            현재
                          </span>
                        )}
                        {roleChangeLoading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                disabled={roleChangeLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 디자인 툴 관리 모달 */}
      {showDesignToolModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">디자인 툴 관리</h3>
                  <p className="text-sm text-gray-600">{selectedUser.name}님의 디자인 툴 플랜</p>
                </div>
                <button
                  onClick={() => {
                    setShowDesignToolModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-white/50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 탭 */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setDtModalTab('manage')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  dtModalTab === 'manage'
                    ? 'text-pink-600 border-b-2 border-pink-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                구독 관리
              </button>
              <button
                onClick={() => {
                  setDtModalTab('history');
                  if (dtPayments.length === 0) loadDtPayments();
                }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  dtModalTab === 'history'
                    ? 'text-pink-600 border-b-2 border-pink-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                결제 이력
              </button>
            </div>

            <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
              {dtModalTab === 'manage' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">현재 상태</p>
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium">
                      {getDesignToolBadge(selectedUser).label}
                    </div>
                    {dtSubscription?.paymentSource && (
                      <p className="text-xs text-gray-500 mt-2">
                        결제 소스: {dtSubscription.paymentSource.toUpperCase()}
                      </p>
                    )}
                    {dtSubscription?.expiresAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        만료일: {new Date(dtSubscription.expiresAt).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                    {dtSubscription?.nextRenewalAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        다음 결제일:{' '}
                        {new Date(dtSubscription.nextRenewalAt).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-gray-900 mb-3">권한 부여 (Grant)</p>
                    <p className="text-xs text-gray-500 mb-3">
                      지원 케이스용 — 결제 없이 플랜을 부여합니다. 감사 로그에 사유가 기록됩니다.
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleDtGrant('pro')}
                        disabled={designToolLoading}
                        className="w-full px-4 py-2 border border-pink-200 rounded-lg text-sm text-pink-700 hover:bg-pink-50 disabled:opacity-50"
                      >
                        Pro 플랜 부여
                      </button>
                      <button
                        onClick={() => handleDtGrant('free')}
                        disabled={designToolLoading}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Free 플랜 부여
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-900 mb-2">위험 액션</p>
                    <button
                      onClick={handleDtCancel}
                      disabled={
                        designToolLoading ||
                        !dtSubscription ||
                        dtSubscription.status === 'none' ||
                        dtSubscription.status === 'cancelled'
                      }
                      className="w-full px-4 py-2 border border-amber-200 rounded-lg text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                    >
                      강제 취소
                    </button>
                    <button
                      onClick={() => handleDtRefund()}
                      disabled={designToolLoading}
                      className="w-full px-4 py-2 border border-red-200 rounded-lg text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      최근 결제 환불
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                      특정 결제를 환불하려면 "결제 이력" 탭에서 개별 환불을 사용하세요.
                    </p>
                  </div>
                </div>
              )}

              {dtModalTab === 'history' && (
                <div>
                  {dtPaymentsLoading && (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500" />
                    </div>
                  )}
                  {!dtPaymentsLoading && dtPayments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      결제 이력이 없습니다.
                    </p>
                  )}
                  {!dtPaymentsLoading && dtPayments.length > 0 && (
                    <ul className="divide-y divide-gray-100">
                      {dtPayments.map((p) => (
                        <li key={p.id} className="py-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                ₩{p.amount.toLocaleString()}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  p.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : p.status === 'refunded'
                                    ? 'bg-gray-100 text-gray-600'
                                    : p.status === 'failed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {p.status}
                              </span>
                              <span className="text-xs text-gray-400">
                                {p.paymentSource}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(p.paidAt).toLocaleString('ko-KR')}
                            </p>
                            {p.refundedAt && (
                              <p className="text-xs text-gray-400">
                                환불: {new Date(p.refundedAt).toLocaleDateString('ko-KR')}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {p.receiptUrl && (
                              <a
                                href={p.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-pink-600 hover:underline"
                              >
                                영수증
                              </a>
                            )}
                            {p.status === 'completed' && !p.refundedAt && (
                              <button
                                onClick={() => handleDtRefund(p.id)}
                                disabled={designToolLoading}
                                className="text-xs text-red-600 hover:underline disabled:opacity-50"
                              >
                                환불
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end">
              <button
                onClick={() => {
                  setShowDesignToolModal(false);
                  setSelectedUser(null);
                  setDtPayments([]);
                  setDtSubscription(null);
                }}
                disabled={designToolLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;