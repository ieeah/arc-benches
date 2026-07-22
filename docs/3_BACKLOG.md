# 3_BACKLOG.md — Debito Tecnico & Bug

Elenco dei bug, debito tecnico e miglioramenti su funzionalità esistenti in **ARC Benches**.

---

- **Accessibilità Overlay Legacy & Controlli**: estensione di `useDialog` agli overlay non ancora migrati, aggiunta `aria-label` su controlli icon-only (`LevelPills`, +/-) e verifica contrasti WCAG AA — vedi dettaglio in [accessibilita-overlay-e-controlli.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/specs/bugs/accessibilita-overlay-e-controlli.md).
- **Persistence Boundary Unico**: unificazione dei salvataggi Zustand nel sottoscrittore dello store in [src/store/index.ts](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/store/index.ts) (`useAppStore.subscribe`), che agisce come unico scrittore verso `localStorage` (`safeLS`), rimuovendo la persistenza inlined dalle singole action dei domini.
- **Validazione Runtime Schemi (Zod)**: introduzione di schemi di validazione a runtime (Zod) per sanitizzare JSON deserializzati da localStorage e da import file esterni.
- **Supporto Tastiera per Drag & Drop**: aggiunta del `KeyboardSensor` di `@dnd-kit` per consentire il riordinamento delle priorità da tastiera.
- **Revisione Ordine Menu FloatingNav**: ridefinizione dell'ordine ergonomico delle voci contestuali e universali nel menu a comparsa della pillola [FloatingNav](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/components/FloatingNav.tsx).
- **Lockfile NPM WASM Check**: mantenimento della procedura `npm run check:lock` per isolare dipendenze native pesanti (`scripts/package.json`) ed evitare fallimenti `EUSAGE` in CI Linux.
