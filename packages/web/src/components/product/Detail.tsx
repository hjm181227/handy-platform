import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, User, NAIL_SHAPE_NAME, NAIL_LENGTH_NAME, NAIL_SHAPES, NAIL_LENGTHS, DetailedReview, navigateService } from '@handy-platform/shared';
import { productService, cartService, reviewService } from '../../services/apiService';
import { money } from '../../utils';
import { CategoryDisplay } from './CategoryDisplay';
import { Stars } from '../ui';
import { IoMdStar } from 'react-icons/io';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useLikes } from '../../hooks/useLikes';
import ProductQA from './ProductQA';

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
  const [shape, setShape] = useState<string>("ROUND");
  const [length, setLength] = useState<string>("SHORT");
  const [qty, setQty] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>("info");

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

  // 상품이 로드된 후 옵션 초기화
  useEffect(() => {
    if (product) {
      setShape(product.nailShape || "ROUND");
      setLength(product.nailLength || "SHORT");
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
            <div className="bg-gray-200 aspect-[3/4] rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
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
          <button onClick={onBack} className="px-4 py-2 bg-black text-white rounded">{t('product:detailPage.backButton')}</button>
        </div>
      </div>
    );
  }

  const p = product;
  const salePrice = p.salePrice || p.price;

  // 내부 이동(추천 영역 등에서 사용) — 라우터 nav 없이도 동작하게
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
                      ratingFilter === rating ? 'bg-purple-50' : 'hover:bg-gray-50'
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
                  reviewSort === 'newest' ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
              >
                {t('product:list.sortLatest')}
              </button>
              <button
                onClick={() => setReviewSort('rating')}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  reviewSort === 'rating' ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
              >
                {t('product:detailPage.review.sortRating')}
              </button>
              <button
                onClick={() => setReviewSort('photo')}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  reviewSort === 'photo' ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
              >
                {t('product:review.photoReview')}
              </button>
              {ratingFilter && (
                <button
                  onClick={() => setRatingFilter(null)}
                  className="px-3 py-1.5 text-sm text-purple-600 hover:underline"
                >
                  {t('product:detailPage.review.clearFilter')}
                </button>
              )}
            </div>

            {/* 리뷰 목록 */}
            {reviewsLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2" />
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
                      <button className="flex items-center gap-1 hover:text-purple-600">
                        <span>👍</span>
                        <span>{t('product:detailPage.review.helpful')} ({review.helpful?.upVotes || 0})</span>
                      </button>
                    </div>

                    {/* 판매자 답변 */}
                    {review.reply && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-purple-700">{t('product:detailPage.review.sellerReply')}</span>
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
              <button className="px-6 py-3 bg-gray-900 text-white rounded-lg text-sm">{t('product:detailPage.contactCustomerService')}</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">

      {/* 상단 그리드: 이미지 / 정보 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 메인 이미지 */}
        <div>
          <div className="overflow-hidden rounded-lg bg-gray-100">
            <img
              src={p.mainImageUrl}
              alt={p.name}
              className="w-full aspect-[3/4] object-cover"
            />
          </div>
        </div>

        {/* 정보 */}
        <div className="space-y-3">
          <button
            className="text-xs text-gray-500 hover:text-gray-700 hover:underline text-left"
            onClick={() => goTo("/brands")}
          >
            {p.brand}
          </button>
          <h1 className="text-xl font-semibold">{p.name}</h1>

          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold">{money(salePrice)}</div>
            {p.salePrice && p.salePrice < p.price ? (
              <>
                <div className="text-sm text-gray-400 line-through">{money(p.price)}</div>
                <span className="rounded bg-red-500 px-2 py-0.5 text-xs text-white">{t('common:discount')}</span>
              </>
            ) : null}
          </div>

          {/* 간단 메타 */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <IoMdStar className="w-4 h-4 text-yellow-400" />
              <span>{p.rating.average.toFixed(1)}</span>
            </div>
            <span className="text-gray-400">|</span>
            <span>{t('product:detail.reviewCount', { count: p.rating.count.toLocaleString() })}</span>
            <span className="text-gray-400">|</span>
            <span>{t('product:detail.freeDelivery')}</span>
          </div>

          {/* 옵션 */}
          <div className="pt-2 space-y-2">
            {/* 쉐입 옵션 */}
            <div>
              <div className="mb-1 text-sm text-gray-600">{t('product:detailPage.option.shape')}</div>
              {p.nailOptions?.shapeCustomizable ? (
                // 커스터마이징 가능: 선택 가능한 버튼들 표시
                <div className="flex flex-wrap gap-2">
                  {NAIL_SHAPES.map((s) => {
                    const koreanName = NAIL_SHAPE_NAME[s] || s;

                    return (
                      <button
                        key={s}
                        onClick={() => setShape(s)}
                        className={`rounded border px-3 py-1 text-sm ${
                          shape === s
                            ? "bg-black text-white border-black"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {koreanName}
                      </button>
                    );
                  })}
                </div>
              ) : (
                // 커스터마이징 불가능: 고정값만 텍스트로 표시
                <div className="text-sm">
                  {NAIL_SHAPE_NAME[p.nailShape] || p.nailShape} <span className="text-gray-400">{t('product:detailPage.option.notEditable')}</span>
                </div>
              )}
            </div>
            {/* 길이 옵션 */}
            <div>
              <div className="mb-1 text-sm text-gray-600">{t('product:detailPage.option.length')}</div>
              {p.nailOptions?.lengthCustomizable ? (
                // 커스터마이징 가능: 선택 가능한 버튼들 표시
                <div className="flex flex-wrap gap-2">
                  {NAIL_LENGTHS.map((s) => {
                    const koreanName = NAIL_LENGTH_NAME[s] || s;

                    return (
                      <button
                        key={s}
                        onClick={() => setLength(s)}
                        className={`rounded border px-3 py-1 text-sm ${
                          length === s
                            ? "bg-black text-white border-black"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {koreanName}
                      </button>
                    );
                  })}
                </div>
              ) : (
                // 커스터마이징 불가능: 고정값만 텍스트로 표시
                <div className="text-sm">
                  {NAIL_LENGTH_NAME[p.nailLength] || p.nailLength} <span className="text-gray-400">{t('product:detailPage.option.notEditable')}</span>
                </div>
              )}
            </div>
          </div>

          {/* 수량 */}
          <div className="flex items-center gap-3 pt-2">
            <div className="text-sm text-gray-600">{t('common:quantity')}</div>
            <div className="inline-flex items-center rounded border">
              <button className="px-3 py-1" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
              <div className="w-10 text-center">{qty}</div>
              <button className="px-3 py-1" onClick={() => setQty((q) => q + 1)}>+</button>
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
                  onGo(`/product/${p.productUuid}/custom-order`);
                }}
                className="w-full rounded-lg py-3 text-white font-medium bg-rose-500 hover:bg-rose-600 transition-colors"
              >
                {t('product:detailPage.customOrderButton')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={addToCart}
                disabled={addingToCart || !p.isInStock}
                className={`rounded-lg border py-2 flex items-center justify-center gap-2 ${
                  addingToCart
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : !p.isInStock
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'hover:bg-gray-50'
                }`}
              >
                {addingToCart && <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>}
                {!p.isInStock ? t('product:detail.outOfStock') : addingToCart ? t('product:detailPage.addingToCart') : t('product:detail.addToCart')}
              </button>
              <button
                onClick={buyNow}
                disabled={addingToCart || !p.isInStock}
                className={`rounded-lg py-2 text-white flex items-center justify-center ${
                  addingToCart || !p.isInStock
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-black hover:bg-gray-800'
                }`}
              >
                {t('product:detail.buyNow')}
              </button>
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
                  className={`relative px-4 py-3 text-sm font-medium transition-colors duration-200 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-black after:transform after:transition-transform after:duration-200 ${
                    isActive
                      ? 'text-black after:scale-x-100'
                      : 'text-gray-600 hover:text-black after:scale-x-0 hover:after:scale-x-100'
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

      {/* 모바일 하단 고정 구매바 - productType에 따라 분기 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-3 md:hidden">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
          <div className="text-base font-semibold">{money(salePrice)}</div>
          {p.productType === 'custom' ? (
            <button
              onClick={() => {
                if (!currentUser) { openLogin(); return; }
                onGo?.(`/product/${p.productUuid}/custom-order`);
              }}
              className="rounded-lg px-6 py-2 text-sm text-white font-medium bg-rose-500 hover:bg-rose-600 transition-colors"
            >
              {t('product:detailPage.customOrderButton')}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={addToCart}
                disabled={addingToCart || !p.isInStock}
                className={`rounded-lg border px-4 py-2 text-sm ${
                  addingToCart || !p.isInStock
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                }`}
              >
                {!p.isInStock ? t('product:detail.outOfStock') : addingToCart ? t('product:detailPage.addingToCart') : t('common:cart')}
              </button>
              <button
                onClick={buyNow}
                disabled={addingToCart || !p.isInStock}
                className={`rounded-lg px-4 py-2 text-sm text-white ${
                  addingToCart || !p.isInStock
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-black hover:bg-gray-800'
                }`}
              >
                {t('product:detailPage.buyNowMobile')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
