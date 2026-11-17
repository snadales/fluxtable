export interface ColorToken {
  id: string;
  name: string;
  bgLight: string;
  textLight: string;
  borderLight: string;
  bgDark: string;
  textDark: string;
  borderDark: string;
  hexAccent: string;
}

export const BASEROW_PALETTE: Record<string, ColorToken> = {
  blue: {
    id: 'blue',
    name: 'Azul',
    bgLight: '#E1EFFE',
    textLight: '#1A56DB',
    borderLight: '#A4CAFE',
    bgDark: 'rgba(26, 86, 219, 0.25)',
    textDark: '#93C5FD',
    borderDark: '#1E40AF',
    hexAccent: '#3B82F6',
  },
  green: {
    id: 'green',
    name: 'Verde',
    bgLight: '#EDFDF5',
    textLight: '#03543F',
    borderLight: '#A7F3D0',
    bgDark: 'rgba(5, 150, 105, 0.25)',
    textDark: '#6EE7B7',
    borderDark: '#065F46',
    hexAccent: '#10B981',
  },
  yellow: {
    id: 'yellow',
    name: 'Amarillo',
    bgLight: '#FEFCE8',
    textLight: '#854D0E',
    borderLight: '#FEF08A',
    bgDark: 'rgba(202, 138, 4, 0.25)',
    textDark: '#FDE047',
    borderDark: '#854D0E',
    hexAccent: '#EAB308',
  },
  orange: {
    id: 'orange',
    name: 'Naranja',
    bgLight: '#FFF7ED',
    textLight: '#9A3412',
    borderLight: '#FFEDD5',
    bgDark: 'rgba(234, 88, 12, 0.25)',
    textDark: '#FDBA74',
    borderDark: '#9A3412',
    hexAccent: '#F97316',
  },
  red: {
    id: 'red',
    name: 'Rojo',
    bgLight: '#FEF2F2',
    textLight: '#991B1B',
    borderLight: '#FECACA',
    bgDark: 'rgba(220, 38, 38, 0.25)',
    textDark: '#FCA5A5',
    borderDark: '#991B1B',
    hexAccent: '#EF4444',
  },
  purple: {
    id: 'purple',
    name: 'Morado',
    bgLight: '#F3E8FF',
    textLight: '#6B21A8',
    borderLight: '#E9D5FF',
    bgDark: 'rgba(147, 51, 234, 0.25)',
    textDark: '#D8B4FE',
    borderDark: '#6B21A8',
    hexAccent: '#A855F7',
  },
  pink: {
    id: 'pink',
    name: 'Rosa',
    bgLight: '#FDF2F8',
    textLight: '#9D174D',
    borderLight: '#FBCFE8',
    bgDark: 'rgba(219, 39, 119, 0.25)',
    textDark: '#F472B6',
    borderDark: '#9D174D',
    hexAccent: '#EC4899',
  },
  cyan: {
    id: 'cyan',
    name: 'Cian',
    bgLight: '#ECFEFF',
    textLight: '#155E75',
    borderLight: '#A5F3FC',
    bgDark: 'rgba(8, 145, 178, 0.25)',
    textDark: '#67E8F9',
    borderDark: '#155E75',
    hexAccent: '#06B6D4',
  },
  gray: {
    id: 'gray',
    name: 'Gris',
    bgLight: '#F3F4F6',
    textLight: '#374151',
    borderLight: '#E5E7EB',
    bgDark: 'rgba(75, 85, 99, 0.25)',
    textDark: '#D1D5DB',
    borderDark: '#4B5563',
    hexAccent: '#6B7280',
  },
};

export function getColorToken(colorId?: string): ColorToken {
  if (!colorId || !BASEROW_PALETTE[colorId]) {
    return BASEROW_PALETTE.gray;
  }
  return BASEROW_PALETTE[colorId];
}
