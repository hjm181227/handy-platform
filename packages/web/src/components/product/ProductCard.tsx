import { Product } from '@handy-platform/shared';
import { Badge, Stars } from '../ui';
import { money } from '../../utils';
import { FaCartArrowDown } from 'react-icons/fa6';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

export function ProductCard({
  p,
  onOpen,
  onAdd,
  onLike,
  isLiked = false
}: {
  p: Product;
  onOpen:(id:string)=>void;
  onAdd:(id:string)=>void;
  onLike?:(id:string)=>void;
  isLiked?: boolean;
}) {
  const productId = p.id || p.productUuid;
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
          <div className="absolute left-2 top-2 flex gap-1">
            {p.isNewProduct && <Badge tone="blue">NEW</Badge>}
            {p.isFeatured && <Badge tone="red">HOT</Badge>}
            {p.discountRate && p.discountRate > 0 && <Badge tone="red">할인</Badge>}
          </div>
        </div>
    </button>
      <div className="mt-2 space-y-0.5">
        <div className="text-[11px] text-gray-500">{p.seller?.name || 'HANDY'}</div>
        <div className="text-[13px] leading-snug h-[34px] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{p.name}</div>
        <div className="flex items-baseline gap-2">
          <div className="text-[15px] font-bold">{money(salePrice)}원</div>
          {p.discountedPrice < p.price ? <div className="text-[12px] text-gray-400 line-through">{money(p.price)}원</div> : null}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1"><Stars v={p.rating.average ?? 0}/><span className="text-[11px] text-gray-500">({p.rating.count ?? 0})</span></div>
          <div className="flex items-center gap-1">
            {onLike && (
              <button onClick={()=>onLike(productId)} className="rounded-full border p-1.5 text-sm bg-white hover:bg-gray-50">
                {isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
              </button>
            )}
            <button onClick={()=>onAdd(productId)} className="rounded-full border p-1.5 text-sm bg-white hover:bg-gray-50">
              <FaCartArrowDown />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
