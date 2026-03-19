import React from 'react';
import { LayoutGrid, Camera, House, Heart, User, Search, ShoppingBag, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { BOTTOM_TABS, type BottomTab } from '../../config/navigationConfig';

interface MobileBottomNavProps {
  currentPath: string;
  onGo: (path: string) => void;
  onCategoryOpen: () => void;
}

const ICON_MAP: Record<BottomTab['iconName'], React.ComponentType<any>> = {
  home: House,
  search: Search,
  camera: Camera,
  'shopping-bag': ShoppingBag,
  user: User,
  grid: LayoutGrid,
  heart: Heart,
  plus: Plus,
};

export function MobileBottomNav({ currentPath, onGo, onCategoryOpen }: MobileBottomNavProps) {
  const { currentUser } = useAuth();
  const { openLogin } = useAuthModal();

  const isActive = (tabPath: string) => {
    if (tabPath === '/') return currentPath === '/';
    return currentPath.startsWith(tabPath);
  };

  const handleTabClick = (tab: BottomTab) => {
    if (tab.requiresAuth && !currentUser) {
      openLogin();
      return;
    }
    onGo(tab.path);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white z-40"
      style={{
        borderTop: '1px solid #E5E0DC',
        paddingBottom: 'var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))'
      }}
      role="navigation"
      aria-label="하단 네비게이션"
    >
      <div className="flex justify-around items-center" style={{ paddingTop: 8, paddingBottom: 8 }}>
        {BOTTOM_TABS.map((tab) => {
          const Icon = ICON_MAP[tab.iconName];

          // + 버튼 (스냅 업로드) 특별 렌더링
          if (tab.isSpecial) {
            return (
              <button
                key="special-plus"
                onClick={() => handleTabClick(tab)}
                className="flex items-center justify-center flex-1"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-label="스냅 업로드"
              >
                <div className="w-11 h-11 bg-[#E85A6B] rounded-full flex items-center justify-center shadow-md -mt-2">
                  <Plus size={24} style={{ color: '#fff' }} />
                </div>
              </button>
            );
          }

          const active = isActive(tab.path);
          const color = active ? '#E85A6B' : '#A39E99';

          return (
            <button
              key={tab.label}
              onClick={() => handleTabClick(tab)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200"
              style={{ WebkitTapHighlightColor: 'transparent', gap: 4 }}
              aria-label={`${tab.label}로 이동`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                size={24}
                style={{ color }}
              />
              <span style={{ color, fontSize: 10, fontWeight: active ? 600 : 500 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
