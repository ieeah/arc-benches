# Analisi Tecnica Storica (Giugno 2026)

> Documento d'analisi e indirizzo per la revisione del codice, in vista delle feature future, della migrazione a DB esterno (Supabase), auth e sync.

---

## 0. Sintesi (TL;DR)

L'app è **solida e funzionalmente matura** come tracker local-only. Il modello dati `List` è ben progettato e pronto per il DB; la separazione pagine↔componenti è rispettata; la UX mobile è curata.

I tre punti deboli identificati:
1. **Persistenza inlined nelle action**: Creare un boundary di persistenza unico prima dell'integrazione con Supabase.
2. **Confine di validazione**: Introdurre schema validation (Zod) per dati importati o deserializzati.
3. **Accessibilità overlay/drawer**: Introdurre `role="dialog"`, focus trap e chiusura tramite tasto Esc.

---

## 1. Regole dei Drawer

- **Regola**: Un `Drawer` si apre sempre dal lato del pulsante che lo attiva.
  - Trigger in alto $\rightarrow$ `from="top"`
  - Trigger in basso $\rightarrow$ `from="bottom"`
  - Trigger laterale $\rightarrow$ `left`/`right`

---

## 2. Accessibilità (A11y)

- **Overlay**: Estrazione di uno shell accessibile `BottomSheet`/`Drawer` condiviso.
- **Controlli Icon-only**: Aggiunta sistematica di `aria-label` su pulsanti +/- e selettori.
- **Supporto Tastiera**: Introduzione di `KeyboardSensor` in `@dnd-kit` e chiusura modali tramite tasto Esc.
- **WCAG AA**: Verifica contrasti cromatici sui testi piccoli (`text-gray-400`).

---

## 3. Architettura verso DB / Sync (Supabase)

- **Persistence Boundary**: Unificare le chiamate di persistenza nello store Zustand tramite middleware o l'hook di profilo.
- **Store Refactoring**: Scomposizione di `store.ts` in slice isolate (completato).
- **Import/Export Validation**: Aggiungere validazione a runtime (Zod) sui file JSON caricati dall'utente.
