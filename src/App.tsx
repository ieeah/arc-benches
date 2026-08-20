import { useState, useRef } from 'react';
import { Backpack, Database, Dice5, Download, EyeOff, FlaskConical, LayoutList, Plus, RotateCcw, Settings, Upload, Wrench } from 'lucide-react';
import { ThemeProvider } from './context/ThemeProvider';
import { FloatingNav } from './components/FloatingNav';
import type { ContextAction, NavItem } from './components/FloatingNav';
import { RoleMakerModal } from './components/RoleMakerModal';
import { StashPage } from './pages/StashPage';
import { ListsPage } from './pages/ListsPage';
import type { ListsPageHandle } from './pages/ListsPage';
import { ItemsPage } from './pages/ItemsPage';
import { DevCatalogLabPage } from './pages/DevCatalogLabPage';
import { SettingsPage } from './pages/SettingsPage';
import { ListDetailPage } from './pages/ListDetailPage';
import { useAppStore } from './store';

const isDev = import.meta.env.DEV;

type Tab = 'stash' | 'liste' | 'items' | 'dev-lab' | 'list-detail' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('stash');
  const [returnTab, setReturnTab] = useState<Tab>('stash');
  const [detailListId, setDetailListId] = useState<string | null>(null);
  const [isRoleMakerOpen, setIsRoleMakerOpen] = useState(false);

  const listsPageRef = useRef<ListsPageHandle>(null);

  // Selettori Zustand
  const filterHideCompleted = useAppStore(s => s.filterHideCompleted);
  const setFilterHideCompleted = useAppStore(s => s.setFilterHideCompleted);
  const resetProgress = useAppStore(s => s.resetProgress);

  const openListDetail = (id: string) => {
    setReturnTab(activeTab);
    setDetailListId(id);
    setActiveTab('list-detail');
  };

  const navTree: NavItem[] = [
    { id: 'stash', label: 'Stash', icon: <Backpack size={20} /> },
    { id: 'liste', label: 'Banchi & Liste', icon: <LayoutList size={20} /> },
    {
      id: 'tools',
      label: 'Strumenti',
      icon: <Wrench size={20} />,
      isCategory: true,
      children: [
        { id: 'items', label: 'Database Oggetti', icon: <Database size={18} /> },
        { id: 'role-maker', label: 'Role Maker 🎲', icon: <Dice5 size={18} /> },
        ...(isDev ? [{ id: 'dev-lab', label: 'Dev Catalog Lab 🧪', icon: <FlaskConical size={18} /> }] : []),
      ],
    },
    { id: 'settings', label: 'Impostazioni', icon: <Settings size={20} /> },
  ];

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
          label: 'Nascondi completati',
          onClick: () => setFilterHideCompleted(!filterHideCompleted),
          checked: filterHideCompleted,
        },
      ];
    }
    if (activeTab === 'liste') {
      return [
        {
          icon: <Plus size={15} />,
          label: '+ Nuova Lista',
          onClick: () => listsPageRef.current?.createList(),
        },
        {
          icon: <Upload size={15} />,
          label: 'Esporta Backup JSON',
          onClick: () => listsPageRef.current?.openExport(),
        },
        {
          icon: <Download size={15} />,
          label: 'Importa Backup JSON',
          onClick: () => listsPageRef.current?.triggerImport(),
        },
        {
          icon: <RotateCcw size={15} />,
          label: 'Ripristina Progressi',
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
        <main className="max-w-md w-full mx-auto min-h-screen">
          {activeTab === 'stash' && <StashPage />}
          {activeTab === 'liste' && <ListsPage ref={listsPageRef} onOpenDetail={openListDetail} />}
          {activeTab === 'items' && <ItemsPage onBack={() => setActiveTab(returnTab)} />}
          {isDev && activeTab === 'dev-lab' && <DevCatalogLabPage onBack={() => setActiveTab(returnTab)} />}
          {activeTab === 'settings' && <SettingsPage onBack={() => setActiveTab(returnTab)} />}
          {activeTab === 'list-detail' && detailListId && (
            <ListDetailPage listId={detailListId} onBack={() => setActiveTab(returnTab)} />
          )}
        </main>

        {activeTab !== 'list-detail' && (
          <FloatingNav
            activePage={activeTab}
            onNavigate={handleNavigate}
            contextActions={getContextActions()}
            items={navTree}
          />
        )}

        <RoleMakerModal
          isOpen={isRoleMakerOpen}
          onClose={() => setIsRoleMakerOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
}
