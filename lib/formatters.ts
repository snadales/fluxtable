export interface CurrencyFormatOptions {
  currencySymbol?: string;
  precision?: number;
  thousandsSeparator?: '.' | ',' | ' ';
  decimalSeparator?: ',' | '.' | '';
  colorNegative?: boolean;
}

export function formatCurrency(
  value: number | string | null | undefined,
  options: CurrencyFormatOptions = {}
): { formattedText: string; isNegative: boolean } {
  if (value === null || value === undefined || value === '') {
    return { formattedText: '', isNegative: false };
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) {
    return { formattedText: String(value), isNegative: false };
  }

  const isNegative = num < 0;
  const absValue = Math.abs(num);
  const precision = options.precision ?? 0;
  const fixed = absValue.toFixed(precision);

  const [intPart, decPart] = fixed.split('.');
  const thousands = options.thousandsSeparator ?? '.';
  const decimal = options.decimalSeparator ?? ',';

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  const formattedNumber = precision > 0 && decPart 
    ? `${formattedInt}${decimal}${decPart}` 
    : formattedInt;

  const symbol = options.currencySymbol ?? '$';
  const formattedText = `${isNegative ? '-' : ''}${symbol} ${formattedNumber}`;

  return { formattedText, isNegative };
}

export function formatDate(
  isoDate: string | null | undefined,
  format: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY' = 'DD/MM/YYYY',
  includeTime: boolean = false,
  timeFormat: '24h' | '12h' = '24h'
): string {
  if (!isoDate) return '';

  // Si es fecha simple YYYY-MM-DD sin hora, procesar directamente sin desvío de zona horaria
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const [year, month, day] = isoDate.split('-');
    switch (format) {
      case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
      case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
      default: return `${day}/${month}/${year}`;
    }
  }

  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return String(isoDate);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());

  let datePart = '';
  switch (format) {
    case 'YYYY-MM-DD':
      datePart = `${year}-${month}-${day}`;
      break;
    case 'MM/DD/YYYY':
      datePart = `${month}/${day}/${year}`;
      break;
    case 'DD/MM/YYYY':
    default:
      datePart = `${day}/${month}/${year}`;
      break;
  }

  if (!includeTime) return datePart;

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  if (timeFormat === '12h') {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${datePart} ${hours}:${minutes} ${ampm}`;
  }
  return `${datePart} ${String(hours).padStart(2, '0')}:${minutes}`;
}

export function formatProgress(value: number | null | undefined): {
  percent: number;
  colorClass: string;
} {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return { percent: 0, colorClass: 'bg-gray-400' };
  }
  const percent = Math.min(100, Math.max(0, Number(value)));
  let colorClass = 'bg-blue-500';
  if (percent >= 80) colorClass = 'bg-emerald-500';
  else if (percent >= 40) colorClass = 'bg-amber-500';
  else colorClass = 'bg-rose-500';

  return { percent, colorClass };
}
