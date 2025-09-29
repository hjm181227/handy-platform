import { useState, useEffect } from 'react';

interface CategoryIconProps {
  categoryKey: string;
  categoryLabel: string;
  className?: string;
  fallbackIcon?: string;
}

interface CategoryIconData {
  imageUrl?: string;
  emoji: string;
  altText: string;
}

// 임시 카테고리 아이콘 데이터 (나중에 DB에서 가져올 예정)
const TEMP_CATEGORY_ICONS: Record<string, CategoryIconData> = {
  // 스타일
  '신상': { emoji: '✨', altText: '신상 아이콘' },
  '심플': { emoji: '🤍', altText: '심플 아이콘' },
  '화려': { emoji: '💎', altText: '화려 아이콘' },
  '아트': { emoji: '🎨', altText: '아트 아이콘' },
  '트렌디': { emoji: '🔥', altText: '트렌디 아이콘' },
  '클래식': { emoji: '👑', altText: '클래식 아이콘' },
  '시즌': { emoji: '🌸', altText: '시즌 아이콘' },
  '테마': { emoji: '🎭', altText: '테마 아이콘' },
  '키치': { emoji: '🌈', altText: '키치 아이콘' },
  '네츄럴': { emoji: '🌿', altText: '네츄럴 아이콘' },
  
  // 컬러
  '레드 계열': { emoji: '🔴', altText: '레드 계열 아이콘' },
  '핑크 계열': { emoji: '🩷', altText: '핑크 계열 아이콘' },
  '블루 계열': { emoji: '🔵', altText: '블루 계열 아이콘' },
  '그린 계열': { emoji: '🟢', altText: '그린 계열 아이콘' },
  '뉴트럴': { emoji: '🤎', altText: '뉴트럴 아이콘' },
  '블랙/화이트': { emoji: '⚫', altText: '블랙/화이트 아이콘' },
  
  // 텍스처
  '글리터': { emoji: '✨', altText: '글리터 아이콘' },
  '크롬/메탈': { emoji: '🪙', altText: '크롬/메탈 아이콘' },
  '매트': { emoji: '🎯', altText: '매트 아이콘' },
  '벨벳': { emoji: '🧸', altText: '벨벳 아이콘' },
  '젤': { emoji: '💧', altText: '젤 아이콘' },
  '자석': { emoji: '🧲', altText: '자석 아이콘' },
  
  // 모양
  '라운드': { emoji: '⭕', altText: '라운드 아이콘' },
  '아몬드': { emoji: '🥜', altText: '아몬드 아이콘' },
  '오벌': { emoji: '🥚', altText: '오벌 아이콘' },
  '스틸레토': { emoji: '📍', altText: '스틸레토 아이콘' },
  '스퀘어': { emoji: '⬜', altText: '스퀘어 아이콘' },
  '코핀': { emoji: '⚰️', altText: '코핀 아이콘' },
  
  // 길이
  'Long': { emoji: '📏', altText: '롱 아이콘' },
  'Medium': { emoji: '📐', altText: '미디움 아이콘' },
  'Short': { emoji: '📌', altText: '숏 아이콘' },
  
  // TPO
  '데일리': { emoji: '☀️', altText: '데일리 아이콘' },
  '파티': { emoji: '🎉', altText: '파티 아이콘' },
  '웨딩': { emoji: '💒', altText: '웨딩 아이콘' },
  '공연': { emoji: '🎪', altText: '공연 아이콘' },
  'Special day': { emoji: '🎁', altText: '스페셜데이 아이콘' },
  
  // A&B
  '아티스트': { emoji: '👨‍🎨', altText: '아티스트 아이콘' },
  '브랜드': { emoji: '🏷️', altText: '브랜드 아이콘' },
  
  // 국가
  'K네일': { emoji: '🇰🇷', altText: 'K네일 아이콘' },
  'J네일': { emoji: '🇯🇵', altText: 'J네일 아이콘' },
  'A네일': { emoji: '🇺🇸', altText: 'A네일 아이콘' },
  
  // 카테고리 그룹 이름들
  '스타일': { emoji: '🎨', altText: '스타일 아이콘' },
  '컬러': { emoji: '🎨', altText: '컬러 아이콘' },
  '텍스쳐': { emoji: '✨', altText: '텍스쳐 아이콘' },
  'TPO': { emoji: '📅', altText: 'TPO 아이콘' },
  '모양': { emoji: '💅', altText: '모양 아이콘' },
  '길이': { emoji: '📏', altText: '길이 아이콘' },
  '아티스트/브랜드': { emoji: '👨‍🎨', altText: '아티스트/브랜드 아이콘' },
  '국가별': { emoji: '🌍', altText: '국가별 아이콘' },
};

// 나중에 API에서 카테고리 아이콘 정보를 가져오는 함수
const fetchCategoryIconFromDB = async (categoryKey: string, categoryLabel: string): Promise<CategoryIconData> => {
  // TODO: 실제 API 호출로 교체
  // const response = await apiService.getCategoryIcon(categoryKey, categoryLabel);
  // return response.data;
  
  // 임시로 하드코딩된 데이터 반환
  return TEMP_CATEGORY_ICONS[categoryLabel] || { 
    emoji: '📁', 
    altText: `${categoryLabel} 아이콘` 
  };
};

export function CategoryIcon({ 
  categoryKey, 
  categoryLabel, 
  className = '', 
  fallbackIcon = '📁' 
}: CategoryIconProps) {
  const [iconData, setIconData] = useState<CategoryIconData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCategoryIconFromDB(categoryKey, categoryLabel);
        setIconData(data);
      } catch (error) {
        console.error('카테고리 아이콘 로딩 실패:', error);
        // 에러 시 폴백 아이콘 사용
        setIconData({
          emoji: fallbackIcon,
          altText: `${categoryLabel} 아이콘`
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadIcon();
  }, [categoryKey, categoryLabel, fallbackIcon]);

  if (isLoading) {
    return (
      <span className={`inline-block w-4 h-4 ${className}`}>
        <div className="w-full h-full border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </span>
    );
  }

  if (!iconData) {
    return <span className={className}>{fallbackIcon}</span>;
  }

  return (
    <span className={className} title={iconData.altText}>
      {iconData.imageUrl ? (
        <img 
          src={iconData.imageUrl} 
          alt={iconData.altText}
          className="w-full h-full object-contain"
        />
      ) : (
        iconData.emoji
      )}
    </span>
  );
}