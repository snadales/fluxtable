'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { DateRangeConfig } from '@/lib/bi/analytics/query-builder';

interface TimeRangePickerProps {
  value: DateRangeConfig;
  onChange: (range: DateRangeConfig) => void;
}

const PRESETS: Array<{ id: DateRangeConfig['preset']; label: string }> = [
  { id: 'today', label: 'Hoy' },
  { id: 'yesterday', label: 'Ayer' },
  { id: 'last_7_days', label: 'Últimos 7 días' },
  { id: 'last_30_days', label: 'Últimos 30 días' },
  { id: 'this_month', label: 'Este mes' },
  { id: 'last_month', label: 'Mes anterior' },
  { id: 'this_year', label: 'Este año (YTD)' },
  { id: 'custom', label: 'Personalizado...' },
];

export function TimeRangePicker({ value, onChange }: TimeRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.startDate || '');
  const [customEnd, setCustomEnd] = useState(value.endDate || '');

  const activePreset = PRESETS.find((p) => p.id === value.preset) || PRESETS[3];

  const handleSelectPreset = (preset: DateRangeConfig['preset']) => {
    if (preset === 'custom') {
      onChange({
        ...value,
        preset: 'custom',
        startDate: customStart,
        endDate: customEnd,
      });
    } else {
      onChange({
        ...value,
        preset,
        startDate: undefined,
        endDate: undefined,
      });
      setIsOpen(false);
    }
  };

  const applyCustomRange = () => {
    if (customStart && customEnd) {
      onChange({
        ...value,
        preset: 'custom',
        startDate: customStart,
        endDate: customEnd,
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 text-blue-600" />
        <span>{activePreset.label}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="space-y-1">
            {PRESETS.map((p) => {
              const isSelected = value.preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{p.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              );
            })}
          </div>

          {value.preset === 'custom' && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              <div>
                <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full text-xs px-2 py-1 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full text-xs px-2 py-1 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={applyCustomRange}
                disabled={!customStart || !customEnd}
                className="w-full mt-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Aplicar Rango
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
