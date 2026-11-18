import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getBrandConfig, getBaseUrl, DEFAULT_BRAND } from '../brand-config';

describe('Brand Config (White-Label)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('debe devolver valores por defecto cuando no hay variables de entorno', () => {
    delete process.env.NEXT_PUBLIC_APP_NAME;
    delete process.env.NEXT_PUBLIC_APP_ORG;
    delete process.env.NEXT_PUBLIC_APP_TAGLINE;
    delete process.env.NEXT_PUBLIC_APP_LOGO_URL;
    delete process.env.NEXT_PUBLIC_BRAND_COLOR;

    const brand = getBrandConfig();
    expect(brand.appName).toBe(DEFAULT_BRAND.appName);
    expect(brand.appOrg).toBe('');
    expect(brand.brandColor).toBe('#1D5BD8');
    expect(brand.logoUrl).toBeUndefined();
  });

  it('debe personalizar el nombre y la organización según variables de entorno', () => {
    process.env.NEXT_PUBLIC_APP_NAME = 'AcmeData';
    process.env.NEXT_PUBLIC_APP_ORG = 'Acme Corporation';
    process.env.NEXT_PUBLIC_BRAND_COLOR = '#10B981';
    process.env.NEXT_PUBLIC_APP_LOGO_URL = 'https://acme.com/logo.svg';

    const brand = getBrandConfig();
    expect(brand.appName).toBe('AcmeData');
    expect(brand.appOrg).toBe('Acme Corporation');
    expect(brand.brandColor).toBe('#10B981');
    expect(brand.logoUrl).toBe('https://acme.com/logo.svg');
  });

  it('debe calcular la URL base correctamente desde variables de entorno', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://data.example.com';
    expect(getBaseUrl()).toBe('https://data.example.com');
  });
});
