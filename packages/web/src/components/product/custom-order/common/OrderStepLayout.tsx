import { ReactNode } from 'react';
import { FaArrowLeft } from 'react-icons/fa';

interface OrderStepLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  showProgress?: boolean;
  showBackButton?: boolean;
  className?: string;
}

export function OrderStepLayout({
  children,
  currentStep,
  totalSteps,
  onBack,
  title,
  subtitle,
  showProgress = true,
  showBackButton = true,
  className = '',
}: OrderStepLayoutProps) {
  return (
    <div className={`min-h-screen bg-white flex flex-col ${className}`}>
      {/* Header */}
      <header className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-2xl mx-auto">
          {/* Back button & Title */}
          <div className="px-4 py-3 flex items-center gap-3">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="뒤로가기"
              >
                <FaArrowLeft className="w-5 h-5 text-gray-800" />
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-900">커스텀 주문서</h1>
          </div>

          {/* Progress bar */}
          {showProgress && (
            <div className="flex gap-1.5 px-4 pb-3">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    index < currentStep ? 'bg-black' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {/* Title & Subtitle */}
        {(title || subtitle) && (
          <div className="px-5 pt-6 pb-4">
            {title && (
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            )}
            {subtitle && (
              <p className="text-gray-500">{subtitle}</p>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col px-5">
          {children}
        </div>
      </div>
    </div>
  );
}
