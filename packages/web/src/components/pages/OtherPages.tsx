
import { useState, useEffect } from 'react';
import { products } from '../../data';
import { webApiService, likesService } from '../../services/apiService';
import type { User, LikeItem, TargetType, Product } from '@handy-platform/shared';
import navigateService from '@handy-platform/shared/src/services/navigate';
import { ProductCard } from '../product/ProductCard';

// 좋아요 페이지
export function LikesPage({
  onGo,
  onOpen,
  onAdd,
  onLike
}: {
  onGo: (to: string) => void;
  onOpen: (id: string) => void;
  onAdd: (id: string) => void;
  onLike: (id: string) => void;
}) {
  const [selectedTab, setSelectedTab] = useState<TargetType>('product');
  const [likedItems, setLikedItems] = useState<LikeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 좋아요 목록 로딩
  const loadLikes = async (targetType: TargetType) => {
    try {
      setLoading(true);
      setError(null);
      const response = await likesService.getUserLikes(targetType);

      if (response.success && response.data) {
        setLikedItems(response.data);
      } else {
        setLikedItems([]);
      }
    } catch (error: any) {
      console.error('Failed to load likes:', error);
      setError(error.message || '좋아요 목록을 불러오는데 실패했습니다.');
      setLikedItems([]);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    loadLikes(selectedTab);
  }, [selectedTab]);

  // LikesPage 내부에서 좋아요 해제 처리
  const handleLikeInPage = async (productId: string) => {
    // 1. 낙관적 업데이트: 즉시 목록에서 제거
    setLikedItems(prev => prev.filter(item => item.targetUuid !== productId));

    try {
      // 2. 상위 handleLike 호출 (API 호출 + likedProducts 상태 업데이트)
      await onLike(productId);
    } catch (error) {
      // 3. 실패 시 목록 새로고침으로 정확한 상태 복구
      console.error('Failed to unlike in LikesPage:', error);
      loadLikes(selectedTab);
    }
  };

  // 로딩 스켈레톤
  const renderLoading = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <ProductCard key={`skeleton-${index}`} isLoading={true} />
      ))}
    </div>
  );

  // 에러 상태
  const renderError = () => (
    <div className="mt-8 text-center py-20">
      <p className="text-red-600 mb-4">{error}</p>
      <button
        onClick={() => loadLikes(selectedTab)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        다시 시도
      </button>
    </div>
  );

  // 빈 상태
  const renderEmpty = () => (
    <div className="mt-8 text-center py-20 text-gray-500">
      <p className="mb-4">
        {selectedTab === 'product' && '찜한 상품이 없습니다.'}
        {selectedTab === 'brand' && '찜한 브랜드가 없습니다.'}
        {selectedTab === 'post' && '찜한 게시물이 없습니다.'}
      </p>
      <button
        onClick={() => onGo("/")}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
      >
        쇼핑하러 가기
      </button>
    </div>
  );

  // LikeItem을 Product 형식으로 변환
  const convertLikeItemToProduct = (item: LikeItem): Product => {
    const price = item.target?.price ?? 0;
    const salePrice = item.target?.salePrice ?? price;

    return {
      productUuid: item.targetUuid,
      id: item.targetId,
      name: item.target?.name || '',
      mainImageUrl: item.target?.mainImageUrl || '',
      price: price,
      discountedPrice: salePrice,
      discountRate: price > 0 && salePrice < price ? Math.round((1 - salePrice / price) * 100) : 0,
      seller: {
        name: item.target?.brand || 'HANDY',
        id: '',
        email: '',
        businessName: '',
        businessNumber: '',
        status: 'active' as const,
        createdAt: '',
        updatedAt: ''
      },
      rating: {
        average: 0,
        count: 0
      },
      description: '',
      category: '',
      stock: 0,
      status: 'active' as const,
      isNewProduct: false,
      isFeatured: false,
      createdAt: item.likedAt,
      updatedAt: item.likedAt
    } as Product;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* 헤더 */}
      <h1 className="text-2xl font-semibold mb-6">찜한 목록</h1>

      {/* Segment Selector - iOS Style */}
      <div className="inline-flex p-1 bg-gray-100 rounded-lg mb-6">
        <button
          onClick={() => setSelectedTab('product')}
          className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            selectedTab === 'product'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          상품
        </button>
        <button
          onClick={() => setSelectedTab('brand')}
          className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            selectedTab === 'brand'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          브랜드
        </button>
        <button
          onClick={() => setSelectedTab('post')}
          className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            selectedTab === 'post'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          게시물
        </button>
      </div>

      {/* 컨텐츠 */}
      {loading && renderLoading()}
      {!loading && error && renderError()}
      {!loading && !error && likedItems.length === 0 && renderEmpty()}
      {!loading && !error && likedItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {likedItems.map(item => {
            const product = convertLikeItemToProduct(item);
            return (
              <ProductCard
                key={item.targetUuid}
                p={product}
                onOpen={onOpen}
                onAdd={onAdd}
                onLike={handleLikeInPage}
                isLiked={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MyPage({ onGo, onOpen }: { onGo: (to: string) => void; onOpen: (id: string) => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await webApiService.getCurrentUserProfile();
        if (response.user) {
          setUser(response.user);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // 샘플 데이터 (API에서 제공되지 않는 정보들)
  const stats = {
    points: 2300,
    coupons: 2,
    ordersWaiting: 0,
    shipping: 0,
    cs: 0,
    likes: 23,
  };

  // 로딩 상태일 때
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5">
        <div className="rounded-lg border bg-white p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-40"></div>
          </div>
        </div>
      </div>
    );
  }

  // 작은 유틸
  const Right = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // 사용자 역할에 따른 라벨 반환
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'seller':
        return '판매자';
      case 'admin':
        return '관리자';
      case 'user':
      default:
        return '';
    }
  };

  const Stat = ({
    label,
    value,
    to,
  }: {
    label: string;
    value: string;
    to: string;
  }) => (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        onGo(to);
      }}
      className="flex-1 rounded-lg border bg-white p-3 text-left hover:bg-gray-50"
    >
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </a>
  );

  const LinkRow = ({
    title,
    to,
    note,
  }: {
    title: string;
    to: string;
    note?: string;
  }) => (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        onGo(to);
      }}
      className="flex items-center justify-between border-b py-3 text-sm hover:bg-gray-50"
    >
      <div className="flex items-center gap-2">
        <span>{title}</span>
        {note ? (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {note}
          </span>
        ) : null}
      </div>
      <Right />
    </a>
  );

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <section className="mt-6 rounded-lg border bg-white">
      <div className="border-b px-4 py-3 text-[15px] font-semibold">
        {title}
      </div>
      <div className="px-4">{children}</div>
    </section>
  );

  // 최근 본 상품(샘플 데이터 사용)
  const recent = products.slice(0, 6);

  // WebView 환경인지 확인
  const isWebViewEnvironment = () => {
    return !!(window as any).ReactNativeWebView;
  };

  // 손톱 사이즈 목록 화면으로 이동
  const goToNailSizes = () => {
    console.log('🔵 [WEB] 사이즈 목록 버튼 클릭됨');
    navigateService.goToNailSizes();
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      console.log('🔵 [WEB] 로그아웃 시작');

      if (isWebViewEnvironment()) {
        // WebView 환경: 네이티브 로그아웃 사용 (네이티브가 모든 것을 처리)
        console.log('🔵 [WEB] WebView 환경 - 네이티브 로그아웃 호출');
        (window as any).ReactNativeWebView.auth('logout');

        // 네이티브가 localStorage 클리어 + 홈으로 리다이렉트를 자동으로 처리
        // 추가 처리 불필요
        console.log('✅ [WEB] 네이티브에게 로그아웃 요청 전송 완료 (네이티브가 나머지 처리)');
      } else {
        // 일반 웹 환경: 웹 로그아웃 사용
        console.log('🔵 [WEB] 웹 브라우저 환경 - 웹 로그아웃 호출');
        await webApiService.logoutAndClearToken();

        // 인증 상태 변경 이벤트 발생
        window.dispatchEvent(new CustomEvent('authStateChanged'));

        // 로그인 페이지로 이동
        console.log('🔵 [WEB] 로그인 페이지로 이동');
        onGo('/login');
        console.log('✅ [WEB] 웹 로그아웃 성공');
      }
    } catch (error) {
      console.error('🔴 [WEB] 로그아웃 실패:', error);

      if (!isWebViewEnvironment()) {
        // 웹 환경에서만 에러 처리
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        onGo('/login');
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-5">
      {/* 사이즈 목록 버튼 (WebView에서만 표시) */}
      {isWebViewEnvironment() && (
        <div className="mb-4">
          <button
            onClick={goToNailSizes}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>📏</span>
            <span>내 손톱 사이즈</span>
          </button>
        </div>
      )}

      {/* 상단 요약 바 */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">내 정보</div>
            <div className="mt-1 text-lg font-semibold">
              {user?.name || '사용자'} <span className="text-gray-400">/</span>{" "}
              {getRoleLabel(user?.role || 'user') && (
                <span className="text-blue-600">{getRoleLabel(user?.role || 'user')}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/my/settings"
              onClick={(e) => {
                e.preventDefault();
                onGo("/my/settings");
              }}
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              회원정보 수정
            </a>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 요약 통계 4분할 */}
        <div className="mt-3 flex gap-2">
          <Stat label="주문/배송" value={`${stats.ordersWaiting}건`} to="/my/orders" />
          <Stat label="배송중" value={`${stats.shipping}건`} to="/my/shipping" />
          <Stat label="포인트" value={`${stats.points.toLocaleString()}P`} to="/my/points" />
          <Stat label="쿠폰" value={`${stats.coupons}장`} to="/my/coupons" />
        </div>

        {/* 프로모션 배너 */}
        <a
          href="/promo/plus"
          onClick={(e) => {
            e.preventDefault();
            onGo("/promo/plus");
          }}
          className="mt-4 block rounded-lg bg-black px-4 py-3 text-white hover:text-white"
        >
          <div className="text-sm opacity-90">핸디플러스 멤버</div>
          <div className="text-[15px] font-semibold">
            멤버십 최대 10% 적립 혜택
          </div>
        </a>
      </div>

      {/* 최근 본 / 위시리스트 요약 */}
      <Section title="최근 본">
        {recent.length === 0 ? (
          <div className="py-6 text-sm text-gray-500">최근 본 상품이 없습니다.</div>
        ) : (
          <div className="flex gap-4 overflow-x-auto py-3">
            {recent.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpen(p.id)}
                className="w-[140px] shrink-0 text-left"
                title={p.name}
              >
                <img
                  src={p.image}
                  className="aspect-[3/4] w-full rounded object-cover"
                />
                <div className="mt-1 line-clamp-2 text-xs">{p.name}</div>
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* 주문/반품/리뷰 등 주요 메뉴 */}
      <Section title="주문·배송 / 반품·교환">
        <div className="divide-y">
          <LinkRow title="주문 내역" to="/my/orders" />
          <LinkRow title="배송지 관리" to="/my/shipping-address" />
          <LinkRow title="반품/교환 내역" to="/my/claims" />
          <LinkRow title="취소 내역" to="/my/cancel" />
        </div>
      </Section>

      <Section title="리뷰·좋아요">
        <div className="divide-y">
          <LinkRow title="내 리뷰 관리" to="/my/reviews" />
          <LinkRow title="좋아요(위시리스트)" to="/likes" note={`${stats.likes}`} />
        </div>
      </Section>

      <Section title="혜택 / 결제">
        <div className="divide-y">
          <LinkRow title="쿠폰" to="/my/coupons" note={`${stats.coupons}장`} />
          <LinkRow title="포인트" to="/my/points" note={`${stats.points.toLocaleString()}P`} />
          <LinkRow title="결제수단 관리" to="/my/payments" />
        </div>
      </Section>

      <Section title="판매자 서비스">
        <div className="divide-y">
          {user?.role === 'seller' ? (
            <LinkRow title="판매자 센터로 이동" to="/seller" />
          ) : (
            <LinkRow title="판매자 신청하기" to="/seller/apply" />
          )}
          <div className="py-3 text-xs text-gray-500">
            {user?.role === 'seller' 
              ? '판매자 센터에서 상품과 주문을 관리해보세요!'
              : '네일아트 상품을 판매하여 수익을 창출해보세요!'
            }
          </div>
        </div>
      </Section>

      <Section title="고객센터 / 설정">
        <div className="divide-y">
          <LinkRow title="1:1 문의" to="/support/contact" />
          <LinkRow title="FAQ" to="/support/faq" />
          <LinkRow title="알림/푸시 설정" to="/my/notifications" />
          <LinkRow title="회원정보 수정" to="/my/settings" />
        </div>
      </Section>
    </div>
  );
}

export function SnapPage({ onGo, onOpen }: { onGo: (to: string) => void; onOpen: (id: string) => void }) {
  const [snaps, setSnaps] = useState<any[]>([]);
  const [selectedSnap, setSelectedSnap] = useState<any | null>(null);
  const [likedSnaps, setLikedSnaps] = useState<Set<string>>(new Set());

  // 스냅 데이터 로드
  useEffect(() => {
    import('../../data').then((module) => {
      setSnaps(module.snaps || []);
    });
  }, []);

  // 좋아요 토글
  const handleLike = (snapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedSnaps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(snapId)) {
        newSet.delete(snapId);
      } else {
        newSet.add(snapId);
      }
      return newSet;
    });
  };

  // 스냅 클릭 - 모달 열기
  const handleSnapClick = (snap: any) => {
    setSelectedSnap(snap);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setSelectedSnap(null);
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">SNAP</h1>
          <p className="mt-2 text-gray-600">네일 아트 갤러리 - 실제 고객들의 네일 디자인을 만나보세요</p>
          <div className="mt-4 border-t-2 border-gray-900"></div>
        </div>

        {/* 그리드 - 반응형 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {snaps.map((snap) => (
            <button
              key={snap.id}
              onClick={() => handleSnapClick(snap)}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* 이미지 */}
              <img
                src={snap.imageUrl}
                className="w-full h-full object-cover"
                alt={snap.title || 'Nail snap'}
              />

              {/* 호버 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* 하단 정보 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  {snap.title && (
                    <h3 className="font-semibold text-sm line-clamp-1">{snap.title}</h3>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs">
                      {snap.creator.avatar && (
                        <img
                          src={snap.creator.avatar}
                          className="w-5 h-5 rounded-full border border-white/50"
                          alt={snap.creator.name}
                        />
                      )}
                      <span className="opacity-90">{snap.creator.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="opacity-90">{snap.likesCount}</span>
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* 좋아요 버튼 */}
              <button
                onClick={(e) => handleLike(snap.id, e)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
              >
                <svg
                  className={`w-5 h-5 transition-colors ${likedSnaps.has(snap.id) ? 'fill-red-500 text-red-500' : 'fill-none text-gray-700'}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </button>
          ))}
        </div>

        {/* 빈 상태 */}
        {snaps.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">스냅 이미지를 준비 중입니다.</p>
          </div>
        )}
      </div>

      {/* 이미지 모달 */}
      {selectedSnap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 이미지 */}
              <div className="bg-gray-100">
                <img
                  src={selectedSnap.imageUrl}
                  className="w-full h-full object-cover max-h-[70vh]"
                  alt={selectedSnap.title || 'Nail snap'}
                />
              </div>

              {/* 상세 정보 */}
              <div className="p-6 flex flex-col">
                {/* 작성자 정보 */}
                <div className="flex items-center gap-3 mb-4">
                  {selectedSnap.creator.avatar && (
                    <img
                      src={selectedSnap.creator.avatar}
                      className="w-12 h-12 rounded-full border-2 border-gray-200"
                      alt={selectedSnap.creator.name}
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{selectedSnap.creator.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(selectedSnap.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>

                {/* 제목 & 설명 */}
                {selectedSnap.title && (
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedSnap.title}</h2>
                )}
                {selectedSnap.description && (
                  <p className="text-gray-600 mb-4">{selectedSnap.description}</p>
                )}

                {/* 좋아요 */}
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => handleLike(selectedSnap.id, {} as any)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <svg
                      className={`w-5 h-5 ${likedSnaps.has(selectedSnap.id) ? 'fill-red-500 text-red-500' : 'fill-none text-gray-700'}`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span className="font-medium">{selectedSnap.likesCount + (likedSnaps.has(selectedSnap.id) ? 1 : 0)}</span>
                  </button>
                </div>

                {/* 태그 */}
                {selectedSnap.tags && selectedSnap.tags.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">태그</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSnap.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 연관 상품 */}
                {selectedSnap.relatedProducts && selectedSnap.relatedProducts.length > 0 && (
                  <div className="mt-auto">
                    <p className="text-sm font-semibold text-gray-700 mb-3">이 디자인과 어울리는 상품</p>
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedSnap.relatedProducts.map((productId: string) => (
                        <button
                          key={productId}
                          onClick={() => {
                            onOpen(productId);
                            handleCloseModal();
                          }}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          상품 보기
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}