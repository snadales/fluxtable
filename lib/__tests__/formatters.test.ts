import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatProgress } from '../formatters';
import { getColorToken, BASEROW_PALETTE } from '../colors';

describe('Formatters & Visual Palettes', () => {
  describe('formatCurrency', () => {
    it('formatea moneda chilena (es-CL) sin decimales ($ 190.000)', () => {
      const res = formatCurrency(190000, {
        currencySymbol: '$',
        precision: 0,
        thousandsSeparator: '.',
        decimalSeparator: ',',
      });
      expect(res.formattedText).toBe('$ 190.000');
      expect(res.isNegative).toBe(false);
    });

    it('formatea moneda internacional con decimales ($ 1,250.50)', () => {
      const res = formatCurrency(1250.5, {
        currencySymbol: 'US$',
        precision: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
      });
      expect(res.formattedText).toBe('US$ 1,250.50');
      expect(res.isNegative).toBe(false);
    });

    it('detecta valores negativos y aplica prefijo menos', () => {
      const res = formatCurrency(-50000, {
        currencySymbol: '$',
        precision: 0,
      });
      expect(res.formattedText).toBe('-$ 50.000');
      expect(res.isNegative).toBe(true);
    });

    it('maneja valores nulos y vacíos elegantemente', () => {
      expect(formatCurrency(null).formattedText).toBe('');
      expect(formatCurrency(undefined).formattedText).toBe('');
      expect(formatCurrency('').formattedText).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formatea fechas en DD/MM/YYYY por defecto', () => {
      expect(formatDate('2026-11-28')).toBe('28/11/2026');
    });

    it('formatea fechas con formato YYYY-MM-DD', () => {
      expect(formatDate('2026-11-28', 'YYYY-MM-DD')).toBe('2026-11-28');
    });

    it('formatea fechas con hora incluida (24h)', () => {
      const formatted = formatDate('2026-11-28T15:30:00Z', 'DD/MM/YYYY', true, '24h');
      expect(formatted).toContain('28/11/2026');
    });
  });

  describe('formatProgress', () => {
    it('asigna color verde a progreso >= 80%', () => {
      const res = formatProgress(85);
      expect(res.percent).toBe(85);
      expect(res.colorClass).toBe('bg-emerald-500');
    });

    it('asigna color amarillo a progreso entre 40% y 79%', () => {
      const res = formatProgress(55);
      expect(res.percent).toBe(55);
      expect(res.colorClass).toBe('bg-amber-500');
    });

    it('asigna color rojo a progreso < 40%', () => {
      const res = formatProgress(25);
      expect(res.percent).toBe(25);
      expect(res.colorClass).toBe('bg-rose-500');
    });

    it('restringe valores a rango 0-100%', () => {
      expect(formatProgress(150).percent).toBe(100);
      expect(formatProgress(-20).percent).toBe(0);
    });
  });

  describe('Paleta de Colores de Baserow', () => {
    it('recupera tokens de color válidos con propiedades completas', () => {
      const blue = getColorToken('blue');
      expect(blue.id).toBe('blue');
      expect(blue.textLight).toBe('#1A56DB');
      expect(blue.bgLight).toBe('#E1EFFE');
      expect(blue.hexAccent).toBe('#3B82F6');
    });

    it('aplica fallback a gris ante color desconocido', () => {
      const fallback = getColorToken('color_inexistente');
      expect(fallback.id).toBe('gray');
    });
  });
});
