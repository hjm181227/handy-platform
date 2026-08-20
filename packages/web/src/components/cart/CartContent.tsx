import { useState, useEffect, useRef } from 'react';
import { Cart, CartItem, CartItemsBySeller, CartTotals, CapacityWarning, RemovedItem, User } from '@handy-platform/shared';
import { cartService } from '../../services/apiService';
import { money } from '../../utils';
import { ShoppingCart } from 'lucide-react';

/**
 * API 응답 데이터를 프론트엔드 Cart 타입에 맞게 변환
 * API는 productTotal/shippingTotal/paymentTotal을 보내지만
 * 프론트엔드는 subtotal/shippingCost/total을 기대함
 */
const mapApiResponseToCart = (apiData: any): Cart => {
  // 전체 아이템 개수 계산
  let totalItemCount = 0;
  if (apiData.itemsBySeller) {
    apiData.itemsBySeller.forEach((seller: any) => {
      if (seller.items) {
        totalItemCount += seller.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      }
    });
  }

  // itemsBySeller의 shipping 구조 변환 (cost → shippingCost) 및 itemCount 계산
  const itemsBySeller = (apiData.itemsBySeller || []).map((seller: any) => {
    // 판매자별 아이템 개수 계산
    const itemCount = seller.itemCount || (seller.items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

    return {
      ...seller,
      itemCount, // 아이템 개수 추가
      shipping: {
        ...seller.shipping,
        // API는 cost를 보내지만, 프론트엔드는 shippingCost를 기대
        shippingCost: seller.shipping?.cost || seller.shipping?.shippingCost || 0,
        // freeShippingRemaining 계산
        freeShippingRemaining: seller.shipping?.freeShippingRemaining ||
          (seller.shipping?.freeShippingThreshold && seller.subtotal < seller.shipping.freeShippingThreshold
            ? seller.shipping.freeShippingThreshold - seller.subtotal
            : 0)
      }
    };
  });

  return {
    ...apiData,
    items: apiData.items || [],
    itemsBySeller,
    totals: {
      subtotal: apiData.totals?.productTotal || 0,
      shippingCost: apiData.totals?.shippingTotal || 0,
      total: apiData.totals?.paymentTotal || 0,
      tax: apiData.totals?.tax || 0,
      itemCount: totalItemCount,
      freeShippingRemaining: apiData.totals?.freeShippingRemaining || 0,
    }
  };
};

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
  /** 현재 로그인한 사용자 정보 */
  currentUser?: User | null;
  /** 토스트 메시지 표시 핸들러 (App.tsx에서 전달) */
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  /** Drawer 열림 상태 (drawer 모드에서만 사용, drawer가 열릴 때 장바구니 갱신) */
  isDrawerOpen?: boolean;
}

export function CartContent({ mode, onClose, onBack, onCheckout, onCartUpdate, currentUser, showToast, isDrawerOpen }: CartContentProps) {
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
  // 언마운트 시 아직 서버에 반영되지 않은 삭제를 flush하기 위한 참조
  const pendingRemovalRef = useRef<{ productId: string; options?: Record<string, string> } | null>(null);

  // 선택 주문/삭제 관련 상태 — 기본은 전체 선택이므로 "선택 해제된 항목"만 추적한다
  const [deselectedKeys, setDeselectedKeys] = useState<Set<string>>(new Set());

  // 장바구니 데이터 로딩
  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);

      // 로그인되지 않은 경우 빈 장바구니로 설정
      if (!currentUser) {
        // 빈 장바구니: totals는 렌더링 시 옵셔널 접근으로만 읽으므로 빈 객체를 그대로 둔다
        setCart({ items: [], totals: {} as CartTotals, user: undefined });
        setLoading(false);
        return;
      }

      const response = await cartService.getCart();

      if (response.success && response.data) {
        // API 응답을 프론트엔드 타입에 맞게 변환
        const cartData = mapApiResponseToCart(response.data);

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

  // Drawer가 열릴 때 장바구니 갱신 (drawer 모드일 때만)
  useEffect(() => {
    if (mode === 'drawer' && isDrawerOpen) {
      loadCart();
    }
  }, [isDrawerOpen, mode]);

  // 수량 변경
  const updateQuantity = async (productId: string, quantity: number, options?: Record<string, string>) => {
    if (quantity < 1) return;

    // 안전성 체크: cart가 없으면 실행하지 않음
    if (!cart) {
      console.warn('Cart is not loaded, skipping update');
      return;
    }

    try {
      setUpdatingItems(prev => new Set(prev).add(productId));

      // ✅ 1. 낙관적 UI 업데이트 - 즉시 수량 변경 반영 (UI 흔들림 방지)
      setCart(prev => {
        if (!prev) return prev; // null이면 그대로 유지 (빈 장바구니 표시 방지)

        // items 배열 업데이트
        const updatedItems = prev.items.map(item => {
          const itemProductId = item.productUuid;
          const matchesProduct = itemProductId === productId;
          const matchesOptions = !options || JSON.stringify(item.options) === JSON.stringify(options);

          if (matchesProduct && matchesOptions) {
            return { ...item, quantity, subtotal: item.price * quantity };
          }
          return item;
        });

        // itemsBySeller 배열 업데이트
        const updatedItemsBySeller = (prev.itemsBySeller || []).map(seller => {
          const updatedSellerItems = seller.items.map(item => {
            const itemProductId = item.productUuid;
            const matchesProduct = itemProductId === productId;
            const matchesOptions = !options || JSON.stringify(item.options) === JSON.stringify(options);

            if (matchesProduct && matchesOptions) {
              return { ...item, quantity, subtotal: item.price * quantity };
            }
            return item;
          });

          const itemCount = updatedSellerItems.reduce((sum, item) => sum + item.quantity, 0);
          const subtotal = updatedSellerItems.reduce((sum, item) => sum + item.subtotal, 0);

          return {
            ...seller,
            items: updatedSellerItems,
            itemCount,
            subtotal
          };
        });

        // 전체 totals 재계산
        const totalItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const newSubtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

        return {
          ...prev,
          items: updatedItems,
          itemsBySeller: updatedItemsBySeller,
          totals: {
            ...prev.totals,
            itemCount: totalItemCount,
            subtotal: newSubtotal,
            total: newSubtotal + (prev.totals?.shippingCost || 0)
          }
        };
      });

      // ✅ 2. API 호출 (백그라운드에서)
      console.log('Updating cart item:', { productId, quantity, options });
      const response = await cartService.updateCartItem(productId, quantity, options);

      console.log('Update cart response:', response);

      if (response.success) {
        // ✅ 3. 수량 변경 성공 → 최신 cart 정보 재로드
        // 서버 DB에 이미 수량이 변경되었으므로, GET /api/cart로 최신 정보 패치
        // 서버가 정확한 배송비, totals를 계산해서 보내줌
        await loadCart();
        onCartUpdate?.();
      } else {
        throw new Error('수량 변경에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Update cart item failed:', err);

      // ✅ 4. 실패 시 원래 데이터로 롤백 (재로드)
      await loadCart();

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

      // ✅ 1. items 배열 필터링 (stale closure 방지)
      const updatedItems = prev.items.filter(item => {
        const itemProductId = item.productUuid;
        if (itemProductId !== productId) return true;
        if (options && JSON.stringify(item.options) !== JSON.stringify(options)) return true;
        return false;
      });

      // ✅ 2. itemsBySeller 배열도 필터링 (UI 즉시 업데이트)
      const updatedItemsBySeller = (prev.itemsBySeller || [])
        .map(seller => {
          // 판매자의 아이템 필터링
          const filteredItems = seller.items.filter(item => {
            const itemProductId = item.productUuid;
            if (itemProductId !== productId) return true;
            if (options && JSON.stringify(item.options) !== JSON.stringify(options)) return true;
            return false;
          });

          // 판매자별 아이템 개수 및 소계 재계산
          const itemCount = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
          const subtotal = filteredItems.reduce((sum, item) => sum + item.subtotal, 0);

          return {
            ...seller,
            items: filteredItems,
            itemCount,
            subtotal
          };
        })
        .filter(seller => seller.items.length > 0); // 빈 판매자 그룹 제거

      // ✅ 3. 전체 totals 재계산
      const totalItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const newSubtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        ...prev,
        items: updatedItems,
        itemsBySeller: updatedItemsBySeller,
        totals: {
          ...prev.totals,
          itemCount: totalItemCount,
          subtotal: newSubtotal,
          total: newSubtotal + (prev.totals?.shippingCost || 0)
        }
      };
    });

    // Undo 상태 설정
    setPendingUndo({ productId, options, previousCart });

    // 토스트 메시지 제거 - 낙관적 UI 업데이트만으로 충분
    // 사용자는 이미 아이템이 화면에서 사라지는 것을 보고 있으며,
    // Undo 알림도 표시되므로 추가 토스트 불필요

    // ✅ 즉시 장바구니 업데이트 (헤더 카운트 및 드로어 갱신)
    onCartUpdate?.();

    // 3초 후 API 호출
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    pendingRemovalRef.current = { productId, options };

    undoTimerRef.current = setTimeout(async () => {
      pendingRemovalRef.current = null;
      try {
        console.log('Removing cart item:', { productId, options });
        const response = await cartService.removeFromCart(productId, options);

        console.log('Remove cart response:', response);

        if (response.success) {
          // 제거 성공 → 최신 cart 정보 재로드
          // 서버 DB에서 상품이 이미 제거되었으므로, GET /api/cart로 최신 정보 패치
          await loadCart();
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
    pendingRemovalRef.current = null;

    // 이전 상태로 복원
    setCart(pendingUndo.previousCart);

    // ✅ Undo 시에도 장바구니 업데이트 (헤더 카운트 및 드로어 갱신)
    onCartUpdate?.();

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

  // 컴포넌트 언마운트 시: 타이머만 취소하면 사용자가 삭제한 상품이 서버에 남아
  // 다시 살아나므로, 대기 중인 삭제를 즉시 서버에 반영(flush)한다
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      const pending = pendingRemovalRef.current;
      if (pending) {
        pendingRemovalRef.current = null;
        cartService.removeFromCart(pending.productId, pending.options)
          .then(() => onCartUpdate?.())
          .catch(err => console.error('Failed to flush pending cart removal:', err));
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

  // ===== 선택 주문/삭제 관련 파생 값 =====
  // 아이템 식별 키 (기존 itemKey와 동일한 규칙: productUuid + options)
  const getItemKey = (item: CartItem) => `${item.productUuid}-${JSON.stringify(item.options)}`;
  const allItems: CartItem[] = itemsBySeller.flatMap(seller => seller.items);
  const selectedItems = allItems.filter(item => !deselectedKeys.has(getItemKey(item)));
  const allSelected = allItems.length > 0 && selectedItems.length === allItems.length;
  const selectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + (item.subtotal ?? item.price * item.quantity), 0);

  // 장바구니가 갱신되면 더 이상 존재하지 않는 아이템의 선택 해제 상태를 정리한다
  // (새로 담긴 상품은 자동으로 "선택됨" 상태가 됨)
  useEffect(() => {
    if (!cart) return;
    const validKeys = new Set(
      (cart.itemsBySeller || []).flatMap(seller => seller.items.map(getItemKey))
    );
    setDeselectedKeys(prev => {
      if (prev.size === 0) return prev;
      const next = new Set(Array.from(prev).filter(key => validKeys.has(key)));
      return next.size === prev.size ? prev : next;
    });
  }, [cart]);

  // 개별 아이템 선택/해제 토글
  const toggleItemSelection = (key: string) => {
    setDeselectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // 전체선택/전체해제 토글
  const toggleSelectAll = () => {
    if (allSelected) {
      setDeselectedKeys(new Set(allItems.map(getItemKey)));
    } else {
      setDeselectedKeys(new Set());
    }
  };

  // 선택된 아이템 일괄 삭제
  const removeSelectedItems = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`선택한 ${selectedItems.length}개 상품을 장바구니에서 삭제하시겠습니까?`)) return;

    // 대기 중인 단건 삭제(undo 타이머)가 있으면 먼저 서버에 flush하여
    // 일괄 삭제 후 타이머가 뒤늦게 실행되며 상태를 되돌리는 문제를 방지한다
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    const pending = pendingRemovalRef.current;
    pendingRemovalRef.current = null;
    setPendingUndo(null);

    try {
      setLoading(true);

      if (pending) {
        try {
          await cartService.removeFromCart(pending.productId, pending.options);
        } catch (flushErr) {
          console.error('Failed to flush pending cart removal before bulk delete:', flushErr);
        }
      }

      if (allSelected) {
        // 전체 선택 상태면 clearCart 한 번으로 처리
        const response = await cartService.clearCart();
        if (!response.success) {
          throw new Error('선택 상품 삭제에 실패했습니다.');
        }
      } else {
        // 부분 선택이면 아이템별로 순차 삭제
        for (const item of selectedItems) {
          const response = await cartService.removeFromCart(item.productUuid, item.options);
          if (!response.success) {
            throw new Error('일부 상품 삭제에 실패했습니다.');
          }
        }
      }

      await loadCart();
      onCartUpdate?.();
      showToast?.('선택한 상품을 삭제했습니다', 'success');
    } catch (err: any) {
      console.error('Remove selected items failed:', err);
      // 일부만 삭제됐을 수 있으므로 서버 상태로 재동기화
      await loadCart();
      onCartUpdate?.();
      showToast?.(err.message || '선택 상품 삭제에 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 p-3 border rounded-lg">
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
        <button onClick={loadCart} className="px-5 py-2.5 bg-ink text-white rounded-full text-sm font-semibold">다시 시도</button>
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
      <div className="space-y-2 mb-4">
        {/* 다중 판매자 안내 */}
        {cartSummary?.hasMultipleSellers && (
          <div className="bg-brand-50 border border-brand/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="text-brand text-lg sm:text-xl flex-shrink-0">🚚</div>
              <div className="min-w-0">
                <div className="text-brand-600 font-medium text-sm sm:text-base">다중 판매자 주문</div>
                <div className="text-brand text-xs sm:text-sm mt-0.5 sm:mt-1">
                  {cartSummary.totalSellers}개 판매자로부터 주문하여 개별 배송될 수 있습니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 제작 용량 관련 메시지 */}
        {message && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="text-orange-500 text-lg sm:text-xl flex-shrink-0">⚠️</div>
              <div className="text-orange-800 text-xs sm:text-sm">{message}</div>
            </div>
          </div>
        )}

        {/* 제거된 아이템들 */}
        {removedItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
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
      <div className="text-gray-300 mb-4">
        <ShoppingCart className="w-20 h-20 mx-auto" strokeWidth={1.5} />
      </div>
      <div className={`font-semibold mb-2 ${mode === 'drawer' ? 'text-lg' : 'text-xl'}`}>
        장바구니가 비어있습니다
      </div>
      <div className="text-gray-500 mb-6">마음에 드는 상품을 장바구니에 담아보세요!</div>
      {mode === 'page' && onBack && (
        <button onClick={onBack} className="px-6 py-3 bg-brand text-white rounded-full font-semibold hover:bg-brand-600 transition-colors">쇼핑 계속하기</button>
      )}
    </div>
  );

  // 판매자별 그룹화된 장바구니 아이템 렌더링
  const renderSellerGroup = (seller: CartItemsBySeller) => (
    <div key={seller.sellerUuid} className="border rounded-lg mb-3 overflow-hidden">
      {/* 판매자 헤더 */}
      <div className="bg-gray-50 border-b p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm sm:text-base md:text-lg leading-tight">{seller.sellerName}</h3>
          </div>
        </div>
      </div>

      {/* 판매자의 상품 목록 */}
      <div className="p-3 space-y-2">
        {seller.items.map((item: CartItem) => {
          // 새 API 구조: 플랫하게 productUuid 사용, 기존 구조 호환성 유지
          const productId = item.productUuid;
          const productName = item.name || item.product?.name;
          const productMainImageUrl = item.mainImageUrl || item.product?.mainImageUrl;
          const productBrand = item.brand || item.product?.brand;
          const isUpdating = updatingItems.has(productId);
          const isRemoving = removingItems.has(productId);
          const itemKey = `${productId}-${JSON.stringify(item.options)}`;

          return (
            <div
              key={itemKey}
              className={`flex items-center gap-2 py-1.5 transition-all duration-300 ${isUpdating ? 'opacity-50' : ''} ${isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            >
              {/* 선택 체크박스 - 맨 왼쪽 */}
              <input
                type="checkbox"
                checked={!deselectedKeys.has(itemKey)}
                onChange={() => toggleItemSelection(itemKey)}
                className="w-4 h-4 accent-brand flex-shrink-0 cursor-pointer touch-manipulation"
                aria-label={`${productName} 선택`}
              />

              {/* 삭제 버튼 */}
              <button
                onClick={() => removeItem(productId, item.options, productName)}
                disabled={isUpdating}
                className="text-gray-400 hover:text-red-500 p-1 touch-manipulation flex-shrink-0"
                title="상품 제거"
              >
                <span className="text-sm">✕</span>
              </button>

              {/* 상품 이미지 - 작게 */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
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

              {/* 상품 정보 - 왼쪽 */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2">{productName}</h4>
                {item.options && (
                  <div className="mt-0.5 flex flex-wrap gap-0.5">
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
                        <span key={key} className="inline-block bg-gray-100 px-1 py-0.5 rounded text-[10px] whitespace-nowrap">
                          {displayKey}: {displayValue}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 가격 및 수량 - 오른쪽 2줄 */}
              <div className="flex flex-col gap-1 ml-auto flex-shrink-0">
                {/* 가격 */}
                <div className="text-right">
                  <div className="font-bold text-sm whitespace-nowrap">
                    {money(item.subtotal)}
                  </div>
                </div>

                {/* 수량 조절 */}
                <div className="flex items-center justify-end">
                  <div className="flex items-center border rounded">
                    <button
                      onClick={() => updateQuantity(productId, item.quantity - 1, item.options)}
                      disabled={isUpdating || item.quantity <= 1}
                      className="px-1.5 py-0.5 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center text-sm"
                    >
                      -
                    </button>
                    <div className="px-1.5 py-0.5 min-w-[28px] text-center border-x font-medium text-xs">
                      {isUpdating ? '...' : item.quantity}
                    </div>
                    <button
                      onClick={() => updateQuantity(productId, item.quantity + 1, item.options)}
                      disabled={isUpdating}
                      className="px-1.5 py-0.5 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 판매자별 소계 및 배송 정보 */}
      <div className="bg-gray-50 border-t p-2">
        <div className="flex items-center justify-between flex-wrap gap-1.5 sm:gap-2">
          <div>
            <div className="font-semibold text-xs sm:text-sm md:text-base">
              소계: {money(seller.subtotal)} ({seller.itemCount}개)
            </div>
          </div>
          <div className="text-right">
            {seller.shipping.isFreeShipping ? (
              <span className="text-green-600 font-medium text-xs sm:text-sm md:text-base">🚚 무료배송</span>
            ) : (
              <div>
                <span className="text-gray-700 text-xs sm:text-sm md:text-base">
                  배송비: {money(seller.shipping.shippingCost)}
                </span>
                {seller.shipping.freeShippingRemaining > 0 && (
                  <div className="text-[10px] sm:text-xs text-brand mt-0.5 sm:mt-1">
                    {money(seller.shipping.freeShippingRemaining)} 더 구매하면 무료배송
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 전체선택 / 선택 삭제 툴바
  const renderSelectionToolbar = () => {
    if (allItems.length === 0) return null;

    return (
      <div className="flex items-center justify-between px-1 mb-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="w-4 h-4 accent-brand cursor-pointer touch-manipulation"
            aria-label="전체선택"
          />
          <span className="text-sm sm:text-base font-medium">
            전체선택 ({selectedItems.length}/{allItems.length})
          </span>
        </label>
        <button
          onClick={removeSelectedItems}
          disabled={selectedItems.length === 0 || loading}
          className="text-xs sm:text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 hover:text-brand hover:border-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
        >
          선택 삭제
        </button>
      </div>
    );
  };

  // 장바구니 아이템 렌더링 (판매자별 그룹화)
  const renderCartItems = () => {
    return (
      <div>
        {renderSelectionToolbar()}
        <div className="space-y-6">
          {itemsBySeller.map(seller => renderSellerGroup(seller))}
        </div>
      </div>
    );
  };

  // 주문 요약 렌더링
  const renderOrderSummary = () => {
    if (!cart || itemsBySeller.length === 0) return null;

    // cart.totals 직접 사용 (mapApiResponseToCart에서 이미 변환됨)
    const totals = cart.totals;

    const summary = (
      <>
        <div className="space-y-2 text-sm sm:text-base mb-4">
          <div className="flex items-center justify-between">
            <span>선택 상품 금액 ({selectedQuantity}개)</span>
            <span className="font-medium">{money(selectedSubtotal)}</span>
          </div>

          {allSelected ? (
            <>
              {/* 배송비 표시 (전체 선택 시에만 서버 계산값이 유효함) */}
              {totals.shippingCost > 0 && (
                <div className="flex items-center justify-between">
                  <span>배송비</span>
                  <span className="font-medium">{money(totals.shippingCost)}</span>
                </div>
              )}
              {totals.freeShippingRemaining > 0 && (
                <div className="text-xs text-brand bg-brand-50 p-2 rounded">
                  {money(totals.freeShippingRemaining)} 더 구매하면 무료배송!
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              배송비는 전체 주문 기준으로 주문 단계에서 계산됩니다
            </div>
          )}


          <hr />
        </div>
        <div className="mb-4 flex items-center justify-between border-t pt-3">
          <span className="font-semibold text-base sm:text-lg">
            {allSelected ? '총 결제금액' : '선택 상품 합계'}
          </span>
          <span className={`font-bold ${mode === 'drawer' ? 'text-lg' : 'text-xl sm:text-2xl'} text-brand`}>
            {money(allSelected ? totals.total : selectedSubtotal)}
          </span>
        </div>
        <button
          onClick={() => {
            // 선택 주문: 일부만 선택했으면 선택 목록을 체크아웃에 전달 (서버가 필터링)
            if (!allSelected) {
              const payload = selectedItems.map(item => ({
                productUuid: item.productUuid,
                options: item.options || {}
              }));
              sessionStorage.setItem('checkoutSelectedItems', JSON.stringify(payload));
            } else {
              sessionStorage.removeItem('checkoutSelectedItems');
            }
            onCheckout();
            if (mode === 'drawer' && onClose) onClose();
          }}
          disabled={selectedItems.length === 0}
          className="w-full rounded-full bg-brand text-white font-semibold py-3 sm:py-4 hover:bg-brand-600 transition-colors touch-manipulation text-base sm:text-lg disabled:bg-line-strong disabled:cursor-not-allowed disabled:hover:bg-line-strong"
        >
          {allSelected ? '주문하기' : `선택한 ${selectedItems.length}개 상품 주문하기`}
        </button>
        {selectedItems.length === 0 && (
          <p className="mt-2 text-xs text-gray-400 text-center">
            주문할 상품을 선택해주세요
          </p>
        )}
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
      <div className="border rounded-lg p-3 lg:sticky lg:top-4">
        <h3 className="font-semibold mb-3 text-base sm:text-lg">주문 요약</h3>
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

    // 빈 장바구니 체크: 진행 중인 작업이 모두 없을 때만 빈 상태 표시
    const hasItemsBeingRemoved = removingItems.size > 0;
    const hasItemsBeingUpdated = updatingItems.size > 0;
    const hasPendingUndo = pendingUndo !== null;
    const hasActiveOperations = hasItemsBeingRemoved || hasItemsBeingUpdated || hasPendingUndo;

    if (!cart || (itemsBySeller.length === 0 && !hasActiveOperations)) {
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
        <div className="mx-auto max-w-6xl px-4 py-4">
          {renderHeader()}
          {renderNotifications()}
          <div className="grid lg:grid-cols-3 gap-4">
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
