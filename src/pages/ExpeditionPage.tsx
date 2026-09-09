import { useState, useMemo } from 'react';
import {
  Compass,
  Flame,
  Award,
  Swords,
  Coins,
  CheckCircle2,
  Lock,
  Sliders,
  Check,
  Package,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  getActiveExpeditionPure,
  getExpeditionDamageTierPure,
  getExpeditionCatchupSPPure,
  calculateExpeditionRewardPure,
  getExpeditionCompletedPhasePure,
  isDepartureWindowActivePure,
} from '@/store/selectors';
import { MAX_EXTRA_SKILL_POINTS } from '@/store/gameData';
import { SectionHeader } from '@/components/SectionHeader';
import { Drawer } from '@/components/Drawer';
import { BottomSheet } from '@/components/BottomSheet';
import { ActionCheckbox } from '@/components/ActionCheckbox';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { useTranslation, getItemName } from '@/i18n';
import { cn } from '@/lib/cn';

export const ExpeditionPage = () => {
  const { t, language } = useTranslation();

  // Store selectors
  const expeditions = useAppStore(s => s.expeditions);
  const completedExpeditionsCount = useAppStore(s => s.completedExpeditionsCount);
  const earnedPermanentSkillPoints = useAppStore(s => s.earnedPermanentSkillPoints);
  const consecutiveStreak = useAppStore(s => s.consecutiveStreak);
  const inventory = useAppStore(s => s.inventory);
  const itemsInfo = useAppStore(s => s.itemsInfo);
  const checkedActions = useAppStore(s => s.checkedActions);

  // Store actions
  const toggleAction = useAppStore(s => s.toggleAction);
  const confirmDeparture = useAppStore(s => s.confirmDeparture);
  const closeWindowWithoutDeparture = useAppStore(s => s.closeWindowWithoutDeparture);
  const setExpeditionProfile = useAppStore(s => s.setExpeditionProfile);

  // UI Local state
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [confirmDepartureModalOpen, setConfirmDepartureModalOpen] = useState(false);
  const [closeWindowModalOpen, setCloseWindowModalOpen] = useState(false);
  const [overrideSPInput, setOverrideSPInput] = useState<string>('');
  const [clearInventoryOnClose, setClearInventoryOnClose] = useState(false);

  // Active Caravan & Sequential Phase Calculation
  const activeCaravan = useMemo(
    () => getActiveExpeditionPure(expeditions, completedExpeditionsCount),
    [expeditions, completedExpeditionsCount],
  );

  const isWindowOpen = useMemo(
    () => isDepartureWindowActivePure(activeCaravan),
    [activeCaravan],
  );

  const completedPhase = useMemo(
    () => getExpeditionCompletedPhasePure(activeCaravan, inventory, checkedActions),
    [activeCaravan, inventory, checkedActions],
  );

  // Challenge Tiers and Reward calculation
  const damageTier = useMemo(
    () => getExpeditionDamageTierPure(checkedActions),
    [checkedActions],
  );

  const catchupSP = useMemo(
    () => getExpeditionCatchupSPPure(checkedActions),
    [checkedActions],
  );

  const rewardEstimate = useMemo(
    () => calculateExpeditionRewardPure(completedExpeditionsCount, damageTier, catchupSP),
    [completedExpeditionsCount, damageTier, catchupSP],
  );

  const canCatchUp = earnedPermanentSkillPoints < MAX_EXTRA_SKILL_POINTS && completedExpeditionsCount >= 1;
  const catchUpLocked = damageTier < 5;
  const catchupCost = catchupSP * 300_000;

  // Manual Config Drawer State
  const [cfgCompleted, setCfgCompleted] = useState(completedExpeditionsCount);
  const [cfgStreak, setCfgStreak] = useState(consecutiveStreak);
  const [cfgSP, setCfgSP] = useState(earnedPermanentSkillPoints);

  const openConfigDrawer = () => {
    setCfgCompleted(completedExpeditionsCount);
    setCfgStreak(consecutiveStreak);
    setCfgSP(earnedPermanentSkillPoints);
    setConfigDrawerOpen(true);
  };

  const saveConfig = () => {
    setExpeditionProfile({
      completedExpeditionsCount: cfgCompleted,
      consecutiveStreak: cfgStreak,
      earnedPermanentSkillPoints: cfgSP,
    });
    setConfigDrawerOpen(false);
  };

  const handleConfirmDeparture = () => {
    const override = overrideSPInput.trim() !== '' ? Number(overrideSPInput) : undefined;
    confirmDeparture(override);
    setConfirmDepartureModalOpen(false);
    setOverrideSPInput('');
  };

  const handleCloseWindow = () => {
    closeWindowWithoutDeparture(clearInventoryOnClose);
    setCloseWindowModalOpen(false);
    setClearInventoryOnClose(false);
  };

  return (
    <div className="pb-32 px-4 pt-4 space-y-5">
      <SectionHeader
        title={t('expeditions.title')}
        actions={
          <button
            type="button"
            onClick={openConfigDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-2xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
            title={t('expeditions.manualSetup')}
          >
            <Sliders size={14} />
            <span>{t('expeditions.manualSetup')}</span>
          </button>
        }
      />

      {/* Profile Prestige Dashboard Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-4.5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Compass size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {t('expeditions.subtitle')}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                {isWindowOpen
                  ? t('expeditions.stats.windowOpen')
                  : t('expeditions.stats.windowClosed')}
              </p>
            </div>
          </div>

          {isWindowOpen ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-green-700 bg-green-100 dark:bg-green-950/60 dark:text-green-300 rounded-full animate-pulse shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {t('expeditions.stats.windowOpen')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-full shrink-0">
              {t('expeditions.stats.windowClosed')}
            </span>
          )}
        </div>

        {/* 3 Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-2.5 text-center border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block truncate">
              {t('expeditions.stats.completed')}
            </span>
            <span className="text-lg font-black text-gray-800 dark:text-gray-100">
              #{completedExpeditionsCount}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-2.5 text-center border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1 truncate">
              <Flame size={12} className="text-amber-500" />
              {t('expeditions.stats.streak')}
            </span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">
              {consecutiveStreak}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-2.5 text-center border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1 truncate">
              <Award size={12} className="text-purple-500" />
              SP
            </span>
            <span className="text-lg font-black text-purple-600 dark:text-purple-400">
              {earnedPermanentSkillPoints}/{MAX_EXTRA_SKILL_POINTS}
            </span>
          </div>
        </div>

        {/* Skill Points Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-semibold text-gray-600 dark:text-gray-400">
            <span>{t('expeditions.stats.skillPoints')}</span>
            <span>{Math.round((earnedPermanentSkillPoints / MAX_EXTRA_SKILL_POINTS) * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${(earnedPermanentSkillPoints / MAX_EXTRA_SKILL_POINTS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section 1: Active Caravan */}
      {activeCaravan && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-4.5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Package size={17} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {activeCaravan.name}
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">
                  {t('expeditions.caravan.title')} • #{activeCaravan.expeditionIndex ?? 1}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shrink-0">
              {completedPhase}/6 Fasi
            </span>
          </div>

          {/* Caravan Phases List */}
          <div className="space-y-3">
            {activeCaravan.levels.map(level => {
              const isUnlocked = level.level === 1 || level.level <= completedPhase + 1;
              const isPhaseCompleted = level.level <= completedPhase;
              const hasItems = level.requirementItemIds.length > 0;
              const hasActions = (level.actions?.length ?? 0) > 0;

              return (
                <div
                  key={level.level}
                  className={cn(
                    'border rounded-2xl p-3.5 space-y-2.5 transition-all',
                    !isUnlocked
                      ? 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200/50 dark:border-gray-800/50 opacity-60'
                      : isPhaseCompleted
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200/70 dark:border-gray-800',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {!isUnlocked && <Lock size={12} className="text-gray-400 shrink-0" />}
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {t('expeditions.caravan.phase', { current: level.level, total: 6 })}
                        {level.level <= 4 && ` — ${t('expeditions.caravan.assembly')}`}
                        {level.level === 5 && ` — ${t('expeditions.caravan.donations')}`}
                        {level.level === 6 && ` — ${t('expeditions.caravan.registration')}`}
                      </span>
                    </div>

                    {!isUnlocked ? (
                      <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                        {t('expeditions.caravan.lockedPhase', { prev: level.level - 1 })}
                      </span>
                    ) : isPhaseCompleted ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full">
                        <Check size={11} strokeWidth={3} />
                        {t('stash.completed')}
                      </span>
                    ) : null}
                  </div>

                  {/* Materials list for Phases 1-4 */}
                  {hasItems && (
                    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-2', !isUnlocked && 'pointer-events-none')}>
                      {level.requirementItemIds.map(req => {
                        const item = itemsInfo[req.itemId];
                        const isChecked = Boolean(checkedActions[`${activeCaravan.id}|${level.level}|item_${req.itemId}`]);
                        const owned = inventory[req.itemId] ?? 0;
                        const isMet = isChecked || owned >= req.quantity;

                        return (
                          <div
                            key={req.itemId}
                            className={cn(
                              'flex items-center justify-between p-2 rounded-xl border transition-colors',
                              isChecked
                                ? 'bg-green-500/10 border-green-500/30 text-gray-800 dark:text-gray-200'
                                : isMet
                                ? 'bg-green-500/5 border-green-500/20 text-gray-800 dark:text-gray-200'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/60 text-gray-700 dark:text-gray-300',
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isUnlocked ? (
                                <button
                                  type="button"
                                  onClick={() => toggleAction(activeCaravan.id, level.level, `item_${req.itemId}`)}
                                  className={cn(
                                    'w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0',
                                    isChecked
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400',
                                  )}
                                  title={t('expeditions.caravan.markDelivered')}
                                >
                                  {isChecked && <Check size={12} strokeWidth={3} />}
                                </button>
                              ) : (
                                <div className="w-5 h-5 rounded-md border border-gray-200 dark:border-gray-700 shrink-0" />
                              )}

                              <ItemCardFrameV2
                                icon={item?.icon}
                                alt={req.itemId}
                                rarity={item?.rarity}
                                fallbackText={req.itemId}
                                className="w-8 h-8 rounded-lg shrink-0"
                              />
                              <span className={cn('text-xs font-medium truncate', isChecked && 'line-through opacity-70')}>
                                {getItemName(item, language) || req.itemId}
                              </span>
                            </div>

                            <div className="shrink-0 ml-2">
                              {isChecked ? (
                                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-1.5 py-0.5 rounded">
                                  {t('expeditions.caravan.delivered')}
                                </span>
                              ) : (
                                <span
                                  className={cn(
                                    'text-xs font-mono font-bold',
                                    isMet ? 'text-green-600 dark:text-green-400' : 'text-gray-500',
                                  )}
                                >
                                  {owned}/{req.quantity}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions list for Phases 5-6 */}
                  {hasActions && (
                    <div className={cn('space-y-1.5 pt-1', !isUnlocked && 'pointer-events-none')}>
                      {level.actions?.map(action => (
                        <ActionCheckbox
                          key={action.id}
                          label={action.label}
                          checked={Boolean(checkedActions[`${activeCaravan.id}|${level.level}|${action.id}`])}
                          onToggle={() => isUnlocked && toggleAction(activeCaravan.id, level.level, action.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 2: Damage Challenge */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-4.5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Swords size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {t('expeditions.damageChallenge.title')}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('expeditions.damageChallenge.desc')}
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-red-600 dark:text-red-400 px-2.5 py-1 bg-red-50 dark:bg-red-950/40 rounded-full shrink-0">
            {damageTier}/5
          </span>
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(tier => {
            const key = `expedition-damage|0|tier_${tier}`;
            const isChecked = Boolean(checkedActions[key]);
            const isSpReward = completedExpeditionsCount < 3;

            return (
              <div
                key={tier}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-2xl border transition-colors',
                  isChecked
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200/70 dark:border-gray-800',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <ActionCheckbox
                    checked={isChecked}
                    onToggle={() => toggleAction('expedition-damage', 0, `tier_${tier}`)}
                    label={t('expeditions.damageChallenge.tier', { tier })}
                  />
                </div>
                <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                  {isSpReward
                    ? t('expeditions.damageChallenge.rewardSp')
                    : t('expeditions.damageChallenge.rewardMystery')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Catch-Up SP (Conditional) */}
      {canCatchUp && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-4.5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Coins size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {t('expeditions.catchup.title')}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t('expeditions.catchup.desc')}
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-purple-600 dark:text-purple-400 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 rounded-full shrink-0">
              +{catchupSP} SP
            </span>
          </div>

          {catchUpLocked ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-amber-800 dark:text-amber-200 text-xs font-medium">
              <Lock size={16} className="shrink-0 text-amber-500" />
              <span>{t('expeditions.catchup.locked')}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-2xl text-xs font-semibold text-blue-800 dark:text-blue-300">
                {t('expeditions.catchup.costAdvisory', {
                  cost: catchupCost.toLocaleString(),
                  count: catchupSP,
                })}
              </div>

              {[1, 2, 3, 4, 5].map(sp => {
                const key = `expedition-catchup|0|sp_${sp}`;
                const isChecked = Boolean(checkedActions[key]);

                return (
                  <div
                    key={sp}
                    className={cn(
                      'flex items-center justify-between p-2.5 rounded-2xl border transition-colors',
                      isChecked
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200/70 dark:border-gray-800',
                    )}
                  >
                    <ActionCheckbox
                      checked={isChecked}
                      onToggle={() => toggleAction('expedition-catchup', 0, `sp_${sp}`)}
                      label={`Catch-Up SP #${sp}`}
                    />
                    <span className="text-[11px] font-semibold text-gray-500">
                      300.000 Coin
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Section 4: Departure Controls / Actions */}
      <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-[28px] p-5 shadow-lg space-y-4 border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">{t('expeditions.departure.title')}</h3>
            <p className="text-xs text-gray-400">
              {t('expeditions.departure.spRewardSummary', { gain: rewardEstimate.skillPoints })}
            </p>
          </div>
          {rewardEstimate.tokenReward > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              +{rewardEstimate.tokenReward} Token
            </span>
          )}
        </div>

        {isWindowOpen ? (
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setConfirmDepartureModalOpen(true)}
              className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>{t('expeditions.departure.confirmBtn')}</span>
            </button>

            <button
              type="button"
              onClick={() => setCloseWindowModalOpen(true)}
              className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-full border border-gray-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>{t('expeditions.departure.closeBtn')}</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 bg-gray-800/80 border border-gray-700/60 rounded-2xl flex items-center gap-2.5 text-xs text-gray-300">
            <Lock size={16} className="text-amber-400 shrink-0" />
            <span>{t('expeditions.departure.windowClosedNotice')}</span>
          </div>
        )}
      </div>

      {/* Manual Configuration Drawer (Top) */}
      {configDrawerOpen && (
        <Drawer
          from="top"
          onClose={() => setConfigDrawerOpen(false)}
          title={t('expeditions.config.title')}
        >
          <div className="p-4 space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('expeditions.config.desc')}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  {t('expeditions.config.completedCount')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={cfgCompleted}
                  onChange={e => setCfgCompleted(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  {t('expeditions.config.streakCount')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={cfgStreak}
                  onChange={e => setCfgStreak(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  {t('expeditions.config.earnedSP')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={cfgSP}
                  onChange={e => setCfgSP(Math.max(0, Math.min(15, parseInt(e.target.value) || 0)))}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={saveConfig}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-full shadow-xs transition-colors mt-2"
            >
              {t('expeditions.config.save')}
            </button>
          </div>
        </Drawer>
      )}

      {/* Confirm Departure BottomSheet */}
      {confirmDepartureModalOpen && (
        <BottomSheet
          title={t('expeditions.departure.confirmModalTitle')}
          onClose={() => setConfirmDepartureModalOpen(false)}
        >
          <div className="p-4 space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                {t('expeditions.departure.confirmModalDesc')}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-3 space-y-2 border border-gray-100 dark:border-gray-800">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {t('expeditions.departure.spRewardSummary', { gain: rewardEstimate.skillPoints })}
              </span>

              <div>
                <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  {t('expeditions.departure.overrideGainLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  placeholder={t('expeditions.departure.overridePlaceholder')}
                  value={overrideSPInput}
                  onChange={e => setOverrideSPInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDepartureModalOpen(false)}
                className="flex-1 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeparture}
                className="flex-2 py-3 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded-full shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>{t('common.confirm')}</span>
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Close Window BottomSheet */}
      {closeWindowModalOpen && (
        <BottomSheet
          title={t('expeditions.departure.closeModalTitle')}
          onClose={() => setCloseWindowModalOpen(false)}
        >
          <div className="p-4 space-y-4">
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              {t('expeditions.departure.closeModalDesc')}
            </p>

            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800">
              <input
                type="checkbox"
                id="clearInventory"
                checked={clearInventoryOnClose}
                onChange={e => setClearInventoryOnClose(e.target.checked)}
                className="rounded accent-red-500 cursor-pointer"
              />
              <label htmlFor="clearInventory" className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                {t('expeditions.departure.clearInventoryOption')}
              </label>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCloseWindowModalOpen(false)}
                className="flex-1 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleCloseWindow}
                className="flex-2 py-3 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-full shadow-xs transition-colors"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};
