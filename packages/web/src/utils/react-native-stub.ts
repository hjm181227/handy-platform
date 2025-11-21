/**
 * React Native stub for web환경
 *
 * 웹 빌드 시 react-native import를 이 파일로 대체하여
 * 빌드 에러를 방지합니다.
 */

// 빈 객체 export
export default {};

// 필요한 경우 여기에 추가 stub export
export const Platform = {
  OS: 'web',
  select: (obj: any) => obj.web || obj.default,
};

export const StyleSheet = {
  create: (styles: any) => styles,
};
