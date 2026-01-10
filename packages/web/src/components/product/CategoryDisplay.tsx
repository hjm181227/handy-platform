import type { NailCategories } from '@handy-platform/shared';
import { getCategoryDisplayName, getCategoryTypeLabel } from '../../utils/categoryUtils';

interface CategoryDisplayProps {
  categories: Partial<NailCategories>;
  onCategoryClick?: (key: string, value: string) => void;
}

export function CategoryDisplay({ categories, onCategoryClick }: CategoryDisplayProps) {
  const hasCategories = Object.values(categories).some(cat =>
    Array.isArray(cat) ? cat.length > 0 : cat
  );

  if (!hasCategories) return null;

  const renderCategoryItem = (value: string, categoryKey: string) => (
    <button
      key={value}
      onClick={() => onCategoryClick?.(categoryKey, value)}
      className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors duration-200"
    >
      {getCategoryDisplayName(categoryKey, value)}
    </button>
  );

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">카테고리</h3>

      <div className="space-y-3">
        {Object.entries(categories).map(([key, value]) => {
          if (!value || (Array.isArray(value) && value.length === 0)) return null;

          const typeLabel = getCategoryTypeLabel(key);
          if (!typeLabel) return null;

          return (
            <div key={key} className="flex items-start gap-3">
              <span className="text-sm font-medium text-gray-600 min-w-[60px]">
                {typeLabel}
              </span>

              <div className="flex flex-wrap gap-1 flex-1">
                {Array.isArray(value) ? (
                  value.map(item => renderCategoryItem(item, key))
                ) : (
                  renderCategoryItem(value, key)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}