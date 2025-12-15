import { useState, useEffect } from 'react';

// Utility functions
export const money = (n: number | undefined | null) => {
  if (n == null || isNaN(n)) return '0원';
  return n.toLocaleString('ko-KR') + '원';
};
export const toQ = (obj: Record<string, string>) =>
  "?" + new URLSearchParams(obj).toString();

// Tiny Router (pathname + search)
export function useMiniRouter() {
  const getPath = () => window.location.pathname + window.location.search;
  const [path, setPath] = useState<string>(getPath());

  useEffect(() => {
    const onPop = () => {
      const newPath = getPath();
      setPath(newPath);
    };
    window.addEventListener("popstate", onPop);
    
    // 경로 변경을 감지하는 커스텀 이벤트 리스너 추가
    const onCustomNav = (e: any) => {
      const newPath = e.detail.path;
      setPath(newPath);
    };
    window.addEventListener("customNavigation", onCustomNav);
    
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("customNavigation", onCustomNav);
    };
  }, []);

  const nav = (to: string) => {
    if (to === path) return;
    
    console.log("Navigation triggered from:", path, "to:", to);
    
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    
    // 커스텀 이벤트 발생으로 다른 컴포넌트들에게 경로 변경 알림
    window.dispatchEvent(new CustomEvent("customNavigation", { 
      detail: { path: to } 
    }));
    
    // React의 재렌더링 강제 트리거 (추가 보장)
    setTimeout(() => {
      console.log("Force updating path state to:", to);
      setPath(to);
    }, 0);
  };

  return { path, nav };
}
