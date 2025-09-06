import { useState, useMemo, useEffect } from 'react';
import { Product } from '@handy-platform/shared';
import { productService, cartService } from '../../services/apiService';
import { money } from '../../utils';
import { CategoryDisplay } from './CategoryDisplay';

export function Detail({
  id,
  onBack,
  onAdd,
  onCartUpdate,
}: {
  id: string;
  onBack: () => void;
  onAdd: (id: string) => void;
  onCartUpdate?: () => void;
}) {
  // 모든 상태를 컴포넌트 최상단에 선언 (Hook 순서 보장)
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [shape, setShape] = useState<string>("ROUND");
  const [length, setLength] = useState<string>("SHORT");
  const [qty, setQty] = useState<number>(1);
  const [liked, setLiked] = useState(false);

  // 이미지 갤러리 (항상 호출되도록)
  const images = useMemo(
    () => product ? [
      product.mainImageUrl,
      ...(product.detailImages?.map(img => img.url) || []),
      `https://picsum.photos/seed/${id}-1/800/800`,
      `https://picsum.photos/seed/${id}-2/800/800`,
    ] : [],
    [id, product?.mainImageUrl, product?.detailImages]
  );

  // 상품 데이터 로딩
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productService.getProduct(id);
        setProduct(response.data);
      } catch (err: any) {
        setError(err.message || '상품을 불러오는데 실패했습니다.');
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

  // 장바구니 담기 함수
  const addToCart = async () => {
    if (!product) return;
    
    try {
      setAddingToCart(true);
      setCartMessage(null);
      
      const options = {
        nailShape: shape,
        nailLength: length
      };
      
      await cartService.addToCart(product.productId, qty, options);
      
      setCartMessage('장바구니에 추가되었습니다!');
      onAdd(product.productId);
      
      if (onCartUpdate) {
        onCartUpdate();
      }
      
      setTimeout(() => setCartMessage(null), 3000);
      
    } catch (err: any) {
      const errorMessage = err.message || '장바구니 추가에 실패했습니다.';
      setCartMessage(errorMessage);
      console.error('Add to cart failed:', err);
      
      setTimeout(() => setCartMessage(null), 5000);
    } finally {
      setAddingToCart(false);
    }
  };
  
  // 바로구매 함수
  const buyNow = async () => {
    try {
      await addToCart();
      alert('바로구매 기능은 곧 구현됩니다!');
    } catch (err) {
      console.error('Buy now failed:', err);
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
        alert("링크가 복사되었어요!"); 
      } catch {
        alert("공유를 지원하지 않는 브라우저입니다.");
      }
    }
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
          <div className="text-gray-500 mb-4">상품을 찾을 수 없습니다</div>
          <div className="text-sm text-red-500 mb-4">{error}</div>
          <button onClick={onBack} className="px-4 py-2 bg-black text-white rounded">← 뒤로가기</button>
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* 브레드크럼 + 뒤로가기 */}
      <div className="mb-3 flex items-center gap-3 text-sm text-gray-500">
        <button onClick={onBack} className="underline">← Back</button>
        <span className="select-none">/</span>
        <button onClick={() => goTo("/")} className="hover:underline">Home</button>
        <span>/</span>
        <button className="hover:underline" onClick={() => goTo("/brands")}>{p.brand}</button>
      </div>

      {/* 상단 그리드: 갤러리 / 정보 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 갤러리 */}
        <div>
          <div className="relative overflow-hidden rounded-lg bg-gray-100">
            <img
              src={images[imgIdx] || p.mainImageUrl}
              className="w-full aspect-[3/4] object-cover"
            />
            {/* 좌우 이동(간단) */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
              <button
                onClick={() => setImgIdx((v) => (v - 1 + images.length) % images.length)}
                className="rounded-full bg-white/80 p-2 shadow hover:bg-white"
                aria-label="prev"
              >‹</button>
              <button
                onClick={() => setImgIdx((v) => (v + 1) % images.length)}
                className="rounded-full bg-white/80 p-2 shadow hover:bg-white"
                aria-label="next"
              >›</button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`rounded-md overflow-hidden border ${i === imgIdx ? "border-black" : "border-transparent"}`}
              >
                <img src={src} className="aspect-square object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* 정보 */}
        <div className="space-y-3">
          <div className="text-xs text-gray-500">{p.brand}</div>
          <h1 className="text-xl font-semibold">{p.name}</h1>

          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold">{money(salePrice)}원</div>
            {p.salePrice && p.salePrice < p.price ? (
              <>
                <div className="text-sm text-gray-400 line-through">{money(p.price)}원</div>
                <span className="rounded bg-red-500 px-2 py-0.5 text-xs text-white">할인</span>
              </>
            ) : null}
          </div>

          {/* 간단 메타 */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>⭐ {p.rating.average.toFixed(1)}</span>
            <span className="text-gray-400">|</span>
            <span>리뷰 {p.rating.count.toLocaleString()}개</span>
            <span className="text-gray-400">|</span>
            <span>무료배송</span>
          </div>

          {/* 옵션 */}
          <div className="pt-2 space-y-2">
            <div>
              <div className="mb-1 text-sm text-gray-600">쉐입</div>
              <div className="flex flex-wrap gap-2">
                {["ROUND", "ALMOND", "SQUARE", "OVAL", "COFFIN"].map((s) => {
                  const koreanName = {
                    'ROUND': '라운드',
                    'ALMOND': '아몬드', 
                    'SQUARE': '스퀘어',
                    'OVAL': '오벌',
                    'COFFIN': '코핀'
                  }[s] || s;
                  
                  const isAvailable = p.nailOptions?.shapeCustomizable !== false;
                  
                  return (
                    <button
                      key={s}
                      onClick={() => setShape(s)}
                      disabled={!isAvailable}
                      className={`rounded border px-3 py-1 text-sm ${
                        shape === s 
                          ? "bg-black text-white border-black" 
                          : isAvailable 
                            ? "bg-white hover:bg-gray-50" 
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {koreanName}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm text-gray-600">길이</div>
              <div className="flex flex-wrap gap-2">
                {["SHORT", "MEDIUM", "LONG"].map((s) => {
                  const koreanName = {
                    'SHORT': '쇼트',
                    'MEDIUM': '미디움',
                    'LONG': '롱'
                  }[s] || s;
                  
                  const isAvailable = p.nailOptions?.lengthCustomizable !== false;
                  
                  return (
                    <button
                      key={s}
                      onClick={() => setLength(s)}
                      disabled={!isAvailable}
                      className={`rounded border px-3 py-1 text-sm ${
                        length === s 
                          ? "bg-black text-white border-black" 
                          : isAvailable 
                            ? "bg-white hover:bg-gray-50" 
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {koreanName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 수량 */}
          <div className="flex items-center gap-3 pt-2">
            <div className="text-sm text-gray-600">수량</div>
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

          {/* 구매 버튼 */}
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
              {!p.isInStock ? '품절' : addingToCart ? '담는 중...' : '장바구니 담기'}
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
              바로구매
            </button>
          </div>

          {/* 도구 */}
          <div className="flex items-center gap-3 text-sm pt-1">
            <button onClick={() => setLiked((v) => !v)} className="underline">{liked ? "♥ 찜됨" : "♡ 찜하기"}</button>
            <button onClick={share} className="underline">공유</button>
            <button
              onClick={() => { try { (window as any).ReactNativeWebView?.postMessage(JSON.stringify({ type: "open-sizing", productId: p.productId })); } catch {} }}
              className="underline"
            >
              사이징(앱)
            </button>
          </div>

          {/* 간략 정보 */}
          <ul className="list-disc pl-5 text-sm text-gray-700 pt-2 space-y-1">
            <li>옵션: {shape} / {length}</li>
            <li>구성품: 네일 팁 세트, 접착 젤, 파일, 프렙 패드</li>
            <li>제조국: KR</li>
          </ul>

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
            {["상세정보", "리뷰", "Q&A", "배송/반품"].map((t) => (
              <button
                key={t}
                className="border-b-2 border-black pb-3 text-sm font-semibold"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6 text-sm leading-7 text-gray-700">
          <div className="space-y-3">
            <p>견고한 접착력과 편안한 착용감을 가진 핸디 네일 팁. 데일리부터 스페셜데이까지 다양한 스타일을 손쉽게 연출하세요.</p>
            <table className="w-full text-left text-sm">
              <tbody className="[&>tr>td]:py-2">
                <tr><td className="w-28 text-gray-500">재질</td><td>ABS, UV Gel</td></tr>
                <tr><td className="text-gray-500">텍스쳐</td><td>매트/글로시</td></tr>
                <tr><td className="text-gray-500">호환</td><td>핸디 젤/자석 악세사리</td></tr>
              </tbody>
            </table>
            <img src={`https://picsum.photos/seed/${id}-detail/1200/600`} className="w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* 모바일 하단 고정 구매바 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-3 md:hidden">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
          <div className="text-base font-semibold">{money(salePrice)}원</div>
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
              {!p.isInStock ? '품절' : addingToCart ? '담는 중...' : '장바구니'}
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
              구매하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}