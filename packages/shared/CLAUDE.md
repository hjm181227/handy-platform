# Shared Package - CLAUDE.md

> **전체 프로젝트 가이드**: 루트 [CLAUDE.md](../../CLAUDE.md) 참조
> **모바일 앱 가이드**: [packages/mobile/CLAUDE.md](../mobile/CLAUDE.md) 참조
> **웹 앱 가이드**: [packages/web/CLAUDE.md](../web/CLAUDE.md) 참조

공통 타입, 유틸리티, API 서비스 관련 가이드입니다.

## 패키지 빌드

```bash
# shared 패키지 빌드 (필수 - 다른 패키지에서 사용 전 빌드 필요)
npm run build:shared
```

---

## API 관리 구조 (중요!)

### 기능별 API 서비스 구조

프로젝트에서 **기능별로 분류된 API 서비스 구조**를 사용합니다. 서버 API와 일치하도록 설계되었습니다.

### API 서비스 구조
```
packages/shared/src/services/
├── base/               # 공통 베이스 클래스
│   └── BaseApiService.ts
├── auth/               # 인증 관련 (로그인, OAuth, 프로필)
│   └── AuthService.ts
├── product/            # 상품 관련
│   ├── ProductService.ts    # 상품 조회, 검색, 카테고리
│   └── ReviewService.ts     # 리뷰 작성, 조회, 평점
├── commerce/           # 상거래 관련
│   ├── CartService.ts       # 장바구니 관리
│   ├── OrderService.ts      # 주문 생성, 조회, 추적
│   └── PaymentService.ts    # 결제 처리, 환불
├── seller/             # 판매자 관련
│   └── SellerService.ts     # 판매자 등록, 상품/주문 관리
├── loyalty/            # 고객 혜택 관련
│   └── LoyaltyService.ts    # 쿠폰, 포인트 관리
├── utils/              # 유틸리티 서비스
│   ├── ImageService.ts      # 이미지 업로드/관리
│   ├── ShippingService.ts   # 배송 관련
│   └── QRService.ts         # QR 코드 생성/처리
└── ApiServiceFactory.ts     # 통합 팩토리
```

### API 추가/변경 시 반드시 지켜야 할 원칙

1. **기능별 분류**: 새로운 API는 기능에 따라 적절한 서비스 파일에 추가
2. **서버 스펙 우선**: 서버 API 문서와 일치하도록 구현
3. **일관된 패턴**: 기존 서비스 패턴을 따라 구현

### API 추가 절차

**1단계: API 엔드포인트 추가**
```typescript
// packages/shared/src/config/api.ts에 추가
export const API_ENDPOINTS = {
  // 기존 엔드포인트들...

  NEW_FEATURE: {
    LIST: '/api/new-feature',
    DETAIL: (id: string) => `/api/new-feature/${id}`,
    CREATE: '/api/new-feature',
    // ... 더 많은 엔드포인트
  }
}
```

**2단계: 해당 서비스에 메서드 추가**
```typescript
// packages/shared/src/services/[category]/[Service].ts
export abstract class BaseNewFeatureService extends BaseApiService {
  async getNewFeatures(): Promise<ApiResponse<NewFeature[]>> {
    return this.request<ApiResponse<NewFeature[]>>(API_ENDPOINTS.NEW_FEATURE.LIST);
  }

  async createNewFeature(data: CreateNewFeatureRequest): Promise<ApiResponse<NewFeature>> {
    return this.request<ApiResponse<NewFeature>>(API_ENDPOINTS.NEW_FEATURE.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
```

**3단계: 타입 정의 추가**
```typescript
// packages/shared/src/types/index.ts에 추가
export interface NewFeature {
  id: string;
  name: string;
  // ... 기타 필드
}

export interface CreateNewFeatureRequest {
  name: string;
  // ... 기타 필드
}
```

**4단계: 통합 서비스에 추가**
```typescript
// packages/shared/src/services/ApiServiceFactory.ts 업데이트
export interface IntegratedApiService {
  // 기존 서비스들...
  newFeature: BaseNewFeatureService;
}

// constructor에서 초기화
this.newFeature = NewFeatureServiceFactory.create(baseURL, getAuthHeaders);
```

**5단계: 플랫폼별 서비스에서 사용**
```typescript
// packages/web/src/services/apiService.ts
// packages/mobile/src/services/apiService.ts
export const { newFeature: newFeatureService } = webApiService; // 또는 mobileApiService
```

### 사용 예시

**컴포넌트에서 사용**
```typescript
import { productService, cartService, authService } from '@/services/apiService';

// 상품 조회
const products = await productService.getProducts({ category: 'electronics' });

// 장바구니 추가
await cartService.addToCart(productId, 1, { color: 'red', size: 'L' });

// 로그인
await authService.loginAndStoreToken({ email, password });
```

### 중요한 규칙들

1. **절대 기존 패턴을 깨지 마세요**: 모든 서비스는 `BaseApiService`를 상속받고 팩토리 패턴을 사용
2. **타입 안정성**: 모든 API 호출에 정확한 타입 정의 필요
3. **에러 처리**: `BaseApiService`의 공통 에러 처리 로직 활용
4. **플랫폼별 차이**: 웹은 localStorage, 모바일은 AsyncStorage 사용
5. **레거시 호환성**: 기존 코드가 깨지지 않도록 점진적 마이그레이션
6. **문서화**: 새로운 API 추가 시 반드시 이 가이드 문서 업데이트
7. **코드 리뷰 필수**: 모든 변경 사항은 코드 리뷰를 통해 검증
8. **테스트 작성**: 주요 API 메서드에 대한 단위 테스트 작성 권장

### 장점

- **관리 용이**: auth, seller, product 등 관련 기능들이 한 곳에 모여있음
- **재사용성**: shared 패키지로 모든 플랫폼에서 동일한 로직 사용
- **확장성**: 새로운 기능 추가 시 해당 카테고리에만 추가하면 됨
- **타입 안정성**: TypeScript로 컴파일 타임에 오류 검출

---

## NavigateService

플랫폼 독립적 네비게이션 API를 제공합니다.

### 아키텍처

```
packages/shared/src/services/navigate/
├── types.ts                    # 타입 정의
├── NavigateService.web.ts      # Web 구현
├── NavigateService.native.ts   # Native 구현
└── index.ts                    # 플랫폼별 export
```

### 타입 정의

```typescript
// packages/shared/src/services/navigate/types.ts
export interface INavigateService {
  goToMeasureSize(): void;
  goToNailSizes(): void;
  goToCamera(): void;
  goToWebPage?(path: string): void;
}

export type NavigationMessageType =
  | 'NAVIGATE_TO_MEASUREMENT'
  | 'NAVIGATE_TO_SIZES'
  | 'NAVIGATE_TO_CAMERA'
  | 'NAVIGATE_BACK';
```

### 사용 방법

```typescript
import navigateService from '@handy-platform/shared/src/services/navigate';

// 네이티브 화면으로 이동
navigateService.goToMeasureSize();
navigateService.goToNailSizes();
navigateService.goToCamera();
```

---

## Chat 서비스 아키텍처

Socket.IO 기반 실시간 채팅 서비스입니다.

### 구조

```
packages/shared/src/services/chat/
├── BaseChatService.ts        # 추상 베이스 클래스
├── ChatService.native.ts     # React Native 구현 (모바일 앱)
├── ChatService.web.ts        # Web 구현 (WebView 감지)
├── types.ts                  # 공통 타입 정의
└── index.ts                  # 플랫폼별 export
```

### 타입 정의

```typescript
interface Message {
  id: string;
  roomId: string;
  sender: 'me' | 'other';
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
  clientMessageId?: string;
}

interface ChatRoom {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  userIds?: string[];
}

interface TypingIndicator {
  roomId: string;
  userId: string;
  isTyping: boolean;
}
```

> 상세 사용법은 [packages/mobile/CLAUDE.md](../mobile/CLAUDE.md#socketio-실시간-채팅-기능) 참조

---

## API 연동 가이드라인 (필수!)

### API 호출 시 반드시 따라야 할 UX 처리 패턴

모든 API 연동 작업에서는 다음 패턴을 **반드시** 준수해야 합니다:

### 기본 처리 흐름

1. **로딩 상태 표시** → 2. **API 호출** → 3. **응답에 따른 UX 처리** → 4. **에러 핸들링**

### 구현 템플릿

**React 컴포넌트에서의 표준 패턴:**

```typescript
import { useState } from 'react';
import { productService } from '@/services/apiService';
import { handleApiError } from '@handy-platform/shared';

const ExampleComponent = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = async () => {
    try {
      // 1. 로딩 시작
      setLoading(true);
      setError(null);

      // 2. API 호출
      const response = await productService.getProducts({ limit: 10 });

      // 3. 성공 처리
      setData(response.products);

      // 4. 성공 피드백 (선택적)
      showSuccessToast('상품을 성공적으로 불러왔습니다');

    } catch (error) {
      // 5. 에러 처리
      const errorMessage = handleApiError(error);
      setError(errorMessage);

      // 6. 사용자에게 에러 표시
      showErrorToast(errorMessage);

      // 7. 에러 로깅 (디버깅용)
      console.error('Product fetch failed:', error);

    } finally {
      // 8. 로딩 종료
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {data && <ProductList products={data} />}
      <button onClick={handleApiCall} disabled={loading}>
        {loading ? '로딩 중...' : '상품 불러오기'}
      </button>
    </div>
  );
};
```

### 에러 코드별 처리 가이드

**1. 인증 관련 에러 (401, 403)**
```typescript
try {
  await authService.getUserProfile();
} catch (error) {
  if (error.status === 401) {
    // 토큰 만료 → 로그인 페이지로 리다이렉트
    showErrorToast('로그인이 필요합니다');
    redirectToLogin();
  } else if (error.status === 403) {
    // 권한 부족 → 접근 거부 메시지
    showErrorToast('접근 권한이 없습니다');
  }
}
```

**2. 클라이언트 에러 (400번대)**
```typescript
try {
  await cartService.addToCart(productId, quantity);
} catch (error) {
  if (error.status === 400) {
    // 잘못된 요청 → 사용자에게 구체적인 안내
    showErrorToast(error.message || '입력 정보를 확인해주세요');
  } else if (error.status === 409) {
    // 충돌 → 상태 동기화 필요
    showWarningToast('이미 장바구니에 있는 상품입니다');
    refreshCart();
  }
}
```

**3. 서버 에러 (500번대)**
```typescript
try {
  await orderService.createOrder(orderData);
} catch (error) {
  if (error.status >= 500) {
    // 서버 오류 → 재시도 옵션 제공
    showErrorToast('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요', {
      action: { label: '재시도', onClick: () => retryOrder() }
    });
  }
}
```

**4. 네트워크 에러**
```typescript
try {
  await productService.getProducts();
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // 네트워크 연결 문제
    showErrorToast('인터넷 연결을 확인해주세요', {
      action: { label: '재시도', onClick: () => retry() }
    });
  }
}
```

### UX 상태별 처리 방법

**로딩 상태:**
```typescript
// 전체 화면 로딩
{isInitialLoading && <FullScreenLoader />}

// 버튼 로딩
<button disabled={loading}>
  {loading ? <Spinner size="sm" /> : '저장'}
</button>

// 리스트 로딩
{loading ? <SkeletonList /> : <ProductList />}

// 무한 스크롤 로딩
{loadingMore && <LoadingMore />}
```

**에러 상태:**
```typescript
// 인라인 에러
{error && <InlineError message={error} />}

// 전체 화면 에러
{criticalError && <ErrorBoundary error={criticalError} />}

// 토스트 알림
showErrorToast(error.message, {
  duration: 5000,
  action: { label: '재시도', onClick: retry }
});

// 빈 상태
{isEmpty && <EmptyState message="상품이 없습니다" />}
```

**성공 상태:**
```typescript
// 성공 토스트
showSuccessToast('저장되었습니다');

// 폼 초기화
resetForm();

// 페이지 이동
navigate('/success');

// 데이터 새로고침
refreshData();
```

### 성능 최적화 패턴

**1. 데이터 캐싱**
```typescript
const useProductsWithCache = () => {
  const [products, setProducts] = useState(() => {
    // 캐시에서 초기값 로드
    return getCachedProducts() || [];
  });

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      setProducts(response.products);
      setCachedProducts(response.products); // 캐시 저장
    } catch (error) {
      // 캐시된 데이터가 있으면 표시, 에러는 조용히 처리
      if (products.length === 0) {
        handleApiError(error);
      }
    }
  };
};
```

**2. 낙관적 업데이트**
```typescript
const handleLikeProduct = async (productId: string) => {
  // 1. 즉시 UI 업데이트 (낙관적)
  setLiked(true);

  try {
    // 2. 서버 요청
    await productService.likeProduct(productId);
    // 성공 시 추가 작업 없음
  } catch (error) {
    // 3. 실패 시 롤백
    setLiked(false);
    showErrorToast('좋아요 처리에 실패했습니다');
  }
};
```

**3. 디바운싱**
```typescript
const useSearchWithDebounce = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        try {
          const response = await productService.searchProducts(query);
          setResults(response.products);
        } catch (error) {
          handleApiError(error);
        }
      }
    }, 300); // 300ms 디바운스

    return () => clearTimeout(timer);
  }, [query]);
};
```

### 공통 유틸리티 활용

**에러 처리 유틸리티:**
```typescript
import { handleApiError } from '@handy-platform/shared';

// 자동으로 적절한 에러 메시지 반환
const errorMessage = handleApiError(error);
showErrorToast(errorMessage);
```

**로딩 상태 관리 Hook:**
```typescript
const useApiCall = (apiFunction) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      return await apiFunction(...args);
    } catch (err) {
      setError(handleApiError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
};
```

### 필수 체크리스트

API 연동 작업 시 다음 항목들을 **반드시** 확인하세요:

- [ ] **로딩 상태 표시**: 사용자가 대기 시간을 인지할 수 있도록
- [ ] **에러 처리**: 모든 가능한 에러 상황에 대한 사용자 피드백
- [ ] **성공 피드백**: 작업 완료를 명확히 알림
- [ ] **재시도 옵션**: 네트워크/서버 오류 시 재시도 가능
- [ ] **폼 검증**: 서버 요청 전 클라이언트 사이드 검증
- [ ] **중복 요청 방지**: 버튼 비활성화 또는 중복 실행 방지
- [ ] **토큰 만료 처리**: 401 에러 시 자동 로그아웃/리다이렉트
- [ ] **오프라인 대응**: 네트워크 연결 상태 확인
- [ ] **성능 최적화**: 캐싱, 디바운싱, 낙관적 업데이트 적용
- [ ] **접근성**: 스크린 리더 등을 위한 상태 알림

이 가이드라인을 **모든 API 연동 작업에 적용**해주세요!
