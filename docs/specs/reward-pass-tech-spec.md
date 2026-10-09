# Tech Spec — Reward Pass "Frozen Trail"

Valutazione di come rappresentare il Reward Pass di *ARC Raiders* (Frozen Trail, disponibile dall'8 ottobre 2026) in ARC Benches: riuso del meccanismo **liste** già esistente oppure meccanismo dedicato.

Stato: **modello approvato (2026-10-09)** — i pass si gestiscono come liste (D1); le decisioni D1, D7 e D8 sono fissate, le altre restano da confermare. Nessun file sorgente è stato ancora modificato per i pass.

Issue di riferimento: [#85 Modello Reward Pass come tipo di lista + editor Dev dei pass](https://github.com/ieeah/arc-benches/issues/85), [#90 Reward Pass Tracker (solo livelli e ricompense, dati inseriti a mano; niente Feats)](https://github.com/ieeah/arc-benches/issues/90). Contesto già analizzato in [frozen-trail.md](frozen-trail.md).

---

## 1. Dati di riferimento e fonti

| Dato | Beebom | UrGameTips | Polygon |
| :--- | :--- | :--- | :--- |
| Livelli | 60 | 60 | non letta (errore di accesso) |
| Prezzo premium | 1.150 Raider Token | 1.150 Raider Token | — |
| Token gratuiti | 50 (tier 40), 100 (tier 55) | fino a 200 | — |
| Token premium | 200 (tier 4, 16, 28, 40), 300 (tier 55) | totale "fino a 1.150" se completato | — |
| Soglie punti | 135 (tier 1) → 8.985 (tier 60), +150 per tier | non indicate | 150 (tier 1) → 9.000 (tier 60), +150 per tier |
| Ricompense per tier | solo esempi (tier 1, 13, 25, 37, 49, 60) | non elencate | tabella completa 1–60, free e premium |
| Fine stagione | non indicata | non indicata | — |
| Progressione | punti ricompensa da missioni/obiettivi | Feat: 15 / 25 / 50 punti; 3 traguardi settimanali da 250 punti | — |

Osservazioni:

- **Le fonti non concordano sui Token.** Beebom attribuisce al premium 1.150 Token e ai tier gratuiti 150 Token totali; UrGameTips parla di fino a 200 gratuiti e di un totale di 1.350 (free + premium). Il dato va verificato in gioco prima di essere inserito nei dati.
- **Polygon fornisce la tabella completa** (fornita come HTML incollato dall'utente): 60 righe, tier 1–60 senza buchi, con ricompensa free e premium per ogni tier. Il tracciato premium è vuoto (`N/A`) in 10 tier: 6, 12, 18, 24, 30, 36, 42, 48, 54, 60.
- **Le soglie di Polygon non coincidono con Beebom**: Polygon ha 150 × tier (150 → 9.000), Beebom 135 + 150 × (tier − 1) (135 → 8.985). Le soglie vanno confermate in gioco prima di usarle.
- **Token dalla tabella Polygon**: gratuiti 200 (tier 40, 50, 55: 50 + 50 + 100); premium 1.100 (tier 4, 16, 28, 40: 200 ciascuno; tier 55: 300). Totale 1.300, non 1.350 come indicato da UrGameTips. Il prezzo di 1.150 Token resta quello dichiarato da Beebom e UrGameTips.
- **Legacy Pass non coperto** da nessuna fonte: va inserito a mano (D4).
- **Le ricompense sono in gran parte cosmetiche** (tute, accessori, colorazioni, stencil, emote). Non tutte sono probabilmente presenti nel catalogo `items.json`. Vedi decisione D3.

## 2. Stato attuale del progetto

Elementi già presenti e rilevanti (verificati nel codice):

- **Modello `List` generico** in `src/types.ts` (ADR-002): `ListBase` con `maxLevel`, `levels: ListLevel[]`, `startDate?`, `expirationDate?`, `prerequisites?`. Unione discriminata su `listType`: `'workbench' | 'expedition' | 'project' | 'quest' | 'custom'`.
- **`ListLevel`** ha già `rewards?: Reward[]`. Il tipo `Reward` attuale è `{ itemId: string; quantity: number }` (sempre un oggetto del catalogo, `src/types.ts:4`).
- **Il motore calcola i materiali mancanti** da `requirementItemIds` dei livelli compresi tra `currentLevel` e `targetLevel` (`src/store/selectors.ts`, `listsSlice.ts`). Una lista senza requisiti non contribuisce al fabbisogno.
- **`expirationDate`** esiste già sulle liste ed è usato da `src/lib/expiration.ts` (`isListExpired`, `formatTimeRemaining`).
- **Valuta "Reward Points"** è già nel catalogo (`items.json`, definita in `scripts/data/custom-items/`), ma secondo `progetti.md` non è selezionabile come requisito di consegna.
- **Editor Dev delle liste** (`DevListsPage`, `useDevListEditor`) e file dati per tipo (`LIST_FILES` in `src/lib/devArtifacts.ts`: workbench, expedition, project, quest).
- **Non esiste** alcun `listType` per i pass, nessun campo per il tracciato (free/premium/legacy), nessuna persistenza dello stato premium.

Vincolo di prodotto già deciso in roadmap (#90): **niente Feats** nella 0.6.0. Il tracker traccia solo il tier raggiunto e le ricompense sbloccate.

## 3. Opzioni valutate

### Opzione A — Riuso di `custom` senza modifiche

Il pass è una lista `custom`, con 60 livelli, ciascuno con `rewards`. Il tier raggiunto è `currentLevel`.

- Pro: zero modifiche a tipi, store, selettori o editor dev.
- Contro: le liste custom sono create dall'utente e persistite nel profilo; il pass è invece contenuto di gioco da distribuire come seed (read-only), come workbench e progetti. Non c'è modo di distinguere free/premium. Ogni utente dovrebbe reinserire i 60 tier a mano. Non risolve #85.

### Opzione B — Nuovo `listType: 'pass'` sul modello `List` (consigliata)

Il pass diventa un tipo di lista seed, come `workbench`/`project`/`quest`, con dati in `src/data/passes.json` gestiti dall'editor Dev. Il motore non viene toccato perché i tier non hanno `requirementItemIds`. Il tracciato è un attributo della ricompensa, non una lista separata.

- Pro: segue ADR-002 ("generalizzare la lista"). Riusa `ListRow`, `UnifiedListCard`, editor Dev, `currentLevel`, `expirationDate` (stagione), ordinamento e import/export. Un solo progresso per pass (il premium sblocca solo ricompense, non cambia i tier).
- Contro: serve aggiungere un bucket in più in `LIST_FILES`, nei tipi e nell'editor Dev. Serve un punto di esclusione nel calcolo dei materiali e nelle liste attive (vedi rischi R1).

### Opzione C — Meccanismo dedicato (store slice + pagina + componenti propri)

Un nuovo slice `passSlice`, una pagina `PassPage`, un modello di dati dedicato con soglie punti.

- Pro: modella esattamente il sistema a punti e soglie di gioco; permette in futuro i Feats senza vincoli del modello lista.
- Contro: duplica persistenza, import/export, drag&drop, editor dev e tracking che la lista già fornisce, in contrasto con ADR-002. Costo alto per un valore che #90 non richiede (niente Feats).

**Raccomandazione: Opzione B.** Se in futuro si vorranno i Feats o un calcolo a punti, si aggiunge un campo opzionale sul livello (`pointsRequired`) senza cambiare il modello. Passare a C in quel momento è più economico che costruire C ora.

## 4. Proposta di modello dati (solo firme, nessuna implementazione)

```ts
// src/types.ts

/** Id della traccia (es. 'free', 'premium', 'legacy'): una stringa libera, così nuove tracce sono solo dati (D7). */
export type PassTrack = string;

export interface Reward {
  itemId: string;          // invariato: ricompensa da catalogo
  quantity: number;
  track?: PassTrack;       // nuovo, solo per i livelli di un pass; assente = traccia 'free'
}

export interface PassTrackDef {
  id: PassTrack;
  name: string;
  translations?: Record<string, { name: string }>;
}

export type ListType = 'workbench' | 'project' | 'quest' | 'custom' | 'expedition' | 'pass';

/** Reward Pass di una stagione (seed read-only, come i banchi). */
export interface PassList extends ListBase {
  listType: 'pass';
  /** Stagione/pass di riferimento, es. "frozen-trail". */
  seasonId: string;
  /** Tracce del pass, nell'ordine di visualizzazione (D7). */
  tracks: PassTrackDef[];
  /** Costo del tracciato premium in Raider Token (solo informativo). */
  premiumCostTokens?: number;
}

export type List = WorkbenchList | ExpeditionList | ProjectList | QuestList | CustomList | PassList;
```

Stato per profilo (non nel seed):

```ts
// src/store/... (slice da decidere, vedi D2)
passPremiumUnlocked: Record<string, boolean>;  // chiave = id della lista pass
// currentLevels[passId] = tier raggiunto (riuso del meccanismo esistente)
```

Helper puri proposti (in `src/store/selectors.ts` o file dedicato):

```ts
export function getPassRewardsForTier(list: PassList, tier: number, unlockedPremium: boolean): Reward[];
export function getPassClaimableRewards(list: PassList, currentTier: number, unlockedPremium: boolean): Reward[];
```

Regole di filtro proposte:

- `track` assente o `'free'` → sempre visibile quando `tier <= currentTier`.
- `track === 'premium'` → visibile solo se `unlockedPremium`.
- Altre tracce (es. `'legacy'`) → regola dichiarata dal pass stesso (D7, D4); un `track` non dichiarato in `tracks` è un errore di validazione.

Il selettore `getTotalRequiredMaterialsPure` non deve cambiare: una lista `pass` senza `requirementItemIds` non produce fabbisogno. Va però esclusa esplicitamente dalle viste "liste attive/mancanti" se non deve comparire (vedi R1).

## 5. Interfaccia

- **Editor Dev**: il bucket `pass` in `DevListsPage` con griglia tier 1–60 e editor delle ricompense per tracciato (riuso di `DevRewardEditorModal`, con selettore del tracciato).
- **Pagina utente**: la card pass usa `UnifiedListCard` con un controllo tier (riuso di `LevelPills`/`LevelBadge`) e un toggle "Premium sbloccato" per profilo.
- Il tracciato premium non cambia l'avanzamento: è solo un filtro di visualizzazione e di conteggio ricompense.
- UI in italiano, abbreviazione "Lvl" (AGENTS.md).

## 6. File coinvolti (previsione)

| File | Ruolo | Tipo modifica |
| :--- | :--- | :--- |
| `src/types.ts` | `PassTrack`, `PassList`, `Reward.track`, `ListType` | estensione |
| `src/lib/validate.ts` | validazione di `PassList` e `track` | estensione |
| `src/data/passes.json` | seed dei pass (tier, ricompense) | nuovo |
| `src/store/gameData.ts` | caricamento seed `pass` | estensione |
| `src/store/selectors.ts` | helper `getPassRewardsForTier`, esclusione dal fabbisogno | estensione |
| `src/store/listsSlice.ts` / `progressSlice.ts` | stato `passPremiumUnlocked` | estensione |
| `src/lib/devArtifacts.ts` | voce `LIST_FILES` per `pass` | estensione |
| `src/hooks/dev/useDevListEditor.ts`, `src/pages/DevListsPage.tsx` | bucket `pass` | estensione |
| `src/components/UnifiedListCard.tsx` | controllo tier e toggle premium | estensione |
| `src/i18n/locales/it.ts`, `en.ts` | etichette tracciati | estensione |
| test: `validate.test.ts`, `selectors.test.ts` | copertura nuovi helper e filtri | nuovo/estensione |

## 7. Decisioni da prendere (con raccomandazione)

- **D1 — Modello**: ✅ **deciso** — Opzione B: i pass sono liste (`listType: 'pass'`); cambia solo la visualizzazione in UI (D8).
- **D2 — Stato premium**: campo per profilo in `passPremiumUnlocked`, non nel seed e non nel `List`. Va incluso in import/export. *Raccomandato.*
- **D3 — Ricompense cosmetiche non presenti nel catalogo**: oggi `Reward` richiede `itemId`. Opzioni: (a) aggiungere un `label` opzionale e `itemId` opzionale, con migrazione di validate e UI (come già previsto in `17-18-42-tech-spec.md`); (b) aggiungere gli oggetti cosmetici a `scripts/data/custom-items/`. *Raccomando (b) per i cosmetici che hanno un nome stabile, (a) per il resto, da confermare dopo aver verificato quali ricompense mancano nel catalogo.*
- **D4 — Legacy Pass**: una lista `pass` separata con `seasonId: 'legacy'` (ricompense dei vecchi Raider Deck), oppure un tracciato `legacy` della stessa lista. Il Legacy si attiva scegliendo a quale collezione dirigere i punti, quindi la separazione in lista propria è più fedele. *Raccomando lista separata; da confermare.*
- **D5 — Fine stagione**: nessuna fonte indica la data di fine. `expirationDate` resta non valorizzato finché non è nota.
- **D6 — Verifica dei dati**: i tier vanno compilati a mano dal gioco o da una fonte completa. Le tre fonti sono secondarie e in disaccordo sui Token. *Da confermare con l'utente su quale fonte fidarsi.*

- **D7 — Tracce generiche**: ✅ **deciso** — le tracce non sono un'enumerazione fissa. Ogni pass dichiara le proprie (`tracks: PassTrackDef[]`: `free`, `premium`, `legacy` o altre che Embark introdurrà) e ogni ricompensa porta l'id della sua traccia. Aggiungere una traccia è un dato, non una modifica al codice.
- **D8 — Visualizzazione dedicata del pass**: ✅ **deciso** (si implementa dopo #85, in #90) — vista a griglia, un livello per riga e una colonna per traccia, con le ricompense come `RewardBadge`. Comportamento:
  - alla apertura scorre al livello corrente, che è evidenziato;
  - i livelli passati (e le loro ricompense) sono mostrati disabilitati;
  - su telefono le colonne diventano schede a scorrimento orizzontale o un selettore di traccia;
  - la configurazione sta nell'header della pagina: quali tracce nascondere e «la mia traccia», che nasconde i `RewardBadge` non pertinenti; le preferenze sono per profilo/dispositivo e sostituiscono `passPremiumUnlocked` come filtro di visualizzazione (D2 resta per il conteggio delle ricompense).
  - Solo il livello raggiunto viene tracciato (niente Feats).

## 8. Rischi

- **R1 — Visibilità nelle viste di lista.** Una lista `pass` potrebbe comparire in "liste attive" o in "mancanti" con `currentLevel` a 0 e `targetLevels` di default (`levelsAbove(0, maxLevel)`), creando attività fittizia. Va verificato come `getActiveListsPure` e l'inizializzazione di `targetLevels` trattano il nuovo `listType`. Mitigazione: default `activeModules[id] = false` per i pass e filtro esplicito nelle viste di fabbisogno.
- **R2 — Import di profili esistenti.** `importLists` deve accettare `listType: 'pass'` senza rompere i file già esportati.
- **R3 — Dati incompleti.** Il seed Free/Premium dei 60 tier è ora disponibile da Polygon; resta da inserire il Legacy Pass a mano.
- **R4 — Fonti in disaccordo.** Soglie punti e totale Token differiscono tra le fonti. Vanno confermati prima del rilascio del seed.

## 9. Piano di test

- Unit: `validatePassList` (tier mancanti, tier fuori range 1–60, `track` sconosciuto), `getPassRewardsForTier` (filtro free/premium, tier al limite).
- Unit: import/export di un profilo con un pass e `passPremiumUnlocked`.
- Regressione: `getTotalRequiredMaterialsPure` e `getMissingMaterialsPure` invariati con e senza pass presenti (`store.test.ts`, `selectors.test.ts`).
- Manuale: editor Dev (creazione tier, ricompense per tracciato), pagina utente (avanzamento tier, toggle premium), mobile a 375px.

## 10. Milestone proposte (coerenti con VERSIONING)

- **0.5.0 — #85**: `listType: 'pass'`, seed vuoto, editor Dev del bucket. Nessun dato utente.
- **0.6.0 — #90**: seed Frozen Trail compilato (dopo verifica D6), tracker utente, toggle premium, Legacy se confermato in D4.
- **Fuori scope ora**: Feats, soglie punti per tier, calcolo settimanale. Da riaprire solo con una nuova decisione.

## 11. Cosa serve dall'utente

1. Approvazione dell'Opzione B e delle decisioni D1–D6, oppure indicazione di alternative.
2. Fonte da considerare autorevole per i Token e le ricompense tier per tier (D6).
3. Conferma se il Legacy Pass va modellato come lista separata (D4).

_Aggiornamento 2026-10-09: D1, D7 e D8 sono stati decisi (vedi sezione 7)._

Nessuna modifica al codice è stata fatta. Il documento non è stato committato.
