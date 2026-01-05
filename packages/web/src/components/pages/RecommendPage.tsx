import React, { useMemo, useEffect } from 'react';
import { products } from '../../data';
import { ProductCard } from '../product/ProductCard';
import { RecommendationEngine, getUserActivity, addToRecentViews } from '../../utils/recommendationEngine';
import type { User } from '@handy-platform/shared';
import { FaArrowUp } from 'react-icons/fa';

// 추천 섹션 컴포넌트
const RecommendationSection = ({
  title,
  products: sectionProducts,
  reason,
  onOpen,
  onAdd,
  onLike,
  onGo,
  likedProducts = []
}: {
  title: string;
  products: typeof products;
  reason?: string;
  onOpen: (id: string) => void;
  onAdd: (id: string) => void;
  onLike?: (id: string) => void;
  onGo?: (path: string) => void;
  likedProducts?: string[];
}) => {
  if (sectionProducts.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-1">{title}</h2>
        {reason && (
          <p className="text-sm text-gray-600">{reason}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:flex md:gap-4 md:overflow-x-auto md:snap-x pb-2">
        {sectionProducts.map((product, index) => {
          const productId = product.id || product.productUuid;
          return (
            <div key={product.id || product.productId || index} className="md:snap-start md:flex-shrink-0">
              <ProductCard p={product} onOpen={onOpen} onAdd={onAdd} onLike={onLike} onGo={onGo} isLiked={likedProducts.includes(productId)} />
            </div>
          );
        })}
      </div>
    </section>
  );
};

// 빈 상태 컴포넌트
const EmptyRecommendations = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <div className="text-center py-20">
    <div className="text-gray-400 mb-4">
      <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-600 mb-2">
      {isLoggedIn ? '맞춤 추천을 준비 중입니다' : '추천 상품이 없습니다'}
    </h3>
    <p className="text-sm text-gray-500">
      {isLoggedIn
        ? '상품을 둘러보시면 더 정확한 추천을 받을 수 있어요'
        : '다양한 상품을 둘러보세요'
      }
    </p>
  </div>
);

export function RecommendPage({
  currentUser,
  onGo,
  onOpen,
  onAdd,
  onLike,
  likedProducts = []
}: {
  currentUser: User | null;
  onGo: (to: string) => void;
  onOpen: (id: string) => void;
  onAdd: (id: string) => void;
  onLike?: (id: string) => void;
  likedProducts?: string[];
}) {
  const isLoggedIn = !!currentUser;

  // 추천 엔진 초기화
  const recommendationEngine = useMemo(() => new RecommendationEngine(products), []);

  // 추천 데이터 계산
  const recommendations = useMemo(() => {
    if (isLoggedIn) {
      // 로그인 사용자: 개인화 추천
      const userActivity = getUserActivity();
      return recommendationEngine.getPersonalizedRecommendations(currentUser, userActivity);
    } else {
      // 비로그인 사용자: 카테고리별 추천
      return recommendationEngine.getCategoryBasedRecommendations();
    }
  }, [isLoggedIn, currentUser, recommendationEngine]);

  // 상품 열람 시 최근 본 상품에 추가
  const handleProductOpen = (productId: string) => {
    if (isLoggedIn) {
      addToRecentViews(productId);
    }
    onOpen(productId);
  };

  // 페이지 제목과 설명
  const getPageInfo = () => {
    if (isLoggedIn) {
      return {
        title: '맞춤 추천',
        description: `${currentUser?.name || '회원'}님을 위한 개인화 추천`
      };
    } else {
      return {
        title: '추천',
        description: '카테고리별 인기 상품 추천'
      };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="relative">
      {/* 페이지 헤더 */}
      <div className="mx-auto max-w-7xl px-4 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{pageInfo.title}</h1>
            <p className="text-sm text-gray-600 mt-1">{pageInfo.description}</p>
          </div>

          {/* 로그인 상태 표시 */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600">개인화 추천</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-600">카테고리별 추천</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 로그인 안내 (비로그인 사용자용) */}
      {!isLoggedIn && (
        <div className="mx-auto max-w-7xl px-4 py-3 bg-blue-50 border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs md:text-sm text-blue-800 min-w-0">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="truncate">로그인하시면 개인 취향에 맞는 상품을 추천받을 수 있어요</span>
            </div>
            <button
              onClick={() => onGo('/login')}
              className="text-xs md:text-sm text-blue-600 hover:underline font-medium whitespace-nowrap flex-shrink-0"
            >
              로그인
            </button>
          </div>
        </div>
      )}

      {/* 추천 상품 목록 */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {recommendations.length === 0 ? (
          <EmptyRecommendations isLoggedIn={isLoggedIn} />
        ) : (
          <div className="space-y-8">
            {recommendations.map((recommendation, index) => (
              <RecommendationSection
                key={`${recommendation.title}-${index}`}
                title={recommendation.title}
                products={recommendation.products}
                reason={recommendation.reason}
                onOpen={handleProductOpen}
                onAdd={onAdd}
                onLike={onLike}
                onGo={onGo}
                likedProducts={likedProducts}
              />
            ))}
          </div>
        )}

        {/* 추가 정보 섹션 */}
        {recommendations.length > 0 && (
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="font-medium text-gray-900 mb-2">
                {isLoggedIn ? '더 정확한 추천을 원하시나요?' : '더 많은 상품을 둘러보세요'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {isLoggedIn
                  ? '상품을 더 많이 둘러보고 좋아요를 누르시면 취향에 맞는 추천이 개선됩니다'
                  : '다양한 카테고리의 상품들을 확인해보세요'
                }
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => onGo('/brands')}
                  className="px-3 py-2 bg-white border rounded-lg text-xs md:text-sm hover:bg-gray-50 whitespace-nowrap"
                >
                  브랜드
                </button>
                <button
                  onClick={() => onGo('/ranking')}
                  className="px-3 py-2 bg-white border rounded-lg text-xs md:text-sm hover:bg-gray-50 whitespace-nowrap"
                >
                  인기상품
                </button>
                {!isLoggedIn && (
                  <button
                    onClick={() => onGo('/login')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs md:text-sm hover:bg-blue-700 whitespace-nowrap"
                  >
                    로그인
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 우측 플로팅 버튼 */}
      <div className="fixed right-6 bottom-6 flex flex-col items-center gap-3">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="h-12 w-12 rounded-full bg-white border shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        >
          <FaArrowUp className="text-lg" />
        </button>
      </div>
    </div>
  );
}