# ADR 002 — Astrazione Lista Generica (`List`)

## Contesto
L'applicazione gestiva originariamente solo i banchi da lavoro (`Workbench`). Tuttavia, gli utenti necessitavano di tracciare anche liste personalizzate, progetti futuri o quest temporanee con la stessa logica di aggregazione dei materiali.

## Decisione
Generalizzare l'entità `Workbench` nell'astrazione `List` (in `src/types.ts`), dove i banchi di gioco sono il seed read-only (`listType: 'workbench'`) e le liste utente sono istanze personalizzate (`custom: true`).

## Conseguenze
- **Vantaggi**: Tutti i selettori e componenti UI (`ListRow`, `UnifiedListCard`, `getMissingMaterials`) funzionano in modo uniforme su banchi e liste custom senza codice duplicato.
- **Svantaggi**: Necessità di mantenere la separazione nello store per non persistere il seed di gioco.
