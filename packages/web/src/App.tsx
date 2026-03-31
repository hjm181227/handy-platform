import * as Sentry from '@sentry/react';
import { I18nextProvider } from 'react-i18next';
import { i18n, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@handy-platform/shared';
import { HelmetProvider } from 'react-helmet-async';

// URL 쿼리 파라미터로 언어 설정 (SPA 내 라우팅에서도 동작)
const langParam = new URLSearchParams(window.location.search).get('lang');
if (langParam && (SUPPORTED_LANGUAGES as readonly string[]).includes(langParam)) {
  i18n.changeLanguage(langParam as SupportedLanguage);
}
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CartProvider } from './contexts/CartContext';
import { LikesProvider } from './contexts/LikesContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { AlertProvider } from './components/common';
import { ToastNotification } from './components/common/ToastNotification';
import { AuthModal } from './components/auth/AuthModal';
import { Router } from './Router';

function ErrorFallback() {
  return (
    <div style={{ padding: 20, textAlign: 'center', marginTop: '20vh' }}>
      <h2>{i18n.t('common:errorOccurred')}</h2>
      <p style={{ color: '#666', margin: '12px 0' }}>{i18n.t('common:tryAgainLater')}</p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '8px 24px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer' }}
      >
        {i18n.t('common:refresh')}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
        <HelmetProvider>
          <AuthProvider>
            <ToastProvider>
              <AuthModalProvider>
                <CartProvider>
                  <LikesProvider>
                    <AlertProvider>
                      <Router />
                      <ToastNotification />
                      <AuthModal />
                    </AlertProvider>
                  </LikesProvider>
                </CartProvider>
              </AuthModalProvider>
            </ToastProvider>
          </AuthProvider>
        </HelmetProvider>
      </Sentry.ErrorBoundary>
    </I18nextProvider>
  );
}
