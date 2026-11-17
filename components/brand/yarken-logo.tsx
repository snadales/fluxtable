import React from 'react';

interface YarkenLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  variant?: 'cobalto' | 'carbon' | 'tile';
}

export function YarkenSymbol({
  size = 28,
  variant = 'cobalto',
  className = '',
}: {
  size?: number;
  variant?: 'cobalto' | 'carbon' | 'tile';
  className?: string;
}) {
  if (variant === 'tile') {
    return (
      <div
        className={`flex items-center justify-center rounded-[22%] bg-accent shadow-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 200 200"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: size * 0.75, height: size * 0.75, transform: 'translate(1px, 0px)' }}
        >
          <path d="M52 40 Q54.71 48.59 58.65 56.36" />
          <path d="M76.51 81.39 Q86.59 91.80 100 100" />
          <path d="M148 40 Q145.29 48.59 141.35 56.36" />
          <path d="M123.49 81.39 Q113.41 91.80 100 100" />
          <path d="M100 100 V166" />
          <circle cx="66" cy="70" r="15" />
          <circle cx="134" cy="70" r="15" />
        </svg>
      </div>
    );
  }

  const strokeColor = variant === 'cobalto' ? '#1D5BD8' : '#0F172A';

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke={strokeColor}
      strokeWidth="14"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ width: size, height: size }}
    >
      <path d="M52 40 Q54.71 48.59 58.65 56.36" />
      <path d="M76.51 81.39 Q86.59 91.80 100 100" />
      <path d="M148 40 Q145.29 48.59 141.35 56.36" />
      <path d="M123.49 81.39 Q113.41 91.80 100 100" />
      <path d="M100 100 V166" />
      <circle cx="66" cy="70" r="15" />
      <circle cx="134" cy="70" r="15" />
    </svg>
  );
}

export function FluxTableLogo({
  size = 28,
  showWordmark = true,
  className = '',
}: YarkenLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <YarkenSymbol size={size} variant="tile" />
      {showWordmark && (
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight text-ink">
            FluxTable
          </span>
          <div className="h-4 w-[1px] bg-line" />
          <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-ink-3">
            SISTEMA YARKEN
          </span>
        </div>
      )}
    </div>
  );
}
