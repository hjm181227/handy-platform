# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**handy-platform** - React Native WebView 기반 쇼핑몰 앱

## Project Structure

```
handy-platform/
├── src/                        # React Native 소스 코드
│   ├── components/             # 재사용 컴포넌트
│   │   ├── WebViewBridge.tsx   # WebView-Native 브릿지 (모바일)
│   │   └── WebViewBridge.web.tsx # WebView-Native 브릿지 (웹)
│   ├── screens/                # 화면 컴포넌트
│   │   └── HomeScreen.tsx      # 메인 홈 화면
│   ├── services/               # API 및 서비스
│   │   ├── api.ts              # 백엔드 API 서비스
│   │   ├── cameraService.ts    # 카메라 및 QR 스캔 서비스
│   │   └── notificationService.ts # 푸시 알림 서비스
│   ├── types/                  # TypeScript 타입 정의
│   │   └── index.ts            # 전체 타입 정의
│   └── utils/                  # 유틸리티 함수
│       ├── apiHelpers.ts       # API 헬퍼 함수
│       ├── permissions.ts      # 권한 관리
│       └── tokenUtils.ts       # JWT 토큰 유틸리티
├── web/                        # 웹 애플리케이션 (WebView 내용)
│   ├── index.html              # 메인 HTML 파일
│   ├── styles.css              # 스타일시트
│   └── app.js                  # 쇼핑몰 웹 앱 로직
├── android/                    # Android 네이티브 코드
├── ios/                        # iOS 네이티브 코드
├── App.tsx                     # React Native 앱 진입점
├── index.js                    # React Native 메인 진입점
├── index.web.js                # 웹 진입점
├── package.json                # 의존성 관리
├── tsconfig.json               # TypeScript 설정
├── vite.config.ts              # Vite 웹 빌드 설정
├── metro.config.js             # Metro 번들러 설정
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
# 웹 개발 서버 시작 (Vite) - http://localhost:3000
npm run web
```

#### 📱 모바일 앱 실행
```bash
# 1. Metro 서버 시작 (React Native)
npm start

# 2. iOS 시뮬레이터에서 실행 (터미널 새 창에서)
npm run ios

# 3. Android 에뮬레이터에서 실행 (터미널 새 창에서)
npm run android
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

## Backend API Documentation

For API integration, refer to the backend documentation:
- **API Documentation**: `/Users/heojeongmin/WebstormProjects/handy-server1/API_DOCUMENTATION.md`
- **Frontend Integration Guide**: `/Users/heojeongmin/WebstormProjects/handy-server1/FRONTEND_API_GUIDE.md`

These files contain all endpoint details, authentication requirements, and integration examples needed for frontend development.
---

**Note**: This CLAUDE.md file should be updated as the project structure, dependencies, and architecture are established.
