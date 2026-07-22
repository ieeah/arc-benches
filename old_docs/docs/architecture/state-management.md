# Architettura Gestione Stato (State Management)

Documento di dettaglio sull'architettura dello stato di **ARC Benches**.

---

## 🏗 Zustand & Slice per Dominio (`src/store.ts`)

La gestione dello stato client si basa su **Zustand**, organizzato in slice distinte per dominio funzionale:
- **`inventory`**: Tracciamento delle quantità possedute per ciascun oggetto.
- **`progress`**: Livelli attuali (`hideoutLevels`) e obiettivi (`targetLevels`) dei banchi/liste.
- **`lists`**: Gestione del seed dei banchi di gioco e delle liste custom (`customLists`), inclusa la priorità `listOrder`.
- **`profile`**: Gestione del profilo attivo e della persistenza multi-profilo.

---

## 💾 Persistenza Esplicita & `safeLS` (`src/lib/safeStorage.ts`)

Il middleware `persist` nativo di Zustand è stato deliberatamente rimosso per evitare errori silenziosi o desincronizzazioni di storage.

### Regole della Persistenza
1. **Inizializzazione**: All'avvio dell'applicazione viene invocata la funzione `load()`.
2. **Salvataggio Esplicito**: Ogni azione che modifica uno stato da salvare richiama `save()`.
3. **Pick Selettivo**: `save()` effettua un pick esplicito delle sole chiavi destinate alla persistenza (`PersistedState`). Il seed statico di gioco (`workbenches`, `itemsInfo`) non finisce mai in `localStorage`.
4. **Isolamento via `safeLS`**: Tutti gli accessi a `localStorage` sono gestiti tramite try/catch e isolati nel modulo `safeStorage.ts`. In ambienti in cui `localStorage` è bloccato (es. iframe o contesti ristretti), l'app continua a funzionare regolarmente senza crashare.

---

## 🔄 Modello Generico `List`

Il tipo generico `List` (definito in `src/types.ts`) unifica il comportamento dei banchi da lavoro e delle liste personalizzate dell'utente:
- **Banchi del gioco**: Seed read-only (`listType: 'workbench'`).
- **Liste Custom**: Istanze utente (`custom: true`, `id` namespaced `custom:<uuid>`).
- **Liste Condivise**: Liste custom contrassegnate come `shared: true` (riutilizzabili tra diversi profili utente).

### Union e Selettori
Il selettore `getAllLists()` effettua l'unione `[...workbenches, ...customLists]`. Tutti i selettori e le azioni dell'applicazione (`upgradeModule`, `setModuleCurrentLevel`, `getOrderedLists`, `getMissingMaterials`) operano sul risultato di `getAllLists()`. Di conseguenza, le liste custom ereditano automaticamente tutte le funzionalità di aggregazione dei costi, calcolo dei mancanti e priorità.

---

## 🔒 Invarianti di Stato

Le regole di business e le invarianti di stato sono mantenute all'interno dello store Zustand, mai nei componenti UI:
1. **Target Level sempre $\ge$ Current Level**: Se il livello attuale raggiunge il livello obiettivo, l'obiettivo viene automaticamente promosso al livello successivo (con clamp al livello massimo disponibile).
2. **Deduzione Materiali**: Alzare il livello attuale tramite i controlli visuali scala automaticamente i materiali dall'inventario (`setModuleCurrentLevel(..., deductMaterials)`).
3. **Livello Base**: Scrappy parte dal livello 1 (`defaultHideoutLevels`) perché sbloccato di default. Il livello base dei banchi è derivato dai requisiti dati.
