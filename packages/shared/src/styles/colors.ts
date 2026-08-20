// Handy 브랜드 팔레트 (tailwind.config.js 토큰과 동일한 값)
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

// CSS 변수 형태로 내보내기
export const cssVariables = {
  '--color-primary-50': colors.primary[50],
  '--color-primary-100': colors.primary[100],
  '--color-primary-200': colors.primary[200],
  '--color-primary-300': colors.primary[300],
  '--color-primary-400': colors.primary[400],
  '--color-primary-500': colors.primary[500],
  '--color-primary-600': colors.primary[600],
  '--color-primary-700': colors.primary[700],
  '--color-primary-800': colors.primary[800],
  '--color-primary-900': colors.primary[900],
  
  '--color-white': colors.white,
  '--color-cream': colors.cream,
  '--color-off-white': colors.offWhite,
  
  '--color-gray-50': colors.gray[50],
  '--color-gray-100': colors.gray[100],
  '--color-gray-200': colors.gray[200],
  '--color-gray-300': colors.gray[300],
  '--color-gray-400': colors.gray[400],
  '--color-gray-500': colors.gray[500],
  '--color-gray-600': colors.gray[600],
  '--color-gray-700': colors.gray[700],
  '--color-gray-800': colors.gray[800],
  '--color-gray-900': colors.gray[900],
  
  '--color-background-primary': colors.background.primary,
  '--color-background-secondary': colors.background.secondary,
  '--color-background-tertiary': colors.background.tertiary,
  
  '--color-text-primary': colors.text.primary,
  '--color-text-secondary': colors.text.secondary,
  '--color-text-brand': colors.text.brand,
  
  '--color-border-light': colors.border.light,
  '--color-border-medium': colors.border.medium,
  '--color-border-brand': colors.border.brand,
};

export default colors;