import { useState, useEffect, useRef } from 'react';
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
  /** 토스트 메시지 표시 핸들러 (App.tsx에서 전달) */
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function CartContent({ mode, onClose, onBack, onCheckout, onCartUpdate, refreshTrigger, currentUser, showToast }: CartContentProps) {
  // 상태 관리
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // 제작 용량 관련 상태
  const [removedItems, setRemovedItems] = useState<RemovedItem[]>([]);
  const [capacityWarnings, setCapacityWarnings] = useState<CapacityWarning[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // 아이템 제거 관련 상태
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{ productId: string; options?: Record<string, string>; name: string } | null>(null);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [pendingUndo, setPendingUndo] = useState<{ productId: string; options?: Record<string, string>; previousCart: Cart } | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        // Cart 응답 구조: data에 직접 장바구니 정보
        const cartData = {
          ...response.data,
          items: response.data.items || [],
          totals: response.data.totals || {}
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
        // Cart 응답 구조 처리: data에 직접 장바구니 정보
        const cartData = {
          ...response.data,
          items: response.data.items || [],
          totals: response.data.totals || {}
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

  // 아이템 제거 - 개선된 버전
  const removeItem = (productId: string, options?: Record<string, string>, itemName?: string) => {
    setItemToRemove({ productId, options, name: itemName || '상품' });
    setShowRemoveModal(true);
  };

  // 실제 아이템 제거 처리 (낙관적 업데이트 + Undo 기능)
  const confirmRemoveItem = async () => {
    if (!itemToRemove || !cart) return;

    const { productId, options, name } = itemToRemove;
    setShowRemoveModal(false);

    // 이전 장바구니 상태 저장
    const previousCart = { ...cart };

    // 낙관적 UI 업데이트 - 즉시 아이템 제거 표시
    setRemovingItems(prev => new Set(prev).add(productId));

    // 이전 장바구니 상태를 저장하기 전에 현재 상태 기반으로 필터링
    setCart(prev => {
      if (!prev) return null;

      // prev.items를 사용하여 최신 상태에서 필터링 (stale closure 방지)
      const updatedItems = prev.items.filter(item => {
        const itemProductId = item.productUuid || item.product?.id;
        if (itemProductId !== productId) return true;
        if (options && JSON.stringify(item.options) !== JSON.stringify(options)) return true;
        return false;
      });

      return { ...prev, items: updatedItems };
    });

    // Undo 상태 설정
    setPendingUndo({ productId, options, previousCart });

    // 토스트 메시지 표시 (fallback)
    if (showToast) {
      showToast(`${name}이(가) 장바구니에서 제거되었어요`, 'info');
    }

    // 3초 후 API 호출
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    undoTimerRef.current = setTimeout(async () => {
      try {
        console.log('Removing cart item:', { productId, options });
        const response = await cartService.removeFromCart(productId, options);

        console.log('Remove cart response:', response);

        if (response.success && response.data) {
          const cartData = {
            ...response.data,
            items: response.data.items || [],
            totals: response.data.totals || {}
          };

          setCart(cartData);
          setRemovedItems(response.removedItems || []);
          setCapacityWarnings(response.capacityWarnings || []);
          setMessage(response.message || null);
          onCartUpdate?.();
        } else {
          throw new Error('상품 제거에 실패했습니다.');
        }
      } catch (err: any) {
        console.error('Remove cart item failed:', err);
        // 실패 시 이전 상태로 복원
        setCart(previousCart);
        if (showToast) {
          showToast(err.message || '상품 제거에 실패했습니다', 'error');
        }
      } finally {
        setRemovingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        setPendingUndo(null);
      }
    }, 3000);
  };

  // Undo 처리
  const handleUndo = () => {
    if (!pendingUndo) return;

    // 타이머 취소
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    // 이전 상태로 복원
    setCart(pendingUndo.previousCart);
    setRemovingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(pendingUndo.productId);
      return newSet;
    });
    setPendingUndo(null);

    if (showToast) {
      showToast('취소되었습니다', 'info');
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

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

  // 판매자별 그룹화된 장바구니 데이터 사용
  const itemsBySeller = cart?.itemsBySeller || [];
  const multiSellerTotals = cart?.multiSellerTotals;
  const cartSummary = cart?.summary;

  // 헤더 렌더링 (drawer 모드에서만 사용)
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

    // page 모드는 헤더 없음 (상위 컴포넌트에서 처리)
    return null;
  };

  // 로딩 상태
  const renderLoading = () => (
    <div className="animate-pulse space-y-3 sm:space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4"></div>
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
      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        {/* 다중 판매자 안내 */}
        {cartSummary?.hasMultipleSellers && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="text-blue-500 text-lg sm:text-xl flex-shrink-0">🚚</div>
              <div className="min-w-0">
                <div className="text-blue-800 font-medium text-sm sm:text-base">다중 판매자 주문</div>
                <div className="text-blue-700 text-xs sm:text-sm mt-0.5 sm:mt-1">
                  {cartSummary.totalSellers}개 판매자로부터 주문하여 개별 배송될 수 있습니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 제작 용량 관련 메시지 */}
        {message && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="text-orange-500 text-lg sm:text-xl flex-shrink-0">⚠️</div>
              <div className="text-orange-800 text-xs sm:text-sm">{message}</div>
            </div>
          </div>
        )}

        {/* 제거된 아이템들 */}
        {removedItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="text-red-800 font-medium mb-2 text-sm sm:text-base">제작 용량 부족으로 제거된 상품</div>
            {removedItems.map((item, index) => (
              <div key={index} className="text-red-700 text-xs sm:text-sm mb-1">
                • {item.productName}: {item.reason}
                (요청 {item.requestedQuantity}개 → 가능 {item.availableCapacity}개,
                다음 가능월: {item.nextAvailableMonth})
              </div>
            ))}
          </div>
        )}

        {/* 제작 용량 경고 */}
        {capacityWarnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <div className="text-yellow-800 font-medium mb-2 text-sm sm:text-base">제작 용량 주의</div>
            {capacityWarnings.map((warning, index) => (
              <div key={index} className="text-yellow-700 text-xs sm:text-sm mb-1">
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
    <div key={seller.sellerUuid} className="border rounded-lg mb-3 sm:mb-4 md:mb-6 overflow-hidden">
      {/* 판매자 헤더 */}
      <div className="bg-gray-50 border-b p-2 sm:p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            <h3 className="font-semibold text-sm sm:text-base md:text-lg leading-tight">{seller.sellerName}</h3>
          </div>
        </div>
      </div>

      {/* 판매자의 상품 목록 */}
      <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-2 sm:space-y-3 md:space-y-4">
        {seller.items.map((item: CartItem) => {
          // 새 API 구조: 플랫하게 productUuid 사용, 기존 구조 호환성 유지
          const productId = item.productUuid || item.product?.id;
          const productName = item.name || item.product?.name;
          const productMainImageUrl = item.mainImageUrl || item.product?.mainImageUrl;
          const productBrand = item.brand || item.product?.brand;
          const isUpdating = updatingItems.has(productId);
          const isRemoving = removingItems.has(productId);
          const itemKey = `${productId}-${JSON.stringify(item.options)}`;

          return (
            <div
              key={itemKey}
              className={`flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 transition-all duration-300 ${isUpdating ? 'opacity-50' : ''} ${isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            >
              {/* 상품 이미지 */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {productMainImageUrl ? (
                  <img
                    src={productMainImageUrl}
                    alt={productName}
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
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1 sm:gap-2">
                  <div className="flex-1 pr-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm md:text-base truncate leading-tight">{productName}</h4>
                    <div className="text-gray-500 text-[10px] sm:text-xs mt-0.5">
                      {productBrand && <span className="block sm:inline">{productBrand}</span>}
                      {item.options && (
                        <div className="mt-0.5 sm:mt-1 flex flex-wrap gap-0.5 sm:gap-1">
                          {Object.entries(item.options).map(([key, value]) => {
                            const optionNames: Record<string, string> = {
                              'nailShape': '쉐입',
                              'nailLength': '길이',
                              'nailSize': '사이즈'
                            };

                            const optionValues: Record<string, string> = {
                              'ROUND': '라운드',
                              'ALMOND': '아몬드',
                              'SQUARE': '스퀘어',
                              'OVAL': '오벌',
                              'COFFIN': '코핀',
                              'SHORT': '숏',
                              'MEDIUM': '미디움',
                              'LONG': '롱'
                            };

                            const displayKey = optionNames[key] || key;
                            const displayValue = optionValues[value as string] || value;

                            return (
                              <span key={key} className="inline-block bg-gray-100 px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-xs whitespace-nowrap">
                                {displayKey}: {displayValue}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(productId, item.options, productName)}
                    disabled={isUpdating}
                    className="text-gray-400 hover:text-red-500 p-1.5 sm:p-2 ml-auto flex-shrink-0 -mt-0.5 touch-manipulation"
                    title="상품 제거"
                  >
                    <span className="text-sm sm:text-base">✕</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-3">
                  {/* 수량 조절 */}
                  <div className="flex items-center border rounded touch-manipulation scale-90 sm:scale-100 origin-left">
                    <button
                      onClick={() => updateQuantity(productId, item.quantity - 1, item.options)}
                      disabled={isUpdating || item.quantity <= 1}
                      className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 hover:bg-gray-50 disabled:opacity-50 transition-colors min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center text-sm sm:text-base"
                    >
                      -
                    </button>
                    <div className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 min-w-[36px] sm:min-w-[50px] text-center border-x font-medium text-xs sm:text-sm">
                      {isUpdating ? '...' : item.quantity}
                    </div>
                    <button
                      onClick={() => updateQuantity(productId, item.quantity + 1, item.options)}
                      disabled={isUpdating}
                      className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 hover:bg-gray-50 disabled:opacity-50 transition-colors min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center text-sm sm:text-base"
                    >
                      +
                    </button>
                  </div>

                  {/* 가격 정보 */}
                  <div className="text-right ml-auto">
                    <div className="font-bold text-sm sm:text-base md:text-lg leading-tight">
                      {money(item.subtotal)}원
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
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
      <div className="bg-gray-50 border-t p-2 sm:p-3 md:p-4">
        <div className="flex items-center justify-between flex-wrap gap-1.5 sm:gap-2">
          <div>
            <div className="font-semibold text-xs sm:text-sm md:text-base">
              소계: {money(seller.subtotal)}원 ({seller.itemCount}개)
            </div>
          </div>
          <div className="text-right">
            {seller.shipping.isFreeShipping ? (
              <span className="text-green-600 font-medium text-xs sm:text-sm md:text-base">🚚 무료배송</span>
            ) : (
              <div>
                <span className="text-gray-700 text-xs sm:text-sm md:text-base">
                  배송비: {money(seller.shipping.shippingCost)}원
                </span>
                {seller.shipping.freeShippingRemaining > 0 && (
                  <div className="text-[10px] sm:text-xs text-blue-600 mt-0.5 sm:mt-1">
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

  // 장바구니 아이템 렌더링 (판매자별 그룹화)
  const renderCartItems = () => {
    return (
      <div className="space-y-6">
        {itemsBySeller.map(seller => renderSellerGroup(seller))}
      </div>
    );
  };

  // 주문 요약 렌더링 (다중 판매자 정보 우선 사용)
  const renderOrderSummary = () => {
    if (!cart || itemsBySeller.length === 0) return null;

    // 다중 판매자 정보가 있으면 우선 사용, 없으면 기존 정보 사용
    const totals = multiSellerTotals || cart.totals;
    const hasMultiSellerInfo = !!multiSellerTotals;

    const summary = (
      <>
        <div className="space-y-2 text-sm sm:text-base mb-4">
          <div className="flex items-center justify-between">
            <span>상품 금액</span>
            <span className="font-medium">{money(totals.subtotal)}원</span>
          </div>
          
          {hasMultiSellerInfo ? (
            /* 다중 판매자 배송비 상세 표시 */
            <div className="space-y-1">
              {multiSellerTotals!.totalShippingCost > 0 && (
                <div className="flex items-center justify-between">
                  <span>총 배송비</span>
                  <span className="font-medium">{money(multiSellerTotals!.totalShippingCost)}원</span>
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
                  <span className="font-medium">{money(cart.totals.shippingCost)}원</span>
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
        <div className="mb-4 flex items-center justify-between border-t pt-3">
          <span className="font-semibold text-base sm:text-lg">총 결제금액</span>
          <span className={`font-bold ${mode === 'drawer' ? 'text-lg' : 'text-xl sm:text-2xl'} text-blue-600`}>
            {money(totals.total)}원
          </span>
        </div>
        <button
          onClick={() => {
            onCheckout();
            if (mode === 'drawer' && onClose) onClose();
          }}
          className="w-full rounded-lg bg-black text-white font-semibold py-3 sm:py-4 hover:bg-gray-800 transition-colors touch-manipulation text-base sm:text-lg"
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
      <div className="border rounded-lg p-4 sm:p-5 lg:sticky lg:top-4">
        <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">주문 요약</h3>
        {summary}
        <div className="mt-4 text-xs sm:text-sm text-gray-500 text-center">
          • 최종 결제금액은 쿠폰 적용에 따라 달라질 수 있습니다
        </div>
      </div>
    );
  };

  // 확인 모달 렌더링
  const renderConfirmModal = () => {
    if (!showRemoveModal || !itemToRemove) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-fadeIn">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">상품 제거</h3>
          </div>

          {/* 본문 */}
          <div className="px-6 py-6">
            <p className="text-gray-700 leading-relaxed">
              <span className="font-medium text-gray-900">{itemToRemove.name}</span>을(를) 장바구니에서 제거하시겠어요?
            </p>
          </div>

          {/* 버튼 */}
          <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowRemoveModal(false);
                setItemToRemove(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={confirmRemoveItem}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              제거하기
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Undo 토스트 렌더링
  const renderUndoToast = () => {
    if (!pendingUndo) return null;

    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slideUp">
        <div className="bg-gray-900 text-white rounded-lg shadow-2xl px-5 py-4 flex items-center gap-4 min-w-[320px]">
          <div className="flex-1">
            <p className="text-sm font-medium">장바구니에서 제거되었어요</p>
          </div>
          <button
            onClick={handleUndo}
            className="px-3 py-1.5 text-sm font-medium bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-all"
          >
            실행취소
          </button>
        </div>
      </div>
    );
  };

  // 메인 콘텐츠 렌더링
  const renderContent = () => {
    if (loading) return renderLoading();
    if (error) return renderError();

    // 빈 장바구니 체크: 아이템이 없고, 제거 중인 아이템도 없고, 대기 중인 취소도 없는 경우에만 빈 상태 표시
    const hasItemsBeingRemoved = removingItems.size > 0;
    const hasPendingUndo = pendingUndo !== null;

    if (!cart || (itemsBySeller.length === 0 && !hasItemsBeingRemoved && !hasPendingUndo)) {
      return renderEmpty();
    }

    if (mode === 'drawer') {
      return (
        <>
          <div className="flex h-full flex-col">
            {renderHeader()}
            <div className="flex-1 overflow-y-auto p-4">
              {renderNotifications()}
              {renderCartItems()}
            </div>
            {renderOrderSummary()}
          </div>
          {renderConfirmModal()}
          {renderUndoToast()}
        </>
      );
    }

    return (
      <>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6">
          {renderHeader()}
          {renderNotifications()}
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              {renderCartItems()}
            </div>
            <div className="lg:col-span-1">
              {renderOrderSummary()}
            </div>
          </div>
        </div>
        {renderConfirmModal()}
        {renderUndoToast()}
      </>
    );
  };

  return renderContent();
}