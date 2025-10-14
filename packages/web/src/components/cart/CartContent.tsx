import { useState, useEffect } from 'react';
import { Cart, CartItem, CartItemsBySeller, CapacityWarning, RemovedItem, User } from '@handy-platform/shared';
import { cartService } from '../../services/apiService';
import { money } from '../../utils';

interface CartContentProps {
  /** 렌더링 모드 - drawer는 좁은 사이드바, page는 전체 화면 */
  mode: 'drawer' | 'page';
  /** 닫기 버튼 핸들러 (drawer 모드에서만 사용) */
  onClose?: () => void;
  /** 뒤로가기 핸들러 (page 모드에서만 사용) */
  onBack?: () => void;
  /** 체크아웃 진행 핸들러 */
  onCheckout: () => void;
  /** 장바구니 변경 시 호출될 콜백 (헤더 카운트 업데이트용) */
  onCartUpdate?: () => void;
  /** 새로고침 트리거 - 이 값이 변경될 때마다 장바구니 새로고침 */
  refreshTrigger?: any;
  /** 현재 로그인한 사용자 정보 */
  currentUser?: User | null;
}

export function CartContent({ mode, onClose, onBack, onCheckout, onCartUpdate, refreshTrigger, currentUser }: CartContentProps) {
  // 상태 관리
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  
  // 제작 용량 관련 상태
  const [removedItems, setRemovedItems] = useState<RemovedItem[]>([]);
  const [capacityWarnings, setCapacityWarnings] = useState<CapacityWarning[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // 장바구니 데이터 로딩
  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 로그인되지 않은 경우 빈 장바구니로 설정
      if (!currentUser) {
        setCart({ items: [], totals: {}, user: undefined });
        setLoading(false);
        return;
      }
      
      const response = await cartService.getCart();
      
      if (response.success && response.data) {
        // 새로운 응답 구조: data.cart가 아닌 data에 직접 장바구니 정보
        const cartData = {
          items: response.data.items || [],
          totals: response.data.totals || {},
          user: response.data.user
        };
        
        setCart(cartData);
        
        // 실제 API 응답에서 제작 용량 관련 정보 처리
        setRemovedItems(response.removedItems || []);
        setCapacityWarnings(response.capacityWarnings || []);
        setMessage(response.message || null);
        
      } else {
        throw new Error('장바구니 정보를 불러올 수 없습니다.');
      }
    } catch (err: any) {
      setError(err.message || '장바구니를 불러오는데 실패했습니다.');
      console.error('Cart fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [currentUser]);

  // refreshTrigger가 변경될 때마다 장바구니 새로고침 (drawer가 열릴 때)
  useEffect(() => {
    if (refreshTrigger) {
      loadCart();
    }
  }, [refreshTrigger]);

  // 수량 변경
  const updateQuantity = async (productId: string, quantity: number, options?: Record<string, string>) => {
    if (quantity < 1) return;
    
    try {
      setUpdatingItems(prev => new Set(prev).add(productId));
      
      console.log('Updating cart item:', { productId, quantity, options });
      const response = await cartService.updateCartItem(productId, quantity, options);
      
      console.log('Update cart response:', response);
      
      if (response.success && response.data) {
        // 새로운 응답 구조 처리
        const cartData = {
          items: response.data.items || [],
          totals: response.data.totals || {},
          user: response.data.user
        };
        
        setCart(cartData);
        
        // 제작 용량 관련 정보도 업데이트
        setRemovedItems(response.removedItems || []);
        setCapacityWarnings(response.capacityWarnings || []);
        setMessage(response.message || null);
        
        onCartUpdate?.();
      } else {
        throw new Error('수량 변경에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Update cart item failed:', err);
      alert(err.message || '수량 변경에 실패했습니다.');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // 아이템 제거
  const removeItem = async (productId: string, options?: Record<string, string>) => {
    if (!confirm('이 상품을 장바구니에서 제거하시겠습니까?')) return;
    
    try {
      setUpdatingItems(prev => new Set(prev).add(productId));
      
      console.log('Removing cart item:', { productId, options });
      const response = await cartService.removeFromCart(productId, options);
      
      console.log('Remove cart response:', response);
      
      if (response.success && response.data) {
        // 새로운 응답 구조 처리
        const cartData = {
          items: response.data.items || [],
          totals: response.data.totals || {},
          user: response.data.user
        };
        
        setCart(cartData);
        
        // 제작 용량 관련 정보도 업데이트
        setRemovedItems(response.removedItems || []);
        setCapacityWarnings(response.capacityWarnings || []);
        setMessage(response.message || null);
        
        onCartUpdate?.();
      } else {
        throw new Error('상품 제거에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Remove cart item failed:', err);
      alert(err.message || '상품 제거에 실패했습니다.');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // 전체 장바구니 비우기 (page 모드에서만)
  const clearAllItems = async () => {
    if (!confirm('장바구니를 전체 비우시겠습니까?')) return;
    
    try {
      setLoading(true);
      
      console.log('Clearing all cart items...');
      const response = await cartService.clearCart();
      
      console.log('Clear cart response:', response);
      
      if (response.success) {
        // 빈 장바구니 상태로 설정
        setCart(null);
        setRemovedItems([]);
        setCapacityWarnings([]);
        setMessage(null);
        
        onCartUpdate?.();
      } else {
        throw new Error('장바구니 비우기에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Clear cart failed:', err);
      alert(err.message || '장바구니 비우기에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 판매자별 그룹화를 우선 사용, 없으면 기존 items 사용
  const cartItems = cart?.items || [];
  const itemsBySeller = cart?.itemsBySeller || [];
  const useSellerGrouping = itemsBySeller.length > 0;
  const multiSellerTotals = cart?.multiSellerTotals;
  const cartSummary = cart?.summary;

  // 헤더 렌더링
  const renderHeader = () => {
    if (mode === 'drawer') {
      return (
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">장바구니</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-full"
            aria-label="장바구니 닫기"
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-black">← 뒤로</button>
          <h1 className="text-2xl font-bold">장바구니</h1>
          <span className="text-gray-500">
            ({cartItems.length}개 상품)
          </span>
        </div>
        {cartItems.length > 0 && (
          <button 
            onClick={clearAllItems} 
            className="text-sm text-red-500 hover:underline"
          >
            전체 삭제
          </button>
        )}
      </div>
    );
  };

  // 로딩 상태
  const renderLoading = () => (
    <div className="animate-pulse space-y-4">
      {mode === 'page' && <div className="h-8 bg-gray-200 rounded w-32"></div>}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 p-4 border rounded-lg">
          <div className="w-16 h-16 bg-gray-200 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // 에러 상태
  const renderError = () => (
    <div className="text-center py-12">
      <div className="text-gray-500 mb-4">장바구니를 불러올 수 없습니다</div>
      <div className="text-sm text-red-500 mb-4">{error}</div>
      <div className="space-x-3">
        <button onClick={loadCart} className="px-4 py-2 bg-black text-white rounded">다시 시도</button>
        {mode === 'page' && onBack && (
          <button onClick={onBack} className="px-4 py-2 border rounded">← 뒤로가기</button>
        )}
      </div>
    </div>
  );

  // 알림 메시지들 렌더링
  const renderNotifications = () => {
    if (!message && removedItems.length === 0 && capacityWarnings.length === 0 && !cartSummary?.hasMultipleSellers) {
      return null;
    }

    return (
      <div className="space-y-3 mb-6">
        {/* 다중 판매자 안내 */}
        {cartSummary?.hasMultipleSellers && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 text-xl">🚚</div>
              <div>
                <div className="text-blue-800 font-medium">다중 판매자 주문</div>
                <div className="text-blue-700 text-sm mt-1">
                  {cartSummary.totalSellers}개 판매자로부터 주문하여 개별 배송될 수 있습니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 제작 용량 관련 메시지 */}
        {message && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-orange-500 text-xl">⚠️</div>
              <div className="text-orange-800">{message}</div>
            </div>
          </div>
        )}

        {/* 제거된 아이템들 */}
        {removedItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium mb-2">제작 용량 부족으로 제거된 상품</div>
            {removedItems.map((item, index) => (
              <div key={index} className="text-red-700 text-sm mb-1">
                • {item.productName}: {item.reason} 
                (요청 {item.requestedQuantity}개 → 가능 {item.availableCapacity}개, 
                다음 가능월: {item.nextAvailableMonth})
              </div>
            ))}
          </div>
        )}

        {/* 제작 용량 경고 */}
        {capacityWarnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-yellow-800 font-medium mb-2">제작 용량 주의</div>
            {capacityWarnings.map((warning, index) => (
              <div key={index} className="text-yellow-700 text-sm mb-1">
                • {warning.sellerName}: {warning.message} 
                (남은 용량: {warning.remainingCapacity}/{warning.totalCapacity}개)
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 빈 장바구니
  const renderEmpty = () => (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🛒</div>
      <div className={`font-semibold mb-2 ${mode === 'drawer' ? 'text-lg' : 'text-xl'}`}>
        장바구니가 비어있습니다
      </div>
      <div className="text-gray-500 mb-6">마음에 드는 상품을 장바구니에 담아보세요!</div>
      {mode === 'page' && onBack && (
        <button onClick={onBack} className="px-6 py-3 bg-black text-white rounded-lg">쇼핑 계속하기</button>
      )}
    </div>
  );

  // 판매자별 그룹화된 장바구니 아이템 렌더링
  const renderSellerGroup = (seller: CartItemsBySeller) => (
    <div key={seller.sellerUuid} className="border rounded-lg mb-6 overflow-hidden">
      {/* 판매자 헤더 */}
      <div className="bg-gray-50 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-semibold text-lg">{seller.sellerName}</h3>
              <div className="flex items-center gap-2 mt-1">
                {seller.sellerInfo.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    ✓ 인증판매자
                  </span>
                )}
                <span className="text-sm text-gray-600">
                  배송: {seller.sellerInfo.estimatedDeliveryDays.min}-{seller.sellerInfo.estimatedDeliveryDays.max}일
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 판매자의 상품 목록 */}
      <div className="p-4 space-y-4">
        {seller.items.map((item: CartItem) => {
          const productId = item.product.id; // 새 API는 id 필드 사용
          const isUpdating = updatingItems.has(productId);
          const itemKey = `${productId}-${JSON.stringify(item.options)}`;
          
          return (
            <div 
              key={itemKey}
              className={`flex gap-4 transition-all duration-200 ${isUpdating ? 'opacity-50' : ''}`}
            >
              {/* 상품 이미지 */}
              <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {item.product.mainImageUrl ? (
                  <img 
                    src={item.product.mainImageUrl} 
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 상품 정보 */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{item.product.name}</h4>
                    <div className="text-gray-500 text-sm mt-1">
                      {item.product.seller?.name}
                      {item.options && (
                        <div className="mt-1 space-x-1">
                          {Object.entries(item.options).map(([key, value]) => (
                            <span key={key} className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(productId, item.options)}
                    disabled={isUpdating}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="상품 제거"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {/* 수량 조절 */}
                  <div className="flex items-center border rounded">
                    <button
                      onClick={() => updateQuantity(productId, item.quantity - 1, item.options)}
                      disabled={isUpdating || item.quantity <= 1}
                      className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                    >
                      -
                    </button>
                    <div className="px-4 py-2 min-w-[50px] text-center border-x">
                      {isUpdating ? '...' : item.quantity}
                    </div>
                    <button
                      onClick={() => updateQuantity(productId, item.quantity + 1, item.options)}
                      disabled={isUpdating}
                      className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  {/* 가격 정보 */}
                  <div className="text-right">
                    <div className="font-semibold">
                      {money(item.subtotal)}원
                    </div>
                    <div className="text-xs text-gray-500">
                      개당 {money(item.price)}원
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 판매자별 소계 및 배송 정보 */}
      <div className="bg-gray-50 border-t p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">
              소계: {money(seller.subtotal)}원 ({seller.itemCount}개)
            </div>
          </div>
          <div className="text-right">
            {seller.shipping.isFreeShipping ? (
              <span className="text-green-600 font-medium">🚚 무료배송</span>
            ) : (
              <div>
                <span className="text-gray-700">
                  배송비: {money(seller.shipping.shippingCost)}원
                </span>
                {seller.shipping.freeShippingRemaining > 0 && (
                  <div className="text-xs text-blue-600 mt-1">
                    {money(seller.shipping.freeShippingRemaining)}원 더 구매하면 무료배송
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 장바구니 아이템 렌더링 (판매자별 그룹화 또는 기존 방식)
  const renderCartItems = () => {
    if (useSellerGrouping) {
      return (
        <div className="space-y-6">
          {itemsBySeller.map(seller => renderSellerGroup(seller))}
        </div>
      );
    }

    // 기존 렌더링 방식 (하위 호환성)
    return (
      <div className={mode === 'drawer' ? 'space-y-4' : 'space-y-4'}>
        {cartItems.map((item: CartItem) => {
          const productId = item.product.id; // 새 API는 id 필드 사용
          const isUpdating = updatingItems.has(productId);
          const itemKey = `${productId}-${JSON.stringify(item.options)}`;
        
        return (
          <div 
            key={itemKey}
            className={`${
              mode === 'drawer' 
                ? 'flex gap-3 border-b pb-4 transition-all duration-200 hover:bg-gray-50 p-2 rounded-lg -m-2' 
                : 'border rounded-lg p-4'
            } ${isUpdating ? 'opacity-50' : ''}`}
          >
            <div className={mode === 'drawer' ? 'flex gap-3' : 'flex gap-4'}>
              {/* 상품 이미지 */}
              <div className={`rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 ${
                mode === 'drawer' ? 'w-16 h-16' : 'w-20 h-20'
              }`}>
                {item.product.mainImageUrl ? (
                  <img 
                    src={item.product.mainImageUrl} 
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-gray-400">
                          <svg class="${mode === 'drawer' ? 'w-6 h-6' : 'w-8 h-8'}" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className={mode === 'drawer' ? 'w-6 h-6' : 'w-8 h-8'} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 상품 정보 */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`font-semibold ${mode === 'drawer' ? 'text-sm' : 'text-base'}`}>
                      {item.product.name}
                    </h4>
                    <div className={`text-gray-500 mt-1 ${mode === 'drawer' ? 'text-xs' : 'text-sm'}`}>
                      {item.product.seller?.name}
                      {item.options && (
                        <div className="mt-1">
                          {Object.entries(item.options).map(([key, value]) => (
                            <span key={key} className="inline-block bg-gray-100 px-2 py-0.5 rounded mr-1">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(productId, item.options)}
                    disabled={isUpdating}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className={`flex items-center justify-between ${mode === 'drawer' ? 'mt-2' : 'mt-3'}`}>
                  {/* 수량 조절 */}
                  <div className="flex items-center border rounded">
                    <button
                      onClick={() => updateQuantity(productId, item.quantity - 1, item.options)}
                      disabled={isUpdating || item.quantity <= 1}
                      className="px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                    >
                      -
                    </button>
                    <div className="px-3 py-1 min-w-[40px] text-center">
                      {isUpdating ? '...' : item.quantity}
                    </div>
                    <button
                      onClick={() => updateQuantity(productId, item.quantity + 1, item.options)}
                      disabled={isUpdating}
                      className="px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  {/* 가격 */}
                  <div className="text-right">
                    <div className="font-semibold">
                      {money(item.subtotal)}원
                    </div>
                    {mode === 'page' && (
                      <div className="text-xs text-gray-500">
                        개당 {money(item.price)}원
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>
    );
  };

  // 주문 요약 렌더링 (다중 판매자 정보 우선 사용)
  const renderOrderSummary = () => {
    if (!cart || cartItems.length === 0) return null;

    // 다중 판매자 정보가 있으면 우선 사용, 없으면 기존 정보 사용
    const totals = multiSellerTotals || cart.totals;
    const hasMultiSellerInfo = !!multiSellerTotals;

    const summary = (
      <>
        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center justify-between">
            <span>상품 금액</span>
            <span>{money(totals.subtotal)}원</span>
          </div>
          
          {hasMultiSellerInfo ? (
            /* 다중 판매자 배송비 상세 표시 */
            <div className="space-y-1">
              {multiSellerTotals!.totalShippingCost > 0 && (
                <div className="flex items-center justify-between">
                  <span>총 배송비</span>
                  <span>{money(multiSellerTotals!.totalShippingCost)}원</span>
                </div>
              )}
              
              {/* 판매자별 배송비 안내 */}
              {multiSellerTotals!.shippingBreakdown.totalSellers > 1 && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {multiSellerTotals!.shippingBreakdown.freeShippingSellers}/{multiSellerTotals!.shippingBreakdown.totalSellers} 판매자 무료배송
                  {multiSellerTotals!.shippingBreakdown.averageDeliveryDays && (
                    <span className="block mt-1">
                      평균 배송: {multiSellerTotals!.shippingBreakdown.averageDeliveryDays}일
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* 기존 단일 판매자 방식 */
            <>
              {cart.totals.shippingCost > 0 && (
                <div className="flex items-center justify-between">
                  <span>배송비</span>
                  <span>{money(cart.totals.shippingCost)}원</span>
                </div>
              )}
              {cart.totals.freeShippingRemaining > 0 && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  {money(cart.totals.freeShippingRemaining)}원 더 구매하면 무료배송!
                </div>
              )}
            </>
          )}
          
          
          {/* 제작 일정 정보 */}
          {hasMultiSellerInfo && multiSellerTotals!.estimatedProductionTime > 0 && (
            <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
              예상 제작 기간: {multiSellerTotals!.estimatedProductionTime}일
              {multiSellerTotals!.earliestDeliveryDate && (
                <span className="block mt-1">
                  최빠른 배송일: {new Date(multiSellerTotals!.earliestDeliveryDate).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
          
          <hr />
        </div>
        <div className="mb-4 flex items-center justify-between">
          <span className="font-semibold">총 결제금액</span>
          <span className={`font-bold ${mode === 'drawer' ? 'text-lg' : 'text-xl'}`}>
            {money(totals.total)}원
          </span>
        </div>
        <button 
          onClick={() => {
            onCheckout();
            if (mode === 'drawer' && onClose) onClose();
          }}
          className="w-full rounded-lg bg-black text-white font-semibold py-3 hover:bg-gray-800 transition-colors"
        >
          주문하기
        </button>
      </>
    );

    if (mode === 'drawer') {
      return (
        <div className="border-t p-4">
          {summary}
        </div>
      );
    }

    return (
      <div className="border rounded-lg p-4 sticky top-4">
        <h3 className="font-semibold mb-4">주문 요약</h3>
        {summary}
        <div className="mt-4 text-xs text-gray-500 text-center">
          • 최종 결제금액은 쿠폰 적용에 따라 달라질 수 있습니다
        </div>
      </div>
    );
  };

  // 메인 콘텐츠 렌더링
  const renderContent = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    if (!cart || cartItems.length === 0) return renderEmpty();

    if (mode === 'drawer') {
      return (
        <div className="flex h-full flex-col">
          {renderHeader()}
          <div className="flex-1 overflow-y-auto p-4">
            {renderNotifications()}
            {renderCartItems()}
          </div>
          {renderOrderSummary()}
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        {renderHeader()}
        {renderNotifications()}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {renderCartItems()}
          </div>
          <div className="lg:col-span-1">
            {renderOrderSummary()}
          </div>
        </div>
      </div>
    );
  };

  return renderContent();
}