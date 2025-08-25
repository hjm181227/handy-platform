import { Product } from '@handy-platform/shared';
import { ProductCard } from './ProductCard';

export function SectionRow({ title, items, onOpen, onAdd }:{
  title:string; items:Product[]; onOpen:(id:string)=>void; onAdd:(id:string)=>void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 mt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base md:text-lg font-semibold">{title}</h2>
        <a href="#" onClick={(e)=>e.preventDefault()} className="text-xs text-gray-500">더보기</a>
      </div>
      <div className="flex gap-4 overflow-x-auto snap-x pb-2">
        {items.map(p=> <div key={p.productId} className="snap-start"><ProductCard p={p} onOpen={onOpen} onAdd={onAdd}/></div>)}
      </div>
    </section>
  );
}

export function ProductGrid({ title, items, onOpen, onAdd }:{
  title:string; items:Product[]; onOpen:(id:string)=>void; onAdd:(id:string)=>void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 mt-6">
      <h2 className="text-base md:text-lg font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map(p=>(
          <div key={p.productId}>
            <ProductCard p={p} onOpen={onOpen} onAdd={onAdd}/>
          </div>
        ))}
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