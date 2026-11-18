'use client';

import React from 'react';
import { getBrandConfig } from '@/lib/brand-config';

interface BrandLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  variant?: 'cobalto' | 'carbon' | 'tile';
  customTitle?: string;
  customOrg?: string;
  customLogoUrl?: string;
}

/**
 * Isotipo / Símbolo adaptable
 * Si se especifica una URL de logo personalizada, se renderiza la imagen.
 * Si no, se renderiza el isotipo vectorial configurable con el color corporativo.
 */
export function BrandSymbol({
  size = 28,
  variant = 'cobalto',
  className = '',
  customLogoUrl,
}: {
  size?: number;
  variant?: 'cobalto' | 'carbon' | 'tile';
  className?: string;
  customLogoUrl?: string;
}) {
  const brand = getBrandConfig();
  const activeLogoUrl = customLogoUrl || brand.logoUrl;

  if (activeLogoUrl) {
    return (
      <img
        src={activeLogoUrl}
        alt={brand.appName}
        className={`shrink-0 object-contain rounded-md ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const primaryColor = brand.brandColor || '#1D5BD8';

  if (variant === 'tile') {
    return (
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 drop-shadow-2xs ${className}`}
        style={{ width: size, height: size }}
      >
        <rect width="200" height="200" rx="44" fill={primaryColor} />
        <g
          transform="translate(30, 26) scale(0.7)"
          stroke="#FFFFFF"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M52 40 Q54.71 48.59 58.65 56.36" />
          <path d="M76.51 81.39 Q86.59 91.80 100 100" />
          <path d="M148 40 Q145.29 48.59 141.35 56.36" />
          <path d="M123.49 81.39 Q113.41 91.80 100 100" />
          <path d="M100 100 V166" />
          <circle cx="66" cy="70" r="15" />
          <circle cx="134" cy="70" r="15" />
        </g>
      </svg>
    );
  }

  const strokeColor = variant === 'cobalto' ? primaryColor : '#0F172A';

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke={strokeColor}
      strokeWidth="14"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
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

/**
 * Logotipo adaptable completo (Isotipo + Nombre + Organización)
 */
export function BrandLogo({
  size = 26,
  showWordmark = true,
  className = '',
  customTitle,
  customOrg,
  customLogoUrl,
}: BrandLogoProps) {
  const brand = getBrandConfig();
  const title = customTitle || brand.appName;
  const org = customOrg !== undefined ? customOrg : brand.appOrg;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <BrandSymbol size={size} variant="tile" customLogoUrl={customLogoUrl} />
      {showWordmark && (
        <div className="flex items-center gap-2 leading-none">
          <span className="font-bold text-[17px] tracking-tight text-ink leading-none">
            {title}
          </span>
          {org && (
            <>
              <span className="h-3.5 w-px bg-line inline-block" />
              <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-ink-3 leading-none">
                {org}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Aliases retrocompatibles para evitar romper importaciones existentes
export const FluxTableLogo = BrandLogo;
export const YarkenSymbol = BrandSymbol;
