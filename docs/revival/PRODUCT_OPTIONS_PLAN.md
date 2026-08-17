# 상품 옵션(변형) 관리 작업계획

작성: 2026-08-17 · 코드 실사 기준

## 목표

네일 팁의 본질인 **사이즈·쉐입 변형을 옵션별 재고·가격으로 관리**한다.
셀러는 옵션 조합(예: 아몬드/숏, 아몬드/미디움)마다 재고·추가금을 설정하고,
구매자는 상세에서 옵션을 선택해 품절 조합을 즉시 확인하며, 재고 차감·복원은
옵션(variant) 단위로 정확히 일어난다.

## 현황 (2026-08-17 실사)

**이미 있는 것 (재사용 대상):**
- `models/ProductOption.ts` — 옵션 정의(shape/length/size/color/material) +
  **ProductVariant**(SKU, optionCombination, priceModifier, stock, images, stats)
  모델이 완성도 있게 설계되어 있음. `generateVariantCombinations` 정적 메서드 존재.
- 장바구니·주문 아이템은 이미 `options: Record<string,string>`을 운반
  (CartContent가 JSON 비교로 동일 옵션 판별, OrderItem에도 옵션 저장됨).
- 상품 상세에 shape/length 선택 UI 존재 (단, 상품 고정값 표시용 — 재고 미연동).
- 재고 예약(StockReservation)·복원 흐름이 상품 단위로 동작 중.

**없는 것 (이번 작업 범위):**
- ProductOption/ProductVariant를 다루는 **라우트 전무**
  (`routes/orders.ts:321`에 "ProductVariant 모델 import 필요" 주석만 존재)
- 셀러 옵션 등록/재고 관리 UI, 구매자 옵션별 품절 표시
- 결제·취소 시 variant 단위 재고 차감/복원

## 설계 결정 (착수 전 확정 필요)

| # | 결정 사항 | 권고안 |
|---|---|---|
| D1 | 옵션 축 범위 | v1은 **shape × length 2축 고정** (기존 상세 UI·shared 상수 재사용). size/color는 v2 |
| D2 | 재고의 진실 원천 | variant 사용 상품은 `variant.stock` 합계 = `product.stockQuantity`(파생·캐시). 미사용 상품은 기존 그대로 — **옵트인 방식**이라 기존 상품 무영향 |
| D3 | 가격 방식 | `priceModifier`(±추가금) 유지. 최종가 = product.price + modifier |
| D4 | 품절 조합 노출 | 선택 UI에서 비활성(줄 긋기) + "품절" 라벨 |
| D5 | 기존 주문 호환 | OrderItem.options 문자열 그대로 유지, variant 매칭은 optionCombination 비교로 |

## 단계별 작업 (총 6~9일 규모)

### 1. 서버 — variant CRUD + 재고 (2~3일)
- `routes/sellerProducts.ts`에 추가:
  - `GET/PUT /api/seller/products/:id/options` — 옵션 축·값 정의
  - `GET/PUT /api/seller/products/:id/variants` — 조합별 재고·추가금 일괄 저장
    (generateVariantCombinations로 조합 생성 → 셀러 입력 병합)
- 상품 상세 API(`GET /api/products/:uuid`)에 `variants[]` 포함
  (조합, 재고>0 여부, finalPrice)
- **재고 차감 연동**: `PaymentFinalizationService.consumeOrDecrementStock` /
  `restoreConsumedStock`에서 아이템 options로 variant를 찾아 variant.stock 증감
  (variant 미사용 상품은 기존 경로 유지). `utils/checkoutHelper`의 재고 검증도 동일 분기.
- 트랜잭션 내 원자적 `$inc` + 음수 방지 조건(`stock: { $gte: qty }`).

### 2. shared (0.5일)
- SellerService: `getProductOptions/saveProductOptions/getVariants/saveVariants`
- 타입: ProductVariant, OptionDefinition (barrel export)

### 3. 셀러 UI (2일)
- 상품 등록/수정 폼(SellerPages)에 "옵션 관리" 섹션:
  - 옵션 사용 토글(옵트인) → shape/length 값 선택(기존 NAIL_SHAPES/NAIL_LENGTHS)
  - 조합 테이블: 조합 × [재고, 추가금, 판매여부] 편집, 일괄 재고 입력
- 상품 목록 재고 컬럼: variant 사용 시 합계+조합 수 표시

### 4. 구매자 UI (1.5일)
- 상품 상세(Detail.tsx): 기존 shape/length 선택을 variant와 연동 —
  품절 조합 비활성, 선택 시 최종가·잔여 재고 갱신, 품절 조합 장바구니 차단
- 장바구니/체크아웃: 옵션별 단가 반영 (finalPrice 전달 검증)

### 5. 검증 (1일)
- 서버: variant 재고 차감/복원 단위 테스트 (결제 확정·취소·반품 경로),
  동시 주문 시 음수 재고 방지 테스트
- 스테이징 E2E: 옵션 등록 → 구매 → 재고 감소 → 취소 → 복원 사이클

### 6. 마이그레이션
- **불필요** (옵트인 설계 — 기존 상품은 variant 없이 기존 재고 경로 유지).
- 기존 상품에 옵션을 도입하는 셀러는 UI에서 직접 활성화.

## 리스크

- 재고 이원화(variant.stock vs product.stockQuantity) 불일치 — D2의 파생 캐시를
  저장 시마다 재계산하고, 검증 스크립트 1개 추가로 방어.
- 앱(WebView) 영향: 웹 UI 변경이므로 앱은 자동 반영, 단 앱 내 캐시된 구버전
  화면과의 혼선은 낮음.
- 결제 경로 수정이 포함되므로 **스테이징 결제 검증 필수** 후 프로덕션 반영.

## 착수 조건

- 위 D1~D5 권고안 승인 (특히 D1 옵션 축, D3 가격 방식)
- 이 작업 동안 다른 결제 경로 변경 배포는 피할 것 (검증 간섭 방지)
