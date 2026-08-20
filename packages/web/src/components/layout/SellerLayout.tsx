import { useState } from 'react';
import { MdDashboard, MdInventory, MdFactory, MdInsertChart, MdStorefront, MdAssignmentReturn } from 'react-icons/md';
import { FaClipboardList, FaMoneyBillWave, FaHome, FaSignOutAlt } from 'react-icons/fa';
import { IoMdStar } from 'react-icons/io';
import { RiCoupon2Line } from 'react-icons/ri';
import { useAuth } from '../../hooks/useAuth';

interface SellerLayoutProps {
  children: React.ReactNode;
  title?: string;
  /** 일부 화면이 넘기지만 현재 레이아웃에서는 사용하지 않는다 (레거시 prop) */
  currentPage?: string;
  onGo: (to: string) => void;
}

export function SellerLayout({ children, title, onGo }: SellerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  const menuItems = [
    {
      label: "대시보드",
      icon: MdDashboard,
      path: "/seller",
      description: "매출 현황 및 통계"
    },
    {
      label: "브랜드 관리",
      icon: MdStorefront,
      path: "/seller/brand",
      description: "브랜드 정보 편집"
    },
    {
      label: "상품 관리",
      icon: MdInventory,
      path: "/seller/products",
      description: "상품 등록 및 수정"
    },
    {
      label: "쿠폰 관리",
      icon: RiCoupon2Line,
      path: "/seller/coupons",
      description: "쿠폰 발행 및 관리"
    },
    {
      label: "주문 관리",
      icon: FaClipboardList,
      path: "/seller/orders",
      description: "주문 처리 및 배송"
    },
    {
      label: "반품·교환",
      icon: MdAssignmentReturn,
      path: "/seller/returns",
      description: "반품·교환 신청 처리"
    },
    {
      label: "생산 관리",
      icon: MdFactory,
      path: "/seller/production",
      description: "생산량 설정 및 관리"
    },
    {
      label: "리뷰 관리",
      icon: IoMdStar,
      path: "/seller/reviews",
      description: "고객 리뷰 관리"
    },
    {
      label: "매출 분석",
      icon: MdInsertChart,
      path: "/seller/analytics",
      description: "매출 데이터 분석"
    },
    {
      label: "정산 관리",
      icon: FaMoneyBillWave,
      path: "/seller/settlement",
      description: "정산 내역 및 계좌"
    }
  ];

  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 오버레이 (모바일) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* 로고 및 헤더 */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onGo("/");
                }}
                className="block hover:opacity-80 transition-opacity"
              >
                <img
                  src="https://handy-images-stage.s3.ap-northeast-2.amazonaws.com/logo/logo-black.png"
                  alt="Handy"
                  className="h-8 w-auto"
                />
              </a>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 메뉴 항목 */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onGo(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left transition-all duration-200
                    ${currentPath === item.path
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <IconComponent className="text-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* 하단 액션 */}
          <div className="px-3 py-3 border-t border-gray-200 space-y-1.5">
            <button
              onClick={() => onGo("/")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              <FaHome className="text-lg" />
              <span className="font-medium">메인 사이트로</span>
            </button>

            <button
              onClick={async () => {
                try {
                  await logout();
                  onGo('/');
                } catch (error) {
                  console.error('[SellerLayout] 로그아웃 실패:', error);
                  onGo('/');
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm"
            >
              <FaSignOutAlt className="text-lg" />
              <span className="font-medium">로그아웃</span>
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 상단 툴바 */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* 모바일에서 보이는 로고 */}
            <button
              onClick={() => onGo("/")}
              className="lg:hidden hover:opacity-80 transition-opacity"
            >
              <img
                src="https://handy-images-stage.s3.ap-northeast-2.amazonaws.com/logo/logo-black.png"
                alt="Handy"
                className="h-7 w-auto"
              />
            </button>

            {/* 페이지 제목 */}
            {title && (
              <div className="hidden lg:block">
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              </div>
            )}
          </div>

          {/* 우측 액션 */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center" title={currentUser?.name || '판매자'}>
              <span className="text-white font-medium text-sm">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
              </span>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
