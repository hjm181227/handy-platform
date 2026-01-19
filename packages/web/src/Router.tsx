import { useState, useMemo, useEffect } from 'react';
import { useMiniRouter } from './utils';
import { products } from './data';
import { webApiService, brandService } from './services/apiService';
import type { Product, Brand } from '@handy-platform/shared';
import { RequireAuth } from './components/auth';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import { useCart } from './hooks/useCart';
import { useLikes } from './hooks/useLikes';
import { useAuthModal } from './contexts/AuthModalContext';
import { MainLayout } from './layouts/MainLayout';

// Product Components
import { SectionRow, ProductGrid, TitleBar } from './components/product/ProductGrid';
import { ProductCard } from './components/product/ProductCard';
import { Detail } from './components/product/Detail';
import { CustomOrderFlow } from './components/product/custom-order';
import { EventBanners } from './components/layout/EventBanner';

// Page Components
import { NewsPage, NewsArticle } from './components/pages/NewsPage';
import { BrandsPage } from './components/pages/BrandsPage';
import { BrandDetailPage } from './components/pages/BrandDetailPage';
import { RankingPage } from './components/pages/RankingPage';
import { RecommendPage } from './components/pages/RecommendPage';
import { SearchResultsPage } from './components/pages/SearchResultsPage';
import { SocialSignupPage } from './components/pages/SocialSignupPage';
import { HelpPage } from './components/pages/HelpPage';
import { LikesPage, MyPage, SnapPage } from './components/pages/OtherPages';
import { ChatPage } from './pages/ChatPage';
import { ChatRoomPage } from './pages/ChatRoomPage';
import { CartContent } from './components/cart/CartContent';
import { CategoryModal } from './components/common/CategoryModal';
import { CategoryPage } from './components/pages/CategoryPage';
import { NewProductsPage } from './components/pages/NewProductsPage';

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

// OAuth Callback Components
import { NaverCallbackPage } from './components/pages/NaverCallbackPage';
import { KakaoCallbackPage } from './components/pages/KakaoCallbackPage';

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
  BrandManagement,
  ProductionSettings,
  ProductionStatus,
  CouponManagement
} from './components/pages/SellerPages';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import UserManagement from './components/admin/UserManagement';
import SellerManagement from './components/admin/SellerManagement';
import AdminOrderManagement from './components/admin/AdminOrderManagement';
import AdminProductManagement from './components/admin/AdminProductManagement';
import SellerApplicationManagement from './components/admin/SellerApplicationManagement';
import CategoryManagement from './components/admin/CategoryManagement';
import BannerManagement from './components/admin/BannerManagement';
import AdminCouponManagement from './components/admin/AdminCouponManagement';
import SellerApplicationForm from './components/pages/SellerApplicationForm';

/**
 * 라우터 컴포넌트
 *
 * 역할:
 * - URL 경로에 따라 적절한 화면 렌더링
 * - 레이아웃 적용 (MainLayout, AdminLayout, SellerLayout)
 * - 인증/권한 체크
 */
export function Router() {
  const { path, nav } = useMiniRouter();

  // Auth state
  const { currentUser, authLoading, setUser } = useAuth();

  // Auth modal
  const { openLogin, openSignup } = useAuthModal();

  // Toast state
  const { showToast } = useToast();

  // Cart state
  const {
    cartCount,
    loadCartCount,
    addToCart,
    handleCheckout,
    handleCartClick,
  } = useCart();

  // Likes state
  const {
    likedProducts,
    likedBrands,
    handleLike,
    handleBrandLike,
  } = useLikes();

  // Home page products state
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [loadingNewProducts, setLoadingNewProducts] = useState(false);

  // Brands state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Parse pathname and query
  const [pathname, search] = useMemo(() => {
    const [pathPart, searchPart = ''] = path.split('?');
    return [pathPart, searchPart ? `?${searchPart}` : ''] as const;
  }, [path]);

  const q = useMemo(() => new URLSearchParams(search), [search]);

  // Helper functions
  const openProduct = (id: string) => nav(`/product/${id}`);
  const addProduct = (id: string) => addToCart(id);

  // Load new products
  const loadNewProducts = async () => {
    try {
      setLoadingNewProducts(true);
      const response = await webApiService.product.getProducts({
        page: '1',
        limit: '10',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setNewProducts(response.data || []);
    } catch (error: any) {
      console.error('Failed to load new products:', error);
      setNewProducts([...products].reverse().slice(0, 10));
    } finally {
      setLoadingNewProducts(false);
    }
  };

  // Load brands
  const loadBrands = async () => {
    try {
      setLoadingBrands(true);
      const response = await brandService.getBrands({
        page: '1',
        listNum: '5',
        withItems: true,
        itemListNum: '6',
        sortBy: 'totalProducts',
        sortOrder: 'desc'
      });
      setBrands(response.brands);
    } catch (error) {
      console.error('Failed to load brands:', error);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  // Expose nav to window for WebView
  useEffect(() => {
    (window as any).__appNavigate = nav;
    console.log('[Router] Navigation function exposed to window.__appNavigate');

    return () => {
      delete (window as any).__appNavigate;
    };
  }, [nav]);

  // Initial data loading
  useEffect(() => {
    loadNewProducts();
    loadBrands();
  }, []);

  // Determine page type
  const isSellerPage = pathname.startsWith('/seller');
  const isAdminPage = pathname.startsWith('/admin');
  const isChatPage = pathname === '/chat' || pathname.startsWith('/chat/');

  // Route matching and screen rendering
  let screen: React.ReactNode;

  // ==================== Chat Routes ====================
  const mChatRoom = pathname.match(/^\/chat\/(.+)$/);
  if (mChatRoom) {
    screen = <ChatRoomPage nav={nav} roomId={decodeURIComponent(mChatRoom[1])} />;
  }
  // ==================== Product Routes ====================
  else if (pathname.match(/^\/product\/(.+)\/custom-order$/)) {
    const mCustomOrder = pathname.match(/^\/product\/(.+)\/custom-order$/)!;
    screen = (
      <CustomOrderFlow
        productId={decodeURIComponent(mCustomOrder[1])}
        onBack={() => nav(`/product/${decodeURIComponent(mCustomOrder[1])}`)}
        onGo={nav}
      />
    );
  }
  else if (pathname.match(/^\/product\/(.+)$/)) {
    const mDetail = pathname.match(/^\/product\/(.+)$/)!;
    screen = (
      <Detail
        id={decodeURIComponent(mDetail[1])}
        onBack={() => history.back()}
        onAdd={addProduct}
        onCartUpdate={loadCartCount}
        currentUser={currentUser}
        onGo={nav}
      />
    );
  }
  // ==================== Brand Routes ====================
  else if (pathname.startsWith('/brand/') && pathname.split('/').length === 3) {
    const sellerUuid = pathname.split('/')[2];
    screen = (
      <BrandDetailPage
        sellerUuid={sellerUuid}
        onGo={nav}
        onOpen={openProduct}
        onAdd={addProduct}
        onLike={handleLike}
        likedProducts={likedProducts}
        onBrandLike={handleBrandLike}
        isBrandLiked={likedBrands.includes(sellerUuid)}
      />
    );
  }
  else if (pathname.startsWith('/brands')) {
    screen = (
      <BrandsPage
        onGo={nav}
        onOpen={openProduct}
        onAdd={addProduct}
        onLike={handleLike}
        likedProducts={likedProducts}
      />
    );
  }
  // ==================== Browse Routes ====================
  else if (pathname.startsWith('/snap')) {
    screen = <SnapPage onGo={nav} onOpen={openProduct} />;
  }
  else if (pathname.startsWith('/news')) {
    const m = pathname.match(/^\/news\/(.+)$/);
    if (m) {
      screen = <NewsArticle slug={decodeURIComponent(m[1])} onGo={nav} onOpenProduct={openProduct} />;
    } else {
      screen = <NewsPage onGo={nav} onOpenProduct={openProduct} />;
    }
  }
  else if (pathname.startsWith('/ranking')) {
    screen = (
      <RankingPage
        onGo={nav}
        onOpen={openProduct}
        onAdd={addProduct}
        onLike={handleLike}
        likedProducts={likedProducts}
      />
    );
  }
  else if (pathname.startsWith('/sale')) {
    screen = (
      <>
        <TitleBar title="세일" />
        <ProductGrid
          title="할인 중"
          items={products.filter(p => p.sale)}
          onOpen={openProduct}
          onAdd={addProduct}
          onLike={handleLike}
          onGo={nav}
          likedProducts={likedProducts}
        />
      </>
    );
  }
  else if (pathname.startsWith('/recommend')) {
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
  }
  else if (pathname.startsWith('/new')) {
    screen = (
      <NewProductsPage
        onGo={nav}
        onOpen={openProduct}
        onAdd={addProduct}
        onLike={handleLike}
        likedProducts={likedProducts}
      />
    );
  }
  else if (pathname.startsWith('/trend')) {
    screen = (
      <>
        <TitleBar title="트렌드" />
        <ProductGrid
          title="지금 뜨는 상품"
          items={[...products].sort((a, b) => (Number(b.sale) || 0) - (Number(a.sale) || 0))}
          onOpen={openProduct}
          onAdd={addProduct}
          onLike={handleLike}
          onGo={nav}
          likedProducts={likedProducts}
        />
      </>
    );
  }
  else if (pathname.startsWith('/promo/') && pathname !== '/promo/plus') {
    const slug = pathname.split('/').pop();
    screen = (
      <>
        <TitleBar title={`프로모션: ${slug}`} desc="프로모션 기획전" />
        <SectionRow
          title="기획전 상품"
          items={[...products]}
          onOpen={openProduct}
          onAdd={addProduct}
          onLike={handleLike}
          onGo={nav}
          likedProducts={likedProducts}
        />
      </>
    );
  }
  else if (pathname.startsWith('/cat/')) {
    const parts = pathname.split('/').slice(2).map(decodeURIComponent);
    const [categoryType = '', categoryValue = ''] = parts;

    // 'all' 값은 지원하지 않음 - 카테고리 페이지로 리다이렉트
    if (categoryValue === 'all' || !categoryValue) {
      nav('/category');
      return null;
    }

    screen = (
      <CategoryPage
        categoryType={categoryType}
        categoryValue={categoryValue}
        onGo={nav}
        onOpen={openProduct}
        onAdd={addProduct}
        onLike={handleLike}
        likedProducts={likedProducts}
      />
    );
  }
  else if (pathname.startsWith('/search')) {
    const keyword = q.get('q') ?? '';
    screen = (
      <SearchResultsPage
        searchQuery={keyword}
        onOpen={openProduct}
        onAdd={addProduct}
        onLike={handleLike}
        likedProducts={likedProducts}
      />
    );
  }
  // ==================== Cart & Checkout Routes ====================
  else if (pathname.startsWith('/cart')) {
    screen = (
      <CartContent
        key={pathname}
        mode="page"
        onBack={() => history.back()}
        onCheckout={handleCheckout}
        onCartUpdate={loadCartCount}
        currentUser={currentUser}
        showToast={showToast}
      />
    );
  }
  else if (pathname === '/checkout') {
    screen = (
      <RequireAuth>
        <CheckoutPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/category') {
    screen = (
      <CategoryModal
        isOpen={true}
        onClose={() => history.back()}
        onNavigate={nav}
        isPage={true}
        cartCount={cartCount}
        onCart={handleCartClick}
      />
    );
  }
  // ==================== Payment Routes ====================
  else if (pathname === '/payment/success') {
    screen = <PaymentSuccess onGo={nav} />;
  }
  else if (pathname === '/payment/result') {
    screen = <PaymentSuccess onGo={nav} />;
  }
  else if (pathname === '/payment/cancel') {
    screen = <PaymentCancel onGo={nav} />;
  }
  else if (pathname === '/payment/fail') {
    screen = <PaymentFail onGo={nav} />;
  }
  else if (pathname === '/payment/test') {
    screen = <PaymentTest onGo={nav} />;
  }
  else if (pathname.match(/^\/orders\/(.+)$/)) {
    const orderId = pathname.split('/')[2];
    screen = (
      <RequireAuth>
        <OrderCompletePage onGo={nav} orderId={orderId} />
      </RequireAuth>
    );
  }
  // ==================== Support Routes ====================
  else if (pathname.startsWith('/help')) {
    screen = <HelpPage onGo={nav} />;
  }
  else if (pathname.startsWith('/likes')) {
    screen = (
      <RequireAuth>
        <LikesPage onGo={nav} onOpen={openProduct} onAdd={addProduct} onLike={handleLike} />
      </RequireAuth>
    );
  }
  // ==================== My Page Routes ====================
  else if (pathname === '/my/orders') {
    screen = (
      <RequireAuth>
        <OrdersPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/shipping-address') {
    screen = (
      <RequireAuth>
        <ShippingAddressPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/shipping') {
    screen = (
      <RequireAuth>
        <ShippingPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/claims') {
    screen = (
      <RequireAuth>
        <ClaimsPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/cancel') {
    screen = (
      <RequireAuth>
        <CancelPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/reviews') {
    screen = (
      <RequireAuth>
        <ReviewsPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/coupons') {
    screen = (
      <RequireAuth>
        <CouponsPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/points') {
    screen = (
      <RequireAuth>
        <PointsPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/payments') {
    screen = (
      <RequireAuth>
        <PaymentsPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/notifications') {
    screen = (
      <RequireAuth>
        <NotificationsPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/settings') {
    screen = (
      <RequireAuth>
        <SettingsPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/chat') {
    // ChatPage uses ChatUser interface (uuid, email, name)
    // shared User uses 'id' instead of 'uuid' (value is uuid format)
    const chatUser = currentUser ? {
      uuid: currentUser.id,
      email: currentUser.email,
      name: currentUser.name
    } : null;
    screen = <ChatPage nav={nav} currentUser={chatUser} />;
  }
  else if (pathname.startsWith('/chat/')) {
    const roomId = pathname.split('/')[2];
    screen = <ChatRoomPage nav={nav} roomId={roomId} />;
  }
  // ==================== Seller Registration Routes ====================
  else if (pathname === '/seller/register') {
    screen = (
      <RequireAuth>
        <SellerRegistrationPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/seller/apply') {
    screen = (
      <RequireAuth>
        <SellerApplicationForm onGo={nav} />
      </RequireAuth>
    );
  }
  // ==================== Contact & Footer Routes ====================
  else if (pathname === '/support/contact') {
    screen = <ContactPage onGo={nav} />;
  }
  else if (pathname === '/support/faq') {
    screen = <FaqPage onGo={nav} />;
  }
  else if (pathname === '/promo/plus') {
    screen = <PromoPage onGo={nav} />;
  }
  else if (pathname === '/about/회사 소개') {
    screen = <AboutCompanyPage onGo={nav} />;
  }
  else if (pathname === '/about/비즈니스 소개') {
    screen = <AboutBusinessPage onGo={nav} />;
  }
  else if (pathname === '/about/뉴스룸') {
    screen = <AboutNewsroomPage onGo={nav} />;
  }
  else if (pathname === '/about/채용 정보') {
    screen = <AboutCareersPage onGo={nav} />;
  }
  else if (pathname === '/about/공지사항') {
    screen = <AboutNoticePage onGo={nav} />;
  }
  else if (pathname === '/contact-inquiry') {
    screen = <ContactInquiryPageSimple onGo={nav} />;
  }
  else if (pathname === '/footer-faq') {
    screen = <FaqPageSimple onGo={nav} />;
  }
  else if (pathname === '/about-company') {
    screen = <AboutCompanyPageSimple onGo={nav} />;
  }
  else if (pathname === '/about-business') {
    screen = <AboutBusinessPageSimple onGo={nav} />;
  }
  else if (pathname === '/about-newsroom') {
    screen = <AboutNewsroomPageSimple onGo={nav} />;
  }
  else if (pathname === '/about-careers') {
    screen = <AboutCareersPageSimple onGo={nav} />;
  }
  else if (pathname === '/about-notice') {
    screen = <AboutNoticePageSimple onGo={nav} />;
  }
  else if (pathname.startsWith('/partner/')) {
    const type = decodeURIComponent(pathname.split('/').pop() || '');
    screen = <PartnerInquiryPage onGo={nav} type={type} />;
  }
  else if (pathname.startsWith('/policy/')) {
    const policyType = pathname.split('/').pop() || '';
    screen = <PolicyPage onGo={nav} type={policyType} />;
  }
  else if (pathname.startsWith('/sns/')) {
    const platform = pathname.split('/').pop() || '';
    screen = <SnsPage onGo={nav} platform={platform} />;
  }
  // ==================== Seller Center Routes ====================
  else if (pathname === '/seller') {
    screen = (
      <RequireAuth>
        <SellerDashboard onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/seller/brand') {
    screen = (
      <RequireAuth>
        <BrandManagement onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/seller/products') {
    screen = (
      <RequireAuth>
        <SellerProducts onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/seller/products/new') {
    screen = (
      <RequireAuth>
        <SellerProductForm onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname.match(/^\/seller\/products\/(.+)\/edit$/)) {
    const productUuid = pathname.split('/')[3];
    screen = (
      <RequireAuth>
        <SellerProductForm onGo={nav} productUuid={productUuid} />
      </RequireAuth>
    );
  }
  else if (pathname === '/seller/coupons') {
    screen = (
      <RequireAuth>
        <CouponManagement onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/seller/orders') {
    screen = (
      <RequireAuth>
        <SellerOrders onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/seller/reviews') {
    screen = (
      <RequireAuth>
        <SellerReviews onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/seller/analytics') {
    screen = (
      <RequireAuth>
        <SellerAnalytics onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/seller/settlement') {
    screen = (
      <RequireAuth>
        <SellerSettlement onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/seller/production') {
    screen = (
      <RequireAuth>
        <ProductionSettings onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/seller/production/status') {
    screen = (
      <RequireAuth>
        <ProductionStatus onGo={nav} />
      </RequireAuth>
    );
  }
  // ==================== Admin Routes ====================
  else if (pathname.startsWith('/admin')) {
    if (pathname === '/admin' || pathname === '/admin/') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <AdminDashboardContent nav={nav} currentUser={currentUser} />
        </AdminLayout>
      );
    } else if (pathname === '/admin/users') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <UserManagement />
        </AdminLayout>
      );
    } else if (pathname === '/admin/sellers') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <SellerManagement />
        </AdminLayout>
      );
    } else if (pathname === '/admin/orders') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <AdminOrderManagement />
        </AdminLayout>
      );
    } else if (pathname === '/admin/products') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <AdminProductManagement />
        </AdminLayout>
      );
    } else if (pathname === '/admin/seller-applications') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <SellerApplicationManagement />
        </AdminLayout>
      );
    } else if (pathname === '/admin/categories') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <CategoryManagement />
        </AdminLayout>
      );
    } else if (pathname === '/admin/banners') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <BannerManagement />
        </AdminLayout>
      );
    } else if (pathname === '/admin/coupons') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <AdminCouponManagement />
        </AdminLayout>
      );
    } else {
      // Admin 404
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
  }
  // ==================== My Page Main ====================
  else if (pathname.startsWith('/my')) {
    screen = (
      <RequireAuth>
        <MyPage onGo={nav} onOpen={openProduct} />
      </RequireAuth>
    );
  }
  // ==================== Auth Routes ====================
  // /login과 /signup은 모달로 처리 - 홈으로 리다이렉트하고 모달 열기
  else if (pathname.startsWith('/login')) {
    screen = <AuthRedirect nav={nav} openModal={openLogin} />;
  }
  else if (pathname === '/auth/naver/callback') {
    screen = <NaverCallbackPage onGo={nav} />;
  }
  else if (pathname === '/auth/kakao/callback') {
    screen = <KakaoCallbackPage onGo={nav} />;
  }
  else if (pathname.startsWith('/auth/social/signup')) {
    screen = <SocialSignupPage onGo={nav} />;
  }
  else if (pathname.startsWith('/signup')) {
    screen = <AuthRedirect nav={nav} openModal={openSignup} />;
  }
  // ==================== Home ====================
  else {
    screen = (
      <HomeContent
        nav={nav}
        openProduct={openProduct}
        addProduct={addProduct}
        handleLike={handleLike}
        likedProducts={likedProducts}
        newProducts={newProducts}
        loadingNewProducts={loadingNewProducts}
        brands={brands}
        loadingBrands={loadingBrands}
      />
    );
  }

  // Wrap with appropriate layout
  if (isSellerPage || isAdminPage || isChatPage) {
    // Seller, Admin, Chat pages have their own layouts
    return <>{screen}</>;
  }

  // Main layout for all other pages
  return (
    <MainLayout pathname={pathname}>
      {screen}
    </MainLayout>
  );
}

/**
 * 홈 화면 컨텐츠 컴포넌트
 */
interface HomeContentProps {
  nav: (to: string) => void;
  openProduct: (id: string) => void;
  addProduct: (id: string) => void;
  handleLike: (id: string) => void;
  likedProducts: string[];
  newProducts: Product[];
  loadingNewProducts: boolean;
  brands: Brand[];
  loadingBrands: boolean;
}

function HomeContent({
  nav,
  openProduct,
  addProduct,
  handleLike,
  likedProducts,
  newProducts,
  loadingNewProducts,
  brands,
  loadingBrands,
}: HomeContentProps) {
  return (
    <>
      <EventBanners onGo={nav} />
      <SectionRow
        title="신상 제품"
        items={newProducts}
        loading={loadingNewProducts}
        onOpen={openProduct}
        onAdd={addProduct}
        onLike={handleLike}
        onGo={nav}
        likedProducts={likedProducts}
      />

      {/* 브랜드별 상품 섹션 */}
      {loadingBrands ? (
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      ) : (
        <div>
          {brands.filter(brand => brand.stats.totalProducts > 0).map((brand, brandIdx) => (
            <section key={brand.sellerUuid || `brand-section-${brandIdx}`} className="mx-auto max-w-7xl px-4 mt-6">
              <div className="mb-3 flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-semibold">{brand.brandName}</h2>
                  <span className="text-xs text-gray-500">{brand.stats.totalProducts}개 상품</span>
                </div>
                <button
                  onClick={() => nav(`/brand/${encodeURIComponent(brand.sellerUuid)}`)}
                  className="text-xs text-gray-500 hover:text-blue-600"
                >
                  더보기
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 md:flex md:gap-4 md:overflow-x-auto md:snap-x pb-2">
                {brand.products?.filter(Boolean).slice(0, 6).map((p, idx) => {
                  const productId = p.productUuid;
                  return (
                    <div key={`brand-${brandIdx}-product-${idx}`} className="md:snap-start md:flex-shrink-0">
                      <ProductCard
                        p={p}
                        onOpen={openProduct}
                        onAdd={addProduct}
                        onLike={handleLike}
                        onGo={nav}
                        isLiked={likedProducts.includes(productId)}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * 관리자 대시보드 컨텐츠 컴포넌트
 */
interface AdminDashboardContentProps {
  nav: (to: string) => void;
  currentUser: any;
}

function AdminDashboardContent({ nav, currentUser }: AdminDashboardContentProps) {
  return (
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
        <DashboardCard
          title="사용자 관리"
          description="사용자 계정 및 권한을 관리합니다"
          icon={<UserIcon />}
          color="blue"
          onClick={() => nav('/admin/users')}
        />
        <DashboardCard
          title="판매자 관리"
          description="판매자 승인 및 관리를 합니다"
          icon={<BuildingIcon />}
          color="purple"
          onClick={() => nav('/admin/sellers')}
        />
        <DashboardCard
          title="주문 관리"
          description="전체 주문을 관리합니다"
          icon={<BoxIcon />}
          color="green"
          onClick={() => nav('/admin/orders')}
        />
        <DashboardCard
          title="상품 관리"
          description="전체 상품을 관리합니다"
          icon={<ShoppingBagIcon />}
          color="yellow"
          onClick={() => nav('/admin/products')}
        />
      </div>

      {/* 빠른 액세스 섹션 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 액세스</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAccessButton title="사용자 목록" color="blue" onClick={() => nav('/admin/users')} icon={<UserIcon size="sm" />} />
          <QuickAccessButton title="판매자 관리" color="purple" onClick={() => nav('/admin/sellers')} icon={<BuildingIcon size="sm" />} />
          <QuickAccessButton title="주문 관리" color="green" onClick={() => nav('/admin/orders')} icon={<BoxIcon size="sm" />} />
          <QuickAccessButton title="상품 관리" color="yellow" onClick={() => nav('/admin/products')} icon={<ShoppingBagIcon size="sm" />} />
        </div>
      </div>
    </div>
  );
}

// Admin Dashboard Helper Components
interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'yellow';
  onClick: () => void;
}

function DashboardCard({ title, description, icon, color, onClick }: DashboardCardProps) {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', hover: 'group-hover:bg-blue-200', btn: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' },
    purple: { bg: 'bg-purple-100', hover: 'group-hover:bg-purple-200', btn: 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' },
    green: { bg: 'bg-green-100', hover: 'group-hover:bg-green-200', btn: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' },
    yellow: { bg: 'bg-yellow-100', hover: 'group-hover:bg-yellow-200', btn: 'from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800' },
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
      <div className="flex items-center mb-4">
        <div className={`p-3 ${colorClasses[color].bg} rounded-lg ${colorClasses[color].hover} transition-colors`}>
          {icon}
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            활성
          </span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <button
        onClick={onClick}
        className={`w-full px-4 py-2.5 bg-gradient-to-r ${colorClasses[color].btn} text-white rounded-lg transition-all duration-200 font-medium`}
      >
        관리하기
      </button>
    </div>
  );
}

interface QuickAccessButtonProps {
  title: string;
  color: 'blue' | 'purple' | 'green' | 'yellow';
  onClick: () => void;
  icon: React.ReactNode;
}

function QuickAccessButton({ title, color, onClick, icon }: QuickAccessButtonProps) {
  const colorClasses = {
    blue: { hover: 'hover:bg-blue-50 hover:border-blue-300', iconBg: 'bg-blue-100 group-hover:bg-blue-200', text: 'group-hover:text-blue-700' },
    purple: { hover: 'hover:bg-purple-50 hover:border-purple-300', iconBg: 'bg-purple-100 group-hover:bg-purple-200', text: 'group-hover:text-purple-700' },
    green: { hover: 'hover:bg-green-50 hover:border-green-300', iconBg: 'bg-green-100 group-hover:bg-green-200', text: 'group-hover:text-green-700' },
    yellow: { hover: 'hover:bg-yellow-50 hover:border-yellow-300', iconBg: 'bg-yellow-100 group-hover:bg-yellow-200', text: 'group-hover:text-yellow-700' },
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center p-3 text-left rounded-lg border border-gray-200 ${colorClasses[color].hover} transition-colors group`}
    >
      <div className={`p-2 ${colorClasses[color].iconBg} rounded-lg mr-3`}>
        {icon}
      </div>
      <span className={`text-sm font-medium text-gray-700 ${colorClasses[color].text}`}>{title}</span>
    </button>
  );
}

// Icons
function UserIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <svg className={`${sizeClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

function BuildingIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <svg className={`${sizeClass} text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function BoxIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <svg className={`${sizeClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function ShoppingBagIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <svg className={`${sizeClass} text-yellow-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

/**
 * Auth 리다이렉트 컴포넌트
 * /login, /signup 경로 접근 시 홈으로 리다이렉트하고 모달 열기
 */
function AuthRedirect({ nav, openModal }: { nav: (to: string) => void; openModal: () => void }) {
  useEffect(() => {
    nav('/');
    // 약간의 딜레이 후 모달 열기 (네비게이션 완료 후)
    const timer = setTimeout(() => {
      openModal();
    }, 50);
    return () => clearTimeout(timer);
  }, [nav, openModal]);

  return null;
}
