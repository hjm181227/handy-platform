import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, User, NAIL_SHAPE_NAME, NAIL_LENGTH_NAME, NAIL_SHAPES, NAIL_LENGTHS, DetailedReview, navigateService, buildProductUrlSlug } from '@handy-platform/shared';
import { productService, cartService, reviewService } from '../../services/apiService';
import { money } from '../../utils';
import { CategoryDisplay } from './CategoryDisplay';
import { Stars } from '../ui';
import { IoMdStar } from 'react-icons/io';
import { FaHeart, FaRegHeart, FaRegComments } from 'react-icons/fa';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useLikes } from '../../hooks/useLikes';
import ProductQA from './ProductQA';

// stocked(기성 재고) 상품일 때 getProduct 응답 data에 추가로 내려오는 variant 타입
// (shared Product 타입에는 아직 없어 로컬로 선언 — shared는 병렬 작업 중이라 수정 금지)
interface BuyerVariant {
  variantUuid: string;
  optionCombination: { optionType: 'shape' | 'length'; optionValue: string }[];
  isAvailable: boolean;
  stockDisplay: string; // '3' | '10+' | '0'
  priceModifier: number;
  finalPrice: number;
}

const getVariantOptionValue = (v: BuyerVariant, type: 'shape' | 'length') =>
  v.optionCombination?.find((o) => o.optionType === type)?.optionValue;

const findVariantIn = (variants: BuyerVariant[], s: string, l: string) =>
  variants.find(
    (v) => getVariantOptionValue(v, 'shape') === s && getVariantOptionValue(v, 'length') === l
  );

export function Detail({
  id,
  onBack,
  onAdd,
  onCartUpdate,
  currentUser,
  onGo,
}: {
  id: string;
  onBack: () => void;
  onAdd: (id: string) => void;
  onCartUpdate?: () => void;
  currentUser?: User | null;
  onGo?: (path: string) => void;  // ✅ sessionStorage 사용으로 1개 인자만
}) {
  // i18n
  const { t } = useTranslation(['product', 'common']);

  // 로그인 모달
  const { openLogin } = useAuthModal();

  // 모든 상태를 컴포넌트 최상단에 선언 (Hook 순서 보장)
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  // 판매자 문의(채팅) 시작 상태
  const [startingInquiry, setStartingInquiry] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [shape, setShape] = useState<string>("ROUND");
  const [length, setLength] = useState<string>("SHORT");
  const [qty, setQty] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>("info");
  const [heroIdx, setHeroIdx] = useState(0);

  // 찜: 로컬 state가 아닌 전역 LikesContext 사용 (서버 연동 + 낙관적 업데이트)
  const { handleLike, isProductLiked } = useLikes();
  const liked = isProductLiked(id);

  // 리뷰 관련 상태
  const [reviews, setReviews] = useState<DetailedReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPagination, setReviewsPagination] = useState<any>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewSort, setReviewSort] = useState<'newest' | 'rating' | 'photo'>('newest');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [ratingDistribution, setRatingDistribution] = useState<Record<string, number>>({});

  // 상품 데이터 로딩
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productService.getProduct(id);
        setProduct(response.data);
      } catch (err: any) {
        setError(err.message || t('common:loadFailed'));
        console.error('Product fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id]);

  /**
   * UUID로 들어온 링크를 읽기 좋은 주소로 바꿔둔다.
   *
   * 예전에 공유된 /product/{uuid} 링크나 아직 손대지 않은 화면에서 들어와도
   * 주소창에는 /product/white-wedding-f2f5655c 가 남는다. 히스토리를 쌓지
   * 않으므로 뒤로가기 동작은 그대로다.
   */
  useEffect(() => {
    if (!product?.name || !product?.productUuid) return;
    const pretty = buildProductUrlSlug(product.name, product.productUuid);
    if (!pretty) return;
    const current = window.location.pathname;
    // 커스텀 주문 등 하위 경로에서는 건드리지 않는다
    if (!/^\/product\/[^/]+$/.test(current)) return;
    const target = `/product/${pretty}`;
    if (current !== target) {
      window.history.replaceState({}, '', target + window.location.search);
    }
  }, [product]);

  // 상품이 로드된 후 옵션 초기화
  useEffect(() => {
    if (product) {
      const pAny: any = product;
      const productVariants: BuyerVariant[] =
        pAny.fulfillmentMode === 'stocked' && Array.isArray(pAny.variants) ? pAny.variants : [];

      if (productVariants.length > 0) {
        // stocked 상품: 첫 번째 구매 가능(isAvailable) 조합으로 초기 선택
        const initial =
          productVariants.find((v) => v.isAvailable) || productVariants[0];
        setShape(getVariantOptionValue(initial, 'shape') || product.nailShape || "ROUND");
        setLength(getVariantOptionValue(initial, 'length') || product.nailLength || "SHORT");
      } else {
        setShape(product.nailShape || "ROUND");
        setLength(product.nailLength || "SHORT");
      }
    }
  }, [product]);

  // 리뷰 로드 함수
  const loadProductReviews = async (page: number = 1) => {
    if (!product) return;

    try {
      setReviewsLoading(true);

      const response = await reviewService.getProductReviews(product.productUuid, {
        page,
        rating: ratingFilter || undefined,
        sortBy: reviewSort === 'newest' ? 'createdAt' : reviewSort === 'rating' ? 'rating' : 'createdAt',
        verifiedOnly: false
      });

      console.log('📝 [Detail] Reviews API response:', response);

      let fetchedReviews = response.reviews || [];

      // 사진 리뷰 우선 정렬 (photo 모드일 때)
      if (reviewSort === 'photo') {
        fetchedReviews = [...fetchedReviews].sort((a, b) => {
          const aHasPhotos = (a.images?.length || 0) > 0;
          const bHasPhotos = (b.images?.length || 0) > 0;
          if (aHasPhotos && !bHasPhotos) return -1;
          if (!aHasPhotos && bHasPhotos) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      }

      setReviews(fetchedReviews);
      setReviewsPagination(response.pagination);
      setRatingDistribution(response.distribution || {});
      setReviewsPage(page);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // 리뷰 탭 활성화 시 로드
  useEffect(() => {
    if (activeTab === 'reviews' && product && reviews.length === 0) {
      loadProductReviews(1);
    }
  }, [activeTab, product]);

  // 정렬/필터 변경 시 리뷰 새로고침
  useEffect(() => {
    if (activeTab === 'reviews' && product) {
      loadProductReviews(1);
    }
  }, [reviewSort, ratingFilter]);

  // 장바구니 담기 함수
  const addToCart = async () => {
    if (!product) return;

    // 로그인 체크
    if (!currentUser) {
      openLogin();
      return;
    }

    // stocked 상품: 선택 조합이 구매 가능한지 방어적 재검증 (서버도 재검증함)
    const pAnyCart: any = product;
    if (pAnyCart.fulfillmentMode === 'stocked') {
      const v = findVariantIn(pAnyCart.variants || [], shape, length);
      if (!v || !v.isAvailable) {
        setCartMessage('품절된 옵션입니다. 다른 옵션을 선택해주세요.');
        setTimeout(() => setCartMessage(null), 3000);
        return;
      }
    }

    try {
      setAddingToCart(true);
      setCartMessage(null);

      const options: Record<string, string> = {};
      if (shape) options.nailShape = shape;
      if (length) options.nailLength = length;

      console.log('Adding to cart:', {
        productId: product.productUuid,
        quantity: qty,
        options
      });

      await cartService.addToCart(product.productUuid, qty, options);

      setCartMessage('장바구니에 추가되었습니다!');
      // onAdd(product.id); // 중복 호출 방지 - API 호출은 이미 위에서 했으므로 콜백 제거

      console.log('🛒 [Detail] Calling onCartUpdate after adding to cart');
      if (onCartUpdate) {
        onCartUpdate();
        console.log('🛒 [Detail] onCartUpdate called successfully');
      } else {
        console.warn('⚠️ [Detail] onCartUpdate is not provided!');
      }

      setTimeout(() => setCartMessage(null), 3000);

    } catch (err: any) {
      console.error('Add to cart failed:', err);
      console.error('Error details:', {
        status: err.status,
        message: err.message,
        data: err.data
      });

      let errorMessage = '장바구니 추가에 실패했습니다.';

      // 특별한 에러 코드 처리
      if (err.data?.code === 'PRODUCTION_CAPACITY_EXCEEDED') {
        errorMessage = '현재 판매자의 생산 능력을 초과하여 주문을 받을 수 없습니다. 나중에 다시 시도해주세요.';
      } else if (err.data?.error) {
        errorMessage = err.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setCartMessage(errorMessage);
      setTimeout(() => setCartMessage(null), 5000);
    } finally {
      setAddingToCart(false);
    }
  };

  // 바로구매 함수
  const buyNow = () => {
    if (!product) return;

    // 로그인 체크
    if (!currentUser) {
      openLogin();
      return;
    }

    // onGo prop이 없으면 경고 (개발 환경)
    if (!onGo) {
      console.warn('onGo prop is not provided to Detail component');
      setCartMessage(t('product:detailPage.navigationError'));
      setTimeout(() => setCartMessage(null), 3000);
      return;
    }

    // stocked 상품: 선택 조합이 구매 가능한지 방어적 재검증 (서버도 재검증함)
    const pAnyBuy: any = product;
    if (pAnyBuy.fulfillmentMode === 'stocked') {
      const v = findVariantIn(pAnyBuy.variants || [], shape, length);
      if (!v || !v.isAvailable) {
        setCartMessage('품절된 옵션입니다. 다른 옵션을 선택해주세요.');
        setTimeout(() => setCartMessage(null), 3000);
        return;
      }
    }

    try {
      // ✅ 바로구매: 선택된 옵션으로 단일 상품을 checkout으로 전달
      const options: Record<string, string> = {};
      if (shape) options.nailShape = shape;
      if (length) options.nailLength = length;

      // 바로구매는 단일 상품만 지원 (서버 스펙: directItem 객체)
      const directItem = {
        productUuid: product.productUuid,
        quantity: qty,
        options: options
      };

      console.log('🛒 [buyNow] Navigating to direct checkout with item:', directItem);

      // ✅ CheckoutPage로 directItem 전달 (단일 객체, sessionStorage 사용)
      sessionStorage.setItem('checkoutData', JSON.stringify({
        type: 'direct',
        directItem: directItem
      }));

      // Checkout 페이지로 이동 (mode 파라미터로 방식 명시)
      onGo('/checkout?mode=direct');

    } catch (err) {
      console.error('Buy now failed:', err);
      setCartMessage(t('product:detailPage.buyNowError'));
      setTimeout(() => setCartMessage(null), 3000);
    }
  };

  // 공유 함수
  const share = async () => {
    if (!product) return;

    const url = window.location.href;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: product.name, url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert(t('product:detailPage.linkCopied'));
      } catch {
        alert(t('product:detailPage.shareUnsupported'));
      }
    }
  };

  // 사이징 버튼 클릭 핸들러
  const handleSizingClick = () => {
    const isWebView = typeof window !== 'undefined' && !!(window as any).ReactNativeWebView;

    if (!isWebView) {
      // 웹 브라우저: 앱 안내 메시지
      alert(t('product:detailPage.sizingAppPrompt'));
      return;
    }

    // 앱 (WebView): 기존 사이징 화면으로 이동
    navigateService.goToNailSizes();
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="animate-pulse">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-surface aspect-[3/4] rounded-2xl -mx-4 -mt-6 md:mx-0 md:mt-0 max-md:rounded-none"></div>
            <div className="space-y-4">
              <div className="h-4 bg-surface rounded w-1/4"></div>
              <div className="h-8 bg-surface rounded w-3/4"></div>
              <div className="h-6 bg-surface rounded w-1/2"></div>
              <div className="h-20 bg-surface rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">{t('common:productNotFound')}</div>
          <div className="text-sm text-red-500 mb-4">{error}</div>
          <button onClick={onBack} className="px-5 py-2.5 bg-ink text-white rounded-full text-sm font-semibold">{t('product:detailPage.backButton')}</button>
        </div>
      </div>
    );
  }

  const p = product;
  const salePrice = p.salePrice || p.price;
  const hasDiscount = !!p.salePrice && p.salePrice < p.price;
  const discountRate = hasDiscount ? Math.round((1 - salePrice / p.price) * 100) : 0;

  // B안 갤러리: 메인 + 상세 이미지를 썸네일 스트립으로 전환
  const galleryImages = [p.mainImageUrl, ...(p.detailImages?.map((d) => d.url) || [])].filter(Boolean);
  const activeHeroIdx = Math.min(heroIdx, galleryImages.length - 1);
  const heroImage = galleryImages[activeHeroIdx] || p.mainImageUrl;

  // ── 판매 방식(fulfillmentMode) 분기 ──────────────────────────────
  // stocked: variant(조합별 재고) 기반 선택 / made_to_order: 기존 customizable 흐름
  const fulfillmentMode = (p as any).fulfillmentMode as 'made_to_order' | 'stocked' | undefined;
  const isStocked = fulfillmentMode === 'stocked';
  const variants: BuyerVariant[] =
    isStocked && Array.isArray((p as any).variants) ? ((p as any).variants as BuyerVariant[]) : [];

  const findVariant = (s: string, l: string) => findVariantIn(variants, s, l);

  // variants에 존재하는 쉐입/길이만 노출 (표준 순서 유지)
  const stockedShapes = NAIL_SHAPES.filter((s) =>
    variants.some((v) => getVariantOptionValue(v, 'shape') === s)
  );
  const isShapeSoldOut = (s: string) => {
    const shapeVariants = variants.filter((v) => getVariantOptionValue(v, 'shape') === s);
    return shapeVariants.length > 0 && shapeVariants.every((v) => !v.isAvailable);
  };
  // 선택된 쉐입 기준으로 존재하는 길이만 노출
  const stockedLengths = NAIL_LENGTHS.filter((l) => !!findVariant(shape, l));

  const selectedVariant = isStocked ? findVariant(shape, length) : undefined;
  const allSoldOut = isStocked && !variants.some((v) => v.isAvailable);
  // stocked: 선택 조합이 구매 가능해야 함 / made_to_order: 기존 isInStock 그대로
  const canPurchase = isStocked ? !allSoldOut && !!selectedVariant?.isAvailable : p.isInStock;
  const unitPrice = isStocked && selectedVariant ? selectedVariant.finalPrice : salePrice;

  // 추가금 라벨 (예: +1,000원)
  const formatModifier = (mod?: number) => {
    if (!mod) return null;
    return mod > 0 ? `+${mod.toLocaleString()}원` : `-${Math.abs(mod).toLocaleString()}원`;
  };
  // 쉐입 버튼용 추가금: 현재 선택 길이와의 조합 우선, 없으면 해당 쉐입 첫 조합 기준
  const shapeModifierLabel = (s: string) => {
    const v =
      findVariant(s, length) || variants.find((vv) => getVariantOptionValue(vv, 'shape') === s);
    return formatModifier(v?.priceModifier);
  };

  // 쉐입 변경 시, 현재 길이 조합이 없거나 품절이면 해당 쉐입의 첫 구매 가능 길이로 이동
  const handleShapeSelect = (s: string) => {
    setShape(s);
    const current = findVariant(s, length);
    if (!current || !current.isAvailable) {
      const fallback =
        variants.find((v) => getVariantOptionValue(v, 'shape') === s && v.isAvailable) ||
        variants.find((v) => getVariantOptionValue(v, 'shape') === s);
      const nextLength = fallback && getVariantOptionValue(fallback, 'length');
      if (nextLength) setLength(nextLength);
    }
  };

  // 선택 요약 바의 재고·발송 문구
  const stockStatusText = selectedVariant
    ? !selectedVariant.isAvailable || selectedVariant.stockDisplay === '0'
      ? '품절'
      : selectedVariant.stockDisplay === '10+'
        ? '재고 충분 · 바로 발송'
        : `재고 ${selectedVariant.stockDisplay}개 · 바로 발송`
    : '';

  // 내부 이동(추천 영역 등에서 사용) — 라우터 nav 없이도 동작하게
  /**
   * 판매자에게 문의 — 채팅방을 열고 어떤 상품인지 카드로 먼저 붙인다.
   *
   * 카드 없이 방만 열면 판매자는 "무슨 상품이요?"부터 물어야 하므로,
   * 상품 정보 전송이 성공한 뒤에 채팅방으로 이동한다.
   */
  const contactSeller = async () => {
    if (!currentUser) {
      openLogin();
      return;
    }

    const p = product;
    const sellerUuid = (p as any)?.sellerUuid as string | undefined;
    if (!p || !sellerUuid) {
      setInquiryError('이 상품은 판매자 정보가 없어 문의할 수 없습니다.');
      return;
    }

    setStartingInquiry(true);
    setInquiryError(null);

    const { sendProductInquiryToChat } = await import('../../lib/chat/orderChatService');
    const result = await sendProductInquiryToChat(sellerUuid, {
      productUuid: p.productUuid,
      name: p.name,
      imageUrl: p.mainImageUrl,
      price: p.salePrice || p.price,
    });

    setStartingInquiry(false);

    if (!result.success) {
      setInquiryError(result.error ?? '문의를 시작하지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (onGo) {
      onGo(`/chat/${sellerUuid}`);
    } else {
      goTo(`/chat/${sellerUuid}`);
    }
  };

  const goTo = (to: string) => {
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  // 탭 콘텐츠 렌더링 함수
  const renderTabContent = () => {
    switch(activeTab) {
      case "info":
        return (
          <div className="space-y-6">
            {/* 상품 정보 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base">{t('common:productInfo')}</h3>
              <table className="w-full text-left text-sm">
                <tbody className="[&>tr>td]:py-2">
                  <tr><td className="w-40 text-gray-500">{t('product:detailPage.info.nailShape')}</td><td>{NAIL_SHAPE_NAME[p.nailShape] || p.nailShape}</td></tr>
                  <tr><td className="text-gray-500">{t('product:detailPage.info.nailLength')}</td><td>{NAIL_LENGTH_NAME[p.nailLength] || p.nailLength}</td></tr>
                  <tr><td className="text-gray-500">{t('common:lengthCustom')}</td><td>{p.nailOptions.lengthCustomizable ? t('common:available') : t('common:unavailable')}</td></tr>
                  <tr><td className="text-gray-500">{t('common:shapeCustom')}</td><td>{p.nailOptions.shapeCustomizable ? t('common:available') : t('common:unavailable')}</td></tr>
                  <tr><td className="text-gray-500">{t('common:designCustom')}</td><td>{p.nailOptions.designCustomizable ? t('common:available') : t('common:unavailable')}</td></tr>
                  <tr><td className="text-gray-500">{t('product:detailPage.info.productionTime')}</td><td>{p.processingDays}{t('common:daysUnit')}</td></tr>
                  {p.brand && <tr><td className="text-gray-500">{t('common:brand')}</td><td>{p.brand}</td></tr>}
                </tbody>
              </table>
            </div>

            {/* 상세 이미지 */}
            {product.detailImages && product.detailImages.length > 0 && (
              <div className="space-y-4">
                {product.detailImages.map((img, index) => (
                  <div key={img._id || index} className="space-y-2">
                    <img
                      src={img.url}
                      alt={img.description || `${product.name} 상세 이미지 ${index + 1}`}
                      className="w-full rounded-lg"
                    />
                    {img.description && (
                      <p className="text-center">{img.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "reviews":
        return (
          <div className="space-y-6">
            {/* 평점 요약 */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <IoMdStar className="w-8 h-8 text-yellow-400" />
                <span className="text-2xl font-bold">{p.rating.average.toFixed(1)}</span>
              </div>
              <div className="text-sm text-gray-600">
                {t('product:detailPage.review.totalCount', { count: p.rating.count.toLocaleString() })}
              </div>
            </div>

            {/* 별점 분포 막대 */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = ratingDistribution[rating.toString()] || 0;
                const percentage = p.rating.count > 0 ? (count / p.rating.count) * 100 : 0;
                return (
                  <button
                    key={rating}
                    onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                    className={`flex items-center gap-2 w-full p-1 rounded transition-colors ${
                      ratingFilter === rating ? 'bg-brand-50' : 'hover:bg-surface'
                    }`}
                  >
                    <span className="w-12 text-sm text-gray-600">{rating}{t('product:detailPage.review.ratingUnit')}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-xs text-gray-500 text-right">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* 정렬 옵션 */}
            <div className="flex gap-2">
              <button
                onClick={() => setReviewSort('newest')}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  reviewSort === 'newest' ? 'bg-ink text-white border-ink' : 'bg-white border-line hover:border-line-strong'
                }`}
              >
                {t('product:list.sortLatest')}
              </button>
              <button
                onClick={() => setReviewSort('rating')}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  reviewSort === 'rating' ? 'bg-ink text-white border-ink' : 'bg-white border-line hover:border-line-strong'
                }`}
              >
                {t('product:detailPage.review.sortRating')}
              </button>
              <button
                onClick={() => setReviewSort('photo')}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  reviewSort === 'photo' ? 'bg-ink text-white border-ink' : 'bg-white border-line hover:border-line-strong'
                }`}
              >
                {t('product:review.photoReview')}
              </button>
              {ratingFilter && (
                <button
                  onClick={() => setRatingFilter(null)}
                  className="px-3 py-1.5 text-sm text-brand hover:underline"
                >
                  {t('product:detailPage.review.clearFilter')}
                </button>
              )}
            </div>

            {/* 리뷰 목록 */}
            {reviewsLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-2" />
                <p className="text-gray-500">{t('product:detailPage.review.loading')}</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                {ratingFilter ? t('product:detailPage.review.noRatings', { rating: ratingFilter }) : t('product:review.noReviews')}
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={(review as any).reviewUuid || (review as any)._id || review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{(review as any).userUuid?.name || review.user?.name || t('product:detailPage.review.anonymous')}</span>
                      <Stars v={review.rating} />
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                      {review.verifiedPurchase && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {t('product:detailPage.review.verified')}
                        </span>
                      )}
                    </div>

                    {/* 리뷰 이미지 */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mb-2 overflow-x-auto">
                        {review.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img.url}
                            alt={t('product:detailPage.review.imageAlt', { index: idx + 1 })}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-90"
                            onClick={() => window.open(img.url, '_blank')}
                          />
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-gray-700">{review.content}</p>

                    {/* 도움이 됐어요 */}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <button
                        onClick={async () => {
                          if (!currentUser) {
                            openLogin();
                            return;
                          }
                          try {
                            const reviewId = (review as any).reviewUuid || (review as any)._id || review.id;
                            await reviewService.markReviewHelpful(product!.productUuid, reviewId, true);
                            await loadProductReviews(reviewsPage);
                          } catch (err: any) {
                            console.error('Failed to vote helpful:', err);
                          }
                        }}
                        className="flex items-center gap-1 hover:text-brand"
                      >
                        <span>👍</span>
                        <span>{t('product:detailPage.review.helpful')} ({review.helpful?.upVotes || 0})</span>
                      </button>
                    </div>

                    {/* 판매자 답변 */}
                    {review.reply && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-brand-700">{t('product:detailPage.review.sellerReply')}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(review.reply.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{review.reply.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {reviewsPagination && reviewsPagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => loadProductReviews(reviewsPage - 1)}
                  disabled={!reviewsPagination.hasPrev}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('common:prev')}
                </button>
                <span className="text-sm text-gray-600">
                  {reviewsPage} / {reviewsPagination.totalPages}
                </span>
                <button
                  onClick={() => loadProductReviews(reviewsPage + 1)}
                  disabled={!reviewsPagination.hasNext}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('common:next')}
                </button>
              </div>
            )}
          </div>
        );

      case "qa":
        // 실제 상품 Q&A 컴포넌트 연결 (기존에는 전 상품 동일한 목업 문답이 렌더됐음)
        return (
          <ProductQA
            productUuid={(product as any)?.productUuid || id}
            sellerUserId={(product as any)?.sellerUuid}
          />
        );

      case "shipping":
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-base mb-3">{t('product:detail.deliveryInfo')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <span className="text-gray-500 w-20">{t('product:detailPage.shipping.fee')}</span>
                    <span>{t('product:detailPage.shipping.freeShippingDesc')}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-gray-500 w-20">{t('product:detailPage.shipping.period')}</span>
                    <span>{t('product:detailPage.shipping.processingTime')}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-gray-500 w-20">{t('product:detailPage.shipping.area')}</span>
                    <span>{t('product:detailPage.shipping.areaDesc')}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-gray-500 w-20">{t('product:detailPage.shipping.carrier')}</span>
                    <span>{t('product:detailPage.shipping.carriers')}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-base mb-3">{t('product:detail.returnPolicy')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <span className="text-gray-500 w-20">{t('product:detailPage.returns.period')}</span>
                    <span>{t('product:detailPage.returns.periodDesc')}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-gray-500 w-20">{t('product:detailPage.returns.conditions')}</span>
                    <span>{t('product:detailPage.returns.conditionsDesc')}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-gray-500 w-20">{t('product:detailPage.returns.cost')}</span>
                    <span>{t('product:detailPage.returns.costDesc')}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-gray-500 w-20">{t('product:detailPage.returns.reasons')}</span>
                    <span>{t('product:detailPage.returns.reasonsDesc')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">{t('product:detailPage.returns.caution')}</h4>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• {t('product:detailPage.returns.caution1')}</li>
                <li>• {t('product:detailPage.returns.caution2')}</li>
                <li>• {t('product:detailPage.returns.caution3')}</li>
              </ul>
            </div>
            <div className="text-center">
              <button
                onClick={() => {
                  if (onGo) {
                    onGo('/support/contact');
                  } else {
                    window.location.href = '/support/contact';
                  }
                }}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg text-sm"
              >{t('product:detailPage.contactCustomerService')}</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-28 md:pb-6">

      {/* 상단 그리드: 이미지 / 정보 (B안 — 이미지 몰입형) */}
      <div className="grid md:gap-6 md:grid-cols-2">
        {/* 히어로: 모바일 풀블리드 3:4 + 하단 페이드 + 타이틀 오버레이 */}
        <div>
          <div className="relative -mx-4 -mt-6 overflow-hidden bg-surface md:mx-0 md:mt-0 md:rounded-2xl">
            <img
              src={heroImage}
              alt={p.name}
              className="w-full aspect-[3/4] object-cover"
            />
            {p.isNewProduct && (
              <span className="absolute left-4 top-4 z-[2] bg-brand text-white text-[11px] font-bold px-2.5 py-1 rounded-full">NEW</span>
            )}
            {galleryImages.length > 1 && (
              <span className="absolute right-4 bottom-10 z-[2] rounded-full bg-ink/40 px-2.5 py-0.5 text-[11px] font-semibold text-white [font-variant-numeric:tabular-nums] md:bottom-4 md:bg-ink/10 md:text-ink">
                {activeHeroIdx + 1} / {galleryImages.length}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink/50 to-transparent md:hidden" />
            <div className="absolute left-4 right-4 bottom-9 z-[1] text-white md:hidden">
              <div className="text-[11.5px] font-semibold tracking-wide opacity-90">{p.brand}</div>
              <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">{p.name}</h1>
            </div>
          </div>
        </div>

        {/* 정보 시트: 모바일에서 히어로 위로 라운드 카드처럼 겹침 */}
        <div className="space-y-3 max-md:relative max-md:z-[2] max-md:-mx-4 max-md:-mt-5 max-md:rounded-t-2xl max-md:bg-white max-md:px-4 max-md:pt-6">
          <button
            className="text-[11.5px] font-semibold tracking-wide text-muted hover:text-brand text-left max-md:hidden"
            onClick={() => goTo("/brands")}
          >
            {p.brand}
          </button>
          <h1 className="text-xl font-bold tracking-tight text-ink max-md:hidden">{p.name}</h1>

          {/* 평점 메타 */}
          <div className="text-[12.5px] text-muted">
            <IoMdStar className="inline w-4 h-4 text-amber-400 align-[-3px]" />{' '}
            <b className="font-bold text-ink [font-variant-numeric:tabular-nums]">{p.rating.average.toFixed(1)}</b>
            {' · '}
            <span>{t('product:detail.reviewCount', { count: p.rating.count.toLocaleString() })}</span>
            {' · '}
            <span>{t('product:detail.freeDelivery')}</span>
          </div>

          {/* 가격 */}
          <div className="flex items-baseline gap-1.5 [font-variant-numeric:tabular-nums]">
            {hasDiscount && <span className="text-2xl font-extrabold text-brand">{discountRate}%</span>}
            <div className="text-2xl font-extrabold tracking-tight text-ink">{money(salePrice)}</div>
            {hasDiscount && <div className="text-sm text-muted line-through">{money(p.price)}</div>}
          </div>

          {/* 썸네일 스트립 (B안: 시트 상단, 가격 아래) */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {galleryImages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIdx(i)}
                  aria-label={`${i + 1}번째 이미지 보기`}
                  className={`w-[52px] h-[52px] rounded-xl overflow-hidden bg-surface flex-shrink-0 ${
                    i === activeHeroIdx ? 'ring-2 ring-brand' : ''
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* 옵션 */}
          <div className="pt-2 space-y-2">
            {/* 쉐입 옵션 */}
            <div>
              <div className="mb-2 text-xs font-semibold tracking-wider text-muted">{t('product:detailPage.option.shape')}</div>
              {isStocked ? (
                // 기성 재고: variants에 존재하는 쉐입만 표시, 전 조합 품절 쉐입은 취소선+비활성
                <div className="flex flex-wrap gap-2">
                  {stockedShapes.map((s) => {
                    const koreanName = NAIL_SHAPE_NAME[s] || s;
                    const soldOut = isShapeSoldOut(s);
                    const modifierLabel = shapeModifierLabel(s);

                    return (
                      <button
                        key={s}
                        onClick={() => handleShapeSelect(s)}
                        disabled={soldOut}
                        className={`inline-flex items-center h-[34px] px-3.5 rounded-full border text-[13px] font-semibold transition-colors ${
                          soldOut
                            ? "bg-surface border-surface text-muted line-through cursor-not-allowed"
                            : shape === s
                              ? "bg-ink text-white border-ink"
                              : "bg-white border-line text-ink hover:border-line-strong"
                        }`}
                      >
                        {koreanName}
                        {!soldOut && modifierLabel && (
                          <span className={`ml-1 text-xs ${shape === s ? 'text-white/70' : 'text-brand'}`}>
                            {modifierLabel}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : p.nailOptions?.shapeCustomizable ? (
                // 커스터마이징 가능: 선택 가능한 버튼들 표시
                <div className="flex flex-wrap gap-2">
                  {NAIL_SHAPES.map((s) => {
                    const koreanName = NAIL_SHAPE_NAME[s] || s;

                    return (
                      <button
                        key={s}
                        onClick={() => setShape(s)}
                        className={`inline-flex items-center h-[34px] px-3.5 rounded-full border text-[13px] font-semibold transition-colors ${
                          shape === s
                            ? "bg-ink text-white border-ink"
                            : "bg-white border-line text-ink hover:border-line-strong"
                        }`}
                      >
                        {koreanName}
                      </button>
                    );
                  })}
                </div>
              ) : (
                // 커스터마이징 불가능: 고정값만 텍스트로 표시
                <div className="text-sm text-ink">
                  {NAIL_SHAPE_NAME[p.nailShape] || p.nailShape} <span className="text-muted">{t('product:detailPage.option.notEditable')}</span>
                </div>
              )}
            </div>
            {/* 길이 옵션 */}
            <div>
              <div className="mb-2 text-xs font-semibold tracking-wider text-muted">{t('product:detailPage.option.length')}</div>
              {isStocked ? (
                // 기성 재고: 선택된 쉐입 기준 존재하는 길이만 표시, 품절 조합은 취소선+비활성+품절 라벨
                <div className="flex flex-wrap gap-2">
                  {stockedLengths.map((l) => {
                    const koreanName = NAIL_LENGTH_NAME[l] || l;
                    const v = findVariant(shape, l);
                    const soldOut = !v?.isAvailable;
                    const modifierLabel = formatModifier(v?.priceModifier);

                    return (
                      <button
                        key={l}
                        onClick={() => setLength(l)}
                        disabled={soldOut}
                        className={`inline-flex items-center h-[34px] px-3.5 rounded-full border text-[13px] font-semibold transition-colors ${
                          soldOut
                            ? "bg-surface border-surface text-muted cursor-not-allowed"
                            : length === l
                              ? "bg-ink text-white border-ink"
                              : "bg-white border-line text-ink hover:border-line-strong"
                        }`}
                      >
                        <span className={soldOut ? "line-through" : ""}>{koreanName}</span>
                        {soldOut ? (
                          <span className="ml-1 text-xs">품절</span>
                        ) : (
                          modifierLabel && (
                            <span className={`ml-1 text-xs ${length === l ? 'text-white/70' : 'text-brand'}`}>
                              {modifierLabel}
                            </span>
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : p.nailOptions?.lengthCustomizable ? (
                // 커스터마이징 가능: 선택 가능한 버튼들 표시
                <div className="flex flex-wrap gap-2">
                  {NAIL_LENGTHS.map((s) => {
                    const koreanName = NAIL_LENGTH_NAME[s] || s;

                    return (
                      <button
                        key={s}
                        onClick={() => setLength(s)}
                        className={`inline-flex items-center h-[34px] px-3.5 rounded-full border text-[13px] font-semibold transition-colors ${
                          length === s
                            ? "bg-ink text-white border-ink"
                            : "bg-white border-line text-ink hover:border-line-strong"
                        }`}
                      >
                        {koreanName}
                      </button>
                    );
                  })}
                </div>
              ) : (
                // 커스터마이징 불가능: 고정값만 텍스트로 표시
                <div className="text-sm text-ink">
                  {NAIL_LENGTH_NAME[p.nailLength] || p.nailLength} <span className="text-muted">{t('product:detailPage.option.notEditable')}</span>
                </div>
              )}
            </div>
          </div>

          {/* 기성 재고: 선택 요약 바 (조합·최종가·재고·발송 안내 실시간 갱신) */}
          {isStocked && (
            <div className="rounded-xl bg-surface px-4 py-3 text-[13px]">
              {allSoldOut ? (
                <span className="font-semibold text-red-500">품절 — 모든 옵션이 품절되었습니다</span>
              ) : selectedVariant ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 [font-variant-numeric:tabular-nums]">
                  <span className="text-muted">
                    선택: <b className="font-semibold text-ink">{NAIL_SHAPE_NAME[shape] || shape} · {NAIL_LENGTH_NAME[length] || length}</b>
                  </span>
                  <span className="text-line-strong">|</span>
                  <span className="font-bold text-brand">{money(selectedVariant.finalPrice)}</span>
                  <span className="text-line-strong">|</span>
                  <span className={selectedVariant.isAvailable ? "text-muted" : "font-semibold text-red-500"}>
                    {stockStatusText}
                  </span>
                </div>
              ) : (
                <span className="text-muted">옵션을 선택해주세요</span>
              )}
            </div>
          )}

          {/* 주문 제작: 제작 소요일 안내 */}
          {!isStocked && (
            <div className="rounded-xl bg-surface px-4 py-3 text-[13px] text-muted">
              주문 후 제작 — <b className="font-semibold text-ink">약 {p.processingDays}일 소요</b>
            </div>
          )}

          {/* 수량 */}
          <div className="flex items-center gap-3 pt-2">
            <div className="text-xs font-semibold tracking-wider text-muted">{t('common:quantity')}</div>
            <div className="inline-flex items-center rounded-full border border-line [font-variant-numeric:tabular-nums]">
              <button className="px-3.5 py-1.5 text-muted hover:text-ink" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
              <div className="w-10 text-center text-sm font-semibold">{qty}</div>
              <button className="px-3.5 py-1.5 text-muted hover:text-ink" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
          </div>

          {/* 장바구니 메시지 */}
          {cartMessage && (
            <div className={`p-2 rounded text-sm text-center ${
              cartMessage.includes('실패') || cartMessage.includes('에러') 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {cartMessage}
            </div>
          )}

          {/* 구매 버튼 - productType에 따라 분기 */}
          {p.productType === 'custom' ? (
            <div className="pt-2">
              <button
                onClick={() => {
                  if (!currentUser) { openLogin(); return; }
                  onGo?.(`/product/${p.productUuid}/custom-order`);
                }}
                className="w-full rounded-full py-3 text-white font-semibold bg-brand hover:bg-brand-600 transition-colors"
              >
                {t('product:detailPage.customOrderButton')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={addToCart}
                disabled={addingToCart || !canPurchase}
                className={`rounded-full py-3 font-semibold flex items-center justify-center gap-2 transition-colors ${
                  addingToCart || !canPurchase
                    ? 'bg-surface text-muted cursor-not-allowed'
                    : 'bg-brand-50 text-brand hover:bg-brand-100'
                }`}
              >
                {addingToCart && <div className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin"></div>}
                {!canPurchase ? t('product:detail.outOfStock') : addingToCart ? t('product:detailPage.addingToCart') : t('product:detail.addToCart')}
              </button>
              <button
                onClick={buyNow}
                disabled={addingToCart || !canPurchase}
                className={`rounded-full py-3 text-white font-semibold flex items-center justify-center transition-colors ${
                  addingToCart || !canPurchase
                    ? 'bg-line-strong cursor-not-allowed'
                    : 'bg-brand hover:bg-brand-600'
                }`}
              >
                {!canPurchase ? t('product:detail.outOfStock') : t('product:detail.buyNow')}
              </button>
            </div>
          )}

          {/* 판매자에게 문의 — 채팅방을 열고 상품 카드를 먼저 보낸다 */}
          {(p as any)?.sellerUuid && (
            <div className="pt-2">
              <button
                onClick={contactSeller}
                disabled={startingInquiry}
                className="w-full rounded-full border border-line py-2.5 text-sm font-semibold text-ink
                           flex items-center justify-center gap-2 hover:bg-surface
                           transition-colors disabled:opacity-50"
              >
                <FaRegComments className="w-4 h-4" />
                {startingInquiry ? '채팅방 여는 중...' : '판매자에게 문의'}
              </button>
              {inquiryError && (
                <p className="mt-2 text-xs text-red-600">{inquiryError}</p>
              )}
            </div>
          )}

          {/* 도구 */}
          <div className="flex items-center gap-3 text-sm pt-1">
            <button onClick={() => handleLike(id)} className="flex items-center gap-1 hover:text-gray-600">
              {liked ? <FaHeart className="w-4 h-4 text-red-500" /> : <FaRegHeart className="w-4 h-4" />}
              <span>{liked ? t('product:detailPage.liked') : t('product:detailPage.unliked')}</span>
            </button>
            <button onClick={share} className="hover:text-gray-600">{t('common:share')}</button>
            <button
              onClick={handleSizingClick}
              className="hover:text-gray-600"
            >
              {t('product:detailPage.sizing')}
            </button>
          </div>

          {/* 네일 카테고리 */}
          {p.nailCategories && (
            <CategoryDisplay
              categories={p.nailCategories}
              onCategoryClick={(key, value) => {
                // 카테고리 클릭 시 해당 카테고리로 이동
                window.location.href = `/cat/${key}/${encodeURIComponent(value)}`;
              }}
            />
          )}
        </div>
      </div>

      {/* 상세/리뷰/Q&A/배송 탭 */}
      <div className="mt-8">
        <div className="border-b">
          <div className="mx-auto max-w-6xl px-4 flex gap-6">
            {(["info", "reviews", "qa", "shipping"] as const).map((tabKey) => {
              const tabLabels: Record<string, string> = {
                info: t('product:detailPage.tabs.info'),
                reviews: t('product:detailPage.tabs.reviews'),
                qa: t('product:detailPage.tabs.qa'),
                shipping: t('product:detailPage.tabs.shipping'),
              };
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`relative px-4 py-3 text-sm font-semibold transition-colors duration-200 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-ink after:transform after:transition-transform after:duration-200 ${
                    isActive
                      ? 'text-ink after:scale-x-100'
                      : 'text-muted hover:text-ink after:scale-x-0 hover:after:scale-x-100'
                  }`}
                >
                  {tabLabels[tabKey]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6 text-sm leading-7 text-gray-700">
          {renderTabContent()}
        </div>
      </div>

      {/* 모바일 하단 고정 구매바 — B안: 하트 서클 + 라운드풀 버튼 2개 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 pt-3 pb-4 md:hidden">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleLike(id)}
            aria-label={liked ? '찜 해제' : '찜'}
            className="flex-shrink-0 w-12 h-12 rounded-full border border-line
                       flex items-center justify-center text-lg text-brand
                       hover:bg-surface transition-colors"
          >
            {liked ? <FaHeart /> : <FaRegHeart />}
          </button>
          {p.productType === 'custom' ? (
            <button
              onClick={() => {
                if (!currentUser) { openLogin(); return; }
                onGo?.(`/product/${p.productUuid}/custom-order`);
              }}
              className="flex-1 h-12 rounded-full text-[15px] text-white font-semibold bg-brand hover:bg-brand-600 transition-colors"
            >
              {t('product:detailPage.customOrderButton')}
            </button>
          ) : (
            <>
              <button
                onClick={addToCart}
                disabled={addingToCart || !canPurchase}
                className={`flex-1 h-12 rounded-full text-[15px] font-semibold transition-colors ${
                  addingToCart || !canPurchase
                    ? 'bg-surface text-muted cursor-not-allowed'
                    : 'bg-brand-50 text-brand hover:bg-brand-100'
                }`}
              >
                {!canPurchase ? t('product:detail.outOfStock') : addingToCart ? t('product:detailPage.addingToCart') : t('common:cart')}
              </button>
              <button
                onClick={buyNow}
                disabled={addingToCart || !canPurchase}
                className={`flex-1 h-12 rounded-full text-[15px] text-white font-semibold transition-colors [font-variant-numeric:tabular-nums] ${
                  addingToCart || !canPurchase
                    ? 'bg-line-strong cursor-not-allowed'
                    : 'bg-brand hover:bg-brand-600'
                }`}
              >
                {!canPurchase
                  ? t('product:detail.outOfStock')
                  : `${money(isStocked ? unitPrice * qty : salePrice)} 구매`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
