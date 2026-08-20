// Handy 브랜드 팔레트 (tailwind.config.js 토큰과 동일한 값) (React Native용)
export const colors = {
  // 메인 브랜드 색상 (brand)
  primary: {
    50: '#FFF1F2',   // brand-50
    100: '#FFE4E6',  // brand-100
    200: '#FECDD3',  // brand-200
    300: '#F7A8B4',  // brand-300
    400: '#EF7A8B',  // brand-400
    500: '#E85A6B',  // brand (메인)
    600: '#D14A5B',  // brand-600
    700: '#B23A49',  // brand-700
    800: '#8E2E3A',  // brand-800
    900: '#6B222C',  // brand-900
  },

  // 서브 색상 (흰색 기반)
  white: '#ffffff',
  cream: '#FFFBF7',      // 따뜻한 흰색
  offWhite: '#F7F5F3',   // 오프 화이트
  
  // 웜 뉴트럴 (surface / line / muted / ink)
  gray: {
    50: '#F7F5F3',
    100: '#EEEBE8',
    200: '#E5E0DC',
    300: '#D0C9C3',
    400: '#A39E99',
    500: '#837E79',
    600: '#6D6C6A',
    700: '#4A4846',
    800: '#2A2827',
    900: '#131211',
  },

  // 상태 색상
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
    secondary: '#FFF1F2',
    tertiary: '#FFE4E6',
    dark: '#131211',
  },

  // 텍스트 색상
  text: {
    primary: '#131211',
    secondary: '#6D6C6A',
    tertiary: '#A39E99',
    inverse: '#ffffff',
    brand: '#E85A6B',
  },

  // 보더 색상
  border: {
    light: '#EEEBE8',
    medium: '#E5E0DC',
    dark: '#D0C9C3',
    brand: '#FECDD3',
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