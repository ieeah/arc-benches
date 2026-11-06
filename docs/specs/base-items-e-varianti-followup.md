# Specifica Tecnica: Follow-up Base Items Studio, Dettaglio Oggetti e Ricerche Armi Amplificate

> **Stato**: Approvato per implementazione in **0.5.1 Taratura del Segnale**  
> **Contesto**: Consolidamento e rifinitura delle funzionalità introdotte con il nuovo modello dati Base Items e Varianti (#143).

---

## 1. Obiettivi e Motivazioni

L'introduzione del modello dati esplicito `baseItem` / `variants` (#143) ha risolto alla radice la ridondanza nei selettori e nel catalogo. Questo documento formalizza i requisiti di rifinitura e miglioramento UX/funzionali emersi dai primi test per le prossime iterazioni.

---

## 2. Punti di Intervento Dettagliati

### 2.1. Combobox / Autocomplete per la Selezione del Blueprint Collegato
- **Problema**: Nel pannello Dev Studio (`#/dev-base-items`), la selezione del `blueprintItemId` tramite semplice `<select>` nativa diventa poco maneggevole dato l'elevato numero di progetti di gioco (>90).
- **Soluzione**: Sostituire la `<select>` con un componente combobox/autocomplete ricercabile in tempo reale per nome (IT/EN) o ID tecnico (`#anvil-recipe`), con selezione rapida, svuotamento opzionale (*Nessun blueprint*) e visualizzazione dell'anteprima dell'icona.

### 2.2. Reset Automatico della Sottocategoria al Cambio del Tipo Oggetto
- **Problema**: Quando l'utente modifica il "Tipo Oggetto" (es. da *Weapon* a *Resource*), la sottocategoria precedentemente selezionata (es. *Hand Cannon*) rimane impostata, creando un'incongruenza logica nei metadati.
- **Soluzione**: All'evento `onChange` del selettore "Tipo Oggetto", azzerare/resettare automaticamente il campo `subcategory` a `null`, ricalcolando la lista delle opzioni pertinenti alla nuova categoria scelta.

### 2.3. Gestione Traduzioni Multi-lingua Scalabile in Dev Studio
- **Problema**: L'attuale form di Dev Base Items espone input cablati unicamente per Inglese e Italiano.
- **Soluzione**: Allineare l'editor al pattern già consolidato in *Dev Overrides* e *Custom Items Studio*:
  - Selettore della lingua target basato su `SUPPORTED_LANGUAGES` (es. `it`, `de`, `fr`, `es`...).
  - Campi dinamici per `name` e `description` relativi alla lingua correntemente selezionata nel tab/dropdown linguistico.

### 2.4. Gestione del Focus per il Picker Icona da Catalogo
- **Problema**: All'apertura dello strumento "Cerca icona da catalogo", l'utente deve cliccare manualmente sull'input di testo per iniziare a cercare. Alla chiusura, il focus viene perso.
- **Soluzione**:
  - All'attivazione del pannello/modalità ricerca icona (`showIconPicker: true`), applicare automaticamente il focus all'input di ricerca (`inputRef.current?.focus()`).
  - Alla chiusura o selezione dell'icona, ripristinare il focus sull'elemento che aveva scatenato l'apertura (pulsante "Cerca icona da catalogo").

### 2.5. Navigazione Bidirezionale Dettaglio Oggetto <-> Blueprint
- **Problema**: Nel foglio di dettaglio ([`ItemDetailSheet.tsx`](../../src/components/ItemDetailSheet.tsx)), quando si visualizza un'arma è presente il link rapido per aprire la scheda del relativo Blueprint (`📜 Blueprint`). Tuttavia, quando ci si trova sulla scheda del Blueprint, non esiste un'affordance per tornare all'oggetto/arma prodotta.
- **Soluzione**: Nel dettaglio di un Blueprint, individuare l'oggetto prodotto (o il Base Item collegato) e mostrare un pulsante rapido analogo (es. `🎯 Arma Prodotta: Incudine` o `← Oggetto Collegato`) per consentire la navigazione fluida in entrambe le direzioni.

### 2.6. Riorganizzazione Sezione "Craft e Potenziamenti" e Ricerche per Armi Amplificate
- **Problema**: Distinguere in righe separate "Craft" e "Potenziamento" genera confusione, e per le armi amplificate manca l'informazione cruciale sulle ricerche necessarie.
- **Soluzione**:
  1. Unificare le righe del dettaglio sotto una sola voce chiara: **"Craft e Potenziamenti"**, che indichi sinteticamente il banco e il livello richiesto.
  2. Per le **armi amplificate**:
     - Visualizzare chiaramente il requisito di partenza (*Richiede arma Lvl IV + Modulo di Amplificazione*).
     - Integrare l'elenco delle **ricerche necessarie** sbloccate presso la *Research Station*.
     - Se i dati strutturati sulle ricerche non sono immediatamente disponibili nei file correnti, tracciare il reperimento e l'importazione dei dati delle ricerche come task dedicato nella milestone **0.5.1**.
