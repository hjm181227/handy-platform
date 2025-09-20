import { useState, useEffect } from 'react';
import { useAlert } from '../common';
import { purchaseApiService } from '../../services/purchaseApiService';
import { webApiService } from '../../services/apiService';
import { money } from '../../utils';
import type {
  Cart,
  Order,
  CreateOrderRequest,
  ShippingAddress,
  PaymentMethod
} from '@handy-platform/shared';

interface CheckoutPageProps {
  onGo: (path: string) => void;
}

export function CheckoutPage({ onGo }: CheckoutPageProps) {
  const { alert, error: showError, confirm } = useAlert();
  const [cart, setCart] = useState<Cart | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // 배송지 정보
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    recipientName: '',
    phone: '',
    address: '',
    addressDetail: '',
    zipCode: '',
    memo: ''
  });

  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // 결제 방법
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // 장바구니와 pending 주문 로드
  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 장바구니 정보 가져오기
      const cartResponse = await purchaseApiService.getCart();
      console.log('🛒 Full cart response:', cartResponse);
      console.log('🛒 Response success:', cartResponse.success);
      console.log('🛒 Response data:', cartResponse.data);

      if (cartResponse.success && cartResponse.data) {
        // 새로운 API 구조: response.data가 직접 cart 데이터
        const cartData = cartResponse.data;
        console.log('🛒 Checkout cart data:', cartData);
        console.log('🛒 Cart items:', cartData.items);
        setCart(cartData);

        // 장바구니가 비어있으면 장바구니 페이지로 리다이렉트
        if (!cartData || !cartData.items || cartData.items.length === 0) {
          setError('장바구니가 비어있습니다.');
          setTimeout(() => onGo('/cart'), 2000);
          return;
        }

        // 장바구니 기반으로 임시 주문 정보 생성 (결제 시점에 실제 주문 생성)
        const tempOrder = {
          id: `temp_${Date.now()}`,
          items: cartData.items,
          totalPrice: cartData.totals?.subtotal || 0,
          shippingCost: cartData.totals?.shippingCost || 0,
          totalDiscount: 0,
          finalPrice: cartData.totals?.total || 0
        };
        setOrder(tempOrder);

        // 저장된 배송지 목록 로드 (임시 비활성화)
        // const addressesResponse = await purchaseApiService.getShippingAddresses();
        // if (addressesResponse.success && addressesResponse.data) {
        //   setSavedAddresses(addressesResponse.data);
        //   // 기본 배송지가 있으면 선택
        //   const defaultAddress = addressesResponse.data.find(addr => addr.isDefault);
        //   if (defaultAddress) {
        //     setSelectedAddressId(defaultAddress.id);
        //     setShippingAddress(defaultAddress);
        //   } else if (addressesResponse.data.length > 0) {
        //     setShowAddressForm(addressesResponse.data.length === 0);
        //   } else {
        //     setShowAddressForm(true);
        //   }
        // }

        // 임시로 배송지 입력 폼 활성화
        setShowAddressForm(true);

        // 저장된 결제수단 목록 로드 (임시 비활성화)
        // const paymentMethodsResponse = await purchaseApiService.getPaymentMethods();
        // if (paymentMethodsResponse.success && paymentMethodsResponse.data) {
        //   setSavedPaymentMethods(paymentMethodsResponse.data);
        // }
      } else {
        throw new Error('장바구니 정보를 불러올 수 없습니다.');
      }

    } catch (err: any) {
      console.error('Checkout data loading failed:', err);
      setError(err.message || '장바구니 정보를 불러올 수 없습니다.');
      // AlertService 에러 방지를 위해 간단한 에러 처리
      // await showError(err, {
      //   title: '체크아웃 로드 실패',
      //   showRetry: true
      // });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckoutData();
  }, []);

  // 배송지 선택 핸들러
  const handleAddressSelect = (address: ShippingAddress) => {
    setSelectedAddressId(address.id);
    setShippingAddress(address);
    setShowAddressForm(false);
  };

  // 새 배송지 추가
  const handleAddNewAddress = () => {
    setSelectedAddressId(null);
    setShippingAddress({
      recipientName: '',
      phone: '',
      address: '',
      addressDetail: '',
      zipCode: '',
      memo: ''
    });
    setShowAddressForm(true);
  };

  // 배송지 정보 변경 핸들러
  const handleShippingChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 새 배송지 저장
  const saveNewAddress = async () => {
    try {
      const response = await purchaseApiService.addShippingAddress(shippingAddress);
      if (response.success && response.data) {
        setSavedAddresses(prev => [...prev, response.data]);
        setSelectedAddressId(response.data.id);
        setShowAddressForm(false);
        await alert('배송지가 저장되었습니다.', {
          variant: 'success',
          title: '저장 완료'
        });
      }
    } catch (err: any) {
      console.error('Address save failed:', err);
      setError('배송지 저장에 실패했습니다.');
    }
  };

  // 배송지 유효성 검사
  const validateShipping = () => {
    const required = ['recipientName', 'phone', 'address', 'zipCode'];
    return required.every(field => shippingAddress[field as keyof ShippingAddress].trim());
  };

  // 체크아웃 유효성 검사
  const validateCheckout = () => {
    // 배송지가 선택되거나 유효하게 입력되었는지 확인
    const hasValidAddress = selectedAddressId || validateShipping();
    // 결제 방법이 선택되었는지 확인
    const hasPaymentMethod = !!paymentMethod;
    return hasValidAddress && hasPaymentMethod;
  };

  // 결제 진행
  const handlePayment = async () => {
    if (!validateCheckout()) {
      if (!selectedAddressId && !validateShipping()) {
        setError('배송지 정보를 선택하거나 입력해주세요.');
      } else if (!paymentMethod) {
        setError('결제 방법을 선택해주세요.');
      }
      return;
    }

    if (!order) {
      setError('주문 정보가 없습니다.');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // 1. 먼저 주문 생성
      const orderData = {
        shippingAddress: {
          street: shippingAddress.address + (shippingAddress.addressDetail ? ` ${shippingAddress.addressDetail}` : ''),
          city: '서울', // 기본값 - 실제로는 배송지에서 추출해야 함
          state: '서울특별시',
          zipCode: shippingAddress.zipCode,
          country: 'KR',
          name: shippingAddress.recipientName,
          phone: shippingAddress.phone
        },
        paymentMethod: paymentMethod === 'kakaopay' ? 'KAKAO_PAY' :
                       paymentMethod === 'card' ? 'CREDIT_CARD' :
                       paymentMethod === 'naverpay' ? 'NAVER_PAY' :
                       paymentMethod === 'bank' ? 'BANK_TRANSFER' : 'CREDIT_CARD', // 서버 API 스펙에 맞는 값으로 변환
        useCart: true // 장바구니 기반 주문
      };

      const orderResponse = await webApiService.order.createOrder(orderData);

      if (orderResponse.success && orderResponse.data) {
        // 2. 주문 생성 성공 후 결제 준비
        const payMethod = paymentMethod === 'kakaopay' ? 'KAKAO_PAY' :
                         paymentMethod === 'naverpay' ? 'NAVER_PAY' :
                         paymentMethod === 'card' ? 'CREDIT_CARD' : 'BANK_TRANSFER';

        const itemName = cart?.items.length === 1
          ? cart.items[0].product.name
          : `${cart?.items[0].product.name} 외 ${(cart?.items.length || 1) - 1}건`;

        const paymentPrepareData = {
          orderId: orderResponse.data.order.id,
          amount: order.finalPrice,
          itemName,
          payMethod,
          quantity: cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 1,
          callbackUrls: {
            success: `${window.location.origin}/payment/success`,
            cancel: `${window.location.origin}/payment/cancel`,
            fail: `${window.location.origin}/payment/fail`
          }
        };

        const prepareResponse = await purchaseApiService.preparePayment(paymentPrepareData);

        if (prepareResponse.success && prepareResponse.data) {
          // 3. 결제 페이지로 이동
          window.location.href = prepareResponse.data.paymentUrl;
        } else {
          throw new Error(prepareResponse.error || '결제 준비에 실패했습니다.');
        }
      } else {
        throw new Error('주문 생성에 실패했습니다.');
      }

    } catch (err: any) {
      console.error('Payment failed:', err);
      setError('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">주문 정보를 준비하고 있습니다...</p>
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
                      {item.product?.mainImageUrl ? (
                        <img
                          src={item.product.mainImageUrl}
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
                      <div className="text-xs text-gray-500 mt-1">
                        판매자: {item.product?.seller?.name || 'HANDY'}
                      </div>
                      {item.options && Object.keys(item.options).length > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          {Object.entries(item.options).map(([key, value]) => (
                            <span key={key}>{key}: {value} </span>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">수량: {item?.quantity || 1}개</span>
                        <span className="font-semibold">{money(item?.price || 0)}원</span>
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
                {savedAddresses.length > 0 && !showAddressForm && (
                  <button
                    onClick={handleAddNewAddress}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + 새 주소 추가
                  </button>
                )}
              </div>

              {/* 저장된 배송지 목록 */}
              {savedAddresses.length > 0 && !showAddressForm && (
                <div className="space-y-3 mb-6">
                  {savedAddresses.map(address => (
                    <div
                      key={address.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAddressId === address.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleAddressSelect(address)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{address.recipientName}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {address.address} {address.addressDetail}
                          </div>
                          <div className="text-sm text-gray-600">
                            {address.phone}
                          </div>
                          {address.isDefault && (
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded mt-2">
                              기본 배송지
                            </span>
                          )}
                        </div>
                        <input
                          type="radio"
                          checked={selectedAddressId === address.id}
                          onChange={() => handleAddressSelect(address)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 배송지 입력 폼 */}
              {showAddressForm && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      받는 분 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.recipientName}
                      onChange={(e) => handleShippingChange('recipientName', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="받는 분 성함"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      연락처 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => handleShippingChange('phone', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      우편번호 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shippingAddress.zipCode}
                        onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2"
                        placeholder="12345"
                      />
                      <button
                        onClick={() => alert('우편번호 찾기는 추후 구현됩니다.')}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        검색
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    주소 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.address}
                    onChange={(e) => handleShippingChange('address', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="기본 주소"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">상세 주소</label>
                  <input
                    type="text"
                    value={shippingAddress.addressDetail}
                    onChange={(e) => handleShippingChange('addressDetail', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="상세 주소 (아파트 동/호수 등)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">배송 메모</label>
                  <textarea
                    value={shippingAddress.memo}
                    onChange={(e) => handleShippingChange('memo', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 h-20 resize-none"
                    placeholder="배송 시 요청사항이 있으면 입력해주세요"
                  />
                </div>

                {/* 배송지 저장 버튼 */}
                <div className="flex justify-end space-x-3 pt-4">
                  {savedAddresses.length > 0 && (
                    <button
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      취소
                    </button>
                  )}
                  <button
                    onClick={saveNewAddress}
                    disabled={!validateShipping()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    배송지 저장
                  </button>
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
