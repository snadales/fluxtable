/**
 * Insignias de color para celdas de tablas BI (estado, reclamo, sociedad, canal).
 * Cada insignia lleva un símbolo y el texto además del color (accesibilidad) y
 * clases con contraste suficiente en tema claro y oscuro.
 */
export interface CellBadge {
  label: string;
  icon: string;
  className: string;
}

type Tone = 'green' | 'red' | 'gray' | 'amber' | 'blue' | 'sky' | 'lime' | 'pink';

const TONE_CLASS: Record<Tone, string> = {
  green: 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700',
  red: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700',
  gray: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700/60 dark:text-slate-100 dark:border-slate-500',
  amber: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700',
  blue: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700',
  sky: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700',
  lime: 'bg-lime-100 text-lime-900 border-lime-300 dark:bg-lime-900/40 dark:text-lime-200 dark:border-lime-700',
  pink: 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700',
};
const ICON: Record<Tone, string> = { green: '✓', red: '✕', gray: '–', amber: '●', blue: '●', sky: '●', lime: '●', pink: '●' };

const ESTADO_COLS = ['estado', 'estado_d', 'estado_de_pago', 'estado_pago'];
const RECLAMO_COLS = ['reclamo', 'reclamo_d'];
const SOCIEDAD_COLS = ['sociedad', 'sociedad_d'];
const CANAL_COLS = ['canal', 'canal_d'];

function toneForEstado(v: string): Tone {
  const s = v.toLowerCase();
  if (s === 'entregada' || s === 'ok') return 'green';
  if (s.includes('devuelta') || s.includes('reclamo') || s === 'no ok') return 'red';
  if (s.includes('cancelada')) return 'gray';
  return 'amber'; // en curso, SIN INFORMAR y otros
}

export function getCellBadge(column: string, value: unknown): CellBadge | null {
  if (value === null || value === undefined || value === '' || value === '-') return null;
  const col = column.toLowerCase();
  const v = String(value);
  let tone: Tone | null = null;
  if (ESTADO_COLS.includes(col)) tone = toneForEstado(v);
  else if (RECLAMO_COLS.includes(col)) tone = v === 'Sí' || v.toLowerCase() === 'si' ? 'red' : 'gray';
  else if (SOCIEDAD_COLS.includes(col)) {
    tone = ({ Navarino: 'blue', Mixto: 'amber', 'Bambú': 'green', Total: 'gray' } as Record<string, Tone>)[v] ?? null;
  } else if (CANAL_COLS.includes(col)) {
    tone = ({ meli: 'sky', falabella: 'lime', paris: 'pink', walmart: 'gray', Total: 'gray' } as Record<string, Tone>)[v] ?? null;
  }
  if (!tone) return null;
  return { label: v, icon: ICON[tone], className: TONE_CLASS[tone] };
}
