import { describe, it, expect } from 'vitest';
import { evaluateFormula } from '../formula';
import { formatCurrency, formatDate } from '../formatters';

describe('E2E Transformation and Core Loop', () => {
  it('ejecuta el ciclo de vida completo de un registro: creación, cálculo, formateo y soft-delete', () => {
    // 1. Estructura de Registro
    const record = {
      id: 'rec_e2e_001',
      version: 1,
      deletedAt: null as Date | null,
      data: {
        fld_sku: 'PRD-X99',
        fld_fob: 120.50,
        fld_cantidad: 100,
        fld_arribo: '2026-12-01',
      },
    };

    const fieldMap = {
      'Precio FOB': 'fld_fob',
      'Cantidad': 'fld_cantidad',
      'SKU': 'fld_sku',
    };

    // 2. Cálculo de Fórmula Ligera
    const totalResult = evaluateFormula('{Precio FOB} * {Cantidad}', record.data, fieldMap);
    expect(totalResult.value).toBe(12050);
    expect(totalResult.error).toBeUndefined();

    // 3. Formateo de Moneda Localizada (es-CL vs USD)
    const formattedUsd = formatCurrency(totalResult.value, {
      currencySymbol: 'US$',
      precision: 2,
      thousandsSeparator: ',',
      decimalSeparator: '.',
    });
    expect(formattedUsd.formattedText).toBe('US$ 12,050.00');

    const clpEstimate = Number(totalResult.value) * 950;
    const formattedClp = formatCurrency(clpEstimate, {
      currencySymbol: '$',
      precision: 0,
      thousandsSeparator: '.',
      decimalSeparator: ',',
    });
    expect(formattedClp.formattedText).toBe('$ 11.447.500');

    // 4. Formateo de Fecha
    expect(formatDate(record.data.fld_arribo)).toBe('01/12/2026');

    // 5. Mutación con Control de Versión Optimista
    const updatedRecord = {
      ...record,
      version: record.version + 1,
      data: {
        ...record.data,
        fld_cantidad: 150,
      },
    };
    expect(updatedRecord.version).toBe(2);

    const newTotal = evaluateFormula('{Precio FOB} * {Cantidad}', updatedRecord.data, fieldMap);
    expect(newTotal.value).toBe(18075);

    // 6. Papelera (Soft-delete) y Restauración
    updatedRecord.deletedAt = new Date();
    expect(updatedRecord.deletedAt).not.toBeNull();

    // Restauración
    updatedRecord.deletedAt = null;
    expect(updatedRecord.deletedAt).toBeNull();
  });
});
