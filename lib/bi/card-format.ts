/**
 * Reglas de formato de tarjetas BI (tablas y gráficos), puras y testeables.
 * Todas las opciones nuevas viven en visual_config_json y son opt-in,
 * salvo el `$` en columnas cuyo encabezado contiene «($ CLP)».
 */

export interface TableFormatConfig {
  valueFormat?: string;
  moneyColumns?: string[];
  intColumns?: string[];
  wrapText?: boolean;
  wrapColumns?: string[];
}

const norm = (s: string) => s.toLowerCase().replace(/_/g, ' ').trim();

/** Columnas que por nombre son conteos (nunca llevan `$`). */
const COUNT_NAME = /^(n |nro|num|cant|cantidad|ordenes|órdenes|unidades|stock|count|qty|dias|días|items|lineas|líneas)|\b(ordenes|órdenes|unidades|cantidad|conteo|cant|dias|días)$/;

export function isMoneyColumn(
  col: string,
  cfg: TableFormatConfig | undefined,
  metricAliases: string[] = [],
): boolean {
  const c = norm(col);
  if ((cfg?.intColumns || []).some((x) => norm(x) === c)) return false;
  if ((cfg?.moneyColumns || []).some((x) => norm(x) === c)) return true;
  if (/\$\s*clp/.test(c)) return true; // encabezado «($ CLP)»
  if (cfg?.valueFormat === 'clp' && metricAliases.includes(col) && !COUNT_NAME.test(c)) return true;
  return false;
}

/** Texto es-CL de un monto: `$1.234.567`; negativos `-$1.234`. */
export function formatClpCell(value: unknown): string {
  const n = Math.round(Number(value));
  const txt = Math.abs(n).toLocaleString('es-CL');
  return `${n < 0 ? '-' : ''}$${txt}`;
}

export function isNumericValue(v: unknown): boolean {
  return v !== null && v !== undefined && v !== '' && !isNaN(Number(v));
}

/** ¿Envolver el texto de esta columna? (`wrapText: true` = todas las de texto). */
export function shouldWrapColumn(col: string, cfg: TableFormatConfig | undefined): boolean {
  if (!cfg) return false;
  const c = norm(col);
  if ((cfg.wrapColumns || []).some((x) => norm(x) === c)) return true;
  return cfg.wrapText === true;
}

/**
 * Etiquetas de datos en gráficos. `showLabels` explícito manda; si no está,
 * `labelsMaxCategories` oculta las etiquetas cuando hay más categorías.
 * Sin ninguna opción: se muestran (comportamiento histórico).
 */
export function resolveShowLabels(
  cfg: { showLabels?: boolean; labelsMaxCategories?: number } | undefined,
  categoryCount: number,
): boolean {
  if (typeof cfg?.showLabels === 'boolean') return cfg.showLabels;
  const max = Number(cfg?.labelsMaxCategories);
  if (Number.isFinite(max) && max > 0 && categoryCount > max) return false;
  return true;
}
