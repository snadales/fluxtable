/**
 * Permisos por dashboard (#54). Funciones puras, sin BD: se prueban de forma aislada y las usan
 * los Route Handlers (vía `dashboard-access.ts`), el middleware y la UI.
 *
 * Roles por dashboard (tabla `dashboard_shares`):
 * - lector       → ve, filtra e imprime; no edita.
 * - colaborador  → lo anterior + comparte con otros, solo como lector.
 * - propietario  → edita el dashboard y administra todos sus accesos.
 *
 * Roles globales (users.role):
 * - superadmin   → todo en todos los dashboards.
 * - member       → como antes de #54: ve y edita todos los dashboards. Administra accesos solo si
 *                  además tiene share de colaborador/propietario en ese dashboard.
 * - api_token    → como antes de #54 (ve y edita); nunca administra accesos.
 * - shared       → «lector de compartidos»: solo los dashboards compartidos con su correo.
 * - pending      → sin acceso.
 */

export const SHARE_ROLES = ['lector', 'colaborador', 'propietario'] as const;
export type ShareRole = (typeof SHARE_ROLES)[number];

export const SHARED_GLOBAL_ROLE = 'shared';

export const SHARE_ROLE_LABELS: Record<ShareRole, string> = {
  lector: 'Lector',
  colaborador: 'Colaborador',
  propietario: 'Propietario',
};

export interface Actor {
  id: string;
  email: string;
  role: string;
  isApiToken: boolean;
}

export interface DashboardCapabilities {
  /** Rol efectivo para mostrar en la UI. */
  effectiveRole: 'superadmin' | 'miembro' | 'token' | ShareRole | 'ninguno';
  shareRole: ShareRole | null;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** Puede abrir el diálogo «Compartir» y ver la lista de accesos. */
  canShare: boolean;
  /** Puede otorgar cualquier rol y quitar cualquier acceso (propietario o superadmin). */
  canManageShares: boolean;
  grantableRoles: ShareRole[];
}

const NONE: DashboardCapabilities = {
  effectiveRole: 'ninguno',
  shareRole: null,
  canView: false,
  canEdit: false,
  canDelete: false,
  canShare: false,
  canManageShares: false,
  grantableRoles: [],
};

export function isShareRole(value: unknown): value is ShareRole {
  return typeof value === 'string' && (SHARE_ROLES as readonly string[]).includes(value);
}

export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

/** Validación simple y estricta (una @, dominio con punto, sin espacios). */
export function isValidEmail(email: string): boolean {
  const e = normalizeEmail(email);
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function shareCaps(shareRole: ShareRole | null) {
  return {
    canShare: shareRole === 'colaborador' || shareRole === 'propietario',
    canManageShares: shareRole === 'propietario',
    grantableRoles: (shareRole === 'propietario'
      ? [...SHARE_ROLES]
      : shareRole === 'colaborador'
        ? ['lector']
        : []) as ShareRole[],
  };
}

/** Capacidades de un actor sobre un dashboard concreto, dado su share (si lo tiene). */
export function computeCapabilities(actor: Actor, shareRole: ShareRole | null): DashboardCapabilities {
  if (actor.isApiToken || actor.role === 'api_token') {
    return {
      ...NONE,
      effectiveRole: 'token',
      canView: true,
      canEdit: true,
      canDelete: true,
    };
  }

  switch (actor.role) {
    case 'superadmin':
      return {
        effectiveRole: 'superadmin',
        shareRole,
        canView: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
        canManageShares: true,
        grantableRoles: [...SHARE_ROLES],
      };
    case 'member':
      return {
        effectiveRole: shareRole && shareRole !== 'lector' ? shareRole : 'miembro',
        shareRole,
        canView: true,
        canEdit: true,
        canDelete: true,
        ...shareCaps(shareRole),
      };
    case SHARED_GLOBAL_ROLE:
      if (!shareRole) return NONE;
      return {
        effectiveRole: shareRole,
        shareRole,
        canView: true,
        canEdit: shareRole === 'propietario',
        // Un invitado nunca borra el dashboard (afecta a todos los demás accesos).
        canDelete: false,
        ...shareCaps(shareRole),
      };
    default:
      return NONE;
  }
}

/** true si el rol global ve todos los dashboards sin necesidad de share (comportamiento previo a #54). */
export function seesAllDashboards(actor: Pick<Actor, 'role' | 'isApiToken'>): boolean {
  return actor.isApiToken || ['superadmin', 'member', 'api_token'].includes(actor.role);
}

/** Puede crear dashboards y carpetas nuevos (los invitados no). */
export function canCreateDashboards(actor: Pick<Actor, 'role' | 'isApiToken'>): boolean {
  return seesAllDashboards(actor);
}

export type ShareCheck = { ok: true } | { ok: false; status: number; error: string; message: string };

const deny = (status: number, error: string, message: string): ShareCheck => ({ ok: false, status, error, message });

/**
 * Valida alta o cambio de rol de un acceso.
 * - el actor debe poder compartir y el rol pedido debe estar entre los que puede otorgar;
 * - nadie (salvo superadmin) cambia su propio acceso (no auto-escalar);
 * - un colaborador no modifica accesos de colaborador/propietario;
 * - no se degrada al último propietario.
 */
export function validateShareUpsert(input: {
  actor: Actor;
  caps: DashboardCapabilities;
  targetEmail: string;
  role: unknown;
  existingRole: ShareRole | null;
  ownerCount: number;
}): ShareCheck {
  const { actor, caps, targetEmail, role, existingRole, ownerCount } = input;
  if (!caps.canShare) return deny(403, 'FORBIDDEN', 'No tienes permiso para compartir este dashboard');
  if (!isValidEmail(targetEmail)) return deny(400, 'VALIDATION_ERROR', 'Correo electrónico no válido');
  if (!isShareRole(role)) return deny(400, 'VALIDATION_ERROR', 'Rol no válido (lector, colaborador o propietario)');
  if (!caps.grantableRoles.includes(role)) {
    return deny(403, 'FORBIDDEN', `No puedes otorgar el rol ${SHARE_ROLE_LABELS[role].toLowerCase()}`);
  }
  if (normalizeEmail(targetEmail) === normalizeEmail(actor.email) && actor.role !== 'superadmin') {
    return deny(403, 'SELF_CHANGE_FORBIDDEN', 'No puedes cambiar tu propio acceso');
  }
  if (!caps.canManageShares && existingRole && existingRole !== 'lector') {
    return deny(403, 'FORBIDDEN', 'Solo un propietario puede cambiar el acceso de un colaborador o propietario');
  }
  if (existingRole === 'propietario' && role !== 'propietario' && ownerCount <= 1) {
    return deny(409, 'LAST_OWNER', 'El dashboard debe conservar al menos un propietario');
  }
  return { ok: true };
}

/**
 * Valida quitar un acceso.
 * - propietario/superadmin quitan cualquiera; un colaborador solo los de lector que él otorgó;
 * - nunca se quita al último propietario.
 */
export function validateShareDelete(input: {
  actor: Actor;
  caps: DashboardCapabilities;
  existing: { role: ShareRole; createdBy: string | null } | null;
  ownerCount: number;
}): ShareCheck {
  const { actor, caps, existing, ownerCount } = input;
  if (!caps.canShare) return deny(403, 'FORBIDDEN', 'No tienes permiso para administrar accesos de este dashboard');
  if (!existing) return deny(404, 'NOT_FOUND', 'Ese correo no tiene acceso a este dashboard');
  if (!caps.canManageShares && !(existing.role === 'lector' && existing.createdBy === actor.id)) {
    return deny(403, 'FORBIDDEN', 'Un colaborador solo puede quitar accesos de lector que haya otorgado');
  }
  if (existing.role === 'propietario' && ownerCount <= 1) {
    return deny(409, 'LAST_OWNER', 'No se puede quitar al último propietario');
  }
  return { ok: true };
}

/**
 * Lista blanca de rutas API para el rol global `shared` (se aplica en el middleware).
 * Cada ruta permitida además autoriza por dashboard en su Route Handler.
 */
export function isApiPathAllowedForShared(pathname: string, method: string): boolean {
  const p = pathname.replace(/\/+$/, '');
  const m = method.toUpperCase();
  if (p === '/api/v1/auth/me') return m === 'GET';
  if (p === '/api/bi/dashboards' || p === '/api/bi/folders') return m === 'GET';
  if (/^\/api\/bi\/dashboards\/[^/]+$/.test(p)) return true;
  if (/^\/api\/bi\/dashboards\/[^/]+\/shares$/.test(p)) return true;
  if (p === '/api/bi/cards' || /^\/api\/bi\/cards\/[^/]+$/.test(p)) return true;
  if (p === '/api/bi/query') return m === 'POST';
  return false;
}

/** Enlace directo para compartir: /?dashboard=<code>&tab=1 */
export function buildDashboardLink(origin: string, code: string, tab = 1): string {
  const base = origin.replace(/\/+$/, '');
  return `${base}/?dashboard=${encodeURIComponent(code)}&tab=${tab}`;
}

const FILTER_OPERATORS = ['eq', 'neq', 'in', 'nin', 'gt', 'gte', 'lt', 'lte', 'between', 'like'];
const DATE_PRESETS = [
  'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'this_year', 'last_year', 'custom',
];

/**
 * Consulta que se ejecuta para un invitado (#54): la de la tarjeta guardada, a la que el cliente solo
 * puede sumar rango de fechas y filtros (cruzados). Nunca cambia tabla, métricas, dimensiones ni límite.
 */
export function mergeSharedQueryConfig(
  stored: Record<string, any> | null | undefined,
  client: Record<string, any> | null | undefined
): Record<string, any> {
  const base = { ...(stored || {}) };
  const c = client || {};
  const storedFilters: any[] = Array.isArray(base.filters) ? base.filters : [];
  const extra: any[] = (Array.isArray(c.filters) ? c.filters : []).filter(
    (f: any) =>
      f && typeof f === 'object' && typeof f.field === 'string' && f.field.trim() !== '' &&
      FILTER_OPERATORS.includes(f.operator)
  );
  // Evita duplicar los filtros guardados que el cliente reenvía.
  const key = (f: any) => JSON.stringify([f.field, f.operator, f.value]);
  const seen = new Set(storedFilters.map(key));
  const filters = [...storedFilters, ...extra.filter((f) => !seen.has(key(f)))].map((f) => ({
    field: f.field,
    operator: f.operator,
    value: f.value,
  }));

  let dateRange = base.dateRange;
  const cd = c.dateRange;
  if (!dateRange && cd && typeof cd === 'object' && typeof cd.field === 'string' && cd.field.trim() !== '') {
    if (cd.preset === undefined || DATE_PRESETS.includes(cd.preset)) {
      dateRange = { field: cd.field, preset: cd.preset, startDate: cd.startDate, endDate: cd.endDate };
    }
  }
  return { ...base, filters, ...(dateRange ? { dateRange } : {}) };
}
