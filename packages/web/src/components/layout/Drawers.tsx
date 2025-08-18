import { Drawer } from '../ui';
import { products } from '../../data';
import { money } from '../../utils';

// Cart Drawer
export function CartDrawer({
  open,
  onClose,
  items,
  onRemove,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  items: {id: string; qty: number}[];
  onRemove: (id: string) => void;
  onCheckout: (total: number) => void;
}) {
  const cartItems = items.map(item => {
    const product = products.find(p => p.id === item.id);
    return product ? { ...item, product } : null;
  }).filter(Boolean) as Array<{id: string; qty: number; product: typeof products[0]}>;

  const total = cartItems.reduce((sum, item) => {
    const salePrice = item.product.sale 
      ? Math.round(item.product.price * (100 - item.product.sale) / 100)
      : item.product.price;
    return sum + (salePrice * item.qty);
  }, 0);

  return (
    <Drawer open={open} onClose={onClose} side="right">
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">장바구니</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
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
                  <div key={item.id} className="flex gap-3 border-b pb-4">
                    <img src={item.product.image} className="h-16 w-16 rounded object-cover" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{item.product.name}</h3>
                      <p className="text-xs text-gray-500">{item.product.brand}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-semibold">{money(salePrice)}원</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">수량: {item.qty}</span>
                          <button 
                            onClick={() => onRemove(item.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
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
              className="w-full rounded-lg bg-black py-3 text-white font-medium"
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
  const categories = [
    { name: "네일 팁", items: ["아몬드", "스퀘어", "오벌", "코핀"] },
    { name: "네일 젤", items: ["클리어", "컬러", "글리터", "매트"] },
    { name: "케어 제품", items: ["큐티클 오일", "핸드크림", "네일 파일"] },
    { name: "도구", items: ["사이징 카드", "LED 램프", "브러시"] },
  ];

  return (
    <Drawer open={open} onClose={onClose} side="left">
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">카테고리</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category.name}>
                <h3 className="font-semibold text-sm text-gray-800 mb-2">{category.name}</h3>
                <div className="space-y-1">
                  {category.items.map(item => (
                    <button
                      key={item}
                      onClick={() => {
                        onGo(`/cat/${encodeURIComponent(category.name)}/${encodeURIComponent(item)}`);
                        onClose();
                      }}
                      className="block w-full text-left py-2 px-3 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      {item}
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