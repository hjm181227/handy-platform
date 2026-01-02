/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 힙한 핑크/흰색 브랜드 색상
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        // 흰색 계열
        cream: '#fffbf7',
        'off-white': '#fafafa',
        // 액센트 색상
        accent: {
          coral: '#ff7875',
          lavender: '#e879f9',
          rose: '#fb7185',
          magenta: '#d946ef',
        },
        // 배경 색상
        background: {
          primary: '#ffffff',
          secondary: '#fdf2f8',
          tertiary: '#fce7f3',
        },
      },
      fontFamily: {
        'sans': ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(236, 72, 153, 0.1), 0 10px 20px -2px rgba(236, 72, 153, 0.04)',
        'brand': '0 4px 20px -2px rgba(236, 72, 153, 0.2)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [],
}