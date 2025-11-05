import { useState, useRef, useEffect } from 'react';
import {
  FaSearch,
  FaTimes,
  FaCog,
  FaBell,
  FaArrowLeft,
  FaHome
} from 'react-icons/fa';
import { FiShoppingBag } from 'react-icons/fi';
import { IoPersonCircleOutline } from 'react-icons/io5';

interface MobilePageHeaderProps {
  // 스타일
  className?: string;

  // 왼쪽 영역
  title?: string;
  showBack?: boolean;
  showHome?: boolean;

  // 중앙 영역
  showSearchBar?: boolean; // 인라인 검색바

  // 오른쪽 영역
  showSearch?: boolean; // 검색 아이콘
  showCart?: boolean;
  showProfile?: boolean;
  showSettings?: boolean;
  showNotification?: boolean;

  // 데이터
  cartCount?: number;

  // 콜백
  onBack?: () => void;
  onHome?: () => void;
  onSearch?: () => void;
  onCart?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  onNotification?: () => void;
  onGo?: (path: string) => void;
}

export function MobilePageHeader({
  className,
  title,
  showBack,
  showHome,
  showSearchBar,
  showSearch,
  showCart,
  showProfile,
  showSettings,
  showNotification,
  cartCount = 0,
  onBack,
  onHome,
  onSearch,
  onCart,
  onProfile,
  onSettings,
  onNotification,
  onGo
}: MobilePageHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 외부 클릭으로 검색 제안 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = () => {
    if (searchQuery.trim() && onGo) {
      setShowSearchSuggestions(false);
      onGo(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const IconButton = ({
    icon: Icon,
    onClick,
    badge,
    ariaLabel
  }: {
    icon: any;
    onClick?: () => void;
    badge?: number;
    ariaLabel?: string;
  }) => (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors relative"
      aria-label={ariaLabel}
    >
      <Icon className="w-5 h-5 text-gray-700" />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );

  return (
    <header className={`handy-sticky-header border-b border-gray-200 ${className || ''}`}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* 왼쪽 영역 */}
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <IconButton
              icon={FaArrowLeft}
              onClick={onBack}
              ariaLabel="뒤로가기"
            />
          )}
          {showHome && (
            <IconButton
              icon={FaHome}
              onClick={onHome}
              ariaLabel="홈으로"
            />
          )}
          {title && !showSearchBar && (
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {title}
            </h1>
          )}
        </div>

        {/* 중앙 영역 - 검색바 */}
        {showSearchBar && (
          <div className="flex-1 mx-4 relative" ref={searchRef}>
            <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }}>
              <div className="relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(true)}
                  placeholder="검색어를 입력하세요"
                  className="w-full pl-4 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-700"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaSearch className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>

            {/* 검색 제안 (간단 버전) */}
            {showSearchSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-50 max-h-60 overflow-y-auto">
                <div className="p-3">
                  <span className="text-xs font-medium text-gray-500 mb-2 block">추천 검색어</span>
                  <div className="flex flex-wrap gap-2">
                    {['네일아트', '젤네일', '매니큐어', '핸드크림'].map((keyword, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(keyword);
                          setShowSearchSuggestions(false);
                          onGo?.(`/search?q=${encodeURIComponent(keyword)}`);
                        }}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-1">
          {showNotification && (
            <IconButton
              icon={FaBell}
              onClick={onNotification}
              ariaLabel="알림"
            />
          )}
          {showSearch && (
            <IconButton
              icon={FaSearch}
              onClick={onSearch}
              ariaLabel="검색"
            />
          )}
          {showSettings && (
            <IconButton
              icon={FaCog}
              onClick={onSettings}
              ariaLabel="설정"
            />
          )}
          {showProfile && (
            <IconButton
              icon={IoPersonCircleOutline}
              onClick={onProfile}
              ariaLabel="프로필"
            />
          )}
          {showCart && (
            <IconButton
              icon={FiShoppingBag}
              onClick={onCart}
              badge={cartCount}
              ariaLabel="장바구니"
            />
          )}
        </div>
      </div>
    </header>
  );
}