import { ReactNode } from 'react';
import { ProgressBar } from './ProgressBar';

interface StepLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showProgress?: boolean;
  showBackButton?: boolean;
  className?: string;
}

export function StepLayout({
  children,
  currentStep,
  totalSteps,
  onBack,
  showProgress = true,
  showBackButton = true,
  className = '',
}: StepLayoutProps) {
  return (
    <div className={`h-full min-h-screen bg-white flex flex-col mx-auto max-w-md overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0">
        {/* Back button */}
        {showBackButton && onBack && (
          <div className="flex items-center h-14 px-4">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="뒤로가기"
            >
              <svg
                className="w-6 h-6 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Progress bar */}
        {showProgress && (
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 pt-4 pb-6">
        {children}
      </div>
    </div>
  );
}
