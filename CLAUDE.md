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
- Node.js 16+
- React Native CLI
- Android Studio (Android 개발)
- Xcode (iOS 개발, macOS만)

### Installation
```bash
# 프로젝트 루트에서
npm install
```

## Common Commands

### Development

#### 🌐 웹 버전 실행
```bash
# 개발 환경 (로컬 서버 연동) - http://localhost:3001
npm run web:dev

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
npm run dev:all:prod   # 프로덕션 환경
```

#### 🏗️ 빌드 & 정리
```bash
# 웹 빌드
npm run web:build

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

## API 환경 설정

### 환경별 서버 URL
- **개발 환경**: `http://localhost:5000` (로컬 서버)
- **프로덕션 환경**: `http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com`

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
- `packages/web/.env.production` - 웹 프로덕션환경 설정
- `packages/shared/src/config/api.ts` - 공통 API 설정

## Backend API Documentation

For API integration, refer to the backend documentation:
- **API Documentation**: `/Users/heojeongmin/WebstormProjects/handy-server1/API_DOCUMENTATION.md`
- **Frontend Integration Guide**: `/Users/heojeongmin/WebstormProjects/handy-server1/FRONTEND_API_GUIDE.md`

These files contain all endpoint details, authentication requirements, and integration examples needed for frontend development.
---

**Note**: This CLAUDE.md file should be updated as the project structure, dependencies, and architecture are established.
