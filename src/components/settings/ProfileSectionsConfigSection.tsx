import { useState } from 'react';
import { Layers, RotateCcw, Lock } from 'lucide-react';
import { useAppStore } from '@/store';
import { useTranslation } from '@/i18n';
import {
  getVisibleSectionsForConfig,
  isCoreSection,
  getSubSectionsForMacro,
  getSectionDeactivationWarning,
} from '@/lib/sections';
import type { SectionDefinition, MacroSectionId } from '@/types';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { Switch } from '@/components/ui';
import { cn } from '@/lib/cn';

type ToggleSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
  ariaLabel: string;
};

const ToggleSwitch = ({ checked, disabled, onChange, ariaLabel }: ToggleSwitchProps) => (
  <Switch
    checked={checked}
    onChange={disabled ? () => {} : (onChange ?? (() => {}))}
    disabled={disabled}
    aria-label={ariaLabel}
  />
);

export const ProfileSectionsConfigSection = () => {
  const { t } = useTranslation();
  const enabledSections = useAppStore(s => s.enabledSections);
  const setSectionEnabled = useAppStore(s => s.setSectionEnabled);
  const setMacroSectionWithChildren = useAppStore(s => s.setMacroSectionWithChildren);
  const resetSectionsToDefault = useAppStore(s => s.resetSectionsToDefault);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingDeactivation, setPendingDeactivation] = useState<{
    sectionName: string;
    descriptionKey: string;
    onConfirm: () => void;
  } | null>(null);

  const visibleSections = getVisibleSectionsForConfig();
  const topLevelSections = visibleSections.filter(s => !s.parentId);

  const getSectionTitle = (sec: SectionDefinition): string => {
    return t(sec.nameKey);
  };

  const getSectionDesc = (sec: SectionDefinition): string => {
    return t(sec.descriptionKey);
  };

  const handleToggleMacro = (section: SectionDefinition, currentActive: boolean) => {
    const nextValue = !currentActive;
    if (nextValue) {
      setMacroSectionWithChildren(section.id as MacroSectionId, true);
      return;
    }

    const warning = getSectionDeactivationWarning(section.id, useAppStore.getState());
    if (warning.hasProgress) {
      setPendingDeactivation({
        sectionName: getSectionTitle(section),
        descriptionKey: warning.descriptionKey || 'modules.deactivateConfirm.generic',
        onConfirm: () => {
          setMacroSectionWithChildren(section.id as MacroSectionId, false);
          setPendingDeactivation(null);
        },
      });
    } else {
      setMacroSectionWithChildren(section.id as MacroSectionId, false);
    }
  };

  const handleToggleSub = (sub: SectionDefinition, currentSetting: boolean) => {
    const nextValue = !currentSetting;
    if (nextValue) {
      setSectionEnabled(sub.id, true);
      return;
    }

    const warning = getSectionDeactivationWarning(sub.id, useAppStore.getState());
    if (warning.hasProgress) {
      setPendingDeactivation({
        sectionName: getSectionTitle(sub),
        descriptionKey: warning.descriptionKey || 'modules.deactivateConfirm.generic',
        onConfirm: () => {
          setSectionEnabled(sub.id, false);
          setPendingDeactivation(null);
        },
      });
    } else {
      setSectionEnabled(sub.id, false);
    }
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Layers size={14} className="text-blue-500" /> {t('modules.settingsTitle')}
          </h2>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
            title={t('modules.resetDefaults')}
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">{t('modules.resetDefaults')}</span>
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('modules.settingsSubtitle')}
        </p>

        <div className="space-y-3 pt-1">
          {topLevelSections.map(section => {
            const isCore = isCoreSection(section.id);
            const isMacroActive = isCore ? true : (enabledSections[section.id] ?? section.defaultEnabled);
            const title = getSectionTitle(section);
            const desc = getSectionDesc(section);
            const subSections = getSubSectionsForMacro(section.id as MacroSectionId);

            return (
              <div
                key={section.id}
                className={cn(
                  'rounded-2xl border p-3.5 transition-all',
                  isCore
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/50'
                    : isMacroActive
                    ? 'bg-gray-50/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                    : 'bg-gray-50/30 dark:bg-gray-900/40 border-gray-200/60 dark:border-gray-800/80 opacity-75'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {title}
                      </span>
                      {isCore && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                          <Lock size={10} /> {t('modules.coreBadge')}
                        </span>
                      )}
                    </div>
                    {desc && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {desc}
                      </p>
                    )}
                  </div>

                  <ToggleSwitch
                    checked={isMacroActive}
                    disabled={isCore}
                    onChange={() => handleToggleMacro(section, isMacroActive)}
                    ariaLabel={title}
                  />
                </div>

                {/* Sub-sections indented */}
                {subSections.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200/70 dark:border-gray-700/60 pl-3 space-y-2.5">
                    {subSections.map(sub => {
                      const subTitle = getSectionTitle(sub);
                      const subDesc = getSectionDesc(sub);
                      const subSetting = enabledSections[sub.id] ?? sub.defaultEnabled;
                      const subChecked = isMacroActive && subSetting;
                      const subDisabled = !isMacroActive;

                      return (
                        <div
                          key={sub.id}
                          className={cn(
                            'flex items-start justify-between gap-3 p-2 rounded-xl transition-colors',
                            subDisabled ? 'opacity-50' : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/40'
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                              {subTitle}
                            </span>
                            {subDesc && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {subDesc}
                              </p>
                            )}
                            {subDisabled && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                                {t('modules.parentDisabledHint', { parent: title })}
                              </p>
                            )}
                          </div>

                          <ToggleSwitch
                            checked={subChecked}
                            disabled={subDisabled}
                            onChange={() => handleToggleSub(sub, subSetting)}
                            ariaLabel={subTitle}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {pendingDeactivation && (
        <ConfirmActionModal
          title={t('modules.deactivateConfirm.title', { module: pendingDeactivation.sectionName })}
          message={t('modules.deactivateConfirm.message')}
          description={t(pendingDeactivation.descriptionKey)}
          confirmText={t('modules.deactivateConfirm.confirm')}
          cancelText={t('common.cancel')}
          variant="danger"
          onConfirm={pendingDeactivation.onConfirm}
          onClose={() => setPendingDeactivation(null)}
        />
      )}

      {showResetConfirm && (
        <ConfirmActionModal
          title={t('modules.resetConfirmTitle')}
          message={t('modules.resetConfirmDesc')}
          confirmText={t('common.confirm')}
          cancelText={t('common.cancel')}
          variant="warning"
          onConfirm={() => {
            resetSectionsToDefault();
            setShowResetConfirm(false);
          }}
          onClose={() => setShowResetConfirm(false)}
        />
      )}
    </>
  );
};
