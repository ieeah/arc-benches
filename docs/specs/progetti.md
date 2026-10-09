# Specifica Funzionale e Tecnica — Progetti (Project Management)

Riferimento Stato Attuale: [1_CURRENT.md](../1_CURRENT.md)

---

## 🎯 Panoramica e Obiettivo

I **Progetti** rappresentano liste temporanee o permanenti che il Raider può completare per sbloccare miglioramenti o ricompense. Dal punto di vista del motore di tracciamento (`List`), condividono la stessa infrastruttura dei banchi di lavoro (livelli progressivi e requisiti di materiali), ma introducono due caratteristiche chiave:
1. **Date di scadenza bloccanti (comprensive di orario e fuso orario)**: Il progetto ha una durata temporale limitata. Se la scadenza viene superata, il progetto si disabilita e i materiali non possono più essere consegnati.
2. **Ricompense per-step (Rewards)**: Completare un livello del progetto sblocca immediatamente delle ricompense che vengono segnalate all'utente.

---

## 📐 Meccaniche e Regole di business

### 1. Durata e Scadenza (Expiration Date)
* Ogni progetto può definire un campo opzionale `expirationDate` nel formato completo ISO 8601 (es. `2026-09-30T18:00:00Z` o `2026-09-30T20:00:00+02:00`).
* A runtime, l'app confronta il timestamp in millisecondi di `expirationDate` con `Date.now()` (orario locale del client del giocatore).
  * **Progetto Attivo**: Se `Date.now() <= Date.parse(expirationDate)` (o se la data è assente).
  * **Progetto Scaduto**: Se `Date.now() > Date.parse(expirationDate)`.
* **Conseguenze della scadenza**:
  * La UI disabilita tutte le interazioni di modifica del livello e la selezione delle checkbox del progetto.
  * Viene mostrato un banner visibile: `Progetto Scaduto il {data_ora}` con il conteggio in ore o giorni passati.
  * Il progetto viene **escluso automaticamente** dal calcolo dei materiali totali necessari (`getTotalRequiredMaterialsPure`), in modo da non sporcare la lista della spesa dello Stash con materiali per progetti non più completabili.

### 2. Pulizia Automatica dello Stash (Clean-up)
* Quando un progetto scade, o quando un qualsiasi livello viene completato/modificato:
  * Se un materiale presente in `inventory` (quantità > 0) non ha più alcun requisito attivo (ovvero la quantità richiesta totale `totalRequired[itemId]` calcolata dai moduli/progetti attivi non scaduti è indefinita o pari a 0):
    * L'oggetto viene **automaticamente rimosso dall'inventario** (`delete inventory[itemId]` o quantità impostata a 0).
    * Se in futuro quell'oggetto sarà richiesto da un nuovo modulo/progetto, il contatore ricomincerà da zero.

### 3. Gestione Ricompense (Rewards Granulari e di Livello)
* Le ricompense possono essere assegnate a quattro livelli di granularità:
  1. **Singolo Item richiesto** (`ItemRequirement.rewards`): assegnate al conferimento di quello specifico materiale.
  2. **Singola Azione checkbox** (`CheckboxAction.rewards`): assegnate alla spunta dell'azione.
  3. **Singolo Step di azione scalare** (`ActionStep.rewards`): assegnate al raggiungimento di quella specifica soglia/tier.
  4. **Livello/Fase complessivo** (`ListLevel.rewards`): assegnate al completamento dell'intero livello.
* Ciascuna ricompensa ha la seguente forma:
  ```typescript
  export interface Reward {
    itemId: string;    // ID dell'oggetto nel catalogo (items.json): qualsiasi oggetto, blueprint e cosmetici inclusi
    quantity: number;  // Quantità (>= 1)
  }
  ```
* **Valute di ricompensa**: coins, XP e Reward Points sono oggetti del catalogo come gli altri (`coins`, `xp-points`, `reward-points`). Gli ultimi due non esistono su MetaForge e sono definiti in `scripts/data/custom-items/` (`item_type: "Currency"`), aggiunti al catalogo da `fetch-items.mjs`. Non sono selezionabili come requisiti di consegna.
* **Nessuna ricompensa testuale**: le ricompense testuali (`label` + traduzioni) sono state rimosse; in import/lettura quelle senza `itemId` vengono scartate da `validate.ts`.
* **Integrazione con lo Stash**: Almeno inizialmente, le ricompense **non** vengono caricate o accreditate in automatico all'inventario/stash del tracker per evitare complicanze di allineamento. L'indicatore è puramente informativo per supportare la pianificazione del giocatore.
* **Caricamento e Rendering a Runtime**:
  * Gestito dal componente riusabile `RewardBadge` (`size="xs" | "sm" | "md"`).
  * Il tracker recupera le informazioni dell'oggetto (nome localizzato, rarità e icona) dinamicamente da `itemsInfo`.
  * Se l'oggetto non esiste nel catalogo, vengono mostrati l'`itemId` e un'icona regalo standard `🎁`.
* Nella UI:
  * Requisito / Azione completata $\rightarrow$ Mostra la ricompensa come `Ottenuta` (evidenziata in verde tenue o con check).
  * Progetto scaduto $\rightarrow$ Mostra la ricompensa come `Persa / Bloccata` (grigia).

---

### 4. Contesto delle azioni: mappe e oggetti da portare (#82)

Azioni (`CheckboxAction`) e step di azioni a scaglioni (`ActionStep`) possono dichiarare:

- `maps?: string[]`: id delle mappe in cui l'azione va compiuta. **Selezione multipla; se assente o vuota l'azione vale in tutte le mappe.**
- `carryItems?: { itemId, quantity }[]`: oggetti da avere con sé al momento del compimento. Sono solo informativi: non sono requisiti di consegna e non entrano nel fabbisogno né nei mancanti dello Stash.

Il catalogo delle mappe è unico e globale: `src/data/maps.json` (letto da `src/lib/maps.ts`): `dam-battleground`, `spaceport`, `buried-city`, `blue-gate`, `stella-montis`, `riven-tides`, `pendola-pass`. Azioni, spawn tip (#59) e raggruppamento Stash (#81) ne usano ciascuno un sottoinsieme proprio, non condiviso. Un id non più nel catalogo resta nel dato e viene mostrato com'è.

La validazione (`validateList`) tiene solo mappe non vuote e senza duplicati e oggetti con `itemId` valido (quantità minima 1); i campi vuoti vengono omessi, quindi i file esistenti restano validi. In UI i vincoli compaiono come chip (`ActionContextChips`) su ogni riga azione e sugli step delle timeline; l'editor Dev ha un pulsante «Mappe richieste e oggetti da portare» su azioni e scaglioni.

## 🛠 Modifiche al Modello Dati e Tipi

#### [`src/types.ts`](file:///c:/Users/ieeah/dev/Projects/arc-benches/src/types.ts)
Estensione delle interfacce per supportare ricompense granulari:

```typescript
export interface Reward {
  itemId: string;
  quantity: number;
}

export interface ItemRequirement {
  itemId: string;
  quantity: number;
  rewards?: Reward[];
}

export interface CheckboxAction {
  id: string;
  label: string;
  translations?: Record<string, ActionTranslation>;
  rewards?: Reward[];
}

export interface ActionStep {
  id: string;
  label: string;
  translations?: Record<string, ActionTranslation>;
  rewards?: Reward[];
}

export interface ListLevel {
  level: number;
  requirementItemIds: ItemRequirement[];
  actions?: CheckboxAction[];
  tieredActions?: TieredAction[];
  rewards?: Reward[];
}

export interface List {
  expirationDate?: string;
}
```

---

## 🎨 Modifiche all'Interfaccia Utente (UI) & Dev Studio

1. **Indicatori Temporali (UnifiedListCard & ListDetailPage)**:
   - Se il progetto ha una scadenza, viene mostrato il countdown (`Scaduto`, `Scade tra {N} ore`, `Scade tra {N} giorni`).
   - Se il progetto è scaduto (`isExpired === true`), viene applicato un overlay visivo opaco con la dicitura `SCADUTO` e le interazioni vengono bloccate.

2. **Visualizzazione Ricompense Granulari**:
   - Accanto al nome dei materiali e delle azioni checkbox appaiono micro-badge `RewardBadge`.
   - Sulla timeline dei nodi a scaglioni (`TieredActionTimeline`), ciascuno step mostra sotto il bottone i premi sbloccati a quella soglia.
   - Il blocco a fondo livello mostra le ricompense globali di fase (`ListLevel.rewards`).

3. **Dev Studio (`DevRewardEditorModal`)**:
   - Pulsante `🎁` dedicato su ogni riga di Materiale, Azione Checkbox e Scaglione Tiered.
   - Modale a bottom-sheet con switcher Oggetto MetaForge (`ItemPicker`) / Testo Custom, quantità e traduzioni multilingua.

---

## 🧪 Validazione a Runtime e Sanitizzazione

#### [`src/lib/validate.ts`](file:///c:/Users/ieeah/dev/Projects/arc-benches/src/lib/validate.ts)
- `validateReward` e `validateRewardsArray` normalizzano e sanitizzano gli array `rewards?: Reward[]` su `ItemRequirement`, `CheckboxAction`, `ActionStep` e `ListLevel`.
