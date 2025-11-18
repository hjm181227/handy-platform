import React from 'react';

/**
 * 인증 확인 중 표시되는 로딩 화면
 */
export const LoadingScreen: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e9ecef',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p
        style={{
          marginTop: '24px',
          fontSize: '16px',
          color: '#6c757d',
          fontWeight: 500,
        }}
      >
        확인 중...
      </p>
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