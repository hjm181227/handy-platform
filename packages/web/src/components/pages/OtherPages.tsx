
import { useState, useEffect } from 'react';
import { webApiService, likesService } from '../../services/apiService';
import type { User, LikeItem, TargetType, Product } from '@handy-platform/shared';
import type { NailSizeData } from '@handy-platform/shared/src/services/user/UserService';
import { ProductCard } from '../product/ProductCard';
import { Ruler, LogOut, ChevronRight } from 'lucide-react';
import SnapUploadModal, {
  NAIL_STYLES, NAIL_COLORS, NAIL_TEXTURES, NAIL_TPOS,
  NAIL_NATIONS, NAIL_SHAPES, NAIL_LENGTHS,
} from '../snap/SnapUploadModal';
import SnapDetailModal from '../snap/SnapDetailModal';

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
  const [selectedTab, setSelectedTab] = useState<TargetType>('post');
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
        className="px-4 py-2 bg-[#E85A6B] text-white rounded-md hover:bg-[#D14A5B]"
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
        {selectedTab === 'post' && '찜한 스냅이 없습니다.'}
      </p>
      <button
        onClick={() => selectedTab === 'post' ? onGo("/snap") : onGo("/")}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
      >
        {selectedTab === 'post' ? '스냅 둘러보러 가기' : '쇼핑하러 가기'}
      </button>
    </div>
  );

  // LikeItem을 Product 형식으로 변환
  const convertLikeItemToProduct = (item: LikeItem): Product => {
    const price = item.target?.price ?? 0;
    const salePrice = item.target?.salePrice ?? price;

    return {
      productUuid: item.targetUuid,
      name: item.target?.name || '',
      mainImageUrl: item.target?.mainImageUrl || '',
      price: price,
      discountedPrice: salePrice,
      discountRate: price > 0 && salePrice < price ? Math.round((1 - salePrice / price) * 100) : 0,
      seller: {
        name: item.target?.brand || '',
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
    <div className="handy-page-content max-w-7xl">
      {/* 헤더 */}
      <h1 className="text-2xl font-semibold mb-6">찜한 목록</h1>

      {/* Segment Selector - iOS Style */}
      <div className="inline-flex p-1 bg-gray-100 rounded-lg mb-6">
        <button
          onClick={() => setSelectedTab('post')}
          className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            selectedTab === 'post'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          snap
        </button>
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
                onGo={onGo}
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
  const [nailSizeData, setNailSizeData] = useState<NailSizeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCount, setCouponCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, nailRes, couponRes] = await Promise.all([
          webApiService.getCurrentUserProfile(),
          webApiService.user.getNailSize().catch(() => ({ success: false, data: null })),
          webApiService.loyalty.getUserCoupons({ limit: 1 }).catch(() => ({ data: null })),
        ]);
        if (profileRes.user) {
          setUser(profileRes.user);
        }
        if (nailRes.success && nailRes.data) {
          setNailSizeData(nailRes.data);
        }
        if (couponRes.data?.summary) {
          setCouponCount(couponRes.data.summary.available || 0);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 로딩 스켈레톤
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F5]">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="rounded-2xl bg-white p-5 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-16 mb-3"></div>
            <div className="h-6 bg-gray-200 rounded w-40"></div>
          </div>
        </div>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'seller': return '판매자';
      case 'admin': return '관리자';
      default: return '';
    }
  };

  const isWebViewEnvironment = () => !!(window as any).ReactNativeWebView;

  const goToNailSizes = () => {
    if (isWebViewEnvironment()) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({
        type: 'NAVIGATE_TO_SIZES',
        data: { screen: 'NailSizes' }
      }));
    } else {
      onGo('/my/nail-sizes');
    }
  };

  const handleLogout = async () => {
    try {
      if (isWebViewEnvironment()) {
        (window as any).ReactNativeWebView.auth('logout');
      } else {
        await webApiService.logoutAndClearToken();
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        onGo('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      if (!isWebViewEnvironment()) {
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        onGo('/login');
      }
    }
  };

  const ChevronIcon = ({ className = "text-[#D0C9C3]" }: { className?: string }) => (
    <ChevronRight className={`h-[18px] w-[18px] ${className}`} />
  );

  const LinkRow = ({ title, to, badge }: { title: string; to: string; badge?: string }) => (
    <a
      href={to}
      onClick={(e) => { e.preventDefault(); onGo(to); }}
      className="flex items-center justify-between py-3 px-1 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#131211]">{title}</span>
        {badge && (
          <span className="rounded-[10px] border border-[#E5E0DC] px-2 py-0.5 text-xs text-[#71717A]">
            {badge}
          </span>
        )}
      </div>
      <ChevronIcon />
    </a>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl bg-white overflow-hidden border border-[#E5E0DC]">
      <div className="px-4 pt-4 pb-2">
        <span className="text-[15px] font-bold text-[#131211]">{title}</span>
      </div>
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <div className="max-w-lg mx-auto">
        {/* Content */}
        <div className="flex flex-col gap-3 px-5 py-4">

          {/* Profile Card */}
          <div className="rounded-2xl bg-white p-5 flex flex-col gap-4 border border-[#E5E0DC]">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="text-[13px] text-[#71717A] font-medium">내 정보</div>
              <div className="flex gap-2">
                <button
                  onClick={() => onGo('/my/settings')}
                  className="rounded-lg border border-[#E5E0DC] px-2.5 py-1.5 text-xs font-medium text-[#131211] hover:bg-gray-50 transition-colors"
                >
                  회원정보 수정
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-[#E5E0DC] p-1.5 text-[#71717A] hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Profile Name */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#131211]">
                {user?.nickname || user?.name || '사용자'}
              </span>
              {getRoleLabel(user?.role || 'user') && (
                <>
                  <span className="text-xl text-[#D0C9C3]">/</span>
                  <span className="text-xl font-bold text-[#FF4D6D]">
                    {getRoleLabel(user?.role || 'user')}
                  </span>
                </>
              )}
            </div>

            {/* Size Status */}
            <button
              onClick={goToNailSizes}
              className="flex items-center gap-3 rounded-xl bg-[#FFE5EA] px-4 py-3 w-full text-left hover:bg-[#FFD6DD] transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF4D6D]">
                <Ruler className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-[#991B1B]">내 손톱 사이즈</div>
                {nailSizeData ? (() => {
                  const allFingers = [
                    ...Object.values(nailSizeData.leftHand),
                    ...Object.values(nailSizeData.rightHand),
                  ];
                  const measuredCount = allFingers.filter(v => v > 0).length;
                  const isComplete = measuredCount === 10;
                  return isComplete ? (
                    <div className="text-sm font-medium text-[#131211]">측정 완료 · 왼손/오른손</div>
                  ) : (
                    <div className="text-sm font-medium text-[#FF4D6D]">측정 미완료 · {measuredCount}/10</div>
                  );
                })() : (
                  <div className="text-sm font-medium text-[#71717A]">아직 측정 기록이 없어요 · 측정하기</div>
                )}
              </div>
              <ChevronIcon className="text-[#FF4D6D]" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex gap-2">
            {[
              { label: '주문/배송', value: '보기', to: '/my/orders' },
              { label: '배송중', value: '보기', to: '/my/shipping' },
              { label: '쿠폰', value: `${couponCount}장`, to: '/my/coupons' },
            ].map((stat) => (
              <a
                key={stat.to}
                href={stat.to}
                onClick={(e) => { e.preventDefault(); onGo(stat.to); }}
                className="flex-1 rounded-xl border border-[#E5E0DC] bg-white px-3 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="text-xs font-medium text-[#71717A]">{stat.label}</div>
                <div className="mt-2 text-lg font-bold text-[#131211]">{stat.value}</div>
              </a>
            ))}
          </div>

          {/* Menu Section 1 */}
          <Section title="판매자 서비스">
            {user?.role === 'seller' ? (
              <>
                <LinkRow title="판매자 센터로 이동" to="/seller" />
                <a
                  href="/seller/custom-orders/public"
                  onClick={(e) => { e.preventDefault(); onGo('/seller/custom-orders/public'); }}
                  className="flex items-center justify-between py-3 px-1 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#FF4D6D]">실시간 고객 주문 확인</span>
                    <span className="rounded-full bg-[#FF4D6D] text-white text-[10px] px-1.5 py-0.5 font-bold">NEW</span>
                  </div>
                  <ChevronIcon className="text-[#FF4D6D]" />
                </a>
              </>
            ) : (
              <LinkRow title="판매자 신청하기" to="/seller/apply" />
            )}
          </Section>

          {/* Menu Section 2 */}
          <Section title="주문·배송 / 반품·교환">
            <LinkRow title="주문 내역" to="/my/orders" />
            <LinkRow title="커스텀 주문 관리" to="/my/custom-orders" />
            <LinkRow title="배송지 관리" to="/my/shipping-address" />
            <LinkRow title="반품/교환 내역" to="/my/claims" />
            <LinkRow title="취소 내역" to="/my/cancel" />
          </Section>

          {/* Menu Section 3 */}
          <Section title="리뷰·좋아요">
            <LinkRow title="내 리뷰 관리" to="/my/reviews" />
            <LinkRow title="좋아요(위시리스트)" to="/likes" />
          </Section>

          {/* Menu Section 4 */}
          <Section title="혜택 / 결제">
            <LinkRow title="쿠폰" to="/my/coupons" badge={`${couponCount}장`} />
            <LinkRow title="포인트" to="/my/points" />
            {/* <LinkRow title="결제수단 관리" to="/my/payments" /> */}
          </Section>

          {/* Menu Section 5 */}
          <Section title="고객센터 / 설정">
            <LinkRow title="1:1 문의" to="/support/contact" />
            <LinkRow title="FAQ" to="/support/faq" />
            <LinkRow title="알림/푸시 설정" to="/my/notifications" />
            <LinkRow title="회원정보 수정" to="/my/settings" />
          </Section>
        </div>
      </div>
    </div>
  );
}

export function SnapPage({ onGo, onOpen, initialUpload = false }: { onGo: (to: string) => void; onOpen: (id: string) => void; initialUpload?: boolean }) {
  const [snaps, setSnaps] = useState<any[]>([]);
  const [selectedSnap, setSelectedSnap] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [popularTags, setPopularTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(initialUpload);

  // 카테고리 필터 상태
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedTexture, setSelectedTexture] = useState<string>('');
  const [selectedTpo, setSelectedTpo] = useState<string>('');
  const [selectedNation, setSelectedNation] = useState<string>('');
  const [selectedShape, setSelectedShape] = useState<string>('');
  const [selectedLength, setSelectedLength] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // initialUpload prop 변경 시 모달 열기 (이미 /snap에 있을 때 /snap/new 클릭 대응)
  useEffect(() => {
    if (initialUpload) {
      setShowUploadModal(true);
    }
  }, [initialUpload]);

  // 스냅 데이터 로드
  const fetchSnaps = async (resetPage = false) => {
    try {
      setLoading(true);
      setError(null);
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      const response = await webApiService.snap.getSnaps({
        page: currentPage,
        limit: 20,
        sort: sortBy,
        tag: activeTag || undefined,
        style: selectedStyle || undefined,
        color: selectedColor || undefined,
        texture: selectedTexture || undefined,
        tpo: selectedTpo || undefined,
        nation: selectedNation || undefined,
        shape: selectedShape || undefined,
        length: selectedLength || undefined,
      });

      if (response.success) {
        if (currentPage === 1) {
          setSnaps(response.data.snaps);
        } else {
          setSnaps(prev => [...prev, ...response.data.snaps]);
        }
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err: any) {
      console.error('Snap fetch error:', err);
      setError('스냅을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 인기 태그 로드
  useEffect(() => {
    webApiService.snap.getPopularTags().then(res => {
      if (res.success) setPopularTags(res.data.slice(0, 10));
    }).catch(() => {});
  }, []);

  // 정렬/태그/카테고리 변경 시 재로드
  useEffect(() => {
    fetchSnaps(true);
  }, [sortBy, activeTag, selectedStyle, selectedColor, selectedTexture, selectedTpo, selectedNation, selectedShape, selectedLength]);

  // 더 보기
  useEffect(() => {
    if (page > 1) fetchSnaps();
  }, [page]);

  // 좋아요 토글 (낙관적 업데이트)
  const handleLike = async (snapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const snap = snaps.find(s => s.id === snapId);
    if (!snap) return;

    const wasLiked = snap.isLiked;

    // 낙관적 업데이트
    setSnaps(prev => prev.map(s =>
      s.id === snapId
        ? { ...s, isLiked: !wasLiked, likesCount: s.likesCount + (wasLiked ? -1 : 1) }
        : s
    ));
    if (selectedSnap?.id === snapId) {
      setSelectedSnap((prev: any) => prev ? { ...prev, isLiked: !wasLiked, likesCount: prev.likesCount + (wasLiked ? -1 : 1) } : prev);
    }

    try {
      if (wasLiked) {
        await likesService.unlike('snap', snapId);
      } else {
        await likesService.like('snap', snapId);
      }
    } catch {
      // 롤백
      setSnaps(prev => prev.map(s =>
        s.id === snapId
          ? { ...s, isLiked: wasLiked, likesCount: s.likesCount + (wasLiked ? 1 : -1) }
          : s
      ));
      if (selectedSnap?.id === snapId) {
        setSelectedSnap((prev: any) => prev ? { ...prev, isLiked: wasLiked, likesCount: prev.likesCount + (wasLiked ? 1 : -1) } : prev);
      }
    }
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
      if (e.key === 'Escape') handleCloseModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <>
      <div className="handy-page-content max-w-7xl">
        {/* 데스크톱 업로드 버튼 */}
        <div className="hidden md:flex justify-end mb-6">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#E85A6B] text-white text-sm font-medium rounded-full hover:bg-[#D14A5B] transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            스냅 올리기
          </button>
        </div>

        {/* 필터 바 */}
        <div className="mb-5 md:mb-6 space-y-3">
          {/* 정렬 + 카테고리 한 줄 */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all ${sortBy === 'newest' ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                최신순
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all ${sortBy === 'popular' ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                인기순
              </button>
            </div>

            <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

            {/* 카테고리 드롭다운 필터 (스크롤 영역) */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide min-w-0">
            {([
              { key: 'style', label: '스타일', value: selectedStyle, setter: setSelectedStyle, options: NAIL_STYLES },
              { key: 'color', label: '컬러', value: selectedColor, setter: setSelectedColor, options: NAIL_COLORS },
              { key: 'texture', label: '텍스처', value: selectedTexture, setter: setSelectedTexture, options: NAIL_TEXTURES },
              { key: 'tpo', label: 'TPO', value: selectedTpo, setter: setSelectedTpo, options: NAIL_TPOS },
              { key: 'nation', label: '국가', value: selectedNation, setter: setSelectedNation, options: NAIL_NATIONS },
              { key: 'shape', label: '모양', value: selectedShape, setter: setSelectedShape, options: NAIL_SHAPES },
              { key: 'length', label: '길이', value: selectedLength, setter: setSelectedLength, options: NAIL_LENGTHS },
            ] as const).map((filter) => (
              <div key={filter.key} className="relative flex-shrink-0">
                <button
                  onClick={() => setOpenDropdown(openDropdown === filter.key ? null : filter.key)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border transition-all whitespace-nowrap ${
                    filter.value
                      ? 'border-[#E85A6B] bg-[#FFF1F2] text-[#E85A6B] font-medium'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {filter.value
                    ? filter.options.find(o => o.value === filter.value)?.label || filter.label
                    : filter.label}
                  <svg className={`w-3 h-3 transition-transform ${openDropdown === filter.key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === filter.key && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 min-w-[120px] py-1 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => { filter.setter(''); setOpenDropdown(null); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${!filter.value ? 'text-[#E85A6B] font-medium' : 'text-gray-600'}`}
                      >
                        전체
                      </button>
                      {filter.options.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { filter.setter(opt.value); setOpenDropdown(null); }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${filter.value === opt.value ? 'text-[#E85A6B] font-medium' : 'text-gray-600'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
            </div>
          </div>

          {/* 태그 필터 */}
          {popularTags.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTag(null)}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all ${!activeTag ? 'bg-[#E85A6B] text-white shadow-sm' : 'border border-[#E85A6B] text-[#E85A6B] bg-white hover:bg-[#FFF1F2]'}`}
              >
                전체
              </button>
              {popularTags.map(t => (
                <button
                  key={t.tag}
                  onClick={() => setActiveTag(t.tag)}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all ${activeTag === t.tag ? 'bg-[#E85A6B] text-white shadow-sm' : 'border border-[#E85A6B] text-[#E85A6B] bg-white hover:bg-[#FFF1F2]'}`}
                >
                  #{t.tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 에러 */}
        {error && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">:(</div>
            <p className="text-gray-500 mb-4 text-sm">{error}</p>
            <button onClick={() => fetchSnaps(true)} className="px-5 py-2 bg-gray-900 text-white rounded-full text-sm hover:bg-gray-800 transition-colors">
              다시 시도
            </button>
          </div>
        )}

        {/* 로딩 스켈레톤 */}
        {loading && snaps.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* 그리드 */}
        {snaps.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {snaps.map((snap) => (
              <div
                key={snap.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSnapClick(snap)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSnapClick(snap); }}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <img
                  src={snap.imageUrl}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt={snap.title || 'Nail snap'}
                  loading="lazy"
                />

                {/* 하단 그라데이션 (항상 표시) */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                {/* 하단 정보 (항상 표시) */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {snap.creator?.avatar ? (
                        <img
                          src={snap.creator.avatar}
                          className="w-5 h-5 rounded-full border border-white/30 flex-shrink-0"
                          alt=""
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/20 flex-shrink-0" />
                      )}
                      <span className="text-xs opacity-90 truncate">{snap.creator?.nickname || snap.creator?.name || ''}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs flex-shrink-0">
                      <svg className="w-3.5 h-3.5 fill-current opacity-80" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span className="opacity-80">{snap.likesCount || 0}</span>
                    </div>
                  </div>
                </div>

                {/* 좋아요 버튼 (호버 시) */}
                <button
                  onClick={(e) => handleLike(snap.id, e)}
                  className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 hover:scale-110"
                >
                  <svg
                    className={`w-4 h-4 transition-colors ${snap.isLiked ? 'fill-red-500 text-red-500' : 'fill-none text-gray-600'}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && !error && snaps.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">아직 스냅이 없습니다</p>
          </div>
        )}

        {/* 더보기 버튼 */}
        {page < totalPages && !loading && (
          <div className="text-center mt-10 mb-4">
            <button
              onClick={() => setPage(prev => prev + 1)}
              className="px-8 py-2.5 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              더보기
            </button>
          </div>
        )}

        {/* 로딩 more */}
        {loading && snaps.length > 0 && (
          <div className="text-center mt-8 mb-4">
            <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-[#E85A6B] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 스냅 상세 모달 */}
      {selectedSnap && (
        <SnapDetailModal
          snap={selectedSnap}
          onClose={handleCloseModal}
          onProductClick={(id) => { onOpen(id); handleCloseModal(); }}
          onTagClick={(tag) => { setActiveTag(tag); handleCloseModal(); }}
          onDelete={(uuid) => { setSnaps(prev => prev.filter(s => (s.id || s.snapUuid) !== uuid)); handleCloseModal(); }}
        />
      )}

      {/* 스냅 업로드 모달 */}
      <SnapUploadModal
        isOpen={showUploadModal}
        onClose={() => { setShowUploadModal(false); if (initialUpload) onGo('/snap'); }}
        onSuccess={() => fetchSnaps(true)}
      />
    </>
  );
}
