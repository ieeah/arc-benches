# Spedizioni & Progetti (Fase 3)

Questa specifica espande la funzionalità "Spedizioni" prevista per la Fase 3, che si baserà sull'infrastruttura esistente del motore `List`, ma estenderà il tipo di requisiti necessari per completare un livello o uno step.

## Meccaniche Ibride

A differenza dei Banchi standard (che richiedono esclusivamente $X$ quantità di un oggetto specifico), le Spedizioni presentano **step e requisiti misti**:

1. **Raccolta Oggetti Specifici**: La meccanica classica (es. trovare 10 CPU).
2. **Azioni Specifiche**: Requisiti sotto forma di task/checkbox (es. "esplora il settore Y").
3. **Donazioni a Valore (Nuova Meccanica)**: L'utente deve "donare" oggetti appartenenti a una specifica macro-categoria (es. *Oggetti da Combattimento*, *Provviste*, *Materiali*) fino a raggiungere un **Target di Valore monetario** (es. 200.000 🪙).
   - *Nota screenshot di riferimento*: La UI del gioco presenta barre di progresso dedicate per categoria con l'icona del denaro e un indicatore `0/200.000`.

## Sfide UI/UX da affrontare

L'introduzione della meccanica di donazione a valore impone delle modifiche alle interfacce esistenti:

### 1. Fase di Creazione (CustomListEditor / Editor Spedizioni)
- Come l'utente inserirà un requisito di tipo "Donazione Valore" invece del classico "Aggiungi Oggetto"?
- Selezione della Categoria (tipo oggetto) e inserimento del Valore Target numerico.

### 2. Fase di Completamento / Utilizzo (Vista Lista)
- A causa dell'impossibilità di mantenere il magazzino virtuale perfettamente sincronizzato con quello reale del gioco dopo ogni singolo raid, il tracciamento del valore puntuale e la decurtazione degli oggetti dallo stash sono irrealistici.
- Pertanto, per le spedizioni, la **Donazione a Valore** verrà gestita nella UI come una **azione (checkbox)**, ad esempio: `[ ] Donazione Provviste Completata (0/200.000)`.
- L'utente spunterà la casella una volta che avrà completato la donazione direttamente in gioco, semplificando drasticamente l'interazione e la gestione dei dati.
