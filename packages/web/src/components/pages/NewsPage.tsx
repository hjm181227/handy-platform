import React, { useState } from 'react';
import { newsPosts, catLabel } from '../../data';
import { NewsCategory } from '../../types';

function CategoryPill({ c }: { c: NewsCategory }) {
  const map = {
    event: "bg-pink-600",
    nail: "bg-emerald-600",
    handy: "bg-indigo-600",
    update: "bg-amber-600",
  } as const;
  return <span className={`text-[11px] px-2 py-0.5 rounded text-white ${map[c]}`}>{catLabel[c]}</span>;
}

function ArticleCard({
  p,
  onGo,
}: {
  p: typeof newsPosts[0];
  onGo: (to: string) => void;
}) {
  return (
    <article className="rounded-lg overflow-hidden border bg-white hover:shadow-sm transition">
      <button onClick={() => onGo(`/news/${p.slug}`)} className="block w-full text-left">
        <img src={p.cover} className="w-full aspect-[16/9] object-cover" />
      </button>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <CategoryPill c={p.category} />
          <div className="text-[11px] text-gray-500">{p.date}</div>
        </div>
        <h3 className="mt-1 text-[15px] font-semibold line-clamp-2">{p.title}</h3>
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{p.excerpt}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {p.tags.map((t) => (
            <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
              #{t}
            </span>
          ))}
        </div>
        <button
          onClick={() => onGo(`/news/${p.slug}`)}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          자세히 보기 →
        </button>
      </div>
    </article>
  );
}

export function NewsPage({
  onGo,
  onOpenProduct,
}: {
  onGo: (to: string) => void;
  onOpenProduct: (id: string) => void;
}) {
  const [tab, setTab] = useState<NewsCategory | "all">("all");
  const [show, setShow] = useState(6); // Load more

  const counts = {
    all: newsPosts.length,
    event: newsPosts.filter((p) => p.category === "event").length,
    nail: newsPosts.filter((p) => p.category === "nail").length,
    handy: newsPosts.filter((p) => p.category === "handy").length,
    update: newsPosts.filter((p) => p.category === "update").length,
  };

  const filtered =
    tab === "all" ? newsPosts : newsPosts.filter((p) => p.category === tab);

  const featured = filtered.slice(0, 3);
  const rest = filtered.slice(3, show);

  const TabBtn = ({
    k,
    label,
  }: {
    k: NewsCategory | "all";
    label: string;
  }) => {
    const active = tab === k;
    return (
      <button
        onClick={() => {
          setTab(k);
          setShow(6);
        }}
        className={`pb-2 text-[15px] ${
          active
            ? "border-b-2 border-black font-semibold"
            : "text-gray-500 hover:text-black"
        }`}
      >
        {label}
        <span className="ml-1 text-gray-400 text-[13px]">
          {counts[k as keyof typeof counts]}
        </span>
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">NEWS</h1>
          <p className="text-sm text-gray-600">이벤트 · 네일 아트 튜토리얼 · HANDY 관련 소식</p>
        </div>
        {/* 간단 검색 (데모) */}
        <div className="hidden md:block w-64">
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-gray-500" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>
            </svg>
            <input placeholder="뉴스 검색" className="w-full text-sm outline-none"/>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="mt-5 flex items-end gap-6">
        <TabBtn k="all" label="전체" />
        <TabBtn k="event" label="이벤트" />
        <TabBtn k="nail" label="네일아트" />
        <TabBtn k="handy" label="HANDY 소식" />
        <TabBtn k="update" label="업데이트" />
      </div>

      {/* 특집 히어로(상단 3개) */}
      <section className="mt-5 grid gap-3 md:grid-cols-3">
        {featured.map((p) => (
          <ArticleCard key={p.slug} p={p} onGo={onGo} />
        ))}
      </section>

      {/* 태그/바로가기/이벤트 타임라인(간단) */}
      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-lg border bg-white p-4">
          <div className="text-sm font-semibold mb-2">추천 태그</div>
          <div className="flex flex-wrap gap-2">
            {["신상", "세일", "프렌치", "사이징", "팁", "콜라보"].map((t) => (
              <button
                key={t}
                onClick={() => onGo(`/news?tag=${encodeURIComponent(t)}`)}
                className="rounded-full border px-3 py-1 text-sm bg-white hover:bg-gray-50"
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-semibold mb-2">다가오는 이벤트</div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>성수 팝업 · 사이징 부스</span>
              <span className="text-gray-500">8/16</span>
            </li>
            <li className="flex items-center justify-between">
              <span>콜라보 런칭 라이브</span>
              <span className="text-gray-500">8/20</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 일반 목록 */}
      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((p) => (
          <ArticleCard key={p.slug} p={p} onGo={onGo} />
        ))}
      </section>

      {/* Load more */}
      {show < filtered.length && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShow((s) => s + 6)}
            className="rounded-full border px-5 py-2 text-sm bg-white hover:bg-gray-50"
          >
            더 보기
          </button>
        </div>
      )}

      {/* 하단 뉴스레터 CTA */}
      <section className="mt-8 rounded-xl bg-gradient-to-r from-zinc-900 to-gray-800 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">HANDY 뉴스레터</div>
            <p className="text-sm text-white/80">이벤트와 신상 소식을 가장 먼저 받아보세요.</p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-2 rounded-full bg-white px-3 py-2">
            <input placeholder="이메일 주소" className="w-full text-sm text-black outline-none"/>
            <button onClick={()=>alert("구독 신청(데모)")} className="rounded-full bg-black px-4 py-1.5 text-sm">구독</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function NewsArticle({
  slug,
  onGo,
  onOpenProduct,
}: {
  slug: string;
  onGo: (to: string) => void;
  onOpenProduct: (id: string) => void;
}) {
  const p = newsPosts.find((x) => x.slug === slug);
  if (!p) return <div className="mx-auto max-w-3xl px-4 py-10">존재하지 않는 기사입니다.</div>;

  const related = newsPosts.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 3);

  const share = async () => {
    const url = window.location.href;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: p.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button onClick={()=>onGo("/news")} className="text-sm underline">← NEWS로 돌아가기</button>
      <div className="mt-3 flex items-center justify-between">
        <CategoryPill c={p.category}/>
        <div className="text-xs text-gray-500">{p.date}</div>
      </div>
      <h1 className="mt-2 text-2xl font-semibold">{p.title}</h1>
      <img src={p.cover} className="mt-3 w-full rounded-lg object-cover" />
      <div className="prose prose-sm mt-4 max-w-none">
        {(p.body ?? []).map((para, i)=> <p key={i}>{para}</p>)}
      </div>
      <div className="mt-4 flex items-center gap-2">
        {p.tags.map(t => <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">#{t}</span>)}
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={share} className="rounded border px-3 py-1.5 text-sm">공유</button>
        <button onClick={()=>onGo("/brands")} className="rounded border px-3 py-1.5 text-sm">브랜드 둘러보기</button>
      </div>

      {/* 연관 기사 */}
      {related.length > 0 && (
        <section className="mt-8">
          <div className="mb-2 text-sm font-semibold">연관 소식</div>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map(r => <ArticleCard key={r.slug} p={r} onGo={onGo}/>)}
          </div>
        </section>
      )}
    </div>
  );
}