import { Product } from '@handy-platform/shared';
import { Badge, Stars } from '../ui';
import { money } from '../../utils';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { IoMdStar } from 'react-icons/io';

export function ProductCard({
  p,
  onOpen,
  onAdd,
  onLike,
  isLiked = false,
  isLoading = false
}: {
  p?: Product;
  onOpen?: (id:string)=>void;
  onAdd?: (id:string)=>void;
  onLike?: (id:string)=>void;
  isLiked?: boolean;
  isLoading?: boolean;
}) {
  // 로딩 스켈레톤 렌더링
  if (isLoading) {
    return (
      <div className="w-full md:w-[200px] shrink-0">
        <div className="relative rounded-lg overflow-hidden bg-gray-100 animate-pulse">
          <div className="aspect-[3/4] w-full bg-gray-200"></div>
        </div>
        <div className="mt-2 space-y-0.5 animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
          <div className="flex items-center justify-between mt-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // 실제 데이터가 없으면 렌더링하지 않음
  if (!p || !onOpen) {
    return null;
  }

  // 좋아요 API는 UUID를 요구하므로 productUuid 사용
  const productId = p.productUuid;
  const salePrice = p.discountedPrice ?? p.salePrice ?? p.price;
  return (
    <div className="w-full md:w-[200px] shrink-0">
      <div className="relative rounded-lg overflow-hidden bg-gray-100">
        <button onClick={()=>onOpen(productId)} className="block w-full text-left">
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
        </button>
        <div className="absolute left-2 top-2 flex gap-1">
          {p.isNewProduct && <Badge tone="blue">NEW</Badge>}
          {p.isFeatured && <Badge tone="red">HOT</Badge>}
          {p.discountRate && p.discountRate > 0 && <Badge tone="red">할인</Badge>}
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <div className="text-[11px] text-gray-500">{p.brand || ''}</div>
        <div className="text-[13px] leading-snug h-[34px] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{p.name}</div>
        <div className="flex items-baseline gap-2">
          <div className="text-[15px] font-bold">{money(salePrice)}</div>
          {salePrice < p.price ? <div className="text-[12px] text-gray-400 line-through">{money(p.price)}</div> : null}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <IoMdStar className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">{(p.rating.average ?? 0).toFixed(1)}</span>
            <span className="text-[11px] text-gray-500">({p.rating.count ?? 0})</span>
          </div>
          {onLike && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike(productId);
              }}
              className="text-lg hover:scale-110 transition-transform"
            >
              {isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-gray-600" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
