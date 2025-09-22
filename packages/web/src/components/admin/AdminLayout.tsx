import React, { useState, useEffect } from 'react';
import { authService } from '../../services/apiService';
import { useMiniRouter } from '../../utils';
import type { User } from '@handy-platform/shared';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentUser }) => {
  const [loading, setLoading] = useState(true);
  const { path, nav } = useMiniRouter();

  useEffect(() => {
    // currentUser가 전달되면 즉시 확인
    if (currentUser !== null) {
      setLoading(false);
    } else {
      // currentUser가 null이면 잠시 기다려보기 (로딩 중일 수 있음)
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      nav('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      nav('/login');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 인증 확인: currentUser가 있고 admin 역할인지 확인
  if (!currentUser) {
    nav('/login');
    return null;
  }

  if (currentUser.role !== 'admin') {
    nav('/');
    return null;
  }

  const navigation = [
    { 
      name: '대시보드', 
      href: '/admin', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      name: '사용자 관리', 
      href: '/admin/users', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      )
    },
    { 
      name: '판매자 관리', 
      href: '/admin/sellers', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      name: '주문 관리', 
      href: '/admin/orders', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      name: '상품 관리', 
      href: '/admin/products', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
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
            <svg className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            홈으로
          </button>
        </div>
        
        <nav className="mt-4 px-3">
          {navigation.map((item) => {
            const isActive = path === item.href || 
              (item.href !== '/admin' && path.startsWith(item.href));
            
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
                <span className={`mr-3 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {item.icon}
                </span>
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
            <span className="mr-3 transition-colors text-gray-400 group-hover:text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
            쇼핑몰로 돌아가기
            <svg className="w-4 h-4 ml-auto text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;