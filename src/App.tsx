import { useEffect, useState, useRef } from 'react';
import { useAppStore } from './store';
import { Backpack, Home, Settings as SettingsIcon, Plus, Minus, CheckCircle2 } from 'lucide-react';
import type { HideoutResponse, ItemsResponse, ItemInfo } from './types';

// --- HELPERS ---

const useLongPress = (callback: () => void, ms = 100) => {
  const [startLongPress, setStartLongPress] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (startLongPress) {
      timerRef.current = setInterval(callback, ms);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [startLongPress, callback, ms]);

  return {
    onMouseDown: () => setStartLongPress(true),
    onMouseUp: () => setStartLongPress(false),
    onMouseLeave: () => setStartLongPress(false),
    onTouchStart: () => setStartLongPress(true),
    onTouchEnd: () => setStartLongPress(false),
  };
};

const getRarityStyles = (rarity: string | undefined) => {
  const r = rarity?.toLowerCase() || 'common';
  switch (r) {
    case 'common': return { color: 'bg-gray-400', glow: 'shadow-[0_8px_20px_-4px_rgba(156,163,175,0.6)]' };
    case 'uncommon': return { color: 'bg-green-500', glow: 'shadow-[0_8px_20px_-4px_rgba(34,197,94,0.6)]' };
    case 'rare': return { color: 'bg-blue-500', glow: 'shadow-[0_8px_20px_-4px_rgba(59,130,246,0.6)]' };
    case 'epic': return { color: 'bg-purple-500', glow: 'shadow-[0_8px_20px_-4px_rgba(168,85,247,0.6)]' };
    case 'legendary': return { color: 'bg-orange-500', glow: 'shadow-[0_8px_20px_-4px_rgba(249,115,22,0.6)]' };
    default: return { color: 'bg-gray-400', glow: 'shadow-[0_8px_20px_-4px_rgba(156,163,175,0.3)]' };
  }
};

// --- COMPONENTS ---

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${active ? 'text-blue-500' : 'text-gray-500'}`}
  >
    <Icon size={24} />
    <span className="text-xs mt-1">{label}</span>
  </button>
);

const InventoryCard = ({ itemId, owned, required, itemInfo, onIncrement, onDecrement, onSet }: any) => {
  const isCompleted = owned >= required;
  const longPressInc = useLongPress(onIncrement);
  const longPressDec = useLongPress(onDecrement);
  const styles = getRarityStyles(itemInfo?.rarity);

  const displayName = typeof itemInfo?.name === 'object' 
    ? (itemInfo.name.it || itemInfo.name.en) 
    : (itemInfo?.name || itemId.replace(/_/g, ' '));

  return (
    <div className={`flex flex-col p-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all ${isCompleted ? 'opacity-40 grayscale-[0.8]' : ''}`}>
      <div className={`relative mb-2 aspect-square rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${!isCompleted ? styles.glow : ''}`}>
        <div className="w-12 h-12 flex items-center justify-center">
          {itemInfo?.imageFilename || itemInfo?.icon ? (
            <img src={itemInfo.imageFilename || itemInfo.icon} alt={itemId} className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-[10px] text-gray-400 text-center px-1 leading-tight break-all">
              {itemId.replace(/_/g, '\n')}
            </div>
          )}
        </div>
        {isCompleted && (
          <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-green-500 bg-white dark:bg-black rounded-full shadow-lg" />
          </div>
        )}
        <div className={`absolute bottom-0 left-0 right-0 h-2 ${styles.color}`} />
      </div>
      
      <div className="flex-1 min-w-0 mb-2 text-center">
        <h4 className="text-[10px] font-bold truncate capitalize leading-tight mb-1">
          {displayName}
        </h4>
        <p className="text-[10px] text-gray-400 font-bold font-mono">
          {owned}/{required}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onContextMenu={(e) => e.preventDefault()}
          onClick={onDecrement} 
          {...longPressDec}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md active:scale-95 transition-transform"
        >
          <Minus size={14} />
        </button>
        <input 
          type="number"
          value={owned}
          onChange={(e) => onSet(parseInt(e.target.value) || 0)}
          className="flex-1 w-full text-center font-bold bg-transparent border-0 p-0 focus:ring-0 text-xs"
        />
        <button 
          onContextMenu={(e) => e.preventDefault()}
          onClick={onIncrement} 
          {...longPressInc}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md active:scale-95 transition-transform"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

const ModuleCard = ({ mod, currentLevel, targetLevel, onUpgrade, canUpgrade }: any) => {
  const nextLevel = currentLevel + 1;
  const nextLevelData = mod.levels.find((l: any) => l.level === nextLevel);

  return (
    <div className={`p-4 mb-4 rounded-2xl border-2 transition-all ${canUpgrade ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg">{mod.name.it || mod.name.en}</h3>
          <p className="text-sm text-gray-500">Livello: {currentLevel} → {targetLevel}</p>
        </div>
        {canUpgrade && (
          <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Disponibile</span>
        )}
      </div>

      {nextLevelData && (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-wider">Requisiti Prossimo Livello ({nextLevel}):</p>
          <div className="grid grid-cols-2 gap-2">
            {nextLevelData.requirementItemIds.map((req: any) => (
              <div key={req.itemId} className="text-[11px] flex justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                <span className="truncate mr-1 capitalize">{req.itemId.replace(/_/g, ' ')}</span>
                <span className="font-mono font-bold">{req.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {canUpgrade && (
        <button 
          onClick={onUpgrade}
          className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
        >
          <CheckCircle2 size={20} />
          COMPLETA POTENZIAMENTO
        </button>
      )}
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'stash' | 'rifugio' | 'settings'>('stash');
  const store = useAppStore();

  useEffect(() => {
    // Fetch Hideout
    fetch('https://arcdata.mahcks.com/v1/hideout?full=true')
      .then(res => res.json())
      .then((data: HideoutResponse) => {
        store.setModules(data.items);
      })
      .catch(err => console.error("Failed to fetch hideout", err));

    // Fetch Items from BOTH sources to maximize coverage
    const fetchItems = async () => {
      const allItems: Record<string, any> = {};

      try {
        // 1. Mahcks (Official-like IDs)
        const res1 = await fetch('https://arcdata.mahcks.com/v1/items?full=true');
        const data1 = await res1.json();
        data1.items.forEach((item: any) => {
          allItems[item.id] = item;
        });
      } catch (e) { console.error("Mahcks fail", e); }

      try {
        // 2. MetaForge (Community data)
        const res2 = await fetch('https://metaforge.app/api/arc-raiders/items?limit=1000');
        const data2 = await res2.json();
        data2.data.forEach((item: any) => {
          const normId = item.id.replace(/-/g, '_');
          // Only add if not already present or if this source has more info
          if (!allItems[normId] || !allItems[normId].icon) {
            allItems[normId] = { ...item, id: normId };
          }
        });
      } catch (e) { console.error("MetaForge fail", e); }

      store.setItemsInfo(Object.values(allItems));
    };

    fetchItems();
  }, []);

  const missingMaterials = store.getMissingMaterials();
  const availableUpgrades = store.getAvailableUpgrades();

  const renderTab = () => {
    switch (activeTab) {
      case 'stash':
        return (
          <div className="pb-24">
            <div className="p-4 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b dark:border-gray-800">
              <h1 className="text-2xl font-bold">Stash</h1>
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={store.filterHideCompleted} 
                  onChange={(e) => store.setFilterHideCompleted(e.target.checked)}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                Nascondi completati
              </label>
            </div>
            <div className="p-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {missingMaterials
                .filter(m => !store.filterHideCompleted || !m.isCompleted)
                .map(mat => (
                  <InventoryCard 
                    key={mat.itemId}
                    {...mat}
                    itemInfo={store.itemsInfo[mat.itemId]}
                    onIncrement={() => store.incrementItem(mat.itemId)}
                    onDecrement={() => store.decrementItem(mat.itemId)}
                    onSet={(val: number) => store.setItemCount(mat.itemId, val)}
                  />
                ))}
            </div>
            {missingMaterials.length === 0 && (
              <div className="p-20 text-center text-gray-500 italic text-sm">
                Nessun materiale richiesto per gli obiettivi attuali.
              </div>
            )}
          </div>
        );
      case 'rifugio':
        return (
          <div className="p-4 pb-24">
            <h1 className="text-2xl font-bold mb-6">Rifugio</h1>
            {store.modules.map(mod => (
              <ModuleCard 
                key={mod.id}
                mod={mod}
                currentLevel={store.hideoutLevels[mod.id] || 0}
                targetLevel={store.targetLevels[mod.id] || 0}
                canUpgrade={availableUpgrades.includes(mod.id)}
                onUpgrade={() => store.upgradeModule(mod.id)}
              />
            ))}
          </div>
        );
      case 'settings':
        return (
          <div className="p-4 pb-24">
            <h1 className="text-2xl font-bold mb-6">Obiettivi</h1>
            {store.modules.map(mod => (
              <div key={mod.id} className="mb-6 p-4 border dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">{mod.name.it || mod.name.en}</h3>
                  <input 
                    type="checkbox" 
                    checked={store.activeModules[mod.id]} 
                    onChange={() => store.toggleModuleActive(mod.id)}
                    className="w-6 h-6 rounded-full border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-2">
                      <span>Livello Attuale</span>
                      <span className="text-blue-500 bg-blue-500/10 px-2 rounded">{store.hideoutLevels[mod.id] || 0}</span>
                    </div>
                    <input 
                      type="range" min="0" max={mod.maxLevel} 
                      value={store.hideoutLevels[mod.id] || 0}
                      onChange={(e) => store.setModuleCurrentLevel(mod.id, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-2">
                      <span>Livello Obiettivo</span>
                      <span className="text-green-500 bg-green-500/10 px-2 rounded">{store.targetLevels[mod.id] || 0}</span>
                    </div>
                    <input 
                      type="range" min="0" max={mod.maxLevel} 
                      value={store.targetLevels[mod.id] || 0}
                      onChange={(e) => store.setModuleTargetLevel(mod.id, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
      <main className="max-w-md mx-auto min-h-screen">
        {renderTab()}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 pb-safe">
        <div className="max-w-md mx-auto flex">
          <TabButton 
            active={activeTab === 'stash'} 
            onClick={() => setActiveTab('stash')} 
            icon={Backpack} 
            label="Stash" 
          />
          <TabButton 
            active={activeTab === 'rifugio'} 
            onClick={() => setActiveTab('rifugio')} 
            icon={Home} 
            label="Rifugio" 
          />
          <TabButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={SettingsIcon} 
            label="Obiettivi" 
          />
        </div>
      </nav>
    </div>
  );
}
