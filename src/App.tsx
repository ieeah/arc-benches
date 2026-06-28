import { useState, useRef } from 'react';
import { Download, EyeOff, Plus, RotateCcw, Upload, Users } from 'lucide-react';
import { ThemeProvider } from './context/ThemeProvider';
import { FloatingNav } from './components/FloatingNav';
import type { NavMenuItem } from './components/FloatingNav';
import { StashPage } from './pages/StashPage';
import { ListsPage } from './pages/ListsPage';
import type { ListsPageHandle } from './pages/ListsPage';
import { ItemsPage } from './pages/ItemsPage';
import { ListDetailPage } from './pages/ListDetailPage';
import { useAppStore } from './store';
import { safeLS } from './lib/safeStorage';

type Tab = 'stash' | 'liste' | 'items' | 'list-detail';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('stash');
  const [returnTab, setReturnTab] = useState<Tab>('stash');
  const [detailListId, setDetailListId] = useState<string | null>(null);
  const [navSide] = useState<'left' | 'right'>(() =>
    safeLS(() => (localStorage.getItem('nav-side') as 'left' | 'right' | null) ?? 'right', 'right')
  );

  const listsPageRef = useRef<ListsPageHandle>(null);

  // Selettori mirati: App non ri-renderizza su tap +/- o drag
  const filterHideCompleted = useAppStore(s => s.filterHideCompleted);
  const setFilterHideCompleted = useAppStore(s => s.setFilterHideCompleted);
  const resetProgress = useAppStore(s => s.resetProgress);
  const activeProfileName = useAppStore(
    s => s.profiles.find(p => p.id === s.activeProfileId)?.name ?? '—'
  );

  const openDatabase = () => { setReturnTab(activeTab); setActiveTab('items'); };
  const openListDetail = (id: string) => { setReturnTab(activeTab); setDetailListId(id); setActiveTab('list-detail'); };

  const stashMenuItems: NavMenuItem[] = [
    {
      icon: <EyeOff size={16} />,
      label: 'Nascondi completati',
      onClick: () => setFilterHideCompleted(!filterHideCompleted),
      checked: filterHideCompleted,
    },
  ];

  const listsMenuItems: NavMenuItem[] = [
    {
      icon: <Users size={16} />,
      label: activeProfileName,
      onClick: () => listsPageRef.current?.openProfiles(),
    },
    {
      icon: <Plus size={16} />,
      label: '+ Lista',
      onClick: () => listsPageRef.current?.createList(),
    },
    {
      icon: <Upload size={16} />,
      label: 'Esporta',
      onClick: () => listsPageRef.current?.openExport(),
    },
    {
      icon: <Download size={16} />,
      label: 'Importa',
      onClick: () => listsPageRef.current?.triggerImport(),
    },
    {
      icon: <RotateCcw size={16} />,
      label: 'Ripristina',
      onClick: () => resetProgress(),
      variant: 'danger',
      dividerBefore: true,
    },
  ];

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
        <main className="max-w-md mx-auto min-h-screen">
          {activeTab === 'stash' && <StashPage />}
          {activeTab === 'liste' && <ListsPage ref={listsPageRef} onOpenDetail={openListDetail} />}
          {activeTab === 'items' && <ItemsPage onBack={() => setActiveTab(returnTab)} />}
          {activeTab === 'list-detail' && detailListId && (
            <ListDetailPage listId={detailListId} onBack={() => setActiveTab(returnTab)} onOpenDatabase={openDatabase} />
          )}
        </main>

        {(activeTab === 'stash' || activeTab === 'liste') && (
          <FloatingNav
            activePage={activeTab as 'stash' | 'liste'}
            navSide={navSide}
            onNavigate={page => setActiveTab(page)}
            onOpenDatabase={openDatabase}
            pageMenuItems={activeTab === 'stash' ? stashMenuItems : listsMenuItems}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
