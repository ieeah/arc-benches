import { useState } from 'react';
import { ArrowLeft, LayoutGrid, Minus, Plus, SlidersHorizontal, Ticket } from 'lucide-react';
import type { PassList } from '@/types';
import { useAppStore } from '@/store';
import { useTranslation, getListDescription, getListName } from '@/i18n';
import { SectionHeader } from '@/components/SectionHeader';
import { IconButton } from '@/components/IconButton';
import { StickyHeader } from '@/components/StickyHeader';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { Drawer } from '@/components/Drawer';
import { PassCard } from '@/components/pass/PassCard';
import { PassLevelsGrid } from '@/components/pass/PassLevelsGrid';
import { PassRewardsSummary } from '@/components/pass/PassRewardsSummary';
import { OrphanPassModal } from '@/components/pass/OrphanPassModal';
import { usePassViewPrefs } from '@/lib/passViewPrefs';
import { getTrackName, splitPassesByCompletion } from '@/lib/rewardPass';
import { cn } from '@/lib/cn';

interface RewardPassPageProps {
  /** Pass di cui mostrare l'anteprima (parametro `pass` della rotta). */
  passId?: string;
  /** `levels`: dettaglio di livelli e tracce del pass indicato. */
  view?: string;
  onNavigate: (params?: Record<string, string>) => void;
}

const BackButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <IconButton onClick={onClick} title={label}>
    <ArrowLeft size={16} />
  </IconButton>
);

/** Opzioni di visualizzazione della griglia: tracce da mostrare (per dispositivo). */
const ViewOptions = ({ pass, onClose }: { pass: PassList; onClose: () => void }) => {
  const { t, language } = useTranslation();
  const { isTrackHidden, toggleTrack } = usePassViewPrefs();
  return (
    <Drawer from="top" title={t('rewardPass.viewOptions')} onClose={onClose}>
      <div className="space-y-2 pb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('rewardPass.visibleTracks')}</p>
        {pass.tracks.map((track) => {
          const visible = !isTrackHidden(track.id);
          return (
            <button
              key={track.id}
              type="button"
              role="switch"
              aria-checked={visible}
              onClick={() => toggleTrack(track.id)}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 cursor-pointer"
            >
              <span className="text-sm font-bold">{getTrackName(track, language)}</span>
              <span className={cn('w-11 h-6 rounded-full p-0.5 transition-colors', visible ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600')}>
                <span className={cn('block w-5 h-5 rounded-full bg-white shadow transition-transform', visible && 'translate-x-5')} />
              </span>
            </button>
          );
        })}
      </div>
    </Drawer>
  );
};

/** Pagina del pass: vista a griglia con tier raggiunto e «Concludi pass». */
const ActivePassView = ({ pass, onShowAll }: { pass: PassList; onShowAll: () => void }) => {
  const { t, language } = useTranslation();
  const reached = useAppStore((s) => s.currentLevels[pass.id] ?? 0);
  const setLevel = useAppStore((s) => s.setRewardPassLevel);
  const conclude = useAppStore((s) => s.concludeRewardPass);
  const { prefs } = usePassViewPrefs();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [confirmConclude, setConfirmConclude] = useState(false);
  const hidden = new Set(prefs.hiddenTracks);

  return (
    <div className="pb-28">
      <StickyHeader compact>
        <SectionHeader
          title={getListName(pass, language)}
          actions={
            <>
              <IconButton onClick={onShowAll} title={t('rewardPass.backToPasses')}>
                <LayoutGrid size={16} />
              </IconButton>
              <IconButton onClick={() => setOptionsOpen(true)} title={t('rewardPass.viewOptions')}>
                <SlidersHorizontal size={16} />
              </IconButton>
            </>
          }
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400">{t('rewardPass.tierReached')}</p>
            <p className="text-lg font-black">
              {reached}<span className="text-gray-400 font-bold"> / {pass.maxLevel}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <IconButton onClick={() => setLevel(reached - 1)} title={t('rewardPass.decreaseTier')} disabled={reached <= 0}>
              <Minus size={16} />
            </IconButton>
            <IconButton onClick={() => setLevel(reached + 1)} title={t('rewardPass.increaseTier')} disabled={reached >= pass.maxLevel}>
              <Plus size={16} />
            </IconButton>
            <button
              type="button"
              onClick={() => setConfirmConclude(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              {t('rewardPass.concludePass')}
            </button>
          </div>
        </div>
      </StickyHeader>

      <div className="p-4">
        <PassLevelsGrid pass={pass} reached={reached} hiddenTracks={hidden} onSetTier={setLevel} scrollToNext />
      </div>

      {optionsOpen && <ViewOptions pass={pass} onClose={() => setOptionsOpen(false)} />}
      {confirmConclude && (
        <ConfirmActionModal
          title={t('rewardPass.concludeTitle')}
          message={t('rewardPass.concludeMessage', { name: getListName(pass, language) })}
          description={t('rewardPass.concludeDescription')}
          confirmText={t('rewardPass.concludePass')}
          variant="primary"
          onConfirm={conclude}
          onClose={() => setConfirmConclude(false)}
        />
      )}
    </div>
  );
};

/** Dettaglio di livelli e tracce di un pass non attivo (sola lettura). */
const PassLevelsPreview = ({ pass, onBack }: { pass: PassList; onBack: () => void }) => {
  const { t, language } = useTranslation();
  const { prefs } = usePassViewPrefs();
  const [optionsOpen, setOptionsOpen] = useState(false);
  return (
    <div className="pb-28">
      <StickyHeader compact>
        <SectionHeader
          title={getListName(pass, language)}
          leading={<BackButton onClick={onBack} label={t('common.back')} />}
          actions={
            <IconButton onClick={() => setOptionsOpen(true)} title={t('rewardPass.viewOptions')}>
              <SlidersHorizontal size={16} />
            </IconButton>
          }
        />
      </StickyHeader>
      <div className="p-4">
        <PassLevelsGrid pass={pass} reached={0} hiddenTracks={new Set(prefs.hiddenTracks)} />
      </div>
      {optionsOpen && <ViewOptions pass={pass} onClose={() => setOptionsOpen(false)} />}
    </div>
  );
};

/** Anteprima di un pass: nome e costo, descrizione, tracce e livelli, ricompense totali, e la scelta del pass attivo. */
const PassPreview = ({ pass, onBack, onViewLevels }: { pass: PassList; onBack: () => void; onViewLevels: () => void }) => {
  const { t, language } = useTranslation();
  const activeRewardPass = useAppStore((s) => s.activeRewardPass);
  const completed = useAppStore((s) => s.completedRewardPasses);
  const setActive = useAppStore((s) => s.setActiveRewardPass);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isCompleted = completed.some((c) => c.id === pass.id);
  const blockedByOther = activeRewardPass !== null && activeRewardPass !== pass.id;
  const description = getListDescription(pass, language);
  const isActive = activeRewardPass === pass.id;
  const disabledReason = isCompleted ? t('rewardPass.alreadyCompleted') : isActive ? t('rewardPass.active') : blockedByOther ? t('rewardPass.anotherActive') : '';

  return (
    <div className="pb-28">
      <StickyHeader compact>
        <SectionHeader title={getListName(pass, language)} leading={<BackButton onClick={onBack} label={t('rewardPass.backToPasses')} />} />
      </StickyHeader>

      <div className="p-4 space-y-4">
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-black">{getListName(pass, language)}</h2>
            {pass.premiumCostTokens !== undefined && (
              <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                {t('rewardPass.premiumCost', { cost: pass.premiumCostTokens.toLocaleString(language) })}
              </span>
            )}
          </div>

          {description && <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('rewardPass.levels')}</p>
              <p className="text-xl font-black">{pass.maxLevel}</p>
            </div>
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('rewardPass.tracks')}</p>
              <p className="text-sm font-black leading-tight pt-1">{pass.tracks.map((tr) => getTrackName(tr, language)).join(' · ')}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('rewardPass.totalRewards')}</p>
            <PassRewardsSummary pass={pass} />
          </div>
        </section>

        <button
          type="button"
          onClick={onViewLevels}
          className="w-full py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-bold cursor-pointer"
        >
          {t('rewardPass.viewLevels')}
        </button>

        <div className="space-y-1.5">
          <button
            type="button"
            disabled={disabledReason !== ''}
            onClick={() => setConfirmOpen(true)}
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold cursor-pointer"
          >
            {t('rewardPass.setActive')}
          </button>
          {disabledReason && <p className="text-[11px] text-center text-gray-500 dark:text-gray-400">{disabledReason}</p>}
        </div>
      </div>

      {confirmOpen && (
        <ConfirmActionModal
          title={t('rewardPass.setActiveTitle')}
          message={t('rewardPass.setActiveMessage', { name: getListName(pass, language) })}
          description={t('rewardPass.setActiveDescription')}
          confirmText={t('rewardPass.setActive')}
          variant="primary"
          onConfirm={() => setActive(pass.id)}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
};

/** Selezione: card dei pass non conclusi in evidenza, quelli conclusi in una sezione a fondo pagina. */
const PassSelection = ({ onOpen, onBack }: { onOpen: (passId: string) => void; onBack?: () => void }) => {
  const { t } = useTranslation();
  const passes = useAppStore((s) => s.passes);
  const completedEntries = useAppStore((s) => s.completedRewardPasses);
  const activeRewardPass = useAppStore((s) => s.activeRewardPass);
  const completedIds = new Set(completedEntries.map((c) => c.id));
  const { available, completed } = splitPassesByCompletion(passes, completedIds);

  return (
    <div className="pb-28">
      <StickyHeader compact>
        <SectionHeader
          title={t('rewardPass.title')}
          leading={onBack ? <BackButton onClick={onBack} label={t('common.back')} /> : undefined}
        />
      </StickyHeader>

      <div className="p-4 space-y-6">
        {passes.length === 0 ? (
          <div className="p-10 text-center space-y-2 bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-[28px]">
            <Ticket size={28} className="mx-auto text-gray-400" />
            <p className="text-sm font-bold">{t('rewardPass.emptyTitle')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('rewardPass.emptyHint')}</p>
          </div>
        ) : (
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-black">{t('rewardPass.chooseTitle')}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('rewardPass.chooseHint')}</p>
            </div>
            {available.map((pass) => (
              <PassCard key={pass.id} pass={pass} active={pass.id === activeRewardPass} onOpen={() => onOpen(pass.id)} />
            ))}
          </section>
        )}

        {completed.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('rewardPass.completedSection')}</h2>
            {completed.map((pass) => (
              <PassCard
                key={pass.id}
                pass={pass}
                completedAt={completedEntries.find((c) => c.id === pass.id)?.completedAt}
                onOpen={() => onOpen(pass.id)}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export const RewardPassPage = ({ passId, view, onNavigate }: RewardPassPageProps) => {
  const passes = useAppStore((s) => s.passes);
  const activeRewardPass = useAppStore((s) => s.activeRewardPass);
  const resolveOrphan = useAppStore((s) => s.resolveOrphanRewardPass);
  const [orphanDeferred, setOrphanDeferred] = useState(false);

  const activePass = passes.find((p) => p.id === activeRewardPass) ?? null;
  const orphanId = activeRewardPass !== null && activePass === null ? activeRewardPass : null;
  const requested = passId ? passes.find((p) => p.id === passId) ?? null : null;

  const orphanModal = orphanId !== null && !orphanDeferred && (
    <OrphanPassModal
      passId={orphanId}
      onCompleted={() => resolveOrphan('completed')}
      onAbandoned={() => resolveOrphan('abandoned')}
      onLater={() => setOrphanDeferred(true)}
    />
  );

  // Con un pass attivo l'elenco resta raggiungibile (`view=all`) per dare solo un'occhiata agli altri.
  const showList = () => onNavigate({ view: 'all' });
  const backFromPreview = () => (activePass ? showList() : onNavigate());

  let content;
  if (requested && view === 'levels') {
    content = <PassLevelsPreview pass={requested} onBack={() => onNavigate({ pass: requested.id })} />;
  } else if (requested) {
    content = (
      <PassPreview
        pass={requested}
        onBack={backFromPreview}
        onViewLevels={() => onNavigate({ pass: requested.id, view: 'levels' })}
      />
    );
  } else if (activePass && view === 'all') {
    content = <PassSelection onOpen={(id) => onNavigate({ pass: id })} onBack={() => onNavigate()} />;
  } else if (activePass) {
    content = <ActivePassView pass={activePass} onShowAll={showList} />;
  } else {
    content = <PassSelection onOpen={(id) => onNavigate({ pass: id })} />;
  }

  return (
    <>
      {content}
      {orphanModal}
    </>
  );
};
