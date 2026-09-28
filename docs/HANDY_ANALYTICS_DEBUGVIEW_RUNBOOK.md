# Handy Firebase DebugView 검증 절차

작성 기준일: 2026-09-28

목표는 동의 전 무수집, 동의 후 허용 이벤트·속성만 전송, 철회 후 즉시 중지되는지를 웹·Android·iOS에서 같은 기준으로 확인하는 것이다. 프로덕션 결제나 유료 호출은 사용하지 않는다.

## 공통 준비

1. Firebase 콘솔에서 프로젝트와 각 스트림이 Handy 출시 앱과 일치하는지 확인한다.
2. 테스트 계정과 테스트 상품을 사용하고 이름·이메일·전화번호·주소·자유 입력·이미지·손톱 치수·결제정보를 테스트 이벤트 속성에 넣지 않는다.
3. Firebase Console의 `Analytics > DebugView`를 열고 검증할 기기 스트림을 선택한다.
4. 빌드 버전, 빌드 번호, 기기/브라우저, OS, 검증 시각, 동의 상태를 기록한다.

## 웹

1. 로컬 또는 별도 검증 환경에 Firebase 웹 변수 5개와 `VITE_APP_VERSION`, `VITE_BUILD_NUMBER`를 설정한다.
2. `VITE_ENVIRONMENT=development`, `VITE_ANALYTICS_DEBUG=true`로 실행한다. 프로덕션 빌드는 debug 값을 허용하지 않는다.
3. 공식 Google Analytics Debugger Chrome 확장을 켜고 페이지를 새로 고친다.
4. 브라우저 저장소에서 `handy.analytics.consent`를 제거한 새 상태로 시작한다.
5. 동의 전 상품 상세·장바구니를 열고 DebugView에 Handy 사용자 정의 이벤트가 나타나지 않는지 확인한다.
6. `마이페이지 > 설정 > 서비스 사용 통계`를 켠 뒤 상품 상세, 장바구니, 체크아웃 준비, 판매자 신청, HandyStudio 스토어 CTA를 차례로 실행한다.
7. DebugView에서 이벤트 이름과 허용 속성만 확인한다. 결제 성공은 PG 테스트/샌드박스가 준비된 경우에만 확인한다.
8. 동의를 끈 뒤 같은 행동을 반복해 새 이벤트가 나타나지 않는지 확인한다.

## Android

패키지명은 `com.handyapp`이다.

```bash
adb shell setprop debug.firebase.analytics.app com.handyapp
adb shell am force-stop com.handyapp
adb shell monkey -p com.handyapp 1
```

1. 앱 데이터가 초기화된 테스트 설치 또는 분석 동의 이력이 없는 계정으로 시작한다.
2. 동의 전 이벤트가 없음을 확인한다.
3. 설정에서 동의 후 핵심 퍼널을 실행하고 DebugView에서 이벤트를 확인한다.
4. 동의를 철회하고 사용자 ID가 제거되며 새 이벤트가 중단되는지 확인한다.
5. 검증 후 debug 속성을 반드시 해제한다.

```bash
adb shell setprop debug.firebase.analytics.app .none.
```

최종 출시 AAB 확인:

```bash
apkanalyzer manifest permissions app-release.aab
```

출력에 `com.google.android.gms.permission.AD_ID`, `android.permission.ACCESS_ADSERVICES_AD_ID`, `android.permission.ACCESS_ADSERVICES_ATTRIBUTION`이 없어야 한다. 사용하는 Android 빌드 도구에 따라 `bundletool`로 APK 세트를 만든 뒤 병합 매니페스트를 확인해도 된다.

## iOS

1. Xcode의 테스트 Scheme에서 `Run > Arguments Passed On Launch`에 `-FIRDebugEnabled`를 추가한다.
2. 앱을 삭제 후 재설치하거나 분석 동의 저장값을 제거한 테스트 상태로 실행한다.
3. 동의 전, 동의 후, 철회 후 순서로 웹/Android와 같은 퍼널을 검증한다.
4. 검증이 끝나면 `-FIRDebugEnabled`를 제거하고 한 번 `-FIRDebugDisabled`로 실행해 debug 모드를 해제한다.
5. Release Archive에는 debug launch argument가 포함되지 않았는지 확인한다.

## 기대 이벤트와 안전 속성

| 구간 | 기대 이벤트 |
|---|---|
| 상품 상세 | `product_viewed` |
| 장바구니 추가/조회 | `cart_item_added`, `cart_viewed` |
| 체크아웃/결제 시작 | `checkout_viewed`, `purchase_started` |
| 테스트 결제 완료 | `purchase_completed` |
| 판매자 신청 | `seller_signup_started`, `seller_profile_completed` |
| 디자인 도구 스토어 진입 | `design_tool_entered` |

허용 속성은 상품 유형, 제작 방식, 수량, 품목 수, 기능명, 진입 경로, 주문 상태, 앱 버전/빌드, 환경처럼 제한된 열거값과 숫자다. 원본 사용자·상품·주문·판매자 UUID, 이름, 연락처, 주소, 검색어, 자유 입력, 손톱 치수, 이미지 URL, 카드/결제 인증값이 보이면 출시를 중단하고 이벤트를 수정한다.

## 통과 기준

- 동의 전 사용자 정의 분석 이벤트 0건
- 동의 후 예상 이벤트가 각 행동에 맞게 1회 기록됨
- React Strict Mode나 WebView 브리지로 동일 화면 이벤트가 5초 안에 중복되지 않음
- 반복 장바구니 추가 같은 실제 반복 행동은 각각 기록됨
- 허용 목록 밖 속성과 개인정보가 없음
- 철회 후 새 이벤트가 없고 이후 로그인 사용자 ID가 설정되지 않음
- Android/iOS 광고 저장소·광고 사용자 데이터·광고 개인화 동의가 모두 거부 상태

DebugView 이벤트는 개발 검증용이며 일반 집계 보고서에 포함되지 않는다. 공식 절차는 [Firebase DebugView 문서](https://firebase.google.com/docs/analytics/debugview)를 따른다.
