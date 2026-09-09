import React from 'react';
import { Calendar, X, Check, AlertCircle } from 'lucide-react';
import { formatTimeRemaining } from '@/lib/expiration';
import { useTranslation } from '@/i18n';

interface IsoDateTimeFieldProps {
  label: string;
  value?: string;
  onChange: (value?: string) => void;
  className?: string;
}

/** Estrae la parte YYYY-MM-DD da una stringa ISO, senza considerare l'orario. */
const toDateInput = (isoString?: string): string => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

/** Converte una stringa YYYY-MM-DD in ISO alla mezzanotte UTC. */
const dateInputToIso = (dateStr: string): string | undefined => {
  if (!dateStr) return undefined;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
};

/** Restituisce la data odierna (UTC) come stringa YYYY-MM-DD. */
const todayDateStr = (): string => new Date().toISOString().split('T')[0];

/** Aggiunge `days` giorni alla data odierna e restituisce ISO a mezzanotte UTC. */
const addDaysIso = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

export function IsoDateTimeField({
  label,
  value,
  onChange,
  className = '',
}: IsoDateTimeFieldProps) {
  const { language } = useTranslation();

  const parsedDate = value ? new Date(value) : null;
  const isValidDate = parsedDate !== null && !isNaN(parsedDate.getTime());

  const dateInputValue = isValidDate ? toDateInput(value) : '';

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val ? dateInputToIso(val) : undefined);
  };

  const remaining = isValidDate && value ? formatTimeRemaining(value, language) : null;

  return (
    <div className={`space-y-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/80 ${className}`}>
      {/* Header: label + cancella */}
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

      {/* Preset "Scaduto" per progetti passati */}
      <button
        type="button"
        onClick={() => onChange(addDaysIso(-1))}
        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
      >
        Già scaduto (ieri)
      </button>

      {/* Date-only picker */}
      <input
        type="date"
        value={dateInputValue}
        onChange={handleDateChange}
        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
      />

      {/* Presets futuri */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">Preset:</span>
        <button
          type="button"
          onClick={() => onChange(dateInputToIso(todayDateStr()))}
          className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-950/60 hover:text-purple-600 transition-colors cursor-pointer"
        >
          Oggi
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
            onClick={() => onChange(addDaysIso(p.days))}
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
              <span>{parsedDate?.toLocaleDateString('it-IT', { dateStyle: 'long' })}</span>
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
            <span>Data non valida nel JSON. Usa il selettore per correggerla.</span>
          </div>
        )
      ) : (
        <p className="text-[10px] text-gray-400 italic">Nessuna data impostata.</p>
      )}
    </div>
  );
}
