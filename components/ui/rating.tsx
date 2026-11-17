import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  max?: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
}

export const Rating: React.FC<RatingProps> = ({
  value = 0,
  max = 5,
  onChange,
  readOnly = false,
}) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= value;

        return (
          <button
            key={starIndex}
            type="button"
            disabled={readOnly}
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly && onChange) {
                onChange(starIndex === value ? 0 : starIndex);
              }
            }}
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform focus:outline-none`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isFilled
                  ? 'fill-amber-400 text-amber-500'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
