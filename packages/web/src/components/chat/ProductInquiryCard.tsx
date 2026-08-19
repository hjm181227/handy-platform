import React from 'react';
import { Package } from 'lucide-react';

interface ProductInquiryCardProps {
  productUuid: string;
  name: string;
  imageUrl?: string;
  price?: number;
  isMine: boolean;
  onClick?: (productUuid: string) => void;
}

/**
 * 상품 문의 카드.
 *
 * 구매자가 상품 페이지에서 문의를 시작하면 이 카드가 먼저 붙어,
 * 판매자가 어떤 상품 이야기인지 바로 알 수 있다.
 */
export const ProductInquiryCard: React.FC<ProductInquiryCardProps> = ({
  productUuid,
  name,
  imageUrl,
  price,
  isMine,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick?.(productUuid)}
      className={`
        w-[260px] flex items-center gap-3 p-3 text-left transition-colors
        ${isMine
          ? 'bg-[#FFE5EA] rounded-[16px_4px_16px_16px] hover:bg-[#FFD9E1]'
          : 'bg-white rounded-[4px_16px_16px_16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:bg-[#FFF8F5]'
        }
      `}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-[#F2EAE3] flex items-center justify-center flex-shrink-0">
          <Package className="w-6 h-6 text-[#A39E99]" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-[#A39E99] mb-0.5">상품 문의</p>
        <p className="text-sm font-semibold text-[#131211] truncate">{name}</p>
        {typeof price === 'number' && (
          <p className="text-sm text-[#131211] tabular-nums">
            {price.toLocaleString('ko-KR')}원
          </p>
        )}
      </div>
    </button>
  );
};
