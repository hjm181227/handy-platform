# React Native 버전업 영향도 분석

> 작성일: 2026-02-13
> 현재 버전: React Native 0.73.6
> 분석 범위: 0.73.6 → 0.77

---

## 1. 현재 프로젝트 상태

| 항목 | 현재 값 |
|------|---------|
| **React Native** | **0.73.6** |
| **React** | 18.2.0 |
| **Kotlin** | 2.0.21 |
| **Gradle** | 8.7 |
| **AGP (Android Gradle Plugin)** | 8.6.0 |
| **NDK** | r27c (27.3.13750724) |
| **compileSdk / targetSdk** | 35 |
| **minSdkVersion** | 23 (Android 6.0 Marshmallow) |
| **Hermes** | enabled |
| **New Architecture** | **disabled** (`newArchEnabled=false`) |
| **네이티브 언어** | Kotlin (.kt) — Java 없음 |
| **iOS 최소 버전** | `min_ios_version_supported` (RN이 결정) |
| **16KB 페이지 크기 대응** | NDK r27c + CMake flag + `useLegacyPackaging=true` |

---

## 2. 버전별 주요 변경사항 및 영향도

### 2.1. 0.73 → 0.74

| 변경사항 | 영향도 | 프로젝트 영향 |
|----------|--------|--------------|
| **Java 17 필수** | 없음 | AGP 8.6.0이 이미 Java 17 요구. 현재 설정 호환됨 |
| **Flipper 제거** | 없음 | `app/build.gradle:157`에서 이미 주석 처리됨 |
| **Kotlin 기본 템플릿** | 없음 | 이미 `.kt` 파일 사용 중 (MainActivity.kt, MainApplication.kt) |
| **Yoga 레이아웃 개선** | 낮음 | `row-reverse` 레이아웃 수정. WebView 기반이라 영향 최소 |
| **@react-native/* 패키지 버전** | 낮음 | `@react-native/metro-config` 0.73.5 → 0.74.x 업데이트 필요 |
| **@react-native-community/cli** | 낮음 | 현재 12.3.6 → 해당 RN 버전 매칭 필요 |

**종합 영향도: 🟢 낮음** — 대부분 이미 호환되거나 영향 없음

#### 필요 작업
```diff
# package.json devDependencies 변경
- "@react-native-community/cli": "^12.3.6",
- "@react-native-community/cli-platform-android": "^12.3.6",
- "@react-native/metro-config": "^0.73.5",
+ "@react-native-community/cli": "^13.x",
+ "@react-native-community/cli-platform-android": "^13.x",
+ "@react-native/metro-config": "^0.74.x",
```

---

### 2.2. 0.74 → 0.75

| 변경사항 | 영향도 | 프로젝트 영향 |
|----------|--------|--------------|
| **PushNotificationIOS 제거** | 없음 | 프로젝트에서 미사용 |
| **JSIModule API 제거** | 없음 | 커스텀 TurboModule 없음 |
| **`react-native init` deprecated** | 없음 | 기존 프로젝트에 영향 없음 |
| **Auto-linking 성능 개선** | 긍정적 | Android 6.5x, iOS 1.5x 빌드 속도 향상 |
| **React 18.3 peer dependency** | 낮음 | React 18.2.0 → 18.3.x 업데이트 필요 |

**종합 영향도: 🟢 낮음**

#### 필요 작업
```diff
# package.json dependencies 변경
- "react": "18.2.0",
+ "react": "18.3.1",
```

---

### 2.3. 0.75 → 0.76: ⚠️ 핵심 전환점

| 변경사항 | 영향도 | 프로젝트 영향 |
|----------|--------|--------------|
| **New Architecture 기본 활성화** | **🔴 높음** | Fabric + TurboModules가 기본. 모든 네이티브 모듈 호환성 검증 필요 |
| **Android minSdk 23 → 24** | **🟡 중간** | Android 6.0 (Marshmallow) 기기 지원 중단 |
| **iOS 최소 13.4 → 15.1** | **🟡 중간** | iOS 13~15.0 기기 지원 중단 |
| **libreactnative.so 통합** | 긍정적 | 50개+ .so 파일 → 1개. 16KB 정렬 네이티브 지원 |
| **SoLoader 초기화 변경** | **🟡 중간** | `MainApplication.kt:40` 수정 필요 |
| **CLI 분리** | 낮음 | `@react-native-community/cli`를 devDeps에 명시적 추가 |
| **APK 3.8MB 감소** | 긍정적 | 설치 크기 절감 |
| **앱 시작 시간 8% 개선** | 긍정적 | 성능 향상 |
| **React 19 peer dependency** | **🟡 중간** | React 18.x → 19.x 메이저 업데이트 |

**종합 영향도: 🔴 매우 높음** — 가장 큰 전환점

#### 필요 작업

**1. MainApplication.kt — SoLoader 변경**
```diff
# packages/mobile/android/app/src/main/java/com/handyapp/MainApplication.kt

  override fun onCreate() {
    super.onCreate()
-   SoLoader.init(this, false)
+   SoLoader.init(this, SoLoader.SOLOADER_ALLOW_ASYNC_INIT)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
  }
```

**2. minSdkVersion 변경**
```diff
# packages/mobile/android/build.gradle
- minSdkVersion = 23
+ minSdkVersion = 24
```

**3. useLegacyPackaging 제거 가능**
```diff
# packages/mobile/android/app/build.gradle
- packagingOptions {
-     jniLibs {
-         useLegacyPackaging = true
-     }
- }
```
> 0.76에서 libreactnative.so가 이미 16KB 정렬을 지원하므로 `useLegacyPackaging` 불필요

**4. New Architecture 대응**
```diff
# packages/mobile/android/gradle.properties
- newArchEnabled=false
+ newArchEnabled=true  # 0.76에서 기본값이 true
```
> 또는 명시적으로 `false`로 유지하여 점진적 전환 가능 (opt-out)

**5. React 19 업그레이드**
```diff
- "react": "18.2.0",
+ "react": "19.0.0",
- "react-test-renderer": "18.2.0",
+ # react-test-renderer는 React 19에서 제거됨 → @testing-library/react-native 사용
```

---

### 2.4. 0.76 → 0.77

| 변경사항 | 영향도 | 프로젝트 영향 |
|----------|--------|--------------|
| **iOS Swift 기본** | 없음 | 새 프로젝트만 해당 (기존 Obj-C 유지 가능) |
| **Node.js 18+ 필수** | 확인 필요 | `package.json`의 `"engines": { "node": ">=16" }` 업데이트 필요 |
| **Console log streaming 제거** | 낮음 | Metro 디버깅 방식 변경 |
| **Community CLI 업데이트** | 낮음 | CLI 경로 및 버전 매칭 필요 |

**종합 영향도: 🟢 낮음**

---

## 3. 네이티브 의존성 호환성 분석

### 3.1. 핵심 의존성 (High Risk)

| 라이브러리 | 현재 버전 | RN 0.76+ | New Arch | 비고 |
|-----------|----------|----------|----------|------|
| **react-native-vision-camera** | 4.7.3 | ⚠️ | ⚠️ | CMake 빌드 이슈 보고 (GitHub #3651-3652). C++ linking 충돌 가능. 0.76 CMake 구조 변경으로 `libreactnative.so`와 충돌 위험 |
| **react-native-worklets-core** | 1.6.2 | ⚠️ | ⚠️ | VisionCamera 의존성. New Arch에서 JSI 인터페이스 변경 가능 |
| **react-native-fast-tflite** | 2.0.0 | ⚠️ | ❓ | New Arch TurboModule 지원 여부 검증 필요 |
| **vision-camera-resize-plugin** | 3.2.0 | ⚠️ | ⚠️ | VisionCamera 버전과 강결합 |

> **ML 파이프라인 전체** (VisionCamera → worklets → resize-plugin → TFLite)가 가장 큰 리스크.
> 한 라이브러리가 호환되지 않으면 전체 ML 기능이 동작하지 않음.

### 3.2. 중간 위험 의존성

| 라이브러리 | 현재 버전 | RN 0.76+ | New Arch | 비고 |
|-----------|----------|----------|----------|------|
| **react-native-fs** | 2.20.0 | ⚠️ | ⚠️ | 유지보수 부족. 대안: `@dr.pogodin/react-native-fs` |
| **react-native-screens** | 3.29.0 | ✅ | ✅ | 최신 버전(~4.x)으로 업데이트 권장 |
| **react-native-image-crop-picker** | 0.51.1 | ✅ | ⚠️ | 일반적으로 호환. New Arch 완전 지원 확인 필요 |
| **react-native-image-resizer** | 1.4.5 | ⚠️ | ⚠️ | 오래된 라이브러리. 대안 고려 |

### 3.3. 안전한 의존성 (Low Risk)

| 라이브러리 | 현재 버전 | RN 0.76+ | New Arch | 비고 |
|-----------|----------|----------|----------|------|
| **react-native-webview** | 13.16.0 | ✅ | ✅ | 핵심 의존성. 호환 확인됨 |
| **react-native-safe-area-context** | 4.14.1 | ✅ | ✅ | 호환 |
| **react-native-svg** | 14.2.0 | ✅ | ✅ | 호환 |
| **react-native-vector-icons** | 10.3.0 | ✅ | ✅ | 호환 |
| **react-native-permissions** | 4.1.5 | ✅ | ✅ | 호환 |
| **@react-native-async-storage** | 1.24.0 | ✅ | ✅ | 호환 |
| **socket.io-client** | 4.8.1 | ✅ | ✅ | 순수 JS 라이브러리, 네이티브 코드 없음 |

### 3.4. 호환성 매트릭스 요약

```
                        RN 0.74  RN 0.75  RN 0.76  RN 0.77
WebView 하이브리드         ✅       ✅       ✅       ✅
Socket.IO 채팅             ✅       ✅       ✅       ✅
카메라/이미지 기본 기능      ✅       ✅       ⚠️       ⚠️
ML 파이프라인 (전체)        ✅       ✅       ❓       ❓
```

---

## 4. 버전업으로 얻는 이점

### 4.1. 성능 개선
- **APK 크기 3.8MB 감소** — `libreactnative.so` 통합 (50+ → 1개 .so)
- **앱 시작 시간 8% 개선** — SO 로딩 최적화
- **Auto-linking 빌드 속도** — Android 6.5x, iOS 1.5x 향상 (0.75~)

### 4.2. 16KB 페이지 크기 네이티브 지원 (0.76+)
- 현재: NDK r27c + CMake flag + `useLegacyPackaging=true` (workaround)
- 업그레이드 후: `useLegacyPackaging` 제거 가능 → **설치 크기 10-20MB 절감**
- Google Play 정책 네이티브 준수

### 4.3. New Architecture (0.76+)
- **Fabric 렌더러** — 동기적 렌더링, 더 나은 스크롤 성능
- **TurboModules** — 지연 로딩, 메모리 사용량 감소
- **JSI (JavaScript Interface)** — 브릿지 없는 직접 통신, 낮은 오버헤드

### 4.4. 장기 지원
- React Native 0.73.x는 **EOL 접근 중** — 보안 패치 및 버그 수정 중단 예정
- 새 라이브러리 버전들이 점차 0.73 지원 중단

---

## 5. 버전업의 리스크

### 5.1. ML 파이프라인 호환성 (🔴 Critical)
VisionCamera + TFLite + worklets + resize-plugin 조합이 New Architecture에서 안정적인지 **검증 부족**.
C++ linking 구조가 0.76에서 변경되어 빌드 실패 가능성 있음.

### 5.2. 기기 지원 범위 축소 (🟡 Medium)
- **Android**: minSdk 23 → 24 (Android 7.0 Nougat 이상만 지원)
  - Android 6.0 기기 탈락 (2015년 출시 기기)
- **iOS**: 최소 13.4 → 15.1
  - iPhone 6s/SE 1세대에서 iOS 15.1 지원 가능하나, 일부 구형 iPad 탈락

### 5.3. React 19 메이저 업그레이드 (🟡 Medium, 0.76+)
- `react-test-renderer` 제거
- `forwardRef` API 변경
- Context API 변경사항
- 웹 컴포넌트 (packages/web)도 동시 업그레이드 필요

### 5.4. 작업량 (🟡 Medium)
- 네이티브 코드 수정: SoLoader, 빌드 설정
- 모든 네이티브 의존성 버전 업데이트
- 전체 기능 회귀 테스트
- WebView 하이브리드 아키텍처 동작 검증

---

## 6. 권장 전략

### 6.1. 단기 (현재): 0.73.6 유지 ✅

**근거:**
- `useLegacyPackaging + NDK r27c + CMake 16KB flag` 조합으로 **Google Play 16KB 정책 충족**
- 안정적이고 검증된 프로덕션 환경
- Play Store v1.6~v1.7 릴리즈 안정성 우선

**현재 상태로 가능한 것:**
- Play Store 배포 ✅
- 16KB 페이지 크기 대응 ✅ (workaround)
- 모든 기능 정상 동작 ✅

---

### 6.2. 중기 (3~6개월): 0.75까지 단계적 업그레이드 (선택)

```
0.73.6 → 0.74 → 0.75
```

**이점:**
- Breaking change 최소화 (minSdk 23 유지, New Arch 강제 없음)
- Auto-linking 빌드 속도 대폭 향상
- React 18.3 (마이너 업데이트만)

**작업 범위:**
- `package.json` 의존성 버전 업데이트
- `@react-native/metro-config`, CLI 패키지 버전 매칭
- 전체 빌드 & 기능 테스트

**예상 소요:** 1~2일 (테스트 포함)

---

### 6.3. 장기 (6~12개월): 0.76+ New Architecture 전환

**전환 조건 체크리스트:**
- [ ] 사용자 기기 분포 분석 → minSdk 24 / iOS 15.1 수용 가능한지 확인
- [ ] VisionCamera 4.x가 0.76에서 안정 릴리즈 확인
- [ ] react-native-fast-tflite New Arch 지원 확인
- [ ] react-native-worklets-core 0.76 호환 확인
- [ ] React 19 + packages/web 동시 업그레이드 계획 수립

**전환 시 기대 효과:**
- `useLegacyPackaging` 완전 제거 → 설치 크기 최적화
- 네이티브 16KB 정렬 → workaround 제거
- Fabric + TurboModules 성능 이점
- 장기 보안 패치 및 커뮤니티 지원

---

## 7. 버전별 마이그레이션 체크리스트

### 0.73.6 → 0.74

- [ ] `react-native` 0.73.6 → 0.74.x
- [ ] `@react-native/metro-config` 0.73.5 → 0.74.x
- [ ] `@react-native-community/cli` 12.3.6 → 13.x
- [ ] `@react-native-community/cli-platform-android` 12.3.6 → 13.x
- [ ] `metro-react-native-babel-preset` 0.77.0 → 0.74 호환 버전 확인
- [ ] Flipper 관련 코드 완전 제거 확인 (이미 주석 처리됨)
- [ ] Android 빌드 테스트
- [ ] iOS 빌드 테스트
- [ ] WebView 브릿지 동작 테스트
- [ ] 카메라/ML 기능 테스트
- [ ] 채팅 기능 테스트

### 0.74 → 0.75

- [ ] `react-native` 0.74.x → 0.75.x
- [ ] `react` 18.2.0 → 18.3.1
- [ ] `react-test-renderer` 18.2.0 → 18.3.1
- [ ] CLI 패키지 버전 매칭
- [ ] 전체 빌드 & 기능 테스트

### 0.75 → 0.76 (Major)

- [ ] `react-native` 0.75.x → 0.76.x
- [ ] `react` 18.3.x → 19.0.x
- [ ] `react-test-renderer` 제거 → `@testing-library/react-native` 전환
- [ ] `minSdkVersion` 23 → 24 (`build.gradle`)
- [ ] `SoLoader.init()` 변경 (`MainApplication.kt`)
- [ ] `useLegacyPackaging = true` 제거 (`app/build.gradle`)
- [ ] `newArchEnabled` 설정 결정 (true/false)
- [ ] `@react-native-community/cli` devDeps 명시적 추가
- [ ] 모든 네이티브 의존성 호환성 검증
- [ ] VisionCamera + worklets + resize-plugin 빌드 테스트
- [ ] react-native-fast-tflite New Arch 테스트
- [ ] react-native-fs → `@dr.pogodin/react-native-fs` 전환 고려
- [ ] packages/web React 19 동시 업그레이드
- [ ] 전체 회귀 테스트 (WebView, 카메라, ML, 채팅, 결제)

---

## 8. 참고 자료

- [React Native 0.74 Changelog](https://reactnative.dev/blog/2024/04/22/release-0.74)
- [React Native 0.75 Changelog](https://reactnative.dev/blog/2024/08/12/release-0.75)
- [React Native 0.76 — New Architecture by default](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture)
- [React Native 0.77 Changelog](https://reactnative.dev/blog/2025/01/21/release-0.77)
- [New Architecture Migration Guide](https://reactnative.dev/docs/new-architecture-intro)
- [16KB Page Size Support](https://developer.android.com/guide/practices/page-sizes)
