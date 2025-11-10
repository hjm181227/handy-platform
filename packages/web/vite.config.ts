import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Vite가 .env 파일을 찾을 디렉토리 (현재 config 파일 위치 기준)
  envDir: '.',
  server: {
    port: 3001,
    host: true,
    // 프록시 제거 - 직접 서버 URL로 연결
  },
  resolve: {
    // 웹 빌드 시 .web 확장자 우선 사용
    extensions: ['.web.ts', '.web.tsx', '.web.js', '.ts', '.tsx', '.js', '.json'],
    // alias 제거 - Node.js 표준 모듈 resolution 사용
  },
  optimizeDeps: {
    // React Native 모듈 제외
    exclude: ['react-native'],
    // workspace 패키지 명시적으로 포함
    include: ['@handy-platform/shared'],
  },
  define: {
    global: 'globalThis',
    // 환경 변수를 전역으로 설정
    '__VITE_MODE__': JSON.stringify(mode || 'development'),
    // API 환경 설정 (로컬 환경 우선)
    '__API_ENV__': JSON.stringify(mode === 'local' ? 'local' : mode || 'development'),
    // API Base URL을 빌드 타임에 주입 (실제 값으로 대체)
    '__VITE_API_BASE_URL__': JSON.stringify(
      mode === 'stage' ? 'https://www.stage-handy.com' :
      mode === 'production' ? 'https://www.h-andy.com' :
      'http://localhost:11000'
    ),
  },
  // 환경별 모드 설정
  mode: mode || 'development'
}))