import { ButtonHTMLAttributes, ReactNode } from 'react';

interface OrderStepButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export function OrderStepButton({
  children,
  loading = false,
  disabled = false,
  variant = 'primary',
  fullWidth = true,
  className = '',
  ...props
}: OrderStepButtonProps) {
  const baseStyles = 'py-4 px-6 rounded-full font-semibold text-base transition-all duration-200 flex items-center justify-center';

  const variantStyles = {
    primary: `
      bg-brand text-white
      hover:bg-brand-600
      disabled:opacity-40
    `,
    secondary: `
      bg-surface text-ink
      hover:bg-surface-strong
      disabled:bg-surface disabled:text-muted
    `,
    outline: `
      bg-white text-ink border-2 border-line
      hover:bg-surface
      disabled:border-line disabled:text-muted
    `,
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          처리 중...
        </>
      ) : (
        children
      )}
    </button>
  );
}
