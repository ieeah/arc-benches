# Piano — Ottimizzazione Zustand (selettori mirati + memoizzazione)

> Stato: **pianificato** — non ancora implementato.
> Riferimento roadmap: sezione "Performance / correttezza" → "Nessun selettore zustand → over-rendering + ricalcolo".

---

## Problema

Ogni tap +/- sullo Stash o ogni drag in Liste scatena questa cascata:

1. `set({ inventory: {...} })` — Zustand notifica **tutti** i subscriber
2. `App.tsx` (sempre montato, nessun selettore) → **re-render**
3. App re-renderizza la pagina attiva
4. La pagina attiva (nessun selettore) → **secondo re-render**
5. Tutti i selettori dello store vengono ricalcolati da zero

Le pagine non attive sono smontate (`{activeTab === 'stash' && <StashPage />}`) e non contribuiscono al problema. Il collo di bottiglia è la **cascata App → pagina attiva** che avviene ad ogni singola modifica di stato.

---

## Mappa delle computazioni expensive per render

### `StashPage` (scatta su ogni tap +/-)

| Chiamata | Complessità reale | Note |
|---|---|---|
| `store.getMissingMaterials()` | O(liste × livelli × item) | chiama `getTotalRequiredMaterials()` internamente |
| `store.getOrderedLists()` | **O(n²)** | `indexOf` dentro `sort` — O(n) per confronto |
| `store.getRefinerLevel()` | O(1) | ok |
| `itemPriorityIndex()` nel comparatore sort | O(banchi × livelli) per confronto | **O(n²)** totale sul sort |

### `ListsPage` (scatta su ogni drag, tap pill, cambio livello)

| Chiamata | Complessità reale | Note |
|---|---|---|
| `store.getActiveLists()` | O(n²) | chiama `getOrderedLists()` |
| `store.getMaxedLists()` | O(n²) | chiama `getOrderedLists()` |
| `store.getAvailableUpgrades()` | O(liste × item) | |
| `getTotalRequiredMaterials()` | O(liste × livelli × item) | una volta globale |
| `getTotalRequiredMaterials(list.id)` | O(liste × livelli × item) | **N volte**, una per card in `sharedCardProps` |

L'ultimo è l'anti-pattern peggiore: `otherNeeds` per N card = N chiamate complete a `getTotalRequiredMaterials`, ognuna itera tutte le liste. Con 10 banchi attivi: 10 iterazioni complete ad ogni render di `ListsPage`.

---

## Soluzione

### Parte 1 — `src/store/selectors.ts` (file nuovo)

Estrarre tutta la logica di calcolo come **funzioni pure** che ricevono le slice di stato come parametri. Nessuna dipendenza dallo store: testabili in isolamento, riutilizzabili nel sync Supabase.

```ts
// Aggregazione liste
getAllListsPure(workbenches, sharedCustomLists, customLists): List[]
getOrderedListsPure(allLists, listOrder): List[]          // fix O(n²) → O(n)
getRefinerLevelPure(hideoutLevels): number
getActiveListsPure(orderedLists, hideoutLevels): List[]
getMaxedListsPure(orderedLists, hideoutLevels): List[]

// Materiali
getTotalRequiredMaterialsPure(
  allLists, activeModules, hideoutLevels, targetLevels, excludeId?
): Record<string, number>

getMissingMaterialsPure(
  totalRequired, inventory
): Array<{ itemId, owned, required, missing, isCompleted }>

getAvailableUpgradesPure(
  allLists, activeModules, hideoutLevels, inventory
): string[]

// Nuovo: evita N chiamate complete per otherNeeds
getOtherNeedsPure(
  totalRequired, list, hideoutLevels, targetLevels
): Record<string, number>
```

**Fix O(n²) in `getOrderedListsPure`:**
```ts
// Prima:
.sort((a, b) => listOrder.indexOf(a.id) - listOrder.indexOf(b.id))  // O(n) per confronto

// Dopo:
const orderMap = new Map(listOrder.map((id, i) => [id, i]));
.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))  // O(1) per confronto
```

**Algoritmo `getOtherNeedsPure` (sottrazione invece di ricalcolo):**

Invece di iterare tutte le liste escludendo `list.id`, parte dal `totalRequired` già calcolato e **sottrae** il contributo della lista da escludere.
- Prima: O(liste × livelli × item) per ogni card
- Dopo: O(livelli × item) per ogni card + O(liste × livelli × item) una volta sola

Con 10 banchi attivi: 10× più veloce per `otherNeeds`.
