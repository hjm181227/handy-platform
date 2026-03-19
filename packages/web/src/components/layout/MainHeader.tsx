import { useState, useEffect, useRef } from 'react';
import { toQ } from '../../utils';
import { webApiService } from '../../services/apiService';
import { User, SearchIcon, CartIcon, QRIcon } from '@handy-platform/shared';
import { Logo } from '../common/Logo';
import { Menu, Search, X, ShoppingBag, MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { GNB_ITEMS } from '../../config/navigationConfig';

export function MainHeader({
  cartCount,
  onCart,
  onGo,
  currentPath,
  onAuthStateChange,
  authLoading: _authLoading = false, // 사용하지 않음, Context에서 가져옴
  onCategoryOpen,
  onChat
}: {
  cartCount:number;
  onCart:()=>void;
  onGo:(to:string)=>void;
  currentPath?: string;
  onAuthStateChange?: (user: User | null) => void;
  authLoading?: boolean;
  onCategoryOpen?: () => void;
  onChat?: () => void;
}) {
  const [q,setQ]=useState("");

  // 🔍 디버깅: cartCount 변경 감지
  useEffect(() => {
    console.log('🎨 [MainHeader] Cart count updated to:', cartCount);
  }, [cartCount]);

  // AuthContext에서 인증 상태 가져오기
  const { currentUser: user, authLoading, logout } = useAuth();

  // Auth Modal
  const { openLogin } = useAuthModal();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const gnb = GNB_ITEMS;

  // 활성화 상태 판단 함수
  const isActive = (menuPath: string) => {
    if (!currentPath) return false;
    if (menuPath === '/') return currentPath === '/';
    return currentPath.startsWith(menuPath);
  };

  // 링크 클래스명 생성 함수
  const getLinkClassName = (menuPath: string, isMobile = false) => {
    const baseClass = isMobile
      ? "text-sm whitespace-nowrap py-1 no-underline"
      : "no-underline";

    const activeClass = isActive(menuPath)
      ? "font-bold text-black"
      : "text-gray-700 hover:font-bold hover:no-underline";

    return `${baseClass} ${activeClass}`.trim();
  };

  // 최근 검색어 로드
  const loadRecentSearches = () => {
    try {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('최근 검색어 로드 실패:', error);
    }
  };

  // 최근 검색어 저장
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;

    try {
      const newSearches = [query.trim(), ...recentSearches.filter(s => s !== query.trim())].slice(0, 5);
      setRecentSearches(newSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newSearches));
    } catch (error) {
      console.warn('최근 검색어 저장 실패:', error);
    }
  };

  // 최근 검색어 삭제
  const removeRecentSearch = (query: string) => {
    try {
      const newSearches = recentSearches.filter(s => s !== query);
      setRecentSearches(newSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newSearches));
    } catch (error) {
      console.warn('최근 검색어 삭제 실패:', error);
    }
  };

  // 모든 최근 검색어 삭제
  const clearRecentSearches = () => {
    try {
      setRecentSearches([]);
      localStorage.removeItem('recentSearches');
    } catch (error) {
      console.warn('최근 검색어 전체 삭제 실패:', error);
    }
  };

  // 최근 검색어 로드
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // App.tsx의 onAuthStateChange 콜백 호출 (호환성 유지용)
  useEffect(() => {
    onAuthStateChange?.(user);
  }, [user, onAuthStateChange]);

  // 외부 클릭 시 메뉴 및 검색 제안 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };

    if (showUserMenu || showSearchSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showSearchSuggestions]);

  const submitSearch = (searchQuery?: string) => {
    const query = searchQuery || q;
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
    setShowSearchSuggestions(false);
    onGo("/search" + toQ({ q: query }));
  };

  const handleSearchInputFocus = () => {
    setShowSearchSuggestions(true);
  };

  const handleSearchInputChange = (value: string) => {
    setQ(value);
    // 검색어가 있거나 포커스 상태일 때 제안 표시
    if (!showSearchSuggestions) {
      setShowSearchSuggestions(true);
    }
  };

  const handleRecentSearchClick = (query: string) => {
    setQ(query);
    submitSearch(query);
  };

  const handleLogout = async () => {
    try {
      await logout(); // useAuth Hook의 logout 사용
      setShowUserMenu(false);
      onGo('/'); // 홈으로 이동
    } catch (error) {
      console.error('[MainHeader] 로그아웃 실패:', error);
      setShowUserMenu(false);
      onGo('/');
    }
  };

  const handleLogin = () => {
    openLogin();
  };

  const handleMyPage = () => {
    setShowUserMenu(false);
    onGo('/my');
  };

  const handleAdminCenter = () => {
    setShowUserMenu(false);
    onGo('/admin');
  };

  const handleSellerCenter = () => {
    setShowUserMenu(false);
    onGo('/seller');
  };

  return (
    <header className="bg-white/95 backdrop-blur border-b border-gray-200 shadow-soft">
      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:block">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center h-16 px-4">
          <div className="justify-self-start">
            <a href="/" onClick={(e)=>{e.preventDefault(); onGo("/");}} className="block">
              <img
                src="https://handy-images-stage.s3.ap-northeast-2.amazonaws.com/logo/logo-black.png"
                alt="Handy"
                className="h-8 w-auto"
              />
            </a>
          </div>

          <div className="justify-self-center w-full max-w-2xl relative" ref={searchRef}>
            <form onSubmit={(e) => { e.preventDefault(); submitSearch(); }}>
              <div className="relative">
                <input
                  value={q}
                  onChange={e=>handleSearchInputChange(e.target.value)}
                  onFocus={handleSearchInputFocus}
                  onKeyDown={(e)=>{ if(e.key==="Enter") submitSearch(); }}
                  placeholder="검색어를 입력하세요"
                  className="w-full pl-4 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B] outline-none text-sm text-gray-700"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ("")}
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

            {/* 검색 제안 드롭다운 */}
            {showSearchSuggestions && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto">
                {recentSearches.length > 0 && (
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">최근 검색어</span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        전체삭제
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <div key={index} className="flex items-center justify-between group">
                          <button
                            onClick={() => handleRecentSearchClick(search)}
                            className="flex-1 text-left py-1.5 px-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{search}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(search);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 인기 검색어 또는 추천 검색어 */}
                <div className="p-3">
                  <span className="text-xs font-medium text-gray-500 mb-2 block">추천 검색어</span>
                  <div className="space-y-1">
                    {['네일아트', '젤네일', '매니큐어', '핸드크림', '큐티클오일', '네일스티커', '베이스코트', '탑코트', '글리터', '홀로그램'].map((keyword, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(keyword)}
                        className="block w-full text-left py-1.5 px-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>{keyword}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {q.trim() && (
                  <div className="border-t border-gray-100 p-3">
                    <button
                      onClick={() => submitSearch()}
                      className="w-full text-left py-2 px-3 text-sm bg-[#FFF1F2] text-[#E85A6B] rounded hover:bg-[#E85A6B]/10 flex items-center gap-2 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      '<span className="text-[#D14A5B]">{q}</span>' 검색
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="justify-self-end flex items-center gap-3">
            {authLoading ? (
              // 로딩 상태
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                <span className="text-sm text-gray-900">인증 확인 중...</span>
              </div>
            ) : user ? (
              // 로그인 상태
              <div className="flex items-center gap-3">
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      console.log('User menu clicked, current state:', showUserMenu);
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-6 h-6 bg-[#FF073A] text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {user.nickname?.charAt(0) || user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden sm:inline">{user.nickname || user.name || user.email}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-[100]"
                      onMouseDown={(e) => e.stopPropagation()} // 외부 클릭 이벤트 방지
                    >
                      {console.log('Dropdown menu rendered, showUserMenu:', showUserMenu)}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('MyPage button clicked');
                          handleMyPage();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        마이페이지
                      </button>

                      {/* 판매자 사용자에게만 판매자 센터 메뉴 표시 */}
                      {user.role === 'seller' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Seller Center button clicked');
                            handleSellerCenter();
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          판매자 센터
                        </button>
                      )}

                      {/* 어드민 사용자에게만 어드민 센터 메뉴 표시 */}
                      {user.role === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Admin Center button clicked');
                            handleAdminCenter();
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-[#E85A6B]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          어드민 센터
                        </button>
                      )}

                      <hr className="my-1" />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Logout button clicked');
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                        </svg>
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // 비로그인 상태
              <button
                onClick={handleLogin}
                className="rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
              >
                로그인/회원가입
              </button>
            )}

            <button
              onClick={onCart}
              className="rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors relative"
            >
              <span className="flex items-center gap-1">
                <ShoppingBag size={16} />
                <span className="hidden sm:inline">장바구니</span>
                {cartCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 overflow-x-auto">
          <div className="flex gap-4 py-2 text-sm whitespace-nowrap">
            {gnb.map(x=>(
              <a
                key={x.label}
                href={x.to}
                onClick={(e)=>{
                  e.preventDefault();
                  if ((x as any).isModal && onCategoryOpen) {
                    onCategoryOpen();
                  } else {
                    onGo(x.to);
                  }
                }}
                className={getLinkClassName(x.to)}
              >
                {x.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="block md:hidden">
        {/* 상단 바: 로고 + 액션 버튼들 */}
        <div className="flex items-center justify-between h-14 px-4">
          {/* 로고 */}
          <a
            href="/"
            onClick={(e)=>{e.preventDefault(); onGo("/");}}
            className="block"
          >
            <img
              src="https://handy-images-stage.s3.ap-northeast-2.amazonaws.com/logo/logo-black.png"
              alt="Handy"
              className="h-7 w-auto"
            />
          </a>

          {/* 액션 버튼들 */}
          <div className="flex items-center">
            {/* 채팅 버튼 */}
            {onChat && (
              <button
                onClick={onChat}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="채팅"
              >
                <MessageCircle size={20} />
              </button>
            )}
            {/* 장바구니 버튼 */}
            <button
              onClick={onCart}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors relative"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 검색바 */}
        <div className="px-4 pb-3 relative">
          <div className="flex items-center gap-2">
            {/* 카테고리 버튼 */}
            <button
              onClick={() => onCategoryOpen?.()}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="카테고리"
            >
              <Menu size={20} />
            </button>
            <form className="flex-1" onSubmit={(e) => { e.preventDefault(); submitSearch(); }}>
              <div className="relative">
                <input
                  value={q}
                  onChange={e=>handleSearchInputChange(e.target.value)}
                  onFocus={handleSearchInputFocus}
                  onKeyDown={(e)=>{ if(e.key==="Enter") submitSearch(); }}
                  placeholder="검색어를 입력하세요"
                  className="w-full pl-4 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B] outline-none text-sm text-gray-700"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ("")}
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
          </div>

          {/* 모바일 검색 제안 드롭다운 */}
          {showSearchSuggestions && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto">
              {recentSearches.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">최근 검색어</span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      전체삭제
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <div key={index} className="flex items-center justify-between group">
                        <button
                          onClick={() => handleRecentSearchClick(search)}
                          className="flex-1 text-left py-2 px-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{search}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(search);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 모바일 추천 검색어 */}
              <div className="p-3">
                <span className="text-xs font-medium text-gray-500 mb-2 block">추천 검색어</span>
                <div className="flex flex-wrap gap-2">
                  {['네일아트', '젤네일', '매니큐어', '핸드크림', '큐티클오일', '네일스티커', '베이스코트', '탑코트'].map((keyword, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(keyword)}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>

              {q.trim() && (
                <div className="border-t border-gray-100 p-3">
                  <button
                    onClick={() => submitSearch()}
                    className="w-full text-left py-3 px-3 text-sm bg-[#FFF1F2] text-[#E85A6B] rounded hover:bg-[#E85A6B]/10 flex items-center gap-2 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    '<span className="text-[#D14A5B]">{q}</span>' 검색
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 네비게이션 탭들 */}
        <div className="px-4 overflow-x-auto">
          <div className="flex gap-4 pb-2">
            {gnb.map(x=>(
              <a
                key={x.label}
                href={x.to}
                onClick={(e)=>{
                  e.preventDefault();
                  if ((x as any).isModal && onCategoryOpen) {
                    onCategoryOpen();
                  } else {
                    onGo(x.to);
                  }
                }}
                className={getLinkClassName(x.to, true)}
              >
                {x.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
