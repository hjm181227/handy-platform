import type { ProductFilters } from '@handy-platform/shared';

/** 서버가 받는 상품 정렬 필드 (ProductFilters.sortBy) */
type ProductSortField = NonNullable<ProductFilters['sortBy']>;

export interface SortOption {
  value: string;
  label: string;
}

export const PRODUCT_SORT_OPTIONS: SortOption[] = [
  { value: 'trending', label: '인기순' },
  { value: 'createdAt', label: '최신순' },
  { value: 'price-asc', label: '가격 낮은순' },
  { value: 'price-desc', label: '가격 높은순' },
  { value: 'rating', label: '평점순' }
];

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options?: SortOption[];
  className?: string;
}

export function SortDropdown({
  value,
  onChange,
  options = PRODUCT_SORT_OPTIONS,
  className = ''
}: SortDropdownProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/**
 * sortBy 값을 API 파라미터 (sortBy, sortOrder)로 변환
 */
export function parseSortValue(sortBy: string): { sortBy: ProductSortField; sortOrder: 'asc' | 'desc' } {
  if (sortBy === 'price-asc') return { sortBy: 'price', sortOrder: 'asc' };
  if (sortBy === 'price-desc') return { sortBy: 'price', sortOrder: 'desc' };
  // PRODUCT_SORT_OPTIONS 의 나머지 값(trending/createdAt/rating)은 그대로 서버 정렬 필드다
  return { sortBy: sortBy as ProductSortField, sortOrder: 'desc' };
}
