import { Product } from '@handy-platform/shared';
import { useTranslation } from 'react-i18next';
import { ProductCard } from './ProductCard';

export function SectionRow({ title, sub, moreTo, items, loading = false, onOpen, onAdd, onLike, onGo, likedProducts = [] }:{
  title:string; sub?:string; moreTo?:string; items:Product[]; loading?: boolean; onOpen:(id:string)=>void; onAdd:(id:string)=>void; onLike?:(id:string)=>void; onGo?:(path:string)=>void; likedProducts?: string[];
}) {
  const { t } = useTranslation('common');
  // 로딩 스켈레톤 카드 렌더링
  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-2 gap-4 md:flex md:gap-4 md:overflow-x-auto md:snap-x pb-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`skeleton-${index}`} className="md:snap-start md:flex-shrink-0">
          <div className="w-full md:w-40 animate-pulse">
            <div className="aspect-square bg-surface rounded-xl mb-2"></div>
            <div className="h-3 bg-surface rounded w-16 mb-1.5"></div>
            <div className="h-4 bg-surface rounded w-5/6 mb-1.5"></div>
            <div className="h-4 bg-surface rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="mx-auto max-w-7xl px-4 mt-7">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
          {sub && <p className="text-[12.5px] text-muted mt-0.5">{sub}</p>}
        </div>
        {moreTo && onGo && (
          <button onClick={() => onGo(moreTo)} className="text-[12.5px] font-semibold text-muted hover:text-ink">
            {t('seeMore')}
          </button>
        )}
      </div>
      {loading ? renderLoadingSkeleton() : (
        <div className="grid grid-cols-2 gap-4 md:flex md:gap-4 md:overflow-x-auto md:snap-x pb-2">
          {items.map((p, index) => {
            // 좋아요 API는 UUID를 요구하므로 productUuid 우선 사용
            const productId = (p.productUuid || p.id) as string;
            return (
              <div key={p.productUuid || p.id || `product-${index}`} className="md:snap-start md:flex-shrink-0">
                <ProductCard p={p} onOpen={onOpen} onAdd={onAdd} onLike={onLike} onGo={onGo} isLiked={likedProducts.includes(productId)} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function ProductGrid({ title, items, onOpen, onAdd, onLike, onGo, likedProducts = [] }:{
  title:string; items:Product[]; onOpen:(id:string)=>void; onAdd:(id:string)=>void; onLike?:(id:string)=>void; onGo?:(path:string)=>void; likedProducts?: string[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 mt-6">
      <h2 className="text-base md:text-lg font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((p, index) => {
          // 좋아요 API는 UUID를 요구하므로 productUuid 우선 사용
          const productId = (p.productUuid || p.id) as string;
          return (
            <div key={p.productUuid || p.id || `grid-product-${index}`}>
              <ProductCard p={p} onOpen={onOpen} onAdd={onAdd} onLike={onLike} onGo={onGo} isLiked={likedProducts.includes(productId)} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TitleBar({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 border-b">
      <h1 className="text-xl font-semibold">{title}</h1>
      {desc && <p className="text-sm text-gray-600 mt-1">{desc}</p>}
    </div>
  );
}