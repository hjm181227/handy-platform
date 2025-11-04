import type { NailCategories } from '@handy-platform/shared';

interface CategoryDisplayProps {
  categories: Partial<NailCategories>;
  onCategoryClick?: (key: string, value: string) => void;
}

export function CategoryDisplay({ categories, onCategoryClick }: CategoryDisplayProps) {
  const categoryData = {
    style: { name: "스타일" },
    color: { name: "컬러" },
    texture: { name: "텍스쳐" },
    tpo: { name: "TPO" },
    shape: { name: "모양" },
    length: { name: "길이" },
    ab: { name: "아티스트/브랜드" },
    nation: { name: "국가별" },
  };

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
      {value}
    </button>
  );

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">카테고리</h3>

      <div className="space-y-3">
        {Object.entries(categories).map(([key, value]) => {
          if (!value || (Array.isArray(value) && value.length === 0)) return null;

          const categoryInfo = categoryData[key as keyof typeof categoryData];
          if (!categoryInfo) return null;

          return (
            <div key={key} className="flex items-start gap-3">
              <span className="text-sm font-medium text-gray-600 min-w-[60px]">
                {categoryInfo.name}
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