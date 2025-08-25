import { useState, useMemo } from 'react';
import { products } from '../../data';
import { money } from '../../utils';
import { CategoryDisplay } from './CategoryDisplay';

export function Detail({
  id,
  onBack,
  onAdd,
}: {
  id: string;
  onBack: () => void;
  onAdd: (id: string) => void;
}) {
  const p = products.find((x) => x.productId === id);
  if (!p) return <div className="p-6">Not found</div>;

  const salePrice = p.salePrice || p.price;

  // 이미지 갤러리(썸네일)
  const images = useMemo(
    () => [
      p.mainImageUrl,
      ...(p.detailImages?.map(img => img.url) || []),
      `https://picsum.photos/seed/${id}-1/800/800`,
      `https://picsum.photos/seed/${id}-2/800/800`,
    ],
    [id, p.mainImageUrl, p.detailImages]
  );
  const [imgIdx, setImgIdx] = useState(0);

  // 옵션/수량
  const [shape, setShape] = useState<string>("라운드");
  const [length, setLength] = useState<string>("Short");
  const [qty, setQty] = useState<number>(1);
  const addToCart = () => {
    for (let i = 0; i < qty; i++) onAdd(p.productId);
  };

  // 좋아요/공유
  const [liked, setLiked] = useState(false);
  const share = async () => {
    const url = window.location.href;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: p.name, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); alert("링크가 복사되었어요!"); } catch {
        alert("공유를 지원하지 않는 브라우저입니다.");
      }
    }
  };

  // 탭
  const tabs = ["상세정보", "리뷰", "Q&A", "배송/반품"] as const;
  type TabKey = typeof tabs[number];
  const [tab, setTab] = useState<TabKey>("상세정보");

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
              src={images[imgIdx]}
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
            <span>⭐ {p.stats.rating.average.toFixed(1)}</span>
            <span className="text-gray-400">|</span>
            <span>리뷰 {p.stats.rating.count.toLocaleString()}개</span>
            <span className="text-gray-400">|</span>
            <span>무료배송</span>
          </div>

          {/* 옵션 */}
          <div className="pt-2 space-y-2">
            <div>
              <div className="mb-1 text-sm text-gray-600">쉐입</div>
              <div className="flex flex-wrap gap-2">
                {["라운드", "아몬드", "스퀘어", "오벌", "코핀"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setShape(s)}
                    className={`rounded border px-3 py-1 text-sm ${shape === s ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm text-gray-600">길이</div>
              <div className="flex flex-wrap gap-2">
                {["Short", "Medium", "Long"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setLength(s)}
                    className={`rounded border px-3 py-1 text-sm ${length === s ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"}`}
                  >
                    {s}
                  </button>
                ))}
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

          {/* 구매 버튼 */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={addToCart} className="rounded-lg border py-2">장바구니 담기</button>
            <button
              onClick={() => {
                try { (window as any).ReactNativeWebView?.postMessage(JSON.stringify({ type: "checkout", id: p.productId, qty })); } catch {}
                alert("바로구매(데모)");
              }}
              className="rounded-lg bg-black py-2 text-white"
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
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 pb-3 text-sm ${tab === t ? "border-black font-semibold" : "border-transparent text-gray-500 hover:text-black"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6 text-sm leading-7 text-gray-700">
          {tab === "상세정보" && (
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
          )}
          {tab === "리뷰" && (
            <div className="space-y-4">
              <div className="text-gray-800 font-medium">사용자 리뷰 (샘플)</div>
              {[1,2,3].map((i)=>(
                <div key={i} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div>⭐ 4.{i} / 5</div>
                    <div className="text-xs text-gray-500">2025-08-0{i}</div>
                  </div>
                  <p className="mt-2">착용감이 좋고 색감이 예뻐요. 재구매 의사 있습니다.</p>
                </div>
              ))}
            </div>
          )}
          {tab === "Q&A" && (
            <div className="space-y-3">
              <div className="rounded border p-3">
                <div className="text-sm font-medium">Q. 손톱이 짧아도 가능한가요?</div>
                <div className="mt-1 text-gray-700">A. 네, 동봉된 젤과 팁 길이 옵션으로 조절 가능합니다.</div>
              </div>
              <div className="rounded border p-3">
                <div className="text-sm font-medium">Q. 물에 자주 닿아도 되나요?</div>
                <div className="mt-1 text-gray-700">A. 24시간 이후에는 일상 생활에서 무리 없이 사용할 수 있습니다.</div>
              </div>
            </div>
          )}
          {tab === "배송/반품" && (
            <div className="space-y-2">
              <p>평일 14시 이전 주문 시 당일 출고됩니다. (주말/공휴일 제외)</p>
              <p>단순 변심 반품은 수령 후 7일 이내 미개봉 상태에 한해 가능합니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 모바일 하단 고정 구매바 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-3 md:hidden">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
          <div className="text-base font-semibold">{money(salePrice)}원</div>
          <div className="flex gap-2">
            <button onClick={addToCart} className="rounded-lg border px-4 py-2 text-sm">장바구니</button>
            <button
              onClick={() => {
                try { (window as any).ReactNativeWebView?.postMessage(JSON.stringify({ type: "checkout", id: p.productId, qty })); } catch {}
                alert("바로구매(데모)");
              }}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white"
            >
              구매하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}