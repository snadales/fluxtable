'use client';

import React, { useState, useMemo } from 'react';
import { RowData } from '@/components/grid/data-grid';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type CalendarScale = 'day' | 'week' | 'month' | 'year';

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
  const [scale, setScale] = useState<CalendarScale>('month');

  // Inicializar en la fecha actual o del primer registro disponible
  const initialDate = useMemo(() => {
    const validRow = rows.find(r => r.data[dateFieldId]);
    if (validRow && typeof validRow.data[dateFieldId] === 'string') {
      const parts = (validRow.data[dateFieldId] as string).split('-');
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) || 1);
      }
    }
    return new Date();
  }, [rows, dateFieldId]);

  const [currentDate, setCurrentDate] = useState<Date>(initialDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();

  // Navegación temporal según escala
  const handlePrev = () => {
    if (scale === 'day') {
      setCurrentDate(new Date(year, month, day - 1));
    } else if (scale === 'week') {
      setCurrentDate(new Date(year, month, day - 7));
    } else if (scale === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      setCurrentDate(new Date(year - 1, month, 1));
    }
  };

  const handleNext = () => {
    if (scale === 'day') {
      setCurrentDate(new Date(year, month, day + 1));
    } else if (scale === 'week') {
      setCurrentDate(new Date(year, month, day + 7));
    } else if (scale === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      setCurrentDate(new Date(year + 1, month, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
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

  // Cuadrícula de días para vista Mes
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const days: Array<{
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Días del mes previo
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

    // Días del mes siguiente para completar la cuadrícula (hasta múltiplos de 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
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

    return days;
  }, [year, month]);

  // Días de la semana actual para vista Semana
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay() === 0 ? 6 : curr.getDay() - 1; // 0 = Lun, 6 = Dom
    const monday = new Date(curr.setDate(curr.getDate() - dayOfWeek));

    const days: Array<{ dateString: string; dayNumber: number; weekdayName: string; isToday: boolean }> = [];
    const todayStr = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateString = d.toISOString().slice(0, 10);
      days.push({
        dateString,
        dayNumber: d.getDate(),
        weekdayName: WEEKDAYS[i],
        isToday: dateString === todayStr,
      });
    }
    return days;
  }, [currentDate]);

  const currentDateString = currentDate.toISOString().slice(0, 10);
  const dayRows = rowsByDate.get(currentDateString) || [];

  return (
    <div className="flex flex-col h-full bg-surface border border-line rounded-xl overflow-hidden shadow-2xs select-none">
      {/* 1. Header con Navegación y Selector Multiescala (Día, Semana, Mes, Año) */}
      <div className="h-14 border-b border-line px-4 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-surface">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface-sunken transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface-sunken transition-colors"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-line text-ink hover:bg-surface-sunken transition-colors"
          >
            Hoy
          </button>

          <h2 className="font-bold text-sm text-ink flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-accent" />
            <span>
              {scale === 'day' && `${day} de ${MONTH_NAMES[month]} ${year}`}
              {scale === 'week' && `Semana ${Math.ceil(day / 7)} · ${MONTH_NAMES[month]} ${year}`}
              {scale === 'month' && `${MONTH_NAMES[month]} ${year}`}
              {scale === 'year' && `Año ${year}`}
            </span>
          </h2>
        </div>

        {/* Selector Multiescala: Día / Semana / Mes / Año */}
        <div className="flex items-center gap-1 bg-surface-sunken p-1 rounded-xl border border-line text-xs font-medium">
          {(['day', 'week', 'month', 'year'] as CalendarScale[]).map((s) => {
            const labels: Record<CalendarScale, string> = {
              day: 'Día',
              week: 'Semana',
              month: 'Mes',
              year: 'Año',
            };
            const isActive = scale === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setScale(s)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  isActive
                    ? 'bg-surface text-accent font-bold shadow-2xs'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cuerpo del Calendario según Escala */}
      <div className="flex-1 overflow-auto p-3">
        {/* VISTA DÍA */}
        {scale === 'day' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="p-4 rounded-xl border border-line bg-surface-sunken/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-3">Eventos y Arribos para</span>
                <h3 className="font-bold text-base text-ink">{currentDateString}</h3>
              </div>
              <span className="text-xs font-mono font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                {dayRows.length} registros
              </span>
            </div>

            {dayRows.length > 0 ? (
              <div className="space-y-2">
                {dayRows.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onSelectRecord?.(r)}
                    className="p-3 rounded-xl border border-line bg-surface hover:border-accent hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-10 rounded-full bg-accent" />
                      <div>
                        <div className="font-bold text-xs text-ink">{r.data[titleFieldId] || 'Sin Título'}</div>
                        <div className="text-[11px] text-ink-3">Estado: {r.data['Estado Embarque'] || 'Sin estado'}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-ok">
                      ${Number(r.data['Inversión FOB'] || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-ink-3 text-xs italic">
                No hay arribos ni eventos programados para este día.
              </div>
            )}
          </div>
        )}

        {/* VISTA SEMANA */}
        {scale === 'week' && (
          <div className="grid grid-cols-7 gap-2 h-full min-h-[450px]">
            {weekDays.map((w) => {
              const items = rowsByDate.get(w.dateString) || [];
              return (
                <div
                  key={w.dateString}
                  className={`flex flex-col rounded-xl border p-2 bg-surface transition-all ${
                    w.isToday ? 'border-accent ring-1 ring-accent' : 'border-line'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-line mb-2">
                    <span className="text-xs font-semibold text-ink-2">{w.weekdayName}</span>
                    <span
                      className={`text-xs font-bold font-mono px-1.5 py-0.2 rounded-full ${
                        w.isToday ? 'bg-accent text-white' : 'text-ink-3'
                      }`}
                    >
                      {w.dayNumber}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1.5 overflow-y-auto">
                    {items.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => onSelectRecord?.(r)}
                        className="p-2 rounded-lg bg-surface-sunken border border-line hover:border-accent cursor-pointer transition-all text-xs"
                      >
                        <div className="font-bold text-ink truncate text-[11px]">
                          {r.data[titleFieldId]}
                        </div>
                        <div className="text-[10px] text-ink-3 truncate mt-0.5">
                          {r.data['Estado Embarque']}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VISTA MES (Tradicional) */}
        {scale === 'month' && (
          <div className="flex flex-col h-full min-h-[500px]">
            {/* Cabecera Días de la Semana */}
            <div className="grid grid-cols-7 border-b border-line pb-2 mb-1 text-center font-bold text-xs text-ink-3">
              {WEEKDAYS.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>

            {/* Cuadrícula de Días */}
            <div className="grid grid-cols-7 flex-1 gap-px bg-line border border-line rounded-xl overflow-hidden">
              {calendarDays.map((d) => {
                const dayItems = rowsByDate.get(d.dateString) || [];
                return (
                  <div
                    key={d.dateString}
                    onClick={() => {
                      if (d.isCurrentMonth) onAddRecord?.(d.dateString);
                    }}
                    className={`bg-surface p-2 flex flex-col justify-between min-h-[90px] transition-colors relative group ${
                      !d.isCurrentMonth ? 'bg-surface-sunken/40 text-ink-3 opacity-60' : 'text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded-full ${
                          d.isToday ? 'bg-accent text-white' : ''
                        }`}
                      >
                        {d.dayNumber}
                      </span>
                      {dayItems.length > 0 && (
                        <span className="text-[9px] font-mono text-ink-3 font-bold">
                          {dayItems.length}
                        </span>
                      )}
                    </div>

                    {/* Tarjetas dentro de la celda del mes */}
                    <div className="space-y-1 mt-1 overflow-y-auto max-h-20">
                      {dayItems.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRecord?.(r);
                          }}
                          className="px-1.5 py-1 rounded bg-accent/10 border border-accent/20 text-accent font-semibold text-[10px] truncate hover:bg-accent/20 cursor-pointer"
                        >
                          {r.data[titleFieldId]}
                        </div>
                      ))}
                      {dayItems.length > 3 && (
                        <div className="text-[9px] font-mono text-ink-3 italic">
                          +{dayItems.length - 3} más...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTA AÑO */}
        {scale === 'year' && (
          <div className="grid grid-cols-3 gap-4">
            {MONTH_NAMES.map((mName, mIdx) => {
              // Calcular eventos en este mes del año
              const countInMonth = rows.filter((r) => {
                const dateVal = r.data[dateFieldId];
                if (!dateVal || typeof dateVal !== 'string') return false;
                const parts = dateVal.split('-');
                return Number(parts[0]) === year && Number(parts[1]) - 1 === mIdx;
              }).length;

              return (
                <div
                  key={mName}
                  onClick={() => {
                    setCurrentDate(new Date(year, mIdx, 1));
                    setScale('month');
                  }}
                  className="p-4 rounded-xl border border-line bg-surface hover:border-accent hover:shadow-sm cursor-pointer transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-ink">{mName}</h4>
                    <span
                      className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                        countInMonth > 0
                          ? 'bg-accent/10 text-accent font-bold'
                          : 'bg-surface-sunken text-ink-3'
                      }`}
                    >
                      {countInMonth} arribos
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-sunken rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${Math.min(countInMonth * 15, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
