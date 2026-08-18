import React, { useEffect, useRef, useState } from 'react';
import { AlertState } from '@handy-platform/shared';

interface AlertModalProps {
  alert: AlertState;
  onResolve: (result: any) => void;
  onReject: (reason?: any) => void;
}

export function AlertModal({ alert, onResolve, onReject }: AlertModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // 애니메이션을 위한 상태 관리
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // ESC 키 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && alert.options.closeOnEsc !== false) {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [alert.options.closeOnEsc]);

  // 포커스 트랩
  useEffect(() => {
    if (firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, []);

  // prompt 입력값 초기화
  useEffect(() => {
    if (alert.type === 'prompt') {
      setInputValue(alert.options.defaultValue || '');
    }
  }, [alert.type, alert.options.defaultValue]);

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (alert.type === 'confirm' || alert.type === 'prompt') {
        onResolve(false);
      } else {
        onResolve(null);
      }
    }, 150);
  };

  const handleConfirm = () => {
    if (alert.type === 'prompt') {
      // 유효성 검사
      if (alert.options.required && !inputValue.trim()) {
        setInputError('이 필드는 필수입니다.');
        return;
      }

      if (alert.options.minLength && inputValue.length < alert.options.minLength) {
        setInputError(`최소 ${alert.options.minLength}자 이상 입력해주세요.`);
        return;
      }

      if (alert.options.validation) {
        const validationError = alert.options.validation(inputValue);
        if (validationError) {
          setInputError(validationError);
          return;
        }
      }
    }

    setIsVisible(false);
    setTimeout(() => {
      if (alert.type === 'prompt') {
        onResolve(inputValue);
      } else if (alert.type === 'confirm') {
        onResolve(true);
      } else {
        onResolve({ action: 'confirm', confirmed: true });
      }
    }, 150);
  };

  const handleRetry = () => {
    setIsVisible(false);
    setTimeout(() => {
      onResolve({ action: 'retry', confirmed: true });
    }, 150);
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && alert.options.closeOnBackdrop !== false) {
      handleCancel();
    }
  };

  const getIcon = () => {
    if (alert.options.icon) {
      return alert.options.icon;
    }

    switch (alert.type) {
      case 'error':
        return (
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'confirm':
        return alert.options.variant === 'danger' ? (
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ) : (
          <svg className="w-12 h-12 text-[#E85A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'prompt':
        return (
          <svg className="w-12 h-12 text-[#E85A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getVariantClasses = () => {
    switch (alert.options.variant || alert.type) {
      case 'danger':
      case 'error':
        return {
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          border: 'border-red-200'
        };
      case 'warning':
        return {
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          border: 'border-yellow-200'
        };
      case 'success':
        return {
          confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
          border: 'border-green-200'
        };
      default:
        return {
          confirmButton: 'bg-[#E85A6B] hover:bg-[#D14A5B] text-white',
          border: 'border-[#E85A6B]/20'
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className={`bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        } ${variantClasses.border} border-2`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* 아이콘 및 제목 */}
          <div className="flex items-center justify-center mb-4">
            {getIcon()}
          </div>
          
          {alert.options.title && (
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {alert.options.title}
            </h3>
          )}

          {/* 메시지 */}
          <div className="text-center mb-6">
            <p className="text-gray-700 leading-relaxed">
              {alert.message}
            </p>
          </div>

          {/* Error 타입의 상세 정보 */}
          {alert.type === 'error' && alert.options.showDetails && alert.options.details && (
            <div className="mb-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
              >
                <svg 
                  className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                상세 정보 보기
              </button>
              {showDetails && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  {(alert.options.currentRetryCount ?? 0) > 0 && (
                    <div className="text-xs text-amber-600 mb-2 pb-2 border-b border-gray-200">
                      ⚠️ 재시도 횟수: {alert.options.currentRetryCount}/{alert.options.maxManualRetries || 2}
                      {alert.options.disableAutoRetry && " (자동 재시도 비활성화됨)"}
                    </div>
                  )}
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">
                    {alert.options.details}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Prompt 타입의 입력 필드 */}
          {alert.type === 'prompt' && (
            <div className="mb-4">
              {alert.options.multiline ? (
                <textarea
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setInputError('');
                  }}
                  placeholder={alert.options.placeholder}
                  maxLength={alert.options.maxLength}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B] resize-none ${
                    inputError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  rows={4}
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setInputError('');
                  }}
                  placeholder={alert.options.placeholder}
                  maxLength={alert.options.maxLength}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B] ${
                    inputError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  autoFocus
                />
              )}
              {inputError && (
                <p className="mt-1 text-sm text-red-600">{inputError}</p>
              )}
              {alert.options.maxLength && (
                <p className="mt-1 text-xs text-gray-500 text-right">
                  {inputValue.length} / {alert.options.maxLength}
                </p>
              )}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 justify-end">
            {/* 취소 버튼 */}
            {(alert.type === 'confirm' || alert.type === 'prompt') && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                {alert.options.cancelLabel || '취소'}
              </button>
            )}

            {/* 재시도 버튼 (Error 타입) */}
            {alert.type === 'error' && alert.options.showRetry && (
              <button
                onClick={handleRetry}
                className={`px-4 py-2 border rounded-lg transition-colors duration-200 ${
                  (alert.options.currentRetryCount ?? 0) >= (alert.options.maxManualRetries || 2)
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                    : 'border-blue-300 text-[#E85A6B] hover:bg-[#FFF1F2] hover:border-blue-400'
                }`}
                disabled={(alert.options.currentRetryCount ?? 0) >= (alert.options.maxManualRetries || 2)}
              >
                {alert.options.retryLabel || '다시 시도'}
              </button>
            )}

            {/* 확인 버튼 */}
            <button
              ref={firstFocusableRef}
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${variantClasses.confirmButton}`}
            >
              {alert.options.confirmLabel || '확인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}