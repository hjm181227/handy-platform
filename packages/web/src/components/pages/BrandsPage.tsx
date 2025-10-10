import React from 'react';
import { products } from '../../data';
import { ProductCard } from '../product/ProductCard';
import { Stars } from '../ui';
import { FaHeart, FaArrowUp } from 'react-icons/fa';

export function BrandsPage({
  onGo,
  onOpen,
  onAdd,
  onLike,
  likedProducts = []
}: {
  onGo: (to: string) => void;
  onOpen: (id: string) => void;
  onAdd: (id: string) => void;
  onLike?: (id: string) => void;
  likedProducts?: string[];
}) {
  // 탭 기능 제거

  // 실제 데이터에서 브랜드 추출 및 통계 생성
  const brandStats = React.useMemo(() => {
    const brandMap = new Map<string, { products: typeof products[0][], count: number }>();

    products.forEach(product => {
      if (product.brand) {
        if (!brandMap.has(product.brand)) {
          brandMap.set(product.brand, { products: [], count: 0 });
        }
        const brandData = brandMap.get(product.brand)!;
        brandData.products.push(product);
        brandData.count++;
      }
    });

    return Array.from(brandMap.entries())
      .map(([name, data]) => ({
        name,
        products: data.products,
        count: data.count,
        totalLikes: data.products.reduce((sum, p) => sum + (p.likesCount || 0), 0),
        avgRating: data.products.reduce((sum, p) => sum + (p.rating?.average || 0), 0) / data.products.length,
        isHot: data.count >= 2 || data.totalLikes > 50
      }))
      .sort((a, b) => b.count - a.count); // 상품 수가 많은 브랜드 먼저
  }, []);

  const byBrand = (name: string) => products.filter((p) => p.brand === name);

  // 브랜드 카드 컴포넌트
  const BrandCard = ({ brand }: { brand: typeof brandStats[0] }) => (
    <div className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-600">
              {brand.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">{brand.name}</h3>
            <p className="text-xs text-gray-500">{brand.count}개 상품</p>
          </div>
        </div>
        {brand.isHot && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-600 font-medium">
            HOT
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <Stars v={brand.avgRating} />
          <span className="text-sm font-medium">{brand.avgRating.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1">
          <FaHeart className="text-red-500 w-3 h-3" />
          <span>{brand.totalLikes}</span>
        </div>
      </div>

      <button
        onClick={() => onGo(`/brand/${encodeURIComponent(brand.name)}`)}
        className="w-full rounded-md bg-gray-900 text-white py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        브랜드 보기
      </button>
    </div>
  );

  const BrandRow = ({ brand }: { brand: typeof brandStats[0] }) => {
    return (
      <section className="mt-6">
        <div className="mb-2 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className="text-[15px] font-semibold">{brand.name}</div>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {brand.count}개
            </span>
            {brand.isHot && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-600">HOT</span>
            )}
          </div>
          <button
            onClick={() => onGo(`/brand/${encodeURIComponent(brand.name)}`)}
            className="text-xs text-blue-600 hover:underline"
          >
            브랜드 프로필
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 md:flex md:gap-4 md:overflow-x-auto pb-2">
          {brand.products.map((p) => {
            const productId = p.id || p.productUuid;
            return (
              <div key={p.id || p.productId} className="md:snap-start">
                <ProductCard p={p} onOpen={onOpen} onAdd={onAdd} onLike={onLike} isLiked={likedProducts.includes(productId)} />
              </div>
            );
          })}
        </div>
      </section>
    );
  };


  return (
    <div className="relative">
      <div className="mx-auto max-w-7xl px-4 py-5">
        {/* 브랜드 그리드 뷰 */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">등록된 브랜드</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {brandStats.map((brand) => (
              <BrandCard key={brand.name} brand={brand} />
            ))}
          </div>
        </div>

        {/* 브랜드별 상품 섹션 */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">브랜드별 상품</h2>
          {brandStats.map((brand) => (
            <BrandRow key={brand.name} brand={brand} />
          ))}
        </div>
      </div>

      {/* 우측 플로팅 버튼 */}
      <div className="fixed right-6 bottom-6 flex flex-col items-center gap-3">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="h-12 w-12 rounded-full bg-white border shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        >
          <FaArrowUp className="text-lg" />
        </button>
        <button className="h-10 px-4 rounded-full bg-white border text-sm">전체</button>
      </div>
    </div>
  );
}