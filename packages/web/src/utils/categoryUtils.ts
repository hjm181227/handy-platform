/**
 * 카테고리 관련 유틸리티
 * - key(value): 서버와 주고받는 영문 값
 * - name: UI 표시용 한글 값
 */

// 카테고리 타입별 레이블
export const categoryTypeLabels: Record<string, string> = {
  style: '스타일',
  color: '컬러',
  texture: '텍스쳐',
  shape: '모양',
  length: '길이',
  tpo: 'TPO',
  nation: '국가별'
};

// 카테고리 옵션 정의 (value: 서버 전송용, name: UI 표시용)
export const categoryOptions = {
  style: [
    { value: 'new', name: '신상' },
    { value: 'simple', name: '심플' },
    { value: 'fancy', name: '화려' },
    { value: 'art', name: '아트' },
    { value: 'trendy', name: '트렌디' },
    { value: 'classic', name: '클래식' },
    { value: 'season', name: '시즌' },
    { value: 'theme', name: '테마' },
    { value: 'kitsch', name: '키치' },
    { value: 'natural', name: '네츄럴' }
  ],
  color: [
    { value: 'red', name: '레드' },
    { value: 'pink', name: '핑크' },
    { value: 'blue', name: '블루' },
    { value: 'green', name: '그린' },
    { value: 'purple', name: '퍼플' },
    { value: 'transparent', name: '투명' },
    { value: 'white', name: '화이트' },
    { value: 'black', name: '블랙' },
    { value: 'orange', name: '오렌지' },
    { value: 'silver', name: '실버' },
    { value: 'gold', name: '골드' },
    { value: 'brown', name: '브라운' },
    { value: 'yellow', name: '옐로우' },
    { value: 'neutral', name: '뉴트럴' }
  ],
  texture: [
    { value: 'glitter', name: '글리터' },
    { value: 'metal', name: '메탈' },
    { value: 'matte', name: '매트' },
    { value: 'velvet', name: '벨벳' },
    { value: 'gel', name: '젤' },
    { value: 'magnet', name: '자석' }
  ],
  tpo: [
    { value: 'daily', name: '데일리' },
    { value: 'party', name: '파티' },
    { value: 'wedding', name: '웨딩' },
    { value: 'performance', name: '공연' }
  ],
  nation: [
    { value: 'kr', name: 'K네일' },
    { value: 'jp', name: 'J네일' },
    { value: 'us', name: 'A네일' }
  ],
  shape: [
    { value: 'round', name: '라운드' },
    { value: 'almond', name: '아몬드' },
    { value: 'oval', name: '오벌' },
    { value: 'stiletto', name: '스틸레토' },
    { value: 'square', name: '스퀘어' },
    { value: 'coffin', name: '코핀' }
  ],
  length: [
    { value: 'short', name: '숏' },
    { value: 'medium', name: '미디엄' },
    { value: 'long', name: '롱' }
  ]
} as const;

// value -> name 매핑 (빠른 조회용)
export const categoryValueToName: Record<string, Record<string, string>> =
  Object.fromEntries(
    Object.entries(categoryOptions).map(([type, options]) => [
      type,
      Object.fromEntries(options.map(opt => [opt.value, opt.name]))
    ])
  );

// name -> value 매핑 (역변환용)
export const categoryNameToValue: Record<string, Record<string, string>> =
  Object.fromEntries(
    Object.entries(categoryOptions).map(([type, options]) => [
      type,
      Object.fromEntries(options.map(opt => [opt.name, opt.value]))
    ])
  );

/**
 * 카테고리 value를 표시용 name으로 변환
 * @param categoryType 카테고리 타입 (style, color, etc.)
 * @param value 카테고리 value (영문 key)
 * @returns 표시용 name (매핑이 없으면 원본 반환)
 */
export const getCategoryDisplayName = (categoryType: string, value: string): string => {
  return categoryValueToName[categoryType]?.[value] || value;
};

/**
 * 카테고리 name을 서버 전송용 value로 변환
 * @param categoryType 카테고리 타입 (style, color, etc.)
 * @param name 카테고리 name (한글)
 * @returns 서버 전송용 value (매핑이 없으면 원본 반환)
 */
export const getCategoryValue = (categoryType: string, name: string): string => {
  return categoryNameToValue[categoryType]?.[name] || name;
};

/**
 * 카테고리 타입의 표시용 레이블 조회
 * @param categoryType 카테고리 타입 (style, color, etc.)
 * @returns 타입 레이블 (매핑이 없으면 원본 반환)
 */
export const getCategoryTypeLabel = (categoryType: string): string => {
  return categoryTypeLabels[categoryType] || categoryType;
};
