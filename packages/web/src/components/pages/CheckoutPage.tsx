import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, FileText, Pencil } from 'lucide-react';
import { useAlert } from '../common';
import { purchaseApiService } from '../../services/purchaseApiService';
import { webApiService } from '../../services/apiService';
import { money } from '../../utils';
import { ShippingAddressForm } from '../common/ShippingAddressForm';
import { TossPaymentWidget, TossPaymentWidgetRef } from '../payment/TossPaymentWidget';
import { CouponSelector } from '../checkout/CouponSelector';
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
  const { t } = useTranslation(['common', 'order']);
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

  // 토스페이먼츠 결제위젯 상태
  const [tossWidgetReady, setTossWidgetReady] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<{ code: string; type?: string } | null>(null);
  const tossWidgetRef = useRef<TossPaymentWidgetRef>(null);

  // 쿠폰 상태
  const [appliedCoupon, setAppliedCoupon] = useState<{
    userCouponUuid: string;
    code: string;
    name: string;
    description?: string;
    discountType: string;
    discountAmount: number;
    freeShipping: boolean;
    scope: { type: string; sellerUuid?: string };
    appliesTo: string;
  } | null>(null);

  // 현재 사용자의 customerKey 생성 (UUID 기반 또는 비회원)
  const customerKey = useMemo(() => {
    // 로그인된 사용자면 userId 사용, 아니면 null (비회원)
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // JWT에서 userId 추출 (간단한 디코딩)
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || payload.userId || payload.sub || null;
      }
    } catch (e) {
      console.warn('[CheckoutPage] Failed to extract customerKey from token');
    }
    return null;
  }, []);

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

      // ✅ 캐시된 체크아웃 세션 확인 (새로고침/결제 취소 후 재진입 대응)
      const cachedSessionStr = sessionStorage.getItem('checkout_session');
      if (cachedSessionStr) {
        try {
          const cached = JSON.parse(cachedSessionStr);
          const isValid = Date.now() - cached.timestamp < 30 * 60 * 1000; // 30분 이내
          if (isValid && cached.data?.sessionId) {
            console.log('♻️ [CheckoutPage] Restoring cached checkout session (mode:', cached.mode, ')');
            const cachedData = cached.data;
            setCart({ sessionId: cachedData.sessionId, ...cachedData } as any);
            const tempOrder: Order = {
              id: `temp_${Date.now()}`,
              orderNumber: `ORDER_${Date.now()}`,
              status: 'pending',
              paymentStatus: 'pending',
              totalAmount: cachedData.totals.finalTotal,
              items: cachedData.items || [],
              shipping: {
                id: `shipping_${Date.now()}`,
                status: 'preparing',
                trackingNumber: undefined,
                estimatedDelivery: cachedData.estimatedDeliveryDateRange?.earliest,
                carrier: { name: 'Standard', code: 'STD' }
              } as ShippingDetails,
              createdAt: new Date().toISOString(),
              totalPrice: cachedData.totals.subtotal,
              shippingCost: cachedData.totals.shippingCost,
              totalDiscount: cachedData.totals.discount,
              finalPrice: cachedData.totals.grandTotal
            };
            setOrder(tempOrder);
            await loadAddresses();
            return;
          } else {
            console.log('⏰ [CheckoutPage] Cached session expired, creating new session');
            sessionStorage.removeItem('checkout_session');
          }
        } catch {
          sessionStorage.removeItem('checkout_session');
        }
      }

      // ✅ OrderService를 통한 체크아웃 초기화 (백엔드 스펙 준수)
      // URL 파라미터에서 mode 읽기 (cart / direct / custom)
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutMode = urlParams.get('mode') || 'cart'; // 기본값: 장바구니
      console.log('🔍 [CheckoutPage] Checkout mode from URL:', checkoutMode);

      let requestBody: any = undefined;

      // mode에 따라 requestBody 구성
      switch (checkoutMode) {
        case 'cart':
          // 장바구니: 빈 body (서버가 장바구니를 직접 읽음)
          requestBody = undefined;
          console.log('📦 [CheckoutPage] Cart checkout - server will load from user cart');
          break;

        case 'direct':
          // 바로구매: sessionStorage에서 directItem 읽기 (단일 객체)
          try {
            const checkoutDataStr = sessionStorage.getItem('checkoutData');
            if (checkoutDataStr) {
              const checkoutData = JSON.parse(checkoutDataStr);
              requestBody = { directItem: checkoutData.directItem };
              console.log('📦 [CheckoutPage] Direct purchase mode:', checkoutData.directItem);
            } else {
              console.error('❌ [CheckoutPage] No checkoutData found for direct mode');
              throw new Error(t('order:checkout.directPurchaseNotFound'));
            }
          } catch (err) {
            console.error('❌ [CheckoutPage] Failed to load direct purchase data:', err);
            throw err;
          }
          break;

        case 'custom': {
          // 견적서 기반 주문: URL 파라미터에서 quoteUuid 읽기
          const quoteUuid = new URLSearchParams(window.location.search).get('quoteUuid');
          if (!quoteUuid) {
            throw new Error(t('order:checkout.quoteNotFound'));
          }

          requestBody = { quoteUuid };
          console.log('📦 [CheckoutPage] Quote-based checkout:', quoteUuid);
          break;
        }

        default:
          console.warn('⚠️ [CheckoutPage] Unknown checkout mode:', checkoutMode);
          requestBody = undefined;
      }

      console.log('🔍 [CheckoutPage] Final requestBody:', JSON.stringify(requestBody, null, 2));

      const response = await webApiService.order.initializeCheckout(requestBody);

      console.log('📦 [CheckoutPage] Initialize response:', response);
      const result = response;

      if (result.success && result.data) {
        // ✅ Initialize 성공 — 세션 캐시 (새로고침/결제 취소 후 재진입 대비)
        sessionStorage.setItem('checkout_session', JSON.stringify({
          mode: checkoutMode,
          data: result.data,
          timestamp: Date.now()
        }));

        console.log('💾 [CheckoutPage] Checkout session cached for recovery');

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
        // 에러 코드별 사용자 친화적 메시지
        const errorCode = result.errorCode || result.error?.code;
        let errorMessage = result.error?.message || result.error || t('order:payment.orderLoadError');

        switch (errorCode) {
          case 'CART_EMPTY':
            errorMessage = t('order:checkout.cartEmpty');
            break;
          case 'PRODUCT_NOT_FOUND':
            errorMessage = t('order:checkout.productNotAvailable');
            break;
          case 'CUSTOM_REQUEST_NOT_FOUND':
            errorMessage = t('order:checkout.customRequestNotFound');
            break;
          case 'INVALID_CUSTOM_REQUEST_STATUS':
            errorMessage = t('order:checkout.invalidCustomStatus');
            break;
          case 'INITIALIZATION_ERROR':
            errorMessage = t('order:checkout.initError');
            break;
        }

        setError(errorMessage);
      }

    } catch (err: any) {
      console.error('❌ [CheckoutPage] Initialize failed:', err);
      const errorMessage = err.message || t('order:checkout.initFailed');
      setError(errorMessage);
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

          // 결제수단은 토스페이먼츠 위젯에서 선택 (복원 불필요)

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
      setError(err.message || t('order:checkout.addressSelectionFailed'));
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

      await alert(t('order:checkout.addressUpdated'), {
        variant: 'success',
        title: t('order:checkout.updateComplete')
      });

    } catch (err: any) {
      console.error('❌ [CheckoutPage] Address update failed:', err);
      setError(err.message || t('order:checkout.addressUpdateFailed'));
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
    // 토스 결제위젯이 준비되었는지 확인
    const hasPaymentMethod = tossWidgetReady;
    return hasValidAddress && hasPaymentMethod;
  };

  // ✅ 스테이징 환경 체크
  const isStaging = import.meta.env.VITE_ENVIRONMENT === 'stage';

  // ✅ 테스트 결제 (스테이징 전용 - 결제 스킵)
  const handleTestPayment = async () => {
    if (!cart) {
      setError(t('order:checkout.noCheckoutInfo'));
      return;
    }

    if (!selectedAddressId) {
      setError(t('order:checkout.selectAddressFirst'));
      await alert(t('order:checkout.selectAddressFirst'), { variant: 'error' });
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // 스테이지 테스트: status 체크 스킵 (validate API가 실패해도 테스트 결제 진행)
      console.log('🧪 [CheckoutPage] Test payment - cart status:', (cart as any).status);

      // 1. 결제 준비 (주문 생성)
      console.log('🧪 [CheckoutPage] Test payment - preparing order...');
      const prepareResponse = await webApiService.order.preparePayment(
        (cart as any).sessionId,
        cart.totals.finalTotal,
        'TOSS_PAYMENTS' // 테스트용 기본값
      );

      if (!prepareResponse.success || !prepareResponse.data?.orderId) {
        throw new Error(prepareResponse.error || t('order:checkout.orderCreateFailed'));
      }

      const orderId = prepareResponse.data.orderId;
      console.log('🧪 [CheckoutPage] Test payment - order created:', orderId);

      // 2. 결제 스킵 API 호출
      console.log('🧪 [CheckoutPage] Test payment - skipping payment...');
      const skipResponse = await webApiService.order.skipPayment(orderId);

      if (skipResponse.success) {
        console.log('✅ [CheckoutPage] Test payment completed:', skipResponse.data);
        // 체크아웃 캐시 정리
        sessionStorage.removeItem('checkout_session');
        sessionStorage.removeItem('checkoutData');
        // 주문 완료 페이지로 이동
        onGo(`/order-complete?orderId=${orderId}`);
      } else {
        throw new Error(skipResponse.error || t('order:checkout.skipPaymentFailed'));
      }

    } catch (err: any) {
      console.error('❌ [CheckoutPage] Test payment failed:', err);
      setError(err.message || t('order:checkout.testPaymentError'));
      await alert(err.message || t('order:checkout.testPaymentFailed'), { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  // ✅ 결제 준비 및 토스페이먼츠 결제 요청
  const handlePayment = async () => {
    if (!cart || !order) {
      setError(t('order:checkout.noCheckoutInfo'));
      return;
    }

    if (!selectedAddressId) {
      setError(t('order:checkout.selectAddressFirst'));
      await alert(t('order:checkout.selectAddressFirst'), { variant: 'error' });
      return;
    }

    // ✅ validate 확인 (배송지가 검증되었는지 확인)
    if ((cart as any).status !== 'validated') {
      setError(t('order:checkout.addressValidationRequired'));
      await alert(t('order:checkout.selectAddressFirst'), { variant: 'error' });
      return;
    }

    // ✅ 토스 위젯 준비 확인
    if (!tossWidgetReady) {
      setError(t('order:checkout.selectPaymentFirst'));
      await alert(t('order:checkout.selectPaymentFirst'), { variant: 'error' });
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // 1. 백엔드에 결제 준비 요청 (주문 생성)
      console.log('💳 [CheckoutPage] Preparing payment with Toss:', {
        sessionId: (cart as any).sessionId,
        amount: order.finalPrice,
      });

      const prepareResponse = await webApiService.order.preparePayment(
        (cart as any).sessionId,
        order.finalPrice,
        'TOSS_PAYMENTS' as any // 토스페이먼츠 결제
      );

      if (!prepareResponse.success || !prepareResponse.data?.orderId) {
        throw new Error(prepareResponse.error || t('order:checkout.orderCreateFailed'));
      }

      const orderId = prepareResponse.data.orderId;

      // 2. 주문명 생성
      const orderName = cart.items.length > 1
        ? t('order:checkout.productAndMore', { name: cart.items[0].product?.name || t('order:checkout.productLabel'), count: cart.items.length - 1 })
        : cart.items[0].product?.name || t('order:checkout.productLabel');

      console.log('💳 [CheckoutPage] Requesting Toss payment:', { orderId, orderName });

      // 3. 토스페이먼츠 결제 요청
      if (!tossWidgetRef.current) {
        throw new Error(t('order:checkout.paymentWidgetNotReady'));
      }

      await tossWidgetRef.current.requestPayment({
        orderId: orderId,
        orderName: orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerName: shippingAddress.recipientName,
        customerMobilePhone: shippingAddress.recipientPhone?.replace(/-/g, ''),
      });

    } catch (err: any) {
      console.error('❌ [CheckoutPage] Payment failed:', err);
      setError(err.message || t('order:payment.errorProcessingPayment'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A6B] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{t('order:checkout.preparing')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('order:checkout.loadingCart')}</p>
        </div>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md mx-4 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">{t('order:checkout.cannotProceed')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => onGo('/cart')}
            className="w-full bg-[#FF073A] text-white py-2 px-4 rounded-lg hover:bg-[#E0062F]"
          >
            {t('common:goToCart')}
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
              {t('order:checkout.backToCart')}
            </button>
            <h1 className="text-xl font-bold">{t('order:checkout.title')}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 주문 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 주문 상품 */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">{t('order:checkout.orderSummary')}</h2>
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
                      <h3 className="font-medium">{item.product?.name || t('order:checkout.noProductName')}</h3>
                      {item.product?.brand && (
                        <div className="text-xs text-gray-500 mt-1">
                          {t('order:checkout.brandLabel')}: {item.product.brand}
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
                        <span className="text-gray-600">{t('order:payment.quantityUnit', { count: item?.quantity || 1 })}</span>
                        <span className="font-semibold">{money(item?.price || 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center text-gray-500 py-8">
                  {t('order:checkout.emptyCart')}
                </div>
              )}
            </div>

            {/* 제작 및 배송 안내 */}
            {cart?.productionInfo && (
              <div className="bg-[#FFF1F2] rounded-lg border border-[#E85A6B]/20 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-[#E85A6B]">⏱️</span>
                  {t('order:checkout.productionInfo')}
                </h2>

                {/* 제작 소요 기간 */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {t('order:checkout.totalProductionTime')}: <span className="text-[#E85A6B] font-bold">{cart.productionInfo.estimatedProductionTime}{t('order:checkout.daysUnit')}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('order:checkout.estimatedDelivery')}: {new Date(cart.productionInfo.earliestDeliveryDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} {t('order:checkout.afterDate')}
                  </div>
                </div>

                {/* 판매자별 제작 일정 */}
                {cart.productionInfo.productionSchedule && cart.productionInfo.productionSchedule.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {t('order:checkout.sellerSchedule')}:
                    </div>
                    {cart.productionInfo.productionSchedule.map((schedule, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{schedule.sellerName || `${t('order:checkout.sellerLabel')} ${index + 1}`}</span>
                            <span className="text-gray-500 ml-2">({t('order:checkout.itemCount', { count: schedule.itemCount })})</span>
                          </div>
                          <span className="text-[#E85A6B] font-medium">{t('order:checkout.daysRequired', { days: schedule.processingDays })}</span>
                        </div>
                        <div className="text-gray-600 mt-1">
                          {t('order:checkout.estimatedCompletion')}: {new Date(schedule.estimatedCompletionDate).toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 배송비 추정 정보 */}
                {cart.shippingEstimate && (
                  <div className="mt-4 pt-4 border-t border-[#E85A6B]/20">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{t('order:checkout.estimatedShipping')}</span>
                      <span className="font-semibold text-[#E85A6B]">
                        {cart.shippingEstimate.estimatedCost === 0
                          ? t('order:checkout.freeShipping')
                          : `${money(cart.shippingEstimate.estimatedCost)}`}
                      </span>
                    </div>
                    {cart.shippingEstimate.note && (
                      <div className="text-xs text-gray-500 mt-2">
                        💡 {cart.shippingEstimate.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 배송지 정보 */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{t('order:payment.shippingInfo')}</h2>
                {!showAddressForm && (
                  <button
                    onClick={handleAddNewAddress}
                    className="text-sm text-[#E85A6B] hover:text-[#E85A6B] font-medium"
                  >
                    {t('order:shipping.addNewShort')}
                  </button>
                )}
              </div>

              {/* 빈 배송지 상태 */}
              {savedAddresses.length === 0 && !showAddressForm && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📍</div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">{t('order:checkout.noAddressesCheckout')}</h3>
                  <p className="text-gray-500 mb-4">{t('order:checkout.addAddressPrompt')}</p>
                  <button
                    onClick={() => onGo('/my/shipping-address')}
                    className="text-[#E85A6B] hover:text-[#E85A6B] text-sm font-medium"
                  >
                    {t('order:checkout.goToAddressPage')}
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
                            ? 'border-[#E85A6B] bg-[#FFF1F2]'
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
                              [{address.addressName || t('order:checkout.addressLabel')}]
                            </span>
                            <span className="text-sm text-gray-600 truncate">
                              {address.roadAddress}
                            </span>
                            {address.isDefault && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFF1F2] text-[#E85A6B] text-xs rounded-full font-medium flex-shrink-0">
                                <Star className="w-3 h-3 fill-current" />
                                {t('order:checkout.defaultLabel')}
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
                                    {address.addressName || t('order:checkout.addressLabel')}
                                  </span>
                                  {address.isDefault && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFF1F2] text-[#E85A6B] text-xs rounded-full font-medium">
                                      <Star className="w-3 h-3 fill-current" />
                                      {t('order:checkout.defaultAddress')}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditAddress(address);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-[#E85A6B] hover:bg-[#FFF1F2] rounded-md transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  {t('order:checkout.editLabel')}
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
                      title={editingAddressId ? t('order:shipping.editTitle') : t('order:shipping.addTitle')}
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

            {/* 쿠폰 적용 */}
            {(cart as any)?.sessionId && order && (
              <CouponSelector
                sessionId={(cart as any).sessionId}
                orderAmount={order.totalPrice}
                appliedCoupon={appliedCoupon}
                onCouponApplied={(coupon, updatedTotals) => {
                  console.log('Coupon applied:', coupon, updatedTotals);
                  setAppliedCoupon(coupon);
                  // Update order totals
                  if (order) {
                    setOrder({
                      ...order,
                      totalDiscount: updatedTotals.couponDiscount + (updatedTotals.pointsDiscount || 0),
                      finalPrice: updatedTotals.finalTotal,
                    });
                  }
                  // Update cart totals
                  if (cart) {
                    setCart({
                      ...cart,
                      totals: {
                        ...cart.totals,
                        discount: updatedTotals.couponDiscount,
                        finalTotal: updatedTotals.finalTotal,
                        grandTotal: updatedTotals.grandTotal,
                      },
                    } as any);
                  }
                }}
                onCouponRemoved={(updatedTotals) => {
                  console.log('Coupon removed:', updatedTotals);
                  setAppliedCoupon(null);
                  // Update order totals
                  if (order) {
                    setOrder({
                      ...order,
                      totalDiscount: (updatedTotals.pointsDiscount || 0),
                      finalPrice: updatedTotals.finalTotal,
                    });
                  }
                  // Update cart totals
                  if (cart) {
                    setCart({
                      ...cart,
                      totals: {
                        ...cart.totals,
                        discount: 0,
                        finalTotal: updatedTotals.finalTotal,
                        grandTotal: updatedTotals.grandTotal,
                      },
                    } as any);
                  }
                }}
                onError={(error) => setError(error)}
              />
            )}

            {/* 결제 방법 - 토스페이먼츠 결제위젯 */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <TossPaymentWidget
                ref={tossWidgetRef}
                amount={order?.finalPrice || 0}
                customerKey={customerKey}
                onReady={() => setTossWidgetReady(true)}
                onError={(err) => setError(err)}
                onPaymentMethodSelect={(method) => setSelectedPaymentMethod(method)}
              />
            </div>
          </div>

          {/* 주문 요약 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">{t('order:checkout.summary')}</h2>

              {order && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>{t('order:checkout.itemTotal')}</span>
                    <span>{money(order.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('order:checkout.shipping')}</span>
                    <span>{order.shippingCost > 0 ? money(order.shippingCost) : t('common:free')}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-[#E85A6B]">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        {t('order:checkout.couponDiscount')}
                      </span>
                      <span>-{money(appliedCoupon.discountAmount)}</span>
                    </div>
                  )}
                  {order.totalDiscount > 0 && !appliedCoupon && (
                    <div className="flex justify-between text-red-500">
                      <span>{t('order:checkout.discount')}</span>
                      <span>-{money(order.totalDiscount)}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('order:checkout.finalAmount')}</span>
                    <span className="text-[#E85A6B]">{money(order.finalPrice)}</span>
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
                className="w-full mt-6 bg-[#FF073A] text-white font-semibold py-3 rounded-lg hover:bg-[#E0062F] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? t('order:checkout.processingPayment') : `${money(order?.finalPrice || 0)} ${t('order:checkout.placeOrder')}`}
              </button>

              {/* 스테이징 환경 전용: 테스트 결제 버튼 */}
              {isStaging && (
                <button
                  onClick={handleTestPayment}
                  disabled={processing || !(selectedAddressId || validateShipping())}
                  className="w-full mt-3 bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? t('order:checkout.testProcessing') : t('order:checkout.testPayment')}
                </button>
              )}

              <p className="text-xs text-gray-500 text-center mt-3">
                {t('order:checkout.paymentAgreement')}
              </p>

              {/* 스테이징 환경 안내 */}
              {isStaging && (
                <p className="text-xs text-orange-600 text-center mt-2 bg-orange-50 p-2 rounded">
                  {t('order:checkout.stagingNotice')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
