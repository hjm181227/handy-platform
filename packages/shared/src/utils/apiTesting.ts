import { ApiError } from './apiHelpers';
import { API_ENDPOINTS, getApiConfig } from '../config/api';

export interface ApiTestResult {
  endpoint: string;
  method: string;
  success: boolean;
  status?: number;
  responseTime: number;
  error?: string;
  data?: any;
}

export interface ApiTestSuite {
  name: string;
  tests: ApiTestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalTime: number;
}

export class ApiTester {
  private baseURL: string;
  private getAuthHeaders: () => Promise<Record<string, string>>;
  private timeout: number;

  constructor(baseURL?: string, getAuthHeaders?: () => Promise<Record<string, string>>) {
    const config = getApiConfig();
    this.baseURL = baseURL || config.baseURL;
    this.getAuthHeaders = getAuthHeaders || (() => Promise.resolve({ 'Content-Type': 'application/json' }));
    this.timeout = config.timeout;
  }

  // 단일 API 엔드포인트 테스트
  async testEndpoint(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    expectedStatus: number = 200,
    requireAuth: boolean = false
  ): Promise<ApiTestResult> {
    const startTime = Date.now();
    const url = `${this.baseURL}${endpoint}`;

    try {
      const headers = requireAuth 
        ? await this.getAuthHeaders()
        : { 'Content-Type': 'application/json' };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      const success = response.status === expectedStatus;

      return {
        endpoint,
        method,
        success,
        status: response.status,
        responseTime,
        data: success ? data : undefined,
        error: !success ? `Expected ${expectedStatus}, got ${response.status}` : undefined,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint,
        method,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 기본 API 헬스체크 테스트
  async testHealthCheck(): Promise<ApiTestResult> {
    return this.testEndpoint('/api/health', 'GET', undefined, 200, false);
  }

  // 인증이 필요 없는 공개 API 테스트
  async testPublicEndpoints(): Promise<ApiTestSuite> {
    const tests: ApiTestResult[] = [];
    const startTime = Date.now();

    // 상품 목록 조회
    tests.push(await this.testEndpoint(API_ENDPOINTS.PRODUCTS.LIST, 'GET'));
    
    // 상품 목록 조회
    tests.push(await this.testEndpoint(API_ENDPOINTS.PRODUCTS.LIST, 'GET'));
    
    
    
    // 업로드 설정 조회
    tests.push(await this.testEndpoint(API_ENDPOINTS.UPLOAD.CONFIG, 'GET'));

    const totalTime = Date.now() - startTime;
    const passedTests = tests.filter(t => t.success).length;
    const failedTests = tests.length - passedTests;

    return {
      name: 'Public API Endpoints',
      tests,
      totalTests: tests.length,
      passedTests,
      failedTests,
      totalTime,
    };
  }

  // 인증이 필요한 API 테스트 (로그인 후)
  async testAuthenticatedEndpoints(): Promise<ApiTestSuite> {
    const tests: ApiTestResult[] = [];
    const startTime = Date.now();

    // 사용자 프로필 조회
    tests.push(await this.testEndpoint(API_ENDPOINTS.AUTH.PROFILE, 'GET', undefined, 200, true));
    
    // 장바구니 조회
    tests.push(await this.testEndpoint(API_ENDPOINTS.CART.GET, 'GET', undefined, 200, true));
    
    // 장바구니 개수 조회
    tests.push(await this.testEndpoint(API_ENDPOINTS.CART.COUNT, 'GET', undefined, 200, true));
    
    // 주문 목록 조회
    tests.push(await this.testEndpoint(API_ENDPOINTS.ORDERS.LIST, 'GET', undefined, 200, true));
    
    // 사용자 쿠폰 조회
    tests.push(await this.testEndpoint(API_ENDPOINTS.COUPONS.USER_COUPONS, 'GET', undefined, 200, true));
    
    // 포인트 잔액 조회
    tests.push(await this.testEndpoint(API_ENDPOINTS.POINTS.BALANCE, 'GET', undefined, 200, true));

    const totalTime = Date.now() - startTime;
    const passedTests = tests.filter(t => t.success).length;
    const failedTests = tests.length - passedTests;

    return {
      name: 'Authenticated API Endpoints',
      tests,
      totalTests: tests.length,
      passedTests,
      failedTests,
      totalTime,
    };
  }

  // 로그인 플로우 테스트
  async testLoginFlow(email: string, password: string): Promise<ApiTestSuite> {
    const tests: ApiTestResult[] = [];
    const startTime = Date.now();

    // 1. 로그인 시도
    const loginTest = await this.testEndpoint(
      API_ENDPOINTS.AUTH.LOGIN,
      'POST',
      { email, password },
      200,
      false
    );
    tests.push(loginTest);

    if (loginTest.success && loginTest.data?.token) {
      // 로그인 성공 시 토큰으로 인증된 요청 테스트
      const token = loginTest.data.token;
      
      // 임시로 헤더 설정
      const originalGetAuthHeaders = this.getAuthHeaders;
      this.getAuthHeaders = () => Promise.resolve({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      });

      // 2. 프로필 조회
      tests.push(await this.testEndpoint(API_ENDPOINTS.AUTH.PROFILE, 'GET', undefined, 200, true));

      // 3. 로그아웃
      tests.push(await this.testEndpoint(API_ENDPOINTS.AUTH.LOGOUT, 'POST', undefined, 200, true));

      // 헤더 복원
      this.getAuthHeaders = originalGetAuthHeaders;
    }

    const totalTime = Date.now() - startTime;
    const passedTests = tests.filter(t => t.success).length;
    const failedTests = tests.length - passedTests;

    return {
      name: 'Login Flow',
      tests,
      totalTests: tests.length,
      passedTests,
      failedTests,
      totalTime,
    };
  }

  // 이미지 업로드 플로우 테스트
  async testImageUploadFlow(): Promise<ApiTestSuite> {
    const tests: ApiTestResult[] = [];
    const startTime = Date.now();

    // 1. presigned URL 요청
    const presignedTest = await this.testEndpoint(
      API_ENDPOINTS.UPLOAD.PRESIGNED_URL,
      'POST',
      {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg',
        uploadType: 'general',
      },
      200,
      true
    );
    tests.push(presignedTest);

    // 2. 업로드 설정 조회
    tests.push(await this.testEndpoint(API_ENDPOINTS.UPLOAD.CONFIG, 'GET', undefined, 200, false));

    const totalTime = Date.now() - startTime;
    const passedTests = tests.filter(t => t.success).length;
    const failedTests = tests.length - passedTests;

    return {
      name: 'Image Upload Flow',
      tests,
      totalTests: tests.length,
      passedTests,
      failedTests,
      totalTime,
    };
  }

  // 전체 API 테스트 스위트 실행
  async runFullTestSuite(credentials?: { email: string; password: string }): Promise<{
    suites: ApiTestSuite[];
    summary: {
      totalSuites: number;
      totalTests: number;
      totalPassed: number;
      totalFailed: number;
      totalTime: number;
      successRate: number;
    };
  }> {
    const suites: ApiTestSuite[] = [];
    const startTime = Date.now();

    console.log('🧪 Starting API Test Suite...\n');

    // 1. 공개 API 테스트
    console.log('Testing public endpoints...');
    const publicSuite = await this.testPublicEndpoints();
    suites.push(publicSuite);
    this.logSuiteResults(publicSuite);

    // 2. 로그인 플로우 테스트 (자격 증명이 제공된 경우)
    if (credentials) {
      console.log('Testing login flow...');
      const loginSuite = await this.testLoginFlow(credentials.email, credentials.password);
      suites.push(loginSuite);
      this.logSuiteResults(loginSuite);

      if (loginSuite.tests[0]?.success && loginSuite.tests[0]?.data?.token) {
        // 로그인 성공 시 인증된 API 테스트
        const token = loginSuite.tests[0].data.token;
        this.getAuthHeaders = () => Promise.resolve({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        });

        console.log('Testing authenticated endpoints...');
        const authSuite = await this.testAuthenticatedEndpoints();
        suites.push(authSuite);
        this.logSuiteResults(authSuite);

        console.log('Testing image upload flow...');
        const uploadSuite = await this.testImageUploadFlow();
        suites.push(uploadSuite);
        this.logSuiteResults(uploadSuite);
      }
    } else {
      console.log('⚠️  Skipping authenticated tests (no credentials provided)');
    }

    const totalTime = Date.now() - startTime;
    const totalTests = suites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = suites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = suites.reduce((sum, suite) => sum + suite.failedTests, 0);
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    const summary = {
      totalSuites: suites.length,
      totalTests,
      totalPassed,
      totalFailed,
      totalTime,
      successRate,
    };

    this.logSummary(summary);

    return { suites, summary };
  }

  // 테스트 스위트 결과 로깅
  private logSuiteResults(suite: ApiTestSuite): void {
    console.log(`\n📊 ${suite.name}`);
    console.log(`   Tests: ${suite.passedTests}/${suite.totalTests} passed`);
    console.log(`   Time: ${suite.totalTime}ms`);
    
    // 실패한 테스트 상세 정보
    const failedTests = suite.tests.filter(t => !t.success);
    if (failedTests.length > 0) {
      console.log(`   ❌ Failed tests:`);
      failedTests.forEach(test => {
        console.log(`      ${test.method} ${test.endpoint}: ${test.error}`);
      });
    }
  }

  // 전체 결과 요약 로깅
  private logSummary(summary: any): void {
    console.log('\n' + '='.repeat(50));
    console.log('📈 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Suites: ${summary.totalSuites}`);
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.totalPassed}`);
    console.log(`Failed: ${summary.totalFailed}`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Total Time: ${summary.totalTime}ms`);
    console.log('='.repeat(50));
    
    if (summary.successRate === 100) {
      console.log('🎉 All tests passed!');
    } else if (summary.successRate >= 80) {
      console.log('✅ Most tests passed');
    } else {
      console.log('⚠️  Many tests failed - check your API server');
    }
  }
}

// 간편한 API 테스트 실행 함수
export async function runApiTests(
  options: {
    baseURL?: string;
    credentials?: { email: string; password: string };
    getAuthHeaders?: () => Promise<Record<string, string>>;
  } = {}
): Promise<void> {
  const tester = new ApiTester(options.baseURL, options.getAuthHeaders);
  await tester.runFullTestSuite(options.credentials);
}

// 개발 환경에서 빠른 헬스체크
export async function quickHealthCheck(baseURL?: string): Promise<boolean> {
  const tester = new ApiTester(baseURL);
  
  try {
    const result = await tester.testHealthCheck();
    
    if (result.success) {
      console.log(`✅ API server is healthy (${result.responseTime}ms)`);
      return true;
    } else {
      console.log(`❌ API server health check failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ API server is unreachable: ${error}`);
    return false;
  }
}