import React from 'react';
import { formatProgress } from '@/lib/formatters';

interface ProgressBarProps {
  value: number;
  className?: string;
  showText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  className = '',
  showText = true,
}) => {
  const { percent, colorClass } = formatProgress(value);

  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-300 rounded-full`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showText && (
        <span className="text-xs font-mono text-gray-500 w-8 text-right">
          {percent}%
        </span>
      )}
    </div>
  );
};
