import { useState, useMemo, useEffect } from 'react';
import { useMiniRouter } from './utils';
import { products } from './data';
import { webApiService, cartService } from './services/apiService';
import { useResponsiveCart } from './hooks/useResponsiveCart';
import type { User, Product } from '@handy-platform/shared';
import { AlertProvider } from './components/common';

// Layout Components
import { TopDarkNav } from './components/layout/TopDarkNav';
import { MainHeader } from './components/layout/MainHeader';
import { Hero3 } from './components/layout/Hero';
import { FooterMega } from './components/layout/Footer';
import { CartDrawer, CategoryDrawer } from './components/layout/Drawers';

// Product Components
import { SectionRow, ProductGrid, TitleBar } from './components/product/ProductGrid';
import { Detail } from './components/product/Detail';

// Page Components
import { NewsPage, NewsArticle } from './components/pages/NewsPage';
import { BrandsPage } from './components/pages/BrandsPage';
import { BrandDetailPage } from './components/pages/BrandDetailPage';
import { RankingPage } from './components/pages/RankingPage';
import { RecommendPage } from './components/pages/RecommendPage';
import { SearchResultsPage } from './components/pages/SearchResultsPage';
import { LoginPage } from './components/pages/LoginPage';
import { SignupPage } from './components/pages/SignupPage';
import { SocialSignupPage } from './components/pages/SocialSignupPage';
import { HelpPage } from './components/pages/HelpPage';
import { LikesPage, MyPage, SnapPage } from './components/pages/OtherPages';
import { CartContent } from './components/cart/CartContent';

// MyPage Components
import {
  OrdersPage,
  ShippingPage,
  ClaimsPage,
  CancelPage,
  ReviewsPage,
  CouponsPage,
  PointsPage,
  PaymentsPage
} from './components/pages/MyPages';

// Support Components
import {
  ContactPage,
  FaqPage,
  NotificationsPage,
  SettingsPage,
  PromoPage
} from './components/pages/SupportPages';

// Seller Components
import { SellerRegistrationPage } from './components/pages/SellerRegistrationPage';

// Checkout and Order Components
import { CheckoutPage } from './components/pages/CheckoutPage';
import { OrderCompletePage } from './components/pages/OrderCompletePage';
import { ShippingAddressPage } from './components/pages/ShippingAddressPage';

// Payment Components
import { PaymentSuccess } from './components/pages/PaymentSuccess';
import { PaymentCancel } from './components/pages/PaymentCancel';
import { PaymentFail } from './components/pages/PaymentFail';
import { PaymentTest } from './components/pages/PaymentTest';

// Footer Components
import {
  AboutCompanyPage,
  AboutBusinessPage,
  AboutNewsroomPage,
  AboutCareersPage,
  AboutNoticePage,
  PartnerInquiryPage,
  PolicyPage,
  SnsPage
} from './components/pages/FooterPages';

// Mega Footer Pages
import {
  ContactInquiryPageSimple,
  FaqPageSimple,
  AboutCompanyPageSimple,
  AboutBusinessPageSimple,
  AboutNewsroomPageSimple,
  AboutCareersPageSimple,
  AboutNoticePageSimple
} from './components/pages/MegaFooterPages';

// Seller Components
import {
  SellerDashboard,
  SellerProducts,
  SellerProductForm,
  SellerOrders,
  SellerAnalytics,
  SellerSettlement,
  SellerReviews,
  ProductionDashboard,
  ProductionSettings,
  ProductionManage,
  ProductionStatus
} from './components/pages/SellerPages';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import UserManagement from './components/admin/UserManagement';
import SellerManagement from './components/admin/SellerManagement';
import AdminOrderManagement from './components/admin/AdminOrderManagement';
import AdminProductManagement from './components/admin/AdminProductManagement';
import SellerApplicationManagement from './components/admin/SellerApplicationManagement';
import SellerApplicationForm from './components/pages/SellerApplicationForm';

export default function App() {
  const { path, nav } = useMiniRouter();
  const { isMobile } = useResponsiveCart();

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Cart state
  const [cartCount, setCartCount] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Home page products state
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [loadingNewProducts, setLoadingNewProducts] = useState(false);

  // Like state
  const [likedProducts, setLikedProducts] = useState<string[]>([]);

  // Toast 표시 함수
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);

    // 3초 후 자동 숨김
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 장바구니 개수 로딩 (로그인된 사용자만)
  const loadCartCount = async () => {
    try {
      console.log('Loading cart count...');
      const response = await cartService.getCartCount();

      console.log('Cart count response:', response);

      if (response.success && response.data) {
        setCartCount(response.data.count || 0);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.warn('Cart count fetch failed:', error);
      setCartCount(0);
    }
  };

  // 신상 제품 로딩
  const loadNewProducts = async () => {
    try {
      setLoadingNewProducts(true);
      const response = await webApiService.product.getProducts({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'  // 최신순
      });
      setNewProducts(response.data || []);
    } catch (error: any) {
      console.error('Failed to load new products:', error);
      // 에러가 발생하면 기존 더미 데이터 중 일부를 사용 (fallback)
      setNewProducts([...products].reverse().slice(0, 10));
    } finally {
      setLoadingNewProducts(false);
    }
  };

  // 초기 데이터 로딩 (신상 제품만, 장바구니는 로그인 후)
  useEffect(() => {
    loadNewProducts();
  }, []);

  // 로그인 상태 변경 시 장바구니 로딩
  useEffect(() => {
    if (currentUser) {
      // 로그인된 경우에만 장바구니 카운트 로드
      loadCartCount();
    } else {
      // 로그아웃된 경우 카운트 초기화
      setCartCount(0);
    }
  }, [currentUser]);

  // 장바구니 클릭 핸들러 (반응형, 로그인된 사용자만)
  const handleCartClick = () => {
    // 로그인 확인
    if (!currentUser) {
      showToast('로그인이 필요한 서비스입니다.', 'error');
      nav('/login');
      return;
    }

    if (isMobile) {
      nav('/cart'); // 모바일: 페이지로 이동
    } else {
      setDrawer(true); // PC: Drawer 열기
    }
  };

  // 인증 상태 초기화 (앱 시작 시 토큰 복원)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthLoading(true);

        // WebView 환경에서는 Native 토큰 동기화 먼저 수행
        if ((window as any).ReactNativeWebView) {
          await webApiService.initializeFromNative();
          console.log('✅ Native 토큰 동기화 완료');
        }

        // 현재 사용자 정보 복원 시도
        const user = await webApiService.getCurrentUser();
        console.log('🔍 토큰에서 복원된 사용자:', user);
        setCurrentUser(user);

      } catch (error) {
        console.warn('⚠️ 인증 상태 초기화 실패:', error);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 장바구니에 상품 추가 (로그인된 사용자만)
  const addToCart = async (productId: string, options?: Record<string, string>) => {
    // 로그인 확인
    if (!currentUser) {
      showToast('로그인이 필요한 서비스입니다.', 'error');
      nav('/login');
      return;
    }

    try {
      const response = await cartService.addToCart(productId, 1, options || {});
      if (response.success) {
        await loadCartCount(); // 카운트 새로고침
      } else {
        throw new Error('장바구니 추가에 실패했습니다.');
      }

      // 성공 피드백
      const message = options ? `옵션과 함께 장바구니에 추가되었습니다` : `장바구니에 추가되었습니다`;
      showToast(message, 'success');
    } catch (error: any) {
      console.error('Add to cart failed:', error);
      const errorMessage = error.message || '장바구니 추가에 실패했습니다.';
      showToast(errorMessage, 'error');
    }
  };

  // 체크아웃 처리
  const handleCheckout = () => {
    // 로그인 확인
    if (!currentUser) {
      showToast('로그인이 필요한 서비스입니다.', 'error');
      nav('/login');
      return;
    }

    // 체크아웃 페이지로 이동
    nav('/checkout');
    setDrawer(false);

    // WebView 환경에서 네이티브 알림
    try {
      (window as any).ReactNativeWebView?.postMessage(JSON.stringify({type:"checkout"}));
    } catch {}
  };

  // Routing
  const [pathname, search] = useMemo(()=>{
    // path 상태를 직접 파싱하여 pathname과 search 분리
    const [pathPart, searchPart = ''] = path.split('?');
    return [pathPart, searchPart ? `?${searchPart}` : ''] as const;
  }, [path]);

  const q = useMemo(()=> new URLSearchParams(search), [search]);

  // helper screens
  const openProduct = (id:string)=> nav(`/product/${id}`);
  const addProduct = (id:string)=> addToCart(id);

  // Like handler
  const handleLike = (productId: string) => {
    setLikedProducts(prev => {
      if (prev.includes(productId)) {
        // 이미 좋아요한 경우 제거
        return prev.filter(id => id !== productId);
      } else {
        // 좋아요 추가
        return [...prev, productId];
      }
    });
  };

  let screen: React.ReactNode;


  // Product detail
  const mDetail = pathname.match(/^\/product\/(.+)$/);
  if (mDetail) {
    screen = <Detail
      id={decodeURIComponent(mDetail[1])}
      onBack={()=>history.back()}
      onAdd={addProduct}
      onCartUpdate={loadCartCount}
      currentUser={currentUser}
    />;
  } else if (pathname.startsWith("/brand/") && pathname.split("/").length === 3) {
    // 브랜드 상세 페이지: /brand/{sellerUuid}
    const sellerUuid = pathname.split("/")[2];
    screen = (
      <BrandDetailPage
        sellerUuid={sellerUuid}
        onGo={nav}
        onOpen={openProduct}
        onAdd={addProduct}
        onLike={handleLike}
        likedProducts={likedProducts}
      />
    );
  } else if (pathname.startsWith("/brands")) {
    // 브랜드 목록 페이지: /brands
    screen = (
      <BrandsPage
        onGo={nav}
        onOpen={openProduct}
        onAdd={addProduct}
        onLike={handleLike}
        likedProducts={likedProducts}
      />
    );
  } else if (pathname.startsWith("/snap")) {
    screen = <SnapPage onGo={nav} onOpen={openProduct} />;
  } else if (pathname.startsWith("/news")) {
    const m = pathname.match(/^\/news\/(.+)$/);
    if (m) {
      // 기사 상세
      screen = <NewsArticle slug={decodeURIComponent(m[1])} onGo={nav} onOpenProduct={openProduct} />;
    } else {
      // 목록
      screen = <NewsPage onGo={nav} onOpenProduct={openProduct} />;
    }
  } else if (pathname.startsWith("/ranking")) {
    screen = (
      <RankingPage
        onGo={nav}
        onOpen={openProduct}
        onAdd={addProduct}
        onLike={handleLike}
        likedProducts={likedProducts}
      />
    );
  } else if (pathname.startsWith("/sale")) {
    screen = (<><TitleBar title="세일"/><ProductGrid title="할인 중" items={products.filter(p=>p.sale)} onOpen={openProduct} onAdd={addProduct} onLike={handleLike} likedProducts={likedProducts} /></>);
  } else if (pathname.startsWith("/recommend")) {
    screen = (
      <RecommendPage
        currentUser={currentUser}
        onGo={nav}
        onOpen={openProduct}
        onAdd={addProduct}
        onLike={handleLike}
        likedProducts={likedProducts}
      />
    );
  } else if (pathname.startsWith("/new")) {
    screen = (<><TitleBar title="신상"/><ProductGrid title="방금 등록된 상품" items={products.filter(p=>p.isNewProduct)} onOpen={openProduct} onAdd={addProduct} onLike={handleLike} likedProducts={likedProducts} /></>);
  } else if (pathname.startsWith("/trend")) {
    screen = (<><TitleBar title="트렌드"/><ProductGrid title="지금 뜨는 상품" items={[...products].sort((a,b)=>(b.sale??0)-(a.sale??0))} onOpen={openProduct} onAdd={addProduct} onLike={handleLike} likedProducts={likedProducts} /></>);
  } else if (pathname.startsWith("/promo/")) {
    const slug = pathname.split("/").pop();
    screen = (<><TitleBar title={`프로모션: ${slug}`} desc="프로모션 기획전"/><SectionRow title="기획전 상품" items={[...products]} onOpen={openProduct} onAdd={addProduct} onLike={handleLike} likedProducts={likedProducts} /></>);
  } else if (pathname.startsWith("/cat/")) {
    const parts = pathname.split("/").slice(2).map(decodeURIComponent);
    const [group, name] = parts;
    screen = (<><TitleBar title={`${group?.toUpperCase()} / ${name}`} desc="카테고리 결과"/><ProductGrid title="카테고리 상품" items={[...products]} onOpen={openProduct} onAdd={addProduct} onLike={handleLike} likedProducts={likedProducts} /></>);
  } else if (pathname.startsWith("/search")) {
    const keyword = q.get("q") ?? "";
    screen = <SearchResultsPage searchQuery={keyword} onOpen={openProduct} onAdd={addProduct} onLike={handleLike} likedProducts={likedProducts} />;
  } else if (pathname.startsWith("/cart")) {
    screen = <CartContent
      key={pathname} // 페이지 진입할 때마다 새로고침
      mode="page"
      onBack={() => history.back()}
      onCheckout={handleCheckout}
      onCartUpdate={loadCartCount}
      currentUser={currentUser}
    />;
  } else if (pathname === "/checkout") {
    screen = <CheckoutPage onGo={nav} />;
  } else if (pathname === "/payment/success") {
    screen = <PaymentSuccess onGo={nav} />;
  } else if (pathname === "/payment/cancel") {
    screen = <PaymentCancel onGo={nav} />;
  } else if (pathname === "/payment/fail") {
    screen = <PaymentFail onGo={nav} />;
  } else if (pathname === "/payment/test") {
    screen = <PaymentTest onGo={nav} />;
  } else if (pathname.match(/^\/order-complete\/(.+)$/)) {
    const orderId = pathname.split("/")[2];
    screen = <OrderCompletePage onGo={nav} orderId={orderId} />;
  } else if (pathname.startsWith("/help")) {
    screen = <HelpPage onGo={nav} />;
  } else if (pathname.startsWith("/likes")) {
    screen = <LikesPage onGo={nav} onOpen={openProduct} />;
  } else if (pathname === "/my/orders") {
    screen = <OrdersPage onGo={nav} />;
  } else if (pathname === "/my/shipping-address") {
    screen = <ShippingAddressPage onGo={nav} />;
  } else if (pathname === "/my/shipping") {
    screen = <ShippingPage onGo={nav} />;
  } else if (pathname === "/my/claims") {
    screen = <ClaimsPage onGo={nav} />;
  } else if (pathname === "/my/cancel") {
    screen = <CancelPage onGo={nav} />;
  } else if (pathname === "/my/reviews") {
    screen = <ReviewsPage onGo={nav} />;
  } else if (pathname === "/my/coupons") {
    screen = <CouponsPage onGo={nav} />;
  } else if (pathname === "/my/points") {
    screen = <PointsPage onGo={nav} />;
  } else if (pathname === "/my/payments") {
    screen = <PaymentsPage onGo={nav} />;
  } else if (pathname === "/my/notifications") {
    screen = <NotificationsPage onGo={nav} />;
  } else if (pathname === "/my/settings") {
    screen = <SettingsPage onGo={nav} />;
  } else if (pathname === "/seller/register") {
    screen = <SellerRegistrationPage onGo={nav} />;
  } else if (pathname === "/support/contact") {
    screen = <ContactPage onGo={nav} />;
  } else if (pathname === "/support/faq") {
    screen = <FaqPage onGo={nav} />;
  } else if (pathname === "/promo/plus") {
    screen = <PromoPage onGo={nav} />;
  } else if (pathname === "/about/회사 소개") {
    screen = <AboutCompanyPage onGo={nav} />;
  } else if (pathname === "/about/비즈니스 소개") {
    screen = <AboutBusinessPage onGo={nav} />;
  } else if (pathname === "/about/뉴스룸") {
    screen = <AboutNewsroomPage onGo={nav} />;
  } else if (pathname === "/about/채용 정보") {
    screen = <AboutCareersPage onGo={nav} />;
  } else if (pathname === "/about/공지사항") {
    screen = <AboutNoticePage onGo={nav} />;
  } else if (pathname === "/contact-inquiry") {
    screen = <ContactInquiryPageSimple onGo={nav} />;
  } else if (pathname === "/footer-faq") {
    screen = <FaqPageSimple onGo={nav} />;
  } else if (pathname === "/about-company") {
    screen = <AboutCompanyPageSimple onGo={nav} />;
  } else if (pathname === "/about-business") {
    screen = <AboutBusinessPageSimple onGo={nav} />;
  } else if (pathname === "/about-newsroom") {
    screen = <AboutNewsroomPageSimple onGo={nav} />;
  } else if (pathname === "/about-careers") {
    screen = <AboutCareersPageSimple onGo={nav} />;
  } else if (pathname === "/about-notice") {
    screen = <AboutNoticePageSimple onGo={nav} />;
  } else if (pathname.startsWith("/partner/")) {
    const type = decodeURIComponent(pathname.split("/").pop() || "");
    screen = <PartnerInquiryPage onGo={nav} type={type} />;
  } else if (pathname.startsWith("/policy/")) {
    const policyType = pathname.split("/").pop() || "";
    screen = <PolicyPage onGo={nav} type={policyType} />;
  } else if (pathname.startsWith("/sns/")) {
    const platform = pathname.split("/").pop() || "";
    screen = <SnsPage onGo={nav} platform={platform} />;

  // 판매자 센터 라우팅
  } else if (pathname === "/seller") {
    screen = <SellerDashboard onGo={nav} />;
  } else if (pathname === "/seller/products") {
    screen = <SellerProducts onGo={nav} />;
  } else if (pathname === "/seller/products/new") {
    screen = <SellerProductForm onGo={nav} />;
  } else if (pathname.match(/^\/seller\/products\/(.+)\/edit$/)) {
    const productId = pathname.split("/")[3];
    screen = <SellerProductForm onGo={nav} productId={productId} />;
  } else if (pathname === "/seller/orders") {
    screen = <SellerOrders onGo={nav} />;
  } else if (pathname === "/seller/reviews") {
    screen = <SellerReviews onGo={nav} />;
  } else if (pathname === "/seller/analytics") {
    screen = <SellerAnalytics onGo={nav} />;
  } else if (pathname === "/seller/settlement") {
    screen = <SellerSettlement onGo={nav} />;
  } else if (pathname === "/seller/production") {
    screen = <ProductionDashboard onGo={nav} />;
  } else if (pathname === "/seller/production/settings") {
    screen = <ProductionSettings onGo={nav} />;
  } else if (pathname === "/seller/production/manage") {
    screen = <ProductionManage onGo={nav} />;
  } else if (pathname === "/seller/production/status") {
    screen = <ProductionStatus onGo={nav} />;

  // Admin routes
  } else if (pathname.startsWith("/admin")) {
    if (pathname === "/admin" || pathname === "/admin/") {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <div className="p-6 space-y-6">
            {/* 대시보드 헤더 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg text-white p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
                  <p className="text-blue-100">시스템을 관리하고 모니터링하세요</p>
                </div>
                <div className="text-right">
                  <div className="text-blue-100 text-sm">접속 중</div>
                  <div className="text-xl font-semibold">{currentUser?.name || 'Admin'}</div>
                </div>
              </div>
            </div>

            {/* 대시보드 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      활성
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">사용자 관리</h3>
                <p className="text-gray-600 text-sm mb-4">사용자 계정 및 권한을 관리합니다</p>
                <button
                  onClick={() => nav('/admin/users')}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
                >
                  관리하기
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      활성
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">판매자 관리</h3>
                <p className="text-gray-600 text-sm mb-4">판매자 승인 및 관리를 합니다</p>
                <button
                  onClick={() => nav('/admin/sellers')}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium"
                >
                  관리하기
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      활성
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">주문 관리</h3>
                <p className="text-gray-600 text-sm mb-4">전체 주문을 관리합니다</p>
                <button
                  onClick={() => nav('/admin/orders')}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium"
                >
                  관리하기
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      활성
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">상품 관리</h3>
                <p className="text-gray-600 text-sm mb-4">전체 상품을 관리합니다</p>
                <button
                  onClick={() => nav('/admin/products')}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg hover:from-yellow-700 hover:to-yellow-800 transition-all duration-200 font-medium"
                >
                  관리하기
                </button>
              </div>
            </div>

            {/* 빠른 액세스 섹션 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 액세스</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => nav('/admin/users')}
                  className="flex items-center p-3 text-left rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">사용자 목록</span>
                </button>
                <button
                  onClick={() => nav('/admin/sellers')}
                  className="flex items-center p-3 text-left rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-colors group"
                >
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">판매자 관리</span>
                </button>
                <button
                  onClick={() => nav('/admin/orders')}
                  className="flex items-center p-3 text-left rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors group"
                >
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">주문 관리</span>
                </button>
                <button
                  onClick={() => nav('/admin/products')}
                  className="flex items-center p-3 text-left rounded-lg border border-gray-200 hover:bg-yellow-50 hover:border-yellow-300 transition-colors group"
                >
                  <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 mr-3">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-yellow-700">상품 관리</span>
                </button>
              </div>
            </div>
          </div>
        </AdminLayout>
      );
    } else if (pathname === "/admin/users") {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <UserManagement />
        </AdminLayout>
      );
    } else if (pathname === "/admin/sellers") {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <SellerManagement />
        </AdminLayout>
      );
    } else if (pathname === "/admin/orders") {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <AdminOrderManagement />
        </AdminLayout>
      );
    } else if (pathname === "/admin/products") {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <AdminProductManagement />
        </AdminLayout>
      );
    } else if (pathname === "/admin/seller-applications") {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <SellerApplicationManagement />
        </AdminLayout>
      );
    } else {
      // Admin 404 - redirect to admin dashboard
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">페이지를 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-4">요청하신 관리자 페이지를 찾을 수 없습니다.</p>
            <button
              onClick={() => nav('/admin')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              관리자 대시보드로 돌아가기
            </button>
          </div>
        </AdminLayout>
      );
    }
  } else if (pathname.startsWith("/my")) {
    screen = <MyPage onGo={nav} onOpen={openProduct} />;
  } else if (pathname === "/seller/apply") {
    screen = <SellerApplicationForm onGo={nav} />;
  } else if (pathname.startsWith("/login")) {
    screen = <LoginPage onGo={nav} />;
  } else if (pathname.startsWith("/auth/social/signup")) {
    screen = <SocialSignupPage onGo={nav} />;
  } else if (pathname.startsWith("/signup")) {
    screen = <SignupPage onGo={nav} />;
  } else {
    // Home
    screen = (
      <>
        <Hero3 onGo={nav}/>
        <SectionRow
          title="신상 제품"
          items={newProducts}
          loading={loadingNewProducts}
          onOpen={openProduct}
          onAdd={addProduct}
          onLike={handleLike}
          likedProducts={likedProducts}
        />
        <SectionRow title="회원님을 위한 추천상품" items={products} onOpen={openProduct} onAdd={addProduct} onLike={handleLike} likedProducts={likedProducts} />
        <SectionRow title="시즌 트렌드 상품" items={[...products].sort((a,b)=>(b.sale??0)-(a.sale??0))} onOpen={openProduct} onAdd={addProduct} onLike={handleLike} likedProducts={likedProducts} />
      </>
    );
  }

  // 판매자 센터 페이지인지 확인
  const isSellerPage = pathname.startsWith("/seller");

  // 어드민 센터 페이지인지 확인
  const isAdminPage = pathname.startsWith("/admin");

  // 홈화면에서는 헤더를 표시, 다른 페이지에서는 숨김
  const isHomePage = pathname === '/';
  const shouldShowHeader = !isSellerPage && !isAdminPage;

  return (
    <AlertProvider>
      {/* 판매자 센터와 어드민 센터가 아닐 때만 헤더 표시 */}
      {shouldShowHeader && (
        <>
          {/* 홈페이지에서는 헤더 표시, 다른 페이지에서는 앱에서만 숨김 */}
          <div data-apphide={isHomePage ? "false" : "true"}>
            <TopDarkNav onOpenCategories={() => setCatOpen(true)} onGo={nav} />
          </div>
          <div data-apphide={isHomePage ? "false" : "true"}>
            <MainHeader
              cartCount={cartCount}
              onCart={handleCartClick}
              onGo={nav}
              currentPath={pathname}
              onAuthStateChange={setCurrentUser}
              authLoading={authLoading}
            />
          </div>
        </>
      )}

      {/* 본문은 절대 숨김 래퍼 안에 넣지 않기 */}
      {screen}

      {/* 판매자 센터가 아닐 때만 푸터와 드로어 표시 */}
      {!isSellerPage && (
        <>
          <FooterMega onGo={nav} />
          <CartDrawer
            open={drawer}
            onClose={() => setDrawer(false)}
            onCheckout={handleCheckout}
            onCartUpdate={loadCartCount}
            currentUser={currentUser}
          />
          <CategoryDrawer
            open={catOpen}
            onClose={() => setCatOpen(false)}
            onGo={nav}
          />
        </>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`
          fixed bottom-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium
          transform transition-all duration-300 ease-in-out
          ${toastType === 'success' ? 'bg-green-500' : 
            toastType === 'error' ? 'bg-red-500' : 
            'bg-blue-500'}
        `}>
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {toastType === 'success' ? '✅' :
               toastType === 'error' ? '❌' :
               'ℹ️'}
            </span>
            {toastMessage}
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </AlertProvider>
  );
}
