import { Drawer } from '../ui';
import { CartContent } from '../cart/CartContent';
import type { User } from '@handy-platform/shared';

// Cart Drawer (반응형 CartContent 사용)
export function CartDrawer({
  open,
  onClose,
  onCheckout,
  onCartUpdate,
  currentUser,
  showToast,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  onCartUpdate?: () => void;
  currentUser?: User | null;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
  return (
    <Drawer open={open} onClose={onClose} side="right">
      <CartContent
        mode="drawer"
        onClose={onClose}
        onCheckout={onCheckout}
        onCartUpdate={onCartUpdate}
        currentUser={currentUser}
        showToast={showToast}
        isDrawerOpen={open}
      />
    </Drawer>
  );
}

// Category Drawer
export function CategoryDrawer({
  open,
  onClose,
  onGo,
}: {
  open: boolean;
  onClose: () => void;
  onGo: (to: string) => void;
}) {
  const G = {
    style: [
      { label: "신상", icon: "✨" },
      { label: "심플", icon: "🤍" },
      { label: "화려", icon: "💎" },
      { label: "아트", icon: "🎨" },
      { label: "트렌디", icon: "🔥" },
      { label: "클래식", icon: "👑" },
      { label: "시즌", icon: "🌸" },
      { label: "테마", icon: "🎭" },
      { label: "키치", icon: "🌈" },
      { label: "네츄럴", icon: "🌿" },
    ],
    color: [
      { label: "레드", icon: "🔴" },
      { label: "핑크", icon: "🩷" },
      { label: "블루", icon: "🔵" },
      { label: "그린", icon: "🟢" },
      { label: "블랙/화이트", icon: "⚫" },
      { label: "브라운", icon: "🤎" },
      { label: "옐로우", icon: "🟡" },
      { label: "뉴트럴", icon: "🩶" },
    ],
    texture: [
      { label: "글리터", icon: "✨" },
      { label: "크롬/메탈", icon: "🪙" },
      { label: "매트", icon: "🎯" },
      { label: "벨벳", icon: "🧸" },
      { label: "젤", icon: "💧" },
      { label: "자석", icon: "🧲" },
    ],
    shape: [
      { label: "라운드", icon: "⭕" },
      { label: "아몬드", icon: "🥜" },
      { label: "오벌", icon: "🥚" },
      { label: "스틸레토", icon: "📍" },
      { label: "스퀘어", icon: "⬜" },
      { label: "코핀", icon: "⚰️" },
    ],
    length: [
      { label: "Long", icon: "📏" },
      { label: "Medium", icon: "📐" },
      { label: "Short", icon: "📌" },
    ],
    tpo: [
      { label: "데일리", icon: "☀️" },
      { label: "파티", icon: "🎉" },
      { label: "웨딩", icon: "💒" },
      { label: "공연", icon: "🎪" },
      { label: "Special day", icon: "🎁" },
    ],
    ab: [
      { label: "아티스트", icon: "👨‍🎨" },
      { label: "브랜드", icon: "🏷️" },
    ],
    nation: [
      { label: "K네일", icon: "🇰🇷" },
      { label: "J네일", icon: "🇯🇵" },
      { label: "A네일", icon: "🇺🇸" },
    ],
  } as const;

  const categories = [
    { name: "스타일", key: "style", items: G.style },
    { name: "컬러", key: "color", items: G.color },
    { name: "텍스쳐", key: "texture", items: G.texture },
    { name: "모양", key: "shape", items: G.shape },
    { name: "길이", key: "length", items: G.length },
    { name: "TPO", key: "tpo", items: G.tpo },
    { name: "아티스트/브랜드", key: "ab", items: G.ab },
    { name: "국가별", key: "nation", items: G.nation },
  ];

  return (
    <Drawer open={open} onClose={onClose} side="left">
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h2 id="drawer-title" className="text-lg font-semibold">카테고리</h2>
            <button 
              onClick={onClose} 
              className="text-black hover:text-gray-700 transition-colors duration-200 p-1"
              aria-label="카테고리 닫기"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category.name}>
                <h3 className="font-semibold text-base text-gray-800 mb-4">{category.name}</h3>
                <div className="grid grid-cols-3 gap-4">
                  {category.items.map(item => (
                    <button
                      key={item.label}
                      onClick={() => {
                        onGo(`/cat/${encodeURIComponent(category.key)}/${encodeURIComponent(item.label)}`);
                        onClose();
                      }}
                      className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                        {item.icon}
                      </div>
                      <span className="text-xs text-gray-700 font-medium text-center leading-tight">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}