import React from 'react';
import {
  IoGridOutline,
  IoGrid,
  IoCameraOutline,
  IoCamera,
  IoHomeOutline,
  IoHome,
  IoHeartOutline,
  IoHeart,
  IoPersonOutline,
  IoPerson
} from 'react-icons/io5';
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
      icon: IoGridOutline,
      activeIcon: IoGrid
    },
    {
      label: '스냅',
      path: '/snap',
      icon: IoCameraOutline,
      activeIcon: IoCamera
    },
    {
      label: '홈',
      path: '/',
      icon: IoHomeOutline,
      activeIcon: IoHome
    },
    {
      label: '좋아요',
      path: '/likes',
      icon: IoHeartOutline,
      activeIcon: IoHeart,
      requiresAuth: true
    },
    {
      label: '마이',
      path: '/my',
      icon: IoPersonOutline,
      activeIcon: IoPerson,
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
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
      style={{
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
      role="navigation"
      aria-label="하단 네비게이션"
    >
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = active ? tab.activeIcon : tab.icon;
          const textColor = active ? 'text-gray-900' : 'text-gray-400';

          return (
            <button
              key={tab.label}
              onClick={() => handleTabClick(tab)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 active:bg-gray-50"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={`${tab.label}로 이동`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                size={24}
                className={textColor}
              />
              <span className={`text-[10px] font-semibold mt-1 ${textColor}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
