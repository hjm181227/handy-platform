# 커스텀 제작 시스템 분석과 개선 계획

작성: 2026-08-12 · 코드 실사 기준 (server routes/models, web hooks/components, 채팅 저장소)

## 1. 현재 구현도

### 데이터 모델 (handy-app-server)

```
CustomOrderRequest (customOrderRequest 컬렉션)
├─ visibility: 'private'(판매자 지정 1:1) | 'public'(전체 공개 1:N)
├─ specifications: shape, length, sizes(양손 10손가락, string), desiredColor,
│                  desiredDate, designNotes, referenceImages[]
├─ quotation: { price, processingDays, sellerNotes, images }   ← 1:1용 임베디드 견적
├─ status: pending → quoted → approved → in_production → completed
│          (rejected / cancelled)
└─ 연결: orderUuid, customProductUuid, quoteUuid

Quote (1:N 공개 주문용 견적, 별도 컬렉션)
├─ customRequestUuid 참조, sellerUuid
├─ price, processingDays, sellerNotes, images, expiresAt
└─ status: pending → accepted / rejected / expired
```

### 흐름 (web + 채팅 결합)

1. 구매자가 주문서 작성 (`POST /api/custom-orders`) — 판매자 지정 시 private, 미지정 시 public
2. **주문서가 채팅으로 전달됨** — `sendCustomOrderToChat()`: 채팅방 ensure → `messageType: 'custom_order'` + `metadata.customOrderId` 메시지 전송
3. 판매자가 **채팅 화면의 QuoteFormModal**로 견적 작성 → `sendQuoteToChat()`: `metadata.quote` 메시지
4. 구매자가 채팅에서 견적 확인 → 승인(`/quotes/:uuid/accept` 또는 `/custom-orders/:uuid/approve`)
5. 승인 → 체크아웃 초기화(`quoteUuid` 재진입 지원) → 결제 → `in_production`

### 채팅 서버 (Handy_Chat_Ricecake)

- NestJS + Socket.IO + MongoDB(+Redis 어댑터), FCM 푸시, 미확인 카운트 실시간 emit
- REST: `/rooms/ensure`, `/messages`, `/chat/unread-total` / WS: join/leave/presence/메시지
- 배포 문서 기준 별도 EC2(t3.medium ~$30) + ElastiCache(~$15) + Mongo 구성
- **2026-08-12 실측: chat.h-andy.com 타임아웃 (다운)**. 스테이징 챗도 꺼져 있음

## 2. 발견된 문제

### P0 — 흐름을 끊는 것

1. **수량 개념 부재**: `specifications`에 수량 필드가 없다. 견적(`price`)도 "1세트" 전제.
   같은 디자인 3세트 주문 불가, 단가/총액 구분 없음. (웹 UI 전체 grep으로 확인)
2. **채팅 강결합 + 챗 다운 = 커스텀 주문 마비**: 주문서·견적서의 유일한 전달 채널이
   채팅 메시지다. 지금처럼 챗 서버가 죽으면 판매자는 새 주문을 알 방법이 없다
   (주문서 생성은 되지만 전달 실패를 "부분 성공"으로 삼킴). 입점 시스템에 구축한
   인앱 알림함·FCM과 미연결.
3. **프로덕션 챗 서버 현재 다운** — 위 2번이 이론이 아니라 현재 상태다. 웹은 페이지
   로드마다 `/chat/unread-total` 타임아웃을 기다린다 (콘솔 오류 + 지연).

### P1 — 구조 부채

4. **견적 이중 구조**: 1:1은 `CustomOrderRequest.quotation`(임베디드), 1:N은 `Quote`
   컬렉션 — 같은 개념이 두 곳에. 검증·만료·이력 관리가 갈라진다. `Quote`로 단일화 필요.
5. **사이즈가 자유 문자열**: `sizes.left.thumb: string` — 단위(mm/호수) 불명, 검증 없음.
   다음 작업(AR 측정 연동)의 입력이 되려면 수치+단위 표준화가 선행돼야 한다.
6. 상태 변화(견적 발급·승인·제작 시작·완료)에 대한 인앱/푸시 알림 부재 — 채팅 메시지가
   유일한 통지 수단.

## 3. 개선 계획 (제안)

### A. 수량 도입 (작음, 독립 배포 가능)

- `specifications.quantity: number` (기본 1, 세트 단위) 추가
- `Quote`에 `unitPrice`/`totalPrice` 분리 (기존 `price`는 totalPrice로 해석)
- 체크아웃 변환 시 quantity 반영, 웹 주문서 폼에 수량 선택 UI
- 기존 데이터는 quantity=1로 해석 (마이그레이션 불필요)

### B. 채팅에서 핵심 이벤트 분리 (비용 0, 챗 다운 내성)

주문서 접수 / 견적 발급 / 승인·거절 / 제작 상태 변경을 **메인 서버의 알림함 +
FCM**으로 전달한다 (입점 신청 알림에 만든 인프라 재사용). 판매자 센터·마이페이지에
주문서/견적 목록 화면을 1급 진입점으로 승격.

→ 채팅은 "협의가 필요할 때 여는 부가 채널"로 강등. **챗 서버가 죽어도 커스텀 주문
흐름이 완결된다.** 이것이 저비용 재가동의 전제 조건이다.

### C. 채팅 저비용 재가동 (B 이후)

| 옵션 | 월 비용 | 판단 |
|---|---|---|
| 기존: 전용 EC2 + ElastiCache + Mongo | ~$45+ | 사용량 대비 과함 (이래서 껐던 것) |
| ~~동거: 메인 EC2에 컨테이너 추가~~ | ~$0 | ❌ 철회 — 메인 프로덕션 EC2는 Spot+Blue-Green이라 인스턴스가 배포마다 교체됨. 수동 컨테이너는 소멸한다 |
| **전용 t4g.micro + MVP compose** | **~$7** | ✅ 권장. Redis 제거, Mongo 컨테이너 동거, Caddy TLS. 상세: Handy_Chat_Ricecake `docs/deployment/LOW_COST_REVIVAL.md` |
| Serverless 재작성 (APIGW WS/Lambda, Ably 등) | 종량제 | 재작성 비용 큼 — 트래픽 생기면 재검토 |
| 야간 자동 정지(sleep) | 절반 수준 | $7 구성에서는 실익 없음 |

구현 요점:
- `docker-compose.unified.yml`(이미 존재)을 기반으로 메인 서버 EC2에 chat 컨테이너 동거
- MONGO_URI를 메인 DB(스테이징 Railway / 프로덕션 Atlas)의 `chat` 데이터베이스로
- Redis 미사용 모드 (Socket.IO 단일 인스턴스), FCM은 유지
- 웹에 **서킷브레이커**: `/chat/unread-total` 1회 실패 시 세션 동안 채팅 기능 숨김
  (현재는 페이지마다 타임아웃 대기 — 챗이 꺼져 있어도 UX가 느려짐)

### D. 다음 작업(AR 측정)과의 접점

- `sizes`를 `{ widthMm: number, lengthMm: number }` 구조로 표준화 (기존 문자열은
  파싱 마이그레이션 or 병기)
- AR 측정 결과 → 주문서 자동 입력 → 판매자 견적 정확도 상승이 목표 경로
- 측정 정확도 작업 전에 이 스키마 정리를 하면 이중 작업을 피한다

## 권장 실행 순서

1. **B의 알림 분리** — 챗 다운 내성 확보 (지금 프로덕션이 다운 상태라 최우선)
2. **A 수량 도입** — 작고 독립적
3. **C 동거 배포** — 챗 재가동 (비용 ~0)
4. **D 사이즈 스키마 표준화** — AR 작업의 선행 조건
5. P1 4번(견적 단일화)은 2~4와 병행 가능
