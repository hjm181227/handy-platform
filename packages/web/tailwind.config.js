/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Handy 커머스 디자인 토큰 (2026-08-20 실사용 팔레트에서 승격) ──
        // 화면 전반에 하드코딩돼 있던 hex 1,200여 개를 이 토큰들로 통합했다.
        // 색을 바꿀 땐 여기만 고치면 전체에 반영된다. 새 화면은 hex 금지, 토큰만 사용.
        brand: {
          DEFAULT: '#E85A6B', // 주 브랜드 로즈 — CTA, 강조, 액티브
          50: '#FFF1F2',      // 옅은 로즈 배경 (선택 상태, 하이라이트 박스)
          100: '#FFE4E6',
          200: '#FECDD3',
          600: '#D14A5B',     // hover/pressed
          700: '#B23A49',
        },
        ink: '#131211',       // 본문 텍스트 (거의 검정, 웜 블랙)
        muted: '#A39E99',     // 보조 텍스트 (웜 그레이)
        line: {
          DEFAULT: '#E5E0DC', // 보더/디바이더
          strong: '#D0C9C3',  // 진한 보더, 비활성 아이콘
        },
        surface: {
          DEFAULT: '#F7F5F3', // 화면 배경 (웜 화이트)
          strong: '#EEEBE8',  // 눌린 배경, 인풋 배경
        },
      },
      fontFamily: {
        'sans': ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(232, 90, 107, 0.08), 0 10px 20px -2px rgba(19, 18, 17, 0.04)',
        'brand': '0 4px 20px -2px rgba(232, 90, 107, 0.2)',
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