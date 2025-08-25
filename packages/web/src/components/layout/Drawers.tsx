import { Drawer } from '../ui';
import { products } from '../../data';
import { money } from '../../utils';

// Cart Drawer
export function CartDrawer({
  open,
  onClose,
  items,
  onRemove,
  onUpdateQuantity,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  items: {productId: string; qty: number}[];
  onRemove: (id: string) => void;
  onUpdateQuantity?: (id: string, qty: number) => void;
  onCheckout: (total: number) => void;
}) {
  const cartItems = items.map(item => {
    const product = products.find(p => p.productId === item.productId);
    return product ? { ...item, product } : null;
  }).filter(Boolean) as Array<{productId: string; qty: number; product: typeof products[0]}>;

  const total = cartItems.reduce((sum, item) => {
    const salePrice = item.product.salePrice || item.product.price;
    return sum + (salePrice * item.qty);
  }, 0);

  return (
    <Drawer open={open} onClose={onClose} side="right">
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h2 id="drawer-title" className="text-lg font-semibold">장바구니</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-full"
              aria-label="장바구니 닫기"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p>장바구니가 비어있습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => {
                const salePrice = item.product.sale 
                  ? Math.round(item.product.price * (100 - item.product.sale) / 100)
                  : item.product.price;
                return (
                  <div key={item.productId} className="flex gap-3 border-b pb-4 transition-all duration-200 hover:bg-gray-50 p-2 rounded-lg -m-2">
                    <img src={item.product.image} className="h-16 w-16 rounded object-cover transition-transform duration-200 hover:scale-105" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{item.product.name}</h3>
                      <p className="text-xs text-gray-500">{item.product.brand}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold">{money(salePrice)}원</span>
                        <button 
                          onClick={() => onRemove(item.productId)}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-all duration-200"
                        >
                          삭제
                        </button>
                      </div>
                      {onUpdateQuantity && (
                        <div className="mt-2 flex items-center justify-center">
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.qty - 1))}
                              disabled={item.qty <= 1}
                              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              aria-label="수량 감소"
                            >
                              −
                            </button>
                            <span className="w-12 text-center text-sm font-medium border-x py-1">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.productId, Math.min(99, item.qty + 1))}
                              disabled={item.qty >= 99}
                              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              aria-label="수량 증가"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="border-t p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">총 금액</span>
              <span className="text-lg font-bold">{money(total)}원</span>
            </div>
            <button 
              onClick={() => onCheckout(total)}
              className="w-full rounded-lg bg-black py-3 text-white font-medium transition-all duration-200 hover:bg-gray-800 active:scale-95 shadow-lg hover:shadow-xl"
            >
              주문하기
            </button>
          </div>
        )}
      </div>
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
      { label: "레드 계열", icon: "🔴" },
      { label: "핑크 계열", icon: "🩷" },
      { label: "블루 계열", icon: "🔵" },
      { label: "그린 계열", icon: "🟢" },
      { label: "뉴트럴", icon: "🤎" },
      { label: "블랙/화이트", icon: "⚫" },
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
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-full"
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