import React, { useEffect } from 'react';

interface RedirectingScreenProps {
  message: string;
  /** 자동 숨김 시간 (ms). 기본값: 2000 */
  autoHideDelay?: number;
  /** 자동 숨김 시 호출될 콜백 */
  onAutoHide?: () => void;
}

/**
 * 리다이렉트 중 표시되는 메시지 화면
 */
export const RedirectingScreen: React.FC<RedirectingScreenProps> = ({
  message,
  autoHideDelay = 2000,
  onAutoHide,
}) => {
  useEffect(() => {
    if (onAutoHide && autoHideDelay > 0) {
      const timer = setTimeout(onAutoHide, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHideDelay, onAutoHide]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          padding: '32px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            backgroundColor: '#e3f2fd',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
          }}
        >
          ℹ️
        </div>
        <p
          style={{
            margin: 0,
            fontSize: '18px',
            color: '#212529',
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        <div
          style={{
            marginTop: '24px',
            width: '48px',
            height: '48px',
            margin: '24px auto 0',
            border: '3px solid #e9ecef',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};
