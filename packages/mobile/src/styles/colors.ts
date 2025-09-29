// 힙한 핑크/흰색 메인 색상 팔레트 (React Native용)
export const colors = {
  // 메인 브랜드 색상 (힙한 핑크 톤)
  primary: {
    50: '#fdf2f8',   // 매우 연한 핑크 (배경용)
    100: '#fce7f3',  // 연한 핑크
    200: '#fbcfe8',  // 밝은 핑크
    300: '#f9a8d4',  // 중간 밝은 핑크
    400: '#f472b6',  // 메인 핑크
    500: '#ec4899',  // 진한 핑크 (메인 브랜드)
    600: '#db2777',  // 더 진한 핑크
    700: '#be185d',  // 어두운 핑크
    800: '#9d174d',  // 매우 어두운 핑크
    900: '#831843',  // 가장 어두운 핑크
  },

  // 서브 색상 (흰색 기반)
  white: '#ffffff',
  cream: '#fffbf7',      // 따뜻한 흰색
  offWhite: '#fafafa',   // 오프 화이트
  
  // 그레이스케일 (힙한 느낌)
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // 상태 색상 (핑크 톤으로 조화)
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // 특별한 색상
  accent: {
    coral: '#ff7875',     // 코랄 핑크
    lavender: '#e879f9',  // 라벤더 핑크
    rose: '#fb7185',      // 로즈 핑크
    magenta: '#d946ef',   // 마젠타
  },

  // 배경 색상
  background: {
    primary: '#ffffff',
    secondary: '#fdf2f8',
    tertiary: '#fce7f3',
    dark: '#171717',
  },

  // 텍스트 색상
  text: {
    primary: '#171717',
    secondary: '#525252',
    tertiary: '#a3a3a3',
    inverse: '#ffffff',
    brand: '#ec4899',
  },

  // 보더 색상
  border: {
    light: '#f5f5f5',
    medium: '#e5e5e5',
    dark: '#d4d4d4',
    brand: '#f9a8d4',
  },
};

// React Native 스타일링을 위한 테마 객체
export const theme = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
  shadows: {
    soft: {
      shadowColor: colors.primary[500],
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    brand: {
      shadowColor: colors.primary[500],
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
  },
};

export default colors;