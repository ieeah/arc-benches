import React from 'react';
import { Calendar, X, Check, AlertCircle } from 'lucide-react';
import { formatTimeRemaining } from '@/lib/expiration';
import { useTranslation } from '@/i18n';

interface IsoDateTimeFieldProps {
  label: string;
  value?: string;
  onChange: (value?: string) => void;
  placeholder?: string;
  className?: string;
}

const toInputDateTime = (isoString?: string): string => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toIsoStringFromInput = (inputDateTime: string): string | undefined => {
  if (!inputDateTime) return undefined;
  const d = new Date(inputDateTime);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
};

const addDaysToNowIso = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setSeconds(0, 0);
  return d.toISOString();
};

export function IsoDateTimeField({
  label,
  value,
  onChange,
  placeholder = 'Es. 2026-09-08T00:00:00.000Z',
  className = '',
}: IsoDateTimeFieldProps) {
  const { language } = useTranslation();

  const parsedDate = value ? new Date(value) : null;
  const isValidDate = parsedDate !== null && !isNaN(parsedDate.getTime());

  const localTimeValue = isValidDate ? toInputDateTime(value) : '';

  const handleLocalPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      onChange(undefined);
    } else {
      const iso = toIsoStringFromInput(val);
      onChange(iso);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onChange(raw.trim() ? raw.trim() : undefined);
  };

  const remaining = isValidDate && value ? formatTimeRemaining(value, language) : null;

  return (
    <div className={`space-y-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/80 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Calendar size={13} className="text-purple-500" />
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[10px] text-rose-500 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <X size={11} /> Cancella
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* ISO string text input (Freehand manual entry) */}
        <div>
          <span className="text-[10px] font-mono text-gray-400 block mb-0.5">Stringa ISO 8601 (UTC / Offset)</span>
          <input
            type="text"
            placeholder={placeholder}
            value={value || ''}
            onChange={handleTextChange}
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Visual Datetime Picker Input */}
        <div>
          <span className="text-[10px] font-mono text-gray-400 block mb-0.5">Selettore Data/Ora Locale</span>
          <input
            type="datetime-local"
            value={localTimeValue}
            onChange={handleLocalPickerChange}
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">Preset:</span>
        <button
          type="button"
          onClick={() => onChange(new Date().toISOString())}
          className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-950/60 hover:text-purple-600 transition-colors cursor-pointer"
        >
          Ora
        </button>
        {[
          { label: '+1g', days: 1 },
          { label: '+3g', days: 3 },
          { label: '+7g', days: 7 },
          { label: '+14g', days: 14 },
          { label: '+30g', days: 30 },
        ].map(p => (
          <button
            key={p.days}
            type="button"
            onClick={() => onChange(addDaysToNowIso(p.days))}
            className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-950/60 hover:text-purple-600 transition-colors cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date validation / status preview */}
      {value ? (
        isValidDate ? (
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
            <Check size={13} className="shrink-0" />
            <div className="min-w-0 flex-1 flex flex-wrap items-center justify-between gap-1">
              <span>{parsedDate?.toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              {remaining && (
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/40">
                  {remaining.isExpired ? 'Scaduta' : `Tra ${remaining.text}`}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-900/50">
            <AlertCircle size={13} className="shrink-0" />
            <span>Formato ISO non valido. Usa es: <code>{new Date().toISOString()}</code></span>
          </div>
        )
      ) : (
        <p className="text-[10px] text-gray-400 italic">Nessuna data impostata.</p>
      )}
    </div>
  );
}
