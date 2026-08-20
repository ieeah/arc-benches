import { useMemo } from 'react';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { SectionHeader } from '@/components/SectionHeader';
import { ListControls } from '@/components/ListControls';
import { BlueprintCard } from '@/components/BlueprintCard';
import { useListManager } from '@/hooks/useListManager';
import type { SortOption } from '@/hooks/useListManager';
import { getAllBlueprintsPure, getBlueprintProgressPure } from '@/store/selectors';
import type { ItemInfo } from '@/types';

export const BlueprintsPage = () => {
  const itemsInfo = useAppStore(s => s.itemsInfo);
  const ownedBlueprints = useAppStore(s => s.ownedBlueprints);
  const filterHideOwned = useAppStore(s => s.filterHideOwnedBlueprints);
  const toggleBlueprintOwned = useAppStore(s => s.toggleBlueprintOwned);
  const setFilterHideOwned = useAppStore(s => s.setFilterHideOwnedBlueprints);

  // Tutti i blueprint statici
  const allBlueprints = useMemo(() => {
    return getAllBlueprintsPure(itemsInfo);
  }, [itemsInfo]);

  // Calcolo progresso sblocco (X / 83)
  const { ownedCount, totalCount, percentage } = useMemo(() => {
    return getBlueprintProgressPure(allBlueprints, ownedBlueprints);
  }, [allBlueprints, ownedBlueprints]);

  // Opzioni di ordinamento con supporto toggle A-Z <-> Z-A e Mancanti <-> Sbloccati
  const sortOptions: SortOption<ItemInfo>[] = useMemo(() => [
    {
      id: 'name_asc',
      label: 'A-Z',
      compare: (a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }),
      toggleId: 'name_desc',
    },
    {
      id: 'name_desc',
      label: 'Z-A',
      compare: (a, b) => b.name.localeCompare(a.name, 'it', { sensitivity: 'base' }),
      toggleId: 'name_asc',
      hideFromUi: true,
    },
    {
      id: 'owned_last',
      label: 'Mancanti',
      compare: (a, b) => {
        const aOwned = ownedBlueprints[a.id] ? 1 : 0;
        const bOwned = ownedBlueprints[b.id] ? 1 : 0;
        return aOwned - bOwned || a.name.localeCompare(b.name, 'it');
      },
      toggleId: 'owned_first',
    },
    {
      id: 'owned_first',
      label: 'Sbloccati',
      compare: (a, b) => {
        const aOwned = ownedBlueprints[a.id] ? 1 : 0;
        const bOwned = ownedBlueprints[b.id] ? 1 : 0;
        return bOwned - aOwned || a.name.localeCompare(b.name, 'it');
      },
      toggleId: 'owned_last',
      hideFromUi: true,
    },
  ], [ownedBlueprints]);

  // Filtra gli elementi se filterHideOwned è attivo
  const displayedBlueprints = useMemo(() => {
    if (!filterHideOwned) return allBlueprints;
    return allBlueprints.filter(bp => !ownedBlueprints[bp.id]);
  }, [allBlueprints, filterHideOwned, ownedBlueprints]);

  // List Manager con search debounce e ordinamento
  const {
    query,
    setQuery,
    activeSortId,
    setActiveSortId,
    processedItems,
  } = useListManager<ItemInfo>({
    items: displayedBlueprints,
    search: {
      fields: (bp) => [bp.name, bp.id, bp.subcategory ?? ''],
      debounceMs: 200,
    },
    sorting: {
      options: sortOptions,
      defaultSortId: 'name_asc',
    },
  });

  return (
    <div className="pb-36 w-full min-w-0">
      {/* ── HEADER STICKY CON TITOLO, PROGRESSO COMPATTO E CONTROLLI ── */}
      <div className="p-4 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800 space-y-2.5">
        <SectionHeader
          title="Progetti Blueprints"
          actions={
            <button
              onClick={() => setFilterHideOwned(!filterHideOwned)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all border shadow-xs cursor-pointer active:scale-95 ${
                filterHideOwned
                  ? 'bg-blue-500 text-white border-blue-500 shadow-blue-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
              }`}
              title={filterHideOwned ? 'Mostra tutti i progetti' : 'Mostra solo progetti mancanti'}
              aria-label={filterHideOwned ? 'Mostra tutti i progetti' : 'Mostra solo progetti mancanti'}
            >
              {filterHideOwned ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden sm:inline">{filterHideOwned ? 'Solo Mancanti' : 'Tutti'}</span>
            </button>
          }
        />

        {/* ── PROGRESSO COMPATTO NELL'HEADER ── */}
        <div className="space-y-1">
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              <strong className="text-blue-500 font-bold font-mono text-xs">{ownedCount}</strong> / {totalCount} Progetti
            </span>
            <span>
              {ownedCount === totalCount && totalCount > 0 ? (
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Completa!
                </span>
              ) : (
                `${totalCount - ownedCount} ancora da sbloccare`
              )}
            </span>
          </div>
        </div>

        <ListControls
          query={query}
          setQuery={setQuery}
          activeCategoryId=""
          setActiveCategoryId={() => {}}
          activeSortId={activeSortId}
          setActiveSortId={setActiveSortId}
          groupByEnabled={false}
          setGroupByEnabled={() => {}}
          categories={[]}
          sortOptions={sortOptions}
          searchPlaceholder="Cerca blueprint..."
          items={displayedBlueprints}
          sortType="pills"
        />
      </div>

      <div className="p-4 max-w-xl mx-auto">
        {/* ── GRIGLIA BLUEPRINTS (Con Content-Visibility Ottimizzata #39) ── */}
        {processedItems.length === 0 ? (
          <div className="p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] text-center space-y-2">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Nessun blueprint trovato</p>
            <p className="text-xs text-gray-400">
              {filterHideOwned
                ? 'Tutti i blueprint in questa visualizzazione sono già stati sbloccati!'
                : 'Prova a modificare il termine di ricerca.'}
            </p>
          </div>
        ) : (
          <div
            data-list-container
            className="grid grid-cols-2 gap-3"
          >
            {processedItems.map(bp => (
              <BlueprintCard
                key={bp.id}
                blueprint={bp}
                isOwned={Boolean(ownedBlueprints[bp.id])}
                onToggleOwned={() => toggleBlueprintOwned(bp.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
