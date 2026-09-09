import { useState, useEffect } from 'react';
import type { List, ListType } from '@/types';
import defaultWorkbenchesData from '@/data/workbenches.json';
import defaultExpeditionsData from '@/data/expeditions.json';

const DRAFT_STORAGE_KEY = 'arc_benches_dev_lists_draft_v1';

export type ListsDataMap = Record<ListType, List[]>;

function getInitialData(): ListsDataMap {
  return {
    workbench: (defaultWorkbenchesData.items || []) as List[],
    expedition: ((defaultExpeditionsData as unknown as { lists?: List[]; items?: List[] }).lists ||
      (defaultExpeditionsData as unknown as { lists?: List[]; items?: List[] }).items ||
      []) as List[],
    project: [],
    quest: [],
    custom: [],
  };
}

/**
 * Gestisce la persistenza delle bozze delle liste dev in localStorage.
 * Espone lo stato `listsData`, il setter e l'`initialData` di baseline per i reset.
 */
export function useDevListDrafts() {
  const initialData: ListsDataMap = getInitialData();

  const [listsData, setListsData] = useState<ListsDataMap>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          workbench: parsed.workbench || initialData.workbench,
          expedition: parsed.expedition || initialData.expedition,
          project: parsed.project || [],
          quest: parsed.quest || [],
          custom: parsed.custom || [],
        };
      }
    } catch {
      // ignore
    }
    return initialData;
  });

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(listsData));
    } catch {
      // ignore
    }
  }, [listsData]);

  const resetAllDrafts = () => {
    setListsData(initialData);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  return { listsData, setListsData, initialData, resetAllDrafts };
}
