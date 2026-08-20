import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMiniRouter } from './utils';
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
import { SectionRow, TitleBar } from './components/product/ProductGrid';
import { ProductCard } from './components/product/ProductCard';
import { Detail } from './components/product/Detail';
import { CustomOrderFlow, BrandCustomOrderFlow } from './components/product/custom-order';
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
import { BannerDetailPage } from './components/event/BannerDetailPage';
import { EventListPage } from './components/event/EventListPage';

// Community Components
import SnapFeed from './components/snap/SnapFeed';
import UserProfilePage from './components/profile/UserProfilePage';
import DiscoverPage from './components/discover/DiscoverPage';
import { COMMUNITY_NAV_ENABLED } from './config/navigationConfig';
import { SEOHead } from './components/common/SEOHead';

// MyPage Components
import {
  OrdersPage,
  ShippingPage,
  ClaimsPage,
  CancelPage,
  ReviewsPage,
  CouponsPage,
  PointsPage,
  // PaymentsPage, // 토스페이먼츠 사용 예정으로 비활성화
  NailSizesPage
} from './components/pages/MyPages';

// Support Components
import {
  ContactPage,
  FaqPage,
  SettingsPage,
  PromoPage
} from './components/pages/SupportPages';
import { NotificationsInboxPage } from './components/pages/NotificationsInboxPage';

// Custom Order Pages
import { PublicCustomOrderPage } from './components/pages/PublicCustomOrderPage';
import { CustomOrderManagementPage } from './components/pages/CustomOrderManagementPage';
import { CustomOrderDetailPage } from './components/pages/CustomOrderDetailPage';
import { SellerPublicOrdersPage } from './components/pages/SellerPublicOrdersPage';
import { SellerPublicOrderDetailPage } from './components/pages/SellerPublicOrderDetailPage';

// Design Tool Pages
import { DesignToolPage } from './components/pages/DesignToolPage';
import { DesignToolSubscriptionPage } from './components/pages/DesignToolSubscriptionPage';
import { DesignToolPaymentResultPage } from './components/pages/DesignToolPaymentResultPage';
import { DesignToolBillingHistoryPage } from './components/pages/DesignToolBillingHistoryPage';
import DesignToolManagement from './components/admin/DesignToolManagement';

// Seller Components

// Checkout and Order Components
import { CheckoutPage } from './components/pages/CheckoutPage';
import { OrderCompletePage } from './components/pages/OrderCompletePage';
import { TrackShipmentPage } from './components/pages/TrackShipmentPage';
import { ShippingAddressPage } from './components/pages/ShippingAddressPage';

// Payment Components
import { PaymentSuccess } from './components/pages/PaymentSuccess';
import { PaymentCancel } from './components/pages/PaymentCancel';
import { PaymentFail } from './components/pages/PaymentFail';
import { PaymentTest } from './components/pages/PaymentTest';

// OAuth Callback Components
import { NaverCallbackPage } from './components/pages/NaverCallbackPage';
import { KakaoCallbackPage } from './components/pages/KakaoCallbackPage';
import { GoogleCallbackPage } from './components/pages/GoogleCallbackPage';
import { AppleCallbackPage } from './components/pages/AppleCallbackPage';

// Landing Pages
import { HandyStudioPage } from './components/pages/HandyStudioPage';

// Portfolio (독립 공간 - 링크 진입 전용)
import { PortfolioPage } from './components/pages/PortfolioPage';

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
import { BulkProductUpload } from './components/pages/seller/BulkProductUpload';
import { ReturnRequestManagement } from './components/pages/seller/ReturnRequestManagement';

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
import SnapManagement from './components/admin/SnapManagement';
import ChatReportManagement from './components/admin/ChatReportManagement';
import DecorationManagement from './components/admin/decoration';
import AnnouncementManagement from './components/admin/announcement';
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
  const { openLogin } = useAuthModal();

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
      setNewProducts([]);
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
  const isCustomOrderPage = /^\/product\/.+\/custom-order$/.test(pathname) || pathname === '/custom-order/new';
  const isPortfolioPage = pathname === '/DongHyun/portfolio';

  // Route matching and screen rendering
  let screen: React.ReactNode;

  // ==================== Portfolio (독립 공간 - 링크 진입 전용) ====================
  if (isPortfolioPage) {
    screen = <PortfolioPage nav={nav} />;
  }
  // ==================== Chat Routes ====================
  else if (pathname.match(/^\/chat\/(.+)$/)) {
    const mChatRoom = pathname.match(/^\/chat\/(.+)$/)!;
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
  // ==================== Event Banner Routes ====================
  else if (pathname === '/event') {
    screen = (
      <EventListPage onGo={nav} />
    );
  }
  else if (pathname.match(/^\/event\/(.+)$/)) {
    const mEvent = pathname.match(/^\/event\/(.+)$/)!;
    screen = (
      <BannerDetailPage
        bannerId={decodeURIComponent(mEvent[1])}
        onGo={nav}
      />
    );
  }
  // ==================== Brand Routes ====================
  else if (pathname.match(/^\/brand\/(.+)\/custom-order$/)) {
    const mBrandOrder = pathname.match(/^\/brand\/(.+)\/custom-order$/)!;
    const brandSellerUuid = decodeURIComponent(mBrandOrder[1]);
    const brandNameParam = q.get('brandName') || '';
    screen = (
      <BrandCustomOrderFlow
        sellerUuid={brandSellerUuid}
        brandName={decodeURIComponent(brandNameParam)}
        onBack={() => nav(`/brand/${brandSellerUuid}`)}
        onGo={nav}
      />
    );
  }
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
  // ==================== Community Routes ====================
  else if (pathname.match(/^\/user\/(.+)$/)) {
    const mUser = pathname.match(/^\/user\/(.+)$/)!;
    screen = (
      <UserProfilePage
        userUuid={decodeURIComponent(mUser[1])}
        onGo={nav}
        onOpen={openProduct}
        initialView={(q.get('tab') as 'grid' | 'followers' | 'following') || 'grid'}
      />
    );
  }
  else if (pathname === '/discover') {
    screen = <DiscoverPage onGo={nav} onOpen={openProduct} />;
  }
  else if (pathname === '/shop') {
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
  // ==================== Browse Routes ====================
  else if (pathname === '/snap/new') {
    screen = <SnapPage onGo={nav} onOpen={openProduct} initialUpload />;
  }
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
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-2">세일 상품 준비 중</p>
          <p className="text-sm">곧 할인 상품이 등록됩니다</p>
        </div>
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
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-2">트렌드 준비 중</p>
          <p className="text-sm">곧 인기 상품이 업데이트됩니다</p>
        </div>
      </>
    );
  }
  else if (pathname.startsWith('/promo/') && pathname !== '/promo/plus') {
    const slug = pathname.split('/').pop();
    screen = (
      <>
        <TitleBar title={`프로모션: ${slug}`} desc="프로모션 기획전" />
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-2">기획전 준비 중</p>
          <p className="text-sm">곧 프로모션 상품이 등록됩니다</p>
        </div>
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
  else if (pathname.match(/^\/orders\/[^/]+\/track$/)) {
    // 배송조회 — 일반 주문상세 매칭보다 먼저 등록해야 한다
    const orderId = pathname.split('/')[2];
    screen = (
      <RequireAuth>
        <TrackShipmentPage onGo={nav} orderId={orderId} />
      </RequireAuth>
    );
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
  // 토스페이먼츠 사용 예정으로 결제수단 관리 페이지 비활성화
  // else if (pathname === '/my/payments') {
  //   screen = (
  //     <RequireAuth>
  //       <PaymentsPage onGo={nav} />
  //     </RequireAuth>
  //   );
  // }
  else if (pathname === '/my/nail-sizes') {
    screen = (
      <RequireAuth>
        <NailSizesPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/notifications') {
    screen = (
      <RequireAuth>
        <NotificationsInboxPage onGo={nav} />
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
    // shared User 의 식별자는 userUuid 다
    const chatUser = currentUser ? {
      uuid: currentUser.userUuid,
      email: currentUser.email,
      name: currentUser.name
    } : null;
    screen = <ChatPage nav={nav} currentUser={chatUser} />;
  }
  else if (pathname.startsWith('/chat/')) {
    const roomId = pathname.split('/')[2];
    screen = <ChatRoomPage nav={nav} roomId={roomId} />;
  }
  // ==================== Custom Order Routes ====================
  else if (pathname === '/custom-order/new') {
    screen = (
      <RequireAuth>
        <PublicCustomOrderPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname.match(/^\/my\/custom-orders\/(.+)$/)) {
    const uuid = pathname.split('/')[3];
    screen = (
      <RequireAuth>
        <CustomOrderDetailPage uuid={uuid} onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/custom-orders') {
    screen = (
      <RequireAuth>
        <CustomOrderManagementPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname.match(/^\/seller\/custom-orders\/public\/(.+)$/)) {
    const uuid = pathname.split('/')[4];
    screen = (
      <RequireAuth>
        <SellerPublicOrderDetailPage uuid={uuid} onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/seller/custom-orders/public') {
    screen = (
      <RequireAuth>
        <SellerPublicOrdersPage onGo={nav} />
      </RequireAuth>
    );
  }
  // ==================== Design Tool Routes ====================
  else if (pathname === '/design-tool') {
    screen = (
      <RequireAuth>
        <DesignToolSubscriptionPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/design-tool/subscription') {
    screen = (
      <RequireAuth>
        <DesignToolPage onGo={nav} />
      </RequireAuth>
    );
  }
  else if (pathname === '/design-tool/payment/success') {
    screen = (
      <RequireAuth>
        <DesignToolPaymentResultPage onGo={nav} type="success" />
      </RequireAuth>
    );
  }
  else if (pathname === '/design-tool/payment/fail') {
    screen = (
      <RequireAuth>
        <DesignToolPaymentResultPage onGo={nav} type="fail" />
      </RequireAuth>
    );
  }
  else if (pathname === '/my/billing/design-tool') {
    screen = (
      <RequireAuth>
        <DesignToolBillingHistoryPage onGo={nav} />
      </RequireAuth>
    );
  }
  // ==================== Seller Registration Routes ====================
  else if (pathname === '/seller/register') {
    screen = (
      <RequireAuth>
        <SellerApplicationForm onGo={nav} />
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
  else if (pathname === '/handy-studio') {
    screen = <HandyStudioPage onGo={nav} />;
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
  else if (pathname === '/seller/products/bulk-upload') {
    screen = (
      <RequireAuth>
        <BulkProductUpload onGo={nav} />
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
  else if (pathname === '/seller/returns') {
    screen = (
      <RequireAuth>
        <ReturnRequestManagement onGo={nav} />
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
    } else if (pathname === '/admin/chat-reports') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <ChatReportManagement />
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
    } else if (pathname === '/admin/snaps') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <SnapManagement />
        </AdminLayout>
      );
    } else if (pathname === '/admin/design-tool') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <DesignToolManagement />
        </AdminLayout>
      );
    } else if (pathname === '/admin/decorations') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <DecorationManagement />
        </AdminLayout>
      );
    } else if (pathname === '/admin/announcements') {
      screen = (
        <AdminLayout currentUser={currentUser} authLoading={authLoading}>
          <AnnouncementManagement />
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
              className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-600"
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
  else if (pathname === '/auth/google/callback') {
    screen = <GoogleCallbackPage onGo={nav} />;
  }
  else if (pathname === '/auth/apple/callback') {
    screen = <AppleCallbackPage onGo={nav} />;
  }
  else if (pathname.startsWith('/auth/social/signup')) {
    screen = <SocialSignupPage onGo={nav} />;
  }
  else if (pathname.startsWith('/signup')) {
    // 이메일 회원가입 비활성화 — /signup 접근 시 로그인 모달로 전환
    screen = <AuthRedirect nav={nav} openModal={openLogin} />;
  }
  // ==================== Home ====================
  else if (pathname === '/') {
    screen = COMMUNITY_NAV_ENABLED ? (
      <CommunityHome
        nav={nav}
        openProduct={openProduct}
      />
    ) : (
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
  // ==================== 404 ====================
  // 기존에는 매칭 실패 시 홈이 조용히 렌더되어 오타·만료 링크가 무해화됐다
  else {
    screen = (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-6xl font-bold text-brand mb-4">404</p>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h1>
          <p className="text-sm text-gray-500 mb-8">주소가 잘못되었거나, 삭제되었거나, 이동된 페이지입니다.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              이전 페이지
            </button>
            <button
              onClick={() => nav('/')}
              className="px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-600"
            >
              홈으로 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SEO meta tags based on route
  const seoProps = useMemo(() => {
    if (pathname === '/' || pathname === '/shop') return { path: '/' };
    if (pathname === '/category') return { title: '카테고리', description: '네일아트 카테고리별 상품을 찾아보세요.', path: '/category' };
    if (pathname === '/brands') return { title: '브랜드', description: '다양한 네일 브랜드를 만나보세요.', path: '/brands' };
    if (pathname === '/discover') return { title: '디스커버', description: '새로운 네일 트렌드를 발견하세요.', path: '/discover' };
    if (pathname === '/ranking') return { title: '랭킹', description: '인기 네일 상품 랭킹을 확인하세요.', path: '/ranking' };
    if (pathname === '/event') return { title: '이벤트', description: '진행 중인 이벤트와 프로모션을 확인하세요.', path: '/event' };
    if (pathname.startsWith('/brand/')) return { title: '브랜드 상세', path: pathname };
    if (pathname.startsWith('/product/')) return { title: '상품 상세', path: pathname };
    if (pathname === '/my/orders') return { title: '주문 내역', path: '/my/orders' };
    if (pathname === '/my/points') return { title: '포인트', path: '/my/points' };
    if (pathname === '/my/coupons') return { title: '쿠폰', path: '/my/coupons' };
    return { path: pathname };
  }, [pathname]);

  // Portfolio: 완전 독립 - 레이아웃/기본 SEOHead 미적용 (자체 Helmet으로 noindex 처리)
  if (isPortfolioPage) {
    return <>{screen}</>;
  }

  // Wrap with appropriate layout
  if (isSellerPage || isAdminPage || isChatPage || isCustomOrderPage) {
    // Seller, Admin, Chat pages have their own layouts
    return <>
      <SEOHead {...seoProps} />
      {screen}
    </>;
  }

  // Main layout for all other pages
  return (
    <MainLayout pathname={pathname}>
      <SEOHead {...seoProps} />
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
  const { t } = useTranslation('common');
  return (
    <>
      <EventBanners onGo={nav} />

      {/* Custom Order CTA */}
      <div className="mx-auto max-w-7xl px-4 mt-4">
        <button
          onClick={() => nav('/custom-order/new')}
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FF6B8A 0%, #FF8E9E 50%, #FFB5C0 100%)',
          }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex flex-col items-start gap-1">
              <span className="text-white text-[15px] font-bold">{t('home.customOrderTitle')}</span>
              <span className="text-white/80 text-xs">{t('home.customOrderDesc')}</span>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M13.477 10.754L8.477 15.754a1.063 1.063 0 01-1.504-1.504L11.22 10 6.973 5.754a1.063 1.063 0 011.504-1.504l5 5a1.063 1.063 0 010 1.504z" fill="white"/>
              </svg>
            </div>
          </div>
        </button>
      </div>

      <SectionRow
        title={t('home.newProducts')}
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
                  <span className="text-xs text-gray-500">{t('home.productCount', { count: brand.stats.totalProducts })}</span>
                </div>
                <button
                  onClick={() => nav(`/brand/${encodeURIComponent(brand.sellerUuid)}`)}
                  className="text-xs text-gray-500 hover:text-blue-600"
                >
                  {t('home.seeMore')}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 md:flex md:gap-4 md:overflow-x-auto md:snap-x pb-2">
                {brand.products?.filter(Boolean).slice(0, 6).map((p, idx) => {
                  const productId = p.productUuid || (p as any).id || (p as any).productId;
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
 * 커뮤니티 홈 컨텐츠 (COMMUNITY_NAV_ENABLED=true 일 때 홈)
 */
interface CommunityHomeProps {
  nav: (to: string) => void;
  openProduct: (id: string) => void;
}

function CommunityHome({ nav, openProduct }: CommunityHomeProps) {
  return (
    <div className="handy-page-content max-w-7xl">
      <SnapFeed
        onCreatorClick={(uuid) => nav(`/user/${uuid}`)}
        onProductClick={(uuid) => openProduct(uuid)}
      />
    </div>
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
  interface AdminDashboardStats {
    totalUsers: number;
    totalOrders: number;
    totalProducts: number;
    totalRevenue: number;
    thisMonthRevenue: number;
    pendingOrders: number;
    lowStockProducts: number;
  }

  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(false);
      const data = await webApiService.admin.getDashboardStats();
      setDashboardStats(data.stats);
    } catch (error) {
      console.error('Failed to load admin dashboard stats:', error);
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(value || 0);
  const formatKrw = (value: number) =>
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value || 0);

  const statCards = [
    {
      label: '총 회원',
      value: dashboardStats ? `${formatNumber(dashboardStats.totalUsers)}명` : '-',
      sub: null as string | null,
    },
    {
      label: '총 주문',
      value: dashboardStats ? `${formatNumber(dashboardStats.totalOrders)}건` : '-',
      sub: dashboardStats ? `대기 ${formatNumber(dashboardStats.pendingOrders)}건` : null,
    },
    {
      label: '총 상품',
      value: dashboardStats ? `${formatNumber(dashboardStats.totalProducts)}개` : '-',
      sub: dashboardStats ? `재고 부족 ${formatNumber(dashboardStats.lowStockProducts)}개` : null,
    },
    {
      label: '이번 달 매출',
      value: dashboardStats ? formatKrw(dashboardStats.thisMonthRevenue) : '-',
      sub: dashboardStats ? `누적 ${formatKrw(dashboardStats.totalRevenue)}` : null,
    },
  ];

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

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500 mb-2">{card.label}</div>
            {statsLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-7 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ) : statsError ? (
              <div className="text-sm text-gray-400">불러오기 실패</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                {card.sub && <div className="text-xs text-gray-500 mt-1">{card.sub}</div>}
              </>
            )}
          </div>
        ))}
      </div>

      {/* 지표 로딩 실패 안내 */}
      {statsError && !statsLoading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">대시보드 지표를 불러오지 못했습니다.</p>
          <button
            onClick={() => loadDashboardStats()}
            className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

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
    // returnUrl 쿼리 파라미터가 있으면 localStorage에 저장 (OAuth 리다이렉트 시 유지용)
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl');
    if (returnUrl) {
      localStorage.setItem('oauth_returnUrl', returnUrl);
    }

    nav('/');
    // 약간의 딜레이 후 모달 열기 (네비게이션 완료 후)
    const timer = setTimeout(() => {
      openModal();
    }, 50);
    return () => clearTimeout(timer);
  }, [nav, openModal]);

  return null;
}
