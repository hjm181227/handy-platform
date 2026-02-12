import React from 'react';
import { LayoutGrid, Camera, House, Heart, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthModal } from '../../contexts/AuthModalContext';

interface MobileBottomNavProps {
  currentPath: string;
  onGo: (path: string) => void;
  onCategoryOpen: () => void;
}

interface Tab {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  activeIcon: React.ComponentType<{ size?: number; className?: string }>;
  requiresAuth?: boolean;
}

export function MobileBottomNav({ currentPath, onGo, onCategoryOpen }: MobileBottomNavProps) {
  const { currentUser } = useAuth();
  const { openLogin } = useAuthModal();

  const tabs: Tab[] = [
    {
      label: '카테고리',
      path: '/category',
      icon: LayoutGrid as any,
      activeIcon: LayoutGrid as any
    },
    {
      label: '스냅',
      path: '/snap',
      icon: Camera as any,
      activeIcon: Camera as any
    },
    {
      label: '홈',
      path: '/',
      icon: House as any,
      activeIcon: House as any
    },
    {
      label: '좋아요',
      path: '/likes',
      icon: Heart as any,
      activeIcon: Heart as any,
      requiresAuth: true
    },
    {
      label: '마이',
      path: '/my',
      icon: User as any,
      activeIcon: User as any,
      requiresAuth: true
    },
  ];

  const isActive = (tabPath: string) => {
    if (tabPath === '/') return currentPath === '/';
    return currentPath.startsWith(tabPath);
  };

  const handleTabClick = (tab: Tab) => {
    // 로그인 필요한 탭인데 비로그인 상태면 로그인 모달 표시
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
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = active ? tab.activeIcon : tab.icon;
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
