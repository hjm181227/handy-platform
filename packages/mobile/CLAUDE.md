# Mobile Package - CLAUDE.md

> **전체 프로젝트 가이드**: 루트 [CLAUDE.md](../../CLAUDE.md) 참조
> **공통 API 서비스**: [packages/shared/CLAUDE.md](../shared/CLAUDE.md) 참조

React Native 모바일 앱 관련 가이드입니다.

> **중요**: `package.json`에 의존성을 추가/변경하면 반드시 루트 `package-lock.json`도 함께 커밋할 것. 누락 시 GitHub Actions CI(`npm ci`)가 실패합니다.

## 모바일 앱 실행

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

## Build & Deploy

```bash
# Android APK 빌드
cd android && ./gradlew assembleRelease

# Android AAB 빌드 (Play Store용)
cd android && ./gradlew bundleRelease
```

## Permission Guidelines

**자동 권한 추가 정책**: 코드 실행 중 권한이 필요한 경우 즉시 추가하여 사용
- Android: `android/app/src/main/AndroidManifest.xml`에 자동 추가
- iOS: `ios/*/Info.plist`에 usage description 자동 추가
- TypeScript: `src/utils/permissions.ts`에 권한 함수 자동 추가
- 권한 요청 시 사용자 친화적 메시지 포함
- 설정 앱으로 이동 기능 포함

## WebView Bridge Usage

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

// 권한 요청
window.ReactNativeWebView.requestPermission('camera');

// 채팅 기능 (모바일 앱 전용)
window.ReactNativeWebView.chat('connect', { token });
window.ReactNativeWebView.chat('joinRoom', { roomId });
window.ReactNativeWebView.chat('sendMessage', { roomId, text: 'Hello!' });
window.ReactNativeWebView.chat('leaveRoom', { roomId });
window.ReactNativeWebView.chat('disconnect');
```

## 네이티브 화면 추가 가이드

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
          <Text style={styles.captureButtonText}>촬영</Text>
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
  console.log('[NativeScreenProvider] Opening Camera screen', params);
  setCameraParams(params || null);
  setShowCamera(true);
};

const closeCamera = () => {
  console.log('[NativeScreenProvider] Closing Camera screen');
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
      console.log('[NativeScreenProvider] openCamera event received', data);
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
          console.log('Photo taken:', uri);
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
  console.log('[BRIDGE] Navigate to Camera screen:', data);
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

## Socket.IO 실시간 채팅 기능

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
- 모든 채팅 기능 활성화
- 백그라운드 재연결 지원
- Android 에뮬레이터: `localhost` → `10.0.2.2` 자동 변환
- AppState 감지 및 자동 재연결

#### Web (브라우저)
- 기본적으로 비활성화
- WebView 환경 감지 시 활성화
- `isChatEnabled()` 메서드로 상태 확인

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

---

## Troubleshooting

### Android 빌드 오류
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

### iOS 빌드 오류 (macOS)
```bash
# CocoaPods 재설치
cd packages/mobile/ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install

# Xcode 파생 데이터 정리
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### WebView 연결 오류
```bash
# 웹 서버가 실행 중인지 확인
lsof -i :3001

# 웹 서버 시작
npm run web:dev  # 개발환경
npm run web:prod # 프로덕션환경

# Android 에뮬레이터에서 localhost 접근 확인
# 10.0.2.2:3001 = localhost:3001 (에뮬레이터 전용)
```

---

## TODO & 향후 계획

### React Native Vision Camera 구현 (고급 카메라 기능)

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
           <Text>촬영</Text>
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
