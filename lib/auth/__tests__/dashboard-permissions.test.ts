import { describe, it, expect } from 'vitest';
import {
  Actor,
  buildDashboardLink,
  canCreateDashboards,
  computeCapabilities,
  isApiPathAllowedForShared,
  isValidEmail,
  mergeSharedQueryConfig,
  seesAllDashboards,
  validateShareDelete,
  validateShareUpsert,
} from '../dashboard-permissions';

const actor = (role: string, extra: Partial<Actor> = {}): Actor => ({
  id: `id-${role}`,
  email: `${role}@ejemplo.cl`,
  role,
  isApiToken: false,
  ...extra,
});

describe('computeCapabilities', () => {
  it('superadmin tiene todo aunque no tenga share', () => {
    const c = computeCapabilities(actor('superadmin'), null);
    expect(c).toMatchObject({ canView: true, canEdit: true, canDelete: true, canShare: true, canManageShares: true });
    expect(c.grantableRoles).toEqual(['lector', 'colaborador', 'propietario']);
  });

  it('member sigue como antes: ve, edita y borra todo, pero no comparte sin share', () => {
    const c = computeCapabilities(actor('member'), null);
    expect(c).toMatchObject({ canView: true, canEdit: true, canDelete: true, canShare: false, effectiveRole: 'miembro' });
  });

  it('member con share de propietario administra accesos', () => {
    const c = computeCapabilities(actor('member'), 'propietario');
    expect(c.canManageShares).toBe(true);
    expect(c.effectiveRole).toBe('propietario');
  });

  it('token API: como antes (ve y edita) y nunca comparte', () => {
    const c = computeCapabilities(actor('api_token', { isApiToken: true }), 'propietario');
    expect(c).toMatchObject({ canView: true, canEdit: true, canShare: false, canManageShares: false });
  });

  it('invitado sin share no ve nada', () => {
    expect(computeCapabilities(actor('shared'), null).canView).toBe(false);
  });

  it('invitado lector: solo ve', () => {
    const c = computeCapabilities(actor('shared'), 'lector');
    expect(c).toMatchObject({ canView: true, canEdit: false, canDelete: false, canShare: false });
  });

  it('invitado colaborador: ve y comparte solo como lector', () => {
    const c = computeCapabilities(actor('shared'), 'colaborador');
    expect(c).toMatchObject({ canView: true, canEdit: false, canShare: true, canManageShares: false });
    expect(c.grantableRoles).toEqual(['lector']);
  });

  it('invitado propietario: edita y administra, pero no borra el dashboard', () => {
    const c = computeCapabilities(actor('shared'), 'propietario');
    expect(c).toMatchObject({ canView: true, canEdit: true, canDelete: false, canManageShares: true });
  });

  it('pending no tiene acceso', () => {
    expect(computeCapabilities(actor('pending'), 'propietario').canView).toBe(false);
  });

  it('seesAllDashboards / canCreateDashboards', () => {
    expect(seesAllDashboards(actor('member'))).toBe(true);
    expect(seesAllDashboards(actor('shared'))).toBe(false);
    expect(canCreateDashboards(actor('shared'))).toBe(false);
    expect(canCreateDashboards(actor('x', { isApiToken: true }))).toBe(true);
  });
});

describe('validateShareUpsert', () => {
  const owner = actor('shared');
  const ownerCaps = computeCapabilities(owner, 'propietario');
  const colab = actor('shared', { id: 'colab', email: 'colab@ejemplo.cl' });
  const colabCaps = computeCapabilities(colab, 'colaborador');
  const base = { existingRole: null, ownerCount: 1 } as const;

  it('propietario puede otorgar cualquier rol', () => {
    expect(validateShareUpsert({ ...base, actor: owner, caps: ownerCaps, targetEmail: 'a@b.cl', role: 'propietario' }).ok).toBe(true);
  });

  it('colaborador solo otorga lector', () => {
    expect(validateShareUpsert({ ...base, actor: colab, caps: colabCaps, targetEmail: 'a@b.cl', role: 'lector' }).ok).toBe(true);
    const r = validateShareUpsert({ ...base, actor: colab, caps: colabCaps, targetEmail: 'a@b.cl', role: 'colaborador' });
    expect(r).toMatchObject({ ok: false, status: 403 });
  });

  it('colaborador no degrada a otro colaborador', () => {
    const r = validateShareUpsert({ ...base, actor: colab, caps: colabCaps, targetEmail: 'x@b.cl', role: 'lector', existingRole: 'colaborador' });
    expect(r).toMatchObject({ ok: false, status: 403 });
  });

  it('lector no comparte', () => {
    const r = validateShareUpsert({ ...base, actor: owner, caps: computeCapabilities(owner, 'lector'), targetEmail: 'a@b.cl', role: 'lector' });
    expect(r).toMatchObject({ ok: false, status: 403 });
  });

  it('rechaza correo y rol no válidos', () => {
    expect(validateShareUpsert({ ...base, actor: owner, caps: ownerCaps, targetEmail: 'no-es-correo', role: 'lector' })).toMatchObject({ status: 400 });
    expect(validateShareUpsert({ ...base, actor: owner, caps: ownerCaps, targetEmail: 'a@b.cl', role: 'admin' })).toMatchObject({ status: 400 });
  });

  it('nadie cambia su propio acceso (salvo superadmin)', () => {
    const r = validateShareUpsert({ ...base, actor: owner, caps: ownerCaps, targetEmail: owner.email.toUpperCase(), role: 'lector', existingRole: 'propietario', ownerCount: 2 });
    expect(r).toMatchObject({ ok: false, error: 'SELF_CHANGE_FORBIDDEN' });
  });

  it('no se degrada al último propietario', () => {
    const sa = actor('superadmin');
    const r = validateShareUpsert({ actor: sa, caps: computeCapabilities(sa, null), targetEmail: 'p@b.cl', role: 'lector', existingRole: 'propietario', ownerCount: 1 });
    expect(r).toMatchObject({ ok: false, status: 409, error: 'LAST_OWNER' });
  });
});

describe('validateShareDelete', () => {
  const owner = actor('shared');
  const colab = actor('shared', { id: 'colab' });
  it('propietario quita cualquiera salvo el último propietario', () => {
    const caps = computeCapabilities(owner, 'propietario');
    expect(validateShareDelete({ actor: owner, caps, existing: { role: 'colaborador', createdBy: null }, ownerCount: 1 }).ok).toBe(true);
    expect(validateShareDelete({ actor: owner, caps, existing: { role: 'propietario', createdBy: null }, ownerCount: 1 })).toMatchObject({ status: 409 });
  });
  it('colaborador solo quita lectores que él otorgó', () => {
    const caps = computeCapabilities(colab, 'colaborador');
    expect(validateShareDelete({ actor: colab, caps, existing: { role: 'lector', createdBy: 'colab' }, ownerCount: 1 }).ok).toBe(true);
    expect(validateShareDelete({ actor: colab, caps, existing: { role: 'lector', createdBy: 'otro' }, ownerCount: 1 })).toMatchObject({ status: 403 });
  });
  it('404 si el correo no tiene acceso', () => {
    const caps = computeCapabilities(owner, 'propietario');
    expect(validateShareDelete({ actor: owner, caps, existing: null, ownerCount: 1 })).toMatchObject({ status: 404 });
  });
});

describe('isApiPathAllowedForShared', () => {
  it.each([
    ['/api/v1/auth/me', 'GET', true],
    ['/api/bi/dashboards', 'GET', true],
    ['/api/bi/dashboards', 'POST', false],
    ['/api/bi/dashboards/D003', 'GET', true],
    ['/api/bi/dashboards/D003/shares', 'POST', true],
    ['/api/bi/cards/abc', 'PATCH', true],
    ['/api/bi/query', 'POST', true],
    ['/api/bi/folders', 'POST', false],
    ['/api/bi/alerts/evaluate', 'POST', false],
    ['/api/database/tables', 'GET', false],
    ['/api/v1/tables/x/records', 'GET', false],
    ['/api/admin/users', 'GET', false],
    ['/api/v1/tokens', 'POST', false],
  ])('%s %s → %s', (path, method, expected) => {
    expect(isApiPathAllowedForShared(path, method)).toBe(expected);
  });
});

describe('mergeSharedQueryConfig', () => {
  const stored = { tableOrView: 'ventas', metrics: [{ aggregation: 'count' }], filters: [{ field: 'canal', operator: 'eq', value: 'ML' }], limit: 100 };

  it('conserva tabla, métricas y límite guardados aunque el cliente envíe otros', () => {
    const r = mergeSharedQueryConfig(stored, { tableOrView: 'users', metrics: [], limit: 999999, rawSql: 'select 1' });
    expect(r.tableOrView).toBe('ventas');
    expect(r.limit).toBe(100);
    expect(r.metrics).toEqual(stored.metrics);
    expect(r.rawSql).toBeUndefined();
  });

  it('suma filtros válidos y rango de fechas, sin duplicar los guardados', () => {
    const r = mergeSharedQueryConfig(stored, {
      filters: [stored.filters[0], { field: 'sku', operator: 'eq', value: 'A' }, { field: 'x', operator: 'DROP' }],
      dateRange: { field: 'fecha', preset: 'last_7_days' },
    });
    expect(r.filters).toHaveLength(2);
    expect(r.dateRange).toEqual({ field: 'fecha', preset: 'last_7_days', startDate: undefined, endDate: undefined });
  });
});

describe('utilidades', () => {
  it('isValidEmail', () => {
    expect(isValidEmail(' Dhayis27@Gmail.com ')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
  });
  it('buildDashboardLink', () => {
    expect(buildDashboardLink('https://fluxtable.yarken.cl/', 'D003')).toBe('https://fluxtable.yarken.cl/?dashboard=D003&tab=1');
  });
});
