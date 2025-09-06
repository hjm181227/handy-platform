# 🛒 구매 플로우 구현을 위한 API 요구사항

## 📋 개요
**작성일**: 2025-08-25  
**요청자**: 프론트엔드 개발팀  
**목적**: Milestone 2-6 구매 플로우 완성을 위한 API 스펙 요청

---

## 🎯 우선순위별 API 요구사항

### 🚨 **HIGH 우선순위** - Milestone 2 (장바구니 기능) 

#### 1. 장바구니 조회 API 검증
**현재 상태**: 구현되어 있지만 응답 형태 확인 필요

```typescript
GET /api/cart
Authorization: Bearer {token}

// 현재 예상 응답
{
  "success": true,
  "data": {
    "cart": {
      "id": "cart-123",
      "user": "user-456", 
      "items": [
        {
          "product": {
            "productId": "1",
            "name": "Product Name",
            "mainImageUrl": "...",
            "brand": "...",
            "price": 19000,
            "salePrice": 14250
          },
          "quantity": 2,
          "options": {
            "nailShape": "ALMOND",
            "nailLength": "SHORT"  
          },
          "price": 14250,      // 옵션 적용된 개별 가격
          "subtotal": 28500    // price * quantity
        }
      ],
      "totals": {
        "subtotal": 28500,           // 상품 금액 합계
        "shippingCost": 3000,        // 배송비
        "tax": 2850,                 // 세금
        "total": 34350,              // 최종 금액
        "itemCount": 2,              // 총 아이템 수
        "freeShippingRemaining": 0   // 무료배송까지 남은 금액
      },
      "updatedAt": "2025-08-25T10:00:00Z"
    }
  }
}
```

**요청사항**:
- [ ] 위 응답 구조 확인 및 누락된 필드 추가
- [ ] `cart.totals` 계산 로직 구현 (특히 `freeShippingRemaining`)
- [ ] 빈 장바구니일 때 응답 확인
- [ ] 제작 수량 기반 가용성 확인 로직 추가

#### 2. 장바구니 수량 업데이트 API 개선
**현재 상태**: 기본 구조 있음

```typescript
PUT /api/cart/items/{productId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "quantity": 3,
  "options": {
    "nailShape": "ALMOND", 
    "nailLength": "SHORT"
  }
}

// 응답: 업데이트된 전체 장바구니 반환
{
  "success": true,
  "data": {
    "cart": { /* 전체 장바구니 객체 */ }
  }
}
```

**요청사항**:
- [ ] 동일한 상품 + 다른 옵션 조합 처리 로직
- [ ] **제작 가능 수량 부족 시 에러 응답** (재고 개념 대신)
- [ ] 판매자별 제작 한도 확인 및 안내
- [ ] 제작 기간(`processingDays`) 기반 예상 배송일 계산

#### 3. 장바구니 전체 삭제 API
**현재 상태**: 구현되어 있음

```typescript
DELETE /api/cart
Authorization: Bearer {token}

{
  "success": true,
  "message": "장바구니가 비워졌습니다"
}
```

---

### 🟡 **MEDIUM 우선순위** - Milestone 3 (체크아웃/주문)

#### 4. 주문 생성 API 스펙 확인
**현재 상태**: 기본 구조 있으나 세부 스펙 확인 필요

```typescript
POST /api/orders
Content-Type: application/json
Authorization: Bearer {token}

{
  "useCart": true,                    // 장바구니 상품으로 주문
  "shippingAddress": {
    "name": "홍길동",
    "recipient": "홍길동", 
    "phone": "010-1234-5678",
    "address": {
      "street": "서울시 강남구 테헤란로 123",
      "city": "서울",
      "state": "서울", 
      "zipCode": "06234",
      "country": "KR"
    }
  },
  "paymentMethod": {
    "type": "credit_card",            // credit_card, bank_transfer, etc
    "provider": "kakao_pay"           // kakao_pay, naver_pay, etc
  },
  "shippingMethod": "standard",       // standard, express, pickup
  "couponId": "coupon-123",          // 할인 쿠폰 (옵션)
  "pointsToUse": 5000,               // 사용할 포인트 (옵션)
  "notes": "문 앞에 놓아주세요"         // 배송 메모 (옵션)
}
```

**요청사항**:
- [ ] 주문 생성 시 재고 차감 원자성 보장
- [ ] 쿠폰/포인트 적용 로직 구현
- [ ] 결제 정보와 주문 정보 분리 처리

#### 5. 배송지 관리 API
**현재 상태**: 미구현으로 추정

```typescript
// 배송지 목록 조회
GET /api/shipping-addresses
Authorization: Bearer {token}

{
  "success": true,
  "data": {
    "addresses": [
      {
        "id": "addr-123",
        "name": "집",
        "recipient": "홍길동",
        "phone": "010-1234-5678", 
        "address": { /* Address 객체 */ },
        "isDefault": true,
        "createdAt": "2025-08-20T00:00:00Z"
      }
    ]
  }
}

// 배송지 추가/수정
POST /api/shipping-addresses
PUT /api/shipping-addresses/{id}
```

**요청사항**:
- [ ] 배송지 CRUD API 구현
- [ ] 기본 배송지 설정 기능
- [ ] 배송지 유효성 검증 (우편번호, 주소 형식)

---

### 🟢 **LOW 우선순위** - Milestone 4-5 (결제/주문관리)

#### 6. 결제 처리 API
**현재 상태**: 기본 구조 있으나 PG 연동 필요

```typescript
// 결제 초기화
POST /api/payments/initialize
{
  "orderId": "order-123",
  "paymentMethod": {
    "type": "credit_card",
    "provider": "kakao_pay"
  },
  "amount": 34350,
  "currency": "KRW"
}

// 결제 확인
POST /api/payments/confirm
{
  "paymentId": "payment-456", 
  "transactionId": "txn-789",
  // PG사별 추가 확인 데이터
}
```

**요청사항**:
- [ ] 카카오페이, 네이버페이, 토스페이 PG 연동
- [ ] 결제 실패 시 자동 롤백 로직
- [ ] 중복 결제 방지 메커니즘

#### 7. 주문 추적 API 개선
**현재 상태**: 기본 구조 있음

```typescript
GET /api/orders/{id}/track
Authorization: Bearer {token}

{
  "success": true,
  "data": {
    "orderNumber": "ORD-2025082501",
    "orderStatus": "shipped",
    "shipping": {
      "status": "in_transit", 
      "progress": 60,
      "carrier": {
        "name": "CJ대한통운",
        "code": "cj"
      },
      "tracking": {
        "number": "123456789012",
        "url": "https://www.cjlogistics.com/track?num=123456789012",
        "history": [
          {
            "status": "picked_up",
            "location": "서울물류센터", 
            "description": "상품이 출고되었습니다",
            "timestamp": "2025-08-25T09:00:00Z"
          }
        ]
      },
      "schedule": {
        "estimatedDelivery": "2025-08-26T18:00:00Z"
      }
    }
  }
}
```

**요청사항**:
- [ ] 택배사 API 연동 (CJ대한통운, 로젠택배, 한진택배)
- [ ] 배송 상태 자동 업데이트 배치 작업
- [ ] 배송 완료 시 자동 주문 상태 변경

---

## 🔧 공통 요구사항

### 1. 에러 처리 표준화
모든 API에서 일관된 에러 응답 형태:

```typescript
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "재고가 부족합니다",
    "details": {
      "productId": "123",
      "requestedQuantity": 5,
      "availableQuantity": 2
    }
  }
}
```

**주요 에러 코드 정의 필요**:
- `INSUFFICIENT_STOCK`: 재고 부족
- `INVALID_COUPON`: 쿠폰 사용 불가
- `PAYMENT_FAILED`: 결제 실패  
- `CART_ITEM_NOT_FOUND`: 장바구니 아이템 없음
- `SHIPPING_ADDRESS_INVALID`: 배송지 정보 오류

### 2. 인증 및 권한
- 모든 장바구니/주문 API는 Bearer 토큰 인증 필수
- 타인의 장바구니/주문 접근 방지

### 3. 성능 최적화
- 장바구니 조회 시 불필요한 상품 정보 최소화
- 주문 목록 조회 시 페이지네이션 필수
- 자주 조회되는 데이터 캐싱 고려

---

## 📅 구현 일정 요청

| Milestone | API 요구사항 | 요청 완료일 | 비고 |
|-----------|-------------|------------|------|
| Milestone 2 | 장바구니 관련 API (1-3번) | **8/27 (화)** | 🚨 긴급 |
| Milestone 3 | 주문/배송지 API (4-5번) | **8/29 (목)** | 체크아웃 기능 |
| Milestone 4-5 | 결제/추적 API (6-7번) | **9/2 (월)** | 결제 시스템 |

---

## 🧪 테스트 시나리오

### 엔드 투 엔드 구매 플로우 테스트
하나의 계정으로 전체 구매 경험을 단계별로 테스트할 예정입니다:

#### **Phase 1: 장바구니 기능 테스트**
1. **빈 장바구니 상태**
   - 빈 장바구니 UI 표시 확인
   - "장바구니가 비어있습니다" 메시지 확인

2. **상품 담기 테스트**
   - 상품 상세페이지에서 옵션 선택 후 장바구니 담기
   - 다양한 옵션 조합으로 동일 상품 여러 개 담기
   - 서로 다른 상품 여러 개 담기

3. **장바구니 관리 테스트**
   - 수량 변경 (1개 → 5개 → 2개)
   - 개별 상품 삭제
   - 전체 장바구니 비우기

#### **Phase 2: 체크아웃 기능 테스트**
1. **배송지 관리**
   - 새 배송지 추가
   - 기본 배송지 설정
   - 배송지 수정/삭제

2. **주문 생성**
   - 장바구니에서 주문 생성
   - 배송지 선택
   - 결제 수단 선택

#### **Phase 3: 결제 및 주문 관리 테스트**
1. **결제 처리**
   - 테스트 결제 진행 (카드/계좌이체)
   - 결제 성공/실패 시나리오
   - 결제 취소 테스트

2. **주문 추적**
   - 주문 완료 후 상태 확인
   - 배송 추적 정보 확인
   - 주문 내역 조회

#### **Edge Case 테스트**
1. **제작 수량 관련 에러 처리**
   - 제작 가능 수량 초과 주문 시도
   - 판매자별 일일/주간 제작 한도 확인
   - 제작 기간이 긴 상품의 납기 안내
   - 동시 주문으로 인한 제작 수량 경합 상황

2. **네트워크 및 시스템 에러**
   - 네트워크 연결 끊김 상황
   - 결제 실패 시 주문 상태 확인
   - API 응답 지연 시 사용자 피드백

3. **쿠폰/포인트 시스템**
   - 할인 쿠폰 적용
   - 포인트 사용/적립
   - 무료배송 조건 확인

### 테스트 데이터 준비 요청
- **제작 수량 부족 상품**: 테스트용으로 제작 가능 수량이 적은 상품 (예: 2개만 제작 가능)
- **제작 기간 다양한 상품**: 
  - 당일 제작 가능 상품 (`processingDays: 0`)
  - 일반 제작 상품 (`processingDays: 1-2`)
  - 특별 주문 상품 (`processingDays: 5-7`)
- **할인 쿠폰**: 테스트용 20% 할인 쿠폰
- **테스트 결제**: 실제 결제 없이 성공/실패 시뮬레이션 가능한 설정

---

## 📞 커뮤니케이션

**담당자**: 프론트엔드 개발팀  
**연락처**: [개발팀 채널]  
**리뷰 요청**: API 스펙 완성 시 프론트엔드 팀 리뷰 후 구현 시작

**질문/건의사항이 있으시면 언제든 연락 주세요!** 🙌