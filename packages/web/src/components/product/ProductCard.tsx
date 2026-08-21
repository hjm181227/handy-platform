import { Product, buildProductUrlSlug } from '@handy-platform/shared';
import { useTranslation } from 'react-i18next';
import { money } from '../../utils';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

/** 서버 nailShape enum → 표시용 한글 */
export const NAIL_SHAPE_LABELS: Record<string, string> = {
  ROUND: '라운드',
  ALMOND: '아몬드',
  OVAL: '오발',
  STILETTO: '스틸레토',
  SQUARE: '스퀘어',
  COFFIN: '코핀',
};

/**
 * 상품 카드 — 디자인 시스템 규격 (Handy Commerce DS · Screens/Home A안)
 * 썸네일 1:1·12px 라운드, 좌상단 배지 1개, 우상단 하트 오버레이,
 * 브랜드(11.5 muted) → 상품명(14/600 한 줄) → 메타(쉐입·제작일) → 가격(tabular).
 */
export function ProductCard({
  p,
  onOpen,
  onAdd: _onAdd,
  onLike,
  onGo,
  isLiked = false,
  isLoading = false
}: {
  p?: Product;
  onOpen?: (id:string)=>void;
  onAdd?: (id:string)=>void;
  onLike?: (id:string)=>void;
  onGo?: (path:string)=>void;
  isLiked?: boolean;
  isLoading?: boolean;
}) {
  const { t } = useTranslation('common');
  if (isLoading) {
    return (
      <div className="w-full md:w-[200px] shrink-0 animate-pulse">
        <div className="aspect-square w-full bg-surface rounded-xl"></div>
        <div className="h-3 bg-surface rounded w-16 mt-2.5"></div>
        <div className="h-4 bg-surface rounded w-5/6 mt-1.5"></div>
        <div className="h-4 bg-surface rounded w-1/2 mt-1.5"></div>
      </div>
    );
  }

  if (!p || !onOpen) {
    return null;
  }

  const productId = p.productUuid || (p as any).id || (p as any).productId;
  // 링크에는 읽기 좋은 식별자를 쓴다 — 서버가 uuid와 둘 다 해석한다
  const linkId = buildProductUrlSlug(p.name, productId) || productId;
  const salePrice = p.discountedPrice ?? p.salePrice ?? p.price ?? 0;
  const hasDiscount = salePrice < p.price;
  const discountRate = hasDiscount ? Math.round((1 - salePrice / p.price) * 100) : 0;
  const shapeLabel = p.nailShape ? NAIL_SHAPE_LABELS[p.nailShape] : null;
  const processingDays = (p as any).processingDays as number | undefined;
  const isCustomDesign = Array.isArray((p as any).tags) && (p as any).tags.includes('커스텀 디자인');

  return (
    <div className="w-full md:w-[200px] shrink-0">
      <div className="relative rounded-xl overflow-hidden bg-surface">
        <button onClick={()=>onOpen(linkId)} className="block w-full text-left">
          <img
            src={p.mainImageUrl}
            alt={p.name}
            className="aspect-square w-full object-cover hover:scale-[1.02] transition-transform"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/placeholder-image.jpg') {
                target.src = '';
              }
            }}
          />
        </button>
        {/* 배지는 좌상단 1개만 (우선순위: NEW > 커스텀 > HOT) */}
        {p.isNewProduct ? (
          <span className="absolute left-2 top-2 bg-brand text-white text-[11px] font-bold px-2 py-0.5 rounded-full">NEW</span>
        ) : isCustomDesign ? (
          <span className="absolute left-2 top-2 bg-ink text-white text-[11px] font-bold px-2 py-0.5 rounded-full">커스텀</span>
        ) : p.isFeatured ? (
          <span className="absolute left-2 top-2 bg-ink text-white text-[11px] font-bold px-2 py-0.5 rounded-full">HOT</span>
        ) : null}
        {onLike && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(productId);
            }}
            aria-label={isLiked ? t('unlike', '찜 해제') : t('like', '찜')}
            className="absolute right-2 top-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-[13px] text-brand hover:scale-110 transition-transform"
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />}
          </button>
        )}
      </div>
      <div className="mt-2">
        {p.brand && onGo ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const sellerId = (p as any).sellerUuid || p.seller?.userId;
              if (sellerId) {
                onGo(`/brand/${sellerId}`);
              } else {
                onGo(`/brands?search=${encodeURIComponent(p.brand!)}`);
              }
            }}
            className="text-[11.5px] font-semibold text-muted tracking-wide hover:text-brand text-left"
          >
            {p.brand}
          </button>
        ) : (
          <div className="text-[11.5px] font-semibold text-muted tracking-wide">{p.brand || ''}</div>
        )}
        <button onClick={()=>onOpen(linkId)} className="block w-full text-left">
          <div className="text-sm font-semibold text-ink truncate mt-0.5">{p.name}</div>
        </button>
        {(shapeLabel || processingDays) && (
          <div className="text-[11.5px] text-muted mt-0.5">
            {[shapeLabel, processingDays ? `제작 ${processingDays}일` : null].filter(Boolean).join(' · ')}
          </div>
        )}
        <div className="flex items-baseline gap-1.5 mt-1 [font-variant-numeric:tabular-nums]">
          {hasDiscount && <span className="text-[15px] font-extrabold text-brand">{discountRate}%</span>}
          <span className="text-[15px] font-extrabold text-ink">{money(salePrice)}</span>
          {hasDiscount && <span className="text-xs text-muted line-through">{money(p.price)}</span>}
        </div>
      </div>
    </div>
  );
}
