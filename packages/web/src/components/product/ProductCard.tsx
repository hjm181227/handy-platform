import { Product } from '@handy-platform/shared';
import { Badge, Stars } from '../ui';
import { money } from '../../utils';

export function ProductCard({ p, onOpen, onAdd }: { p: Product; onOpen:(id:string)=>void; onAdd:(id:string)=>void }) {
  const salePrice = p.salePrice || p.price;
  return (
    <div className="w-[160px] md:w-[200px] shrink-0">
      <button onClick={()=>onOpen(p.productId)} className="block w-full text-left">
        <div className="relative rounded-lg overflow-hidden bg-gray-100">
          <img src={p.mainImageUrl} className="aspect-[3/4] w-full object-cover hover:scale-[1.02] transition-transform"/>
          <div className="absolute left-2 top-2 flex gap-1">
            {p.tags?.includes('NEW') && <Badge tone="blue">NEW</Badge>}
            {p.tags?.includes('HOT') && <Badge tone="red">HOT</Badge>}
            {p.tags?.includes('BEST') && <Badge>BEST</Badge>}
            {p.tags?.includes('SALE') && <Badge tone="red">SALE</Badge>}
            {p.salePrice && p.salePrice < p.price && <Badge tone="red">할인</Badge>}
          </div>
        </div>
      </button>
      <div className="mt-2 space-y-0.5">
        <div className="text-[11px] text-gray-500">{p.brand}</div>
        <div className="text-[13px] leading-snug h-[34px] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{p.name}</div>
        <div className="flex items-baseline gap-2">
          <div className="text-[15px] font-bold">{money(salePrice)}원</div>
          {p.salePrice && p.salePrice < p.price ? <div className="text-[12px] text-gray-400 line-through">{money(p.price)}원</div> : null}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1"><Stars v={p.stats.rating.average ?? 0}/><span className="text-[11px] text-gray-500">({p.stats.rating.count ?? 0})</span></div>
          <button onClick={()=>onAdd(p.productId)} className="rounded-full border px-3 py-1 text-xs bg-white hover:bg-gray-50">담기</button>
        </div>
      </div>
    </div>
  );
}