import { i18n } from '@handy-platform/shared';
import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BaseApiService } from '@handy-platform/shared'
import '@fontsource/pretendard/400.css'
import '@fontsource/pretendard/500.css'
import '@fontsource/pretendard/600.css'
import '@fontsource/pretendard/700.css'
import App from './App'
import './index.css'

// Sentry 에러 모니터링 초기화
const sentryEnv = (import.meta as any).env?.VITE_ENVIRONMENT;
if (sentryEnv === 'production' || sentryEnv === 'staging' || sentryEnv === 'stage') {
  Sentry.init({
    dsn: (import.meta as any).env?.VITE_SENTRY_DSN,
    environment: sentryEnv,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0.5,
    replaysSessionSampleRate: 0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
  });

  // API 에러를 Sentry에 전송
  BaseApiService.onApiError = (error, context) => {
    Sentry.captureException(error, {
      tags: {
        api_method: context.method,
        api_endpoint: context.endpoint,
        api_status: context.status?.toString(),
      },
      extra: {
        endpoint: context.endpoint,
        method: context.method,
        status: context.status,
      },
    });
  };
}

// unhandled promise rejection 캡처 (try/catch 밖에서 발생하는 에러)
window.addEventListener('unhandledrejection', (event) => {
  Sentry.captureException(event.reason, {
    tags: { type: 'unhandled_promise_rejection' },
  });
});

// 카카오 SDK 초기화는 로그인 시점에 utils/kakaoSdk.ts의 initKakaoSdk()가 담당한다.
// (여기서 사전 초기화하던 코드는 프로덕션 분기값이 'your_production_app_key'
//  플레이스홀더였고, index.html이 이미 스테이징 키로 init해버려 무의미했다.)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)