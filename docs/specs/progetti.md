# Specifica Funzionale e Tecnica — Progetti (Project Management)

Riferimento Stato Attuale: [1_CURRENT.md](../1_CURRENT.md)

---

## 🎯 Panoramica e Obiettivo

I **Progetti** rappresentano liste temporanee o permanenti che il Raider può completare per sbloccare miglioramenti o ricompense. Dal punto di vista del motore di tracciamento (`List`), condividono la stessa infrastruttura dei banchi di lavoro (livelli progressivi e requisiti di materiali), ma introducono due caratteristiche chiave:
1. **Date di scadenza "secche" (Hard Deadlines)**: Il progetto ha una durata temporale limitata. Se la scadenza viene superata, il progetto si disabilita e i materiali non possono più essere depositati.
2. **Ricompense per-step (Rewards)**: Completare un livello del progetto sblocca immediatamente delle ricompense che vengono segnalate all'utente.

---

## 📐 Meccaniche e Regole di business

### 1. Durata e Scadenza (Expiration Date)
* Ogni progetto può definire un campo opzionale `expirationDate` (formato ISO `YYYY-MM-DD`).
* A runtime, l'app confronta la data del client locale con `expirationDate`:
  * **Progetto Attivo**: Se `oggi <= expirationDate` (o se la data è assente).
  * **Progetto Scaduto**: Se `oggi > expirationDate`.
* **Conseguenze della scadenza**:
  * La UI disabilita tutte le interazioni di modifica del livello e la selezione delle checkbox del progetto.
  * Viene mostrato un banner visibile: `Progetto Scaduto il {data}`.
  * Il progetto viene **escluso automaticamente** dal calcolo dei materiali totali necessari (`getTotalRequiredMaterialsPure`), in modo da non sporcare la lista della spesa dello Stash con materiali per progetti non più completabili.

### 2. Gestione Ricompense (Rewards)
* Ogni livello del progetto (`ListLevel`) può contenere un array di ricompense (`rewards`).
* Ciascuna ricompensa ha la seguente forma:
  ```typescript
  export interface Reward {
    itemId?: string;    // ID dell'oggetto nel database MetaForge (opzionale)
    quantity?: number;  // Quantità (opzionale, es. 2 se itemId è "metal-parts")
    label: string;      // Descrizione generica (es. "Sblocco Blueprint Refiner Lvl 3" o "Raider Tokens")
  }
  ```
* **Integrazione con lo Stash**: Almeno inizialmente, le ricompense **non** vengono caricate o accreditate in automatico all'inventario/stash del tracker per evitare complicanze di allineamento. L'indicatore è puramente informativo per supportare la pianificazione del giocatore.
* Nella UI:
  * Livello completato $\rightarrow$ Mostra la ricompensa come `Ottenuta` (icona spuntata verde).
  * Livello bloccato/progetto scaduto $\rightarrow$ Mostra la ricompensa come `Persa / Bloccata` (icona lucchetto o grigia).
  * Livello attivo $\rightarrow$ Mostra la ricompensa come `Disponibile al completamento` (icona pacco regalo 🎁 o icona dell'oggetto).

---

## 🛠 Modifiche al Modello Dati e Tipi

#### [`src/types.ts`](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/types.ts)
Estensione dell'interfaccia `List` e `ListLevel` per supportare scadenze e ricompense:

```typescript
export interface Reward {
  itemId?: string;
  quantity?: number;
  label: string;
}

export interface ListLevel {
  level: number;
  requirementItemIds: ItemRequirement[];
  actions?: CheckboxAction[];
  rewards?: Reward[]; // Ricompense sbloccate a questo livello
}

export interface List {
  id: string;
  name: string;
  maxLevel: number;
  levels: ListLevel[];
  custom?: boolean;
  listType?: ListType;
  shared?: boolean;
  expirationDate?: string; // Data di scadenza opzionale (formato "YYYY-MM-DD")
}
```

---

## 🎨 Modifiche all'Interfaccia Utente (UI)

1. **Indicatori Temporali (UnifiedListCard & ListDetailPage)**:
   - Se il progetto ha una scadenza, viene mostrato il countdown (es. `Scade tra 5 giorni` o `Scade oggi`).
   - Se mancano meno di 3 giorni, l'indicatore assume una colorazione di avviso (es. arancione/rosso).
   - Se il progetto è scaduto, viene applicato un overlay visivo opaco con la dicitura `SCADUTO` e un banner che spiega che non è più possibile progredire o consegnare materiali.

2. **Visualizzazione Ricompense**:
   - Per ogni livello nella lista dei requisiti, viene inserita una sezione dedicata alle ricompense:
     * Se è definito un `itemId`, viene renderizzata l'icona dell'oggetto tratta da MetaForge (se presente in `itemsInfo`) e la quantità.
     * Se è presente solo la `label`, viene mostrata l'icona generica `🎁` con la descrizione testuale.

---

## 🧪 Validazione a Runtime e Sanitizzazione

#### [`src/lib/validate.ts`](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/lib/validate.ts)
Aggiorneremo i sanitizzatori delle liste per accogliere la nuova struttura dati:
- In `validateList`, sanitizzare `expirationDate` (assicurando che sia una stringa valida se presente).
- In `validateLevel`, mappare e validare l'array `rewards` per ciascun livello prima del caricamento.
