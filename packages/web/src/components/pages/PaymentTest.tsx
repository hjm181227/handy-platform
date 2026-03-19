import { useState } from 'react';
import { useAlert } from '../common';
import { purchaseApiService } from '../../services/purchaseApiService';
import { webApiService } from '../../services/apiService';

interface PaymentTestProps {
  onGo: (path: string) => void;
}

export function PaymentTest({ onGo }: PaymentTestProps) {
  const { alert, error: showError } = useAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  // 인증 상태 확인
  const checkAuth = async () => {
    try {
      const isAuth = await webApiService.isAuthenticated();
      const user = await webApiService.getCurrentUser();
      setIsAuthenticated(isAuth);

      addTestResult({
        step: '인증 확인',
        success: isAuth,
        data: { isAuthenticated: isAuth, user: user?.name || 'unknown' },
        message: isAuth ? '로그인됨' : '로그인 필요'
      });
    } catch (error: any) {
      addTestResult({
        step: '인증 확인',
        success: false,
        error: error.message,
        message: '인증 상태 확인 실패'
      });
    }
  };

  // 테스트 주문 생성
  const createTestOrder = async () => {
    try {
      setIsLoading(true);

      const orderData = {
        shippingAddress: {
          street: '서울특별시 강남구 테헤란로 123',
          city: '서울',
          state: '서울특별시',
          zipCode: '12345',
          country: 'KR',
          name: '테스트 사용자',
          phone: '010-1234-5678'
        },
        paymentMethod: 'KAKAO_PAY',
        useCart: false, // 테스트이므로 장바구니 사용 안함
        items: [
          {
            productId: 'test-product-001',
            quantity: 1,
            options: { color: 'red', size: 'M' }
          }
        ]
      };

      const orderResponse = await webApiService.order.createOrder(orderData);

      addTestResult({
        step: '테스트 주문 생성',
        success: orderResponse.success,
        data: orderResponse.data,
        message: orderResponse.success ? '주문 생성 성공' : '주문 생성 실패'
      });

      return orderResponse.data?.order?.id;
    } catch (error: any) {
      addTestResult({
        step: '테스트 주문 생성',
        success: false,
        error: error.message,
        message: '주문 생성 중 오류 발생'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 카카오페이 결제 준비 테스트
  const testKakaoPayPrepare = async () => {
    try {
      setIsLoading(true);

      // MongoDB 트랜잭션 오류로 인해 주문 생성을 건너뛰고 직접 결제 테스트
      const mockOrderId = `test_order_${Date.now()}`;

      addTestResult({
        step: '테스트 주문 ID 생성',
        success: true,
        data: { orderId: mockOrderId },
        message: 'MongoDB 트랜잭션 오류 회피를 위해 모의 주문 ID 사용'
      });

      // 카카오페이 결제 준비 (새로운 API 스펙)
      const paymentData = {
        amount: 10000,
        payMethod: 'KAKAO_PAY',
        items: [
          {
            productUuid: 'test-product-1',
            shape: 'round',
            size: 'medium',
            quantity: 1,
            price: 10000
          }
        ],
        callbackUrls: {
          success: `${import.meta.env.VITE_API_URL || 'http://localhost:11000'}/api/payment/callback/success`,
          cancel: `${import.meta.env.VITE_API_URL || 'http://localhost:11000'}/api/payment/callback/cancel`,
          fail: `${import.meta.env.VITE_API_URL || 'http://localhost:11000'}/api/payment/callback/fail`
        }
      };

      const prepareResponse = await purchaseApiService.preparePayment(paymentData);

      addTestResult({
        step: '카카오페이 결제 준비',
        success: prepareResponse.success,
        data: prepareResponse.data,
        message: prepareResponse.success ? '결제 준비 성공' : '결제 준비 실패'
      });

      if (prepareResponse.success && prepareResponse.data?.paymentUrl) {
        // 결제 페이지로 이동 확인
        const confirmResult = await confirm(
          `결제 페이지로 이동하시겠습니까?\n\n결제 URL: ${prepareResponse.data.paymentUrl}`
        );

        if (confirmResult) {
          window.location.href = prepareResponse.data.paymentUrl;
        }
      }

    } catch (error: any) {
      addTestResult({
        step: '카카오페이 결제 준비',
        success: false,
        error: error.message,
        message: '결제 준비 중 오류 발생'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // API 연결 테스트
  const testApiConnection = async () => {
    try {
      setIsLoading(true);

      // API 기본 연결 테스트
      const token = await webApiService.auth.getAuthToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://15.165.5.64:3001'}/api/payment/config`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const result = await response.json();

      addTestResult({
        step: 'API 연결 테스트',
        success: response.ok,
        data: result,
        message: response.ok ? 'API 연결 성공' : 'API 연결 실패'
      });

    } catch (error: any) {
      addTestResult({
        step: 'API 연결 테스트',
        success: false,
        error: error.message,
        message: 'API 연결 중 오류 발생'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTestResult = (result: any) => {
    setTestResults(prev => [...prev, {
      ...result,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onGo('/')}
              className="text-gray-400 hover:text-gray-600"
            >
              ← 홈으로
            </button>
            <h1 className="text-xl font-bold">카카오페이 API 테스트</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 테스트 버튼들 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">테스트 실행</h2>

            <div className="space-y-3">
              <button
                onClick={checkAuth}
                disabled={isLoading}
                className="w-full bg-[#E85A6B] text-white py-2 px-4 rounded-lg hover:bg-[#D14A5B] disabled:opacity-50"
              >
                1. 인증 상태 확인
              </button>

              <button
                onClick={testApiConnection}
                disabled={isLoading}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                2. API 연결 테스트
              </button>

              <button
                onClick={testKakaoPayPrepare}
                disabled={isLoading || !isAuthenticated}
                className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 disabled:opacity-50"
              >
                3. 카카오페이 결제 테스트
              </button>

              <button
                onClick={clearResults}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
              >
                결과 초기화
              </button>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>테스트 순서:</strong><br />
                1. 먼저 인증 상태를 확인하세요<br />
                2. API 연결을 테스트하세요<br />
                3. 로그인 후 카카오페이 결제를 테스트하세요
              </p>
            </div>
          </div>

          {/* 테스트 결과 */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">테스트 결과</h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  테스트를 실행하면 결과가 여기에 표시됩니다.
                </p>
              ) : (
                testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{result.step}</span>
                      <span className="text-sm text-gray-500">{result.timestamp}</span>
                    </div>
                    <p className={`text-sm ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.message}
                    </p>
                    {result.error && (
                      <p className="text-xs text-red-600 mt-1">
                        오류: {result.error}
                      </p>
                    )}
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer">
                          상세 데이터 보기
                        </summary>
                        <pre className="text-xs text-gray-700 mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">환경 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">현재 URL:</span> {window.location.href}
            </div>
            <div>
              <span className="font-medium">API Base URL:</span> {import.meta.env.VITE_API_BASE_URL || 'http://15.165.5.64:3001'}
            </div>
            <div>
              <span className="font-medium">Mock API:</span> {USE_MOCK_API ? '활성화' : '비활성화'}
            </div>
            <div>
              <span className="font-medium">인증 상태:</span> {isAuthenticated ? '로그인됨' : '로그인 필요'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock API 상태를 가져오기 위한 import
import { USE_MOCK_API } from '../../services/mockApiService';
