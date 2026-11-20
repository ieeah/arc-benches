import { Suspense, lazy, useEffect, useState } from 'react';
import { Download, EyeOff, Loader2, Plus, RotateCcw, Upload, Trash2, Sun } from 'lucide-react';
import { ThemeProvider } from '@/context/ThemeProvider';
import { FloatingNavDockProvider, useFloatingNavDock } from '@/context/FloatingNavDockContext';
import { useWakeLock } from '@/hooks/useWakeLock';
import { FloatingNav } from '@/components/FloatingNav';
import { MorphingFloatingNav } from '@/components/MorphingFloatingNav';
import { StashPage } from '@/pages/StashPage';
import type { ContextAction } from '@/components/FloatingNav';
import type { ListsPageAction } from '@/pages/ListsPage';
import { useAppStore } from '@/store';
import { useTranslation } from '@/i18n';
import { hasUnsavedDevChanges } from '@/lib/devDrafts';
import { InactivePassNotice } from '@/components/pass/InactivePassNotice';
import { useRouter, type AppRoute } from '@/router';
import { isSectionActive } from '@/lib/sections';
import type { SectionId } from '@/types';

const isDev = import.meta.env.DEV;

// Pagine normali con code-splitting
const ListsPage = lazy(() => import('@/pages/ListsPage').then(m => ({ default: m.ListsPage })));
const CollectionsPage = lazy(() => import('@/pages/CollectionsPage').then(m => ({ default: m.CollectionsPage })));
const ItemsPage = lazy(() => import('@/pages/ItemsPage').then(m => ({ default: m.ItemsPage })));
const MapsPage = lazy(() => import('@/pages/MapsPage').then(m => ({ default: m.MapsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ListDetailPage = lazy(() => import('@/pages/ListDetailPage').then(m => ({ default: m.ListDetailPage })));
const ExpeditionPage = lazy(() => import('@/pages/ExpeditionPage').then(m => ({ default: m.ExpeditionPage })));
const RewardPassPage = lazy(() => import('@/pages/RewardPassPage').then(m => ({ default: m.RewardPassPage })));
const RaidPlanPage = lazy(() => import('@/pages/RaidPlanPage').then(m => ({ default: m.RaidPlanPage })));
const SkillTreePage = lazy(() => import('@/pages/SkillTreePage').then(m => ({ default: m.SkillTreePage })));
const RoleMakerModal = lazy(() => import('@/components/RoleMakerModal').then(m => ({ default: m.RoleMakerModal })));

// Pagine Dev Studio (escluse completamente dalla build di produzione via dead-code elimination)
const DevDashboardPage = isDev
  ? lazy(() => import('@/pages/DevDashboardPage').then(m => ({ default: m.DevDashboardPage })))
  : () => null;
const DevOverridesPage = isDev
  ? lazy(() => import('@/pages/DevOverridesPage').then(m => ({ default: m.DevOverridesPage })))
  : () => null;
const DevTranslationsPage = isDev
  ? lazy(() => import('@/pages/DevTranslationsPage').then(m => ({ default: m.DevTranslationsPage })))
  : () => null;
const DevListsPage = isDev
  ? lazy(() => import('@/pages/DevListsPage').then(m => ({ default: m.DevListsPage })))
  : () => null;
const DevNavPage = isDev
  ? lazy(() => import('@/pages/DevNavPage').then(m => ({ default: m.DevNavPage })))
  : () => null;
const DevFlagsPage = isDev
  ? lazy(() => import('@/pages/DevFlagsPage').then(m => ({ default: m.DevFlagsPage })))
  : () => null;
const DevCustomItemsPage = isDev
  ? lazy(() => import('@/pages/DevCustomItemsPage').then(m => ({ default: m.DevCustomItemsPage })))
  : () => null;
const DevTrashPage = isDev
  ? lazy(() => import('@/pages/DevTrashPage').then(m => ({ default: m.DevTrashPage })))
  : () => null;
const DevBaseItemsPage = isDev
  ? lazy(() => import('@/pages/DevBaseItemsPage').then(m => ({ default: m.DevBaseItemsPage })))
  : () => null;

type PageLoadingFallbackProps = {
  className?: string;
};

function PageLoadingFallback({ className = '' }: PageLoadingFallbackProps) {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh flex flex-col bg-gray-50/50 dark:bg-black text-gray-900 dark:text-gray-100">
      <div className={`flex-1 w-full max-w-md md:max-w-3xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-3 text-neutral-400 dark:text-neutral-500 ${className}`}>
        <Loader2 size={24} className="animate-spin text-neutral-500 dark:text-neutral-400" />
        <span className="text-xs font-medium tracking-wide">{t('common.loading')}</span>
      </div>
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeTab = router.route;
  const detailListId = router.params.id || null;
  const devOverrideItemId = router.params.item || null;

  const [listsAction, setListsAction] = useState<ListsPageAction>(null);
  const [raidAction, setRaidAction] = useState<'apply' | 'reset' | 'clear' | null>(null);
  const [keepScreenOn, setKeepScreenOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('scrappys_keep_screen_on') === '1';
    } catch {
      return false;
    }
  });
  const wakeLock = useWakeLock(keepScreenOn);

  const toggleKeepScreenOn = () => {
    setKeepScreenOn(prev => {
      const next = !prev;
      try {
        localStorage.setItem('scrappys_keep_screen_on', next ? '1' : '0');
      } catch {
        // Ignora errori storage
      }
      return next;
    });
  };

  // Selettori Zustand
  const navVariant = useAppStore(s => s.navVariant);
  const filterHideCompleted = useAppStore(s => s.filterHideCompleted);
  const setFilterHideCompleted = useAppStore(s => s.setFilterHideCompleted);
  const filterHideOwnedBlueprints = useAppStore(s => s.filterHideOwnedBlueprints);
  const setFilterHideOwnedBlueprints = useAppStore(s => s.setFilterHideOwnedBlueprints);
  const filterHideOwnedDesigns = useAppStore(s => s.filterHideOwnedDesigns);
  const setFilterHideOwnedDesigns = useAppStore(s => s.setFilterHideOwnedDesigns);
  const filterHideOwnedStencils = useAppStore(s => s.filterHideOwnedStencils);
  const setFilterHideOwnedStencils = useAppStore(s => s.setFilterHideOwnedStencils);
  const resetProgress = useAppStore(s => s.resetProgress);
  const enabledSections = useAppStore(s => s.enabledSections);

  // Router guard (#102): if the active route belongs to a disabled section, redirect to stash
  useEffect(() => {
    const routeToSectionMap: Partial<Record<AppRoute, SectionId>> = {
      collections: 'blueprints',
      blueprints: 'blueprints',
      expeditions: 'expeditions',
      'reward-pass': 'reward-pass',
      raid: 'raid',
      maps: 'maps',
      'role-maker': 'role-maker',
    };
    const targetSection = routeToSectionMap[activeTab];
    if (targetSection && !isSectionActive(targetSection, { enabledSections })) {
      router.replace('stash');
    }
  }, [activeTab, enabledSections, router]);

  useEffect(() => {
    if (!isDev) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedDevChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const openListDetail = (id: string) => {
    router.push('list-detail', { id });
  };

  const handleOpenOverrides = (itemId: string) => {
    router.push('dev-overrides', { item: itemId });
  };

  const handleNavigate = (pageId: string) => {
    router.push(pageId as AppRoute);
  };

  // Azioni contestuali della pillola (...)
  const getContextActions = (): ContextAction[] => {
    if (activeTab === 'stash') {
      return [
        {
          icon: <EyeOff size={15} />,
          label: t('stash.hideCompleted'),
          onClick: () => setFilterHideCompleted(!filterHideCompleted),
          checked: filterHideCompleted,
        },
      ];
    }
    if ((activeTab === 'collections' || activeTab === 'blueprints') && isSectionActive('blueprints', { enabledSections })) {
      const tab = router.params.tab;
      if (tab === 'designs') {
        return [
          {
            icon: <EyeOff size={15} />,
            label: t('collections.hideOwned'),
            onClick: () => setFilterHideOwnedDesigns(!filterHideOwnedDesigns),
            checked: filterHideOwnedDesigns,
          },
        ];
      }
      if (tab === 'stencils') {
        return [
          {
            icon: <EyeOff size={15} />,
            label: t('collections.hideOwned'),
            onClick: () => setFilterHideOwnedStencils(!filterHideOwnedStencils),
            checked: filterHideOwnedStencils,
          },
        ];
      }
      if (tab === 'blueprints') {
        return [
          {
            icon: <EyeOff size={15} />,
            label: t('collections.hideOwned'),
            onClick: () => setFilterHideOwnedBlueprints(!filterHideOwnedBlueprints),
            checked: filterHideOwnedBlueprints,
          },
        ];
      }
      return [];
    }
    if (activeTab === 'raid') {
      return [
        ...(wakeLock.isSupported
          ? [
              {
                icon: <Sun size={15} />,
                label: 'Schermo sempre attivo',
                onClick: toggleKeepScreenOn,
                checked: keepScreenOn,
              },
            ]
          : []),
        {
          icon: <RotateCcw size={15} />,
          label: t('raid.reset'),
          onClick: () => setRaidAction('reset'),
          dividerBefore: wakeLock.isSupported,
        },
        {
          icon: <Trash2 size={15} />,
          label: t('raid.clear'),
          onClick: () => setRaidAction('clear'),
          variant: 'danger',
          dividerBefore: true,
        },
      ];
    }
    if (activeTab === 'liste') {
      return [
        {
          icon: <Plus size={15} />,
          label: t('lists.newListBtn'),
          onClick: () => setListsAction('create'),
        },
        {
          icon: <Upload size={15} />,
          label: t('lists.exportBackup'),
          onClick: () => setListsAction('export'),
        },
        {
          icon: <Download size={15} />,
          label: t('lists.importBackup'),
          onClick: () => setListsAction('import'),
        },
        {
          icon: <RotateCcw size={15} />,
          label: t('lists.resetProgress'),
          onClick: () => resetProgress(),
          variant: 'danger',
          dividerBefore: true,
        },
      ];
    }
    return [];
  };

  return (
    <ThemeProvider>
      <FloatingNavDockProvider>
      <div className="min-h-dvh bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans overflow-x-clip w-full">
        {isDev && activeTab === 'dev' ? (
          <Suspense fallback={<PageLoadingFallback />}>
            <DevDashboardPage onBack={() => router.back()} onNavigate={handleNavigate} />
          </Suspense>
        ) : isDev && activeTab === 'dev-overrides' ? (
          <Suspense fallback={<PageLoadingFallback />}>
            <DevOverridesPage
              onBack={() => router.back()}
              initialSelectedItemId={devOverrideItemId}
            />
          </Suspense>
        ) : isDev && activeTab === 'dev-translations' ? (
          <Suspense fallback={<PageLoadingFallback />}>
            <DevTranslationsPage onBack={() => router.back()} />
          </Suspense>
        ) : isDev && activeTab === 'dev-lists' ? (
          <Suspense fallback={<PageLoadingFallback />}>
            <DevListsPage onBack={() => router.back()} />
          </Suspense>
        ) : isDev && activeTab === 'dev-nav' ? (
          <Suspense fallback={<PageLoadingFallback />}>
            <DevNavPage onBack={() => router.back()} />
          </Suspense>
        ) : isDev && activeTab === 'dev-flags' ? (
          <Suspense fallback={<PageLoadingFallback />}>
            <DevFlagsPage onBack={() => router.back()} />
          </Suspense>
        ) : isDev && activeTab === 'dev-custom-items' ? (
          <Suspense fallback={<PageLoadingFallback />}>
            <DevCustomItemsPage onBack={() => router.back()} />
          </Suspense>
        ) : isDev && activeTab === 'dev-trash' ? (
          <Suspense fallback={<PageLoadingFallback />}>
            <DevTrashPage onBack={() => router.back()} />
          </Suspense>
        ) : isDev && activeTab === 'dev-base-items' ? (
          <Suspense fallback={<PageLoadingFallback />}>
            <DevBaseItemsPage onBack={() => router.back()} />
          </Suspense>
        ) : (
          <>
            <Suspense fallback={<PageLoadingFallback />}>
              {activeTab === 'stash' && <StashPage onOpenOverrides={handleOpenOverrides} />}
              {activeTab === 'liste' && (
                <ListsPage
                  action={listsAction}
                  onActionHandled={() => setListsAction(null)}
                  onOpenDetail={openListDetail}
                />
              )}
              {(activeTab === 'collections' || activeTab === 'blueprints') && isSectionActive('blueprints', { enabledSections }) && <CollectionsPage />}
              {activeTab === 'skills' && isSectionActive('skill-tree', { enabledSections }) && <SkillTreePage />}
              {activeTab === 'expeditions' && isSectionActive('expeditions', { enabledSections }) && <ExpeditionPage />}
              {activeTab === 'reward-pass' && isSectionActive('reward-pass', { enabledSections }) && (
                <RewardPassPage
                  passId={router.params.pass}
                  view={router.params.view}
                  onNavigate={(params) => router.push('reward-pass', params)}
                />
              )}
              {activeTab === 'raid' && isSectionActive('raid', { enabledSections }) && (
                <RaidPlanPage
                  action={raidAction}
                  onActionHandled={() => setRaidAction(null)}
                />
              )}
              {activeTab === 'items' && (
                <ItemsPage
                  onBack={() => router.back()}
                  onOpenOverrides={handleOpenOverrides}
                />
              )}
              {isDev && activeTab === 'maps' && isSectionActive('maps', { enabledSections }) && (
                <MapsPage onBack={() => router.back()} />
              )}
              {activeTab === 'settings' && (
                <SettingsPage onBack={() => router.back()} />
              )}
              {activeTab === 'list-detail' && detailListId && (
                <ListDetailPage listId={detailListId} onBack={() => router.back()} />
              )}
            </Suspense>

            {activeTab !== 'list-detail' && activeTab !== 'role-maker' && (
              <FloatingNavWithDock
                navVariant={navVariant}
                activePage={activeTab}
                onNavigate={handleNavigate}
                contextActions={getContextActions()}
              />
            )}
          </>
        )}

        {isSectionActive('reward-pass', { enabledSections }) && <InactivePassNotice />}

        {isSectionActive('role-maker', { enabledSections }) && (
          <Suspense fallback={null}>
            <RoleMakerModal
              isOpen={activeTab === 'role-maker'}
              onClose={() => router.back()}
            />
          </Suspense>
        )}
      </div>
      </FloatingNavDockProvider>
    </ThemeProvider>
  );
}

function FloatingNavWithDock({
  navVariant,
  activePage,
  onNavigate,
  contextActions,
}: {
  navVariant: string;
  activePage: string;
  onNavigate: (pageId: string) => void;
  contextActions: ContextAction[];
}) {
  const dock = useFloatingNavDock();
  if (navVariant === 'morphing') {
    return (
      <MorphingFloatingNav
        activePage={activePage}
        onNavigate={onNavigate}
        contextActions={contextActions}
        dock={dock}
      />
    );
  }
  return (
    <FloatingNav
      activePage={activePage}
      onNavigate={onNavigate}
      contextActions={contextActions}
      dock={dock}
    />
  );
}
