# Handy 제품 분석 1단계 구현 보고서

## 적용 범위

브랜치 `codex/product-analytics`에 웹과 React Native 앱의 Firebase Analytics 기반 이벤트 수집을 구현했다. 프로덕션 배포와 Firebase 콘솔 생성·변경은 하지 않았다.

- 웹 브라우저: Firebase Web SDK
- 모바일 앱: 웹뷰가 만든 동일 이벤트를 네이티브 브리지로 전달하고 React Native Firebase Analytics에서 기록
- 개발 환경: Firebase 프로덕션 속성으로 전송하지 않고 메모리·콘솔 어댑터 사용
- 프로덕션: Firebase 웹 환경변수가 모두 존재하고 사용자가 동의한 경우에만 초기화 및 전송
- 모바일: `firebase.json`에서 자동 수집·자동 화면 추적·광고 ID/SSAID/IDFV·광고 네트워크 등록을 기본 비활성화하고 명시 동의 후에만 수집 활성화

## 이벤트와 발생 조건

| 이벤트 | 발생 조건 | 포함 속성 예시 |
| --- | --- | --- |
| `product_viewed` | 상품 상세 조회가 완료된 최초 1회 | 상품 유형, 제작 방식, 유입 경로 |
| `product_liked` | 찜 추가 API 성공 | 기능, 유입 경로 |
| `cart_item_added` | 장바구니 추가 API 성공 | 수량, 상품 유형, 제작 방식 |
| `custom_request_started` | 상품/브랜드 주문제작 화면 진입 최초 1회 | 상품/브랜드 유입 구분 |
| `custom_request_submitted` | 주문제작 요청 API 성공 | 상품/브랜드 유입 구분 |
| `checkout_viewed` | 체크아웃 세션이 실제로 준비된 최초 1회 | 체크아웃 유형, 품목 수 |
| `purchase_started` | 결제 준비 API 성공 후 Toss 결제창 호출 직전 | 금액, 통화, 품목 수, 결제 제공자 |
| `purchase_completed` | 결제 승인 후 서버 주문의 결제 상태 확인 성공 | 금액, 통화, 품목 수, 주문 상태 |
| `seller_signup_started` | 기존 입점 신청이 없는 사용자가 신청 화면 진입 | 판매자 상태 |
| `seller_profile_completed` | 입점 신청 제출 API 성공 | 판매자 상태 |
| `seller_product_created` | 신규 상품 등록 API 성공 | 상품 유형, 제작 방식 |
| `seller_order_opened` | 판매자 주문 상세 API 성공 | 주문 상태 |
| `seller_order_fulfilled` | 판매자가 주문을 배송 완료 상태로 변경한 API 성공 | 주문 상태 |

‘첫 문의 수신’과 ‘첫 주문 수신’은 브라우저 화면 진입만으로 판정하면 실제 수신 시점과 중복 여부를 보장할 수 없다. 서버에서 판매자별 최초 상태 전환을 원자적으로 판정한 뒤 이벤트를 발행하는 후속 작업으로 남긴다.

## 개인정보와 동의

공통 스키마의 허용 목록을 통과한 속성만 SDK에 전달한다. 알 수 없는 키, 객체, 빈 문자열, 100자를 넘는 문자열, 유효하지 않은 숫자는 버린다.

전송하지 않는 데이터:

- 이름, 이메일, 전화번호, 배송지
- 고객별 손톱 사이즈와 주문제작 자유 입력
- 업로드 이미지와 이미지 URL
- 카드번호, 결제 키와 기타 결제 인증정보
- 상품 UUID, 주문 UUID, 판매자 UUID 등 원본 업무 식별자
- 원본 API 응답 및 주문 객체

로그인 사용자는 동의 후에만 내부 UUID를 Firebase 사용자 ID로 설정한다. 광고 저장소, 광고 사용자 데이터, 광고 개인화 동의는 항상 거부한다. 사용자는 `마이페이지 > 설정 > 서비스 사용 통계`에서 동의하거나 철회할 수 있다. 철회 즉시 새 이벤트 전송을 중단하고 Firebase 사용자 ID를 제거한다.

개인정보처리방침 한국어·영어·일본어 본문에 선택적 Firebase Analytics 처리 항목과 철회 경로를 추가했다. Sentry Replay의 `maskAllText: true`, `blockAllMedia: true` 설정은 변경하지 않았다.

## Firebase 콘솔과 배포 환경에서 해야 할 일

1. Firebase 프로젝트에서 Google Analytics를 활성화한다.
2. 웹 앱을 등록하고 아래 값을 프로덕션 배포 환경변수에 넣는다. 저장소나 브라우저 외부 문서에 실제 값을 적지 않는다.
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `VITE_APP_VERSION`, `VITE_BUILD_NUMBER`
3. Android 앱 `com.handyapp`을 등록하고 `google-services.json`을 `packages/mobile/android/app/`에 둔다. 이 파일은 Git에서 제외된다.
4. iOS 앱 `com.hermosear.handy`를 등록하고 `GoogleService-Info.plist`를 `packages/mobile/ios/`에 둔 뒤 Xcode의 앱 타깃에 포함한다. 이 파일도 Git에서 제외된다.
5. macOS에서 `cd packages/mobile/ios && pod install`을 실행해 `RNFBAnalytics`를 Pod lock과 워크스페이스에 반영하고 iOS 빌드를 확인한다.
6. Firebase DebugView에서 동의 전 이벤트가 없고, 동의 후 표의 이벤트와 허용 속성만 표시되며, 철회 후 새 이벤트가 멈추는지 확인한다. Android 디버그 기기에서는 `adb shell setprop debug.firebase.analytics.app com.handyapp`을 사용할 수 있다.
7. GA4 데이터 보존 기간, 내부 접근 권한, 데이터 공유 설정과 Google Signals/광고 개인화 기능을 회사 정책에 맞게 검토한다. 이 구현은 광고 동의를 보내지 않는다.

React Native Firebase의 opt-in 설정 방식은 [React Native Firebase Analytics 문서](https://rnfirebase.io/analytics/usage), 네이티브 수집 중지 방식은 [Firebase Analytics 수집 설정 문서](https://firebase.google.com/docs/analytics/android/configure-data-collection)를 기준으로 했다.

## 스토어 공개 항목 검토

출시 전 현재 앱의 전체 SDK와 실제 콘솔 설정을 기준으로 다시 확인한다. 이번 분석 기능으로 추가 검토할 가능성이 높은 항목은 다음과 같다.

- Apple App Privacy: `Identifiers > User ID`, `Identifiers > Device ID`, `Usage Data > Product Interaction`, 필요하면 `Other Usage Data`; 목적은 Analytics, 타사 광고 추적은 사용하지 않음. [Apple 데이터 유형 정의](https://developer.apple.com/go/?id=info-1)와 [Firebase Apple 플랫폼 공개 안내](https://firebase.google.com/docs/ios/app-store-data-collection)를 함께 확인한다.
- Google Play Data safety: `App activity > App interactions`, `Other actions`, `Device or other IDs`; 목적은 Analytics, 수집은 선택적이며 전송 중 암호화됨. Firebase를 서비스 제공자로 처리할 수 있는지는 실제 계약·설정에 맞춰 Play Console 문구를 결정한다. [Google Play Data safety 안내](https://support.google.com/googleplay/android-developer/answer/10787469)와 [Firebase Analytics 공개 안내](https://support.google.com/analytics/answer/11582702)를 확인한다.
- 개인정보처리방침과 양 스토어 공개 내용은 서로 일치해야 한다.

## 검증 결과

- 공용 분석 스키마 빌드: 통과
- 웹 TypeScript 검사: 통과
- 웹 프로덕션 번들: 통과. Firebase 환경변수가 없는 상태에서도 빌드되며 분석 SDK는 수집을 시작하지 않음
- 개인정보 경계 단위 테스트: 3개 통과
- React Native 자동 연결 검사: Android와 iOS 모두 `@react-native-firebase/analytics` 감지
- Firebase 모듈 버전: analytics/app/messaging 모두 `21.14.0`으로 일치
- 모바일 전체 TypeScript 검사: 기존 파일의 타입 오류들 때문에 실패했으나 새 `analyticsService.ts`에는 오류가 보고되지 않음
- 네이티브 실행 빌드: Firebase 설정 파일이 아직 없고 현재 환경이 Windows이므로 수행하지 않음

웹 번들에는 기존의 대형 청크 경고가 남아 있다. 의존성 감사 결과도 기존 트리에 15건(낮음 1, 보통 8, 높음 6)이 남아 있으며 강제 자동 수정은 적용하지 않았다.
