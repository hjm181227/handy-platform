# 상품 옵션(변형) 관리 — 상세 작업계획 v2

작성: 2026-08-17 · 코드 실사 기준 (v1 계획을 심층 조사 후 전면 개정)

## 0. v1 계획 대비 달라진 점

심층 실사에서 두 가지 결정적 사실이 확인됐다:

1. **재고 트랜잭션 코어가 이미 variant를 완전 지원한다.**
   `services/StockReservationService.ts` — 예약(`reserveStockForCheckout`),
   복원(`restoreReservations`), 직접 차감 모두 `variantId` 분기가 구현되어 있고
   원자적 `$inc` + `stock: { $gte: qty }` 가드까지 갖춰져 있다. 체크아웃 세션
   아이템에 `variantId`를 채워주는 상류(resolution)가 없어서 죽은 코드였을 뿐이다.
   → **가장 위험하다고 본 결제 경로 작업의 대부분이 이미 끝나 있다.**
2. **현재 옵션 UI는 "주문 제작" 의미다.**
   상품은 대표 쉐입/길이 1개씩(`nailShape`/`nailLength`)을 갖고,
   `shapeCustomizable`/`lengthCustomizable`이 켜져 있으면 구매자가 **전체 쉐입/길이
   목록에서 자유 선택**한다 (Detail.tsx:686). 이 선택은 재고와 무관하게 장바구니
   `options`로 흘러가고, 생산능력(capacity) 검사만 거친다.
   → 옵션 재고를 "추가"하는 게 아니라, **판매 방식을 이원화**해야 앞뒤가 맞는다.

## 1. 제품 설계 — 판매 방식의 이원화

네일 팁 판매는 실제로 두 가지 방식이 섞여 있고, 현재 코드는 이를 구분하지 않는다:

| | 주문 제작 (made-to-order) | 기성 재고 (stocked) |
|---|---|---|
| 현재 상태 | ✅ 구현됨 (customizable 플래그 + 생산능력) | ❌ 없음 (이번 작업) |
| 재고 | 없음 — 생산능력이 제약 | **조합별 재고** (variant.stock) |
| 배송 | 제작 소요일(processingDays) 후 | 즉시 발송 |
| 구매자 표시 | "제작 N일 소요" | "재고 N개 · 바로 발송" |

**설계: `Product.fulfillmentMode: 'made_to_order' | 'stocked'`** (기본값
`made_to_order` = 기존 상품 동작 그대로 → 마이그레이션 불필요).

- `made_to_order`: 기존 customizable 흐름 유지. 변경 없음.
- `stocked`: 셀러가 제공 쉐입×길이 조합을 정의하고 조합별 재고·추가금 관리.
  구매자는 재고 있는 조합만 선택 가능.

이렇게 하면 "재고도 관리 안 되는데 아무 쉐입이나 고를 수 있는" 현재의 모호함이
구매자에게 명확한 두 경험으로 갈라진다.

## 2. UX 설계

### 2-1. 셀러 — 상품 등록/수정 폼 (SellerPages)

현재 폼의 "네일 정보" 섹션(대표 쉐입 select + customizable 체크박스 2개)을
**"판매 방식" 카드 선택**으로 교체:

```
판매 방식을 선택해주세요
┌─────────────────────────┐  ┌─────────────────────────┐
│ 📦 기성 재고 판매        │  │ 🛠 주문 제작              │
│ 만들어 둔 상품을 바로 발송 │  │ 주문 받은 후 제작해 발송   │
│ 옵션(쉐입·길이)별 재고 관리│  │ 쉐입·길이 커스텀 선택 가능 │
└─────────────────────────┘  └─────────────────────────┘
```

**기성 재고 선택 시 → 옵션·재고 매트릭스:**

```
제공하는 쉐입   [✓]라운드 [✓]아몬드 [ ]오벌 [✓]스퀘어 …
제공하는 길이   [✓]숏 [✓]미디움 [ ]롱

┌──────────────┬────────┬─────────┬──────┐
│ 조합 (6개 생성) │ 재고    │ 추가금   │ 판매  │
├──────────────┼────────┼─────────┼──────┤
│ 라운드 · 숏     │ [ 20 ] │ [    0] │ [✓] │
│ 라운드 · 미디움  │ [ 15 ] │ [    0] │ [✓] │
│ 아몬드 · 숏     │ [  0 ] │ [+1000] │ [✓] │  ← 재고 0 = 품절 표시
│ …            │        │         │      │
└──────────────┴────────┴─────────┴──────┘
[전체 재고 일괄 입력: __ 적용]   [추가금 일괄 입력: __ 적용]
총 재고: 47개 (조합 6개 중 판매 5개)
```

- 축을 체크하면 조합이 즉시 재생성되고, 기존 조합의 입력값은 보존
- 대표 쉐입/길이는 "첫 번째 판매 조합"으로 자동 설정 (검색 필터 호환 유지)
- SKU는 자동 생성 (`{productUuid 앞8}-{shape}-{length}`), 셀러에게 노출은 참고용
- 저장 시 조합별 upsert — 비활성화 조합은 삭제하지 않고 `isActive:false`
  (주문 이력이 참조할 수 있으므로)

**상품 목록**: 재고 컬럼을 "47 (5개 옵션)" 형태로, 재고 0 조합이 있으면 주황 뱃지.

### 2-2. 구매자 — 상품 상세 (Detail)

현재 쉐입/길이 버튼 UI 골격을 유지하되 의미를 명확화:

```
[기성 재고 상품]
쉐입   (라운드) (아몬드 +1,000원) (스퀘어)     ← 미제공 축 값은 아예 미표시
길이   (숏) (미디움) (̶롱̶ ̶품̶절̶)               ← 재고 0 조합은 취소선+비활성
─────────────────────────────
선택: 아몬드 · 미디움  |  23,000원  |  재고 15개 · 바로 발송

[주문 제작 상품 — 기존과 동일]
쉐입   (라운드) (아몬드) … 전체 선택 가능
안내:  🛠 주문 후 제작 — 약 7일 소요
```

- 조합 선택 시 최종가(기본가+추가금)·재고·발송 안내가 실시간 갱신
- 품절 조합 선택 시도 → 비활성이라 불가. 모든 조합 품절이면 구매 버튼 →
  "품절" (재입고 알림은 후속 과제로 훅 위치만 마련)
- 장바구니 담기 payload에 `variantUuid` 추가 (기존 options 문자열도 병행 유지 —
  주문서 표시·하위 호환용)

### 2-3. 장바구니·체크아웃

- 아이템 행에 옵션별 단가 표시 (추가금 반영된 단가)
- 체크아웃 세션 생성 시 서버가 variant를 재검증 (가격 위변조 방지 — 클라이언트
  가격을 믿지 않고 서버가 재계산, 기존 결제 검증 철학과 동일)
- 세션 아이템에 `variantId` 세팅 → **기존 예약/차감/복원 코드가 그대로 동작**

## 3. 데이터 모델

기존 모델 재사용, 최소 추가:

```
Product (추가 필드)
├─ fulfillmentMode: 'made_to_order' | 'stocked'   (default: made_to_order)
└─ stockQuantity: stocked 모드에서는 variant 합계의 파생 캐시
   (variant 저장 시마다 재계산. 목록/필터/기존 코드 호환용)

ProductVariant (기존 모델 그대로 사용)
├─ product(ObjectId), sku, optionCombination[{optionType, optionValue}]
├─ priceModifier(±원), stock, isActive
└─ + variantUuid 필드 추가 (API 노출용 — ObjectId 노출 금지 원칙 준수)

ProductOption (기존 모델) — v1에서는 셀러가 고른 축 값 목록 저장용으로만 사용
```

**재고 진실 원천 규칙**: `stocked` 상품의 재고 진실은 `variant.stock`.
`product.stockQuantity`는 파생 캐시이며 variant 쓰기 API에서만 재계산한다.
정합 검증 스크립트 1개(`scripts/verify-variant-stock.ts`)를 함께 만든다.

## 4. API 계약

### 셀러 (routes/sellerProducts.ts에 추가, requireVerifiedSeller)

```
GET  /api/seller/products/:productUuid/variants
  → { success, data: { fulfillmentMode, axes: { shapes[], lengths[] },
      variants: [{ variantUuid, optionCombination, stock, priceModifier, isActive }] } }

PUT  /api/seller/products/:productUuid/variants
  body: { fulfillmentMode, axes: { shapes[], lengths[] },
          variants: [{ optionCombination, stock(≥0), priceModifier, isActive }] }
  → 조합별 upsert + product.stockQuantity 재계산 + 대표 쉐입/길이 갱신
  검증: stocked면 판매 조합 ≥1, 축 값은 NAIL_SHAPES/NAIL_LENGTHS 내, 조합 중복 금지
```

### 구매자 (기존 상품 API 확장)

```
GET /api/products/:productUuid 응답에 추가:
  fulfillmentMode,
  variants: [{ variantUuid, optionCombination, isAvailable(재고>0 && isActive),
               stock(≤10일 때만 실수치, 그 외 '10+'), finalPrice }]
```

### 장바구니·체크아웃

```
POST /api/cart  body에 variantUuid? 추가 (stocked 상품이면 필수 — 서버 검증)
checkoutHelper: 세션 아이템 생성 시 variantUuid → variantId 해석 + 가격 재계산
  (utils/checkoutHelper.ts Path 2 directItem / Path 3 cart 두 경로 모두)
```

## 5. 재고 정합 — 통합 지점 체크리스트

| 경로 | 파일 | 상태 |
|---|---|---|
| 체크아웃 재고 예약 | StockReservationService.reserveStockForCheckout | ✅ variant 지원 기구현 |
| 예약 만료/취소 복원 | 〃 restoreReservations | ✅ 기구현 |
| 결제 확정 차감 확정 | PaymentFinalizationService.consumeOrDecrementStock | 🔎 variant 분기 확인·보강 |
| 결제 취소 복원 | PaymentCancellationService → restoreConsumedStock | 🔎 〃 |
| 반품(RMA) 승인 복원 | returns.ts → 전액취소 경로 재사용 | ✅ 위와 동일 경로 |
| **variant 해석 (신규)** | checkoutHelper 세션 생성부, cart.ts 담기 검증 | ❌ 이번 작업의 핵심 |

## 6. 구현 순서 (5~7일)

| 단계 | 내용 | 규모 |
|---|---|---|
| 1 | 모델 보강 (fulfillmentMode, variantUuid) + 셀러 variants GET/PUT + 캐시 재계산 + 검증 스크립트 | 1일 |
| 2 | variant 해석: cart 담기 검증 + checkoutHelper 두 경로 + consume/restore variant 분기 확인·보강 | 1~1.5일 |
| 3 | 재고 경로 단위 테스트 (동시 주문 음수 방지, 확정·취소·반품 복원, 캐시 정합) | 0.5~1일 |
| 4 | 셀러 UI: 판매 방식 카드 + 옵션·재고 매트릭스 (등록/수정 폼) + 상품 목록 재고 표시 | 1.5일 |
| 5 | 구매자 UI: Detail 조합 선택·품절·가격 갱신 + 장바구니 단가 표시 | 1일 |
| 6 | 스테이징 E2E: 옵션 등록→구매→재고 감소→취소→복원→반품 복원 사이클 + 배포 | 0.5~1일 |

단계 1~3(서버)과 4(셀러 UI 골격)는 병렬 가능. v1 견적(6~9일)보다 줄어든 이유는
재고 트랜잭션 코어가 기구현임을 확인했기 때문.

## 7. 테스트 계획

- **단위**: variant 예약 경합(2요청 동시, stock=1 → 1승 1패), 확정 후 취소 시
  정확히 1회 복원, stocked 상품의 variantUuid 누락 요청 400, 가격 재계산 검증
- **E2E(스테이징)**: 위 6단계 사이클 + made_to_order 상품이 기존과 동일 동작하는
  회귀 확인
- **프로덕션**: 옵션 상품 1개로 소액 실결제 → 재고 감소 확인 → 취소 → 복원 확인

## 8. 리스크와 완화

- **결제 경로 수정 리스크** → 기구현 코어 재사용으로 신규 코드 최소화, 3단계
  테스트 선행, 이 작업 배포 주간에는 다른 결제 변경 금지
- **캐시 불일치**(stockQuantity vs variant 합) → 쓰기 API 단일 지점 재계산 +
  검증 스크립트, 대시보드 재고 수치는 캐시 기준이므로 영향 국소적
- **기존 상품 회귀** → fulfillmentMode 기본값으로 옵트인. made_to_order 경로는
  코드 변경 없음(회귀 테스트로 확인)
- **앱(WebView)** → 웹 UI 변경이라 자동 반영. 단 앱 심사 불필요 확인

## 9. 확정할 결정 (승인 요청)

| # | 결정 | 권고 |
|---|---|---|
| D1 | 옵션 축 | **쉐입 × 길이 2축** (기존 상수·UI 재사용). 사이즈(호수)는 측정·커스텀 영역으로 분리 유지 |
| D2 | 판매 방식 | **fulfillmentMode 이원화** (기본 made_to_order = 기존 동작) |
| D3 | 가격 | **priceModifier ±추가금** (기본가 대비) |
| D4 | 재고 노출 | 10개 이하만 실수치 노출, 그 외 "10+" (품절 임박 긴장감 + 재고 정보 보호) |
| D5 | 품절 조합 | 비활성(취소선) + 전체 품절 시 구매 버튼 "품절" |
| D6 | 기존 상품 | 마이그레이션 없음 (옵트인). 셀러가 수정 폼에서 기성 재고로 전환 가능 |
| D7 | 선택 주문 연계 | 체크아웃 세션 아이템 필터(장바구니 "선택만 결제")를 2단계에서 함께 구현 (동일 파일 수정이라 비용 ~0.5일 절감) |
