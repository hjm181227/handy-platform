/**
 * 커뮤니티 네비게이션 플래그
 *
 * true  → 커뮤니티 모드 (Snap 피드 중심, 커뮤니티 탭)
 * false → 커머스 모드 (기존 쇼핑 중심 UI)
 *
 * 이 한 줄만 바꾸면 전체 UI가 즉시 롤백됩니다.
 */
export const COMMUNITY_NAV_ENABLED = false;

// ==================== 하단 탭 ====================

export interface BottomTab {
  label: string;
  /** i18n key for the label (e.g. 'nav:bottom.home') */
  labelKey: string;
  path: string;
  iconName: 'home' | 'search' | 'camera' | 'shopping-bag' | 'user' | 'grid' | 'heart' | 'plus';
  requiresAuth?: boolean;
  isSpecial?: boolean;
}

const COMMUNITY_BOTTOM_TABS: BottomTab[] = [
  { label: '홈', labelKey: 'nav:bottom.home', path: '/', iconName: 'home' },
  { label: '탐색', labelKey: 'nav:bottom.discover', path: '/discover', iconName: 'search' },
  { label: '스냅', labelKey: 'nav:bottom.snap', path: '/snap/new', iconName: 'camera' },
  { label: '쇼핑', labelKey: 'nav:bottom.shop', path: '/shop', iconName: 'shopping-bag' },
  { label: '마이', labelKey: 'nav:bottom.my', path: '/my', iconName: 'user', requiresAuth: true },
];

const COMMERCE_BOTTOM_TABS: BottomTab[] = [
  { label: '쇼핑', labelKey: 'nav:bottom.shop', path: '/', iconName: 'shopping-bag' },
  { label: '스냅', labelKey: 'nav:bottom.snap', path: '/snap', iconName: 'camera' },
  { label: '', labelKey: '', path: '/snap/new', iconName: 'plus', isSpecial: true, requiresAuth: true },
  { label: '좋아요', labelKey: 'nav:bottom.likes', path: '/likes', iconName: 'heart', requiresAuth: true },
  { label: '마이', labelKey: 'nav:bottom.my', path: '/my', iconName: 'user', requiresAuth: true },
];

export const BOTTOM_TABS = COMMUNITY_NAV_ENABLED ? COMMUNITY_BOTTOM_TABS : COMMERCE_BOTTOM_TABS;

// ==================== 상단 GNB ====================

export interface GnbItem {
  label: string;
  /** i18n key for the label (e.g. 'nav:gnb.feed') */
  labelKey: string;
  to: string;
}

const COMMUNITY_GNB: GnbItem[] = [
  { label: '피드', labelKey: 'nav:gnb.feed', to: '/' },
  { label: '탐색', labelKey: 'nav:gnb.discover', to: '/discover' },
  { label: '쇼핑', labelKey: 'nav:gnb.shop', to: '/shop' },
  { label: '랭킹', labelKey: 'nav:gnb.ranking', to: '/ranking' },
  { label: '브랜드', labelKey: 'nav:gnb.brands', to: '/brands' },
];

const COMMERCE_GNB: GnbItem[] = [
  { label: '랭킹', labelKey: 'nav:gnb.ranking', to: '/ranking' },
  { label: '브랜드', labelKey: 'nav:gnb.brands', to: '/brands' },
  { label: '신상', labelKey: 'nav:gnb.new', to: '/new' },
  { label: '추천', labelKey: 'nav:gnb.recommend', to: '/recommend' },
  { label: '이벤트', labelKey: 'nav:gnb.event', to: '/event' },
];

export const GNB_ITEMS = COMMUNITY_NAV_ENABLED ? COMMUNITY_GNB : COMMERCE_GNB;
