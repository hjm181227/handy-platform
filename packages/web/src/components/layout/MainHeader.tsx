import { useState, useEffect, useRef } from 'react';
import { toQ } from '../../utils';
import { webApiService } from '../../services/api';
import type { User } from '@handy-platform/shared';

export function MainHeader({ 
  cartCount, 
  onCart, 
  onGo,
  onAuthStateChange 
}: { 
  cartCount:number; 
  onCart:()=>void; 
  onGo:(to:string)=>void;
  onAuthStateChange?: (user: User | null) => void;
}) {
  const [q,setQ]=useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const gnb = [
    {label:"랭킹", to:"/ranking"},
    {label:"세일", to:"/sale"},
    {label:"브랜드", to:"/brands"},
    {label:"추천", to:"/recommend"},
    {label:"신상", to:"/new"},
    {label:"트렌드", to:"/trend"},
  ];
  // 로그인 상태 확인
  const checkAuthStatus = async () => {
    try {
      const currentUser = await webApiService.getCurrentUser();
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

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const submitSearch = () => {
    onGo("/search" + toQ({ q }));
  };

  const handleLogout = async () => {
    try {
      await webApiService.logout();
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

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:block">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center h-16 px-4">
          <div className="justify-self-start">
            <a className="text-2xl font-extrabold tracking-tight" href="/" onClick={(e)=>{e.preventDefault(); onGo("/");}}>Handy</a>
          </div>

          <div className="justify-self-center w-full max-w-2xl">
            <div className="flex items-center gap-2 rounded-full border px-3 py-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-gray-500" strokeWidth="2" fill="none">
                <circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>
              </svg>
              <input
                value={q}
                onChange={e=>setQ(e.target.value)}
                onKeyDown={(e)=>{ if(e.key==="Enter") submitSearch(); }}
                placeholder="검색어를 입력하세요"
                className="w-full text-sm outline-none placeholder:text-gray-400"
              />
              <button onClick={submitSearch} className="text-xs rounded border px-2 py-1">Search</button>
            </div>
          </div>

          <div className="justify-self-end flex items-center gap-3">
            {isLoading ? (
              // 로딩 상태
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">인증 확인 중...</span>
              </div>
            ) : user ? (
              // 로그인 상태
              <div className="flex items-center gap-3">
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
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
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                      <button
                        onClick={handleMyPage}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        마이페이지
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
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
              <a key={x.label} href={x.to} onClick={(e)=>{e.preventDefault(); onGo(x.to);}} className="text-gray-700 hover:text-black">{x.label}</a>
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
            className="text-xl font-extrabold tracking-tight" 
            href="/" 
            onClick={(e)=>{e.preventDefault(); onGo("/");}}
          >
            Handy
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
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                      {user.name || user.email}
                    </div>
                    <button
                      onClick={handleMyPage}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      마이페이지
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
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

            {/* QR 스캔 버튼 (모바일 전용) */}
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
              className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              📷
            </button>
          </div>
        </div>

        {/* 검색바 */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full border px-4 py-3 bg-gray-50">
            <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-gray-500" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>
            </svg>
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
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
        </div>

        {/* 네비게이션 탭들 */}
        <div className="px-4 overflow-x-auto">
          <div className="flex gap-4 pb-2">
            {gnb.map(x=>(
              <a 
                key={x.label} 
                href={x.to} 
                onClick={(e)=>{e.preventDefault(); onGo(x.to);}} 
                className="text-sm text-gray-700 hover:text-black whitespace-nowrap py-1 border-b-2 border-transparent hover:border-gray-300"
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