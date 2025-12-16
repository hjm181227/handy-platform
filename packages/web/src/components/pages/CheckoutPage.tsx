import { useState, useEffect, useRef } from 'react';
import { Star, FileText, Pencil } from 'lucide-react';
import { useAlert } from '../common';
import { purchaseApiService } from '../../services/purchaseApiService';
import { webApiService } from '../../services/apiService';
import { money } from '../../utils';
import { ShippingAddressForm } from '../common/ShippingAddressForm';
import type {
  Cart,
  Order,
  ShippingAddress,
  ShippingDetails,
  OrderStatus,
  PaymentStatus
} from '@handy-platform/shared';

interface CheckoutPageProps {
  onGo: (path: string) => void;
}

export function CheckoutPage({ onGo }: CheckoutPageProps) {
  const { alert } = useAlert();
  const [cart, setCart] = useState<Cart | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const hasLoadedRef = useRef(false);  // ✅ 중복 실행 방지용 ref

  // 배송지 정보
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    recipientName: '',
    recipientPhone: '',
    postcode: '',
    roadAddress: '',
    detailAddress: '',
    region: 'seoul',
    deliveryNote: ''
  });

  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // 결제 방법
  const [paymentMethod, setPaymentMethod] = useState<string>('card');

  // ✅ 배송지 목록 로드 헬퍼 함수
  const loadAddresses = async () => {
    try {
      const response = await webApiService.address.getAddresses();
      if (response.success && response.data?.addresses) {
        const addresses: ShippingAddress[] = response.data.addresses.map((addr: any) => ({
          id: addr.index?.toString() || '',
          recipientName: addr.recipientName || '',
          recipientPhone: addr.recipientPhone || '',
          postcode: addr.postcode || '',
          roadAddress: addr.roadAddress || '',
          jibunAddress: addr.jibunAddress,
          detailAddress: addr.detailAddress || '',
          extraAddress: addr.extraAddress,
          region: addr.region || 'seoul',
          deliveryNote: addr.deliveryNote,
          addressName: addr.addressName,
          isDefault: addr.isDefault || false
        }));
        setSavedAddresses(addresses);

        // 기본 배송지 또는 첫 번째 배송지 선택
        const defaultAddress = addresses.find(addr => addr.isDefault);
        const addressToSelect = defaultAddress || addresses[0];

        if (addressToSelect) {
          setSelectedAddressId(addressToSelect.id);
          setShippingAddress(addressToSelect);
          // ✅ Validation will be handled by useEffect watching shippingAddress changes
        }
      }
    } catch (error) {
      console.error('❌ [CheckoutPage] Load addresses failed:', error);
    }
  };

  // ✅ 체크아웃 초기화 (POST /api/checkout/initialize)
  const loadCheckoutData = async () => {
    // ✅ React Strict Mode 대응: 이미 실행되었으면 스킵
    if (hasLoadedRef.current) {
      console.log('📦 [CheckoutPage] Already loaded (prevented duplicate execution by useRef)');
      return;
    }
    hasLoadedRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // ✅ OrderService를 통한 체크아웃 초기화 (백엔드 스펙 준수)
      // sessionStorage 확인: 바로구매 vs 맞춤제작 vs 장바구니
      const checkoutDataStr = sessionStorage.getItem('checkoutData');
      let requestBody: any = undefined;

      if (checkoutDataStr) {
        try {
          const checkoutData = JSON.parse(checkoutDataStr);

          // 타입에 따라 requestBody 구성
          switch (checkoutData.type) {
            case 'direct':
              // 바로구매: { directItems: [...] }
              requestBody = { directItems: checkoutData.directItems };
              console.log('📦 [CheckoutPage] Direct purchase mode:', checkoutData.directItems);
              break;

            case 'custom':
              // 맞춤제작: { customRequestUuid: "uuid" }
              requestBody = { customRequestUuid: checkoutData.customRequestUuid };
              console.log('📦 [CheckoutPage] Custom request mode:', checkoutData.customRequestUuid);
              break;

            default:
              // 알 수 없는 타입은 장바구니로 처리
              console.warn('⚠️ [CheckoutPage] Unknown checkout type:', checkoutData.type);
              requestBody = undefined;
          }
        } catch (err) {
          console.error('❌ [CheckoutPage] Failed to parse checkoutData:', err);
          // 파싱 실패 시에만 즉시 삭제
          sessionStorage.removeItem('checkoutData');
          requestBody = undefined;
        }
      } else {
        // sessionStorage 없으면 장바구니 모드 (기존 동작)
        console.log('📦 [CheckoutPage] Cart mode - loading from user cart');
        requestBody = undefined;
      }

      console.log('🔍 [CheckoutPage] Final requestBody:', JSON.stringify(requestBody, null, 2));

      const response = await webApiService.order.initializeCheckout(requestBody);

      console.log('📦 [CheckoutPage] Initialize response:', response);
      const result = response;

      if (result.success && result.data) {
        // ✅ Initialize 성공 - sessionStorage 정리 (다음 주문에 영향 방지)
        sessionStorage.removeItem('checkoutData');
        console.log('🗑️ [CheckoutPage] Cleared checkoutData from sessionStorage');

        // ✅ CheckoutData를 cart로 저장 (sessionId 포함)
        setCart({
          sessionId: result.data.sessionId,
          ...result.data
        } as any);

        // ✅ order 정보는 totals에서 생성 (API 스펙 준수)
        const tempOrder: Order = {
          id: `temp_${Date.now()}`,
          orderNumber: `ORDER_${Date.now()}`,
          status: 'pending',
          paymentStatus: 'pending',
          totalAmount: result.data.totals.finalTotal,
          items: result.data.items || [],
          shipping: {
            id: `shipping_${Date.now()}`,
            status: 'preparing',
            trackingNumber: undefined,
            estimatedDelivery: result.data.estimatedDeliveryDateRange?.earliest,
            carrier: { name: 'Standard', code: 'STD' }
          } as ShippingDetails,
          createdAt: new Date().toISOString(),
          totalPrice: result.data.totals.subtotal,
          shippingCost: result.data.totals.shippingCost,
          totalDiscount: result.data.totals.discount,
          finalPrice: result.data.totals.grandTotal
        };
        setOrder(tempOrder);

        // 배송지 목록 로드
        await loadAddresses();

      } else {
        const errorMessage = result.error?.message || '주문 정보를 불러올 수 없습니다.';
        setError(errorMessage);
      }

    } catch (err: any) {
      console.error('❌ [CheckoutPage] Initialize failed:', err);
      setError(err.message || '체크아웃 초기화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ 배송지 정보 변경 시 자동으로 validate API 호출
  useEffect(() => {
    // 필수 정보가 없으면 스킵
    if (!shippingAddress.recipientName || !cart?.sessionId) {
      return;
    }

    const validateAddress = async () => {
      try {
        console.log('🚚 [CheckoutPage] Auto-validating address on change');
        const validateResponse = await webApiService.order.validateCheckout(
          cart.sessionId!,
          {
            recipientName: shippingAddress.recipientName,
            recipientPhone: shippingAddress.recipientPhone,
            postcode: shippingAddress.postcode,
            roadAddress: shippingAddress.roadAddress,
            detailAddress: shippingAddress.detailAddress || '',
            // Optional fields: only include if not empty
            ...(shippingAddress.deliveryNote?.trim() && { deliveryNote: shippingAddress.deliveryNote.trim() }),
            ...(shippingAddress.jibunAddress?.trim() && { jibunAddress: shippingAddress.jibunAddress.trim() }),
            ...(shippingAddress.extraAddress?.trim() && { extraAddress: shippingAddress.extraAddress.trim() })
          }
        );

        if (validateResponse.success && validateResponse.data) {
          console.log('✅ [CheckoutPage] Address auto-validated, totals:', validateResponse.data.totals);
          setCart({
            ...cart,
            totals: validateResponse.data.totals,
            status: 'validated'
          } as any);

          if (order) {
            setOrder({
              ...order,
              shippingCost: validateResponse.data.totals.shippingCost,
              finalPrice: validateResponse.data.totals.grandTotal || validateResponse.data.totals.finalTotal
            });
          }
        }
      } catch (error: any) {
        console.error('❌ [CheckoutPage] Auto-validation failed:', error);
        // 검증 실패는 조용히 처리 (사용자가 수동으로 조정 가능)
      }
    };

    validateAddress();
  }, [shippingAddress, cart?.sessionId]); // shippingAddress 또는 sessionId 변경 시 자동 실행

  useEffect(() => {
    loadCheckoutData();

    // 결제 취소 후 복원 정보 확인
    const restoreCheckoutData = () => {
      try {
        const restored = sessionStorage.getItem('restored-checkout');
        if (!restored) return;

        const restoreData = JSON.parse(restored);
        const isRecent = Date.now() - restoreData.timestamp < 5 * 60 * 1000; // 5분 이내

        if (isRecent && restoreData.shippingAddress) {
          console.log('✅ [CheckoutPage] Restoring checkout data:', restoreData);

          // 배송지 복원
          setShippingAddress(restoreData.shippingAddress);
          setSelectedAddressId(restoreData.shippingAddress.id);

          // 결제수단 복원 (있는 경우)
          if (restoreData.paymentMethod) {
            setPaymentMethod(restoreData.paymentMethod);
          }

          // 사용 후 즉시 삭제
          sessionStorage.removeItem('restored-checkout');
          console.log('✅ [CheckoutPage] Restoration completed and data cleared');
        } else {
          // 만료되었거나 유효하지 않으면 삭제
          sessionStorage.removeItem('restored-checkout');
          console.log('⏰ [CheckoutPage] Restoration data expired or invalid');
        }
      } catch (error) {
        console.error('❌ [CheckoutPage] Failed to restore checkout data:', error);
        sessionStorage.removeItem('restored-checkout');
      }
    };

    // 체크아웃 데이터 로드 후 복원 시도
    setTimeout(restoreCheckoutData, 500);

    // Cleanup: 컴포넌트 언마운트 시 예약된 타이머 취소
    return () => {
      // React Strict Mode에서 두 번째 마운트 시 이전 타이머 취소
    };
  }, []);

  // 배송지 선택 핸들러
  const handleAddressSelect = (address: ShippingAddress) => {
    setSelectedAddressId(address.id);
    setShippingAddress(address);
    setShowAddressForm(false);
    // ✅ Validation will be triggered automatically by useEffect watching shippingAddress
  };

  // 새 배송지 추가
  const handleAddNewAddress = () => {
    setSelectedAddressId(null);
    setShippingAddress({
      recipientName: '',
      recipientPhone: '',
      postcode: '',
      roadAddress: '',
      detailAddress: '',
      region: 'seoul',
      deliveryNote: ''
    });
    setShowAddressForm(true);
  };

  // 새 배송지 저장 핸들러 (ShippingAddressForm 컴포넌트용)
  // ✅ ShippingAddressForm에서 이미 저장 완료한 배송지를 선택 처리만
  const handleSaveNewAddress = async (savedAddress: ShippingAddress) => {
    try {
      setProcessing(true);
      setError(null);

      console.log('✅ [CheckoutPage] New address saved, selecting it:', savedAddress);

      // 1. 배송지 목록에 추가
      setSavedAddresses(prev => [savedAddress, ...prev]);

      // 2. 선택된 배송지로 설정 (useEffect가 자동으로 validate 처리)
      setSelectedAddressId(savedAddress.id);
      setShippingAddress(savedAddress);

      // 3. 폼 닫기
      setShowAddressForm(false);

      console.log('✅ [CheckoutPage] New address selected, auto-validation will trigger');
    } catch (err: any) {
      console.error('Address selection failed:', err);
      setError(err.message || '배송지 선택에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // 배송지 편집 시작
  const handleEditAddress = (address: ShippingAddress) => {
    console.log('✏️ [CheckoutPage] Edit address clicked:', address.id);
    setEditingAddressId(address.id);
    setSelectedAddressId(address.id);
    setShippingAddress(address);
    setShowAddressForm(true);
  };

  // 배송지 수정 저장
  const handleUpdateAddress = async (addressData: ShippingAddress) => {
    if (!editingAddressId) return;

    try {
      setProcessing(true);
      setError(null);

      console.log('💾 [CheckoutPage] Updating address:', editingAddressId);
      console.log('🔍 [CheckoutPage] addressData received:', addressData);

      // 배송지 목록 새로고침 (ShippingAddressForm에서 이미 UPDATE API 호출함)
      await loadAddresses();

      // 배송비 재계산 (validate API)
      if (cart?.sessionId) {
        console.log('📡 [CheckoutPage] Calling validateCheckout with sessionId:', (cart as any).sessionId);
        console.log('📡 [CheckoutPage] Shipping address data:', JSON.stringify(addressData, null, 2));

        const validateResponse = await webApiService.order.validateCheckout(
          (cart as any).sessionId,
          {
            recipientName: addressData.recipientName,
            recipientPhone: addressData.recipientPhone,
            postcode: addressData.postcode,
            roadAddress: addressData.roadAddress,
            detailAddress: addressData.detailAddress || '',
            // ✅ region 제거 - 서버에서 postcode로 자동 감지
            // Optional fields: only include if not empty
            ...(addressData.deliveryNote?.trim() && { deliveryNote: addressData.deliveryNote.trim() }),
            ...(addressData.jibunAddress?.trim() && { jibunAddress: addressData.jibunAddress.trim() }),
            ...(addressData.extraAddress?.trim() && { extraAddress: addressData.extraAddress.trim() })
          }
        );

        if (validateResponse.success && validateResponse.data) {
          setCart({
            ...cart,
            totals: validateResponse.data.totals,
            status: 'validated'
          } as any);

          if (order) {
            setOrder({
              ...order,
              shippingCost: validateResponse.data.totals.shippingCost,
              finalPrice: validateResponse.data.totals.grandTotal || validateResponse.data.totals.finalTotal
            });
          }
        }
      }

      // 수정된 주소로 shippingAddress 업데이트
      const updatedAddress: ShippingAddress = {
        ...addressData,
        id: editingAddressId,
        isDefault: false
      };

      setShippingAddress(updatedAddress);
      setShowAddressForm(false);
      setEditingAddressId(null);

      await alert('배송지가 수정되었습니다.', {
        variant: 'success',
        title: '수정 완료'
      });

    } catch (err: any) {
      console.error('❌ [CheckoutPage] Address update failed:', err);
      setError(err.message || '배송지 수정에 실패했습니다.');
      await alert(err.message, { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  // 배송지 유효성 검사
  const validateShipping = () => {
    const required = ['recipientName', 'recipientPhone', 'roadAddress', 'postcode'];
    return required.every(field => {
      const value = shippingAddress[field as keyof ShippingAddress];
      return typeof value === 'string' && value.trim();
    });
  };

  // 체크아웃 유효성 검사
  const validateCheckout = () => {
    // 배송지가 선택되거나 유효하게 입력되었는지 확인
    const hasValidAddress = selectedAddressId || validateShipping();
    // 결제 방법이 선택되었는지 확인
    const hasPaymentMethod = !!paymentMethod;
    return hasValidAddress && hasPaymentMethod;
  };

  // ✅ 결제 준비 (POST /api/payment/prepare) - 백엔드 스펙 준수
  const handlePayment = async () => {
    if (!cart) {
      setError('체크아웃 정보가 없습니다.');
      return;
    }

    if (!selectedAddressId) {
      setError('배송지를 선택해주세요.');
      await alert('배송지를 선택해주세요.', { variant: 'error' });
      return;
    }

    // ✅ validate 확인 (배송지가 검증되었는지 확인)
    if ((cart as any).status !== 'validated') {
      setError('배송지를 먼저 선택해주세요.');
      await alert('배송지를 선택해주세요.', { variant: 'error' });
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // ✅ paymentMethod를 PayMethod로 변환 (백엔드 스펙: 대문자)
      let payMethod: 'KAKAO_PAY' | 'NAVER_PAY' | 'CREDIT_CARD';
      if (paymentMethod === 'kakaopay') {
        payMethod = 'KAKAO_PAY';
      } else if (paymentMethod === 'naverpay') {
        payMethod = 'NAVER_PAY';
      } else if (paymentMethod === 'card') {
        payMethod = 'CREDIT_CARD';
      } else {
        payMethod = 'KAKAO_PAY'; // 기본값
      }

      // ✅ OrderService를 통한 결제 준비 (백엔드 스펙 준수)
      console.log('💳 [CheckoutPage] Preparing payment:', {
        sessionId: (cart as any).sessionId,
        amount: cart.totals.finalTotal,
        payMethod
      });

      const response = await webApiService.order.preparePayment(
        (cart as any).sessionId,
        cart.totals.finalTotal,  // 세션의 finalTotal 전달
        payMethod
      );

      console.log('💳 [CheckoutPage] Payment prepare response:', response);

      if (response.success && response.data?.paymentUrl) {
        // 모바일 여부 확인
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

        const paymentUrl = isMobile && response.data.mobilePaymentUrl
          ? response.data.mobilePaymentUrl
          : response.data.paymentUrl;

        console.log('🔗 [CheckoutPage] Redirecting to payment URL:', paymentUrl);
        window.location.href = paymentUrl;
      } else {
        throw new Error(response.error || response.message || '결제 준비에 실패했습니다.');
      }

    } catch (err: any) {
      console.error('❌ [CheckoutPage] Payment prepare failed:', err);
      setError(err.message || '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">주문 정보를 준비하고 있습니다...</p>
          <p className="text-sm text-gray-500 mt-2">장바구니를 불러오는 중</p>
        </div>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">주문을 진행할 수 없습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => onGo('/cart')}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            장바구니로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onGo('/cart')}
              className="text-gray-400 hover:text-gray-600"
            >
              ← 뒤로
            </button>
            <h1 className="text-xl font-bold">주문/결제</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 주문 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 주문 상품 */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">주문 상품</h2>
              {cart?.items ? cart.items.map((item, index) => {
                console.log('🛒 Checkout item:', item);
                return (
                  <div key={item.product.id || index} className="flex gap-4 py-4 border-b last:border-b-0">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
                      {item.product?.images?.main ? (
                        <img
                          src={item.product.images.main}
                          alt={item.product.name || 'Product'}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product?.name || '상품명 없음'}</h3>
                      {item.product?.brand && (
                        <div className="text-xs text-gray-500 mt-1">
                          브랜드: {item.product.brand}
                        </div>
                      )}
                      {item.options && Object.keys(item.options).length > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          {Object.entries(item.options).map(([key, value], index, array) => {
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
                            const isLast = index === array.length - 1;

                            return (
                              <span key={key}>{displayKey}: {displayValue}{!isLast && ', '}</span>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">수량: {item?.quantity || 1}개</span>
                        <span className="font-semibold">{money(item?.price || 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center text-gray-500 py-8">
                  장바구니에 상품이 없습니다.
                </div>
              )}
            </div>

            {/* 배송지 정보 */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">배송지 정보</h2>
                {!showAddressForm && (
                  <button
                    onClick={handleAddNewAddress}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + 배송지 추가
                  </button>
                )}
              </div>

              {/* 빈 배송지 상태 */}
              {savedAddresses.length === 0 && !showAddressForm && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📍</div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">등록된 배송지가 없습니다</h3>
                  <p className="text-gray-500 mb-4">주문을 완료하려면 배송지를 추가해주세요.</p>
                  <button
                    onClick={() => onGo('/my/shipping-address')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    배송지 관리 페이지에서 추가하기 →
                  </button>
                </div>
              )}

              {/* 저장된 배송지 목록 */}
              {savedAddresses.length > 0 && !showAddressForm && (
                <div className="space-y-3 mb-6">
                  {savedAddresses.map(address => {
                    const isSelected = selectedAddressId === address.id;
                    return (
                      <div
                        key={address.id}
                        className={`border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleAddressSelect(address)}
                      >
                        {/* 간략 정보 (항상 표시) */}
                        <div className="p-3 flex items-center gap-3">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => handleAddressSelect(address)}
                            className="flex-shrink-0"
                          />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-medium text-gray-900">
                              [{address.addressName || '배송지'}]
                            </span>
                            <span className="text-sm text-gray-600 truncate">
                              {address.roadAddress}
                            </span>
                            {address.isDefault && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium flex-shrink-0">
                                <Star className="w-3 h-3 fill-current" />
                                기본
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 상세 정보 (선택 시에만 표시) */}
                        {isSelected && (
                          <div className="px-3 pb-3 pt-0 border-t border-gray-200 mt-2">
                            <div className="bg-white rounded-lg p-3 space-y-2 text-sm mt-2">
                              {/* 배송지명 + 수정 버튼 */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-base text-gray-900">
                                    {address.addressName || '배송지'}
                                  </span>
                                  {address.isDefault && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                      <Star className="w-3 h-3 fill-current" />
                                      기본 배송지
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditAddress(address);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  수정
                                </button>
                              </div>

                              <div className="text-gray-700">
                                <span className="font-medium">{address.recipientName}</span>
                                <span className="text-gray-500 ml-2">({address.recipientPhone})</span>
                              </div>
                              <div className="text-gray-600 space-y-1">
                                <div>
                                  <span className="inline-block font-mono text-xs bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded mr-2">
                                    {address.postcode}
                                  </span>
                                  {address.roadAddress}
                                </div>
                                {address.detailAddress && (
                                  <div className="text-gray-500 pl-1">
                                    {address.detailAddress}
                                  </div>
                                )}
                              </div>
                              {address.deliveryNote && (
                                <div className="flex items-start gap-1.5 text-xs text-gray-500 border-l-2 border-gray-300 pl-2 mt-2">
                                  <FileText className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                  <span>{address.deliveryNote}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 배송지 입력 모달 */}
              {showAddressForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <ShippingAddressForm
                      title={editingAddressId ? "배송지 수정" : "새 배송지 추가"}
                      initialData={editingAddressId ? {
                        ...shippingAddress,
                        savedAddressIndex: parseInt(editingAddressId)
                      } : undefined}
                      onSave={editingAddressId ? handleUpdateAddress : handleSaveNewAddress}
                      onCancel={() => {
                        setShowAddressForm(false);
                        setEditingAddressId(null);
                      }}
                      processing={processing}
                      showCancelButton={true}
                      showAddressName={true}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 결제 방법 */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">결제 방법</h2>
              <div className="space-y-3">
                {[
                  { value: 'card', label: '신용카드', icon: '💳' },
                  { value: 'kakaopay', label: '카카오페이', icon: '🟨' },
                  { value: 'naverpay', label: '네이버페이', icon: '🟢' },
                  { value: 'bank', label: '계좌이체', icon: '🏦' }
                ].map((method) => (
                  <label key={method.value} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-xl">{method.icon}</span>
                    <span className="font-medium">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 주문 요약 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">주문 요약</h2>

              {order && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>상품금액</span>
                    <span>{money(order.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>배송비</span>
                    <span>{order.shippingCost > 0 ? money(order.shippingCost) : '무료'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>할인</span>
                    <span className="text-red-500">-{money(order.totalDiscount)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>총 결제금액</span>
                    <span className="text-blue-600">{money(order.finalPrice)}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={processing || !validateCheckout()}
                className="w-full mt-6 bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? '결제 중...' : `${money(order?.finalPrice || 0)} 결제하기`}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                결제 진행 시 주문 내용 확인 및 서비스 약관에 동의한 것으로 간주됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
