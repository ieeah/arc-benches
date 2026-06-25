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

```ts
function getOtherNeedsPure(
  totalRequired: Record<string, number>,
  list: List,
  hideoutLevels: Record<string, number>,
  targetLevels: Record<string, number[]>
): Record<string, number> {
  const result = { ...totalRequired };
  const current = hideoutLevels[list.id] ?? 0;
  const selected = targetLevels[list.id] ?? [];
  list.levels.forEach(lvl => {
    if (lvl.level > current && selected.includes(lvl.level)) {
      lvl.requirementItemIds.forEach(req => {
        result[req.itemId] = (result[req.itemId] ?? 0) - req.quantity;
        if (result[req.itemId] <= 0) delete result[req.itemId];
      });
    }
  });
  return result;
}
```

### Parte 2 — `src/store/listsSlice.ts` (modifica minima)

I metodi dello store diventano **thin wrapper** che delegano alle funzioni pure. Nessun cambiamento all'API di `AppState`: le action interne (`upgradeModule`, `setModuleCurrentLevel`, ecc.) continuano a chiamare `get()` come ora.

```ts
getAllLists: () => {
  const s = get();
  return getAllListsPure(s.workbenches, s.sharedCustomLists, s.customLists);
},
getOrderedLists: () => {
  const s = get();
  return getOrderedListsPure(getAllListsPure(s.workbenches, s.sharedCustomLists, s.customLists), s.listOrder);
},
// ...
```

### Parte 3 — `src/App.tsx` (4 selettori singoli)

```ts
// Prima:
const store = useAppStore();

// Dopo (App non re-renderizza mai su tap +/- o drag):
const filterHideCompleted = useAppStore(s => s.filterHideCompleted);
const setFilterHideCompleted = useAppStore(s => s.setFilterHideCompleted);
const resetProgress = useAppStore(s => s.resetProgress);
const activeProfileName = useAppStore(s =>
  s.profiles.find(p => p.id === s.activeProfileId)?.name ?? '—'
);
```

Le action functions (`resetProgress`, `setFilterHideCompleted`) sono **reference-stabili** in Zustand: il selettore non scatena mai un re-render.

### Parte 4 — `src/pages/StashPage.tsx`

```ts
// Subscription mirate
const inventory = useAppStore(s => s.inventory);
const hideoutLevels = useAppStore(s => s.hideoutLevels);
const targetLevels = useAppStore(s => s.targetLevels);
const activeModules = useAppStore(s => s.activeModules);
const filterHideCompleted = useAppStore(s => s.filterHideCompleted);
const itemsInfo = useAppStore(s => s.itemsInfo);  // stabile dopo boot
// liste (cambiano raramente, mai su +/-)
const { workbenches, customLists, sharedCustomLists, listOrder } = useAppStore(
  useShallow(s => ({
    workbenches: s.workbenches,
    customLists: s.customLists,
    sharedCustomLists: s.sharedCustomLists,
    listOrder: s.listOrder,
  }))
);
// Action refs (stabili, non causano re-render)
const incrementItem = useAppStore(s => s.incrementItem);
const decrementItem = useAppStore(s => s.decrementItem);
const setItemCount = useAppStore(s => s.setItemCount);

// Derivati memoizzati
const allLists = useMemo(
  () => getAllListsPure(workbenches, sharedCustomLists, customLists),
  [workbenches, sharedCustomLists, customLists]
);
const orderedLists = useMemo(
  () => getOrderedListsPure(allLists, listOrder),
  [allLists, listOrder]
);
const totalRequired = useMemo(
  () => getTotalRequiredMaterialsPure(allLists, activeModules, hideoutLevels, targetLevels),
  [allLists, activeModules, hideoutLevels, targetLevels]
);
const missingMaterials = useMemo(
  () => getMissingMaterialsPure(totalRequired, inventory),
  [totalRequired, inventory]
);
const refinerLevel = useMemo(
  () => getRefinerLevelPure(hideoutLevels),
  [hideoutLevels]
);

// Fix itemPriorityIndex: Map pre-calcolata fuori dal comparatore
const priorityMap = useMemo(() => {
  const map = new Map<string, number>();
  orderedLists.forEach((list, i) => {
    if (!activeModules[list.id]) return;
    const current = hideoutLevels[list.id] ?? 0;
    const selected = targetLevels[list.id] ?? [];
    list.levels.forEach(lvl => {
      if (lvl.level > current && selected.includes(lvl.level)) {
        lvl.requirementItemIds.forEach(req => {
          if (!map.has(req.itemId)) map.set(req.itemId, i);
        });
      }
    });
  });
  return map;
}, [orderedLists, activeModules, hideoutLevels, targetLevels]);

// sort usa map.get() O(1) invece di itemPriorityIndex() O(n) per confronto
```

### Parte 5 — `src/pages/ListsPage.tsx`

Stessa struttura di subscription mirati. Il punto chiave è `sharedCardProps` che attualmente chiama `getTotalRequiredMaterials(list.id)` per ogni card:

```ts
// Prima (in sharedCardProps, N volte per render):
otherNeeds: store.getTotalRequiredMaterials(list.id)  // O(liste × livelli × item) × N

// Dopo (totalRequired già calcolato una volta, sottrazione O(livelli × item)):
otherNeeds: getOtherNeedsPure(totalRequired, list, hideoutLevels, targetLevels)
```

---

## File da modificare

| File | Tipo | Descrizione modifica |
|---|---|---|
| `src/store/selectors.ts` | **nuovo** | Funzioni pure estratte, ~80-100 righe |
| `src/store/listsSlice.ts` | modifica minima | Metodi store → thin wrapper su selectors.ts |
| `src/App.tsx` | modifica piccola | 1 `useAppStore()` → 4 selettori singoli |
| `src/pages/StashPage.tsx` | modifica media | Subscription mirate + `useMemo` + fix `priorityMap` |
| `src/pages/ListsPage.tsx` | modifica media | Subscription mirate + `useMemo` + `getOtherNeedsPure` |

**Non si toccano**: `UnifiedListCard`, `inventorySlice`, `progressSlice`, `profileSlice`, `types.ts` — l'API props e lo store pubblico restano invariati.

---

## Considerazioni su `useShallow`

`useShallow` da `zustand/shallow` serve solo quando si selezionano **più valori in un unico oggetto**:

```ts
// Senza useShallow: re-render ad ogni cambiamento dello store (nuovo oggetto ogni volta)
const { a, b } = useAppStore(s => ({ a: s.a, b: s.b }));

// Con useShallow: re-render solo se a o b cambiano (confronto shallow)
const { a, b } = useAppStore(useShallow(s => ({ a: s.a, b: s.b })));
```

Per selettori singoli (`useAppStore(s => s.inventory)`) **non serve**: Zustand usa `Object.is` e ri-renderizza solo se il riferimento cambia, il che è già il comportamento corretto.

Strategia:
- Valori singoli o stabili: selettore singolo
- Gruppo di valori che cambiano insieme e raramente (es. `workbenches`, `customLists`, `sharedCustomLists`, `listOrder`): `useShallow`

---

## Stima effort e rischio

**Effort**: ~3-4 ore.
- `selectors.ts`: ~90 min (logica pura + test mentali sui tipi)
- `listsSlice.ts`: ~15 min (thin wrapper)
- `App.tsx`: ~15 min
- `StashPage`: ~60 min
- `ListsPage`: ~75 min (più derivati, fix `otherNeeds`)

**Rischio**: basso. La logica di calcolo non cambia, si sposta solo dove e quando viene eseguita. TypeScript guida ogni firma. Zero modifiche alle action dello store.

**Beneficio Supabase**: le funzioni pure in `selectors.ts` diventano riutilizzabili per computare stato derivato anche da payload remoti, senza accoppiamento allo store Zustand.

---

## Ordine di esecuzione consigliato

1. Creare `selectors.ts` con le funzioni pure (zero rischio, codice non ancora usato)
2. Aggiornare `listsSlice.ts` (i metodi wrapper chiamano le stesse funzioni, comportamento identico)
3. `App.tsx` (modifica piccola, verifica visiva immediata)
4. `StashPage` (modifica isolata, verifica su Stash)
5. `ListsPage` (modifica più grande, verifica su Liste + Stash — `otherNeeds` è critico)
