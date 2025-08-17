import { Product } from '../../types';
import { Badge, Stars } from '../ui';
import { money } from '../../utils';

export function ProductCard({ p, onOpen, onAdd }: { p: Product; onOpen:(id:string)=>void; onAdd:(id:string)=>void }) {
  const salePrice = p.sale ? Math.round(p.price*(100-p.sale)/100) : p.price;
  return (
    <div className="w-[160px] md:w-[200px] shrink-0">
      <button onClick={()=>onOpen(p.id)} className="block w-full text-left">
        <div className="relative rounded-lg overflow-hidden bg-gray-100">
          <img src={p.image} className="aspect-[3/4] w-full object-cover hover:scale-[1.02] transition-transform"/>
          <div className="absolute left-2 top-2 flex gap-1">
            {p.isNew && <Badge tone="blue">NEW</Badge>}
            {p.tag==="HOT" && <Badge tone="red">HOT</Badge>}
            {p.tag==="BEST" && <Badge>BEST</Badge>}
            {p.tag==="SALE" && <Badge tone="red">SALE</Badge>}
            {p.sale ? <Badge tone="red">{p.sale}%</Badge> : null}
          </div>
        </div>
      </button>
      <div className="mt-2 space-y-0.5">
        <div className="text-[11px] text-gray-500">{p.brand}</div>
        <div className="text-[13px] leading-snug h-[34px] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{p.name}</div>
        <div className="flex items-baseline gap-2">
          <div className="text-[15px] font-bold">{money(salePrice)}원</div>
          {p.sale ? <div className="text-[12px] text-gray-400 line-through">{money(p.price)}원</div> : null}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1"><Stars v={p.rating ?? 0}/><span className="text-[11px] text-gray-500">({p.reviews ?? 0})</span></div>
          <button onClick={()=>onAdd(p.id)} className="rounded-full border px-3 py-1 text-xs bg-white hover:bg-gray-50">담기</button>
        </div>
      </div>
    </div>
  );
}