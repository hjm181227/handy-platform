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

// 결제 기능
window.ReactNativeWebView.payment('kakaopay', { amount, orderInfo });

// 권한 요청
window.ReactNativeWebView.requestPermission('camera');

// 채팅 기능 (모바일 앱 전용)
window.ReactNativeWebView.chat('connect', { token });
window.ReactNativeWebView.chat('joinRoom', { roomId });
window.ReactNativeWebView.chat('sendMessage', { roomId, text: 'Hello!' });
window.ReactNativeWebView.chat('leaveRoom', { roomId });
window.ReactNativeWebView.chat('disconnect');
```

### 주요 기능
1. **하이브리드 쇼핑몰**: React Native WebView로 웹과 앱 통합
2. **카메라 통합**: 상품 사진 촬영, 갤러리 선택, QR 코드 스캔
3. **결제 시스템**: 신용카드, 카카오페이, 네이버페이, 계좌이체 지원
4. **API 통합**: JWT 인증, 자동 토큰 갱신, 에러 핸들링
5. **반응형 UI**: 모바일 최적화된 쇼핑몰 인터페이스
6. **실시간 채팅**: Socket.IO 기반 1:1 채팅, 고객 지원, 주문 관련 채팅 (모바일 앱 전용)

## 📱 네이티브 화면 추가 가이드

### 아키텍처 개요

현재 프로젝트는 **확장 가능한 네이티브 화면 아키텍처**를 사용하고 있습니다. 웹 버튼 클릭 시 네이티브 Modal을 표시하는 방식으로 구현되어 있으며, 새로운 네이티브 화면 추가가 일관된 패턴을 따릅니다.

**통신 흐름:**
```
Web Button Click
  → navigateService.goToXXX()
  → window.ReactNativeWebView.postMessage()
  → WebViewBridge (handleMessage)
  → DeviceEventEmitter.emit()
  → NativeScreenProvider (listener)
  → Modal state change
  → Native Screen displayed
```

### 핵심 컴포넌트

1. **NativeScreenProvider** (`packages/mobile/src/contexts/NativeScreenProvider.tsx`)
   - 모든 네이티브 화면의 상태 관리
   - Modal 컴포넌트 렌더링
   - DeviceEventEmitter 이벤트 리스닝

2. **WebViewBridge** (`packages/mobile/src/components/WebViewBridge.tsx`)
   - 웹 ↔ 네이티브 메시지 라우팅
   - Switch-case 패턴으로 메시지 타입별 처리

3. **NavigateService** (`packages/shared/src/services/navigate/`)
   - 플랫폼 독립적 네비게이션 API
   - Web: postMessage 전송
   - Native: DeviceEventEmitter 사용

### 새 화면 추가 절차

새로운 네이티브 화면(예: CameraScreen)을 추가하려면 **7개 파일을 수정**해야 합니다:

#### 1. Screen 컴포넌트 생성

**파일**: `packages/mobile/src/screens/CameraScreen.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

interface CameraScreenProps {
  onClose?: () => void;
  onPhotoTaken?: (uri: string) => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({
  onClose,
  onPhotoTaken
}) => {
  const handleTakePhoto = () => {
    // 카메라 촬영 로직
    const photoUri = 'photo://example.jpg';
    if (onPhotoTaken) {
      onPhotoTaken(photoUri);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>닫기</Text>
        </TouchableOpacity>
        <Text style={styles.title}>카메라</Text>
      </View>

      <View style={styles.content}>
        {/* 카메라 UI */}
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleTakePhoto}
        >
          <Text style={styles.captureButtonText}>📸 촬영</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  captureButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CameraScreen;
```

#### 2. 메시지 타입 추가

**파일**: `packages/shared/src/types/index.ts`

```typescript
export type WebViewMessageType =
  | 'NAVIGATION'
  | 'API_CALL'
  // ... 기존 타입들
  | 'NAVIGATE_TO_CAMERA'  // 추가
  | 'NAVIGATE_TO_SIZES'
  | 'NAVIGATE_TO_MEASUREMENT'
  | 'NAVIGATE_BACK';
```

#### 3. NativeScreenProvider 업데이트

**파일**: `packages/mobile/src/contexts/NativeScreenProvider.tsx`

```typescript
// 1. Screen import 추가
import CameraScreen from '../screens/CameraScreen';

// 2. State 추가 (Context 내부)
const [showCamera, setShowCamera] = useState(false);
const [cameraParams, setCameraParams] = useState<any>(null);

// 3. 제어 함수 추가
const openCamera = (params?: any) => {
  console.log('📱 [NativeScreenProvider] Opening Camera screen', params);
  setCameraParams(params || null);
  setShowCamera(true);
};

const closeCamera = () => {
  console.log('📱 [NativeScreenProvider] Closing Camera screen');
  setShowCamera(false);
  setCameraParams(null);
};

// 4. Context 인터페이스 업데이트
interface NativeScreenContextType {
  // ... 기존 메서드들
  openCamera: (params?: any) => void;
  closeCamera: () => void;
}

// 5. DeviceEventEmitter 리스너 추가
useEffect(() => {
  // ... 기존 리스너들

  const openCameraListener = DeviceEventEmitter.addListener(
    'openCamera',
    (data: any) => {
      console.log('🔵 [NativeScreenProvider] openCamera event received', data);
      openCamera(data);
    }
  );

  return () => {
    // ... 기존 cleanup
    openCameraListener.remove();
  };
}, []);

// 6. Context value 업데이트
const value: NativeScreenContextType = {
  // ... 기존 메서드들
  openCamera,
  closeCamera,
};

// 7. Modal JSX 추가 (return 내부)
return (
  <NativeScreenContext.Provider value={value}>
    {children}

    {/* 기존 Modals... */}

    {/* Camera Modal */}
    <Modal
      visible={showCamera}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeCamera}
    >
      <CameraScreen
        onClose={closeCamera}
        onPhotoTaken={(uri) => {
          console.log('📸 Photo taken:', uri);
          // 사진 처리 로직
          closeCamera();
        }}
      />
    </Modal>
  </NativeScreenContext.Provider>
);
```

#### 4. WebViewBridge 핸들러 추가

**파일**: `packages/mobile/src/components/WebViewBridge.tsx`

```typescript
// 메시지 핸들러에 case 추가
const handleMessage = async (event: any) => {
  const message: WebViewMessage = JSON.parse(event.nativeEvent.data);

  switch (message.type) {
    // ... 기존 cases

    case 'NAVIGATE_TO_CAMERA':
      handleNavigateToCamera(message.data);
      break;

    // ... 다른 cases
  }
};

// 핸들러 함수 추가
const handleNavigateToCamera = (data: any) => {
  console.log('🔵 [BRIDGE] Navigate to Camera screen:', data);
  DeviceEventEmitter.emit('openCamera', data);
};
```

#### 5. NavigateService 타입 정의

**파일**: `packages/shared/src/services/navigate/types.ts`

```typescript
export interface INavigateService {
  goToMeasureSize(): void;
  goToNailSizes(): void;
  goToCamera(): void;  // 추가
  goToWebPage?(path: string): void;
}

export type NavigationMessageType =
  | 'NAVIGATE_TO_MEASUREMENT'
  | 'NAVIGATE_TO_SIZES'
  | 'NAVIGATE_TO_CAMERA'  // 추가
  | 'NAVIGATE_BACK';
```

#### 6. NavigateService Web 구현

**파일**: `packages/shared/src/services/navigate/NavigateService.web.ts`

```typescript
goToCamera(): void {
  console.log('[NavigateService.web] goToCamera called');

  if (this.isWebViewEnvironment()) {
    this.sendMessageToWebView({
      type: 'NAVIGATE_TO_CAMERA',
      data: { screen: 'Camera' }
    });
  } else {
    // 웹 환경에서 앱 다운로드 유도
    const shouldDownload = window.confirm(
      '카메라 기능은 모바일 앱에서만 사용할 수 있습니다.\n' +
      'HANDY 앱을 다운로드하시겠습니까?'
    );
    if (shouldDownload) {
      window.location.href = 'https://handy-app.com/download';
    }
  }
}
```

#### 7. NavigateService Native 구현

**파일**: `packages/shared/src/services/navigate/NavigateService.native.ts`

```typescript
goToCamera(): void {
  console.log('[NavigateService.native] goToCamera called');

  if (this.isWebViewEnvironment()) {
    this.sendMessageToWebView({
      type: 'NAVIGATE_TO_CAMERA',
      data: { screen: 'Camera' }
    });
  } else {
    // Native 환경에서 직접 이벤트 발생
    this.emitNativeEvent('openCamera', {
      screen: 'Camera'
    });
  }
}
```

### 사용 방법

웹 컴포넌트에서 네이티브 화면 호출:

```typescript
import navigateService from '@handy-platform/shared/src/services/navigate';

const MyComponent = () => {
  const handleOpenCamera = () => {
    navigateService.goToCamera();
  };

  return (
    <button onClick={handleOpenCamera}>
      카메라 열기
    </button>
  );
};
```

### 체크리스트

새 네이티브 화면 추가 시 확인 사항:

- [ ] Screen 컴포넌트 생성 (`packages/mobile/src/screens/`)
- [ ] 메시지 타입 추가 (`packages/shared/src/types/index.ts`)
- [ ] NativeScreenProvider:
  - [ ] Screen import
  - [ ] State 추가 (`useState`)
  - [ ] 제어 함수 (`open`, `close`)
  - [ ] Context 인터페이스 업데이트
  - [ ] DeviceEventEmitter 리스너
  - [ ] Context value 업데이트
  - [ ] Modal JSX 추가
- [ ] WebViewBridge:
  - [ ] Case 추가
  - [ ] 핸들러 함수 추가
- [ ] NavigateService 타입 (`types.ts`)
- [ ] NavigateService Web 구현
- [ ] NavigateService Native 구현
- [ ] shared 패키지 재빌드 (`npm run build:shared`)
- [ ] 테스트 (앱 재시작 후 동작 확인)

### 장점

현재 아키텍처의 장점:

- **일관성**: 모든 화면이 동일한 패턴 사용
- **확장성**: 새 화면 추가가 명확하고 예측 가능
- **타입 안정성**: TypeScript로 컴파일 타임 오류 검출
- **플랫폼 독립성**: Web/Native 모두 동일한 API 사용
- **중앙 관리**: NativeScreenProvider에서 모든 화면 관리

### 개선 가능 영역 (선택사항)

화면이 10개 이상으로 늘어나면 다음을 고려:

1. **Screen Registry 패턴**
   ```typescript
   const SCREEN_REGISTRY = {
     Camera: CameraScreen,
     NailSizes: NailSizesScreen,
     // ...
   };
   ```

2. **Generic Screen Control**
   ```typescript
   openScreen(screenName: string, params?: any): void
   closeScreen(screenName: string): void
   ```

3. **Message Handler Registry**
   ```typescript
   const MESSAGE_HANDLERS = {
     'NAVIGATE_TO_CAMERA': () => DeviceEventEmitter.emit('openCamera'),
     // ...
   };
   ```

---

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

## 💬 Socket.IO 실시간 채팅 기능

### 개요
handy-platform은 Socket.IO 기반의 실시간 채팅 기능을 지원합니다. **모바일 앱에서만 활성화**되며, 웹 브라우저에서는 비활성화됩니다.

### 주요 특징
- **실시간 양방향 통신**: Socket.IO를 사용한 WebSocket 연결
- **JWT 인증**: 기존 인증 시스템과 통합 (Socket.IO auth 옵션 사용)
- **플랫폼별 최적화**: React Native와 웹 환경에 맞춘 구현
- **백그라운드 재연결**: 앱이 백그라운드로 갔다가 다시 돌아올 때 자동 재연결
- **모바일 전용**: 웹 환경에서는 자동으로 비활성화

### 채팅 서버 정보
- **서버 URL**: `http://16.176.147.141`
- **인증 방식**: Socket.IO auth 옵션 (`{ auth: { token: 'JWT_TOKEN' } }`)
- **프로토콜**: WebSocket with fallback to polling

### 아키텍처

```
packages/shared/src/services/chat/
├── BaseChatService.ts        # 추상 베이스 클래스
├── ChatService.native.ts     # React Native 구현 (모바일 앱)
├── ChatService.web.ts        # Web 구현 (WebView 감지)
├── types.ts                  # 공통 타입 정의
└── index.ts                  # 플랫폼별 export
```

### 사용법

#### 1. 모바일 앱에서 직접 사용

```typescript
import { mobileApiService } from '@/services/apiService';

const chatService = mobileApiService.chat;

// 1. 연결
await chatService.connect({
  serverUrl: 'http://16.176.147.141',
  token: 'YOUR_JWT_TOKEN',
});

// 2. 채팅방 입장
await chatService.joinRoom('room-123');

// 3. 메시지 전송
const message = await chatService.sendMessage('room-123', 'Hello!');

// 4. 메시지 수신 리스너
const unsubscribe = chatService.onMessage((message) => {
  console.log('New message:', message);
});

// 5. 타이핑 상태 전송
chatService.sendTyping('room-123', true);

// 6. 채팅방 퇴장
await chatService.leaveRoom('room-123');

// 7. 연결 종료
chatService.disconnect();

// 8. 리스너 정리
unsubscribe();
```

#### 2. WebView 브릿지를 통한 사용

웹 페이지에서 React Native 브릿지를 통해 채팅 기능 호출:

```javascript
// 연결
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: 'CHAT',
  data: {
    action: 'connect',
    token: 'YOUR_JWT_TOKEN',
    requestId: 'unique-id-1',
  }
}));

// 채팅방 입장
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: 'CHAT',
  data: {
    action: 'joinRoom',
    roomId: 'room-123',
    requestId: 'unique-id-2',
  }
}));

// 메시지 전송
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: 'CHAT',
  data: {
    action: 'sendMessage',
    roomId: 'room-123',
    text: 'Hello from web!',
    requestId: 'unique-id-3',
  }
}));

// 응답 수신
window.addEventListener('message', (event) => {
  const response = JSON.parse(event.data);
  if (response.type === 'CHAT_RESPONSE') {
    console.log('Chat response:', response.data);
  }
});
```

### 지원하는 채팅 액션

| 액션 | 설명 | 파라미터 |
|------|------|----------|
| `connect` | Socket.IO 서버 연결 | `token` (선택) |
| `disconnect` | 연결 종료 | - |
| `joinRoom` | 채팅방 입장 | `roomId` |
| `leaveRoom` | 채팅방 퇴장 | `roomId` |
| `sendMessage` | 메시지 전송 | `roomId`, `text` |
| `sendTyping` | 타이핑 상태 전송 | `roomId`, `isTyping` |
| `isConnected` | 연결 상태 확인 | - |
| `getCurrentRoom` | 현재 방 ID 조회 | - |

### 이벤트 리스너

```typescript
// 메시지 수신
chatService.onMessage((message) => {
  console.log('Message:', message);
});

// 타이핑 표시
chatService.onTyping((data) => {
  console.log('Typing:', data);
});

// 연결 상태 변경
chatService.onConnect(() => {
  console.log('Connected');
});

chatService.onDisconnect(() => {
  console.log('Disconnected');
});

// 에러
chatService.onError((error) => {
  console.error('Chat error:', error);
});
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

### 플랫폼별 동작

#### React Native (모바일 앱)
- ✅ 모든 채팅 기능 활성화
- ✅ 백그라운드 재연결 지원
- ✅ Android 에뮬레이터: `localhost` → `10.0.2.2` 자동 변환
- ✅ AppState 감지 및 자동 재연결

#### Web (브라우저)
- ❌ 기본적으로 비활성화
- ✅ WebView 환경 감지 시 활성화
- ✅ `isChatEnabled()` 메서드로 상태 확인

```typescript
// 웹에서 채팅 활성화 여부 확인
const isEnabled = webApiService.chat.isChatEnabled();
// WebView 환경이면 true, 일반 브라우저면 false
```

### Android 설정

채팅 서버 IP가 이미 네트워크 보안 설정에 추가되어 있습니다:

```xml
<!-- packages/mobile/android/app/src/main/res/xml/network_security_config.xml -->
<domain includeSubdomains="true">16.176.147.141</domain>
```

### 문제 해결

#### 연결 실패 시
1. 서버 URL 확인: `http://16.176.147.141`
2. 네트워크 권한 확인 (Android)
3. JWT 토큰 유효성 확인
4. Android 에뮬레이터에서는 `localhost` 대신 `10.0.2.2` 사용

#### 메시지가 수신되지 않을 때
1. 연결 상태 확인: `chatService.isConnected()`
2. 채팅방 입장 확인: `chatService.getCurrentRoomId()`
3. 이벤트 리스너 등록 확인
4. 백엔드 서버 로그 확인

#### 웹에서 채팅이 안 될 때
- 웹 브라우저에서는 의도적으로 비활성화됨
- WebView 환경에서만 작동 (React Native WebView)
- `isChatEnabled()` 메서드로 확인

### 백엔드 서버 연동

채팅 서버(chat-stack-scaffold)에서 구현해야 할 이벤트:

**서버 → 클라이언트:**
- `connect`: 연결 성공
- `disconnect`: 연결 해제
- `message`: 새 메시지 수신
- `user:typing`: 타이핑 표시
- `room:joined`: 방 입장 확인
- `room:left`: 방 퇴장 확인

**클라이언트 → 서버:**
- `join`: 채팅방 입장 요청
- `leave`: 채팅방 퇴장 요청
- `message`: 메시지 전송
- `typing`: 타이핑 상태 전송

### 향후 개선 사항

- [ ] 오프라인 메시지 큐
- [ ] 읽음 표시 동기화
- [ ] 파일/이미지 전송
- [ ] 푸시 알림 통합
- [ ] 채팅 히스토리 캐싱
- [ ] 네이티브 채팅 UI 화면

## Vercel Edge Config - 동적 API 라우팅

### 개요
Vercel Edge Config를 사용하여 **재배포 없이** API 엔드포인트를 동적으로 전환할 수 있습니다. 이는 서버 배포 시 Blue-Green 배포나 카나리 배포를 위한 트래픽 전환에 유용합니다.

### 아키텍처
- `packages/web/middleware.ts`: Edge Middleware가 `/api/*` 요청을 Edge Config에 설정된 백엔드로 프록시
- `packages/web/vercel.json`: 기존 하드코딩된 API rewrite 제거 (middleware로 이관)
- Vercel Dashboard: Edge Config 값 변경으로 즉시 트래픽 전환

### Edge Config 설정 방법

#### 1. Edge Config 생성 (Vercel Dashboard)
1. [Vercel Dashboard](https://vercel.com) 접속
2. 프로젝트 선택: `web`
3. **Storage** 탭 → **Edge Config** → **Create Edge Config**
4. Edge Config 이름: `handy-api-config` (예시)
5. 생성 완료

#### 2. Edge Config 초기 데이터 입력

**스테이징 환경 (현재 설정):**
```json
{
  "api_target": "http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com:8080",
  "environment": "staging",
  "updated_at": "2025-01-15T12:00:00Z",
  "updated_by": "manual"
}
```

**프로덕션 환경 (향후 전환 시):**
```json
{
  "api_target": "http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com:80",
  "environment": "production",
  "updated_at": "2025-01-15T12:00:00Z",
  "updated_by": "ci"
}
```

**주요 필드 설명:**
- `api_target`: 백엔드 서버 베이스 URL (포트 포함)
  - 스테이징: `:8080`
  - 프로덕션: `:80`
- `environment`: 환경 식별자 (`staging` / `production`)
- `updated_at`: 마지막 업데이트 시각 (ISO 8601 형식)
- `updated_by`: 업데이트 주체 (`manual` / `ci` / `rollback`)

#### 3. 프로젝트에 Edge Config 연결
1. Vercel Dashboard → 프로젝트 `web` → **Settings** → **Environment Variables**
2. 환경변수 추가:
   - **Key**: `EDGE_CONFIG`
   - **Value**: Edge Config connection string (자동 생성됨)
   - **Environments**: Production, Preview, Development 모두 선택
3. 저장

#### 4. 배포 및 검증
```bash
# 코드 배포
cd packages/web
npm run deploy:prod  # 또는 deploy:stage

# 배포 후 검증
curl https://stage-handy.com/api/health
# 정상 응답: {"status":"ok", ...}
```

**검증 체크리스트:**
- [ ] `/api/health` 엔드포인트 정상 응답
- [ ] 브라우저 Network 탭에서 실제 백엔드 URL 확인
- [ ] Vercel Functions 로그에서 Middleware 로그 확인
- [ ] Edge Config 값 변경 시 즉시 반영 확인

### 트래픽 전환 절차

#### Blue-Green 배포 시나리오
1. **Blue 환경 (기존)**: `:8080` 포트
2. **Green 환경 (신규)**: `:80` 포트 (또는 다른 서버)
3. **전환**: Vercel Dashboard에서 `api_target` 값만 변경
4. **롤백**: 이전 값으로 즉시 되돌림

**전환 방법:**
1. Vercel Dashboard → Storage → Edge Config → `handy-api-config`
2. `api_target` 값 수정:
   ```json
   {
     "api_target": "http://new-backend-server.com:80",
     "environment": "production",
     "updated_at": "2025-01-15T14:30:00Z",
     "updated_by": "manual"
   }
   ```
3. **Save** 클릭 → 즉시 반영 (재배포 불필요)
4. 검증: `curl https://stage-handy.com/api/health`

**롤백 방법:**
1. Edge Config → `api_target` 값을 이전 서버로 되돌림
2. 즉시 반영 (수초 내)

### 로컬 개발 환경

로컬 개발 시에는 Edge Config 없이도 정상 작동합니다:
- `middleware.ts`가 `NODE_ENV=development` 체크
- 자동으로 `localhost:11000`로 프록시
- Edge Config 설정 불필요

```bash
# 로컬 개발
npm run web:dev
# → middleware가 자동으로 localhost:11000 사용
```

### Fallback 전략

Edge Config 장애 시에도 서비스가 중단되지 않도록 Fallback이 구현되어 있습니다:

```typescript
// packages/web/middleware.ts
async function getApiTarget(): Promise<string> {
  try {
    const apiTarget = await get<string>('api_target');
    return apiTarget || FALLBACK_URL;
  } catch (error) {
    console.error('[Edge Config] Failed, using fallback');
    return FALLBACK_URL; // 기본값으로 폴백
  }
}
```

**Fallback URL**: `http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com:8080`

### 보안 고려사항

1. **Edge Config Connection String 보호**
   - `.env.local`은 절대 Git에 커밋 금지 (`.gitignore`에 포함됨)
   - 환경변수로만 관리
   - 코드에 하드코딩 금지

2. **CORS 설정**
   - 백엔드 서버에 이미 Vercel CORS 설정되어 있음 (`*.vercel.app`)
   - 추가 설정 불필요

3. **API 접근 제어**
   - Edge Config는 Vercel 프로젝트에만 접근 가능
   - 외부에서 직접 수정 불가

### 백엔드 팀 전달사항

배포 자동화를 위해 백엔드 CI/CD에서 Edge Config를 업데이트할 수 있습니다:

**필요 정보:**
1. **Edge Config ID**: Vercel Dashboard에서 확인
2. **Vercel API Token**: [Vercel Settings → Tokens](https://vercel.com/account/tokens)에서 생성

**CI/CD에서 Edge Config 업데이트:**
```bash
# Vercel CLI 사용
npm install -g vercel
vercel env pull  # EDGE_CONFIG 가져오기

# API로 직접 업데이트 (예시)
curl -X PATCH "https://api.vercel.com/v1/edge-config/<config-id>/items" \
  -H "Authorization: Bearer <vercel-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "operation": "update",
        "key": "api_target",
        "value": "http://new-backend.com:80"
      },
      {
        "operation": "update",
        "key": "updated_at",
        "value": "2025-01-15T15:00:00Z"
      },
      {
        "operation": "update",
        "key": "updated_by",
        "value": "ci"
      }
    ]
  }'
```

### 문제 해결

**증상: `/api` 요청이 실패함**
- Edge Config 값 확인
- Fallback이 작동하는지 로그 확인
- Vercel Functions 로그에서 middleware 에러 확인

**증상: 변경사항이 반영되지 않음**
- Edge Config 저장 후 5-10초 대기 (캐시 무효화)
- 브라우저 캐시 클리어 후 재시도
- Vercel 배포 로그 확인

**증상: 로컬 개발에서 API 호출 실패**
- `NODE_ENV=development` 설정 확인
- 백엔드 로컬 서버 (`localhost:11000`) 실행 여부 확인

### 참고 자료
- [Vercel Edge Config 공식 문서](https://vercel.com/docs/storage/edge-config)
- [Vercel Middleware 가이드](https://vercel.com/docs/functions/edge-middleware)
- [Edge Config API Reference](https://vercel.com/docs/storage/edge-config/vercel-api)

## 🚀 프로덕션 배포 가이드

### 배포 전략 개요

**현재 구성**: 단일 Vercel 프로젝트 + 브랜치 전략
- **프로덕션 환경**: `main` 브랜치 → https://h-andy.com
- **스테이징 환경**: `develop` 브랜치 (또는 현재 작업 브랜치) → https://stage-handy.com
- **Preview 환경**: 기타 브랜치/PR → Vercel 자동 생성 URL

**주요 특징**:
- 환경변수 기반 API 라우팅 (Edge Config 미사용)
- 브랜치별 자동 배포
- 비용 효율적 (Free tier 사용 가능)

---

### 1단계: Git 브랜치 전략 설정

#### develop 브랜치 생성 (스테이징용)

```bash
# main 브랜치로 이동
git checkout main

# 최신 코드 가져오기
git pull origin main

# develop 브랜치 생성 및 푸시
git checkout -b develop
git push -u origin develop
```

**브랜치 용도**:
- `main`: 프로덕션 배포용 (안정 버전만)
- `develop`: 스테이징 배포용 (테스트 및 QA)
- `feature/*`: 기능 개발용 (개발자별 작업)

---

### 2단계: Vercel 프로젝트 설정

#### A. Production Branch 설정

1. [Vercel Dashboard](https://vercel.com) 접속
2. **web** 프로젝트 선택
3. **Settings** → **Git** 섹션으로 이동
4. **Production Branch** 항목을 `main`으로 설정
5. Save 클릭

이렇게 하면:
- `main` 브랜치 푸시 → 자동으로 프로덕션 배포
- `develop` 브랜치 푸시 → Preview 환경으로 배포
- 기타 브랜치 → Preview 환경으로 배포

---

#### B. 환경변수 설정

##### 방법 1: Vercel Dashboard에서 설정 (추천)

1. Vercel Dashboard → **web** 프로젝트 → **Settings** → **Environment Variables**
2. 다음 환경변수들을 추가:

**프로덕션 환경 (Production):**
```
VITE_API_BASE_URL = https://h-andy.com
VITE_ENVIRONMENT = production
VITE_ENABLE_DEBUG = false
VITE_KAKAO_APP_KEY = [프로덕션 카카오 앱 키]
```

**스테이징 환경 (Preview - develop 브랜치):**
```
VITE_API_BASE_URL = https://www.stage-handy.com
VITE_ENVIRONMENT = staging
VITE_ENABLE_DEBUG = false
VITE_KAKAO_APP_KEY = f466bdbd818f288f370407d10da4710d
```

**중요**: 각 환경변수 추가 시 Environment 선택:
- Production 환경변수 → **Production** 체크
- 스테이징 환경변수 → **Preview** 체크 + **Branch**: `develop` 입력

##### 방법 2: Vercel CLI로 설정

```bash
# 프로젝트 디렉토리로 이동
cd packages/web

# Production 환경변수
vercel env add VITE_API_BASE_URL production
# 입력: https://h-andy.com

vercel env add VITE_ENVIRONMENT production
# 입력: production

# Preview (develop 브랜치) 환경변수
vercel env add VITE_API_BASE_URL preview
# 입력: https://www.stage-handy.com
# Branch: develop

vercel env add VITE_ENVIRONMENT preview
# 입력: staging
# Branch: develop
```

---

#### C. 도메인 연결

##### h-andy.com 도메인 추가

1. Vercel Dashboard → **web** 프로젝트 → **Settings** → **Domains**
2. **Add Domain** 클릭
3. `h-andy.com` 입력 후 Add 클릭
4. DNS 설정 안내 화면 표시됨

##### DNS 설정 (도메인 제공자에서)

**옵션 A: Vercel Nameservers 사용 (추천)**
```
도메인 제공자 → DNS 설정 → Nameservers 변경:
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**옵션 B: A 레코드 사용**
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

##### stage-handy.com 도메인 (이미 설정됨)

현재 스테이징 도메인이 이미 연결되어 있다면 추가 작업 불필요.
`develop` 브랜치를 이 도메인에 매핑하려면:

1. Domains → `stage-handy.com` 옆 **Edit** 클릭
2. **Git Branch**: `develop` 선택
3. Save

---

### 3단계: 배포 실행

#### 로컬에서 빌드 및 배포

##### 스테이징 배포 (develop 브랜치)

```bash
# develop 브랜치로 이동
git checkout develop

# 최신 변경사항 반영
git pull origin develop

# 루트에서 빌드 (shared 포함)
cd /Users/heojeongmin/WebstormProjects/handy-platform
npm run build:shared

# 웹 패키지로 이동
cd packages/web

# 스테이징 빌드
npm run build:stage

# Vercel Preview 배포
npm run deploy:stage
# 또는
vercel

# 배포 URL 확인 및 테스트
```

##### 프로덕션 배포 (main 브랜치)

```bash
# main 브랜치로 이동
git checkout main

# develop 변경사항을 main에 병합
git merge develop

# 루트에서 빌드
cd /Users/heojeongmin/WebstormProjects/handy-platform
npm run build:shared

# 웹 패키지로 이동
cd packages/web

# 프로덕션 빌드
npm run build:prod

# Vercel Production 배포
npm run deploy:prod
# 또는
vercel --prod

# 배포 URL 확인: https://h-andy.com
```

---

#### Git Push를 통한 자동 배포 (추천)

Vercel은 Git과 자동 연동되므로, 브랜치 푸시만으로 배포됩니다.

##### 스테이징 자동 배포
```bash
# develop 브랜치에서 작업
git checkout develop

# 변경사항 커밋
git add .
git commit -m "feat: add new feature"

# develop 브랜치 푸시 → 자동으로 스테이징 배포
git push origin develop
```

##### 프로덕션 자동 배포
```bash
# develop을 main에 병합
git checkout main
git merge develop

# main 브랜치 푸시 → 자동으로 프로덕션 배포
git push origin main
```

**Vercel Dashboard에서 배포 상태 확인**:
- Deployments 탭에서 실시간 빌드 로그 확인
- 배포 완료 시 URL 자동 생성

---

### 4단계: 배포 검증

#### 체크리스트

##### 스테이징 환경 (https://stage-handy.com)
- [ ] 페이지 로딩 정상
- [ ] API 연동 정상 (백엔드 :8080 포트 연결 확인)
- [ ] 로그인/로그아웃 기능
- [ ] 장바구니 추가/삭제
- [ ] 상품 검색 및 목록
- [ ] 브라우저 콘솔에 에러 없음
- [ ] 네트워크 탭에서 API 응답 확인

##### 프로덕션 환경 (https://h-andy.com)
- [ ] 페이지 로딩 정상
- [ ] API 연동 정상 (백엔드 :80 포트 연결 확인)
- [ ] 로그인/로그아웃 기능
- [ ] 장바구니 추가/삭제
- [ ] 상품 검색 및 목록
- [ ] 브라우저 콘솔에 에러 없음
- [ ] 네트워크 탭에서 API 응답 확인
- [ ] 성능 테스트 (Lighthouse 점수 확인)
- [ ] 모바일 반응형 확인

##### 검증 방법

**1. API 연동 확인**
```bash
# 브라우저 개발자 도구 (F12) → Network 탭
# API 요청 URL 확인:
# 스테이징: https://www.stage-handy.com/api/...
# 프로덕션: https://h-andy.com/api/...
```

**2. 환경변수 확인**
```javascript
// 브라우저 콘솔에서 실행
console.log(import.meta.env.VITE_API_BASE_URL);
// 스테이징: "https://www.stage-handy.com"
// 프로덕션: "https://h-andy.com"
```

**3. 빌드 환경 확인**
```javascript
console.log(import.meta.env.VITE_ENVIRONMENT);
// 스테이징: "staging"
// 프로덕션: "production"
```

---

### 5단계: 백엔드 API 설정 확인

프론트엔드 배포 후 백엔드 서버 CORS 설정을 확인하세요.

#### 백엔드 CORS 설정 필요 도메인
```javascript
// 허용해야 할 도메인들
const allowedOrigins = [
  'https://h-andy.com',           // 프로덕션
  'https://www.stage-handy.com',  // 스테이징
  'http://localhost:3001',        // 로컬 개발
  '*.vercel.app'                  // Vercel Preview 환경
];
```

백엔드 팀에 전달:
- h-andy.com CORS 허용 요청
- 프로덕션 백엔드 포트: :80
- 스테이징 백엔드 포트: :8080

---

### 배포 워크플로우 요약

```
개발 프로세스:
1. feature/xxx 브랜치에서 개발
2. develop 브랜치로 PR 생성 및 병합
3. develop 푸시 → 자동 스테이징 배포 (stage-handy.com)
4. 스테이징에서 QA 및 테스트
5. main 브랜치로 PR 생성 및 병합
6. main 푸시 → 자동 프로덕션 배포 (h-andy.com)
7. 프로덕션에서 최종 검증
```

---

### 배포 관련 명령어 요약

```bash
# 스테이징 배포 (로컬)
npm run build:stage && npm run deploy:stage

# 프로덕션 배포 (로컬)
npm run build:prod && npm run deploy:prod

# Git을 통한 자동 배포 (추천)
git push origin develop  # 스테이징
git push origin main     # 프로덕션

# 배포 로그 확인
vercel logs

# 배포 목록 확인
vercel ls
```

---

### 문제 해결

#### 배포 실패 시
1. Vercel 대시보드 → Deployments → 실패한 배포 클릭
2. 빌드 로그 확인
3. 일반적인 원인:
   - 환경변수 미설정
   - TypeScript 에러
   - 빌드 명령어 오류
   - 메모리 부족

#### API 연결 안 됨
1. 브라우저 개발자 도구 → Network 탭
2. API 요청 URL 확인
3. CORS 에러 확인
4. 백엔드 서버 상태 확인

#### 도메인 연결 안 됨
1. DNS 전파 대기 (최대 48시간)
2. DNS 설정 확인: `nslookup h-andy.com`
3. Vercel Domains 탭에서 상태 확인

---

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

## 📋 TODO & 향후 계획

### 🎥 React Native Vision Camera 구현 (고급 카메라 기능)

**현재 상태**: 기본 ImagePicker 구현 완료, Vision Camera는 Kotlin 호환성 문제로 보류

**목표**: 실시간 카메라 미리보기와 오버레이 가이드를 통한 더 나은 UX 제공

#### 해결해야 할 기술적 과제들

1. **Kotlin 호환성 문제**
   - 에러: `kotlinx.coroutines.CoroutineDispatcher` 메타데이터 버전 충돌 (2.0.0 vs 1.8.0 expected)
   - react-native-vision-camera 4.7.2가 요구하는 Kotlin 버전과 프로젝트 설정 간 불일치
   - 해결 방안: 
     - Kotlin 버전 통일 (2.0.20)
     - kotlinx-coroutines 버전 강제 지정 (1.8.1)
     - 메타데이터 버전 체크 스킵 옵션 적용

2. **모노레포 환경에서의 React Native 경로 설정**
   - 에러: React Native gradle.properties 파일 경로 불일치
   - packages/node_modules vs root/node_modules 경로 문제
   - 해결 방안: 심링크 생성 또는 gradle 설정 수정

3. **구현 계획**
   ```typescript
   // 목표 구현 코드 (CameraScreen.tsx)
   import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
   
   const CameraScreen = () => {
     const devices = useCameraDevices();
     const { hasPermission, requestPermission } = useCameraPermission();
     const device = devices.back;

     return (
       <View style={StyleSheet.absoluteFill}>
         {/* 실시간 카메라 미리보기 */}
         <Camera
           ref={cameraRef}
           style={StyleSheet.absoluteFill}
           device={device}
           isActive={true}
           photo={true}
         />
         
         {/* 가이드 오버레이 */}
         <CameraGuideOverlay visible={true} />
         
         {/* 촬영 버튼 */}
         <TouchableOpacity onPress={handleTakePhoto}>
           <Text>📸 촬영</Text>
         </TouchableOpacity>
       </View>
     );
   };
   ```

4. **장점**
   - 실시간 카메라 미리보기로 더 정확한 손톱 위치 확인
   - 오버레이 가이드를 통한 직관적인 촬영 가이드
   - 더 나은 사용자 경험

5. **우선순위**: 중간 (기본 기능 완성 후 진행)

6. **참고 자료**
   - [React Native Vision Camera 공식 문서](https://react-native-vision-camera.com/)
   - [Kotlin 호환성 가이드](https://kotlinlang.org/docs/compatibility-modes.html)

---

**Note**: This CLAUDE.md file should be updated as the project structure, dependencies, and architecture are established.
