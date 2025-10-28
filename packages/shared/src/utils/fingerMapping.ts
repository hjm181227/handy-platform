/**
 * 손가락 이름 매핑 유틸리티
 * 앱에서 사용하는 한글 이름과 서버 API의 영어 이름을 상호 변환
 */

export type FingerNameKorean = '엄지' | '검지' | '중지' | '약지' | '새끼';
export type FingerNameEnglish = 'thumb' | 'index' | 'middle' | 'ring' | 'little';

const FINGER_MAP_KOR_TO_ENG: Record<FingerNameKorean, FingerNameEnglish> = {
  '엄지': 'thumb',
  '검지': 'index',
  '중지': 'middle',
  '약지': 'ring',
  '새끼': 'little',
};

const FINGER_MAP_ENG_TO_KOR: Record<FingerNameEnglish, FingerNameKorean> = {
  'thumb': '엄지',
  'index': '검지',
  'middle': '중지',
  'ring': '약지',
  'little': '새끼',
};

/**
 * 한글 손가락 이름을 영어로 변환
 * @param koreanName - 한글 손가락 이름 ('엄지', '검지', '중지', '약지', '새끼')
 * @returns 영어 손가락 이름 ('thumb', 'index', 'middle', 'ring', 'little')
 */
export const koreanToEnglishFinger = (koreanName: string): FingerNameEnglish => {
  const result = FINGER_MAP_KOR_TO_ENG[koreanName as FingerNameKorean];
  if (!result) {
    throw new Error(`Invalid Korean finger name: ${koreanName}`);
  }
  return result;
};

/**
 * 영어 손가락 이름을 한글로 변환
 * @param englishName - 영어 손가락 이름 ('thumb', 'index', 'middle', 'ring', 'little')
 * @returns 한글 손가락 이름 ('엄지', '검지', '중지', '약지', '새끼')
 */
export const englishToKoreanFinger = (englishName: string): FingerNameKorean => {
  const result = FINGER_MAP_ENG_TO_KOR[englishName as FingerNameEnglish];
  if (!result) {
    throw new Error(`Invalid English finger name: ${englishName}`);
  }
  return result;
};

/**
 * 모든 손가락 이름 (한글)
 */
export const ALL_FINGERS_KOREAN: FingerNameKorean[] = ['엄지', '검지', '중지', '약지', '새끼'];

/**
 * 모든 손가락 이름 (영어)
 */
export const ALL_FINGERS_ENGLISH: FingerNameEnglish[] = ['thumb', 'index', 'middle', 'ring', 'little'];
