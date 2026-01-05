import { Product } from '@handy-platform/shared';
import { Badge, Stars } from '../ui';
import { money } from '../../utils';
import { FaCartArrowDown } from 'react-icons/fa6';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

export function RankedProductCard({
  p,
  rank,
  onOpen,
  onAdd,
  onLike,
  isLiked = false
}: {
  p: Product;
  rank: number;
  onOpen:(id:string)=>void;
  onAdd:(id:string)=>void;
  onLike?:(id:string)=>void;
  isLiked?: boolean;
}) {
  const productId = p.productUuid;
  const salePrice = p.discountedPrice;

  return (
    <div className="w-full md:w-[200px] shrink-0">
      <button onClick={()=>onOpen(productId)} className="block w-full text-left">
        <div className="relative rounded-lg overflow-hidden bg-gray-100">
          <img
            src={p.mainImageUrl}
            alt={p.name}
            className="aspect-[3/4] w-full object-cover hover:scale-[1.02] transition-transform"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/placeholder-image.jpg') {
                target.src = '';
              }
            }}
          />

          {/* 랭킹 번호 배지 */}
          <div className="absolute left-2 top-2">
            <div className="w-5 h-5 rounded bg-black text-white flex items-center justify-center text-xs font-bold shadow-lg">
              {rank}
            </div>
          </div>
        </div>
      </button>

      <div className="mt-2 space-y-0.5">
        <div className="text-[11px] text-gray-500">{p.seller?.name || ''}</div>
        <div className="text-[13px] leading-snug h-[34px] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{p.name}</div>
        <div className="flex items-baseline gap-2">
          <div className="text-[15px] font-bold">{money(salePrice)}</div>
          {p.discountedPrice < p.price ? <div className="text-[12px] text-gray-400 line-through">{money(p.price)}</div> : null}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Stars v={p.rating.average ?? 0}/>
            <span className="text-[11px] text-gray-500">({p.rating.count ?? 0})</span>
          </div>
          <div className="flex items-center gap-1">
            {onLike && (
              <button onClick={(e)=>{e.stopPropagation(); onLike(productId);}} className="rounded-full border p-1.5 text-sm bg-white hover:bg-gray-50">
                {isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
              </button>
            )}
            <button onClick={(e)=>{e.stopPropagation(); onAdd(productId);}} className="rounded-full border p-1.5 text-sm bg-white hover:bg-gray-50">
              <FaCartArrowDown />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
