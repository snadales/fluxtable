import React from 'react';
import { getColorToken } from '@/lib/colors';

interface BadgeProps {
  label: string;
  colorId?: string;
  className?: string;
  onRemove?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({ label, colorId, className = '', onRemove }) => {
  const token = getColorToken(colorId);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${className}`}
      style={{
        backgroundColor: token.bgLight,
        color: token.textLight,
        borderColor: token.borderLight,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: token.hexAccent }}
      />
      <span className="truncate max-w-[140px]">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-75 focus:outline-none ml-0.5"
        >
          ×
        </button>
      )}
    </span>
  );
};
