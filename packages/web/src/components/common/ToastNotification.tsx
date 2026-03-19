import React from 'react';
import { useToast } from '../../hooks/useToast';

/**
 * 토스트 알림 UI 컴포넌트
 *
 * ToastProvider 내부에서 사용해야 합니다.
 * App.tsx 최상위에 한 번만 배치하면 됩니다.
 */
export function ToastNotification() {
  const { toastMessage, toastType, hideToast } = useToast();

  if (!toastMessage) return null;

  return (
    <div className={`
      fixed bottom-6 right-6 z-50 max-w-sm
      transform transition-all duration-300 ease-in-out animate-slide-up
      ${toastType === 'success' ? 'bg-white' :
        toastType === 'error' ? 'bg-white' :
        'bg-white'}
      rounded-2xl shadow-2xl border
      ${toastType === 'success' ? 'border-green-100' :
        toastType === 'error' ? 'border-red-100' :
        'border-blue-100'}
    `}>
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${toastType === 'success' ? 'bg-green-50' :
            toastType === 'error' ? 'bg-red-50' :
            'bg-[#FFF1F2]'}
        `}>
          <span className="text-xl">
            {toastType === 'success' ? '✓' :
             toastType === 'error' ? '⚠' :
             'ℹ'}
          </span>
        </div>
        <div className="flex-1">
          <p className={`
            text-sm font-medium
            ${toastType === 'success' ? 'text-gray-900' :
              toastType === 'error' ? 'text-gray-900' :
              'text-gray-900'}
          `}>
            {toastMessage}
          </p>
        </div>
        <button
          onClick={hideToast}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
