# Handy 스토어 개인정보 제출 초안

작성 기준일: 2026-09-28

이 문서는 현재 저장소의 웹·모바일 기능과 Firebase Analytics, Firebase Cloud Messaging, Sentry 설정을 기준으로 작성한 **제출용 초안**이다. App Store Connect와 Play Console에 입력하기 직전에 실제 출시 바이너리의 SDK 목록, Firebase/GA4 콘솔 설정, 활성 기능을 다시 대조한다.

## 공통 결정

- 서비스 이용 분석은 기본값이 꺼져 있고 사용자가 별도로 켠 뒤에만 수집한다.
- 분석용 내부 계정 UUID는 이메일·전화번호가 아닌 서비스 내부 식별자이지만 회사가 계정과 연결할 수 있으므로 스토어 양식에서는 `사용자에게 연결됨`으로 본다.
- 광고 ID, 광고 개인화, 광고 네트워크 등록, 타사 광고 목적 추적은 사용하지 않는다.
- 모바일 앱은 Firebase Cloud Messaging을 사용하므로 분석 동의 여부와 관계없이 푸시 토큰과 앱 설치 식별자가 앱 기능 제공 목적으로 처리될 수 있다. 따라서 스토어의 `Device ID / Device or other IDs` 전체 항목을 단순히 선택 사항으로 표시하면 안 된다.
- 카드번호와 결제 인증정보는 Handy가 직접 저장하지 않는다. 주문·구독·환불 내역과 스토어 거래 ID는 처리한다.
- 이름·이메일·전화번호·배송지·사진·문의/채팅·손톱 측정값은 분석 이벤트에 넣지 않지만 서비스 기능 자체에서는 처리될 수 있으므로 전체 앱 공개 항목에는 포함한다.

## App Store Connect — App Privacy 초안

모든 항목의 `Tracking`은 **No**로 제출한다. 아래 표의 `Linked`는 계정 로그인 또는 주문·게시물·푸시 토큰과의 연결 가능성을 기준으로 보수적으로 작성했다.

| Apple 데이터 유형 | 수집 | Linked | 목적 | 필수/선택 및 근거 |
|---|---:|---:|---|---|
| Contact Info — Name | Yes | Yes | App Functionality | 계정·주문·배송 기능 |
| Contact Info — Email Address | Yes | Yes | App Functionality, Account Management | 로그인·계정 관리 |
| Contact Info — Phone Number | Yes | Yes | App Functionality | 배송/연락 정보, 사용자가 입력하는 경우 |
| Contact Info — Physical Address | Yes | Yes | App Functionality | 배송 주문을 하는 경우 |
| Purchases — Purchase History | Yes | Yes | App Functionality | 주문, 구독, 크레딧, 환불 기록 |
| User Content — Photos or Videos | Yes | Yes | App Functionality | 네일 측정, 리뷰, 게시물, 주문제작 이미지 업로드 시 |
| User Content — Other User Content | Yes | Yes | App Functionality | 문의·채팅·리뷰·주문제작 입력 시 |
| Identifiers — User ID | Yes | Yes | App Functionality, Analytics | 계정 UUID 및 동의 후 분석 사용자 ID |
| Identifiers — Device ID | Yes | Yes | App Functionality, Analytics | FCM 설치/푸시 식별자, 동의 후 Firebase 앱 인스턴스 식별자 |
| Usage Data — Product Interaction | Yes | Yes | Analytics | 분석 동의 후 상품·장바구니·결제·판매자·디자인 도구 이벤트 |
| Location — Coarse Location | Yes | Yes | Analytics | 분석 동의 후 Firebase가 마스킹된 IP에서 대략적 지역을 파생할 수 있음 |
| Diagnostics — Crash Data | Yes | No | App Functionality | Sentry가 활성화된 출시 환경에서 오류 진단 |
| Diagnostics — Performance Data / Other Diagnostic Data | 확인 후 Yes | No | App Functionality | 출시 바이너리의 Sentry·Firebase 종속 SDK가 실제 전송하는 항목을 Xcode Privacy Report로 확정 |
| Body — Hands | 확인 후 Yes | Yes | App Functionality | 손톱 사진·치수·손 구조 데이터가 서버로 전송되는 출시 기능이면 선언 |

App Store Connect 입력 전 확인:

1. Xcode에서 Release Archive를 만든 뒤 Privacy Report를 내보내 Firebase Messaging/Analytics와 포함 SDK의 병합 결과를 확인한다.
2. 실제 출시 버전에서 손톱 사진과 측정값이 서버로 전송되는지 확인하고 `Body > Hands` 제공 여부를 확정한다.
3. Sentry DSN과 오류 전송이 모바일 WebView 출시 환경에서도 활성인지 확인해 Diagnostics 항목을 확정한다.
4. Privacy Policy URL은 `https://www.h-andy.com/policy/privacy`로 입력하고 앱 내 설정 화면의 분석 철회 경로가 동작하는지 확인한다.

## Google Play Console — Data safety 초안

기본 응답:

- 사용자 데이터 수집: **Yes**
- 사용자 데이터 공유: **No** 초안. Google/Firebase와 Sentry가 Handy를 대신해 처리하는 서비스 제공자 요건을 충족한다는 계약·콘솔 설정을 출시 담당자가 최종 확인한다.
- 전송 중 암호화: **Yes**
- 계정 삭제 요청: 앱의 회원 탈퇴 및 공개된 문의 경로를 실제 Play Console URL/절차와 일치시킨다.

| Play 데이터 유형 | 수집 | 필수 여부 | 목적 | 공유 |
|---|---:|---|---|---:|
| Personal info — Name, Email address | Yes | 계정 이용 시 Required | App functionality, Account management | No 초안 |
| Personal info — Phone number, Address | Yes | 주문/배송 시 Optional | App functionality | No 초안 |
| Personal info — Other info | Yes | 측정 기능 사용 시 Optional | App functionality | No 초안 |
| Financial info — Purchase history | Yes | 구매 시 Required | App functionality | No 초안 |
| Financial info — User payment info | No | 해당 없음 | Apple/Google/PG가 직접 처리 | 해당 없음 |
| Photos and videos — Photos | Yes | 업로드 기능 사용 시 Optional | App functionality | No 초안 |
| Messages — Other in-app messages | Yes | 채팅/문의 사용 시 Optional | App functionality | No 초안 |
| App activity — App interactions | Yes | Optional | Analytics | No 초안 |
| Location — Approximate location | Yes | Optional | Analytics | No 초안 |
| Device or other IDs | Yes | Required | App functionality(FCM), Analytics(동의 후) | No 초안 |
| App info and performance — Crash logs | Yes | Required if Sentry enabled | App functionality | No 초안 |
| App info and performance — Diagnostics | 출시 SDK 확인 후 Yes | Sentry 설정에 따름 | App functionality | No 초안 |

Play Console 입력 전 확인:

1. Play SDK Index와 최종 AAB의 Data safety 안내를 확인한다.
2. 최종 병합 매니페스트에 `com.google.android.gms.permission.AD_ID`, `android.permission.ACCESS_ADSERVICES_AD_ID`, `android.permission.ACCESS_ADSERVICES_ATTRIBUTION`이 없는지 확인한다.
3. FCM은 분석 동의와 별개이므로 Device or other IDs를 `Optional`로만 표시하지 않는다.
4. Firebase/GA4의 광고 링크, Google Signals, 광고 개인화가 꺼져 있는지 확인한다.
5. Sentry, 결제사, 소셜 로그인, 이미지 저장소 등 전체 프로덕션 수탁자 계약과 실제 데이터 흐름을 함께 검토한다.

## 콘솔 설정 기록란

출시 담당자가 아래 항목을 확인하고 날짜·확인자를 남긴다.

| 항목 | 권장/예상 값 | 확인 값 | 확인일/확인자 |
|---|---|---|---|
| GA4 user/event data retention | 2개월 권장, 최대 14개월 고지 범위 내 |  |  |
| Reset user data on new activity | 운영 방침에 맞춰 확정 |  |  |
| Google Signals | Off |  |  |
| Ads personalization / Ads links | Off / 없음 |  |  |
| BigQuery export | 필요할 때만, 접근권한·보존기간 별도 검토 |  |  |
| Firebase Analytics 서비스 제공자 처리 | 계약·설정 확인 |  |  |
| Sentry 출시 활성 여부와 보존기간 | 실제 프로젝트 설정 확인 |  |  |
| App Store Xcode Privacy Report | Release Archive 기준 검토 |  |  |
| Play final AAB manifest / SDK Index | 출시 AAB 기준 검토 |  |  |

## 근거 문서

- [Apple App Privacy Details](https://developer.apple.com/go/?id=info-1)
- [Apple privacy manifest data-use 안내](https://developer.apple.com/documentation/bundleresources/describing-data-use-in-privacy-manifests)
- [Firebase의 Apple App Store 데이터 공개 안내](https://firebase.google.com/docs/ios/app-store-data-collection)
- [Google Play Data safety 작성 안내](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Firebase Analytics의 Play 데이터 공개 안내](https://support.google.com/analytics/answer/11582702)
