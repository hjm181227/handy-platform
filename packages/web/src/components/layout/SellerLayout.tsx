import { useState } from 'react';

interface SellerLayoutProps {
  children: React.ReactNode;
  title?: string;
  onGo: (to: string) => void;
}

export function SellerLayout({ children, title, onGo }: SellerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      label: "대시보드",
      icon: "📊",
      path: "/seller",
      description: "매출 현황 및 통계"
    },
    {
      label: "상품 관리",
      icon: "📦",
      path: "/seller/products",
      description: "상품 등록 및 수정"
    },
    {
      label: "주문 관리",
      icon: "📋",
      path: "/seller/orders",
      description: "주문 처리 및 배송"
    },
    {
      label: "생산 관리",
      icon: "🏭",
      path: "/seller/production",
      description: "생산량 설정 및 관리"
    },
    {
      label: "리뷰 관리",
      icon: "⭐",
      path: "/seller/reviews",
      description: "고객 리뷰 관리"
    },
    {
      label: "매출 분석",
      icon: "📈",
      path: "/seller/analytics",
      description: "매출 데이터 분석"
    },
    {
      label: "정산 관리",
      icon: "💰",
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
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* 로고 및 헤더 */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
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
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  onGo(item.path);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                  ${currentPath === item.path 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            ))}
          </nav>

          {/* 하단 액션 */}
          <div className="px-4 py-4 border-t border-gray-200 space-y-2">
            <button
              onClick={() => onGo("/")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl">🏠</span>
              <span className="font-medium">메인 사이트로</span>
            </button>

            <button
              onClick={() => alert('로그아웃 기능은 추후 구현됩니다.')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="text-xl">🚪</span>
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
              className="lg:hidden text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              Handy
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
            <button
              onClick={() => alert('알림 기능은 추후 구현됩니다.')}
              className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zm-5-5h10l-5 5v-5z" />
              </svg>
              {/* 알림 뱃지 */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>

            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">S</span>
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
