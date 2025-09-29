import { Product, User } from '@handy-platform/shared';

// 사용자 활동 데이터 타입
export interface UserActivity {
  recentViews: string[];     // 최근 본 상품 ID들
  purchases: string[];       // 구매한 상품 ID들
  likes: string[];          // 좋아요한 상품 ID들
  searchHistory: string[];  // 검색 기록
}

// 추천 카테고리 타입
export interface RecommendationCategory {
  title: string;
  products: Product[];
  reason?: string;
}

export class RecommendationEngine {
  private products: Product[];

  constructor(products: Product[]) {
    this.products = products;
  }

  // 비로그인 사용자용 카테고리별 추천
  getCategoryBasedRecommendations(): RecommendationCategory[] {
    const recommendations: RecommendationCategory[] = [];

    // 1. 심플 스타일 추천
    const simpleStyle = this.products.filter(p =>
      p.nailCategories?.style?.includes('심플') ||
      p.nailCategories?.tpo?.includes('데일리')
    ).slice(0, 6);

    if (simpleStyle.length > 0) {
      recommendations.push({
        title: '심플 & 데일리',
        products: simpleStyle,
        reason: '일상에서 자연스럽게 어울리는 스타일'
      });
    }

    // 2. 글리터 & 파티 스타일
    const partyStyle = this.products.filter(p =>
      p.name.toLowerCase().includes('glitter') ||
      p.nailCategories?.tpo?.includes('파티') ||
      p.nailCategories?.style?.includes('글리터')
    ).slice(0, 6);

    if (partyStyle.length > 0) {
      recommendations.push({
        title: '글리터 & 파티',
        products: partyStyle,
        reason: '특별한 날을 위한 화려한 스타일'
      });
    }

    // 3. 뉴트럴 컬러 (인기 색상)
    const neutralColors = this.products.filter(p =>
      p.nailCategories?.color?.includes('뉴트럴') ||
      p.name.toLowerCase().includes('beige') ||
      p.name.toLowerCase().includes('nude')
    ).slice(0, 6);

    if (neutralColors.length > 0) {
      recommendations.push({
        title: '뉴트럴 컬러',
        products: neutralColors,
        reason: '어떤 스타일에도 잘 어울리는 기본 컬러'
      });
    }

    // 4. 프렌치 스타일
    const frenchStyle = this.products.filter(p =>
      p.name.toLowerCase().includes('french') ||
      p.nailCategories?.style?.includes('프렌치')
    ).slice(0, 6);

    if (frenchStyle.length > 0) {
      recommendations.push({
        title: '프렌치 클래식',
        products: frenchStyle,
        reason: '언제나 세련된 클래식 스타일'
      });
    }

    // 5. 인기 상품 (평점/주문수 기준)
    const popularProducts = [...this.products]
      .sort((a, b) => {
        const scoreA = (a.rating?.average ?? 0) * 0.6 + (a.stats?.ordersCount ?? 0) * 0.4;
        const scoreB = (b.rating?.average ?? 0) * 0.6 + (b.stats?.ordersCount ?? 0) * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, 6);

    recommendations.push({
      title: '인기 상품',
      products: popularProducts,
      reason: '많은 고객들이 선택한 베스트 상품'
    });

    // 6. 신상품
    const newProducts = this.products.filter(p => p.isNewProduct).slice(0, 6);
    if (newProducts.length > 0) {
      recommendations.push({
        title: '신상품',
        products: newProducts,
        reason: '방금 출시된 최신 트렌드'
      });
    }

    return recommendations;
  }

  // 로그인 사용자용 개인화 추천
  getPersonalizedRecommendations(user: User, userActivity: UserActivity): RecommendationCategory[] {
    const recommendations: RecommendationCategory[] = [];

    // 1. 최근 본 상품과 유사한 스타일
    const similarToViewed = this.getSimilarProducts(userActivity.recentViews);
    if (similarToViewed.length > 0) {
      recommendations.push({
        title: '최근 본 상품과 유사한 스타일',
        products: similarToViewed.slice(0, 8),
        reason: '회원님이 관심 있어 하신 스타일과 비슷한 상품들'
      });
    }

    // 2. 구매 이력 기반 추천
    const basedOnPurchases = this.getProductsBasedOnPurchases(userActivity.purchases);
    if (basedOnPurchases.length > 0) {
      recommendations.push({
        title: '구매 이력 기반 추천',
        products: basedOnPurchases.slice(0, 8),
        reason: '회원님의 구매 취향을 반영한 상품들'
      });
    }

    // 3. 좋아요 기반 추천
    const basedOnLikes = this.getProductsBasedOnLikes(userActivity.likes);
    if (basedOnLikes.length > 0) {
      recommendations.push({
        title: '회원님이 좋아할 만한 상품',
        products: basedOnLikes.slice(0, 8),
        reason: '좋아요 한 상품들과 유사한 취향의 상품들'
      });
    }

    // 4. 부족한 경우 인기 상품으로 보완
    if (recommendations.length < 3) {
      const fallbackRecommendations = this.getCategoryBasedRecommendations();
      recommendations.push(...fallbackRecommendations.slice(0, 3 - recommendations.length));
    }

    return recommendations;
  }

  // 유사 상품 찾기 (카테고리 기반)
  private getSimilarProducts(productIds: string[]): Product[] {
    if (productIds.length === 0) return [];

    const viewedProducts = this.products.filter(p =>
      productIds.includes(p.id || p.productId || '')
    );

    if (viewedProducts.length === 0) return [];

    // 본 상품들의 카테고리 분석
    const categories = this.extractCategories(viewedProducts);

    // 유사한 카테고리의 다른 상품들 찾기
    return this.products.filter(p => {
      const isNotViewed = !productIds.includes(p.id || p.productId || '');
      const hasSimilarCategory = this.hasSimilarCategories(p, categories);
      return isNotViewed && hasSimilarCategory;
    });
  }

  // 구매 이력 기반 상품 찾기
  private getProductsBasedOnPurchases(purchaseIds: string[]): Product[] {
    if (purchaseIds.length === 0) return [];

    const purchasedProducts = this.products.filter(p =>
      purchaseIds.includes(p.id || p.productId || '')
    );

    const categories = this.extractCategories(purchasedProducts);

    return this.products.filter(p => {
      const isNotPurchased = !purchaseIds.includes(p.id || p.productId || '');
      const hasSimilarCategory = this.hasSimilarCategories(p, categories);
      return isNotPurchased && hasSimilarCategory;
    });
  }

  // 좋아요 기반 상품 찾기
  private getProductsBasedOnLikes(likeIds: string[]): Product[] {
    if (likeIds.length === 0) return [];

    const likedProducts = this.products.filter(p =>
      likeIds.includes(p.id || p.productId || '')
    );

    const categories = this.extractCategories(likedProducts);

    return this.products.filter(p => {
      const isNotLiked = !likeIds.includes(p.id || p.productId || '');
      const hasSimilarCategory = this.hasSimilarCategories(p, categories);
      return isNotLiked && hasSimilarCategory;
    });
  }

  // 상품들에서 카테고리 추출
  private extractCategories(products: Product[]) {
    const allCategories = {
      style: [] as string[],
      color: [] as string[],
      texture: [] as string[],
      tpo: [] as string[],
      nation: [] as string[]
    };

    products.forEach(product => {
      if (product.nailCategories) {
        if (product.nailCategories.style) {
          allCategories.style.push(...product.nailCategories.style);
        }
        if (product.nailCategories.color) {
          allCategories.color.push(...product.nailCategories.color);
        }
        if (product.nailCategories.texture) {
          allCategories.texture.push(...product.nailCategories.texture);
        }
        if (product.nailCategories.tpo) {
          allCategories.tpo.push(...product.nailCategories.tpo);
        }
        if (product.nailCategories.nation) {
          allCategories.nation.push(product.nailCategories.nation);
        }
      }
    });

    // 중복 제거 및 빈도 계산
    return {
      style: [...new Set(allCategories.style)],
      color: [...new Set(allCategories.color)],
      texture: [...new Set(allCategories.texture)],
      tpo: [...new Set(allCategories.tpo)],
      nation: [...new Set(allCategories.nation)]
    };
  }

  // 유사한 카테고리를 가지는지 확인
  private hasSimilarCategories(product: Product, targetCategories: any): boolean {
    if (!product.nailCategories) return false;

    const similarity = {
      style: this.calculateCategorySimilarity(product.nailCategories.style || [], targetCategories.style),
      color: this.calculateCategorySimilarity(product.nailCategories.color || [], targetCategories.color),
      texture: this.calculateCategorySimilarity(product.nailCategories.texture || [], targetCategories.texture),
      tpo: this.calculateCategorySimilarity(product.nailCategories.tpo || [], targetCategories.tpo),
      nation: product.nailCategories.nation && targetCategories.nation.includes(product.nailCategories.nation) ? 1 : 0
    };

    // 가중 평균으로 유사도 계산 (스타일과 TPO를 더 중요하게)
    const weightedSimilarity =
      similarity.style * 0.3 +
      similarity.color * 0.2 +
      similarity.texture * 0.1 +
      similarity.tpo * 0.3 +
      similarity.nation * 0.1;

    return weightedSimilarity > 0.3; // 30% 이상 유사하면 추천
  }

  // 카테고리 유사도 계산
  private calculateCategorySimilarity(productCategories: string[], targetCategories: string[]): number {
    if (productCategories.length === 0 || targetCategories.length === 0) return 0;

    const intersection = productCategories.filter(cat => targetCategories.includes(cat));
    return intersection.length / Math.max(productCategories.length, targetCategories.length);
  }
}

// 사용자 활동 데이터 가져오기 (로컬스토리지 기반 시뮬레이션)
export const getUserActivity = (): UserActivity => {
  try {
    const stored = localStorage.getItem('userActivity');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to get user activity:', error);
  }

  // 기본값 반환
  return {
    recentViews: [],
    purchases: [],
    likes: [],
    searchHistory: []
  };
};

// 사용자 활동 데이터 저장
export const updateUserActivity = (activity: Partial<UserActivity>) => {
  try {
    const current = getUserActivity();
    const updated = { ...current, ...activity };
    localStorage.setItem('userActivity', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update user activity:', error);
  }
};

// 최근 본 상품 추가
export const addToRecentViews = (productId: string) => {
  const activity = getUserActivity();
  const recentViews = [productId, ...activity.recentViews.filter(id => id !== productId)].slice(0, 10);
  updateUserActivity({ recentViews });
};