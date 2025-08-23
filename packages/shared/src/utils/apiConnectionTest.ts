import { createApiService, IntegratedApiService } from '../services/ApiServiceFactory';
import { API_BASE_URL } from '../config/api';

interface TestResult {
  service: string;
  method: string;
  success: boolean;
  error?: string;
  response?: any;
  duration?: number;
}

interface ConnectionTestResults {
  environment: string;
  baseURL: string;
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
  summary: {
    auth: { passed: number; failed: number };
    product: { passed: number; failed: number };
    commerce: { passed: number; failed: number };
    seller: { passed: number; failed: number };
    loyalty: { passed: number; failed: number };
  };
}

export class ApiConnectionTester {
  private apiService: IntegratedApiService;
  private results: TestResult[] = [];

  constructor(
    getAuthHeaders: () => Promise<Record<string, string>> = async () => ({}),
    platform: string = 'test'
  ) {
    this.apiService = createApiService(API_BASE_URL, getAuthHeaders, platform);
  }

  private async runTest(
    service: string,
    method: string,
    testFn: () => Promise<any>
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await testFn();
      const duration = Date.now() - startTime;
      
      return {
        service,
        method,
        success: true,
        response: typeof response === 'object' ? 'Object returned' : response,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        service,
        method,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }

  async testBasicConnection(): Promise<TestResult[]> {
    console.log('🔌 Testing basic API connection...');
    
    const tests = [
      // 기본 연결 테스트
      this.runTest('connection', 'healthCheck', async () => {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      }),

      // 상품 목록 (인증 불필요)
      this.runTest('product', 'getProducts', async () => {
        return await this.apiService.product.getProducts({ limit: 1 });
      }),

      // 카테고리 조회 (인증 불필요)
      this.runTest('product', 'getCategories', async () => {
        return await this.apiService.product.getCategories();
      }),

      // 브랜드 조회 (인증 불필요)
      this.runTest('product', 'getBrands', async () => {
        return await this.apiService.product.getBrands();
      }),

      // 추천 상품 (인증 불필요)
      this.runTest('product', 'getFeaturedProducts', async () => {
        return await this.apiService.product.getFeaturedProducts(5);
      }),

      // 배송 방법 조회
      this.runTest('shipping', 'getShippingMethods', async () => {
        return await this.apiService.shipping.getShippingMethods();
      }),

      // 결제 수단 조회
      this.runTest('payment', 'getPaymentMethods', async () => {
        return await this.apiService.payment.getPaymentMethods();
      }),
    ];

    const results = await Promise.all(tests);
    this.results.push(...results);
    return results;
  }

  async testAuthenticatedEndpoints(credentials?: {
    email: string;
    password: string;
  }): Promise<TestResult[]> {
    console.log('🔐 Testing authenticated endpoints...');
    
    if (!credentials) {
      console.log('⚠️ No credentials provided, skipping authenticated tests');
      return [];
    }

    const tests = [
      // 로그인 테스트
      this.runTest('auth', 'login', async () => {
        return await this.apiService.auth.login(credentials);
      }),

      // 프로필 조회 (로그인 후)
      this.runTest('auth', 'getUserProfile', async () => {
        return await this.apiService.auth.getUserProfile();
      }),

      // 장바구니 조회
      this.runTest('cart', 'getCart', async () => {
        return await this.apiService.cart.getCart();
      }),

      // 주문 목록 조회
      this.runTest('order', 'getOrders', async () => {
        return await this.apiService.order.getOrders({ limit: 1 });
      }),

      // 쿠폰 조회
      this.runTest('loyalty', 'getUserCoupons', async () => {
        return await this.apiService.loyalty.getUserCoupons({ limit: 1 });
      }),

      // 포인트 잔액 조회
      this.runTest('loyalty', 'getPointsBalance', async () => {
        return await this.apiService.loyalty.getPointsBalance();
      }),
    ];

    const results = await Promise.all(tests);
    this.results.push(...results);
    return results;
  }

  async testSellerEndpoints(): Promise<TestResult[]> {
    console.log('🏪 Testing seller endpoints...');

    const tests = [
      // 판매자 대시보드
      this.runTest('seller', 'getSellerDashboard', async () => {
        return await this.apiService.seller.getSellerDashboard();
      }),

      // 판매자 상품 목록
      this.runTest('seller', 'getSellerProducts', async () => {
        return await this.apiService.seller.getSellerProducts({ limit: 1 });
      }),

      // 판매자 주문 목록
      this.runTest('seller', 'getSellerOrders', async () => {
        return await this.apiService.seller.getSellerOrders({ limit: 1 });
      }),
    ];

    const results = await Promise.all(tests);
    this.results.push(...results);
    return results;
  }

  generateReport(): ConnectionTestResults {
    const summary = {
      auth: { passed: 0, failed: 0 },
      product: { passed: 0, failed: 0 },
      commerce: { passed: 0, failed: 0 },
      seller: { passed: 0, failed: 0 },
      loyalty: { passed: 0, failed: 0 },
    };

    this.results.forEach((result) => {
      const category = this.getCategoryFromService(result.service);
      if (result.success) {
        summary[category].passed++;
      } else {
        summary[category].failed++;
      }
    });

    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.filter(r => !r.success).length;

    return {
      environment: this.apiService.getEnvironmentInfo().platform,
      baseURL: API_BASE_URL,
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passedTests,
      failedTests,
      results: this.results,
      summary,
    };
  }

  private getCategoryFromService(service: string): 'auth' | 'product' | 'commerce' | 'seller' | 'loyalty' {
    if (service === 'auth') return 'auth';
    if (service === 'product') return 'product';
    if (['cart', 'order', 'payment', 'shipping'].includes(service)) return 'commerce';
    if (service === 'seller') return 'seller';
    if (service === 'loyalty') return 'loyalty';
    return 'product'; // 기본값
  }

  printReport(): void {
    const report = this.generateReport();
    
    console.log('\n📊 API Connection Test Report');
    console.log('='.repeat(50));
    console.log(`🌍 Environment: ${report.environment}`);
    console.log(`🔗 Base URL: ${report.baseURL}`);
    console.log(`⏰ Timestamp: ${report.timestamp}`);
    console.log(`📈 Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.passedTests}`);
    console.log(`❌ Failed: ${report.failedTests}`);
    console.log(`📊 Success Rate: ${((report.passedTests / report.totalTests) * 100).toFixed(1)}%`);

    console.log('\n📋 Category Summary:');
    Object.entries(report.summary).forEach(([category, stats]) => {
      if (stats.passed + stats.failed > 0) {
        console.log(`  ${category}: ✅${stats.passed} ❌${stats.failed}`);
      }
    });

    console.log('\n🔍 Detailed Results:');
    report.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? `(${result.duration}ms)` : '';
      console.log(`  ${index + 1}. ${status} ${result.service}.${result.method} ${duration}`);
      
      if (!result.success && result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });

    console.log('\n' + '='.repeat(50));
  }
}

// 편의 함수들
export async function runBasicApiTest(): Promise<ConnectionTestResults> {
  const tester = new ApiConnectionTester();
  await tester.testBasicConnection();
  return tester.generateReport();
}

export async function runFullApiTest(credentials?: {
  email: string;
  password: string;
}): Promise<ConnectionTestResults> {
  const tester = new ApiConnectionTester();
  
  await tester.testBasicConnection();
  if (credentials) {
    await tester.testAuthenticatedEndpoints(credentials);
    // await tester.testSellerEndpoints(); // 판매자 계정일 때만
  }
  
  tester.printReport();
  return tester.generateReport();
}

