import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

/** 다중 선택(배열) 카테고리 키 — NailCategories 에서 string[] 인 항목만 */
type MultiSelectCategoryKey = Extract<CategoryType, 'style' | 'color' | 'texture' | 'tpo'>;

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const { t } = useTranslation('product');

  const categoryData: Record<CategoryType, CategoryItem[]> = {
    style: [
      { label: t('categoryFilter.style_new'), value: "new" },
      { label: t('categoryFilter.style_simple'), value: "simple" },
      { label: t('categoryFilter.style_fancy'), value: "fancy" },
      { label: t('categoryFilter.style_art'), value: "art" },
      { label: t('categoryFilter.style_trendy'), value: "trendy" },
      { label: t('categoryFilter.style_classic'), value: "classic" },
      { label: t('categoryFilter.style_season'), value: "season" },
      { label: t('categoryFilter.style_theme'), value: "theme" },
      { label: t('categoryFilter.style_kitsch'), value: "kitsch" },
      { label: t('categoryFilter.style_natural'), value: "natural" },
    ],
    color: [
      { label: t('categoryFilter.color_red'), value: "red" },
      { label: t('categoryFilter.color_pink'), value: "pink" },
      { label: t('categoryFilter.color_blue'), value: "blue" },
      { label: t('categoryFilter.color_green'), value: "green" },
      { label: t('categoryFilter.color_blackWhite'), value: "black-white" },
      { label: t('categoryFilter.color_brown'), value: "brown" },
      { label: t('categoryFilter.color_yellow'), value: "yellow" },
      { label: t('categoryFilter.color_neutral'), value: "neutral" },
    ],
    texture: [
      { label: t('categoryFilter.texture_glitter'), value: "glitter" },
      { label: t('categoryFilter.texture_chrome'), value: "chrome" },
      { label: t('categoryFilter.texture_matte'), value: "matte" },
      { label: t('categoryFilter.texture_velvet'), value: "velvet" },
      { label: t('categoryFilter.texture_gel'), value: "gel" },
      { label: t('categoryFilter.texture_magnet'), value: "magnet" },
    ],
    tpo: [
      { label: t('categoryFilter.tpo_daily'), value: "daily" },
      { label: t('categoryFilter.tpo_party'), value: "party" },
      { label: t('categoryFilter.tpo_wedding'), value: "wedding" },
      { label: t('categoryFilter.tpo_performance'), value: "performance" },
      { label: t('categoryFilter.tpo_special'), value: "special" },
    ],
    shape: [],
    length: [],
    nation: [],
  };

  const handleMultiSelect = (key: MultiSelectCategoryKey, item: string, maxCount: number) => {
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
    key: MultiSelectCategoryKey,
    title: string,
    maxCount: number
  ) => {
    const selectedItems = value[key] || [];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <span className="text-xs text-gray-500">
            {t('categorySelector.selectedCount', { current: selectedItems.length, max: maxCount })}
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
        <h2 className="text-lg font-semibold text-gray-900">{t('categorySelector.title')}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {t('categorySelector.description')}
        </p>
      </div>

      {renderMultiSelectCategory('style', t('categoryType.style'), 3)}
      {renderMultiSelectCategory('color', t('categoryType.color'), 3)}
      {renderMultiSelectCategory('texture', t('categoryType.texture'), 3)}
      {renderMultiSelectCategory('tpo', t('categoryType.tpo'), 3)}

      {(value.style?.length || value.color?.length || value.texture?.length || value.tpo?.length) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">{t('categorySelector.selectedCategories')}</h4>
          <div className="space-y-1 text-xs text-gray-600">
            {value.style?.length && (
              <div><span className="font-medium">{t('categoryType.style')}:</span> {value.style.join(', ')}</div>
            )}
            {value.color?.length && (
              <div><span className="font-medium">{t('categoryType.color')}:</span> {value.color.join(', ')}</div>
            )}
            {value.texture?.length && (
              <div><span className="font-medium">{t('categoryType.texture')}:</span> {value.texture.join(', ')}</div>
            )}
            {value.tpo?.length && (
              <div><span className="font-medium">{t('categoryType.tpo')}:</span> {value.tpo.join(', ')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
