# Handy Platform App

React Native를 사용한 WebView 기반 쇼핑몰 앱입니다.

## 주요 기능

- **WebView 기반 하이브리드 앱**: 웹 쇼핑몰을 앱으로 래핑
- **네이티브 브릿지**: JavaScript와 네이티브 기능 연동
- **API 통합**: 백엔드 API와 완전한 연동
- **권한 관리**: 카메라, 저장소 등 필요 권한 관리
- **푸시 알림**: 주문 상태 및 프로모션 알림
- **크로스 플랫폼**: iOS, Android 지원

## 개발 환경 설정

### 필수 요구사항

- Node.js 16+
- React Native CLI
- Android Studio (Android 개발용)
- Xcode (iOS 개발용, macOS만)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# iOS 시뮬레이터에서 실행
npm run ios

# Android 에뮬레이터에서 실행
npm run android

# Metro 서버 시작
npm start
```

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   └── WebViewBridge.tsx  # WebView와 네이티브 연동 브릿지
├── screens/             # 화면 컴포넌트
│   └── HomeScreen.tsx     # 메인 WebView 화면
├── services/            # 서비스 계층
│   ├── api.ts            # API 호출 서비스
│   └── notificationService.ts  # 알림 서비스
├── types/               # TypeScript 타입 정의
│   └── index.ts
└── utils/               # 유틸리티 함수
    └── permissions.ts     # 권한 관리
```

## WebView 브릿지 사용법

웹페이지에서 네이티브 기능을 사용하려면 다음과 같이 호출합니다:

```javascript
// API 호출
window.ReactNativeWebView.callAPI('getProducts', { page: 1, limit: 20 });

// 인증
window.ReactNativeWebView.auth('login', { email: 'user@example.com', password: 'password' });

// 카트 조작
window.ReactNativeWebView.cart('add', { productId: '123', quantity: 2 });

// 알림 표시
window.ReactNativeWebView.showNotification('제목', '메시지');
```

## API 엔드포인트

- **인증**: `/api/auth/*`
- **상품**: `/api/products/*`
- **주문**: `/api/orders/*`
- **사용자**: `/api/users/*`
- **관리자**: `/api/admin/*`

## 환경 변수

- `API_BASE_URL`: 백엔드 API 서버 URL (기본값: http://localhost:5000)

## 빌드 및 배포

### Android

```bash
# APK 빌드
cd android && ./gradlew assembleRelease

# AAB 빌드 (Google Play Store용)
cd android && ./gradlew bundleRelease
```

### iOS

```bash
# Xcode에서 Archive 생성
npx react-native run-ios --configuration Release
```

## 개발 가이드라인

- TypeScript 사용 필수
- ESLint 규칙 준수
- 컴포넌트는 함수형으로 작성
- API 호출 시 에러 핸들링 필수
- 로딩 상태 표시 권장

## 라이센스

MIT License