import { useState } from 'react';
import { Download, EyeOff, Plus, RotateCcw, Upload } from 'lucide-react';
import { ThemeProvider } from '@/context/ThemeProvider';
import { FloatingNav } from '@/components/FloatingNav';
import type { ContextAction } from '@/components/FloatingNav';
import { RoleMakerModal } from '@/components/RoleMakerModal';
import { StashPage } from '@/pages/StashPage';
import { ListsPage } from '@/pages/ListsPage';
import type { ListsPageAction } from '@/pages/ListsPage';
import { BlueprintsPage } from '@/pages/BlueprintsPage';
import { ItemsPage } from '@/pages/ItemsPage';
import { DevCatalogLabPage } from '@/pages/DevCatalogLabPage';
import { DevOverridesPage } from '@/pages/DevOverridesPage';
import { DevTranslationsPage } from '@/pages/DevTranslationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ListDetailPage } from '@/pages/ListDetailPage';
import { useAppStore } from '@/store';
import { useTranslation } from '@/i18n';

const isDev = import.meta.env.DEV;

type Tab = 'stash' | 'liste' | 'blueprints' | 'items' | 'dev-lab' | 'dev-overrides' | 'dev-translations' | 'list-detail' | 'settings';

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('stash');
  const [returnTab, setReturnTab] = useState<Tab>('stash');
  const [detailListId, setDetailListId] = useState<string | null>(null);
  const [devOverrideItemId, setDevOverrideItemId] = useState<string | null>(null);
  const [isRoleMakerOpen, setIsRoleMakerOpen] = useState(false);
  const [listsAction, setListsAction] = useState<ListsPageAction>(null);

  // Selettori Zustand
  const filterHideCompleted = useAppStore(s => s.filterHideCompleted);
  const setFilterHideCompleted = useAppStore(s => s.setFilterHideCompleted);
  const filterHideOwnedBlueprints = useAppStore(s => s.filterHideOwnedBlueprints);
  const setFilterHideOwnedBlueprints = useAppStore(s => s.setFilterHideOwnedBlueprints);
  const resetProgress = useAppStore(s => s.resetProgress);

  const openListDetail = (id: string) => {
    setReturnTab(activeTab);
    setDetailListId(id);
    setActiveTab('list-detail');
  };

  const handleOpenOverrides = (itemId: string) => {
    setDevOverrideItemId(itemId);
    setReturnTab(activeTab);
    setActiveTab('dev-overrides');
  };

  const handleNavigate = (pageId: string) => {
    if (pageId === 'role-maker') {
      setIsRoleMakerOpen(true);
      return;
    }
    setReturnTab(activeTab);
    setActiveTab(pageId as Tab);
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
    if (activeTab === 'blueprints') {
      return [
        {
          icon: <EyeOff size={15} />,
          label: t('blueprints.hideOwned'),
          onClick: () => setFilterHideOwnedBlueprints(!filterHideOwnedBlueprints),
          checked: filterHideOwnedBlueprints,
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
      <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans overflow-x-hidden w-full">
        {isDev && activeTab === 'dev-overrides' ? (
          <DevOverridesPage
            onBack={() => setActiveTab(returnTab)}
            initialSelectedItemId={devOverrideItemId}
          />
        ) : isDev && activeTab === 'dev-translations' ? (
          <DevTranslationsPage onBack={() => setActiveTab(returnTab)} />
        ) : (
          <>
            <main className="max-w-md md:max-w-3xl w-full mx-auto min-h-screen">
              {activeTab === 'stash' && <StashPage onOpenOverrides={handleOpenOverrides} />}
              {activeTab === 'liste' && (
                <ListsPage
                  action={listsAction}
                  onActionHandled={() => setListsAction(null)}
                  onOpenDetail={openListDetail}
                />
              )}
              {activeTab === 'blueprints' && <BlueprintsPage />}
              {activeTab === 'items' && (
                <ItemsPage
                  onBack={() => setActiveTab(returnTab)}
                  onOpenOverrides={handleOpenOverrides}
                />
              )}
              {isDev && activeTab === 'dev-lab' && (
                <DevCatalogLabPage
                  onBack={() => setActiveTab(returnTab)}
                  onOpenOverrides={handleOpenOverrides}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsPage
                  onBack={() => setActiveTab(returnTab)}
                  onNavigate={handleNavigate}
                />
              )}
              {activeTab === 'list-detail' && detailListId && (
                <ListDetailPage listId={detailListId} onBack={() => setActiveTab(returnTab)} />
              )}
            </main>

            {activeTab !== 'list-detail' && (
              <FloatingNav
                activePage={activeTab}
                onNavigate={handleNavigate}
                contextActions={getContextActions()}
              />
            )}
          </>
        )}

        <RoleMakerModal
          isOpen={isRoleMakerOpen}
          onClose={() => setIsRoleMakerOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
}
