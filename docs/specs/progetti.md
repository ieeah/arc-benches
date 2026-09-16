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
    itemId?: string;    // ID dell'oggetto nel database MetaForge (opzionale)
    quantity?: number;  // Quantità (opzionale, es. 2 se itemId è "metal-parts")
    label: string;      // Descrizione generica (es. "Sblocco Blueprint Refiner Lvl 3" o "+150 Raider Tokens")
    translations?: Record<string, RewardTranslation>;
  }
  ```
* **Integrazione con lo Stash**: Almeno inizialmente, le ricompense **non** vengono caricate o accreditate in automatico all'inventario/stash del tracker per evitare complicanze di allineamento. L'indicatore è puramente informativo per supportare la pianificazione del giocatore.
* **Caricamento e Rendering a Runtime**:
  * Gestito dal componente riusabile `RewardBadge` (`size="xs" | "sm" | "md"`).
  * Se `itemId` è definito, il tracker recupera le informazioni relative all'oggetto (nome, descrizione, rarità e icona di MetaForge) dinamicamente da `itemsInfo` per visualizzarle graficamente.
  * Altrimenti (o se l'oggetto non esiste), viene mostrata un'icona regalo standard `🎁` con la `label` fornita.
* Nella UI:
  * Requisito / Azione completata $\rightarrow$ Mostra la ricompensa come `Ottenuta` (evidenziata in verde tenue o con check).
  * Progetto scaduto $\rightarrow$ Mostra la ricompensa come `Persa / Bloccata` (grigia).

---

## 🛠 Modifiche al Modello Dati e Tipi

#### [`src/types.ts`](file:///c:/Users/ieeah/dev/Projects/arc-benches/src/types.ts)
Estensione delle interfacce per supportare ricompense granulari:

```typescript
export interface Reward {
  itemId?: string;
  quantity?: number;
  label: string;
  translations?: Record<string, RewardTranslation>;
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
