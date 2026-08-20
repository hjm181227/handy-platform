import React from 'react';
import { LayoutGrid, Camera, House, Heart, User, Search, ShoppingBag, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

// 자체 하단 고정 CTA(구매바·주문하기·결제하기)가 있는 화면 — 탭바가 같은 bottom-0에
// 겹쳐 버튼을 가리므로 이 경로들에서는 탭바를 렌더하지 않는다
const CTA_ROUTE_PREFIXES = ['/product/', '/cart', '/checkout', '/payment'];

export function MobileBottomNav({ currentPath, onGo, onCategoryOpen }: MobileBottomNavProps) {
  const { t } = useTranslation(['nav', 'common']);
  const { currentUser } = useAuth();
  const { openLogin } = useAuthModal();

  if (CTA_ROUTE_PREFIXES.some(prefix => currentPath.startsWith(prefix))) {
    return null;
  }

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
      aria-label={t('nav:header.navigation')}
    >
      <div className="flex justify-around items-center" style={{ paddingTop: 8, paddingBottom: 8 }}>
        {BOTTOM_TABS.map((tab) => {
          const Icon = ICON_MAP[tab.iconName];

          // + 버튼: 현재 탭에 따라 동적 경로 분기
          // 스냅 탭 활성 → /snap/new, 그 외(쇼핑) → /custom-order/new
          if (tab.isSpecial) {
            const isSnapActive = currentPath.startsWith('/snap');
            const specialPath = isSnapActive ? '/snap/new' : '/custom-order/new';
            const specialLabel = isSnapActive ? t('nav:bottom.snapUpload') : t('nav:bottom.customOrder');
            return (
              <button
                key="special-plus"
                onClick={() => {
                  if (tab.requiresAuth && !currentUser) {
                    openLogin();
                    return;
                  }
                  onGo(specialPath);
                }}
                className="flex items-center justify-center flex-1"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-label={specialLabel}
              >
                <div className="w-11 h-11 bg-brand rounded-full flex items-center justify-center shadow-md -mt-2">
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
              aria-label={t('nav:header.goTo', { label: tab.labelKey ? t(tab.labelKey) : tab.label })}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                size={24}
                style={{ color }}
              />
              <span style={{ color, fontSize: 10, fontWeight: active ? 600 : 500 }}>
                {tab.labelKey ? t(tab.labelKey) : tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
