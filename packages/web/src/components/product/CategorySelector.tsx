import { useState } from 'react';
import type { NailCategories } from '@handy-platform/shared';

interface CategorySelectorProps {
  value: Partial<NailCategories>;
  onChange: (categories: Partial<NailCategories>) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const categoryData = {
    style: [
      { label: "신상", icon: "✨" },
      { label: "심플", icon: "🤍" },
      { label: "화려", icon: "💎" },
      { label: "아트", icon: "🎨" },
      { label: "트렌디", icon: "🔥" },
      { label: "클래식", icon: "👑" },
      { label: "시즌", icon: "🌸" },
      { label: "테마", icon: "🎭" },
      { label: "키치", icon: "🌈" },
      { label: "네츄럴", icon: "🌿" },
    ],
    color: [
      { label: "레드 계열", icon: "🔴" },
      { label: "핑크 계열", icon: "🩷" },
      { label: "블루 계열", icon: "🔵" },
      { label: "그린 계열", icon: "🟢" },
      { label: "뉴트럴", icon: "🤎" },
      { label: "블랙/화이트", icon: "⚫" },
    ],
    texture: [
      { label: "글리터", icon: "✨" },
      { label: "크롬/메탈", icon: "🪙" },
      { label: "매트", icon: "🎯" },
      { label: "벨벳", icon: "🧸" },
      { label: "젤", icon: "💧" },
      { label: "자석", icon: "🧲" },
    ],
    tpo: [
      { label: "데일리", icon: "☀️" },
      { label: "파티", icon: "🎉" },
      { label: "웨딩", icon: "💒" },
      { label: "공연", icon: "🎪" },
      { label: "Special day", icon: "🎁" },
    ],
  };

  const handleMultiSelect = (key: 'style' | 'color' | 'texture' | 'tpo', item: string, maxCount: number) => {
    const currentItems = value[key] || [];
    const isSelected = currentItems.includes(item);
    
    let newItems: string[];
    if (isSelected) {
      // 이미 선택된 경우 제거
      newItems = currentItems.filter(i => i !== item);
    } else {
      // 새로 선택하는 경우
      if (currentItems.length >= maxCount) {
        // 최대 개수 초과시 첫 번째 항목 제거하고 새 항목 추가
        newItems = [...currentItems.slice(1), item];
      } else {
        // 최대 개수 미만이면 그냥 추가
        newItems = [...currentItems, item];
      }
    }
    
    onChange({
      ...value,
      [key]: newItems
    });
  };

  const renderMultiSelectCategory = (
    key: 'style' | 'color' | 'texture' | 'tpo',
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
                key={item.label}
                type="button"
                onClick={() => handleMultiSelect(key, item.label, maxCount)}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-200
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-base">{item.icon}</span>
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

      {/* 선택된 카테고리 요약 */}
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