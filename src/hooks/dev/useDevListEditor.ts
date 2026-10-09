import { useCallback } from 'react';
import type { List, ListType, ListLevel } from '@/types';
import { generateUUID } from '@/lib/uuid';
import { addToTrash } from '@/lib/devTrash';
import { DEFAULT_PASS_TRACKS, isExpedition } from '@/lib/lists';
import type { ListsDataMap } from './useDevListDrafts';

interface UseDevListEditorOptions {
  listsData: ListsDataMap;
  setListsData: React.Dispatch<React.SetStateAction<ListsDataMap>>;
  initialData: ListsDataMap;
  selectedListId: string | null;
  setSelectedListId: (id: string | null) => void;
  setActiveLevelNumber: (n: number) => void;
  /** Chiamata quando il cestino Dev cambia (lista eliminata), per aggiornare chi lo mostra. */
  onTrashChanged?: () => void;
  setConfirmModalConfig: (cfg: {
    title?: string;
    message: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null) => void;
}

/**
 * Espone le operazioni CRUD sulle liste dev:
 * creazione, duplicazione, eliminazione, ripristino (lista e livello),
 * aggiunta/rimozione livelli.
 *
 * Non gestisce la persistenza (affidata a useDevListDrafts)
 * né lo stato di editing inline (rimasto in DevListsPage).
 *
 * Il bucket in listsData è determinato da list.listType.
 */
export function useDevListEditor({
  listsData,
  setListsData,
  initialData,
  selectedListId,
  setSelectedListId,
  setActiveLevelNumber,
  onTrashChanged,
  setConfirmModalConfig,
}: UseDevListEditorOptions) {
  // Derivato: lista selezionata (listType sempre garantito)
  const allLists = Object.entries(listsData).flatMap(([type, lists]) =>
    (lists as List[]).map((l) => ({ ...l, listType: l.listType || (type as ListType) }) as List)
  );
  const selectedList = allLists.find((l) => l.id === selectedListId) ?? null;

  // Il bucket è determinato da listType
  const getBucket = (list: List): ListType => list.listType;

  // Aggiornamento generico della lista selezionata
  const updateSelectedList = useCallback(
    (updater: (prev: List) => List) => {
      if (!selectedList) return;
      const bucket = getBucket(selectedList);
      setListsData((prev) => {
        const bucketLists = prev[bucket] || [];
        const index = bucketLists.findIndex((l) => l.id === selectedList.id);
        if (index === -1) return prev;
        const updated = updater(bucketLists[index]);
        if (updated.id !== selectedList.id) {
          setSelectedListId(updated.id);
        }
        // Cambio di tipo: la lista passa al gruppo (e quindi al file) del nuovo tipo, altrimenti
        // resterebbe in quello vecchio e le modifiche successive non la troverebbero più.
        if (updated.listType !== bucket) {
          return {
            ...prev,
            [bucket]: bucketLists.filter((l) => l.id !== selectedList.id),
            [updated.listType]: [...(prev[updated.listType] || []), updated],
          };
        }
        const nextBucketLists = [...bucketLists];
        nextBucketLists[index] = updated;
        return { ...prev, [bucket]: nextBucketLists };
      });
    },
    [selectedList, setListsData, setSelectedListId],
  );

  // Crea nuova lista
  const handleCreateList = (type: ListType = 'project') => {
    const count = (listsData[type] || []).length + 1;
    let newId = `${type}-${count}`;
    let expIndex: number | undefined;

    if (type === 'expedition') {
      const existingIndices = (listsData.expedition || [])
        .filter(isExpedition)
        .map((e) => e.expeditionIndex)
        .filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0);
      let nextIndex = 1;
      while (existingIndices.includes(nextIndex)) nextIndex++;
      expIndex = nextIndex;
      newId = `expedition-${nextIndex}`;
    }

    const newList = {
      id: newId,
      name: type === 'expedition' ? `Expedition #${expIndex}` : `New ${type.toUpperCase()} List #${count}`,
      translations: {
        it: {
          name: type === 'expedition' ? `Spedizione #${expIndex}` : `Nuova Lista ${type.toUpperCase()} #${count}`,
        },
      },
      maxLevel: 1,
      listType: type,
      ...(type === 'pass' ? { tracks: DEFAULT_PASS_TRACKS.map((t) => ({ ...t })) } : {}),
      ...(expIndex !== undefined ? { expeditionIndex: expIndex } : {}),
      // ogni nuova lista parte da un solo livello: gli altri si aggiungono dall'editor
      levels: [{ level: 1, requirementItemIds: [] }],
      // il tipo è scelto a runtime: i campi specifici (expeditionIndex) sono aggiunti sopra solo per le spedizioni
    } as List;
    setListsData((prev) => ({ ...prev, [type]: [...(prev[type] || []), newList] }));
    setSelectedListId(newId);
    setActiveLevelNumber(1);
  };

  // Duplica lista
  const handleDuplicateList = (sourceList: List) => {
    const bucket = getBucket(sourceList);
    const existingIds = new Set(
      Object.values(listsData).flatMap((arr) => (arr || []).map((l) => l.id))
    );

    let copyNum = 1;
    let newId = `${sourceList.id}-copy`;
    while (existingIds.has(newId)) {
      copyNum++;
      newId = `${sourceList.id}-copy-${copyNum}`;
    }

    const clonedList: List = JSON.parse(JSON.stringify(sourceList));
    clonedList.id = newId;
    clonedList.name = `${sourceList.name} (Copia)`;
    if (clonedList.translations?.it?.name) {
      clonedList.translations.it.name = `${clonedList.translations.it.name} (Copia)`;
    }

    if (bucket === 'expedition' && isExpedition(clonedList)) {
      const existingIndices = (listsData.expedition || [])
        .filter(isExpedition)
        .map((e) => e.expeditionIndex)
        .filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0);
      let nextIndex = 1;
      while (existingIndices.includes(nextIndex)) nextIndex++;
      clonedList.expeditionIndex = nextIndex;
      clonedList.id = `expedition-${nextIndex}`;
      while (existingIds.has(clonedList.id)) {
        nextIndex++;
        clonedList.id = `expedition-${nextIndex}`;
      }
      clonedList.name = `Expedition #${nextIndex}`;
      if (clonedList.translations?.it?.name) {
        clonedList.translations.it.name = `Spedizione #${nextIndex}`;
      }
    }

    // Refresh action IDs to prevent duplicates
    if (clonedList.levels) {
      clonedList.levels = clonedList.levels.map((lvl) => ({
        ...lvl,
        actions: lvl.actions?.map((act) => ({ ...act, id: generateUUID() })),
        tieredActions: lvl.tieredActions?.map((tact) => ({
          ...tact,
          id: generateUUID(),
          steps: tact.steps?.map((s) => ({ ...s, id: generateUUID() })),
        })),
      }));
    }

    setListsData((prev) => ({ ...prev, [bucket]: [...(prev[bucket] || []), clonedList] }));
    setSelectedListId(clonedList.id);
    setActiveLevelNumber(1);
  };

  // Elimina lista
  const handleDeleteList = (id: string, bucket: ListType) => {
    const removeFromData = () => {
      setListsData((prev) => ({
        ...prev,
        [bucket]: (prev[bucket] || []).filter((l) => l.id !== id),
      }));
      if (selectedListId === id) setSelectedListId(null);
    };

    setConfirmModalConfig({
      title: 'Elimina Lista',
      message: `Sei sicuro di voler eliminare la lista "${id}"?`,
      description: 'La lista finisce nel cestino (dev-trash/trash.json) e si può recuperare da lì.',
      confirmText: 'Elimina',
      variant: 'danger',
      onConfirm: () => {
        const list = (listsData[bucket] || []).find((l) => l.id === id);
        if (!list) return;
        void addToTrash({
          id: generateUUID(),
          kind: 'list',
          label: `${list.name} (${list.listType})`,
          deletedAt: new Date().toISOString(),
          payload: { list },
        }).then((saved) => {
          if (saved.ok) {
            onTrashChanged?.();
            removeFromData();
            return;
          }
          // Senza dev server il cestino non è disponibile: si elimina solo se l'utente lo conferma.
          setConfirmModalConfig({
            title: 'Cestino non raggiungibile',
            message: `${saved.message} Eliminare comunque "${id}" senza poterla recuperare?`,
            confirmText: 'Elimina comunque',
            variant: 'danger',
            onConfirm: removeFromData,
          });
        });
      },
    });
  };

  // Ripristina dal cestino una lista eliminata; restituisce un errore se l'id è già in uso
  const handleRestoreFromTrash = (list: List): string | null => {
    const taken = Object.values(listsData).some((lists) => (lists || []).some((l) => l.id === list.id));
    if (taken) return `Esiste già una lista con id "${list.id}": rinominala o eliminala prima di ripristinare.`;
    const bucket = getBucket(list);
    setListsData((prev) => ({ ...prev, [bucket]: [...(prev[bucket] || []), list] }));
    setSelectedListId(list.id);
    setActiveLevelNumber(1);
    return null;
  };

  // Ripristina lista selezionata
  const handleResetCurrentList = () => {
    if (!selectedList) return;
    const bucket = getBucket(selectedList);
    const baselineList = initialData[bucket]?.find((l) => l.id === selectedList.id);
    setConfirmModalConfig({
      title: 'Ripristina Lista',
      message: `Ripristinare la lista "${selectedList.name}" ai dati originali di fabbrica?`,
      description: 'Tutte le modifiche locali non esportate per questa lista verranno sovrascritte.',
      confirmText: 'Ripristina',
      variant: 'warning',
      onConfirm: () => {
        if (baselineList) {
          updateSelectedList(() => JSON.parse(JSON.stringify(baselineList)));
        } else {
          updateSelectedList((prev) => ({
            ...prev,
            levels: [{ level: 1, requirementItemIds: [], actions: [], rewards: [] }],
            maxLevel: 1,
          }));
        }
      },
    });
  };

  // Ripristina livello attivo
  const handleResetCurrentLevel = (activeLevelNumber: number) => {
    if (!selectedList) return;
    const bucket = getBucket(selectedList);
    const baselineList = initialData[bucket]?.find((l) => l.id === selectedList.id);
    const baselineLevel = baselineList?.levels.find((lvl) => lvl.level === activeLevelNumber);
    setConfirmModalConfig({
      title: 'Ripristina Livello',
      message: `Ripristinare il Livello ${activeLevelNumber} ai valori originali?`,
      description: 'I materiali richiesti, le azioni e le ricompense di questo livello torneranno allo stato iniziale.',
      confirmText: 'Ripristina',
      variant: 'warning',
      onConfirm: () => {
        updateSelectedList((prev) => {
          const levels = prev.levels.map((lvl) => {
            if (lvl.level !== activeLevelNumber) return lvl;
            if (baselineLevel) return JSON.parse(JSON.stringify(baselineLevel));
            return { ...lvl, requirementItemIds: [], actions: [], rewards: [] };
          });
          return { ...prev, levels };
        });
      },
    });
  };

  // Aggiungi livello
  const handleAddLevel = () => {
    if (!selectedList) return;
    const nextLevelNum = (selectedList.levels.length || 0) + 1;
    updateSelectedList((prev) => {
      const newLevels: ListLevel[] = [...prev.levels, { level: nextLevelNum, requirementItemIds: [] }];
      return { ...prev, maxLevel: Math.max(prev.maxLevel || 1, newLevels.length), levels: newLevels };
    });
    setActiveLevelNumber(nextLevelNum);
  };

  // Rimuovi livello
  const handleRemoveLevel = (lvlNum: number) => {
    if (!selectedList || selectedList.levels.length <= 1) return;
    setConfirmModalConfig({
      title: 'Elimina Livello',
      message: `Eliminare il Livello ${lvlNum}?`,
      description: 'I livelli successivi verranno automaticamente rinumerati.',
      confirmText: 'Elimina Livello',
      variant: 'danger',
      onConfirm: () => {
        updateSelectedList((prev) => {
          const filtered = prev.levels.filter((l) => l.level !== lvlNum);
          const reindexed = filtered.map((l, idx) => ({ ...l, level: idx + 1 }));
          return { ...prev, maxLevel: reindexed.length, levels: reindexed };
        });
        setActiveLevelNumber(Math.max(1, lvlNum - 1));
      },
    });
  };

  return {
    selectedList,
    updateSelectedList,
    handleCreateList,
    handleDuplicateList,
    handleDeleteList,
    handleRestoreFromTrash,
    handleResetCurrentList,
    handleResetCurrentLevel,
    handleAddLevel,
    handleRemoveLevel,
  };
}
