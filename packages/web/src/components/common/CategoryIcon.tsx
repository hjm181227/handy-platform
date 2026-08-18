import { useState, useEffect } from 'react';
import { categoryService } from '../../services/apiService';
import type { CategoryType, CategoryIconsData } from '@handy-platform/shared';

interface CategoryIconProps {
  categoryType: CategoryType;
  categoryValue: string;
  className?: string;
  showFallback?: boolean;
}

interface CategoryIconCache {
  data: CategoryIconsData;
  timestamp: number;
}

const CACHE_KEY = 'category_icons_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// 캐시에서 카테고리 아이콘 데이터 가져오기
const getCachedCategoryIcons = (): CategoryIconsData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cacheData: CategoryIconCache = JSON.parse(cached);
    const now = Date.now();

    // 캐시가 만료되었는지 확인
    if (now - cacheData.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.error('Failed to read category icons cache:', error);
    return null;
  }
};

// 캐시에 카테고리 아이콘 데이터 저장
const setCachedCategoryIcons = (data: CategoryIconsData): void => {
  try {
    const cacheData: CategoryIconCache = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache category icons:', error);
  }
};

// API에서 카테고리 아이콘 데이터 가져오기
const fetchCategoryIcons = async (): Promise<CategoryIconsData | null> => {
  try {
    // 캐시 먼저 확인
    const cached = getCachedCategoryIcons();
    if (cached) {
      return cached;
    }

    // API 호출
    const response = await categoryService.getCategoryIcons();
    if (response.success && response.data) {
      // 캐시에 저장
      setCachedCategoryIcons(response.data);
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch category icons:', error);
    return null;
  }
};

export function CategoryIcon({
  categoryType,
  categoryValue,
  className = '',
  showFallback = true
}: CategoryIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [hexColor, setHexColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadIcon = async () => {
      try {
        setIsLoading(true);
        setError(false);

        const categoryData = await fetchCategoryIcons();

        if (!mounted) return;

        if (!categoryData) {
          setError(true);
          setIsLoading(false);
          return;
        }

        // 해당 카테고리 타입의 데이터에서 값 찾기
        const categories = categoryData.categories[categoryType];
        if (!categories) {
          setError(true);
          setIsLoading(false);
          return;
        }

        // categoryValue로 매칭되는 항목 찾기
        const categoryItem = categories.find(
          item => item.value.toLowerCase() === categoryValue.toLowerCase()
        );

        if (categoryItem) {
          setIconUrl(categoryItem.iconUrl || null);
          setHexColor(categoryItem.hexColor || null);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to load category icon:', err);
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadIcon();

    return () => {
      mounted = false;
    };
  }, [categoryType, categoryValue]);

  // 로딩 상태
  if (isLoading) {
    return (
      <span className={`inline-block ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </span>
    );
  }

  // 에러 또는 아이콘을 찾을 수 없는 경우
  if (error || (!iconUrl && !hexColor)) {
    if (!showFallback) return null;

    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
      </span>
    );
  }

  // 컬러 타입인 경우 색상 표시
  if (categoryType === 'color' && hexColor) {
    return (
      <span className={`inline-block ${className}`}>
        <div
          className="w-full h-full rounded-full border border-gray-300"
          style={{ backgroundColor: hexColor }}
          title={categoryValue}
        />
      </span>
    );
  }

  // 이미지 아이콘 표시
  if (iconUrl) {
    return (
      <span className={`inline-block ${className}`}>
        <img
          src={iconUrl}
          alt={categoryValue}
          className="w-full h-full object-contain"
          onError={() => setError(true)}
        />
      </span>
    );
  }

  // 폴백
  if (!showFallback) return null;

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <div className="w-4 h-4 bg-gray-300 rounded"></div>
    </span>
  );
}
