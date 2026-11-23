import { describe, it, expect } from 'vitest';
import {
  isMoneyColumn, formatClpCell, shouldWrapColumn, resolveShowLabels, isNumericValue,
} from '../card-format';

describe('isMoneyColumn', () => {
  it('detecta encabezado «($ CLP)»', () => {
    expect(isMoneyColumn('venta_($_CLP)', undefined)).toBe(true);
    expect(isMoneyColumn('Venta ($ CLP)', {})).toBe(true);
  });
  it('sin opciones no marca columnas de métrica', () => {
    expect(isMoneyColumn('venta_bruta', {}, ['venta_bruta'])).toBe(false);
  });
  it('valueFormat clp marca métricas pero no conteos', () => {
    const cfg = { valueFormat: 'clp' };
    const m = ['venta_bruta', 'ordenes', 'cantidad'];
    expect(isMoneyColumn('venta_bruta', cfg, m)).toBe(true);
    expect(isMoneyColumn('ordenes', cfg, m)).toBe(false);
    expect(isMoneyColumn('cantidad', cfg, m)).toBe(false);
  });
  it('moneyColumns e intColumns explícitos; int gana', () => {
    expect(isMoneyColumn('monto', { moneyColumns: ['monto'] })).toBe(true);
    expect(isMoneyColumn('Venta ($ CLP)', { intColumns: ['venta ($ clp)'] })).toBe(false);
  });
});

describe('formatClpCell', () => {
  it('antepone $ con miles es-CL', () => {
    expect(formatClpCell(1234567.4)).toBe('$1.234.567');
    expect(formatClpCell('0')).toBe('$0');
    expect(formatClpCell(-1500)).toBe('-$1.500');
  });
  it('isNumericValue', () => {
    expect(isNumericValue('12')).toBe(true);
    expect(isNumericValue('')).toBe(false);
    expect(isNumericValue(null)).toBe(false);
    expect(isNumericValue('Total')).toBe(false);
  });
});

describe('shouldWrapColumn', () => {
  it('opt-in', () => {
    expect(shouldWrapColumn('observacion', undefined)).toBe(false);
    expect(shouldWrapColumn('observacion', {})).toBe(false);
    expect(shouldWrapColumn('Observación', { wrapColumns: ['observación'] })).toBe(true);
    expect(shouldWrapColumn('x', { wrapText: true })).toBe(true);
  });
});

describe('resolveShowLabels', () => {
  it('por defecto muestra', () => expect(resolveShowLabels(undefined, 100)).toBe(true));
  it('showLabels explícito manda', () => {
    expect(resolveShowLabels({ showLabels: false }, 3)).toBe(false);
    expect(resolveShowLabels({ showLabels: true, labelsMaxCategories: 5 }, 50)).toBe(true);
  });
  it('labelsMaxCategories oculta al superarse', () => {
    expect(resolveShowLabels({ labelsMaxCategories: 12 }, 12)).toBe(true);
    expect(resolveShowLabels({ labelsMaxCategories: 12 }, 13)).toBe(false);
  });
});
