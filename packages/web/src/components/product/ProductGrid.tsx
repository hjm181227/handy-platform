import { Product } from '@handy-platform/shared';
import { ProductCard } from './ProductCard';

export function SectionRow({ title, items, loading = false, onOpen, onAdd, onLike, likedProducts = [] }:{
  title:string; items:Product[]; loading?: boolean; onOpen:(id:string)=>void; onAdd:(id:string)=>void; onLike?:(id:string)=>void; likedProducts?: string[];
}) {
  // 로딩 스켈레톤 카드 렌더링
  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-2 gap-4 md:flex md:gap-4 md:overflow-x-auto md:snap-x pb-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`skeleton-${index}`} className="md:snap-start md:flex-shrink-0">
          <div className="w-full md:w-40 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="mx-auto max-w-7xl px-4 mt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base md:text-lg font-semibold">{title}</h2>
        <a href="#" onClick={(e)=>e.preventDefault()} className="text-xs text-gray-500">더보기</a>
      </div>
      {loading ? renderLoadingSkeleton() : (
        <div className="grid grid-cols-2 gap-4 md:flex md:gap-4 md:overflow-x-auto md:snap-x pb-2">
          {items.map((p, index) => {
            const productId = p.id || p.productUuid;
            return (
              <div key={p.id || p.productUuid || `product-${index}`} className="md:snap-start md:flex-shrink-0">
                <ProductCard p={p} onOpen={onOpen} onAdd={onAdd} onLike={onLike} isLiked={likedProducts.includes(productId)} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function ProductGrid({ title, items, onOpen, onAdd, onLike, likedProducts = [] }:{
  title:string; items:Product[]; onOpen:(id:string)=>void; onAdd:(id:string)=>void; onLike?:(id:string)=>void; likedProducts?: string[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 mt-6">
      <h2 className="text-base md:text-lg font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((p, index) => {
          const productId = p.id || p.productUuid;
          return (
            <div key={p.id || p.productUuid || `grid-product-${index}`}>
              <ProductCard p={p} onOpen={onOpen} onAdd={onAdd} onLike={onLike} isLiked={likedProducts.includes(productId)} />
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