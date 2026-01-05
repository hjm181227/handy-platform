import React, { createContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastContextType {
  /** 현재 표시 중인 토스트 메시지 */
  toastMessage: string | null;
  /** 토스트 타입 */
  toastType: ToastType;
  /** 토스트 표시 */
  showToast: (message: string, type?: ToastType) => void;
  /** 토스트 숨김 */
  hideToast: () => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * 전역 토스트 알림 Provider
 *
 * 기능:
 * - 성공/에러/정보 타입의 토스트 메시지 표시
 * - 3초 후 자동 숨김
 * - 수동 숨김 지원
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>('info');

  /**
   * 토스트 메시지 표시
   * @param message 표시할 메시지
   * @param type 토스트 타입 (success, error, info)
   */
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToastMessage(message);
    setToastType(type);

    // 3초 후 자동 숨김
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  /**
   * 토스트 메시지 숨김
   */
  const hideToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const value: ToastContextType = {
    toastMessage,
    toastType,
    showToast,
    hideToast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};
