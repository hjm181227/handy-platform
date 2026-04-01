import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../common';
import { purchaseApiService } from '../../services/purchaseApiService';
import { Cart, CartItem, ShippingAddress, PaymentMethod, CustomerOrder } from '@handy-platform/shared';

interface CheckoutProps {
  onGo: (path: string) => void;
  directItem?: string; // 바로 구매 시 상품 정보
}

interface CheckoutStep {
  id: string;
  title: string;
  completed: boolean;
}

export function Checkout({ onGo, directItem }: CheckoutProps) {
  const { t } = useTranslation('order');
  const { alert, error: showError, confirm } = useAlert();
  
  // 상태 관리
  const [cart, setCart] = useState<Cart | null>(null);
  const [directCartItem, setDirectCartItem] = useState<CartItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);

  // 배송지 관련
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<ShippingAddress | null>(null);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);

  // 결제 수단 관련
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  // 체크아웃 단계
  const steps: CheckoutStep[] = [
    { id: 'shipping', title: t('checkout.shippingSelect'), completed: !!selectedShippingAddress },
    { id: 'payment', title: t('checkout.paymentMethodSelect'), completed: !!selectedPaymentMethod },
    { id: 'review', title: t('checkout.orderReview'), completed: false }
  ];

  useEffect(() => {
    initializeCheckout();
  }, []);

  const initializeCheckout = async () => {
    try {
      setLoading(true);

      // 바로 구매인 경우
      if (directItem) {
        try {
          const itemData = JSON.parse(decodeURIComponent(directItem));
          setDirectCartItem(itemData);
        } catch (err) {
          throw new Error(t('checkout.invalidProductInfo'));
        }
      } else {
        // 장바구니에서 주문하는 경우
        const cartResponse = await purchaseApiService.getCart();
        if (!cartResponse.success || !cartResponse.data || cartResponse.data.items.length === 0) {
          await alert(t('checkout.cartEmpty'), {
            title: t('checkout.orderNotPossible'),
            variant: 'warning'
          });
          onGo('/cart');
          return;
        }
        setCart(cartResponse.data);
      }

      // 배송지와 결제 수단 정보 로드
      await Promise.all([
        loadShippingAddresses(),
        loadPaymentMethods()
      ]);

    } catch (err) {
      console.error('체크아웃 초기화 실패:', err);
      await showError(err, { title: t('checkout.checkoutLoadFailed') });
      onGo('/cart');
    } finally {
      setLoading(false);
    }
  };

  const loadShippingAddresses = async () => {
    try {
      const response = await purchaseApiService.getShippingAddresses();
      if (response.success && response.data) {
        setShippingAddresses(response.data);
        
        // 기본 배송지 자동 선택
        const defaultAddress = response.data.find((addr: ShippingAddress) => addr.isDefault);
        if (defaultAddress) {
          setSelectedShippingAddress(defaultAddress);
        }
      }
    } catch (err) {
      console.error('배송지 로드 실패:', err);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await purchaseApiService.getPaymentMethods();
      if (response.success && response.data) {
        setPaymentMethods(response.data);
        
        // 기본 결제 수단 자동 선택
        const defaultPayment = response.data.find((method: PaymentMethod) => method.isDefault);
        if (defaultPayment) {
          setSelectedPaymentMethod(defaultPayment);
        }
      }
    } catch (err) {
      console.error('결제 수단 로드 실패:', err);
    }
  };

  const getOrderItems = (): CartItem[] => {
    if (directCartItem) {
      return [directCartItem];
    }
    return cart?.items || [];
  };

  const getOrderTotal = (): number => {
    if (directCartItem) {
      return directCartItem.totalPrice;
    }
    return cart?.finalPrice || 0;
  };

  const handleNextStep = () => {
    if (currentStep === 0 && !selectedShippingAddress) {
      alert(t('checkout.selectAddressFirst'), {
        variant: 'warning',
        title: t('checkout.selectAddressRequiredTitle')
      });
      return;
    }

    if (currentStep === 1 && !selectedPaymentMethod) {
      alert(t('checkout.selectPaymentFirst'), {
        variant: 'warning',
        title: t('checkout.selectPaymentRequiredTitle')
      });
      return;
    }

    setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handlePlaceOrder = async () => {
    if (!selectedShippingAddress || !selectedPaymentMethod) {
      await alert(t('checkout.selectAllRequired'), {
        variant: 'warning',
        title: t('checkout.infoMissing')
      });
      return;
    }

    const confirmed = await confirm(
      t('checkout.confirmPayment', { amount: getOrderTotal().toLocaleString() }),
      {
        title: t('checkout.orderReview'),
        confirmLabel: t('checkout.placeOrder'),
        cancelLabel: t('checkout.cancel')
      }
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      const orderData = {
        cartItems: getOrderItems(),
        shippingAddress: selectedShippingAddress,
        paymentMethod: selectedPaymentMethod,
        totalAmount: getOrderTotal()
      };

      const response = await purchaseApiService.processPayment(orderData);

      if (response.success && response.data) {
        // 주문 성공
        await alert(t('checkout.orderCompleted'), {
          variant: 'success',
          title: t('checkout.orderComplete')
        });

        // 주문 완료 페이지로 이동
        onGo(`/order-complete?orderId=${response.data.order.id}`);

        // 장바구니에서 주문한 경우 장바구니 비우기
        if (!directCartItem) {
          await purchaseApiService.clearCart();
        }
      } else {
        throw new Error(t('checkout.paymentProcessFailed'));
      }
    } catch (err) {
      console.error('주문 처리 실패:', err);
      await showError(err, {
        title: t('checkout.orderFailed'),
        showRetry: true
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A6B] mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('checkout.preparingOrder')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => onGo('/cart')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{t('checkout.title')}</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 진행 단계 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center ${
                      index < steps.length - 1 ? 'flex-1' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep === index
                          ? 'bg-[#E85A6B] text-white'
                          : step.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step.completed ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`ml-2 text-sm ${
                      currentStep === index ? 'font-medium text-gray-900' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </span>
                    {index < steps.length - 1 && (
                      <div className="flex-1 mx-4 h-0.5 bg-gray-200">
                        <div
                          className={`h-full ${
                            step.completed ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 단계별 컨텐츠 */}
            {currentStep === 0 && (
              <ShippingAddressStep
                addresses={shippingAddresses}
                selectedAddress={selectedShippingAddress}
                onSelectAddress={setSelectedShippingAddress}
                onAddAddress={() => setShowAddAddressModal(true)}
                onLoadAddresses={loadShippingAddresses}
              />
            )}

            {currentStep === 1 && (
              <PaymentMethodStep
                paymentMethods={paymentMethods}
                selectedMethod={selectedPaymentMethod}
                onSelectMethod={setSelectedPaymentMethod}
                onAddMethod={() => setShowAddPaymentModal(true)}
                onLoadMethods={loadPaymentMethods}
              />
            )}

            {currentStep === 2 && (
              <OrderReviewStep
                items={getOrderItems()}
                shippingAddress={selectedShippingAddress}
                paymentMethod={selectedPaymentMethod}
                totalAmount={getOrderTotal()}
              />
            )}

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep === 0}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('checkout.previous')}
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNextStep}
                  className="px-8 py-2 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B]"
                >
                  {t('checkout.next')}
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('checkout.processingPaymentBtn')}
                    </div>
                  ) : (
                    t('checkout.placeOrder')
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 주문 요약 사이드바 */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={getOrderItems()}
              totalAmount={getOrderTotal()}
              shippingAddress={selectedShippingAddress}
              paymentMethod={selectedPaymentMethod}
            />
          </div>
        </div>
      </div>

      {/* 모달들 */}
      {showAddAddressModal && (
        <AddAddressModal
          onClose={() => setShowAddAddressModal(false)}
          onAddressAdded={loadShippingAddresses}
        />
      )}

      {showAddPaymentModal && (
        <AddPaymentMethodModal
          onClose={() => setShowAddPaymentModal(false)}
          onPaymentAdded={loadPaymentMethods}
        />
      )}
    </div>
  );
}

// 배송지 선택 단계 컴포넌트
function ShippingAddressStep({
  addresses,
  selectedAddress,
  onSelectAddress,
  onAddAddress,
  onLoadAddresses
}: {
  addresses: ShippingAddress[];
  selectedAddress: ShippingAddress | null;
  onSelectAddress: (address: ShippingAddress) => void;
  onAddAddress: () => void;
  onLoadAddresses: () => void;
}) {
  const { t } = useTranslation('order');
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{t('checkout.shippingSelect')}</h2>
        <button
          onClick={onAddAddress}
          className="px-4 py-2 text-[#E85A6B] border border-[#E85A6B] rounded-lg hover:bg-[#FFF1F2]"
        >
          {t('checkout.addNewAddress')}
        </button>
      </div>

      <div className="space-y-4">
        {addresses.map(address => (
          <div
            key={address.id}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selectedAddress?.id === address.id
                ? 'border-[#E85A6B] bg-[#FFF1F2]'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectAddress(address)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900">{address.name}</span>
                  {address.isDefault && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">
                      {t('checkout.defaultAddress')}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-1">{address.recipient} | {address.phone}</p>
                <p className="text-gray-600 text-sm">
                  ({address.zipCode}) {address.address}
                  {address.detailAddress && `, ${address.detailAddress}`}
                </p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedAddress?.id === address.id
                  ? 'border-[#E85A6B] bg-[#E85A6B]'
                  : 'border-gray-300'
              }`}>
                {selectedAddress?.id === address.id && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}

        {addresses.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">{t('checkout.noAddressesCheckout')}</p>
            <button
              onClick={onAddAddress}
              className="px-6 py-2 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B]"
            >
              {t('checkout.addShippingAddress')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 결제 수단 선택 단계 컴포넌트
function PaymentMethodStep({
  paymentMethods,
  selectedMethod,
  onSelectMethod,
  onAddMethod,
  onLoadMethods
}: {
  paymentMethods: PaymentMethod[];
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
  onAddMethod: () => void;
  onLoadMethods: () => void;
}) {
  const { t } = useTranslation('order');
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{t('checkout.selectPaymentMethodTitle')}</h2>
        <button
          onClick={onAddMethod}
          className="px-4 py-2 text-[#E85A6B] border border-[#E85A6B] rounded-lg hover:bg-[#FFF1F2]"
        >
          {t('checkout.addNewCard')}
        </button>
      </div>

      <div className="space-y-4">
        {paymentMethods.map(method => (
          <div
            key={method.id}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selectedMethod?.id === method.id
                ? 'border-[#E85A6B] bg-[#FFF1F2]'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectMethod(method)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v2H4V6zm0 4h4v2H4v-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{method.name}</p>
                  <p className="text-sm text-gray-600">
                    {method.cardNumber} | {method.expiryDate}
                  </p>
                  {method.isDefault && (
                    <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-600 rounded mt-1">
                      {t('checkout.defaultPayment')}
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedMethod?.id === method.id
                  ? 'border-[#E85A6B] bg-[#E85A6B]'
                  : 'border-gray-300'
              }`}>
                {selectedMethod?.id === method.id && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}

        {paymentMethods.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">{t('checkout.noPaymentMethods')}</p>
            <button
              onClick={onAddMethod}
              className="px-6 py-2 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B]"
            >
              {t('checkout.addPaymentMethodBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 주문 검토 단계 컴포넌트
function OrderReviewStep({
  items,
  shippingAddress,
  paymentMethod,
  totalAmount
}: {
  items: CartItem[];
  shippingAddress: ShippingAddress | null;
  paymentMethod: PaymentMethod | null;
  totalAmount: number;
}) {
  const { t } = useTranslation('order');
  return (
    <div className="space-y-6">
      {/* 주문 상품 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.orderSummary')}</h2>
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.product.images && item.product.images[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                {Object.keys(item.selectedOptions).length > 0 && (
                  <p className="text-sm text-gray-500">
                    {Object.entries(item.selectedOptions).map(([key, value]) => 
                      `${key}: ${value}`
                    ).join(', ')}
                  </p>
                )}
                <p className="text-sm text-gray-600">{t('checkout.quantity', { count: item.quantity })}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">₩{item.totalPrice.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 배송 정보 */}
      {shippingAddress && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.shippingInfo')}</h2>
          <div>
            <p className="font-medium text-gray-900 mb-1">{shippingAddress.name}</p>
            <p className="text-gray-700">{shippingAddress.recipient} | {shippingAddress.phone}</p>
            <p className="text-gray-600">
              ({shippingAddress.zipCode}) {shippingAddress.address}
              {shippingAddress.detailAddress && `, ${shippingAddress.detailAddress}`}
            </p>
          </div>
        </div>
      )}

      {/* 결제 정보 */}
      {paymentMethod && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.paymentInfo')}</h2>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v2H4V6zm0 4h4v2H4v-2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">{paymentMethod.name}</p>
              <p className="text-sm text-gray-600">{paymentMethod.cardNumber}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 주문 요약 사이드바 컴포넌트
function OrderSummary({
  items,
  totalAmount,
  shippingAddress,
  paymentMethod
}: {
  items: CartItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress | null;
  paymentMethod: PaymentMethod | null;
}) {
  const { t } = useTranslation('order');
  const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const shippingCost = totalAmount >= 50000 ? 0 : 3000;
  const discount = 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.summary')}</h3>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>{t('checkout.itemAmount', { count: items.length })}</span>
          <span>₩{itemsTotal.toLocaleString()}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>{t('checkout.discountAmount')}</span>
            <span>-₩{discount.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>{t('checkout.shippingFee')}</span>
          <span>
            {shippingCost === 0 ? t('checkout.freeShippingLabel') : `₩${shippingCost.toLocaleString()}`}
          </span>
        </div>

        <hr />

        <div className="flex justify-between text-xl font-bold text-gray-900">
          <span>{t('checkout.totalPaymentAmount')}</span>
          <span>₩{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* 선택된 정보 요약 */}
      <div className="space-y-3 text-sm">
        {shippingAddress && (
          <div>
            <p className="font-medium text-gray-700">{t('checkout.shippingAddress')}</p>
            <p className="text-gray-600 truncate">{shippingAddress.name}</p>
          </div>
        )}

        {paymentMethod && (
          <div>
            <p className="font-medium text-gray-700">{t('checkout.paymentMethodLabel')}</p>
            <p className="text-gray-600">{paymentMethod.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 주소 추가 모달 컴포넌트 (간단한 버전)
function AddAddressModal({
  onClose,
  onAddressAdded
}: {
  onClose: () => void;
  onAddressAdded: () => void;
}) {
  const { t } = useTranslation('order');
  const { alert, error: showError } = useAlert();
  const [formData, setFormData] = useState({
    name: '',
    recipient: '',
    phone: '',
    zipCode: '',
    address: '',
    detailAddress: '',
    isDefault: false
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.recipient || !formData.phone || !formData.address) {
      await alert(t('checkout.fillRequiredFields'), {
        variant: 'warning',
        title: t('checkout.inputError')
      });
      return;
    }

    try {
      setSaving(true);

      const response = await purchaseApiService.addShippingAddress(formData);

      if (response.success) {
        await alert(t('checkout.addressAdded'), {
          variant: 'success',
          title: t('checkout.addComplete')
        });
        onAddressAdded();
        onClose();
      } else {
        throw new Error(t('checkout.addressAddFailed'));
      }
    } catch (err) {
      console.error('배송지 추가 실패:', err);
      await showError(err, { title: t('checkout.addressAddFailed') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('checkout.addNewShippingTitle')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.addressNickname')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('checkout.addressNicknamePlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.recipientLabel')}</label>
              <input
                type="text"
                value={formData.recipient}
                onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.phoneLabel')}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="010-1234-5678"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.zipCodeLabel')}</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                placeholder="12345"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.addressFieldLabel')}</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.detailAddressLabel')}</label>
              <input
                type="text"
                value={formData.detailAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, detailAddress: e.target.value }))}
                placeholder={t('checkout.detailAddressPlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="w-4 h-4 text-[#E85A6B] border-gray-300 rounded focus:ring-[#E85A6B]"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                {t('shipping.setDefault')}
              </label>
            </div>
          </div>

          <div className="flex space-x-3 mt-8">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {t('checkout.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#E85A6B] text-white py-3 rounded-lg font-medium hover:bg-[#D14A5B] disabled:opacity-50"
            >
              {saving ? t('checkout.saving') : t('checkout.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 결제 수단 추가 모달 컴포넌트 (간단한 버전)
function AddPaymentMethodModal({
  onClose,
  onPaymentAdded
}: {
  onClose: () => void;
  onPaymentAdded: () => void;
}) {
  const { t } = useTranslation('order');
  const { alert, error: showError } = useAlert();
  const [formData, setFormData] = useState({
    name: '',
    cardNumber: '',
    expiryDate: '',
    isDefault: false
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.cardNumber || !formData.expiryDate) {
      await alert(t('checkout.fillCardInfo'), {
        variant: 'warning',
        title: t('checkout.inputError')
      });
      return;
    }

    try {
      setSaving(true);

      const paymentMethod = {
        type: 'credit_card' as const,
        name: formData.name,
        provider: 'unknown',
        cardNumber: `****-****-****-${formData.cardNumber.slice(-4)}`,
        expiryDate: formData.expiryDate,
        isDefault: formData.isDefault
      };

      const response = await purchaseApiService.addPaymentMethod(paymentMethod);

      if (response.success) {
        await alert(t('checkout.paymentMethodAdded'), {
          variant: 'success',
          title: t('checkout.addComplete')
        });
        onPaymentAdded();
        onClose();
      } else {
        throw new Error(t('checkout.paymentMethodAddFailed'));
      }
    } catch (err) {
      console.error('결제 수단 추가 실패:', err);
      await showError(err, { title: t('checkout.paymentMethodAddFailed') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('checkout.addNewPaymentTitle')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.cardName')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('checkout.cardNamePlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.cardNumber')}</label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: e.target.value }))}
                placeholder="1234-5678-9012-3456"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.expiryDate')}</label>
              <input
                type="text"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                placeholder="MM/YY"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefaultPayment"
                checked={formData.isDefault}
                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="w-4 h-4 text-[#E85A6B] border-gray-300 rounded focus:ring-[#E85A6B]"
              />
              <label htmlFor="isDefaultPayment" className="ml-2 text-sm text-gray-700">
                {t('checkout.defaultPaymentSetting')}
              </label>
            </div>
          </div>

          <div className="flex space-x-3 mt-8">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {t('checkout.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#E85A6B] text-white py-3 rounded-lg font-medium hover:bg-[#D14A5B] disabled:opacity-50"
            >
              {saving ? t('checkout.saving') : t('checkout.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}