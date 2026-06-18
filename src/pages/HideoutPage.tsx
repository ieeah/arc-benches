import { useAppStore } from '../store';
import { SectionHeader } from '../components/SectionHeader';
import { ListCard } from '../components/ListCard';

export const HideoutPage = ({ onOpenDatabase }: { onOpenDatabase: () => void }) => {
  const store = useAppStore();
  const orderedLists = store.getOrderedLists();
  const availableUpgrades = store.getAvailableUpgrades();
  const refinerLevel = store.hideoutLevels['refiner'] ?? 0;

  const totalRequired = store.getTotalRequiredMaterials();

  const activeLists = orderedLists.filter(list => (store.hideoutLevels[list.id] ?? 0) < list.maxLevel);
  const maxedLists = orderedLists.filter(list => (store.hideoutLevels[list.id] ?? 0) >= list.maxLevel);

  return (
    <div className="p-4 pb-28">
      <div className="mb-4">
        <SectionHeader title="Rifugio" onOpenDatabase={onOpenDatabase} />
      </div>

      {activeLists.map(list => (
        <ListCard key={list.id} list={list}
          currentLevel={store.hideoutLevels[list.id] ?? 0}
          itemsInfo={store.itemsInfo}
          refinerLevel={refinerLevel}
          inventory={store.inventory}
          totalRequired={totalRequired}
          canUpgrade={availableUpgrades.includes(list.id)}
          onUpgrade={() => store.upgradeModule(list.id)}
        />
      ))}

      {maxedLists.length > 0 && (
        <>
          <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mt-4 mb-2 px-1">Completati</p>
          {maxedLists.map(list => (
            <ListCard key={list.id} list={list}
              currentLevel={store.hideoutLevels[list.id] ?? 0}
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
