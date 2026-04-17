import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 환경변수 로드 (envDir에서 .env 파일들을 읽음)
  const env = loadEnv(mode, process.cwd() + '/packages/web', '')

  return {
  plugins: [
    react(),
    // Sentry 소스맵 업로드 (프로덕션 빌드 시에만, AUTH_TOKEN 있을 때만)
    env.SENTRY_AUTH_TOKEN ? sentryVitePlugin({
      org: env.SENTRY_ORG || 'handy',
      project: env.SENTRY_PROJECT || 'handy-web',
      authToken: env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    }) : null,
  ].filter(Boolean),
  build: {
    sourcemap: true,
  },
  // Vite가 .env 파일을 찾을 디렉토리 (현재 config 파일 위치 기준)
  envDir: '.',
  server: {
    port: 3001,
    host: true,
    // 일반 API는 stage 백엔드로 프록시, 채팅은 직접 연결
    proxy: {
      '/api': {
        target: 'https://api.stage-handy.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  resolve: {
    // 웹 빌드 시 .web 확장자 우선 사용
    extensions: ['.web.ts', '.web.tsx', '.web.js', '.ts', '.tsx', '.js', '.json'],
    alias: {
      // react-native를 react-native-web으로 대체
      'react-native': 'react-native-web',
      // 모노레포 루트의 React 19 대신 web 패키지 전용 React 18 사용
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    }
  },
  optimizeDeps: {
    // React Native 모듈 및 워크스페이스 패키지 제외 (사전 번들링 캐시 문제 방지)
    exclude: ['react-native', '@handy-platform/shared'],
  },
  define: {
    global: 'globalThis',
    // 환경 변수를 전역으로 설정
    '__VITE_MODE__': JSON.stringify(mode || 'development'),
    // API 환경 설정 (로컬 환경 우선)
    '__API_ENV__': JSON.stringify(mode === 'local' ? 'local' : mode || 'development'),
    // API Base URL을 빌드 타임에 주입 (환경변수 우선 사용)
    // 1순위: .env.{mode} 파일의 VITE_API_BASE_URL
    // 2순위: 모드별 기본값 (stage/prod: /api, dev: localhost:11000)
    '__VITE_API_BASE_URL__': JSON.stringify(
      env.VITE_API_BASE_URL ||
      (mode === 'stage' || mode === 'production' ? '/api' : 'http://localhost:11000')
    ),
  },
  // 환경별 모드 설정
  mode: mode || 'development'
}})
