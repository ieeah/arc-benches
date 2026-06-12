Ciao! Voglio sviluppare una Web App Mobile-First che funga da Companion Tracker in Italiano per il videogioco "ARC Raiders". 

Il problema dei tracker attuali è che mostrano i costi dei potenziamenti del rifugio (banchi di lavoro) livello per livello, costringendo l'utente a fare calcoli mentali. La mia app deve aggregare TUTTI i costi dal livello attuale fino a un livello obiettivo selezionato, permettere di tracciare i materiali posseduti in tempo reale e calcolare dinamicamente quali banchi sono potenziabili.

Ecco le specifiche tecniche, l'architettura dei dati e il piano di sviluppo. Genera il codice passo dopo passo partendo dall'architettura dei dati.

---

### TECH STACK CONSIGLIATO
- **Framework:** Vite + React (TypeScript)
- **Stile:** Tailwind CSS (Approccio Mobile-First rigido)
- **State Management:** Zustand (con middleware 'persist' per salvare l'inventario e i filtri nel localStorage del telefono)
- **Icone:** Lucide React

---

### 1. ARCHITETTURA DEI DATI E STRUTTURA API
I dati grezzi arriveranno dall'API pubblica `https://arcdata.mahcks.com/v1/hideout?full=true`.
Dobbiamo strutturare i nostri tipi TypeScript per gestire:
1. I banchi del rifugio (`hideout_modules`), i loro livelli e i requisiti di materiali (`item_id`, `quantity`).
2. Lo stato dell'utente (Livello attuale di ogni banco, quantità posseduta di ogni materiale).
3. Lo stato dei filtri e degli obiettivi dell'utente.

**Definisci i seguenti stati nello Store di Zustand (`useAppStore`):**
- `hideoutLevels`: `{ [moduleId: string]: number }` (Livello attuale dell'utente. Es: `{ "workbench_weapons": 0 }`)
- `targetLevels`: `{ [moduleId: string]: number }` (Livello obiettivo dell'utente. Es: `{ "workbench_weapons": 3 }`)
- `activeModules`: `{ [moduleId: string]: boolean }` (Se un banco è incluso o escluso dal tracciamento)
- `inventory`: `{ [itemId: string]: number }` (Quantità di materiali posseduti. Es: `{ "item_metal": 12 }`)
- `filterHideCompleted`: `boolean` (Se nascondere i materiali già completati nella lista)

**Definisci le funzioni (Actions) per:**
- `incrementItem(itemId)`, `decrementItem(itemId)`, `setItemCount(itemId, val)`
- `setModuleTargetLevel(moduleId, level)`, `toggleModuleActive(moduleId)`
- `upgradeModule(moduleId)` (Incrementa il livello attuale di +1 e sottrae i materiali necessari dal magazzino)

---

### 2. LOGICA DI CALCOLO DINAMICA (Il "Cervello" dell'App)
Ho bisogno di quattro funzioni di calcolo avanzate (selettori dello store), che devono aggiornarsi istantaneamente a ogni modifica di inventario o filtri:

A. `getTotalRequiredMaterials()`
Cicla su tutti i moduli del rifugio. Se un modulo è attivo (`activeModules[id] === true`), calcola la somma dei materiali richiesti partendo dal livello attuale dell'utente (`hideoutLevels`) fino al livello obiettivo impostato (`targetLevels`). Genera una lista della spesa complessiva ed aggregata.

B. `getMissingMaterials()`
Confronta la lista della spesa aggregata generata dalla funzione A con l'inventario locale (`inventory`). Restituisce per ogni materiale lo stato: `[Posseduti / Richiesti Totali]` e la quantità mancante.

C. `getAvailableUpgrades()`
Controlla il *prossimo livello imminente* (Livello Attuale + 1) di ogni singolo banco attivo. Se l'inventario dell'utente copre TUTTI i requisiti di quel singolo livello specifico, contrassegna quel banco come "POTENZIABILE ORA".

---

### 3. INTERFACCIA UTENTE (Mobile-First, Layout a 2 Tab + Pannello Filtri)
L'interfaccia deve essere ottimizzata per l'uso a una mano su smartphone, con una Bottom Navigation Bar fissa per switchare tra le schede.

#### SEZIONE FILTRI E OBIETTIVI (In cima alle pagine o in un drawer a comparsa)
- **Filtro per Banco:** Switch/Checkbox per includere/escludere interi banchi dal calcolo totale (es. se gioco solo in solitaria e voglio ignorare il Banco Medico, lo disattivo e la lista della spesa globale esclude i suoi materiali).
- **Selettore Target:** Per ogni banco, permette di impostare il livello desiderato (es. "Sono al livello 0, voglio calcolare i costi solo fino al livello 2").
- **Toggle Rapido Inventario:** Un interruttore rapido "Nascondi completati" per pulire la visualizzazione nella Tab Zaino.

#### TAB 1: "Zaino & Materiali" (La lista della spesa globale)
- Mostra la lista verticale dei soli materiali necessari per soddisfare gli obiettivi impostati (esclude l'immondizia o i materiali dei banchi disattivati).
- Se `filterHideCompleted` è attivo, nasconde i materiali dove `Posseduto >= Richiesto`.
- Ogni riga mostra: Nome Oggetto (in Italiano), un badge visivo con lo stato `[Posseduto / Richiesto]`.
- Controller touch compatto a destra per incrementare/decrementare al volo a fine raid: Bottone `[-]`, valore, Bottone `[+]`.
- Se la quantità è raggiunta, la riga riceve un feedback visivo di successo (es. opacità ridotta o spunta verde).

#### TAB 2: "Rifugio / Sblocchi" (I Banchi di lavoro)
- Mostra una lista di Card verticali per ogni banco (Armi, Medico, Equipaggiamento, ecc.).
- Ogni card mostra graficamente il progresso (es: `Livello Attuale: 1 → Obiettivo: 3`).
- Sotto mostra l'elenco dei materiali richiesti *esclusivamente per il prossimo step di livello imminente*.
- **Feature Chiave:** Se il prossimo livello è "POTENZIABILE ORA" (calcolato dalla funzione C), la card si illumina con un bordo verde e mostra un pulsante gigante **"COMPLETA POTENZIAMENTO"**. Cliccando il pulsante, l'app esegue l'azione `upgradeModule`.

---

### DA DOVE COMINCIAMO:
Genera come prima cosa i file per lo **Store di Zustand (`store.ts`)** e i relativi **Tipi TypeScript (`types.ts`)** che implementano tutta l'architettura dei dati, i filtri di targetizzazione dei livelli e le funzioni di calcolo dinamico descritte.