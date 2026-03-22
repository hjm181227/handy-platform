import * as Sentry from '@sentry/react';
import { HelmetProvider } from 'react-helmet-async';
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
      <h2>문제가 발생했습니다</h2>
      <p style={{ color: '#666', margin: '12px 0' }}>잠시 후 다시 시도해주세요.</p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '8px 24px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer' }}
      >
        새로고침
      </button>
    </div>
  );
}

export default function App() {
  return (
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
  );
}
