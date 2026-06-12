import { useState } from 'react';
import { Backpack, Home, Settings as SettingsIcon } from 'lucide-react';
import { ThemeProvider } from './context/ThemeProvider';
import { TabButton } from './components/TabButton';
import { StashPage } from './pages/StashPage';
import { HideoutPage } from './pages/HideoutPage';
import { GoalsPage } from './pages/GoalsPage';
import { ItemsPage } from './pages/ItemsPage';

/** 'items' is a hidden section (not in the bottom nav) — will become the "Database" hub later. */
type Tab = 'stash' | 'rifugio' | 'settings' | 'items';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('stash');
  const [returnTab, setReturnTab] = useState<Tab>('stash');

  const openDatabase = () => { setReturnTab(activeTab); setActiveTab('items'); };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
        <main className="max-w-md mx-auto min-h-screen">
          {activeTab === 'stash' && <StashPage onOpenDatabase={openDatabase} />}
          {activeTab === 'rifugio' && <HideoutPage onOpenDatabase={openDatabase} />}
          {activeTab === 'settings' && <GoalsPage onOpenDatabase={openDatabase} />}
          {activeTab === 'items' && <ItemsPage onBack={() => setActiveTab(returnTab)} />}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 pb-safe">
          <div className="max-w-md mx-auto flex">
            <TabButton active={activeTab === 'stash'} onClick={() => setActiveTab('stash')} icon={Backpack} label="Stash" />
            <TabButton active={activeTab === 'rifugio'} onClick={() => setActiveTab('rifugio')} icon={Home} label="Rifugio" />
            <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={SettingsIcon} label="Obiettivi" />
          </div>
        </nav>
      </div>
    </ThemeProvider>
  );
}
