import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/pretendard/400.css'
import '@fontsource/pretendard/500.css'
import '@fontsource/pretendard/600.css'
import '@fontsource/pretendard/700.css'
import App from './App'
import './index.css'

// Sentry 에러 모니터링 초기화
Sentry.init({
  dsn: (import.meta as any).env?.VITE_SENTRY_DSN,
  environment: (import.meta as any).env?.VITE_ENVIRONMENT || 'development',
  enabled: (import.meta as any).env?.VITE_ENVIRONMENT === 'production' || (import.meta as any).env?.VITE_ENVIRONMENT === 'staging',
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.5,
  replaysSessionSampleRate: 0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
})

// 카카오 SDK 디버깅 헬퍼
(window as any).debugKakao = () => {
  console.log('=== 카카오 SDK 디버깅 정보 ===');
  console.log('window.Kakao:', window.Kakao);
  if (window.Kakao) {
    console.log('Kakao keys:', Object.keys(window.Kakao));
    console.log('Kakao.Auth:', window.Kakao.Auth);
    if (window.Kakao.Auth) {
      console.log('Auth keys:', Object.keys(window.Kakao.Auth));
    }
    console.log('isInitialized:', window.Kakao.isInitialized ? window.Kakao.isInitialized() : 'method not found');
  }
  console.log('HTML script tags:', Array.from(document.querySelectorAll('script[src*="kakao"]')));
  console.log('========================');
};

// 페이지 로드 후 Kakao 상태 확인 및 사전 초기화
window.addEventListener('load', () => {
  setTimeout(() => {
    console.log('페이지 로드 완료 후 카카오 상태 확인:');
    (window as any).debugKakao();
    
    // 카카오 SDK 사전 초기화 시도
    if (window.Kakao && !window.Kakao.isInitialized()) {
      try {
        const appKey = (window as any).__VITE_ENV__ === 'production' 
          ? 'your_production_app_key'
          : 'f466bdbd818f288f370407d10da4710d';
        console.log('카카오 SDK 사전 초기화 시도:', appKey);
        window.Kakao.init(appKey);
        
        setTimeout(() => {
          console.log('초기화 1초 후 상태:');
          (window as any).debugKakao();
        }, 1000);
      } catch (error) {
        console.error('카카오 SDK 사전 초기화 실패:', error);
      }
    }
  }, 500);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)