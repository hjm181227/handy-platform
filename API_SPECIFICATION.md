# API 연동 명세서 - Handy Platform 쇼핑몰

> **작성일**: 2024-08-18  
> **버전**: 1.0  
> **대상**: 백엔드 개발팀  
> **프로젝트**: React Native WebView 기반 하이브리드 쇼핑몰

## 📋 개요

현재 구현된 페이지/기능들에서 **실제 서버 API 연동이 필요한** 버튼, 페이지, 기능들을 분석하여 백엔드 개발을 위한 명세서입니다.

### 🏗️ 아키텍처
- **웹**: React + Vite (TypeScript)
- **모바일**: React Native + WebView
- **통신**: REST API + JWT 인증
- **이미지 업로드**: Presigned URL 방식

---

## 🔐 1. 인증 (Authentication) API

### 1.1 일반 로그인
- **엔드포인트**: `POST /api/auth/login`
- **파일 위치**: `packages/web/src/components/pages/LoginPage.tsx:34`
- **구현 상태**: ❌ 미구현
- **요청 데이터**:
  ```json
  {
    "email": "user@test.com",
    "password": "password123"
  }
  ```
- **응답 데이터**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "email": "user@test.com",
      "name": "홍길동",
      "phone": "010-1234-5678",
      "createdAt": "2024-08-18T00:00:00Z"
    }
  }
  ```

### 1.2 회원가입
- **엔드포인트**: `POST /api/auth/register`
- **파일 위치**: `packages/web/src/components/pages/SignupPage.tsx:76`
- **구현 상태**: ❌ 미구현
- **요청 데이터**:
  ```json
  {
    "email": "newuser@test.com",
    "password": "password123",
    "name": "테스트 사용자",
    "phone": "010-1234-5678"
  }
  ```
- **응답 데이터**: 로그인과 동일

### 1.3 로그아웃
- **엔드포인트**: `POST /api/auth/logout`
- **파일 위치**: 
  - `packages/web/src/components/layout/MainHeader.tsx:89`
  - `packages/mobile/src/components/WebViewBridge.tsx:113`
- **구현 상태**: ❌ 미구현
- **헤더**: `Authorization: Bearer {token}`
- **응답 데이터**:
  ```json
  {
    "success": true,
    "message": "로그아웃 완료"
  }
  ```

### 1.4 사용자 프로필 조회
- **엔드포인트**: `GET /api/auth/profile`
- **파일 위치**: `packages/web/src/components/layout/MainHeader.tsx:33`
- **구현 상태**: ❌ 미구현
- **헤더**: `Authorization: Bearer {token}`
- **응답 데이터**:
  ```json
  {
    "success": true,
    "user": {
      "id": "user123",
      "email": "user@test.com",
      "name": "홍길동",
      "phone": "010-1234-5678",
      "avatar": "https://example.com/avatar.jpg",
      "points": 2300,
      "membershipLevel": "SILVER"
    }
  }
  ```

### 1.5 소셜 로그인 (OAuth)

#### 1.5.1 카카오 로그인
- **엔드포인트**: `POST /api/auth/oauth/kakao`
- **파일 위치**: `packages/web/src/components/pages/LoginPage.tsx:56-64`
- **구현 상태**: ❌ 미구현
- **플로우**:
  1. 프론트엔드에서 카카오 OAuth 인증 코드 획득
  2. 백엔드로 인증 코드 전송
  3. 백엔드에서 카카오 서버와 토큰 교환
  4. 사용자 정보 조회 후 JWT 토큰 발급
- **요청 데이터**:
  ```json
  {
    "code": "kakao_auth_code",
    "redirect_uri": "https://yourapp.com/auth/kakao/callback"
  }
  ```
- **응답 데이터**: 일반 로그인과 동일

#### 1.5.2 애플 로그인
- **엔드포인트**: `POST /api/auth/oauth/apple`
- **구현 상태**: ❌ 미구현
- **요청 데이터**:
  ```json
  {
    "identity_token": "apple_identity_token",
    "authorization_code": "apple_auth_code",
    "user": {
      "name": {
        "firstName": "홍",
        "lastName": "길동"
      },
      "email": "user@privaterelay.appleid.com"
    }
  }
  ```

#### 1.5.3 구글 로그인
- **엔드포인트**: `POST /api/auth/oauth/google`
- **구현 상태**: ❌ 미구현
- **요청 데이터**:
  ```json
  {
    "access_token": "google_access_token"
  }
  ```

#### 1.5.4 네이버 로그인
- **엔드포인트**: `POST /api/auth/oauth/naver`
- **구현 상태**: ❌ 미구현
- **요청 데이터**:
  ```json
  {
    "access_token": "naver_access_token"
  }
  ```

### 1.6 OAuth 콜백 처리
- **엔드포인트**: `GET /api/auth/oauth/{provider}/callback`
- **지원 Provider**: `kakao`, `apple`, `google`, `naver`
- **구현 상태**: ❌ 미구현
- **용도**: 웹 브라우저에서 OAuth 인증 후 콜백 처리

---

## 📦 2. 상품 (Products) API

### 2.1 상품 목록 조회
- **엔드포인트**: `GET /api/products`
- **파일 위치**: `packages/web/src/App.tsx` (카테고리별, 검색별 상품 표시)
- **구현 상태**: ❌ 미구현
- **쿼리 파라미터**:
  ```
  page=1&limit=20&category=beauty&brand=handy&search=네일&sort=newest&minPrice=10000&maxPrice=50000
  ```
- **응답 데이터**:
  ```json
  {
    "success": true,
    "products": [
      {
        "id": "prod123",
        "name": "Glossy Almond Tip – Milk Beige",
        "brand": "Handy",
        "price": 29000,
        "salePrice": 23200,
        "discountRate": 20,
        "image": "https://example.com/product1.jpg",
        "images": ["url1.jpg", "url2.jpg"],
        "rating": 4.5,
        "reviewCount": 128,
        "category": "네일팁",
        "tags": ["신상", "베스트"],
        "stock": 50,
        "isNew": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "hasNext": true,
      "hasPrevious": false
    }
  }
  ```

### 2.2 상품 상세 조회
- **엔드포인트**: `GET /api/products/{id}`
- **파일 위치**: `packages/web/src/components/product/Detail.tsx:14`
- **구현 상태**: ❌ 미구현
- **응답 데이터**:
  ```json
  {
    "success": true,
    "product": {
      "id": "prod123",
      "name": "Glossy Almond Tip – Milk Beige",
      "brand": "Handy",
      "price": 29000,
      "salePrice": 23200,
      "discountRate": 20,
      "images": ["url1.jpg", "url2.jpg", "url3.jpg"],
      "description": "상품 상세 설명",
      "specifications": {
        "재질": "ABS, UV Gel",
        "텍스쳐": "매트/글로시",
        "구성": "네일 팁 세트, 접착 젤, 파일, 프렙 패드"
      },
      "options": {
        "shape": ["라운드", "아몬드", "스퀘어", "오벌", "코핀"],
        "length": ["Short", "Medium", "Long"]
      },
      "stock": 50,
      "rating": 4.5,
      "reviewCount": 128
    },
    "relatedProducts": [
      // 연관 상품 목록
    ]
  }
  ```

### 2.3 추천 상품 조회
- **엔드포인트**: `GET /api/products/featured`
- **파일 위치**: 홈페이지 추천 상품 섹션
- **구현 상태**: ❌ 미구현
- **쿼리 파라미터**: `limit=8`
- **응답 데이터**: 상품 목록과 동일 형식

### 2.4 카테고리 목록 조회
- **엔드포인트**: `GET /api/products/categories`
- **파일 위치**: 카테고리 드로어, 필터링
- **구현 상태**: ❌ 미구현
- **응답 데이터**:
  ```json
  {
    "success": true,
    "categories": [
      {
        "id": "cat1",
        "name": "네일팁",
        "slug": "nail-tips",
        "parentId": null,
        "children": [
          {
            "id": "cat1-1",
            "name": "숏 네일팁",
            "slug": "short-nail-tips",
            "parentId": "cat1"
          }
        ]
      }
    ]
  }
  ```

### 2.5 브랜드 목록 조회
- **엔드포인트**: `GET /api/products/brands`
- **구현 상태**: ❌ 미구현
- **응답 데이터**:
  ```json
  {
    "success": true,
    "brands": ["Handy", "OHORA", "DASHING DIVA", "KISS"]
  }
  ```

---

## 🛒 3. 장바구니 (Cart) API

### 3.1 장바구니 조회
- **엔드포인트**: `GET /api/cart`
- **헤더**: `Authorization: Bearer {token}`
- **파일 위치**: 장바구니 드로어
- **구현 상태**: ❌ 미구현
- **응답 데이터**:
  ```json
  {
    "success": true,
    "cart": {
      "id": "cart123",
      "items": [
        {
          "id": "item1",
          "productId": "prod123",
          "product": {
            "name": "Glossy Almond Tip",
            "image": "url.jpg",
            "price": 29000
          },
          "quantity": 2,
          "options": {
            "shape": "라운드",
            "length": "Short"
          },
          "subtotal": 58000
        }
      ],
      "totalItems": 3,
      "totalAmount": 87000,
      "discountAmount": 0,
      "finalAmount": 87000
    }
  }
  ```

### 3.2 장바구니 상품 추가
- **엔드포인트**: `POST /api/cart/items`
- **파일 위치**: `packages/web/src/components/product/Detail.tsx:179`
- **구현 상태**: ❌ 미구현
- **요청 데이터**:
  ```json
  {
    "productId": "prod123",
    "quantity": 2,
    "options": {
      "shape": "라운드",
      "length": "Short"
    }
  }
  ```
- **응답 데이터**: 장바구니 조회와 동일

### 3.3 장바구니 상품 수정
- **엔드포인트**: `PUT /api/cart/items/{productId}`
- **구현 상태**: ❌ 미구현
- **요청 데이터**:
  ```json
  {
    "quantity": 3
  }
  ```

### 3.4 장바구니 상품 삭제
- **엔드포인트**: `DELETE /api/cart/items/{productId}`
- **파일 위치**: 장바구니 드로어 삭제 버튼
- **구현 상태**: ❌ 미구현

### 3.5 장바구니 개수 조회
- **엔드포인트**: `GET /api/cart/count`
- **파일 위치**: `packages/web/src/components/layout/MainHeader.tsx`
- **구현 상태**: ❌ 미구현
- **응답 데이터**:
  ```json
  {
    "success": true,
    "count": 3
  }
  ```

---

## 📋 4. 주문 (Orders) API

### 4.1 주문 내역 조회
- **엔드포인트**: `GET /api/orders`
- **파일 위치**: `packages/web/src/components/pages/MyPages.tsx:41-89`
- **구현 상태**: ❌ 미구현
- **헤더**: `Authorization: Bearer {token}`
- **쿼리 파라미터**: `page=1&limit=10&status=shipping`
- **응답 데이터**:
  ```json
  {
    "success": true,
    "orders": [
      {
        "id": "order123",
        "orderNumber": "2024081801",
        "status": "shipping",
        "orderDate": "2024-08-18T10:00:00Z",
        "items": [
          {
            "productId": "prod123",
            "name": "Glossy Almond Tip – Milk Beige",
            "quantity": 2,
            "price": 29000,
            "subtotal": 58000
          }
        ],
        "totalAmount": 58000,
        "shippingFee": 0,
        "finalAmount": 58000,
        "shippingAddress": {
          "recipient": "홍길동",
          "phone": "010-1234-5678",
          "address": "서울시 강남구 테헤란로 123",
          "zipCode": "12345"
        },
        "tracking": {
          "courier": "한진택배",
          "trackingNumber": "123456789",
          "status": "배송중"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50
    }
  }
  ```

### 4.2 주문 상세 조회
- **엔드포인트**: `GET /api/orders/{id}`
- **파일 위치**: 주문 상세보기 버튼
- **구현 상태**: ❌ 미구현

### 4.3 주문 생성
- **엔드포인트**: `POST /api/orders`
- **파일 위치**: 
  - `packages/web/src/components/product/Detail.tsx:182` (바로구매)
  - `packages/mobile/src/components/WebViewBridge.tsx:144`
- **구현 상태**: ❌ 미구현
- **요청 데이터**:
  ```json
  {
    "items": [
      {
        "productId": "prod123",
        "quantity": 2,
        "options": {
          "shape": "라운드",
          "length": "Short"
        }
      }
    ],
    "shippingAddress": {
      "recipient": "홍길동",
      "phone": "010-1234-5678",
      "address": "서울시 강남구 테헤란로 123",
      "detailAddress": "456호",
      "zipCode": "12345"
    },
    "paymentMethod": {
      "type": "card",
      "cardNumber": "****-****-****-1234"
    },
    "notes": "문 앞에 두고 가세요"
  }
  ```

### 4.4 주문 취소
- **엔드포인트**: `PUT /api/orders/{id}/cancel`
- **파일 위치**: `packages/web/src/components/pages/MyPages.tsx:172-194`
- **구현 상태**: ❌ 미구현
- **요청 데이터**:
  ```json
  {
    "reason": "단순변심"
  }
  ```

### 4.5 배송 조회
- **엔드포인트**: `GET /api/orders/{id}/track`
- **파일 위치**: `packages/web/src/components/pages/MyPages.tsx:92-144`
- **구현 상태**: ❌ 미구현
- **응답 데이터**:
  ```json
  {
    "success": true,
    "tracking": {
      "orderNumber": "2024081801",
      "status": "배송중",
      "courier": "한진택배",
      "trackingNumber": "123456789",
      "estimatedDelivery": "2024-08-20",
      "statusHistory": [
        {
          "status": "주문접수",
          "timestamp": "2024-08-18T10:00:00Z",
          "location": "서울 물류센터"
        },
        {
          "status": "배송중",
          "timestamp": "2024-08-19T14:30:00Z",
          "location": "강남구 배송센터"
        }
      ]
    }
  }
  ```

---

## 💳 5. 결제 (Payments) API

### 5.1 결제 처리
- **엔드포인트**: `POST /api/payments/process/{orderId}`
- **파일 위치**: `packages/mobile/src/components/WebViewBridge.tsx:244-282`
- **구현 상태**: ❌ 미구현
- **지원 결제 수단**:
  - 신용카드/체크카드
  - 계좌이체
  - 휴대폰 결제
  - 카카오페이, 네이버페이, PAYCO

#### 5.1.1 카드 결제
- **요청 데이터**:
  ```json
  {
    "method": "card",
    "amount": 58000,
    "cardInfo": {
      "cardNumber": "1234-5678-9012-3456",
      "expiryMonth": "12",
      "expiryYear": "25",
      "cvv": "123",
      "cardholderName": "홍길동"
    }
  }
  ```

#### 5.1.2 간편결제 (카카오페이, 네이버페이 등)
- **요청 데이터**:
  ```json
  {
    "method": "kakaopay",
    "amount": 58000,
    "redirectUrl": "https://yourapp.com/payment/callback"
  }
  ```

### 5.2 결제 상태 조회
- **엔드포인트**: `GET /api/payments/status/{transactionId}`
- **구현 상태**: ❌ 미구현

### 5.3 결제수단 관리
- **엔드포인트**: `GET /api/user/payment-methods`
- **파일 위치**: `packages/web/src/components/pages/MyPages.tsx:319-357`
- **구현 상태**: ❌ 미구현
- **응답 데이터**:
  ```json
  {
    "success": true,
    "paymentMethods": [
      {
        "id": "pm1",
        "type": "card",
        "name": "KB국민카드",
        "maskedNumber": "**** **** **** 1234",
        "isDefault": true
      }
    ]
  }
  ```

---

## 📝 6. 리뷰 (Reviews) API

### 6.1 리뷰 작성
- **엔드포인트**: `POST /api/products/{productId}/reviews`
- **파일 위치**: `packages/web/src/components/pages/MyPages.tsx:197-231`
- **구현 상태**: ❌ 미구현
- **헤더**: `Authorization: Bearer {token}`
- **요청 데이터**:
  ```json
  {
    "rating": 5,
    "content": "색상도 예쁘고 품질이 좋아요!",
    "images": ["review1.jpg", "review2.jpg"]
  }
  ```

### 6.2 리뷰 수정
- **엔드포인트**: `PUT /api/products/{productId}/reviews/{reviewId}`
- **파일 위치**: 리뷰 수정 버튼
- **구현 상태**: ❌ 미구현

### 6.3 리뷰 삭제
- **엔드포인트**: `DELETE /api/products/{productId}/reviews/{reviewId}`
- **파일 위치**: 리뷰 삭제 버튼
- **구현 상태**: ❌ 미구현

### 6.4 사용자 리뷰 조회
- **엔드포인트**: `GET /api/user/reviews`
- **파일 위치**: `packages/web/src/components/pages/MyPages.tsx:197-231`
- **구현 상태**: ❌ 미구현
- **응답 데이터**:
  ```json
  {
    "success": true,
    "reviews": [
      {
        "id": "review1",
        "productId": "prod123",
        "product": {
          "name": "Glossy Almond Tip – Milk Beige",
          "image": "product1.jpg"
        },
        "rating": 5,
        "content": "색상도 예쁘고 품질이 좋아요!",
        "images": ["review1.jpg"],
        "createdAt": "2024-08-15T10:00:00Z"
      }
    ]
  }
  ```

---

## 🎁 7. 쿠폰/포인트 API

### 7.1 쿠폰 조회
- **엔드포인트**: `GET /api/user/coupons`
- **파일 위치**: `packages/web/src/components/pages/MyPages.tsx:234-268`
- **구현 상태**: ❌ 미구현
- **헤더**: `Authorization: Bearer {token}`
- **응답 데이터**:
  ```json
  {
    "success": true,
    "coupons": [
      {
        "id": "coupon1",
        "name": "신규회원 10% 할인",
        "type": "percent",
        "discountValue": 10,
        "minOrderAmount": 50000,
        "expiryDate": "2024-12-31T23:59:59Z",
        "isUsed": false
      }
    ]
  }
  ```

### 7.2 포인트 내역 조회
- **엔드포인트**: `GET /api/user/points`
- **파일 위치**: `packages/web/src/components/pages/MyPages.tsx:271-316`
- **구현 상태**: ❌ 미구현
- **헤더**: `Authorization: Bearer {token}`
- **응답 데이터**:
  ```json
  {
    "success": true,
    "currentPoints": 2300,
    "history": [
      {
        "id": "point1",
        "type": "earn",
        "amount": 230,
        "reason": "주문완료 적립",
        "date": "2024-08-15T10:00:00Z",
        "orderId": "order123"
      }
    ]
  }
  ```

### 7.3 포인트 사용
- **엔드포인트**: `POST /api/user/points/use`
- **구현 상태**: ❌ 미구현

---

## 📸 8. 이미지 업로드 API

### 8.1 Presigned URL 생성
- **엔드포인트**: `POST /api/upload/presigned-url`
- **파일 위치**: `packages/mobile/src/components/WebViewBridge.tsx:174-242`
- **구현 상태**: ❌ 미구현
- **요청 데이터**:
  ```json
  {
    "filename": "product-photo-123.jpg",
    "contentType": "image/jpeg"
  }
  ```
- **응답 데이터**:
  ```json
  {
    "success": true,
    "presignedUrl": "https://s3.amazonaws.com/bucket/...",
    "imageUrl": "https://cdn.example.com/images/product-photo-123.jpg",
    "expiresIn": "15m"
  }
  ```

### 8.2 업로드 설정 조회
- **엔드포인트**: `GET /api/upload/config`
- **구현 상태**: ❌ 미구현
- **응답 데이터**:
  ```json
  {
    "success": true,
    "allowedTypes": ["image/jpeg", "image/png", "image/webp"],
    "maxFileSize": "10MB",
    "presignedUrlExpires": "15m"
  }
  ```

---

## 🔍 9. QR 코드 스캔 API

### 9.1 QR 코드 처리
- **엔드포인트**: `POST /api/qr/process`
- **파일 위치**: `packages/mobile/src/components/WebViewBridge.tsx:193-208`
- **구현 상태**: ❌ 미구현
- **요청 데이터**:
  ```json
  {
    "qrData": "https://handy.com/products/prod123",
    "qrType": "URL",
    "format": "QR_CODE"
  }
  ```
- **응답 데이터**:
  ```json
  {
    "success": true,
    "type": "product",
    "data": {
      "productId": "prod123",
      "redirectUrl": "/products/prod123"
    }
  }
  ```

---

## 👤 10. 사용자 관리 API

### 10.1 배송지 관리
- **엔드포인트**: 
  - `GET /api/user/addresses` (조회)
  - `POST /api/user/addresses` (추가)
  - `PUT /api/user/addresses/{id}` (수정)
  - `DELETE /api/user/addresses/{id}` (삭제)
- **구현 상태**: ❌ 미구현

### 10.2 찜 목록 관리
- **엔드포인트**:
  - `GET /api/user/wishlist` (조회)
  - `POST /api/user/wishlist/{productId}` (추가)
  - `DELETE /api/user/wishlist/{productId}` (삭제)
- **파일 위치**: `packages/web/src/components/pages/OtherPages.tsx` (LikesPage)
- **구현 상태**: ❌ 미구현

---

## 🚨 11. 에러 처리 요구사항

### 11.1 공통 에러 응답 형식
```json
{
  "success": false,
  "error": {
    "code": "INVALID_EMAIL",
    "message": "올바른 이메일 주소를 입력해주세요.",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### 11.2 HTTP 상태 코드
- `200`: 성공
- `400`: 잘못된 요청 (유효성 검증 실패)
- `401`: 인증 필요 (토큰 없음/만료)
- `403`: 권한 없음 (접근 거부)
- `404`: 리소스 없음
- `409`: 충돌 (이미 존재하는 리소스)
- `429`: 요청 제한 초과
- `500`: 서버 내부 오류

### 11.3 주요 에러 코드
- `INVALID_EMAIL`: 이메일 형식 오류
- `WEAK_PASSWORD`: 비밀번호 복잡도 미달
- `USER_NOT_FOUND`: 사용자 없음
- `INVALID_CREDENTIALS`: 로그인 정보 불일치
- `TOKEN_EXPIRED`: 토큰 만료
- `PRODUCT_NOT_FOUND`: 상품 없음
- `OUT_OF_STOCK`: 재고 부족
- `PAYMENT_FAILED`: 결제 실패

---

## 🔒 12. 보안 요구사항

### 12.1 JWT 토큰
- **알고리즘**: HS256 또는 RS256
- **만료 시간**: 24시간 (개발환경), 1시간 (프로덕션)
- **Refresh Token**: 7일
- **헤더 형식**: `Authorization: Bearer {token}`

### 12.2 입력 검증
- **이메일**: RFC 5322 표준
- **비밀번호**: 최소 6자, 영문/숫자 포함
- **전화번호**: 한국 형식 (010-XXXX-XXXX)
- **XSS 방지**: HTML 태그 이스케이프
- **SQL Injection 방지**: 파라미터화된 쿼리

### 12.3 API 보안
- **CORS**: 허용된 도메인만 접근
- **Rate Limiting**: IP별 분당 요청 제한
- **HTTPS**: 모든 API 통신 암호화
- **API Key**: 모바일 앱 전용 API 키

---

## 🌐 13. 환경별 설정

### 13.1 개발 환경
- **API Base URL**: `http://localhost:5000`
- **Database**: SQLite 또는 PostgreSQL
- **파일 저장소**: 로컬 파일 시스템
- **로그 레벨**: DEBUG

### 13.2 프로덕션 환경  
- **API Base URL**: `http://handy-server-prod-ALB-596032555.ap-northeast-2.elb.amazonaws.com`
- **Database**: AWS RDS (PostgreSQL)
- **파일 저장소**: AWS S3
- **CDN**: AWS CloudFront
- **로그 레벨**: INFO

---

## 📊 14. API 구현 현황

### 14.1 구현 우선순위 (Phase 1)
1. **인증 API** (로그인, 회원가입, 프로필) - 🔴 필수
2. **상품 API** (목록, 상세, 카테고리) - 🔴 필수
3. **장바구니 API** (조회, 추가, 삭제) - 🔴 필수
4. **주문 API** (생성, 조회) - 🟡 중요

### 14.2 구현 우선순위 (Phase 2)
1. **결제 API** - 🟡 중요
2. **리뷰 API** - 🟡 중요
3. **소셜 로그인** - 🟡 중요
4. **이미지 업로드** - 🟢 선택

### 14.3 구현 우선순위 (Phase 3)
1. **쿠폰/포인트** - 🟢 선택
2. **QR 코드** - 🟢 선택
3. **고급 기능** (추천, 검색) - 🟢 선택

---

## 🧪 15. 테스트 계정 정보

### 15.1 일반 사용자
```
이메일: user@test.com
비밀번호: password123
```

### 15.2 관리자
```
이메일: admin@handy-server.com
비밀번호: admin123456
```

### 15.3 판매자
```
이메일: seller@handy-server.com
비밀번호: seller123456
```

---

## 📞 16. 문의 및 지원

- **프론트엔드 팀**: frontend-team@handy.com
- **백엔드 팀**: backend-team@handy.com
- **프로젝트 매니저**: pm@handy.com
- **기술 문서**: [GitHub Wiki](https://github.com/handy-platform/handy-platform/wiki)

---

**마지막 업데이트**: 2024-08-18  
**다음 리뷰 예정**: 2024-08-25