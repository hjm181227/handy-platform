# Handy Platform

> Handy 부활 프로젝트의 미완료 작업과 권장 재개 순서는 [보류 작업 기록](./docs/revival/DEFERRED_WORK.md)에서 관리합니다.

React Native WebView 기반 쇼핑몰 하이브리드 앱

## 🚀 빠른 시작

### 1. 환경 설정
```bash
# 필수 프로그램 설치
# - Node.js 16+ (nvm 권장)
# - Android Studio (Android 개발)
# - Xcode (iOS 개발, macOS만)

# 프로젝트 클론
git clone <repository-url>
cd handy-platform

# 의존성 설치
npm install

# 공유 패키지 빌드 (필수!)
npm run build:shared
```

### 2. 개발 서버 실행

#### 웹 앱만 실행
```bash
npm run web:dev   # 개발환경
npm run web:prod  # 프로덕션환경
```

#### 모바일 앱 실행
```bash
# 1. Metro 서버 시작
npm start

# 2. 웹 서버 시작 (새 터미널)
npm run web:dev

# 3. 앱 실행 (새 터미널)
npm run android  # Android
npm run ios      # iOS (macOS만)
```

## 🛠️ 주요 기능

- ✅ 하이브리드 쇼핑몰 (WebView + Native)
- ✅ 로그인/회원가입 API 연동
- ✅ 장바구니 및 결제 시스템
- ✅ 카메라 및 QR 스캔
- ✅ 푸시 알림
- ✅ JWT 토큰 관리

## 📁 프로젝트 구조

```
handy-platform/
├── packages/
│   ├── mobile/          # React Native 앱
│   │   ├── src/
│   │   │   ├── components/  # WebViewBridge 등
│   │   │   ├── screens/     # HomeScreen
│   │   │   ├── services/    # API, 카메라, 알림
│   │   │   └── utils/       # 권한, 토큰 유틸
│   │   ├── android/         # Android 네이티브
│   │   ├── ios/            # iOS 네이티브
│   │   └── App.tsx
│   ├── web/            # React 웹 앱 (Vite)
│   │   ├── src/
│   │   │   ├── components/  # 웹 컴포넌트
│   │   │   └── services/    # 웹용 API
│   │   ├── .env.development
│   │   ├── .env.production
│   │   └── vite.config.ts
│   └── shared/         # 공통 타입 및 유틸리티
│       ├── src/
│       │   ├── types/      # 공통 타입
│       │   ├── utils/      # 공통 유틸
│       │   └── config/     # API 설정
│       └── tsconfig.json
├── package.json        # 워크스페이스 설정
└── README.md
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

## 🔧 문제 해결

설치나 실행 중 문제가 발생하면 [CLAUDE.md](./CLAUDE.md)의 **Troubleshooting** 섹션을 참고하세요.

### 일반적인 문제들
- **shared 패키지 오류**: `npm run build:shared` 실행
- **Android 빌드 오류**: `cd packages/mobile/android && ./gradlew clean`
- **캐시 문제**: `npm cache clean --force`
- **WebView 연결 오류**: 웹 서버 실행 확인 (`npm run web:dev`)

## 📱 테스트 계정

```javascript
// 일반 사용자
{
  email: "user@test.com",
  password: "password123"
}

// 관리자
{
  email: "admin@handy-server.com", 
  password: "admin123456"
}
```

## 🚀 빌드 및 배포

### Android
```bash
# APK 빌드
cd packages/mobile/android && ./gradlew assembleRelease

# AAB 빌드 (Google Play Store용)
cd packages/mobile/android && ./gradlew bundleRelease
```

### iOS (macOS)
```bash
# iOS 의존성 설치
cd packages/mobile/ios && pod install

# Xcode에서 Archive 생성
open packages/mobile/ios/HandyPlatform.xcworkspace
```

### 웹 배포
```bash
# 웹 빌드
npm run web:build

# 빌드 결과: packages/web/dist/
```

## 📖 상세 문서

전체 개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

### 주요 문서들
- **프로젝트 전체 가이드**: [CLAUDE.md](./CLAUDE.md)
- **API 문서**: `../handy-server1/API_DOCUMENTATION.md`
- **프론트엔드 연동 가이드**: `../handy-server1/FRONTEND_API_GUIDE.md`

---

**개발 환경 문의**: CLAUDE.md 문서 확인 후 이슈 등록
