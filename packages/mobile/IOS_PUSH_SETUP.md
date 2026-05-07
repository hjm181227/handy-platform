# iOS 푸시 알림 설정 작업 지시서

> 이 문서는 macOS + Xcode가 필요한 iOS 푸시 알림 설정 작업을 정리한 것입니다.
> Android 쪽 작업은 이미 완료되어 있고, JS 코드(`notificationService.ts`, `index.js`, `App.tsx`, `WebViewBridge.tsx`)는 iOS와 Android 양쪽 모두 동작하도록 작성되어 있습니다.
> 아래 단계만 macOS에서 수행하면 iOS 푸시도 바로 동작합니다.

## 사전 요구사항

- [ ] macOS + Xcode 16+ (또는 최신)
- [ ] CocoaPods 설치됨 (`gem install cocoapods`)
- [ ] Apple Developer Program 멤버십 (앱 출시용 — 이미 보유 중일 가능성 높음)
- [ ] Firebase 프로젝트가 이미 생성되어 있어야 함 (Android 설정 시 만들어진 프로젝트 재사용)
- [ ] `packages/mobile/package.json`에 `@react-native-firebase/app`, `@react-native-firebase/messaging`, `@notifee/react-native`가 이미 추가되어 있어야 함 (완료됨)

---

## 1단계: Firebase 콘솔 — iOS 앱 등록

1. [Firebase 콘솔](https://console.firebase.google.com) → 기존 Handy 프로젝트 진입.
2. **프로젝트 설정** → **내 앱** → **iOS 앱 추가** 클릭.
3. 입력값:
   - **iOS 번들 ID**: Xcode의 `Bundle Identifier`와 동일하게 입력. 일반적으로 `com.handyapp` (Android applicationId와 동일하게 통일하는 것을 권장).
   - **앱 닉네임**: `Handy iOS`
   - **App Store ID**: 비워두거나 출시 후 입력.
4. **GoogleService-Info.plist 다운로드** 클릭.
5. 다운로드한 파일을 다음 경로에 배치:
   ```
   packages/mobile/ios/handy_platform/GoogleService-Info.plist
   ```
   (실제 디렉터리명은 Xcode 프로젝트의 메인 타깃 폴더명과 일치해야 함. 예: `ios/handy_platform/`, `ios/HandyPlatformApp/` 등)

---

## 2단계: APNs 인증키 발급 + Firebase에 업로드

1. [Apple Developer 콘솔](https://developer.apple.com/account/resources/authkeys/list) 접속.
2. **Keys** → **+** 버튼.
3. 입력값:
   - **Key Name**: `Handy APNs Key` (임의)
   - **Apple Push Notifications service (APNs)** 체크박스 활성화.
4. **Continue** → **Register** → **Download** 클릭. `.p8` 파일이 다운로드됨.
   - **주의**: 이 파일은 **한 번만 다운로드 가능**. 안전한 곳에 보관.
5. **Key ID** (10자리 영숫자)와 **Team ID** (Apple Developer 페이지 우측 상단)를 메모.
6. Firebase 콘솔 → 프로젝트 설정 → **Cloud Messaging** 탭 → iOS 앱 섹션 → **APN Authentication Key** → **Upload** 클릭.
7. 업로드:
   - `.p8` 파일
   - Key ID
   - Team ID

---

## 3단계: Xcode 프로젝트 설정

### 3-1. CocoaPods 설치

```bash
cd packages/mobile/ios
pod install
cd ../../..
```

> `pod install`이 `RNFBApp`, `RNFBMessaging`, `RNNotifee` 등을 자동 설치합니다.
> 만약 에러가 나면 `pod repo update` 후 재시도.

### 3-2. Xcode에서 프로젝트 열기

```bash
open packages/mobile/ios/handy_platform.xcworkspace
```

(`.xcworkspace`를 열어야 함. `.xcodeproj` 아님!)

### 3-3. GoogleService-Info.plist를 Xcode 프로젝트에 추가

1. Xcode 좌측 Navigator에서 프로젝트 루트(파란 아이콘) → 메인 타깃 폴더(예: `handy_platform`)를 우클릭 → **Add Files to "handy_platform"...**
2. 1단계에서 배치한 `GoogleService-Info.plist` 선택.
3. 옵션:
   - ☑️ **Copy items if needed** (이미 폴더에 있으면 체크 해제 가능)
   - ☑️ **Create folder references** 또는 **Create groups** 중 그룹 선택
   - **Add to targets**: 메인 앱 타깃 체크 (예: `handy_platform`)
4. **Add** 클릭.

### 3-4. Push Notifications Capability 추가

1. Xcode 좌측 프로젝트 → 메인 타깃 선택 → **Signing & Capabilities** 탭.
2. **+ Capability** 클릭.
3. **Push Notifications** 검색 후 더블클릭.
4. 같은 방법으로 **Background Modes** 추가:
   - ☑️ **Remote notifications** 체크
   - (선택) ☑️ **Background fetch**

> 위 작업으로 다음 파일이 자동 업데이트됨:
> - `ios/handy_platform/handy_platform.entitlements` — `aps-environment`가 `development`로 설정됨 (Release 빌드 시 자동으로 `production`으로 전환됨)
> - `Info.plist` — `UIBackgroundModes`에 `remote-notification` 추가됨

### 3-5. AppDelegate에 Firebase 초기화 추가

`packages/mobile/ios/handy_platform/AppDelegate.mm` (또는 `.swift`) 수정:

#### Objective-C++ (`AppDelegate.mm`)인 경우:

```objc
#import "AppDelegate.h"
#import <Firebase.h>  // ← 추가

#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
  didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Firebase 초기화 (반드시 다른 초기화 코드보다 먼저)
  [FIRApp configure];   // ← 추가

  self.moduleName = @"HandyPlatformApp";
  // ...기존 코드...

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

@end
```

#### Swift (`AppDelegate.swift`)인 경우:

```swift
import UIKit
import Firebase   // ← 추가

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

  func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

    FirebaseApp.configure()   // ← 추가
    return true
  }
}
```

---

## 4단계: 빌드 + 시뮬레이터/기기 테스트

### 시뮬레이터에서

```bash
npm run ios:dev
```

> **주의**: iOS 시뮬레이터는 푸시 알림을 직접 받을 수 없습니다 (iOS 16+ 일부 시뮬레이터는 가능). 실제 기기에서 테스트하는 것이 권장.
> 단, 시뮬레이터에서 `notifee.displayNotification`은 동작하므로 인앱 알림 표시는 확인 가능.

### 실제 기기에서

1. Xcode → **Window** → **Devices and Simulators** → 기기 연결 후 빌드.
2. 빌드 후 앱 첫 실행 시 시스템 알림 권한 다이얼로그 표시 확인.
3. 로그인 시 콘솔 로그에서 FCM 토큰 출력 확인.
4. Firebase 콘솔 → **Cloud Messaging** → **Send test message**로 테스트 푸시 발송.

---

## 5단계: 검증 체크리스트

- [ ] 앱 첫 실행 시 알림 권한 요청 다이얼로그 표시
- [ ] 로그인 후 콘솔에 FCM 토큰 출력
- [ ] 채팅 서버 User 문서의 `pushTokens` 배열에 platform: 'ios' 토큰 저장됨
- [ ] **앱 백그라운드/킬 상태**에서 다른 계정 메시지 수신 → 푸시 알림 표시
- [ ] **앱 포그라운드 + 다른 화면**에서 메시지 수신 → Notifee 알림 표시
- [ ] **앱 포그라운드 + 같은 채팅방 활성**에서 메시지 수신 → 알림 표시 안 됨 (이미 socket으로 받음)
- [ ] 알림 탭 → 해당 채팅방으로 자동 이동
- [ ] 콜드 스타트 (앱 종료 → 알림 탭) → 앱 부팅 후 채팅방 자동 진입
- [ ] 로그아웃 후 → 채팅 서버 User 문서에서 토큰 제거 확인
- [ ] 긴 메시지(300자+) 수신 → 푸시 본문 200자로 잘려 표시되지만 정상 도착

---

## 6단계: 프로덕션 출시 시 추가 작업

- [ ] **Production APNs Auth Key 확인**: Apple Developer 콘솔에서 발급한 키는 dev/production 양쪽에서 모두 동작. 별도 작업 불필요.
- [ ] **GoogleService-Info.plist 환경 분리** (선택): dev/stage/prod 환경별 Firebase 프로젝트를 분리한다면, Xcode Build Phases의 "Copy Bundle Resources"에서 환경별 plist를 동적으로 복사하는 스크립트 추가. v1에서는 단일 Firebase 프로젝트로 충분.
- [ ] **App Store Connect 준비사항**: 새 권한이 추가되었으므로 앱 심사 시 알림 사용 목적을 설명하는 텍스트 준비. (예: "고객 문의/판매자 응답 알림을 위해 사용")

---

## 트러블슈팅

### 빌드 에러: "duplicate symbols for architecture arm64"

Firebase Pod 충돌. 해결:
```bash
cd packages/mobile/ios
pod deintegrate
pod install
```

### 빌드 에러: "use_frameworks! must be set to :linkage => :static"

`Podfile`에 다음 추가:
```ruby
use_frameworks! :linkage => :static
$RNFirebaseAsStaticFramework = true
```

### 푸시는 도착하지만 앱이 닫혔을 때 표시되지 않음

- `aps-environment` 키가 entitlements에 있는지 확인
- Background Modes의 "Remote notifications"가 체크되어 있는지 확인
- 페이로드가 `data`-only로 발송되는지 확인 (서버 코드는 이미 그렇게 발송함)

### 푸시 탭 시 채팅방으로 이동하지 않음

- `notificationService.ts`의 `routeToChat`이 호출되는지 로그 확인
- WebView 라우트가 `/chat/{senderId}` 형식으로 매핑되어 있는지 확인 (`ChatRoomPage`는 partnerId를 URL slot으로 받음)

### iOS 시뮬레이터에서 토큰을 받지 못함

iOS 시뮬레이터는 APNs 토큰을 받을 수 없으므로 정상. 실기기에서 테스트.

---

## 참고

- [@react-native-firebase/messaging 공식 문서](https://rnfirebase.io/messaging/usage)
- [@notifee/react-native iOS 가이드](https://notifee.app/react-native/docs/installation#ios)
- [Firebase 콘솔 — Cloud Messaging 설정](https://firebase.google.com/docs/cloud-messaging/ios/client)
