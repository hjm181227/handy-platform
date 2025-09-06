import { useState, useMemo, useEffect } from 'react';
import { useMiniRouter } from './utils';
import { products } from './data';
import { webApiService } from './services/apiService';
import { useResponsiveCart } from './hooks/useResponsiveCart';
import type { User, Product } from '@handy-platform/shared';

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
import { LoginPage } from './components/pages/LoginPage';
import { SignupPage } from './components/pages/SignupPage';
import { HelpPage } from './components/pages/HelpPage';
import { LikesPage, MyPage, SnapPage } from './components/pages/OtherPages';
import { CartPage } from './components/pages/CartPage';

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
  SellerReviews
} from './components/pages/SellerPages';

export default function App() {
  const { path, nav } = useMiniRouter();
  const { isMobile } = useResponsiveCart();

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  // Toast 표시 함수
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    
    // 3초 후 자동 숨김
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 장바구니 개수 로딩
  const loadCartCount = async () => {
    try {
      const response = await webApiService.cart.getCartCount();
      setCartCount(response.data.count || 0);
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

  useEffect(() => {
    loadCartCount();
    loadNewProducts();
  }, []);

  // 장바구니 클릭 핸들러 (반응형)
  const handleCartClick = () => {
    if (isMobile) {
      nav('/cart'); // 모바일: 페이지로 이동
    } else {
      setDrawer(true); // PC: Drawer 열기
    }
  };

  // Native에서 토큰 초기화 (WebView 환경에서만)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await webApiService.initializeFromNative();
        console.log('✅ Native 토큰 동기화 완료');
      } catch (error) {
        console.warn('⚠️ Native 토큰 동기화 실패:', error);
      }
    };

    // WebView 환경에서만 실행
    if ((window as any).ReactNativeWebView) {
      initializeAuth();
    }
  }, []);

  // 장바구니에 상품 추가
  const addToCart = async (productId: string, options?: Record<string, string>) => {
    try {
      await webApiService.cart.addToCart(productId, 1, options);
      await loadCartCount(); // 카운트 새로고침
      
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
    // TODO: Milestone 3에서 체크아웃 페이지로 이동 구현
    try { 
      (window as any).ReactNativeWebView?.postMessage(JSON.stringify({type:"checkout"})); 
    } catch {}
    alert('체크아웃 기능은 곧 구현됩니다!');
    setDrawer(false);
  };

  // Routing
  const [pathname, search] = useMemo(()=>{
    const u = new URL(window.location.href);
    return [u.pathname, u.search] as const;
  }, [path]);

  const q = useMemo(()=> new URLSearchParams(search), [search]);

  // helper screens
  const openProduct = (id:string)=> nav(`/product/${id}`);
  const addProduct = (id:string)=> addToCart(id);

  let screen: React.ReactNode;
  
  // DEBUG: 현재 pathname 확인
  console.log("Current pathname:", pathname);

  // Product detail
  const mDetail = pathname.match(/^\/product\/(.+)$/);
  if (mDetail) {
    screen = <Detail 
      id={decodeURIComponent(mDetail[1])} 
      onBack={()=>history.back()} 
      onAdd={addProduct}
      onCartUpdate={loadCartCount}
    />;
  } else if (pathname.startsWith("/brands")) {
    screen = (
      <BrandsPage
        onGo={nav}
        onOpen={openProduct}
        onAdd={addProduct}
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
    screen = (<><TitleBar title="랭킹"/><ProductGrid title="Top Rated" items={[...products].sort((a,b)=>(b.rating??0)-(a.rating??0))} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/sale")) {
    screen = (<><TitleBar title="세일"/><ProductGrid title="할인 중" items={products.filter(p=>p.sale)} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/recommend")) {
    screen = (<><TitleBar title="추천"/><ProductGrid title="회원님을 위한 추천" items={[...products]} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/new")) {
    screen = (<><TitleBar title="신상"/><ProductGrid title="방금 등록된 상품" items={products.filter(p=>p.isNew)} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/trend")) {
    screen = (<><TitleBar title="트렌드"/><ProductGrid title="지금 뜨는 상품" items={[...products].sort((a,b)=>(b.sale??0)-(a.sale??0))} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/promo/")) {
    const slug = pathname.split("/").pop();
    screen = (<><TitleBar title={`프로모션: ${slug}`} desc="프로모션 기획전"/><SectionRow title="기획전 상품" items={[...products]} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/cat/")) {
    const parts = pathname.split("/").slice(2).map(decodeURIComponent);
    const [group, name] = parts;
    screen = (<><TitleBar title={`${group?.toUpperCase()} / ${name}`} desc="카테고리 결과"/><ProductGrid title="카테고리 상품" items={[...products]} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/search")) {
    const keyword = q.get("q") ?? "";
    screen = (<><TitleBar title={`검색: ${keyword || "전체"}`} desc="검색 결과"/><ProductGrid title="검색 결과" items={[...products]} onOpen={openProduct} onAdd={addProduct}/></>);
  } else if (pathname.startsWith("/cart")) {
    screen = <CartPage onBack={() => history.back()} onCheckout={handleCheckout} onCartUpdate={loadCartCount} />;
  } else if (pathname.startsWith("/help")) {
    screen = <HelpPage onGo={nav} />;
  } else if (pathname.startsWith("/likes")) {
    screen = <LikesPage onGo={nav} onOpen={openProduct} />;
  } else if (pathname === "/my/orders") {
    screen = <OrdersPage onGo={nav} />;
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
    
  } else if (pathname.startsWith("/my")) {
    screen = <MyPage onGo={nav} onOpen={openProduct} />;
  } else if (pathname.startsWith("/login")) {
    screen = <LoginPage onGo={nav} />;
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
        />
        <SectionRow title="회원님을 위한 추천상품" items={products} onOpen={openProduct} onAdd={addProduct}/>
        <SectionRow title="시즌 트렌드 상품" items={[...products].sort((a,b)=>(b.sale??0)-(a.sale??0))} onOpen={openProduct} onAdd={addProduct}/>
      </>
    );
  }

  // 판매자 센터 페이지인지 확인
  const isSellerPage = pathname.startsWith("/seller");

  return (
    <>
      {/* 판매자 센터가 아닐 때만 헤더 표시 */}
      {!isSellerPage && (
        <>
          {/* 앱(WebView)에서만 숨길 요소 */}
          <div data-apphide="true">
            <TopDarkNav onOpenCategories={() => setCatOpen(true)} onGo={nav} />
          </div>
          <div data-apphide="true">
            <MainHeader 
              cartCount={cartCount} 
              onCart={handleCartClick} 
              onGo={nav}
              onAuthStateChange={setCurrentUser}
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
    </>
  );
}