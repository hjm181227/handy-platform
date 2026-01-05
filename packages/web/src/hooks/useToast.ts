import { useContext } from 'react';
import { ToastContext, ToastContextType } from '../contexts/ToastContext';

/**
 * 토스트 알림 훅
 *
 * 사용법:
 * ```tsx
 * const { showToast } = useToast();
 *
 * showToast('성공!', 'success');
 * showToast('에러 발생', 'error');
 * showToast('알림 메시지', 'info');
 * ```
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
