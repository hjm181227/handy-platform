import { useState, useEffect, useRef } from 'react';
import { toQ } from '../../utils';
import { webApiService } from '../../services/apiService';
import type { User } from '@handy-platform/shared';
import { SearchIcon, CartIcon, QRIcon } from '@handy-platform/shared/src/components/icons';
import { Logo } from '../common/Logo';

export function MainHeader({
  cartCount,
  onCart,
  onGo,
  currentPath,
  onAuthStateChange
}: {
  cartCount:number;
  onCart:()=>void;
  onGo:(to:string)=>void;
  currentPath?: string;
  onAuthStateChange?: (user: User | null) => void;
}) {
  const [q,setQ]=useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const gnb = [
    {label:"랭킹", to:"/ranking"},
    {label:"브랜드", to:"/brands"},
    {label:"신상", to:"/new"},
    {label:"추천", to:"/recommend"},
    {label:"이벤트", to:"/event"},
    {label:"판매자센터", to:"/seller"},
  ];

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

  // 로그인 상태 확인
  const checkAuthStatus = async () => {
    try {
      const currentUser = await webApiService.getCurrentUser();
      console.log('Current user from checkAuthStatus:', currentUser);
      setUser(currentUser);
      onAuthStateChange?.(currentUser);
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      setUser(null);
      onAuthStateChange?.(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    loadRecentSearches();
  }, []);

  // 전역에서 인증 상태 변경을 감지하는 이벤트 리스너
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('MainHeader: Auth state change detected');
      checkAuthStatus();
    };

    // 커스텀 이벤트로 로그인/로그아웃 상태 변경 감지 (여러 이벤트명 지원)
    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('auth-state-changed', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('auth-state-changed', handleAuthChange);
    };
  }, []);

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
    if (value.trim() && !showSearchSuggestions) {
      setShowSearchSuggestions(true);
    }
  };

  const handleRecentSearchClick = (query: string) => {
    setQ(query);
    submitSearch(query);
  };

  const handleLogout = async () => {
    try {
      await webApiService.logoutAndClearToken();

      setUser(null);
      setShowUserMenu(false);
      onAuthStateChange?.(null);
      // 인증 상태 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      // 홈으로 이동
      onGo('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 로그아웃 실패해도 로컬 상태는 초기화
      setUser(null);
      setShowUserMenu(false);
      onAuthStateChange?.(null);
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    }
  };

  const handleLogin = () => {
    onGo('/login');
  };

  const handleMyPage = () => {
    setShowUserMenu(false);
    onGo('/my');
  };

  const handleAdminCenter = () => {
    setShowUserMenu(false);
    onGo('/admin');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-primary-100 shadow-soft">
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

          <div className="justify-self-center w-full max-w-2xl">
            <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 focus-within:border-gray-500 transition-all">
              <SearchIcon size={16} color="#666" />
              <input
                value={q}
                onChange={e=>handleSearchInputChange(e.target.value)}
                onFocus={handleSearchInputFocus}
                onKeyDown={(e)=>{ if(e.key==="Enter") submitSearch(); }}
                placeholder="검색어를 입력하세요"
                className="w-full text-sm outline-none placeholder:text-gray-500 text-gray-700"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button onClick={() => submitSearch()} className="text-xs rounded border px-2 py-1 hover:bg-gray-50">Search</button>
            </div>

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
                    {['네일아트', '젤네일', '매니큐어', '핸드크림', '큐티클오일'].map((keyword, index) => (
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
                      className="w-full text-left py-2 px-3 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center gap-2 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      '<span className="text-blue-800">{q}</span>' 검색
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="justify-self-end flex items-center gap-3">
            {isLoading ? (
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
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden sm:inline">{user.name || user.email}</span>
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
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50"
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

                      {/* 어드민 사용자에게만 어드민 센터 메뉴 표시 */}
                      {user.role === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Admin Center button clicked');
                            handleAdminCenter();
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-blue-600"
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h8a2 2 0 002-2v-8" />
                </svg>
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
                onClick={(e)=>{e.preventDefault(); onGo(x.to);}}
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
          <div className="flex items-center gap-2">
            {isLoading ? (
              // 로딩 상태
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            ) : user ? (
              // 로그인 상태
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                      {user.name || user.email}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Mobile MyPage button clicked');
                        handleMyPage();
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      마이페이지
                    </button>

                    {/* 모바일 - 어드민 사용자에게만 어드민 센터 메뉴 표시 */}
                    {user.role === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Mobile Admin Center button clicked');
                          handleAdminCenter();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-blue-600"
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
                        console.log('Mobile Logout button clicked');
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // 비로그인 상태
              <button
                onClick={handleLogin}
                className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}

            {/* 장바구니 버튼 */}
            <button
              onClick={onCart}
              className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors relative"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h8a2 2 0 002-2v-8" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* QR 스캔 버튼 (모바일 전용) - 숨김 처리 */}
            <button
              onClick={() => {
                try {
                  (window as any).ReactNativeWebView?.postMessage(
                    JSON.stringify({ type: "CAMERA", data: { action: "scanQR" } })
                  );
                } catch (error) {
                  console.warn('QR 스캔은 모바일 앱에서만 사용 가능합니다.');
                }
              }}
              className="hidden w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              📷
            </button>
          </div>
        </div>

        {/* 검색바 */}
        <div className="px-4 pb-3 relative">
          <div className="flex items-center gap-2 rounded-full border px-4 py-3 bg-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-gray-500" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>
            </svg>
            <input
              value={q}
              onChange={e=>handleSearchInputChange(e.target.value)}
              onFocus={handleSearchInputFocus}
              onKeyDown={(e)=>{ if(e.key==="Enter") submitSearch(); }}
              placeholder="검색어를 입력하세요"
              className="w-full text-sm outline-none placeholder:text-gray-400 bg-transparent"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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
                  {['네일아트', '젤네일', '매니큐어', '핸드크림', '큐티클오일'].map((keyword, index) => (
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
                    className="w-full text-left py-3 px-3 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center gap-2 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    '<span className="text-blue-800">{q}</span>' 검색
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
                onClick={(e)=>{e.preventDefault(); onGo(x.to);}}
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
