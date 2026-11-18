/**
 * Configuración centralizada de Marca Blanca (White-Label)
 * Permite que FluxTable adapte su logo, nombre, organización, acento de color y lema
 * mediante variables de entorno o parámetros sin tocar código fuente.
 */

export interface BrandConfig {
  appName: string;
  appOrg: string;
  tagline: string;
  logoUrl?: string;
  brandColor: string;
  appUrl: string;
}

export const DEFAULT_BRAND: BrandConfig = {
  appName: 'FluxTable',
  appOrg: '',
  tagline: 'Plataforma de Datos & Business Intelligence',
  logoUrl: undefined,
  brandColor: '#1D5BD8',
  appUrl: '',
};

export function getBrandConfig(): BrandConfig {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || DEFAULT_BRAND.appName;
  const appOrg = process.env.NEXT_PUBLIC_APP_ORG || DEFAULT_BRAND.appOrg;
  const tagline = process.env.NEXT_PUBLIC_APP_TAGLINE || DEFAULT_BRAND.tagline;
  const logoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL || undefined;
  const brandColor = process.env.NEXT_PUBLIC_BRAND_COLOR || DEFAULT_BRAND.brandColor;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  return {
    appName,
    appOrg,
    tagline,
    logoUrl,
    brandColor,
    appUrl,
  };
}

export function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
}
