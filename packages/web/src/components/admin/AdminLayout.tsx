import React, { useState, useEffect } from 'react';
import { authService } from '../../services/apiService';
import { useMiniRouter } from '../../utils';
import type { User } from '@handy-platform/shared';
import { MdDashboard, MdInventory, MdStore, MdAssignment, MdViewCarousel, MdCameraAlt, MdPalette } from 'react-icons/md';
import { FaUsers, FaClipboardList, FaHome, FaSignOutAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { FiGrid } from 'react-icons/fi';
import { RiCoupon2Line } from 'react-icons/ri';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  authLoading?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentUser, authLoading = false }) => {
  const [internalLoading, setInternalLoading] = useState(true);
  const { path, nav } = useMiniRouter();

  useEffect(() => {
    // authLoading이 false가 되면 (App에서 인증 초기화 완료) 내부 로딩도 완료
    if (!authLoading) {
      // 추가적인 안전 장치: 짧은 딜레이 후 로딩 완료
      const timer = setTimeout(() => {
        setInternalLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, currentUser]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      nav('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      nav('/login');
    }
  };

  // 로딩 중이거나 인증 상태가 아직 확정되지 않은 경우
  if (authLoading || internalLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 센터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증 확인: currentUser가 있고 admin 역할인지 확인
  if (!currentUser) {
    console.log('AdminLayout: No user found, redirecting to login');
    nav('/login');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <div className="animate-pulse text-blue-600">로그인 페이지로 이동 중...</div>
        </div>
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
    nav('/');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">관리자 권한이 필요합니다.</p>
          <div className="animate-pulse text-blue-600">홈페이지로 이동 중...</div>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      name: '대시보드',
      href: '/admin',
      icon: MdDashboard
    },
    {
      name: '사용자 관리',
      href: '/admin/users',
      icon: FaUsers
    },
    {
      name: '판매자 관리',
      href: '/admin/sellers',
      icon: MdStore
    },
    {
      name: '판매자 신청',
      href: '/admin/seller-applications',
      icon: MdAssignment
    },
    {
      name: '주문 관리',
      href: '/admin/orders',
      icon: FaClipboardList
    },
    {
      name: '상품 관리',
      href: '/admin/products',
      icon: MdInventory
    },
    {
      name: '카테고리 관리',
      href: '/admin/categories',
      icon: FiGrid
    },
    {
      name: '쿠폰 관리',
      href: '/admin/coupons',
      icon: RiCoupon2Line
    },
    {
      name: '배너 관리',
      href: '/admin/banners',
      icon: MdViewCarousel
    },
    {
      name: '스냅 관리',
      href: '/admin/snaps',
      icon: MdCameraAlt
    },
    {
      name: '디자인 툴 구독',
      href: '/admin/design-tool',
      icon: MdPalette
    },
    {
      name: '데코레이션 관리',
      href: '/admin/decorations',
      icon: MdPalette
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700 border-b">
          <h1 className="text-xl font-bold text-white">관리자 센터</h1>
          <button
            onClick={() => {
              nav('/');
              // 페이지 새로고침을 통해 확실한 화면 업데이트 보장
              window.location.href = '/';
            }}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-white/20 border border-white/30 rounded-lg hover:bg-white/30 transition-colors group"
            title="홈으로 돌아가기"
          >
            <FaHome className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
            홈으로
          </button>
        </div>

        <nav className="mt-4 px-3">
          {navigation.map((item) => {
            const isActive = path === item.href ||
              (item.href !== '/admin' && path.startsWith(item.href));
            const IconComponent = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => nav(item.href)}
                className={`w-full flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <IconComponent className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {item.name}
              </button>
            );
          })}

          {/* 구분선 */}
          <div className="my-4 px-4">
            <div className="border-t border-gray-200"></div>
          </div>

          {/* 홈으로 돌아가기 버튼 */}
          <button
            onClick={() => {
              nav('/');
              // 페이지 새로고침을 통해 확실한 화면 업데이트 보장
              window.location.href = '/';
            }}
            className="w-full flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-all duration-200 group text-gray-600 hover:bg-green-50 hover:text-green-700 border border-transparent hover:border-green-200"
          >
            <FaHome className="w-5 h-5 mr-3 transition-colors text-gray-400 group-hover:text-green-600" />
            쇼핑몰로 돌아가기
            <FaExternalLinkAlt className="w-4 h-4 ml-auto text-gray-400 group-hover:text-green-600 transition-colors" />
          </button>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-semibold">
                  {currentUser.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {currentUser.name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUser.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
              title="로그아웃"
            >
              <FaSignOutAlt className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
