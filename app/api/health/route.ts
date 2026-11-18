import { GET as getSalud } from '@/app/api/v1/salud/route';

/**
 * Alias de compatibilidad hacia /api/v1/salud (Estándar Yarken OBS-05 / API-08)
 */
export async function GET() {
  return getSalud();
}
