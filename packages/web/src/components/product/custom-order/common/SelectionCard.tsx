import { ReactNode } from 'react';
import { FaCheck } from 'react-icons/fa';

interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * 숨고/크몽 스타일 선택 카드 컴포넌트
 * 선택 시 테두리와 체크마크가 표시됨
 */
export function SelectionCard({
  selected,
  onClick,
  children,
  icon,
  disabled = false,
  className = '',
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full p-4 rounded-2xl border-2 text-left
        transition-all duration-200
        ${selected
          ? 'border-brand bg-brand-50'
          : 'border-line bg-white hover:border-line-strong hover:bg-surface'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* 선택 체크 표시 */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-brand rounded-full flex items-center justify-center">
          <FaCheck className="w-3 h-3 text-white" />
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex items-center gap-4">
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 bg-surface rounded-xl flex items-center justify-center text-2xl">
            {icon}
          </div>
        )}
        <div className="flex-1 pr-8">
          {children}
        </div>
      </div>
    </button>
  );
}

interface SelectionGridCardProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
}

/**
 * 그리드 레이아웃용 작은 선택 카드
 */
export function SelectionGridCard({
  selected,
  onClick,
  label,
  icon,
  description,
  disabled = false,
}: SelectionGridCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center justify-center p-4 rounded-xl border-2
        transition-all duration-200 min-h-[100px]
        ${selected
          ? 'border-ink bg-ink text-white'
          : 'border-line bg-white text-ink hover:border-line-strong'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon && (
        <div className={`text-2xl mb-2 ${selected ? 'text-white' : 'text-ink'}`}>
          {icon}
        </div>
      )}
      <span className="font-medium text-sm">{label}</span>
      {description && (
        <span className={`text-xs mt-1 ${selected ? 'text-gray-300' : 'text-muted'}`}>
          {description}
        </span>
      )}
    </button>
  );
}
