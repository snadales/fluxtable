import { describe, it, expect } from 'vitest';
import { getCellBadge } from '../cell-badges';

describe('getCellBadge', () => {
  it('estado: entregada verde, devuelta rojo, cancelada gris, otros ámbar', () => {
    expect(getCellBadge('estado', 'entregada')?.className).toContain('green');
    expect(getCellBadge('estado', 'devuelta')?.className).toContain('red');
    expect(getCellBadge('estado', 'cancelada')?.className).toContain('slate');
    expect(getCellBadge('estado', 'en curso')?.className).toContain('amber');
    expect(getCellBadge('estado_de_pago', 'SIN INFORMAR')?.className).toContain('amber');
    expect(getCellBadge('estado_de_pago', 'NO OK')?.className).toContain('red');
    expect(getCellBadge('estado_de_pago', 'OK')?.className).toContain('green');
  });
  it('reclamo Sí rojo y No neutro', () => {
    expect(getCellBadge('reclamo', 'Sí')?.className).toContain('red');
    expect(getCellBadge('reclamo', 'No')?.className).toContain('slate');
  });
  it('sociedad y canal con paleta fija, y texto + símbolo siempre', () => {
    expect(getCellBadge('sociedad', 'Navarino')?.className).toContain('blue');
    expect(getCellBadge('sociedad', 'Mixto')?.className).toContain('amber');
    expect(getCellBadge('sociedad', 'Bambú')?.className).toContain('green');
    expect(getCellBadge('canal', 'meli')?.className).toContain('sky');
    const b = getCellBadge('estado', 'entregada')!;
    expect(b.label).toBe('entregada');
    expect(b.icon).toBeTruthy();
  });
  it('columnas o valores sin mapeo no llevan insignia', () => {
    expect(getCellBadge('sku', 'ABC')).toBeNull();
    expect(getCellBadge('estado', null)).toBeNull();
    expect(getCellBadge('sociedad', 'Otra')).toBeNull();
  });
});
