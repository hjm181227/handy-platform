
import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';

export function TopDarkNav({ onOpenCategories, onGo }:{
  onOpenCategories: ()=>void; onGo:(to:string)=>void;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const authenticated = await webApiService.isAuthenticated();
      setIsLoggedIn(authenticated);
    };

    checkAuthStatus();

    // 로그인 상태 변경 감지 (여러 이벤트 타입 지원)
    const handleAuthChange = () => {
      console.log('TopDarkNav: Auth state change detected');
      checkAuthStatus();
    };

    // 여러 이벤트명 지원 (호환성)
    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('auth-state-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('auth-state-changed', handleAuthChange);
    };
  }, []);
  const items: {label:string; to:string}[] = [
    {label:"BRANDS", to:"/brands"},
    {label:"SNAP", to:"/snap"},
    {label:"NEWS", to:"/news"},
  ];
  return (
    <div className="hidden md:block bg-[#161616] text-white text-sm">
      <div className="mx-auto max-w-7xl h-9 flex items-center justify-between px-4">
        <button onClick={onOpenCategories} className="flex items-center gap-2 text-white font-medium tracking-wide">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"/></svg>
          <span>Categories</span>
        </button>

        <nav className="hidden lg:flex items-center gap-4">
          {items.map(x=>(
            <button
              key={x.label}
              onClick={() => onGo(x.to)}
              className="text-white font-medium tracking-wide"
            >
              {x.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={() => onGo("/help")} className="text-white font-medium tracking-wide">Help</button>
          <button onClick={() => onGo("/my")} className="text-white font-medium tracking-wide">My</button>
          <button onClick={() => onGo("/likes")} className="text-white font-medium tracking-wide">Likes</button>
          {!isLoggedIn && (
            <>
              <button onClick={() => onGo("/login")} className="text-white font-medium tracking-wide">Login</button>
              <button onClick={() => onGo("/signup")} className="text-white font-medium tracking-wide">Sign up</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}