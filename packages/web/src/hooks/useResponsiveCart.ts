import { useState, useEffect } from 'react';

/**
 * 반응형 장바구니 동작을 위한 커스텀 훅
 * - PC(lg 이상): Drawer로 동작
 * - Mobile(lg 미만): Page로 동작
 */
export function useResponsiveCart() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // lg는 1024px (Tailwind 기준)
      setIsMobile(window.innerWidth < 1024);
    };

    // 초기 체크
    checkScreenSize();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  return { isMobile };
}