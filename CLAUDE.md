# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**handy-platform** - React Native WebView 기반 쇼핑몰 앱

## Project Structure

```
handy-platform/ (모노레포 구조)
├── packages/
│   ├── mobile/                 # React Native 앱
│   │   ├── src/
│   │   │   ├── components/     # WebViewBridge.tsx 등
│   │   │   ├── screens/        # HomeScreen.tsx 등
│   │   │   ├── services/       # api.ts, cameraService.ts 등
│   │   │   └── utils/          # tokenUtils.ts 등
│   │   ├── android/            # Android 네이티브 코드
│   │   ├── ios/                # iOS 네이티브 코드
│   │   ├── App.tsx
│   │   ├── index.js
│   │   └── package.json
│   ├── web/                    # React 웹 앱 (Vite)
│   │   ├── src/
│   │   │   ├── components/     # 웹 컴포넌트
│   │   │   ├── services/       # api.ts (웹용)
│   │   │   └── ...
│   │   ├── .env.development    # 개발환경 설정
│   │   ├── .env.production     # 프로덕션환경 설정
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── shared/                 # 공통 타입 및 유틸리티
│       ├── src/
│       │   ├── types/          # 공통 타입 정의
│       │   ├── utils/          # 공통 유틸리티
│       │   └── config/         # API 환경 설정
│       └── package.json
├── package.json                # 워크스페이스 루트 설정
├── tsconfig.json               # TypeScript 설정
└── CLAUDE.md                   # 프로젝트 가이드
```

## Development Setup

### Prerequisites

#### 필수 프로그램 설치
1. **Node.js 16+** 
   ```bash
   # nvm 사용 권장
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **React Native CLI**
   ```bash
   npm install -g react-native-cli
   # 또는
   npm install -g @react-native-community/cli
   ```

3. **Android 개발 환경**
   - **Java 8 또는 11**: `brew install openjdk@11`
   - **Android Studio**: https://developer.android.com/studio 다운로드
   - **Android SDK**: Android Studio 설치 시 자동 설치
   - **Android Emulator**: Android Studio > AVD Manager에서 설정

4. **iOS 개발 환경** (macOS만)
   - **Xcode**: App Store에서 설치
   - **iOS Simulator**: Xcode 설치 시 포함
   - **CocoaPods**: `sudo gem install cocoapods`

#### 환경 변수 설정
```bash
# ~/.zshrc 또는 ~/.bash_profile에 추가
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Java 설정 (Android Studio 설치 후)
export JAVA_HOME=$(/usr/libexec/java_home -v 11)
```

### Installation

#### 1. 프로젝트 클론 및 설치
```bash
# 저장소 클론
git clone <repository-url>
cd handy-platform

# 워크스페이스 의존성 설치
npm install

# 공유 패키지 빌드 (필수!)
npm run build:shared
```

#### 2. Android 설정
```bash
# Android 에뮬레이터 생성 (Android Studio GUI 사용 권장)
# 또는 CLI로:
avdmanager create avd -n Pixel_4a_API_33 -k "system-images;android-33;google_apis;arm64-v8a"
```

#### 3. iOS 설정 (macOS만)
```bash
# iOS 의존성 설치
cd packages/mobile/ios
pod install
cd ../../..
```

## Common Commands

### Development

#### 🌐 웹 버전 실행
```bash
# 개발 환경 (로컬 서버 연동) - http://localhost:3001
npm run web:dev

# 스테이지 환경 (개발 서버 연동, 스테이지 DB) - http://localhost:3001
npm run web:stage

# 프로덕션 환경 (실제 서버 연동) - http://localhost:3001  
npm run web:prod

# 기본 실행 (개발 환경과 동일)
npm run web
```

#### 📱 모바일 앱 실행
```bash
# 개발 환경 실행
# 1. Metro 서버 시작 (React Native)
npm run start:dev

# 2. iOS 시뮬레이터에서 실행 (터미널 새 창에서)
npm run ios:dev

# 3. Android 에뮬레이터에서 실행 (터미널 새 창에서)
npm run android:dev

# 프로덕션 환경 실행
# 1. Metro 서버 시작 (React Native)
npm run start:prod

# 2. iOS 시뮬레이터에서 실행 (터미널 새 창에서)
npm run ios:prod

# 3. Android 에뮬레이터에서 실행 (터미널 새 창에서)
npm run android:prod

# 전체 시스템 동시 실행
npm run dev:all        # 개발 환경
npm run dev:all:stage  # 스테이지 환경
npm run dev:all:prod   # 프로덕션 환경
```

#### 🏗️ 빌드 & 정리
```bash
# 웹 빌드
npm run web:build        # 기본 빌드
npm run web:build:dev    # 개발 환경용 빌드
npm run web:build:stage  # 스테이지 환경용 빌드
npm run web:build:prod   # 프로덕션 환경용 빌드

# 프로젝트 클린업
npm run clean
```

### Testing & Type Checking
```bash
# 타입 체크 (TypeScript가 설치된 경우)
npx tsc --noEmit

# ESLint 체크 (ESLint가 설치된 경우)  
npx eslint src/
```

### Build & Deploy
```bash
# Android APK 빌드
cd android && ./gradlew assembleRelease

# Android AAB 빌드 (Play Store용)
cd android && ./gradlew bundleRelease

# 웹 배포용 빌드
npm run web:build
```

## Architecture

### WebView Hybrid Architecture
- **메인 컨테이너**: React Native 앱이 WebView를 호스팅
- **브릿지 통신**: JavaScript ↔ Native 양방향 통신
- **API 연동**: Native에서 API 호출 후 WebView로 전달
- **네이티브 기능**: 카메라, 권한, 알림 등은 Native에서 처리

### Key Components
- `WebViewBridge`: WebView와 Native 기능 연동 브릿지
- `ApiService`: 백엔드 API 호출 서비스 (JWT 토큰 관리, 자동 재시도)
- `CameraService`: 카메라 촬영, 갤러리 선택, QR 코드 스캔
- `NotificationService`: 푸시 알림 관리
- `TokenUtils`: JWT 토큰 파싱 및 관리
- `ShoppingApp`: 웹 쇼핑몰 UI 및 로직

## Development Guidelines

### Code Standards
- TypeScript 필수 사용
- 함수형 컴포넌트 사용
- 에러 핸들링 및 로딩 상태 관리
- 반응형 웹 디자인 (모바일 우선)

### Permission Guidelines
**자동 권한 추가 정책**: 코드 실행 중 권한이 필요한 경우 즉시 추가하여 사용
- Android: `android/app/src/main/AndroidManifest.xml`에 자동 추가
- iOS: `ios/*/Info.plist`에 usage description 자동 추가  
- TypeScript: `src/utils/permissions.ts`에 권한 함수 자동 추가
- 권한 요청 시 사용자 친화적 메시지 포함
- 설정 앱으로 이동 기능 포함

### WebView Bridge Usage
웹페이지에서 네이티브 기능 호출:
```javascript
// API 호출
window.ReactNativeWebView.callAPI('getProducts', { page: 1 });

// 인증
window.ReactNativeWebView.auth('login', { email, password });

// 카트 조작
window.ReactNativeWebView.cart('add', { productId, quantity });

// 카메라 기능
window.ReactNativeWebView.camera('takePhoto', { productId });
window.ReactNativeWebView.camera('choosePhoto', { productId });
window.ReactNativeWebView.camera('scanQR');

// 결제 기능
window.ReactNativeWebView.payment('kakaopay', { amount, orderInfo });

// 권한 요청
window.ReactNativeWebView.requestPermission('camera');
```

### 주요 기능
1. **하이브리드 쇼핑몰**: React Native WebView로 웹과 앱 통합
2. **카메라 통합**: 상품 사진 촬영, 갤러리 선택, QR 코드 스캔
3. **결제 시스템**: 신용카드, 카카오페이, 네이버페이, 계좌이체 지원
4. **API 통합**: JWT 인증, 자동 토큰 갱신, 에러 핸들링
5. **반응형 UI**: 모바일 최적화된 쇼핑몰 인터페이스

## 개발 환경 상태

### 현재 상태: 🔴 종료됨
모든 개발 서버가 종료되었습니다. 개발을 재개하려면 위의 실행 명령어를 사용하세요.

### 🎯 구현 완료된 기능
1. **쇼핑몰 브라우징** (카테고리, 검색, 상품 목록)
2. **장바구니 관리** (추가, 수정, 삭제)
3. **결제 시스템** (결제 방법 선택 모달)
4. **QR 코드 스캔** (헤더의 📷 버튼)
5. **상품 사진 촬영** (상품 상세 페이지)
6. **사용자 인증** (로그인/로그아웃)

**모든 플랫폼(웹, iOS, Android)에서 작동 확인됨** ✅

### Error Handling
- API 호출 시 try-catch 필수
- 사용자 친화적 에러 메시지 표시
- 권한 거부 시 적절한 안내

## Troubleshooting

### 일반적인 문제 해결

#### 1. 설치 오류
```bash
# npm 캐시 정리
npm cache clean --force

# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# 공유 패키지 재빌드
npm run build:shared
```

#### 2. Android 빌드 오류
```bash
# Android 프로젝트 정리
cd packages/mobile/android
./gradlew clean

# React Native 캐시 정리
npx react-native start --reset-cache

# Metro 캐시 정리
rm -rf /tmp/metro-*
rm -rf node_modules/.cache
```

#### 3. iOS 빌드 오류 (macOS)
```bash
# CocoaPods 재설치
cd packages/mobile/ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install

# Xcode 파생 데이터 정리
rm -rf ~/Library/Developer/Xcode/DerivedData
```

#### 4. TypeScript 오류
```bash
# TypeScript 타입 재생성
npm run build:shared

# tsconfig 확인
npx tsc --noEmit --project packages/web
npx tsc --noEmit --project packages/mobile
```

#### 5. WebView 연결 오류
```bash
# 웹 서버가 실행 중인지 확인
lsof -i :3001

# 웹 서버 시작
npm run web:dev  # 개발환경
npm run web:prod # 프로덕션환경

# Android 에뮬레이터에서 localhost 접근 확인
# 10.0.2.2:3001 = localhost:3001 (에뮬레이터 전용)
```

### VSCode 설정 권장사항

#### 확장 프로그램
- React Native Tools
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer

#### VSCode settings.json
```json
{
  "typescript.preferences.preferTypeOnlyAutoImports": true,
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  }
}
```

## API 환경 설정

### 환경별 서버 URL
- **개발 환경**: `http://15.165.5.64:3001` (개발 서버)
- **스테이지 환경**: `http://15.165.5.64:3001` (개발 서버와 동일, 스테이지 DB)
- **프로덕션 환경**: `http://15.165.5.64:3000` (프로덕션 서버)

### 테스트 계정
```javascript
// 일반 사용자 1
const testUser1 = {
  email: "user@test.com",
  password: "password123"
}

// 일반 사용자 2
const testUser2 = {
  email: "testuser@example.com",
  password: "testpass123"
}

// 관리자 (전체 시스템 관리)
const adminUser = {
  email: "admin@handy-server.com", 
  password: "admin123456"
}

// 판매자 (상품 등록/관리, 주문 처리)
const sellerUser = {
  email: "seller@handy-server.com",
  password: "seller123456"
}

// 스테이지 환경 판매자 계정
const stageSeller = {
  email: "seller@stage.handy-server.com", 
  password: "password123"
}
```

### API 사용 예시
```javascript
// 모바일 앱에서
import { apiService } from '@handy-platform/mobile/src/services/api';

// 웹 앱에서  
import { webApiService } from '@handy-platform/web/src/services/api';

// 공통 타입 사용
import { Product, Cart, User } from '@handy-platform/shared';
```

### 환경 설정 파일
- `packages/web/.env.development` - 웹 개발환경 설정
- `packages/web/.env.stage` - 웹 스테이지환경 설정
- `packages/web/.env.production` - 웹 프로덕션환경 설정
- `packages/shared/src/config/api.ts` - 공통 API 설정

## Backend API Documentation

For API integration, refer to the backend documentation:
- **API Documentation**: `/Users/heojeongmin/WebstormProjects/handy-server1/API_DOCUMENTATION.md`
- **Frontend Integration Guide**: `/Users/heojeongmin/WebstormProjects/handy-server1/FRONTEND_API_GUIDE.md`

These files contain all endpoint details, authentication requirements, and integration examples needed for frontend development.

## 📡 API 관리 구조 (중요!)

### 새로운 기능별 API 서비스 구조

프로젝트에서 **기능별로 분류된 API 서비스 구조**를 사용합니다. 서버 API와 일치하도록 설계되었습니다.

#### 📁 API 서비스 구조
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

#### 🎯 API 추가/변경 시 반드시 지켜야 할 원칙

1. **기능별 분류**: 새로운 API는 기능에 따라 적절한 서비스 파일에 추가
2. **서버 스펙 우선**: 서버 API 문서와 일치하도록 구현
3. **일관된 패턴**: 기존 서비스 패턴을 따라 구현

#### 📝 API 추가 절차

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

#### 🔄 사용 예시

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

#### ⚠️ 중요한 규칙들

1. **절대 기존 패턴을 깨지 마세요**: 모든 서비스는 `BaseApiService`를 상속받고 팩토리 패턴을 사용
2. **타입 안정성**: 모든 API 호출에 정확한 타입 정의 필요
3. **에러 처리**: `BaseApiService`의 공통 에러 처리 로직 활용
4. **플랫폼별 차이**: 웹은 localStorage, 모바일은 AsyncStorage 사용
5. **레거시 호환성**: 기존 코드가 깨지지 않도록 점진적 마이그레이션
6. **문서화**: 새로운 API 추가 시 반드시 이 가이드 문서 업데이트
7. **코드 리뷰 필수**: 모든 변경 사항은 코드 리뷰를 통해 검증
8. **테스트 작성**: 주요 API 메서드에 대한 단위 테스트 작성 권장

#### 🚀 장점

- **관리 용이**: auth, seller, product 등 관련 기능들이 한 곳에 모여있음
- **재사용성**: shared 패키지로 모든 플랫폼에서 동일한 로직 사용
- **확장성**: 새로운 기능 추가 시 해당 카테고리에만 추가하면 됨
- **타입 안정성**: TypeScript로 컴파일 타임에 오류 검출

이 구조를 반드시 지켜주세요! 🎯

---

## 🔄 API 연동 가이드라인 (필수!)

### API 호출 시 반드시 따라야 할 UX 처리 패턴

모든 API 연동 작업에서는 다음 패턴을 **반드시** 준수해야 합니다:

#### 🎯 기본 처리 흐름

1. **로딩 상태 표시** → 2. **API 호출** → 3. **응답에 따른 UX 처리** → 4. **에러 핸들링**

#### 📝 구현 템플릿

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

#### 🛡️ 에러 코드별 처리 가이드

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

#### 🎨 UX 상태별 처리 방법

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

#### ⚡ 성능 최적화 패턴

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

#### 🔧 공통 유틸리티 활용

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

#### ⚠️ 필수 체크리스트

API 연동 작업 시 다음 항목들을 **반드시** 확인하세요:

- [ ] ✅ **로딩 상태 표시**: 사용자가 대기 시간을 인지할 수 있도록
- [ ] ✅ **에러 처리**: 모든 가능한 에러 상황에 대한 사용자 피드백
- [ ] ✅ **성공 피드백**: 작업 완료를 명확히 알림
- [ ] ✅ **재시도 옵션**: 네트워크/서버 오류 시 재시도 가능
- [ ] ✅ **폼 검증**: 서버 요청 전 클라이언트 사이드 검증
- [ ] ✅ **중복 요청 방지**: 버튼 비활성화 또는 중복 실행 방지
- [ ] ✅ **토큰 만료 처리**: 401 에러 시 자동 로그아웃/리다이렉트
- [ ] ✅ **오프라인 대응**: 네트워크 연결 상태 확인
- [ ] ✅ **성능 최적화**: 캐싱, 디바운싱, 낙관적 업데이트 적용
- [ ] ✅ **접근성**: 스크린 리더 등을 위한 상태 알림

이 가이드라인을 **모든 API 연동 작업에 적용**해주세요! 🎯

---

**Note**: This CLAUDE.md file should be updated as the project structure, dependencies, and architecture are established.
