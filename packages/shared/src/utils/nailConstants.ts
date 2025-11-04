/**
 * 네일 옵션 상수
 */

// 네일 쉐입 옵션 배열
export const NAIL_SHAPES = ['ROUND', 'ALMOND', 'SQUARE', 'OVAL', 'COFFIN', 'STILETTO'] as const;

// 네일 길이 옵션 배열
export const NAIL_LENGTHS = ['SHORT', 'MEDIUM', 'LONG'] as const;

// 네일 쉐입 한글 표기명
export const NAIL_SHAPE_NAME: Record<string, string> = {
  ROUND: '라운드',
  ALMOND: '아몬드',
  SQUARE: '스퀘어',
  OVAL: '오벌',
  COFFIN: '코핀',
  STILETTO: '스틸레토'
};

// 네일 길이 한글 표기명
export const NAIL_LENGTH_NAME: Record<string, string> = {
  SHORT: '숏',
  MEDIUM: '미디움',
  LONG: '롱'
};
