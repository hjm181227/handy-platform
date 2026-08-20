import { ButtonHTMLAttributes, ReactNode } from 'react';

interface StepButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export function StepButton({
  children,
  loading = false,
  disabled = false,
  variant = 'primary',
  fullWidth = true,
  className = '',
  ...props
}: StepButtonProps) {
  const baseStyles = 'py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center';

  const variantStyles = {
    primary: `
      bg-brand text-white
      hover:bg-brand-600
      disabled:bg-gray-300 disabled:text-gray-500
    `,
    secondary: `
      bg-gray-100 text-gray-800
      hover:bg-gray-200
      disabled:bg-gray-100 disabled:text-gray-400
    `,
    outline: `
      bg-white text-brand border-2 border-brand
      hover:bg-brand-50
      disabled:border-gray-300 disabled:text-gray-400
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
