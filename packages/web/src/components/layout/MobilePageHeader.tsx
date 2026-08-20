import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Settings, Bell, ArrowLeft, Home, ShoppingBag, UserCircle, MessageCircle } from 'lucide-react';

interface MobilePageHeaderProps {
  // 스타일
  className?: string;

  // 왼쪽 영역
  title?: string;
  showBack?: boolean;
  showHome?: boolean;

  // 중앙 영역
  showSearchBar?: boolean; // 인라인 검색바 (항상 표시)
  searchPlaceholder?: string; // 검색바 placeholder

  // 오른쪽 영역
  showSearch?: boolean; // 검색 아이콘 (클릭 시 인라인 검색바 토글)
  showCart?: boolean;
  showProfile?: boolean;
  showSettings?: boolean;
  showNotification?: boolean;
  showChat?: boolean;

  // 데이터
  cartCount?: number;
  notificationCount?: number;

  // 콜백
  onBack?: () => void;
  onHome?: () => void;
  onSearch?: () => void;
  onCart?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  onNotification?: () => void;
  onChat?: () => void;
  onGo?: (path: string) => void;
}

export function MobilePageHeader({
  className,
  title,
  showBack,
  showHome,
  showSearchBar,
  searchPlaceholder,
  showSearch,
  showCart,
  showProfile,
  showSettings,
  showNotification,
  showChat,
  cartCount = 0,
  notificationCount = 0,
  onBack,
  onHome,
  onSearch,
  onCart,
  onProfile,
  onSettings,
  onNotification,
  onChat,
  onGo
}: MobilePageHeaderProps) {
  const { t } = useTranslation(['nav', 'common', 'product']);
  const resolvedPlaceholder = searchPlaceholder || t('common:searchPlaceholder');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 검색 모드 활성화 시 포커스
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

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

  const handleSearchToggle = () => {
    setIsSearchActive(true);
  };

  const handleSearchClose = () => {
    setIsSearchActive(false);
    setSearchQuery('');
    setShowSearchSuggestions(false);
  };

  // title prop 변경 시 검색 상태 초기화 (페이지 이동 대응)
  useEffect(() => {
    handleSearchClose();
  }, [title]);

  const isSearchBarVisible = showSearchBar || isSearchActive;

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
      <Icon size={20} className="text-gray-700" />
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
          {isSearchActive && (
            <button
              onClick={handleSearchClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label={t('nav:header.closeSearch')}
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
          )}
          {!isSearchActive && showBack && (
            <IconButton
              icon={ArrowLeft}
              onClick={onBack}
              ariaLabel={t('nav:header.back')}
            />
          )}
          {!isSearchActive && showHome && (
            <IconButton
              icon={Home}
              onClick={onHome}
              ariaLabel={t('nav:header.home')}
            />
          )}
          {title && !isSearchBarVisible && (
            <h1 className="text-3xl font-bold text-gray-900 truncate">
              {title}
            </h1>
          )}
        </div>

        {/* 중앙 영역 - 검색바 */}
        {isSearchBarVisible && (
          <div className="flex-1 mx-4 relative" ref={searchRef}>
            <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }}>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(true)}
                  placeholder={resolvedPlaceholder}
                  className="w-full pl-4 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none text-sm text-gray-700"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Search size={16} />
                  </button>
                </div>
              </div>
            </form>

            {/* 검색 제안 (간단 버전) */}
            {showSearchSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-50 max-h-60 overflow-y-auto">
                <div className="p-3">
                  <span className="text-xs font-medium text-gray-500 mb-2 block">{t('nav:header.recommendedSearches')}</span>
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
        {!isSearchActive && (
          <div className="flex items-center gap-1">
            {showChat && (
              <IconButton
                icon={MessageCircle}
                onClick={onChat}
                ariaLabel={t('nav:header.chat')}
              />
            )}
            {showNotification && (
              <div className="relative">
                <IconButton
                  icon={Bell}
                  onClick={onNotification}
                  ariaLabel={t('nav:header.notification')}
                />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 pointer-events-none">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </div>
            )}
            {showSearch && (
              <IconButton
                icon={Search}
                onClick={handleSearchToggle}
                ariaLabel={t('nav:header.search')}
              />
            )}
            {showProfile && (
              <IconButton
                icon={UserCircle}
                onClick={onProfile}
                ariaLabel={t('nav:header.profile')}
              />
            )}
            {showCart && (
              <IconButton
                icon={ShoppingBag}
                onClick={onCart}
                badge={cartCount}
                ariaLabel={t('nav:header.cart')}
              />
            )}
            {showSettings && (
              <IconButton
                icon={Settings}
                onClick={onSettings}
                ariaLabel={t('nav:header.settings')}
              />
            )}
          </div>
        )}
      </div>
    </header>
  );
}
