import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: mode === 'stage' ? 3002 : 3001,
    host: true,
    // 프록시 제거 - 직접 서버 URL로 연결
  },
  resolve: {
    // 웹 빌드 시 .web 확장자 우선 사용
    extensions: ['.web.ts', '.web.tsx', '.web.js', '.ts', '.tsx', '.js', '.json'],
    alias: {
      // NavigateService를 .web.ts로 강제 매핑
      '@handy-platform/shared/src/services/navigate': path.resolve(
        __dirname,
        '../../packages/shared/src/services/navigate/NavigateService.web.ts'
      ),
    },
  },
  optimizeDeps: {
    // React Native 모듈 제외
    exclude: ['react-native'],
  },
  define: {
    global: 'globalThis',
    // 환경 변수를 전역으로 설정
    '__VITE_MODE__': JSON.stringify(mode || 'development'),
    // API 환경 설정 (로컬 환경 우선)
    '__API_ENV__': JSON.stringify(mode === 'local' ? 'local' : mode || 'development'),
  },
  // 환경별 모드 설정
  mode: mode || 'development'
}))