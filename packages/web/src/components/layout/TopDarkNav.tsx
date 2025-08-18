
import { useState, useEffect } from 'react';
import { webApiService } from '../../services/api';

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
    <div className="hidden md:block bg-[#161616] text-gray-300 text-xs">
      <div className="mx-auto max-w-7xl h-8 flex items-center justify-between px-4">
        <button onClick={onOpenCategories} className="flex items-center gap-2 text-white hover:opacity-90">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"/></svg>
          <span className="font-semibold tracking-wide">Categories</span>
        </button>

        <nav className="hidden lg:flex items-center gap-4">
          {items.map(x=>(
            <a
              key={x.label}
              href={x.to}
              onClick={(e)=>{e.preventDefault(); onGo(x.to);}}
              className="hover:text-white"
            >
              {x.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="/help"  onClick={(e)=>{e.preventDefault(); onGo("/help");}}  className="hover:text-white">Help</a>
          <a href="/my"    onClick={(e)=>{e.preventDefault(); onGo("/my");}}    className="hover:text-white">My</a>
          <a href="/likes" onClick={(e)=>{e.preventDefault(); onGo("/likes");}} className="hover:text-white">Likes</a>
          {!isLoggedIn && (
            <>
              <a href="/login" onClick={(e)=>{e.preventDefault(); onGo("/login");}} className="hover:text-white">Login</a>
              <a href="/signup"onClick={(e)=>{e.preventDefault(); onGo("/signup");}}className="hover:text-white">Sign up</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}