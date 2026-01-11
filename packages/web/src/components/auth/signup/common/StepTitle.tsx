import { ReactNode } from 'react';

interface StepTitleProps {
  title: string;
  subtitle?: string | ReactNode;
}

export function StepTitle({ title, subtitle }: StepTitleProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900 leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-base text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
