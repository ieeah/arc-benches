import { useAppStore } from '../store';
import { SectionHeader } from '../components/SectionHeader';
import { WorkbenchCard } from '../components/WorkbenchCard';

export const HideoutPage = ({ onOpenDatabase }: { onOpenDatabase: () => void }) => {
  const store = useAppStore();
  const orderedWorkbenches = store.getOrderedWorkbenches();
  const availableUpgrades = store.getAvailableUpgrades();
  const refinerLevel = store.hideoutLevels['refiner'] ?? 0;

  const totalRequired = store.getTotalRequiredMaterials();

  const activeWBs = orderedWorkbenches.filter(wb => (store.hideoutLevels[wb.id] ?? 0) < wb.maxLevel);
  const maxedWBs = orderedWorkbenches.filter(wb => (store.hideoutLevels[wb.id] ?? 0) >= wb.maxLevel);

  return (
    <div className="p-4 pb-28">
      <div className="mb-4">
        <SectionHeader title="Rifugio" onOpenDatabase={onOpenDatabase} />
      </div>

      {activeWBs.map(wb => (
        <WorkbenchCard key={wb.id} wb={wb}
          currentLevel={store.hideoutLevels[wb.id] ?? 0}
          itemsInfo={store.itemsInfo}
          refinerLevel={refinerLevel}
          inventory={store.inventory}
          totalRequired={totalRequired}
          canUpgrade={availableUpgrades.includes(wb.id)}
          onUpgrade={() => store.upgradeModule(wb.id)}
        />
      ))}

      {maxedWBs.length > 0 && (
        <>
          <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mt-4 mb-2 px-1">Completati</p>
          {maxedWBs.map(wb => (
            <WorkbenchCard key={wb.id} wb={wb}
              currentLevel={store.hideoutLevels[wb.id] ?? 0}
              itemsInfo={store.itemsInfo}
              refinerLevel={refinerLevel}
              inventory={store.inventory}
              totalRequired={totalRequired}
              canUpgrade={false}
              onUpgrade={() => {}}
            />
          ))}
        </>
      )}
    </div>
  );
};
