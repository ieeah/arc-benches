# 3_BACKLOG.md — Debito Tecnico & Bug

Elenco dei bug, debito tecnico e miglioramenti su funzionalità esistenti in **ARC Benches**.

---

- **Accessibilità Overlay Legacy & Controlli**: estensione di `useDialog` agli overlay non ancora migrati, aggiunta `aria-label` su controlli icon-only (`LevelPills`, +/-) e verifica contrasti WCAG AA — vedi dettaglio in [accessibilita-overlay-e-controlli.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/specs/bugs/accessibilita-overlay-e-controlli.md).
- **Persistence Boundary Unico**: unificazione dei salvataggi Zustand nel sottoscrittore dello store in [src/store/index.ts](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/store/index.ts) (`useAppStore.subscribe`), che agisce come unico scrittore verso `localStorage` (`safeLS`), rimuovendo la persistenza inlined dalle singole action dei domini.
- **Validazione Runtime Schemi (Zod)**: introduzione di schemi di validazione a runtime (Zod) per sanitizzare JSON deserializzati da localStorage e da import file esterni.
- **Supporto Tastiera per Drag & Drop**: aggiunta del `KeyboardSensor` di `@dnd-kit` per consentire il riordinamento delle priorità da tastiera.
- **Revisione Ordine Menu FloatingNav**: ridefinizione dell'ordine ergonomico delle voci contestuali e universali nel menu a comparsa della pillola [FloatingNav](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/components/FloatingNav.tsx).
- **Lockfile NPM WASM Check**: mantenimento della procedura `npm run check:lock` per isolare dipendenze native pesanti (`scripts/package.json`) ed evitare fallimenti `EUSAGE` in CI Linux.
- **Overflow Componenti Floating**: correggere tooltip e dropdown (es. conferma ripristino magazzino) che escono dalla viewport, introducendo un riposizionamento dinamico per evitarne il taglio.
- **UX Input Numerici Stash**: permettere di svuotare temporaneamente l'input numerico nelle card dello stash (per facilitare la riscrittura su mobile) e limitare automaticamente il valore inserito al numero massimo rimanente (es. cap a 30 se l'utente inserisce 300).
- **Icone Categoria Elementi**: verificare se l'API di MetaForge espone l'icona della categoria per ciascun oggetto (es. "Materiale da Creazione"); in caso affermativo, estrarla tramite lo script e visualizzarla nelle card del magazzino e nel dettaglio del database.
- **Logica Icona Refiner in Stash**: verificare se l'indicatore "costruibile" (icona refiner) nelle card dello stash tiene conto solo del livello del banco o se valuta anche l'effettiva disponibilità dei materiali necessari, per correggere o perfezionare il comportamento.
