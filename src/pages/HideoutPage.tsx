import { useAppStore } from '../store';
import { SectionHeader } from '../components/SectionHeader';
import { ListCard } from '../components/ListCard';

export const HideoutPage = ({ onOpenDatabase }: { onOpenDatabase: () => void }) => {
  const store = useAppStore();
  const availableUpgrades = store.getAvailableUpgrades();
  const refinerLevel = store.getRefinerLevel();

  const totalRequired = store.getTotalRequiredMaterials();

  const activeLists = store.getActiveLists();
  const maxedLists = store.getMaxedLists();

  return (
    <div className="pb-28">
      <div className="p-4 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
        <SectionHeader title="Rifugio" onOpenDatabase={onOpenDatabase} />
      </div>

      <div className="p-4">
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
    </div>
  );
};
