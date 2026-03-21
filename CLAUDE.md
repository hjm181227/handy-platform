# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 패키지별 상세 가이드

> 각 패키지에 대한 상세한 가이드는 아래 파일을 참조하세요:
>
> - **모바일 앱**: [packages/mobile/CLAUDE.md](packages/mobile/CLAUDE.md) - 네이티브 화면, WebView Bridge, Socket.IO 채팅
> - **웹 앱**: [packages/web/CLAUDE.md](packages/web/CLAUDE.md) - Vercel 배포, Edge Config, 도메인 설정
> - **공통 서비스**: [packages/shared/CLAUDE.md](packages/shared/CLAUDE.md) - API 서비스 구조, 연동 가이드라인

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
│   │   ├── CLAUDE.md           # 모바일 전용 가이드
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
│   │   ├── CLAUDE.md           # 웹 전용 가이드
│   │   └── package.json
│   └── shared/                 # 공통 타입 및 유틸리티
│       ├── src/
│       │   ├── types/          # 공통 타입 정의
│       │   ├── utils/          # 공통 유틸리티
│       │   └── config/         # API 환경 설정
│       ├── CLAUDE.md           # 공통 서비스 가이드
│       └── package.json
├── package.json                # 워크스페이스 루트 설정
├── tsconfig.json               # TypeScript 설정
└── CLAUDE.md                   # 프로젝트 전체 가이드 (이 파일)
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

```bash
# 저장소 클론
git clone <repository-url>
cd handy-platform

# 워크스페이스 의존성 설치
npm install

# 공유 패키지 빌드 (필수!)
npm run build:shared
```

#### Android 설정
```bash
# Android 에뮬레이터 생성 (Android Studio GUI 사용 권장)
avdmanager create avd -n Pixel_4a_API_33 -k "system-images;android-33;google_apis;arm64-v8a"
```

#### iOS 설정 (macOS만)
```bash
cd packages/mobile/ios
pod install
cd ../../..
```

## Common Commands

### Development

| 명령어 | 설명 |
|--------|------|
| `npm run web:dev` | 웹 개발 서버 실행 (localhost:3001) |
| `npm run web:stage` | 웹 스테이지 환경 실행 |
| `npm run web:prod` | 웹 프로덕션 환경 실행 |
| `npm run start:dev` | Metro 서버 시작 (개발) |
| `npm run ios:dev` | iOS 시뮬레이터 실행 |
| `npm run android:dev` | Android 에뮬레이터 실행 |
| `npm run dev:all` | 전체 시스템 동시 실행 |

### Build

| 명령어 | 설명 |
|--------|------|
| `npm run build:shared` | 공유 패키지 빌드 |
| `npm run web:build` | 웹 빌드 |
| `npm run web:build:prod` | 웹 프로덕션 빌드 |
| `npm run clean` | 프로젝트 클린업 |

### Testing & Type Checking
```bash
npx tsc --noEmit           # 타입 체크
npx eslint src/            # ESLint 체크
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

### 주요 기능
1. **하이브리드 쇼핑몰**: React Native WebView로 웹과 앱 통합
2. **카메라 통합**: 상품 사진 촬영, 갤러리 선택, QR 코드 스캔
3. **결제 시스템**: 신용카드, 카카오페이, 네이버페이, 계좌이체 지원
4. **API 통합**: JWT 인증, 자동 토큰 갱신, 에러 핸들링
5. **반응형 UI**: 모바일 최적화된 쇼핑몰 인터페이스
6. **실시간 채팅**: Socket.IO 기반 1:1 채팅, 고객 지원 (모바일 앱 전용)

## 개발 환경 상태

### 현재 상태: 종료됨
모든 개발 서버가 종료되었습니다. 개발을 재개하려면 위의 실행 명령어를 사용하세요.

### 구현 완료된 기능
1. **쇼핑몰 브라우징** (카테고리, 검색, 상품 목록)
2. **장바구니 관리** (추가, 수정, 삭제)
3. **결제 시스템** (결제 방법 선택 모달)
4. **QR 코드 스캔** (헤더의 카메라 버튼)
5. **상품 사진 촬영** (상품 상세 페이지)
6. **사용자 인증** (로그인/로그아웃)

**모든 플랫폼(웹, iOS, Android)에서 작동 확인됨**

## Troubleshooting

### 일반적인 문제 해결

#### 설치 오류
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run build:shared
```

#### TypeScript 오류
```bash
npm run build:shared
npx tsc --noEmit --project packages/web
npx tsc --noEmit --project packages/mobile
```

> 플랫폼별 빌드 오류는 각 패키지의 CLAUDE.md를 참조하세요.

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
// 프로덕션 일반 사용자
const testUser = {
  email: "usertest@handy.com",
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

---

**Note**: This CLAUDE.md file should be updated as the project structure, dependencies, and architecture are established.
