# Tech Spec congiunto — Issue #17, #18, #42

Piano tecnico per l'ordine di implementazione #18 → #42 → #17, come motivato in
[17-18-42-analisi-congiunta.md](17-18-42-analisi-congiunta.md). Nessun file
sorgente va toccato finché questo piano non è approvato.

---

## Parte A — #18: Date di Scadenza

### Tipi (`src/types.ts`)

```ts
export interface Reward {
  itemId?: string;
  quantity?: number;
  label: string;
}

export interface ListLevel {
  // ...esistente (level, requirementItemIds, actions?)...
  rewards?: Reward[];
}

export interface List {
  // ...esistente...
  expirationDate?: string; // ISO 8601, es. "2026-09-30T20:00:00+02:00"
}
```

### Validazione (`src/lib/validate.ts`)

- `validateReward(raw: unknown): Reward | null` — nuovo, sullo stile di
  `validateAction`.
- `validateLevel`: estesa per mappare `rewards` (array opzionale, solo se non
  vuoto — stesso pattern già usato per `actions`).
- `validateList`: estesa per sanitizzare `expirationDate` con un nuovo helper
  `asIsoDateString(value: unknown): string | undefined` (valida che
  `Date.parse(value)` non sia `NaN`).

### Calcolo scadenza — dove vive la logica

Nuovo helper puro in `src/store/selectors.ts`:

```ts
export function isListExpired(list: List, now: number = Date.now()): boolean {
  return list.expirationDate !== undefined && now > Date.parse(list.expirationDate);
}
```

`getTotalRequiredMaterialsPure` (riga 47) va modificata **solo** nel loop
`for (const list of allLists)` aggiungendo `|| isListExpired(list)` alla
condizione di `continue` già esistente (`list.id === excludeModuleId || !activeModules[list.id]`).
Questo esclude automaticamente le liste scadute sia da `totalRequired` che, a
cascata, da `getMissingMaterialsPure` (che consuma il suo output) — nessuna
modifica separata necessaria lì.

`getActiveListsPure`/`getMaxedListsPure` **non vanno toccate**: la spec di
progetti.md chiede che il progetto scaduto resti visibile con banner/lock, non
che sparisca dalla lista attiva — la logica di visibilità/interazione è solo UI.

### UI

- `UnifiedListCard` (o componente equivalente di card lista): countdown
  (`Scade tra N ore/giorni` con soglie colore) quando `expirationDate` è
  presente e non scaduta; badge/overlay `SCADUTO` con `opacity-60
  pointer-events-none` quando `isListExpired(list)`.
- `ListDetailPage`: stesso banner scaduto; blocco interazioni di
  livello/checkbox quando scaduto; sezione rewards per livello (icona da
  `itemsInfo[reward.itemId]` se presente, altrimenti 🎁 + `label`).

---

## Parte B — #42: Azioni mancanti nello Stash

### Nuovo tipo + selector (`src/store/selectors.ts`)

```ts
export interface MissingAction {
  listId: string;
  listName: string;
  level: number;
  actionId: string;
  label: string;
}

export function getMissingActionsPure(
  allLists: List[],
  activeModules: Record<string, boolean>,
  hideoutLevels: Record<string, number>,
  targetLevels: Record<string, number[]>,
  checkedActions: Record<string, boolean>,
): MissingAction[]
```

Stesso pattern del loop in `getTotalRequiredMaterialsPure` (stesso filtro
`excludeModuleId`/`activeModules`/`isListExpired`, stesso criterio
`lvl.level > current && selected.includes(lvl.level)`), ma invece di
accumulare `requirementItemIds` in un totale, itera `lvl.actions ?? []` e
include l'azione se `checkedActions[\`${list.id}|${lvl.level}|${action.id}\`]`
non è `true`.

**Nota sul dubbio "azioni auto-spuntate da level-up"**: dato che
`upgradeModule`/`setModuleCurrentLevel` marcano già `true` le azioni dei
livelli raggiunti (`progressSlice.ts`), il filtro `lvl.level > current` le
esclude a monte — non serve logica aggiuntiva per distinguerle, la stessa
condizione già usata per i materiali basta.

### `listsSlice.ts`

Esporre `getMissingActions` che chiama `getMissingActionsPure` con lo state
corrente (stesso wrapper thin già usato per gli altri selector).

### `StashPage.tsx`

Nuova sezione collassabile (`CollapsibleSection`, coerente con lo stile
esistente) sotto/accanto a quella dei materiali mancanti, che renderizza
`MissingAction[]` raggruppate per `listId`, ciascuna riga con `ActionCheckbox`
già esistente, wired a `store.toggleAction(listId, level, actionId)`. Va
gestito il caso "materiali completi ma azioni pendenti" sostituendo il
messaggio attuale `noMaterialsFound` con un check congiunto
(`missingMaterials.length === 0 && missingActions.length === 0`).

Nota dell'utente: non del tutto convinto che una sezione separata sia la UX
giusta rispetto a un'unica lista mista materiali+azioni, ma essendo una
scelta puramente di presentazione (a valle dello stesso selector), si
procede così e si valuta l'effetto reale prima di eventualmente rivedere il
layout — non blocca il resto del piano.

### Parte B-bis — Bug preesistente da correggere: azioni non sincronizzate con `hideoutLevels` in discesa

Verificato in `src/store/progressSlice.ts`, `setModuleCurrentLevel` (righe
26-50): il ramo `if (list && level > prevLevel)` marca correttamente
`checkedActions` a `true` per i livelli attraversati salendo (riga 42), ma
**non esiste alcun ramo per `level < prevLevel`** — scendendo di livello
`checkedActions` non viene toccato affatto. Senza questa correzione,
`getMissingActionsPure` (Parte B) mostrerebbe come "completate" azioni di
livelli che l'utente ha esplicitamente riportato indietro, inconsistente con
i materiali (il cui fabbisogno si ricalcola automaticamente dai selector in
base a `hideoutLevels`, senza bisogno di reset esplicito in storage).

Fix in `setModuleCurrentLevel`:

```ts
} else if (list && level < prevLevel) {
  list.levels
    .filter(l => l.level > level && l.level <= prevLevel)
    .forEach(l => {
      (l.actions ?? []).forEach(a => { delete checkedActions[`${moduleId}|${l.level}|${a.id}`]; });
    });
}
```

Nessuna modifica necessaria a `inventory`: il fabbisogno materiali è sempre
derivato da `hideoutLevels` via i selector, non c'è un "contatore" persistito
da azzerare esplicitamente.

---

## Parte C — #17: Motore requisiti ibridi + Carovane/Prestige

### C1 — Requisiti ibridi (Spedizioni-Progetti, spedizioni-e-donazioni.md)

Nessuna modifica di tipo: la "donazione a valore" si implementa come una
`CheckboxAction` ordinaria con il target nel `label` (es. `"Donazione
Provviste Completata (0/200.000)"`), riusando `checkedActions` e
`ActionCheckbox` così come sono. `CustomListEditor.tsx` non richiede nuovi
campi per l'editing, solo eventuale testo guida nell'UI di creazione azione.

### C2 — Sistema Carovane/Prestige (spedizioni.md)

Stato di profilo nuovo, **non basato su `List`** (a differenza di C1):

```ts
// aggiunta a PersistedState (src/store/persistence.ts) e default in gameData.ts
completedExpeditionsCount: number; // default 0
earnedPermanentSkillPoints: number; // default 0, cap 15
consecutiveStreak: number; // default 0
departureWindowActive: boolean; // default false
```

Le carovane (Fasi 1-4) restano `List` standard (`requirementItemIds`), Fase 5
(donazioni) e Fase 6 (registrazione) sono `CheckboxAction` con chiavi
`checkedActions` dedicate (`expedition-damage|0|tier_{1..5}`,
`expedition-catchup|0|sp_{1..5}` — pattern già proposto in spedizioni.md,
riusa l'infrastruttura esistente senza estenderla).

Nuovi file: `src/pages/ExpeditionPage.tsx`; nuove azioni store (slice
dedicato o estensione di `progressSlice.ts`) — `confirmDeparture(gainOverride?:
number)`, `closeWindowWithoutDeparture(clearInventory?: boolean)` — che
applicano le regole di reset descritte in spedizioni.md (§ Flussi di
Chiusura Finestra).

---

## Decisioni (confermate dall'utente)

### 1. `listType` per le Carovane: nuovo `'expedition'` — confermato

Le Carovane hanno un ciclo di vita (indice attivo, reset completo, stato di
profilo dedicato) strutturalmente diverso da un Progetto normale; un
`listType` distinto permette a `ExpeditionPage.tsx` di filtrare senza
euristiche fragili (es. su `id` o convenzioni di naming) e rende esplicita
l'intenzione nello union type (`LIST_TYPES` in `validate.ts`).

### 2. Target di valore delle donazioni: testo libero nel `label` — confermato

Nessuna modifica di tipo (come descritto in C1): la spec stessa lo propone,
zero rischio di regressione su `CheckboxAction`/`ActionCheckbox` esistenti,
implementabile subito. Da rivalutare in futuro solo se servirà
calcolare/aggregare i valori target automaticamente.

### 3. Filtro azioni auto-spuntate

Risolto in Parte B: non serve logica dedicata, la condizione `lvl.level >
current` già esclude le azioni dei livelli raggiunti. Vedi anche Parte
B-bis per il bug simmetrico in discesa.

---

## Parte E — Governance dei `listType` (nuovo vincolo dell'utente)

Solo lo sviluppatore può introdurre liste di tipo `'workbench'`, `'project'`,
`'expedition'`, `'quest'` (dati statici in `src/data/*.json`, caricati via
cast diretto in `gameData.ts` — **non passano da `validate.ts`**, quindi non
sono toccati da questa parte). L'utente può creare/importare solo liste
`'custom'`. Verificato che oggi questo vincolo **non è enforced**:

- `createCustomList` (`src/types.ts:176`) accetta un `listType?: ListType`
  opzionale che, se passato, sovrascrive il default `'custom'`
  (`listsSlice.ts:36`) — `CustomListEditor.tsx` oggi non lo passa mai (UI
  sicura), ma l'API lo permette.
- `updateCustomList` (`src/types.ts:177`) accetta `listType` nel patch, stesso
  problema.
- `validateList` (`validate.ts:118-119`) **preserva** il `listType` letto dal
  JSON importato anche per liste con `custom: true` — confermato dal test
  esistente `validate.test.ts:107`, che oggi si aspetta che `listType:
  'project'` sopravviva alla validazione di una lista `custom`. Dato che
  `validateList` è usato solo sui percorsi custom/shared (import JSON,
  rientro da `localStorage` — mai sui dati statici sviluppatore), è sicuro
  forzarlo sempre a `'custom'`.

### Modifiche

- `src/types.ts`: rimuovere `listType` da `createCustomList`/`updateCustomList`
  (l'unico `listType` possibile per una lista utente è `'custom'`, non ha
  senso esporlo come parametro).
- `src/store/listsSlice.ts`: `createCustomList` imposta sempre
  `listType: 'custom'`, nessun override.
- `src/lib/validate.ts`: `validateList` forza `out.listType = 'custom'`
  incondizionatamente, ignorando `v.listType` in input.
- `src/lib/validate.test.ts:107`: aggiornare l'aspettativa — una lista con
  `custom: true, listType: 'project'` in input deve uscire da `validateList`
  con `listType: 'custom'`, non `'project'`.

---

## Ordine di implementazione consigliato

1. Parte E (governance `listType`) + Parte B-bis (fix sync azioni/livello) —
   entrambe correzioni indipendenti su codice esistente, propedeutiche a
   tutto il resto, a rischio di regressione minimo.
2. #18 (tipi + validate + `isListExpired` + filtro in
   `getTotalRequiredMaterialsPure` + UI countdown/rewards).
3. #42 (`MissingAction` + `getMissingActionsPure` + sezione `StashPage.tsx`).
4. #17-C1 (motore ibrido, riusa #18 per `expirationDate` su Spedizioni-Progetti
   e #42 per la vista donazioni/azioni mancanti).
5. #17-C2 (Carovane/Prestige: `listType: 'expedition'`, stato profilo,
   `ExpeditionPage.tsx`, reset logic) — il più grande e il più indipendente,
   può slittare senza bloccare 1-4.

## Fuori scope (nota per il futuro)

L'utente ha suggerito una pagina di gestione per liste sviluppatore
(workbench/project/expedition/quest), sulla falsariga di
[DevOverridesPage](../../src/pages/DevOverridesPage.tsx) e
[DevTranslationsPage](../../src/pages/DevTranslationsPage.tsx). Idea valida
ma esplicitamente rimandata a un'issue separata — non pianificata qui per
non allargare lo scope di #17/#18/#42.
