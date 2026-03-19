import { useState } from 'react';
import type { NailCategories } from '@handy-platform/shared';
import { CategoryIcon } from '../common/CategoryIcon';
import type { CategoryType } from '@handy-platform/shared';

interface CategorySelectorProps {
  value: Partial<NailCategories>;
  onChange: (categories: Partial<NailCategories>) => void;
}

interface CategoryItem {
  label: string;
  value: string;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const categoryData: Record<CategoryType, CategoryItem[]> = {
    style: [
      { label: "신상", value: "new" },
      { label: "심플", value: "simple" },
      { label: "화려", value: "fancy" },
      { label: "아트", value: "art" },
      { label: "트렌디", value: "trendy" },
      { label: "클래식", value: "classic" },
      { label: "시즌", value: "season" },
      { label: "테마", value: "theme" },
      { label: "키치", value: "kitsch" },
      { label: "네츄럴", value: "natural" },
    ],
    color: [
      { label: "레드", value: "red" },
      { label: "핑크", value: "pink" },
      { label: "블루", value: "blue" },
      { label: "그린", value: "green" },
      { label: "블랙/화이트", value: "black-white" },
      { label: "브라운", value: "brown" },
      { label: "옐로우", value: "yellow" },
      { label: "뉴트럴", value: "neutral" },
    ],
    texture: [
      { label: "글리터", value: "glitter" },
      { label: "크롬/메탈", value: "chrome" },
      { label: "매트", value: "matte" },
      { label: "벨벳", value: "velvet" },
      { label: "젤", value: "gel" },
      { label: "자석", value: "magnet" },
    ],
    tpo: [
      { label: "데일리", value: "daily" },
      { label: "파티", value: "party" },
      { label: "웨딩", value: "wedding" },
      { label: "공연", value: "performance" },
      { label: "Special day", value: "special" },
    ],
    shape: [],
    length: [],
    nation: [],
  };

  const handleMultiSelect = (key: CategoryType, item: string, maxCount: number) => {
    const currentItems = value[key] || [];
    const isSelected = currentItems.includes(item);

    let newItems: string[];
    if (isSelected) {
      newItems = currentItems.filter(i => i !== item);
    } else {
      if (currentItems.length >= maxCount) {
        newItems = [...currentItems.slice(1), item];
      } else {
        newItems = [...currentItems, item];
      }
    }

    onChange({
      ...value,
      [key]: newItems
    });
  };

  const renderMultiSelectCategory = (
    key: CategoryType,
    title: string,
    maxCount: number
  ) => {
    const selectedItems = value[key] || [];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <span className="text-xs text-gray-500">
            {selectedItems.length}/{maxCount}개 선택
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {categoryData[key].map(item => {
            const isSelected = selectedItems.includes(item.label);
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleMultiSelect(key, item.label, maxCount)}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-200
                  ${isSelected
                    ? 'border-[#E85A6B] bg-[#FFF1F2] text-[#E85A6B]'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <CategoryIcon
                  categoryType={key}
                  categoryValue={item.value}
                  className="w-5 h-5"
                  showFallback={true}
                />
                <span className="text-xs font-medium text-center leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-900">네일 카테고리 설정</h2>
        <p className="text-sm text-gray-600 mt-1">
          상품에 적합한 카테고리를 선택해주세요. 스타일, 컬러, 텍스쳐, TPO는 각각 최대 3개까지 선택 가능합니다.
        </p>
      </div>

      {renderMultiSelectCategory('style', '스타일', 3)}
      {renderMultiSelectCategory('color', '컬러', 3)}
      {renderMultiSelectCategory('texture', '텍스쳐', 3)}
      {renderMultiSelectCategory('tpo', 'TPO', 3)}

      {(value.style?.length || value.color?.length || value.texture?.length || value.tpo?.length) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">선택된 카테고리</h4>
          <div className="space-y-1 text-xs text-gray-600">
            {value.style?.length && (
              <div><span className="font-medium">스타일:</span> {value.style.join(', ')}</div>
            )}
            {value.color?.length && (
              <div><span className="font-medium">컬러:</span> {value.color.join(', ')}</div>
            )}
            {value.texture?.length && (
              <div><span className="font-medium">텍스쳐:</span> {value.texture.join(', ')}</div>
            )}
            {value.tpo?.length && (
              <div><span className="font-medium">TPO:</span> {value.tpo.join(', ')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
