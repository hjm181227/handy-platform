import React from 'react';
import { products } from '../../data';
import { ProductCard } from '../product/ProductCard';

export function BrandDetailPage({
  brandName,
  onGo,
  onOpen,
  onAdd,
}: {
  brandName: string;
  onGo: (to: string) => void;
  onOpen: (id: string) => void;
  onAdd: (id: string) => void;
}) {
  // URL 디코딩
  const decodedBrandName = decodeURIComponent(brandName);

  // 해당 브랜드의 상품들 필터링
  const brandProducts = products.filter(p => p.brand === decodedBrandName);

  // 브랜드 통계 계산
  const brandStats = React.useMemo(() => {
    if (brandProducts.length === 0) return null;

    return {
      name: decodedBrandName,
      totalProducts: brandProducts.length,
      avgRating: brandProducts.reduce((sum, p) => sum + (p.rating?.average || 0), 0) / brandProducts.length,
      totalLikes: brandProducts.reduce((sum, p) => sum + (p.likesCount || 0), 0),
      totalOrders: brandProducts.reduce((sum, p) => sum + (p.stats?.ordersCount || 0), 0),
      priceRange: {
        min: Math.min(...brandProducts.map(p => p.discountedPrice || p.price)),
        max: Math.max(...brandProducts.map(p => p.discountedPrice || p.price))
      }
    };
  }, [brandProducts, decodedBrandName]);

  // 브랜드가 존재하지 않는 경우
  if (!brandStats) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="text-center py-20">
          <h1 className="text-2xl font-semibold mb-2">브랜드를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-4">'{decodedBrandName}' 브랜드의 상품이 없습니다.</p>
          <button
            onClick={() => onGo('/brands')}
            className="rounded-lg bg-black text-white px-6 py-2 hover:bg-gray-800"
          >
            브랜드 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 카테고리별 상품 분류
  const categoryGroups = React.useMemo(() => {
    const groups = new Map<string, typeof brandProducts>();

    brandProducts.forEach(product => {
      const categories = product.nailCategories?.style || ['기타'];
      categories.forEach(category => {
        if (!groups.has(category)) {
          groups.set(category, []);
        }
        groups.get(category)!.push(product);
      });
    });

    return Array.from(groups.entries()).map(([category, products]) => ({
      category,
      products: products.slice(0, 8) // 카테고리당 최대 8개까지만
    }));
  }, [brandProducts]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => onGo('/brands')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
          <path d="M19 12H5m7-7l-7 7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        브랜드 목록으로 돌아가기
      </button>

      {/* 브랜드 헤더 */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* 브랜드 로고/아바타 */}
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-600">
                {brandStats.name.charAt(0)}
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold">{brandStats.name}</h1>
              <p className="text-gray-600 mt-1">프리미엄 네일아트 브랜드</p>
            </div>
          </div>

          {/* 브랜드 배지 */}
          <div className="flex flex-col gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-600 font-medium text-center">
              인증 브랜드
            </span>
            {brandStats.totalProducts >= 3 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-600 font-medium text-center">
                인기 브랜드
              </span>
            )}
          </div>
        </div>

        {/* 브랜드 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{brandStats.totalProducts}</div>
            <div className="text-sm text-gray-600">상품 수</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{brandStats.avgRating.toFixed(1)}</div>
            <div className="text-sm text-gray-600">평균 평점</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{brandStats.totalLikes}</div>
            <div className="text-sm text-gray-600">총 좋아요</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {brandStats.priceRange.min.toLocaleString()}~{brandStats.priceRange.max.toLocaleString()}원
            </div>
            <div className="text-sm text-gray-600">가격대</div>
          </div>
        </div>
      </div>

      {/* 전체 상품 목록 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">전체 상품 ({brandStats.totalProducts}개)</h2>
          <div className="flex items-center gap-2 text-sm">
            <button className="px-3 py-1 rounded border hover:bg-gray-50">인기순</button>
            <button className="px-3 py-1 rounded border hover:bg-gray-50">가격순</button>
            <button className="px-3 py-1 rounded border hover:bg-gray-50">최신순</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {brandProducts.map((product) => (
            <ProductCard key={product.id || product.productId} p={product} onOpen={onOpen} onAdd={onAdd} />
          ))}
        </div>
      </div>

      {/* 카테고리별 상품 (상품이 많을 때만 표시) */}
      {categoryGroups.length > 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-6">카테고리별 상품</h2>
          {categoryGroups.map(({ category, products: categoryProducts }) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-medium mb-3">{category} ({categoryProducts.length}개)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {categoryProducts.map((product) => (
                  <ProductCard key={`${category}-${product.id || product.productId}`} p={product} onOpen={onOpen} onAdd={onAdd} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}