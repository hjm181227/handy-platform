# iOS 출시 런북 — 1.9.9 (build 10)

> **작성일**: 2026-08-26. macOS에서 이 문서만 보고 바로 아카이브→업로드까지 진행할 수 있도록 작성됨.
> Android 1.9.9(vc26)와 동일한 코드 기준(develop 브랜치)이며, FCM 푸시 관련 JS 코드는 iOS/Android 공용으로 완성돼 있다.

## 이미 완료된 것 (Mac에서 다시 할 필요 없음)

| 항목 | 상태 |
|---|---|
| Firebase iOS 앱 등록 (`handy-1fb15`, 번들 `com.hermosear.handy`) | ✅ 완료 |
| `GoogleService-Info.plist` 배치 (`ios/HandyTemp/GoogleService-Info.plist`, BUNDLE_ID 일치 확인됨) | ✅ 완료 |
| `AppDelegate.mm` Firebase 초기화 (`[FIRApp configure]`) | ✅ 완료 |
| 버전 설정: `MARKETING_VERSION 1.9.9` / `CURRENT_PROJECT_VERSION 10` | ✅ 완료 |
| 푸시 JS 코드 (토큰 등록·갱신 재등록·알림 탭 라우팅·로그아웃 해제) | ✅ 완료 (2026-08-26 수정분 포함) |
| 채팅 서버 푸시 발송 (`chat.h-andy.com`, iOS는 APNs alert 페이로드로 발송) | ✅ 서버 가동 중 |
| 결제(외부 결제앱 전환 포함) | ✅ 실기기 테스트 완료 (추가 작업 불필요) |
| `ExportOptions.plist` (app-store, manual 서명, team `V7XPTJL83T`, 프로파일 `Handy Platform distribute`) | ✅ 존재 |

## Mac에서 해야 할 일 (순서대로)

### 0. 준비

```bash
git clone https://github.com/hjm181227/handy-platform.git   # 이미 있으면 git pull
cd handy-platform
git checkout develop        # 또는 출시 시점의 main
npm install
npm run build:shared        # 필수 — shared 빌드 없이는 컴파일 실패
cd packages/mobile/ios
pod install                 # use_frameworks 모드. 실패 시: pod deintegrate && pod install
```

요구사항: Xcode 16+, CocoaPods, Node 20.x, Apple Developer 계정(팀 `V7XPTJL83T`).

### 1. ⚠️ 필수 — 푸시 entitlement를 production으로 변경

`ios/HandyTemp/HandyTemp.entitlements`:

```xml
<key>aps-environment</key>
<string>development</string>   <!-- 이걸 -->
```
→ `<string>production</string>` 으로 변경.

**왜**: manual 서명이라 Xcode가 배포 시 자동 교체해 주지 않는다. `development`인 채로 App Store에 올라가면 프로덕션 APNs에서 `BadDeviceToken`으로 푸시가 전부 실패한다.

변경 후 커밋해 둘 것 (다음 출시 때 반복 방지).

### 2. ⚠️ 필수 — APNs 인증키(.p8) 발급 + Firebase 업로드

이게 없으면 iOS 푸시가 아예 작동하지 않는다 (Android는 무관).

1. [Apple Developer → Keys](https://developer.apple.com/account/resources/authkeys/list) → **+**
2. Key Name 임의 (예: `Handy APNs Key`), **Apple Push Notifications service (APNs)** 체크 → 등록 → **.p8 다운로드** (한 번만 받을 수 있음 — 안전한 곳에 보관, 저장소에 커밋 금지)
3. [Firebase 콘솔](https://console.firebase.google.com) → 프로젝트 `handy-1fb15` → ⚙️ 프로젝트 설정 → **Cloud Messaging** 탭 → Apple 앱 구성(`com.hermosear.handy`) → **APNs 인증 키 업로드**
   - 키 파일: 방금 받은 .p8
   - Key ID: Apple Developer 키 목록에 표시되는 10자리
   - Team ID: `V7XPTJL83T`

### 3. 서명 확인

Xcode에서 `ios/HandyPlatform.xcworkspace` 열기 (⚠️ `.xcodeproj` 아님) → 타깃 `HandyTemp` → Signing & Capabilities:

- Manual 서명, 프로비저닝 프로파일 **`Handy Platform distribute`** (App Store용)
- **Push Notifications capability가 프로파일에 포함돼 있는지 확인.** 앱 ID에 Push가 활성화 안 돼 있으면 [Identifiers](https://developer.apple.com/account/resources/identifiers/list)에서 `com.hermosear.handy`에 Push Notifications 켜고 프로파일 재생성 → 다운로드 → Xcode에서 선택.
- Apple Distribution 인증서가 키체인에 있어야 함.

### 4. 아카이브 & 업로드

GUI: scheme `HandyTemp` + `Any iOS Device (arm64)` 선택 → Product > Archive → Organizer에서 **Distribute App > App Store Connect**.

또는 CLI:

```bash
cd packages/mobile/ios
xcodebuild -workspace HandyPlatform.xcworkspace -scheme HandyTemp \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath build/HandyTemp.xcarchive archive
xcodebuild -exportArchive -archivePath build/HandyTemp.xcarchive \
  -exportOptionsPlist ExportOptions.plist -exportPath build/export
# build/export/*.ipa 를 Transporter 앱 또는 xcrun altool/notarytool로 업로드
```

참고: Release 아카이브는 Metro JS 번들을 자동 생성·내장하므로 별도 번들 명령 불필요. iOS Release 빌드는 `__DEV__=false` → 환경이 자동으로 `production`(h-andy.com, chat.h-andy.com)으로 잡힌다. 환경 변수 설정 불필요.

### 5. 출시 후 검증 (TestFlight 권장)

1. TestFlight 빌드 설치 (production entitlement + .p8이면 TestFlight에서도 프로덕션 APNs 사용 = 실환경 그대로 검증됨)
2. 로그인 → 알림 권한 허용 → 다른 계정으로 채팅 메시지 전송
3. 확인 항목:
   - 백그라운드/종료 상태에서 푸시 수신
   - 푸시 탭 → 해당 채팅방(`/chat/{상대ID}`)으로 이동
   - 같은 방을 보고 있을 때는 알림 미표시
   - 로그아웃 → 푸시 중단

## 트러블슈팅

- `pod install` 실패: `rm -rf Pods Podfile.lock && pod deintegrate && pod install`
- 빌드 중 shared 타입 오류: 루트에서 `npm run build:shared` 재실행
- 파생 데이터 꼬임: `rm -rf ~/Library/Developer/Xcode/DerivedData`
- 푸시 미수신 시 순서대로 확인: ① entitlement가 production인지(ipa 재확인: `codesign -d --entitlements - <app>`) ② Firebase에 .p8 업로드됐는지 ③ 기기 로그에 `Firebase configured successfully` 찍히는지 ④ 채팅서버 로그(`Firebase Admin SDK initialized`)

## 관련 문서

- [IOS_PUSH_SETUP.md](./IOS_PUSH_SETUP.md) — 초기 설정 지시서 (Firebase 앱 등록·plist 배치 단계는 이미 완료됨. 이 런북이 최신 상태 기준)
