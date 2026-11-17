'use client';

import React, { useState } from 'react';
import { 
  X, Plus, Type, Hash, DollarSign, Calendar, List, Star, BarChart3, CheckSquare, Trash2
} from 'lucide-react';

interface NewFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (field: {
    name: string;
    type: string;
    options?: Record<string, any>;
    width?: number;
  }) => Promise<void>;
}

const FIELD_TYPES = [
  { id: 'text', label: 'Texto', icon: Type, desc: 'Texto corto o notas' },
  { id: 'number', label: 'Número', icon: Hash, desc: 'Entero o decimal' },
  { id: 'currency', label: 'Moneda', icon: DollarSign, desc: 'Valores monetarios ($ / US$)' },
  { id: 'date', label: 'Fecha', icon: Calendar, desc: 'Día, mes y año' },
  { id: 'select', label: 'Selección', icon: List, desc: 'Opciones de lista desplegable' },
  { id: 'rating', label: 'Calificación', icon: Star, desc: 'Estrellas de 1 a 5' },
  { id: 'progress', label: 'Progreso', icon: BarChart3, desc: 'Porcentaje de 0 a 100%' },
  { id: 'boolean', label: 'Checkbox', icon: CheckSquare, desc: 'Casilla Sí/No' },
];

export const NewFieldModal: React.FC<NewFieldModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [selectOptions, setSelectOptions] = useState<Array<{ id: string; value: string; color: string }>>([
    { id: 'opt_1', value: 'Pendiente', color: 'yellow' },
    { id: 'opt_2', value: 'Completado', color: 'green' },
  ]);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (!newOptionValue.trim()) return;
    const colors = ['blue', 'green', 'yellow', 'orange', 'red', 'purple'];
    const randomColor = colors[selectOptions.length % colors.length];
    setSelectOptions([
      ...selectOptions,
      {
        id: `opt_${Date.now()}`,
        value: newOptionValue.trim(),
        color: randomColor,
      },
    ]);
    setNewOptionValue('');
  };

  const handleRemoveOption = (id: string) => {
    setSelectOptions(selectOptions.filter((o) => o.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del campo es requerido');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let options: Record<string, any> = {};
      let width = 160;

      if (type === 'currency') {
        options = {
          currencySymbol,
          precision: currencySymbol === 'US$' ? 2 : 0,
          thousandsSeparator: currencySymbol === 'US$' ? ',' : '.',
          decimalSeparator: currencySymbol === 'US$' ? '.' : ',',
        };
        width = 150;
      } else if (type === 'select') {
        options = { options: selectOptions };
        width = 170;
      } else if (type === 'date') {
        options = { dateFormat: 'DD/MM/YYYY' };
        width = 150;
      }

      await onCreate({
        name: name.trim(),
        type,
        options,
        width,
      });

      setName('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al agregar el campo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-field-title"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 id="new-field-title" className="font-bold text-sm text-slate-900 dark:text-white">
                Agregar Nueva Columna
              </h2>
              <p className="text-[11px] text-slate-500">
                Define el tipo de dato y formato para la columna
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la Columna <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ej: Proveedor, Comentarios, Fecha Emisión"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Selector de Tipo */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Dato
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FIELD_TYPES.map(({ id, label, icon: Icon, desc }) => {
                const isSelected = type === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setType(id)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">{label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opciones Específicas por Tipo */}
          {type === 'currency' && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Símbolo de Moneda
              </label>
              <div className="flex gap-2">
                {['$', 'US$', '€', 'UF'].map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setCurrencySymbol(sym)}
                    className={`px-3 py-1 rounded border text-xs font-mono font-bold ${
                      currencySymbol === sym
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'select' && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Opciones del Selector
              </label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {selectOptions.map((opt) => (
                  <div key={opt.id} className="flex items-center justify-between px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                    <span className="font-medium text-xs">{opt.value}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(opt.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Nueva opción..."
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  className="flex-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-medium text-xs"
                >
                  Agregar
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Agregar Columna'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
