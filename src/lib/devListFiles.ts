import type { List, ListType } from '@/types';
import { pickChangedBuckets } from '@/lib/draftStorage';

export type ListFileType = Exclude<ListType, 'custom'>;

/**
 * File delle liste da scrivere o scaricare: quelli con modifiche in bozza, indipendentemente dalla lista
 * selezionata. Se si usasse la selezione, dopo aver eliminato una lista (che lascia la selezione vuota e
 * ripiega su un'altra) «Applica» punterebbe a un file senza modifiche («nessuna modifica») e quello
 * con l'eliminazione non verrebbe mai scritto.
 *
 * `target` è il file di riferimento per «Scarica» e per l'etichetta: il tipo selezionato se ha modifiche (o se
 * non ce ne sono), altrimenti il primo file modificato.
 */
export function listFilesToApply(
  listsData: Record<ListType, List[]>,
  initialData: Record<ListType, List[]>,
  selected: ListType,
): { modified: ListFileType[]; target: ListType } {
  const modified = (Object.keys(pickChangedBuckets(listsData, initialData)) as ListType[]).filter(
    (type): type is ListFileType => type !== 'custom',
  );
  const selectedIsModified = selected !== 'custom' && modified.includes(selected);
  return { modified, target: selectedIsModified || modified.length === 0 ? selected : modified[0] };
}
