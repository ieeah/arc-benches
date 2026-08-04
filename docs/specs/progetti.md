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

### 3. Gestione Ricompense (Rewards)
* Ogni livello del progetto (`ListLevel`) può contenere un array di ricompense (`rewards`).
* Ciascuna ricompensa ha la seguente forma:
  ```typescript
  export interface Reward {
    itemId?: string;    // ID dell'oggetto nel database MetaForge (opzionale)
    quantity?: number;  // Quantità (opzionale, es. 2 se itemId è "metal-parts")
    label: string;      // Descrizione generica (es. "Sblocco Blueprint Refiner Lvl 3" o "+150 Raider Tokens")
  }
  ```
* **Integrazione con lo Stash**: Almeno inizialmente, le ricompense **non** vengono caricate o accreditate in automatico all'inventario/stash del tracker per evitare complicanze di allineamento. L'indicatore è puramente informativo per supportare la pianificazione del giocatore.
* **Caricamento a Runtime**:
  * Se `itemId` è definito, il tracker recupera le informazioni relative all'oggetto (nome, descrizione, rarità e icona di MetaForge) dinamicamente da `itemsInfo` per visualizzarle graficamente.
  * Altrimenti (o se l'oggetto non esiste), viene mostrata un'icona regalo standard `🎁` con la `label` fornita.
* Nella UI:
  * Livello completato $\rightarrow$ Mostra la ricompensa come `Ottenuta ✅`.
  * Livello bloccato/progetto scaduto $\rightarrow$ Mostra la ricompensa come `Persa / Bloccata` (grigia o con lucchetto).
  * Livello attivo $\rightarrow$ Mostra la ricompensa come `Disponibile al completamento`.

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
  // ... esistente ...
  rewards?: Reward[]; // Ricompense sbloccate a questo livello
}

export interface List {
  // ... esistente ...
  expirationDate?: string; // Data e ora di scadenza ISO (es. "2026-09-30T20:00:00+02:00")
}
```

---

## 🎨 Modifiche all'Interfaccia Utente (UI)

1. **Indicatori Temporali (UnifiedListCard & ListDetailPage)**:
   - Se il progetto ha una scadenza, viene mostrato il countdown:
     * `Scaduto` (se scaduto).
     * `Scade tra {N} ore` (se mancano meno di 24 ore, colorazione rossa d'urgenza).
     * `Scade tra {N} giorni` (colorazione arancione d'urgenza se $\le 3$ giorni).
   - Se il progetto è scaduto (`isExpired === true`), viene applicato un overlay visivo opaco con la dicitura `SCADUTO` e le interazioni vengono bloccate (`opacity-60 pointer-events-none`).

2. **Visualizzazione Ricompense**:
   - Per ogni livello nella lista dei requisiti, viene inserita una sezione dedicata alle ricompense:
     * Se è definito un `itemId` valido, viene renderizzata l'icona dell'oggetto tratta da MetaForge (se presente in `itemsInfo`) e la quantità.
     * Se è presente solo la `label`, viene mostrata l'icona generica `🎁` con la descrizione testuale.

---

## 🧪 Validazione a Runtime e Sanitizzazione

#### [`src/lib/validate.ts`](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/lib/validate.ts)
Aggiorneremo i sanitizzatori delle liste per accogliere la nuova struttura dati:
- In `validateList`, sanitizzare `expirationDate` verificando che sia una stringa di data parsabile.
- In `validateLevel`, mappare e validare l'array `rewards` per ciascun livello prima del caricamento.
