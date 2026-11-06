import { useEffect, useState } from 'react';
import { Download, EyeOff, Plus, RotateCcw, Upload, PackageCheck, Trash2 } from 'lucide-react';
import { ThemeProvider } from '@/context/ThemeProvider';
import { FloatingNav } from '@/components/FloatingNav';
import { MorphingFloatingNav } from '@/components/MorphingFloatingNav';
import type { ContextAction } from '@/components/FloatingNav';
import { RoleMakerModal } from '@/components/RoleMakerModal';
import { StashPage } from '@/pages/StashPage';
import { ListsPage } from '@/pages/ListsPage';
import type { ListsPageAction } from '@/pages/ListsPage';
import { BlueprintsPage } from '@/pages/BlueprintsPage';
import { ItemsPage } from '@/pages/ItemsPage';
import { MapsPage } from '@/pages/MapsPage';
import { DevCatalogLabPage } from '@/pages/DevCatalogLabPage';
import { DevOverridesPage } from '@/pages/DevOverridesPage';
import { DevTranslationsPage } from '@/pages/DevTranslationsPage';
import { DevListsPage } from '@/pages/DevListsPage';
import { DevNavPage } from '@/pages/DevNavPage';
import { DevFlagsPage } from '@/pages/DevFlagsPage';
import { DevCustomItemsPage } from '@/pages/DevCustomItemsPage';
import { DevTrashPage } from '@/pages/DevTrashPage';
import { DevHoldPage } from '@/pages/DevHoldPage';
import { DevBaseItemsPage } from '@/pages/DevBaseItemsPage';
import { DevDashboardPage } from '@/pages/DevDashboardPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ListDetailPage } from '@/pages/ListDetailPage';
import { ExpeditionPage } from '@/pages/ExpeditionPage';
import { RewardPassPage } from '@/pages/RewardPassPage';
import { RaidPlanPage } from '@/pages/RaidPlanPage';
import { useAppStore } from '@/store';
import { useTranslation } from '@/i18n';
import { useFeatureFlags } from '@/lib/featureFlags';
import { hasUnsavedDevChanges } from '@/lib/devDrafts';
import { AppFooter } from '@/components/AppFooter';
import { InactivePassNotice } from '@/components/pass/InactivePassNotice';
import { useRouter, type AppRoute } from '@/router';

const isDev = import.meta.env.DEV;

export default function App() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeTab = router.route;
  const detailListId = router.params.id || null;
  const devOverrideItemId = router.params.item || null;
  const { isEnabled: isFeatureEnabled } = useFeatureFlags();

  const [listsAction, setListsAction] = useState<ListsPageAction>(null);
  const [raidAction, setRaidAction] = useState<'apply' | 'reset' | 'clear' | null>(null);

  // Selettori Zustand
  const navVariant = useAppStore(s => s.navVariant);
  const filterHideCompleted = useAppStore(s => s.filterHideCompleted);
  const setFilterHideCompleted = useAppStore(s => s.setFilterHideCompleted);
  const filterHideOwnedBlueprints = useAppStore(s => s.filterHideOwnedBlueprints);
  const setFilterHideOwnedBlueprints = useAppStore(s => s.setFilterHideOwnedBlueprints);
  const resetProgress = useAppStore(s => s.resetProgress);

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
    if (activeTab === 'blueprints' && isFeatureEnabled('blueprints')) {
      return [
        {
          icon: <EyeOff size={15} />,
          label: t('blueprints.hideOwned'),
          onClick: () => setFilterHideOwnedBlueprints(!filterHideOwnedBlueprints),
          checked: filterHideOwnedBlueprints,
        },
      ];
    }
    if (activeTab === 'raid') {
      return [
        {
          icon: <PackageCheck size={16} />,
          label: t('raid.apply'),
          onClick: () => setRaidAction('apply'),
          variant: 'primary',
        },
        {
          icon: <RotateCcw size={15} />,
          label: t('raid.reset'),
          onClick: () => setRaidAction('reset'),
          dividerBefore: true,
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
      <div className="min-h-dvh bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans overflow-x-clip w-full">
        {isDev && activeTab === 'dev' ? (
          <DevDashboardPage onBack={() => router.back()} onNavigate={handleNavigate} />
        ) : isDev && activeTab === 'dev-overrides' ? (
          <DevOverridesPage
            onBack={() => router.back()}
            initialSelectedItemId={devOverrideItemId}
          />
        ) : isDev && activeTab === 'dev-translations' ? (
          <DevTranslationsPage onBack={() => router.back()} />
        ) : isDev && activeTab === 'dev-lists' ? (
          <DevListsPage onBack={() => router.back()} />
        ) : isDev && activeTab === 'dev-nav' ? (
          <DevNavPage onBack={() => router.back()} />
        ) : isDev && activeTab === 'dev-flags' ? (
          <DevFlagsPage onBack={() => router.back()} />
        ) : isDev && activeTab === 'dev-custom-items' ? (
          <DevCustomItemsPage onBack={() => router.back()} />
        ) : isDev && activeTab === 'dev-trash' ? (
          <DevTrashPage onBack={() => router.back()} />
        ) : isDev && activeTab === 'dev-hold' ? (
          <DevHoldPage onBack={() => router.back()} />
        ) : isDev && activeTab === 'dev-base-items' ? (
          <DevBaseItemsPage onBack={() => router.back()} />
        ) : (
          <>
            <main className="max-w-md md:max-w-3xl w-full mx-auto min-h-dvh">
              {activeTab === 'stash' && <StashPage onOpenOverrides={handleOpenOverrides} />}
              {activeTab === 'liste' && (
                <ListsPage
                  action={listsAction}
                  onActionHandled={() => setListsAction(null)}
                  onOpenDetail={openListDetail}
                />
              )}
              {activeTab === 'blueprints' && isFeatureEnabled('blueprints') && <BlueprintsPage />}
              {activeTab === 'expeditions' && isFeatureEnabled('expeditions') && <ExpeditionPage />}
              {activeTab === 'reward-pass' && isFeatureEnabled('reward-pass') && (
                <RewardPassPage
                  passId={router.params.pass}
                  view={router.params.view}
                  onNavigate={(params) => router.push('reward-pass', params)}
                />
              )}
              {activeTab === 'raid' && (
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
              {isDev && activeTab === 'maps' && (
                <MapsPage onBack={() => router.back()} />
              )}
              {isDev && activeTab === 'dev-lab' && (
                <DevCatalogLabPage
                  onBack={() => router.back()}
                  onOpenOverrides={handleOpenOverrides}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsPage onBack={() => router.back()} />
              )}
              {activeTab === 'list-detail' && detailListId && (
                <ListDetailPage listId={detailListId} onBack={() => router.back()} />
              )}
              <AppFooter />
            </main>

            {activeTab !== 'list-detail' && activeTab !== 'role-maker' && (
              navVariant === 'morphing' ? (
                <MorphingFloatingNav
                  activePage={activeTab}
                  onNavigate={handleNavigate}
                  contextActions={getContextActions()}
                />
              ) : (
                <FloatingNav
                  activePage={activeTab}
                  onNavigate={handleNavigate}
                  contextActions={getContextActions()}
                />
              )
            )}
          </>
        )}

        {isFeatureEnabled('reward-pass') && <InactivePassNotice />}

        {isFeatureEnabled('role-maker') && (
          <RoleMakerModal
            isOpen={activeTab === 'role-maker'}
            onClose={() => router.back()}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
