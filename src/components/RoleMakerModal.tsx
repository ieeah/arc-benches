import { useMemo } from 'react';
import { Dice5, Trophy, Crosshair, Shield, Users, RefreshCw, Trash2 } from 'lucide-react';
import { Drawer } from './Drawer';
import { useAppStore } from '../store';
import { personalities } from '../store/personalitySlice';
import type { PersonalityProfile } from '../types';

const pvpLabels = [
  '0 — Pacifico / Legittima difesa',
  '1 — Opportunista / Rat',
  '2 — Ostile KOS (Kill On Sight)',
];

const pveLabels = [
  '0 — Furtivo / Evitante',
  '1 — Cacciatore calcolato',
  '2 — Massimalista Chad',
];

const socialLabels = [
  '0 — Fantasma',
  '1 — Guardingo',
  '2 — Samaritano',
];

export function RoleMakerModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const activePersonalityId = useAppStore(s => s.activePersonalityId);
  const rollPersonality = useAppStore(s => s.rollPersonality);
  const clearPersonality = useAppStore(s => s.clearPersonality);

  const active: PersonalityProfile | null = useMemo(() => {
    if (!activePersonalityId) return null;
    return personalities.find(p => p.id === activePersonalityId) ?? null;
  }, [activePersonalityId]);

  if (!isOpen) return null;

  return (
    <Drawer from="bottom" onClose={onClose} title="🎲 Role Maker — Ruolo Comportamentale">
      <div className="space-y-4 p-1 pb-6 text-slate-800 dark:text-slate-100 max-h-[75vh] overflow-y-auto pr-1">
        {!active ? (
          <div className="text-center py-8 px-4 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Dice5 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Nessun ruolo attivo</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Tira il dado prima della tua spedizione in superficie per scoprire l'archetipo e la filosofia di gioco da interpretare!
              </p>
            </div>
            <button
              onClick={() => rollPersonality()}
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <Dice5 className="w-5 h-5" />
              Tira il Dado della Sorte
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header Archetipo */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {active.name}
                </h3>
              </div>
              <p className="text-sm italic text-blue-600 dark:text-blue-400 font-medium">
                "{active.tagline}"
              </p>
            </div>

            {/* Matrice a 3 Assi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs">
                <div className="font-semibold flex items-center gap-1 mb-0.5">
                  <Crosshair className="w-3.5 h-3.5 text-red-500" /> PvP
                </div>
                <div>{pvpLabels[active.matrix.pvp] ?? active.matrix.pvp}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                <div className="font-semibold flex items-center gap-1 mb-0.5">
                  <Shield className="w-3.5 h-3.5 text-amber-500" /> PvE
                </div>
                <div>{pveLabels[active.matrix.pve] ?? active.matrix.pve}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
                <div className="font-semibold flex items-center gap-1 mb-0.5">
                  <Users className="w-3.5 h-3.5 text-emerald-500" /> Social
                </div>
                <div>{socialLabels[active.matrix.social] ?? active.matrix.social}</div>
              </div>
            </div>

            {/* Biografia & Lore */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Biografia & Lore</h4>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                {active.biography}
              </p>
            </div>

            {/* Regole Comportamentali */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Regole Operative in Raid</h4>
              <ul className="space-y-1.5">
                {active.behavioral_rules.map((rule, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-2 text-slate-700 dark:text-slate-200">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Condizione di Vittoria */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1">
              <div className="text-xs font-bold flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Trophy className="w-4 h-4" /> Condizione di Vittoria
              </div>
              <p className="text-xs leading-normal font-medium">
                {active.winning_condition}
              </p>
            </div>

            {/* Loadout Consigliato */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 space-y-2 text-xs">
              <div className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Loadout & Tattica Consigliata
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div><span className="font-semibold text-slate-900 dark:text-white">Armi:</span> {active.recommended_loadout.weapons}</div>
                <div><span className="font-semibold text-slate-900 dark:text-white">Gadget:</span> {active.recommended_loadout.gadgets}</div>
              </div>
              <div className="text-slate-500 dark:text-slate-400 italic">
                {active.recommended_loadout.playstyle_note}
              </div>
            </div>

            {/* Pulsanti Azione */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => rollPersonality()}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Tira di Nuovo
              </button>
              <button
                onClick={() => clearPersonality()}
                className="py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-red-500/10 hover:text-red-500 active:scale-95 text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Rimuovi
              </button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
