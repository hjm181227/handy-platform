# Handy Platform - Web Frontend 프로젝트 구조

## 개요
React + TypeScript + Vite 기반의 네일아트 쇼핑몰 웹 프론트엔드입니다.
모바일 앱과 WebView를 통해 연동되며, 독립적으로도 동작합니다.

## 기술 스택
- **프레임워크**: React 18 + TypeScript
- **빌드 도구**: Vite
- **스타일링**: Tailwind CSS
- **상태 관리**: React Context API
- **결제**: 토스페이먼츠 SDK
- **API 통신**: Fetch API (shared 패키지의 ApiService 래핑)

---

## 디렉토리 구조

```
packages/web/src/
├── components/           # UI 컴포넌트
│   ├── admin/           # 관리자 페이지 컴포넌트
│   ├── auth/            # 인증 관련 (RequireAuth, RequireRole 등)
│   ├── cart/            # 장바구니
│   ├── chat/            # 채팅 관련 (견적서, 커스텀 오더)
│   ├── common/          # 공통 컴포넌트 (Modal, Toast, Alert 등)
│   ├── layout/          # 레이아웃 (Header, Footer, Nav 등)
│   ├── pages/           # 페이지 컴포넌트
│   │   └── seller/      # 판매자 전용 페이지
│   ├── payment/         # 결제 관련
│   ├── product/         # 상품 관련 (Card, Grid, Detail 등)
│   ├── review/          # 리뷰 관련
│   └── ui/              # 기본 UI 요소 (Badge, Stars 등)
├── contexts/            # React Context
├── hooks/               # Custom Hooks
├── layouts/             # 레이아웃 컴포넌트
├── pages/               # 추가 페이지 (Chat 등)
├── services/            # API 서비스
├── utils/               # 유틸리티 함수
├── config/              # 환경 설정
├── data/                # 목업 데이터 (마이그레이션 중)
├── Router.tsx           # 라우팅 정의
├── App.tsx              # 앱 진입점
└── main.tsx             # Vite 진입점
```

---

## 주요 컴포넌트

### 레이아웃
| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| MainLayout | `layouts/MainLayout.tsx` | 메인 레이아웃 (헤더, 하단탭, 푸터 포함) |
| MainHeader | `components/layout/MainHeader.tsx` | 상단 헤더 (로고, 검색, 장바구니, 프로필) |
| PageHeader | `components/layout/PageHeader.tsx` | 서브페이지 헤더 (뒤로가기, 제목) |
| MobileBottomNav | `components/layout/MobileBottomNav.tsx` | 모바일 하단 네비게이션 |
| Footer | `components/layout/Footer.tsx` | 푸터 |
| SellerLayout | `components/layout/SellerLayout.tsx` | 판매자 페이지 레이아웃 |

### 상품 관련
| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| ProductCard | `components/product/ProductCard.tsx` | 상품 카드 |
| RankedProductCard | `components/product/RankedProductCard.tsx` | 랭킹용 상품 카드 |
| ProductGrid | `components/product/ProductGrid.tsx` | 상품 그리드/섹션 |
| Detail | `components/product/Detail.tsx` | 상품 상세 |
| CategoryDisplay | `components/product/CategoryDisplay.tsx` | 카테고리 표시 |
| CategorySelector | `components/product/CategorySelector.tsx` | 카테고리 선택기 |

### 공통 컴포넌트
| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| CategoryModal | `components/common/CategoryModal.tsx` | 카테고리 모달/페이지 |
| AlertModal | `components/common/AlertModal.tsx` | 알림 모달 |
| ToastNotification | `components/common/ToastNotification.tsx` | 토스트 알림 |
| ShippingAddressForm | `components/common/ShippingAddressForm.tsx` | 배송지 입력 폼 |
| FloatingChatButton | `components/common/FloatingChatButton.tsx` | 플로팅 채팅 버튼 |

---

## 페이지 라우팅

### 일반 페이지
| 경로 | 컴포넌트 | 설명 | API 연동 |
|------|---------|------|----------|
| `/` | Home (Router 내) | 홈 화면 | ✅ 배너, 상품 |
| `/new` | NewProductsPage | 신상품 목록 | ✅ `isNew=true` |
| `/ranking` | RankingPage | 랭킹 (주간/월간) | ✅ `/api/ranking` |
| `/recommend` | RecommendPage | 추천 상품 | ⏳ 목업 데이터 |
| `/trend` | TitleBar + ProductGrid | 트렌드 상품 | ❌ 목업 데이터 |
| `/sale` | TitleBar + ProductGrid | 할인 상품 | ❌ 목업 데이터 |
| `/cat/:type/:value` | CategoryPage | 카테고리별 상품 | ✅ 필터 파라미터 |
| `/category` | CategoryModal (페이지 모드) | 카테고리 목록 | ✅ `/api/categories` |
| `/search` | SearchResultsPage | 검색 결과 | ✅ 검색 API |
| `/brands` | BrandsPage | 브랜드 목록 | ✅ `/api/brands` |
| `/brand/:id` | BrandDetailPage | 브랜드 상세 | ✅ |
| `/product/:id` | Detail | 상품 상세 | ✅ |
| `/product/:id/custom-order` | CustomOrderForm | 커스텀 주문 | ✅ |
| `/news` | NewsPage | 뉴스/콘텐츠 | ⏳ |
| `/news/:slug` | NewsArticle | 뉴스 상세 | ⏳ |

### 장바구니/결제
| 경로 | 컴포넌트 | 설명 | API 연동 |
|------|---------|------|----------|
| `/cart` | CartContent | 장바구니 | ✅ |
| `/checkout` | CheckoutPage | 결제 페이지 | ✅ |
| `/payment/success` | PaymentSuccess | 결제 성공 | ✅ |
| `/payment/fail` | PaymentFail | 결제 실패 | ✅ |
| `/payment/cancel` | PaymentCancel | 결제 취소 | ✅ |

### 마이페이지
| 경로 | 컴포넌트 | 설명 | API 연동 |
|------|---------|------|----------|
| `/my` | MyPage | 마이페이지 메인 | ✅ |
| `/my/orders` | OrdersPage | 주문 내역 | ✅ |
| `/my/shipping` | ShippingPage | 배송 조회 | ✅ |
| `/my/claims` | ClaimsPage | 클레임 내역 | ✅ |
| `/my/cancel` | CancelPage | 취소 내역 | ✅ |
| `/my/reviews` | ReviewsPage | 리뷰 관리 | ✅ |
| `/my/coupons` | CouponsPage | 쿠폰 | ✅ |
| `/my/points` | PointsPage | 포인트 | ✅ |
| `/my/payments` | PaymentsPage | 결제 수단 | ✅ |
| `/my/shipping-address` | ShippingAddressPage | 배송지 관리 | ✅ |
| `/likes` | LikesPage | 좋아요 상품 | ✅ |
| `/chat` | ChatPage | 채팅 목록 | ✅ |
| `/chat/:id` | ChatRoomPage | 채팅방 | ✅ |

### 인증
| 경로 | 컴포넌트 | 설명 |
|------|---------|------|
| `/login` | LoginPage | 로그인 |
| `/signup` | SignupPage | 회원가입 |
| `/auth/social/signup` | SocialSignupPage | 소셜 회원가입 |

### 판매자 페이지
| 경로 | 컴포넌트 | 설명 | API 연동 |
|------|---------|------|----------|
| `/seller` | SellerDashboard | 판매자 대시보드 | ✅ |
| `/seller/brand` | SellerBrandProfile | 브랜드 프로필 | ✅ |
| `/seller/products` | SellerProducts | 상품 관리 | ✅ |
| `/seller/products/new` | SellerProductForm | 상품 등록 | ✅ |
| `/seller/products/:id/edit` | SellerProductForm | 상품 수정 | ✅ |
| `/seller/orders` | OrderManagement | 주문 관리 | ✅ |
| `/seller/coupons` | CouponManagement | 쿠폰 관리 | ✅ |
| `/seller/production` | ProductionSettings | 생산 설정 | ✅ |
| `/seller/production/status` | ProductionStatus | 생산 현황 | ✅ |
| `/seller/register` | SellerRegistrationPage | 판매자 등록 | ✅ |
| `/seller/apply` | SellerApplicationForm | 판매자 신청 | ✅ |

### 관리자 페이지
| 경로 | 컴포넌트 | 설명 |
|------|---------|------|
| `/admin` | AdminLayout | 관리자 대시보드 |
| `/admin/users` | UserManagement | 사용자 관리 |
| `/admin/sellers` | SellerManagement | 판매자 관리 |
| `/admin/orders` | AdminOrderManagement | 주문 관리 |
| `/admin/products` | AdminProductManagement | 상품 관리 |
| `/admin/seller-applications` | SellerApplicationManagement | 판매자 신청 관리 |
| `/admin/categories` | CategoryManagement | 카테고리 관리 |
| `/admin/banners` | BannerManagement | 배너 관리 |

---

## 서비스 및 API

### API 서비스 (`services/apiService.ts`)
shared 패키지의 `BaseIntegratedApiService`를 래핑하여 웹 환경에 맞게 확장합니다.

```typescript
// 사용 가능한 서비스들
webApiService.auth       // 인증
webApiService.product    // 상품
webApiService.cart       // 장바구니
webApiService.order      // 주문
webApiService.payment    // 결제
webApiService.seller     // 판매자
webApiService.review     // 리뷰
webApiService.likes      // 좋아요
webApiService.brand      // 브랜드
webApiService.category   // 카테고리
webApiService.banner     // 배너
webApiService.address    // 배송지
webApiService.shipping   // 배송
webApiService.loyalty    // 포인트/쿠폰
webApiService.image      // 이미지 업로드
webApiService.admin      // 관리자
```

---

## Context 및 Hooks

### Context
| Context | 파일 | 설명 |
|---------|------|------|
| AuthContext | `contexts/AuthContext.tsx` | 인증 상태 관리 |
| CartContext | `contexts/CartContext.tsx` | 장바구니 상태 |
| LikesContext | `contexts/LikesContext.tsx` | 좋아요 상태 |
| ToastContext | `contexts/ToastContext.tsx` | 토스트 알림 |

### Custom Hooks
| Hook | 파일 | 설명 |
|------|------|------|
| useAuth | `hooks/useAuth.ts` | 인증 상태 접근 |
| useCart | `hooks/useCart.ts` | 장바구니 조작 |
| useLikes | `hooks/useLikes.ts` | 좋아요 조작 |
| useToast | `hooks/useToast.ts` | 토스트 표시 |
| useTossPayments | `hooks/useTossPayments.ts` | 토스 결제 |
| useAlert | `components/common/useAlert.ts` | 알림 모달 |

---

## 유틸리티

### categoryUtils.ts
카테고리 key-name 매핑을 관리합니다.

```typescript
// 카테고리 옵션
categoryOptions.style   // 스타일 (simple, fancy, classic 등)
categoryOptions.color   // 컬러 (red, pink, neutral 등)
categoryOptions.texture // 텍스쳐 (gel, matte, glitter)
categoryOptions.tpo     // TPO (daily, party, wedding 등)
categoryOptions.nation  // 국가 (kr, jp, us)
categoryOptions.shape   // 모양 (round, almond, oval 등)
categoryOptions.length  // 길이 (short, medium, long)

// 유틸 함수
getCategoryDisplayName(type, value)  // value → 한글 name
getCategoryValue(type, name)         // 한글 name → value
getCategoryTypeLabel(type)           // type → 한글 레이블
```

---

## 환경 설정

### 환경 변수 (`.env.*`)
```bash
VITE_API_BASE_URL=https://api.example.com  # API 베이스 URL
VITE_ENVIRONMENT=development|staging|production
VITE_KAKAO_APP_KEY=xxx                     # 카카오 앱 키
```

### 환경별 빌드
```bash
npm run web:dev      # 개발 환경 (localhost:3001)
npm run web:stage    # 스테이지 환경
npm run web:prod     # 프로덕션 환경
```

---

## API 연동 상태

### ✅ 완료
- 홈 화면 (배너, 상품 섹션)
- 상품 목록/상세
- 카테고리 필터
- 신상품 (`/new`)
- 랭킹 (`/ranking`)
- 브랜드 목록/상세
- 검색
- 장바구니
- 결제 (토스페이먼츠)
- 주문/배송
- 마이페이지
- 좋아요
- 판매자 대시보드
- 판매자 상품 관리
- 판매자 주문 관리
- 채팅

### ⏳ 진행 중 / 미완료
- 트렌드 (`/trend`) - 목업 데이터 사용 중
- 할인 (`/sale`) - 목업 데이터 사용 중
- 추천 (`/recommend`) - 목업 데이터 사용 중
- 뉴스/콘텐츠

---

## 주요 타입 (shared 패키지)

```typescript
// 상품
interface Product {
  productUuid: string;
  name: string;
  price: number;
  discountedPrice?: number;
  mainImageUrl: string;
  brand?: string;
  rating?: { average: number; count: number };
  nailCategories?: NailCategories;
  // ...
}

// 카테고리
interface NailCategories {
  style?: string[];
  color?: string[];
  texture?: string[];
  tpo?: string[];
  nation?: string;
  nailShape?: string;
  nailLength?: string;
}

// 사용자
interface User {
  userId: string;
  email: string;
  name: string;
  role: 'user' | 'seller' | 'admin';
  // ...
}
```

---

## 스타일 가이드

### 레이아웃 클래스
```css
/* 최대 너비 컨테이너 */
.mx-auto .max-w-7xl .px-4

/* Sticky 헤더 */
.sticky .top-0 .z-50 (MainHeader)
.sticky .top-0 .z-30 (PageHeader)
.sticky .top-[52px] .z-20 (필터 바)

/* 상품 그리드 (flex) */
.flex .flex-wrap .-mx-2
.w-1/2 .sm:w-1/3 .md:w-1/4 .lg:w-1/5 .px-2 .mb-4
```

### 색상
```css
/* 프라이머리 */
.bg-blue-600, .text-blue-600

/* 상태 */
.bg-red-500 (에러/할인)
.bg-green-500 (성공)
.bg-yellow-500 (경고/랭킹)
.bg-gray-500 (비활성)
```

---

## 마이그레이션 노트

### 목업 데이터 → API 전환
`src/data/index.ts`의 `products` 배열은 점진적으로 API 호출로 대체되고 있습니다.

**전환 완료:**
- CategoryPage
- RankingPage
- NewProductsPage
- SearchResultsPage
- BrandsPage / BrandDetailPage

**전환 필요:**
- 홈 화면 일부 섹션
- 트렌드/할인 페이지
- 추천 페이지
