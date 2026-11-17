'use client';

import React, { useState, useMemo } from 'react';
import { RowData } from '@/components/grid/data-grid';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CalendarViewProps {
  rows: RowData[];
  dateFieldId?: string;
  titleFieldId?: string;
  onSelectRecord?: (row: RowData) => void;
  onAddRecord?: (dateString: string) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  rows,
  dateFieldId = 'Fecha Estimada Arribo',
  titleFieldId = 'Código Contenedor',
  onSelectRecord,
  onAddRecord,
}) => {
  // Inicializar en el mes actual o en la fecha del primer registro disponible
  const initialDate = useMemo(() => {
    const validRow = rows.find(r => r.data[dateFieldId]);
    if (validRow && typeof validRow.data[dateFieldId] === 'string') {
      const parts = (validRow.data[dateFieldId] as string).split('-');
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      }
    }
    return new Date();
  }, [rows, dateFieldId]);

  const [currentDate, setCurrentDate] = useState<Date>(initialDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navegación
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Mapear filas por fecha (YYYY-MM-DD)
  const rowsByDate = useMemo(() => {
    const map = new Map<string, RowData[]>();
    for (const r of rows) {
      const rawDate = r.data[dateFieldId];
      if (!rawDate) continue;

      let key = '';
      if (typeof rawDate === 'string') {
        key = rawDate.slice(0, 10);
      } else if (rawDate instanceof Date) {
        key = rawDate.toISOString().slice(0, 10);
      }

      if (key) {
        const existing = map.get(key) || [];
        existing.push(r);
        map.set(key, existing);
      }
    }
    return map;
  }, [rows, dateFieldId]);

  // Generar cuadrícula de días para el mes
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Ajustar para que la semana empiece en Lunes (0 = Lun, 6 = Dom)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    // Días del mes anterior para rellenar
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const days: Array<{
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Rellenar días previos
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateString,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateString,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateString === todayStr,
      });
    }

    // Rellenar días del próximo mes hasta completar semanas (múltiplo de 7)
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let d = 1; d <= remainingDays; d++) {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        const dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({
          dateString,
          dayNumber: d,
          isCurrentMonth: false,
          isToday: dateString === todayStr,
        });
      }
    }

    return days;
  }, [year, month]);

  // Color de estado para badges
  const getStatusColor = (status: string | undefined): string => {
    switch (status) {
      case 'opt_bodega': return 'bg-emerald-500 text-white';
      case 'opt_aduana': return 'bg-amber-500 text-white';
      case 'opt_transito': return 'bg-blue-500 text-white';
      case 'opt_fabrica': return 'bg-yellow-500 text-slate-900';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header del Calendario */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {MONTH_NAMES[month]} {year}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            Campo: {dateFieldId}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            Hoy
          </button>
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Días de la Semana */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-center py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
        {WEEKDAYS.map((day) => (
          <div key={day} className="tracking-tight">
            {day}
          </div>
        ))}
      </div>

      {/* Cuadrícula de Días */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto bg-slate-200 dark:bg-slate-800 gap-[1px]">
        {calendarDays.map((day) => {
          const dayRows = rowsByDate.get(day.dateString) || [];
          return (
            <div
              key={day.dateString}
              className={`min-h-[105px] p-2 flex flex-col transition-colors ${
                day.isCurrentMonth
                  ? 'bg-white dark:bg-slate-900'
                  : 'bg-slate-50/70 dark:bg-slate-950/40 text-slate-400'
              } ${day.isToday ? 'ring-2 ring-blue-500/30 ring-inset' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-semibold font-mono inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    day.isToday
                      ? 'bg-blue-600 text-white shadow-sm'
                      : day.isCurrentMonth
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {onAddRecord && day.isCurrentMonth && (
                  <button
                    type="button"
                    onClick={() => onAddRecord(day.dateString)}
                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 rounded transition-opacity"
                    title={`Crear registro para el ${day.dateString}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Lista de Registros del Día */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-24">
                {dayRows.map((r) => {
                  const status = r.data['Estado Embarque'] as string | undefined;
                  const title = String(r.data[titleFieldId] || `Fila #${r.id}`);

                  return (
                    <div
                      key={r.id}
                      onClick={() => onSelectRecord && onSelectRecord(r)}
                      className="group cursor-pointer px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200/80 dark:border-slate-700/80 transition-all text-[11px] font-mono flex items-center justify-between shadow-2xs hover:border-blue-300 dark:hover:border-blue-600"
                    >
                      <span className="truncate font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {title}
                      </span>
                      {status && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ml-1.5 ${getStatusColor(status)}`}
                          title={`Estado: ${status}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
