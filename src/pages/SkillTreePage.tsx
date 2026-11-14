import React, { useState } from 'react';
import { useTranslation } from '@/i18n';
import { useAppStore } from '@/store';
import { calculateSkillBudget } from '@/lib/skillTree';
import { SkillTreeCanvas } from '@/components/skills/SkillTreeCanvas';
import { SkillDetailSheet } from '@/components/skills/SkillDetailSheet';
import { RotateCcw, Settings2, Sparkles, SlidersHorizontal, AlertTriangle, X } from 'lucide-react';

export const SkillTreePage: React.FC = () => {
  const { language } = useTranslation();
  const lang = (language === 'it' ? 'it' : 'en') as 'it' | 'en';

  const skillAllocations = useAppStore((s) => s.skillAllocations);
  const raiderLevel = useAppStore((s) => s.raiderLevel);
  const earnedPermanentSkillPoints = useAppStore((s) => s.earnedPermanentSkillPoints);
  const useExpeditionBonus = useAppStore((s) => s.useExpeditionBonus);
  const sandboxMode = useAppStore((s) => s.sandboxMode);

  const setRaiderLevel = useAppStore((s) => s.setRaiderLevel);
  const setUseExpeditionBonus = useAppStore((s) => s.setUseExpeditionBonus);
  const setSandboxMode = useAppStore((s) => s.setSandboxMode);
  const resetSkillTree = useAppStore((s) => s.resetSkillTree);

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const budget = calculateSkillBudget(
    raiderLevel,
    earnedPermanentSkillPoints,
    useExpeditionBonus,
    sandboxMode,
    skillAllocations
  );

  const handleResetConfirm = () => {
    resetSkillTree();
    setSelectedSlotId(null);
    setShowResetConfirm(false);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50/50 dark:bg-black text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
        {/* Top Header & SP Budget Banner */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 backdrop-blur-md p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                ARC Raiders · Progression
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase">
              {lang === 'it' ? 'Albero delle Abilità' : 'Skill Tree'}
            </h1>
          </div>

          {/* SP Counter & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* SP Budget Badge */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 shadow-inner">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {sandboxMode
                    ? lang === 'it'
                      ? 'Modalità Sandbox'
                      : 'Sandbox Mode'
                    : lang === 'it'
                      ? 'Punti Abilità'
                      : 'Skill Points'}
                </span>
                <span className="font-mono text-xl font-extrabold text-amber-500 dark:text-amber-400">
                  {sandboxMode ? (
                    <span className="flex items-center gap-1">
                      <Sparkles size={16} /> ∞
                    </span>
                  ) : (
                    `${budget.remainingSP} / ${budget.totalAvailableSP}`
                  )}
                </span>
              </div>
              {!sandboxMode && (
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 border-l border-zinc-300 dark:border-zinc-700 pl-3 leading-tight">
                  <div>Lvl {raiderLevel}</div>
                  {useExpeditionBonus && earnedPermanentSkillPoints > 0 && (
                    <div className="text-emerald-500">+{earnedPermanentSkillPoints} Sped.</div>
                  )}
                </div>
              )}
            </div>

            {/* Config Button */}
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Configura punti e livello"
            >
              <SlidersHorizontal size={15} />
              <span>{lang === 'it' ? 'Build' : 'Build'}</span>
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              disabled={budget.totalSpentSP === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Ripristina albero"
            >
              <RotateCcw size={15} />
              <span>{lang === 'it' ? 'Ripristina' : 'Reset'}</span>
            </button>
          </div>
        </header>

        {/* Main Interactive Canvas Area */}
        <main className="w-full relative">
          <SkillTreeCanvas
            selectedSlotId={selectedSlotId}
            onSelectSlot={(slotId) => setSelectedSlotId(slotId)}
          />

          {/* Floating Detail Sheet */}
          <SkillDetailSheet
            selectedSlotId={selectedSlotId}
            onClose={() => setSelectedSlotId(null)}
          />
        </main>
      </div>

      {/* Build Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-zinc-500" />
                <h3 className="font-extrabold text-base uppercase tracking-tight">
                  {lang === 'it' ? 'Configura Budget Punti' : 'Configure Points Budget'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5 text-sm">
              {/* Raider Level Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-xs uppercase tracking-wide text-zinc-500">
                    {lang === 'it' ? 'Livello Raider (1 - 75)' : 'Raider Level (1 - 75)'}
                  </label>
                  <span className="font-mono font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {raiderLevel}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="75"
                  value={raiderLevel}
                  onChange={(e) => setRaiderLevel(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="text-[11px] text-zinc-500 mt-1">
                  {lang === 'it'
                    ? 'Ogni livello assegna 1 punto abilità base (fino a 75).'
                    : 'Each level grants 1 base skill point (up to 75).'}
                </div>
              </div>

              {/* Expedition Bonus Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                <div>
                  <div className="font-bold text-xs uppercase tracking-wide">
                    {lang === 'it' ? 'Bonus Spedizioni' : 'Expedition Bonus'}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {earnedPermanentSkillPoints > 0
                      ? lang === 'it'
                        ? `+${earnedPermanentSkillPoints} SP permanenti guadagnati`
                        : `+${earnedPermanentSkillPoints} permanent SP earned`
                      : lang === 'it'
                        ? 'Nessun punto guadagnato dal prestigio'
                        : 'No points earned from prestige'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useExpeditionBonus}
                  onChange={(e) => setUseExpeditionBonus(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Sandbox Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                <div>
                  <div className="font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 text-amber-500">
                    <Sparkles size={14} />
                    <span>{lang === 'it' ? 'Modalità Sandbox' : 'Sandbox Mode'}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {lang === 'it'
                      ? 'Punti infiniti per testare e simulare build liberamente.'
                      : 'Infinite points to freely test and simulate builds.'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={sandboxMode}
                  onChange={(e) => setSandboxMode(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="w-full mt-6 py-2.5 rounded-xl font-bold text-xs text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-black dark:hover:bg-white transition-colors"
            >
              {lang === 'it' ? 'Chiudi' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-extrabold text-base uppercase tracking-tight mb-1">
              {lang === 'it' ? 'Ripristinare lo Skill Tree?' : 'Reset Skill Tree?'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
              {lang === 'it'
                ? 'Tutti i punti abilità spesi verranno azzerati e restituiti al budget.'
                : 'All spent skill points will be reset and returned to your budget.'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
              >
                {lang === 'it' ? 'Annulla' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                {lang === 'it' ? 'Ripristina' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
