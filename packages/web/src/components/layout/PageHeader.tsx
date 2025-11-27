import React from 'react';

interface ActionButton {
  icon: React.ReactNode;
  onClick: () => void;
  badge?: number;
  ariaLabel?: string;
}

export interface PageHeaderProps {
  // 필수
  title: string;

  // 뒤로가기
  onBack?: () => void;
  showBack?: boolean;

  // 닫기 버튼
  onClose?: () => void;
  showClose?: boolean;

  // 우측 액션 버튼들
  rightActions?: ActionButton[];

  // 스타일
  className?: string;
  sticky?: boolean;
  borderBottom?: boolean;

  // 고급 사용 (커스텀 레이아웃)
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  onBack,
  showBack = true,
  onClose,
  showClose = false,
  rightActions = [],
  className = '',
  sticky = true,
  borderBottom = true,
  children
}: PageHeaderProps) {
  return (
    <header
      className={`
        ${sticky ? 'sticky top-0 z-40' : ''}
        ${borderBottom ? 'border-b' : ''}
        bg-white px-4 py-3
        ${className}
      `.trim()}
    >
      {children ? (
        children
      ) : (
        <div className="flex items-center justify-between">
          {/* 좌측: 뒤로가기 + 제목 */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showBack && onBack && (
              <button
                onClick={onBack}
                className="text-gray-600 hover:bg-gray-100 p-1 rounded transition-colors flex-shrink-0"
                aria-label="뒤로가기"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          </div>

          {/* 우측: 액션 버튼들 */}
          {(rightActions.length > 0 || showClose) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {rightActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="p-2 rounded hover:bg-gray-100 relative transition-colors"
                  aria-label={action.ariaLabel}
                >
                  {action.icon}
                  {action.badge !== undefined && action.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {action.badge > 99 ? '99+' : action.badge}
                    </span>
                  )}
                </button>
              ))}
              {showClose && onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-600 hover:bg-gray-100 p-1 rounded transition-colors"
                  aria-label="닫기"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
