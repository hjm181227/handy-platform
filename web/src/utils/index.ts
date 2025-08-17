import { useState, useEffect } from 'react';

// Utility functions
export const money = (n: number) => n.toLocaleString();
export const toQ = (obj: Record<string, string>) =>
  "?" + new URLSearchParams(obj).toString();

// Tiny Router (pathname + search)
export function useMiniRouter() {
  const getPath = () => window.location.pathname + window.location.search;
  const [path, setPath] = useState<string>(getPath());

  useEffect(() => {
    const onPop = () => setPath(getPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const nav = (to: string) => {
    if (to === path) return;
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  return { path, nav };
}
