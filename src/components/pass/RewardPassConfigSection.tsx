import { useMemo, useState } from 'react';
import { Minus, Plus, Ticket } from 'lucide-react';
import type { PassList } from '@/types';
import { useAppStore } from '@/store';
import { useTranslation, getListName } from '@/i18n';
import { useFeatureFlags } from '@/lib/featureFlags';
import { isPassAvailable, isPassCompleted, resolveActivePass } from '@/lib/rewardPass';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { IconButton } from '@/components/IconButton';
import { cn } from '@/lib/cn';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Livello di partenza proposto per un pass: quello salvato, o `maxLevel - 1` se è completato. */
const startLevelFor = (pass: PassList, levels: Record<string, number>) =>
  clamp(levels[pass.id] ?? 0, 0, Math.max(0, pass.maxLevel - 1));

const Row = ({ selected, onSelect, title, hint }: { selected: boolean; onSelect: () => void; title: string; hint?: string }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={cn(
      'w-full flex items-center justify-between gap-3 p-3 rounded-2xl border text-left cursor-pointer transition-colors',
      selected
        ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/40'
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:border-purple-300',
    )}
  >
    <span className="min-w-0">
      <span className="block text-sm font-bold truncate">{title}</span>
      {hint && <span className="block text-[11px] text-gray-500 dark:text-gray-400">{hint}</span>}
    </span>
    <span className={cn('w-4 h-4 rounded-full border-2 shrink-0', selected ? 'border-purple-600 bg-purple-600' : 'border-gray-400')} />
  </button>
);

/** Modale di configurazione: pass attivo (o nessuno), livello di partenza e azzeramento dei progressi di un pass. */
const RewardPassConfigModal = ({ onClose }: { onClose: () => void }) => {
  const { t, language } = useTranslation();
  const allPasses = useAppStore((s) => s.passes);
  const levels = useAppStore((s) => s.currentLevels);
  const activeId = useAppStore((s) => s.activeRewardPass);
  const setActive = useAppStore((s) => s.setActiveRewardPass);
  const resetProgress = useAppStore((s) => s.resetRewardPassProgress);

  const passes = useMemo(() => allPasses.filter(isPassAvailable), [allPasses]);
  const [selectedId, setSelectedId] = useState<string | null>(() => resolveActivePass(passes, activeId, levels)?.id ?? null);
  const selected = passes.find((p) => p.id === selectedId) ?? null;
  const [level, setLevel] = useState(() => (selected ? startLevelFor(selected, levels) : 0));
  const [confirm, setConfirm] = useState<'reactivate' | 'reset' | null>(null);

  const select = (pass: PassList | null) => {
    setSelectedId(pass?.id ?? null);
    setLevel(pass ? startLevelFor(pass, levels) : 0);
  };

  const apply = () => {
    setActive(selected?.id ?? null, selected ? level : undefined);
    onClose();
  };

  const maxStart = selected ? Math.max(0, selected.maxLevel - 1) : 0;
  const levelHint = (pass: PassList) =>
    isPassCompleted(pass, levels)
      ? t('rewardPass.configCompleted')
      : t('rewardPass.levelProgress', { level: String(levels[pass.id] ?? 0), max: String(pass.maxLevel) });

  return (
    <BottomSheet
      title={t('rewardPass.configTitle')}
      onClose={onClose}
      footer={
        <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => (selected && isPassCompleted(selected, levels) ? setConfirm('reactivate') : apply())}
            className="w-full py-3 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-full cursor-pointer"
          >
            {t('rewardPass.configApply')}
          </button>
        </div>
      }
    >
      <div className="space-y-3 pb-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('rewardPass.configHint')}</p>
        {passes.length === 0 ? (
          <p className="text-xs text-center text-gray-400 py-4">{t('rewardPass.configEmpty')}</p>
        ) : (
          <div role="radiogroup" className="space-y-2">
            <Row selected={selected === null} onSelect={() => select(null)} title={t('rewardPass.configNone')} hint={t('rewardPass.configNoneHint')} />
            {passes.map((pass) => (
              <Row key={pass.id} selected={selected?.id === pass.id} onSelect={() => select(pass)} title={getListName(pass, language)} hint={levelHint(pass)} />
            ))}
          </div>
        )}

        {selected && (
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold">{t('rewardPass.configLevel')}</span>
              <div className="flex items-center gap-2">
                <IconButton onClick={() => setLevel((v) => clamp(v - 1, 0, maxStart))} title={t('rewardPass.decreaseTier')} disabled={level <= 0}>
                  <Minus size={14} />
                </IconButton>
                <span className="font-mono font-black w-16 text-center text-sm">{level}/{selected.maxLevel}</span>
                <IconButton onClick={() => setLevel((v) => clamp(v + 1, 0, maxStart))} title={t('rewardPass.increaseTier')} disabled={level >= maxStart}>
                  <Plus size={14} />
                </IconButton>
              </div>
            </div>
            {(level > 0 || isPassCompleted(selected, levels)) && (
              <button
                type="button"
                onClick={() => setConfirm('reset')}
                className="w-full py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 cursor-pointer"
              >
                {t('rewardPass.configResetProgress')}
              </button>
            )}
          </div>
        )}
      </div>

      {confirm === 'reactivate' && selected && (
        <ConfirmActionModal
          title={t('rewardPass.reactivateTitle')}
          message={t('rewardPass.reactivateMessage', { name: getListName(selected, language) })}
          description={t('rewardPass.reactivateDescription', { level: String(level) })}
          confirmText={t('rewardPass.setActive')}
          variant="primary"
          onConfirm={apply}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'reset' && selected && (
        <ConfirmActionModal
          title={t('rewardPass.configResetTitle')}
          message={t('rewardPass.configResetMessage', { name: getListName(selected, language) })}
          description={t('rewardPass.configResetDescription')}
          confirmText={t('rewardPass.configResetProgress')}
          variant="danger"
          onConfirm={() => {
            resetProgress(selected.id);
            setLevel(0);
            setConfirm(null);
          }}
          onClose={() => setConfirm(null)}
        />
      )}
    </BottomSheet>
  );
};

/** Impostazioni → Reward Pass: scelta del pass attivo e dei livelli (visibile solo con il flag `reward-pass`). */
export const RewardPassConfigSection = () => {
  const { t, language } = useTranslation();
  const { isEnabled } = useFeatureFlags();
  const allPasses = useAppStore((s) => s.passes);
  const levels = useAppStore((s) => s.currentLevels);
  const activeId = useAppStore((s) => s.activeRewardPass);
  const [open, setOpen] = useState(false);

  if (!isEnabled('reward-pass')) return null;
  const active = resolveActivePass(allPasses.filter(isPassAvailable), activeId, levels);

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-5 shadow-sm space-y-3">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Ticket size={14} className="text-purple-500" /> {t('rewardPass.configTitle')}
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {active
          ? `${getListName(active, language)} · ${t('rewardPass.levelProgress', { level: String(levels[active.id] ?? 0), max: String(active.maxLevel) })}`
          : t('rewardPass.configNoneHint')}
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-2xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-950/60 cursor-pointer"
      >
        {t('rewardPass.configButton')}
      </button>
      {open && <RewardPassConfigModal onClose={() => setOpen(false)} />}
    </section>
  );
};
