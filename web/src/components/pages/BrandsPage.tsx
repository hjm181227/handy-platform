import { products } from '../../data';
import { ProductCard } from '../product/ProductCard';

export function BrandsPage({
  onGo,
  onOpen,
  onAdd,
}: {
  onGo: (to: string) => void;
  onOpen: (id: string) => void;
  onAdd: (id: string) => void;
}) {
  // 상단 필터 탭(스냅샷 느낌의 칩들)
  const tabs = [
    { label: "브랜드 랭킹", key: "rank" },
    { label: "장바구니 BEST", key: "cartbest" },
    { label: "핸디 추천 PICK", key: "pick" },
    { label: "핸서 태그", key: "tag" },
    { label: "신상 특집", key: "new" },
  ];
  const url = new URL(window.location.href);
  const tab = url.searchParams.get("tab") ?? "rank";

  const TabChip = ({ label, active, to }: { label: string; active?: boolean; to: string }) => (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        onGo(to);
      }}
      className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm ${
        active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"
      }`}
    >
      {label}
    </a>
  );

  // 브랜드 섹션 (샘플로 3개)
  const brandNames = ["HANDY MADE", "HANDY LAB", "HANDY CARE"] as const;
  const byBrand = (name: string) => products.filter((p) => p.brand === name);

  const BrandRow = ({ name }: { name: string }) => {
    const items = byBrand(name);
    if (items.length === 0) return null;
    return (
      <section className="mt-6">
        <div className="mb-2 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className="text-[15px] font-semibold">{name}</div>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">핫딜</span>
          </div>
          <a
            href={`/brand/${encodeURIComponent(name)}`}
            onClick={(e) => {
              e.preventDefault();
              onGo(`/brand/${encodeURIComponent(name)}`);
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            브랜드 프로필
          </a>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {items.map((p) => (
            <div key={p.id} className="snap-start">
              <ProductCard p={p} onOpen={onOpen} onAdd={onAdd} />
            </div>
          ))}
        </div>
      </section>
    );
  };

  // 정렬/기간(우측 드롭다운처럼 보이는 버튼)
  const DropBtn = ({ label }: { label: string }) => (
    <button className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm bg-white hover:bg-gray-50">
      {label}
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <div className="relative">
      <div className="mx-auto max-w-7xl px-4 py-5">
        {/* 필터 칩들 */}
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => (
            <TabChip key={t.key} label={t.label} active={tab === t.key} to={`/brands?tab=${t.key}`} />
          ))}
        </div>

        {/* 상단 보조 바: 업데이트/정렬 */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <div>13시간 전</div>
          <div className="flex items-center gap-2">
            <DropBtn label="최근 1일" />
            <DropBtn label="관심순" />
          </div>
        </div>

        {/* 브랜드 묶음 섹션들 */}
        {brandNames.map((name) => (
          <BrandRow key={name} name={name} />
        ))}
      </div>

      {/* 우측 플로팅 버튼 */}
      <div className="fixed right-6 bottom-6 flex flex-col items-center gap-3">
        <button className="h-12 w-12 rounded-full bg-white border text-xl leading-none">⬆</button>
        <button className="h-10 px-4 rounded-full bg-white border text-sm">전체</button>
      </div>
    </div>
  );
}