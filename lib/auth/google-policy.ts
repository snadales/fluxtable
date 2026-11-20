/**
 * Política de alta para el login con Google (capa 2).
 * - ADMIN_EMAIL (por defecto snadales@gmail.com) => superadmin
 * - ALLOWED_EMAILS (lista) o ALLOWED_EMAIL_DOMAINS (dominios) => alta con rol mínimo `pending`
 *   (sin acceso hasta que un administrador asigne rol)
 * - cualquier otro correo => no se crea usuario
 */
export type GoogleLoginDecision =
  | { allowed: true; role: 'superadmin' | 'pending' }
  | { allowed: false };

function list(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function decideGoogleLogin(email: string): GoogleLoginDecision {
  const e = email.trim().toLowerCase();
  const admin = (process.env.ADMIN_EMAIL || 'snadales@gmail.com').trim().toLowerCase();
  if (e === admin) return { allowed: true, role: 'superadmin' };

  if (list(process.env.ALLOWED_EMAILS).includes(e)) return { allowed: true, role: 'pending' };

  const domain = e.split('@')[1] || '';
  const domains = list(process.env.ALLOWED_EMAIL_DOMAINS).map((d) => d.replace(/^@/, ''));
  if (domain && domains.includes(domain)) return { allowed: true, role: 'pending' };

  return { allowed: false };
}
