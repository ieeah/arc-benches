# 1_CURRENT.md — Stato Attuale

Stato attuale di **ARC Benches**: funzionalità già costruite, testate e funzionanti nel codice reale.

---

- **Tracker Local-only (Fase 0)**: dati statici `items.json` e `workbenches.json`, script `fetch-items.mjs` da MetaForge, inventario e obiettivi persistiti in localStorage (`safeLS`), calcoli derivati spesa/mancanti, UI mobile-first e deploy automatico GitHub Pages.
- **Multi-profilo Locale & Liste Custom (Fase 1)**: storage namespaced per profilo (`arc-raiders-tracker-{profileId}`), switcher profili, liste custom (`custom: true`, ID `custom:<uuid>`) e liste condivise tra profili (`shared: true`), astrazione generica `List` e selettore `getAllLists()`.
- **Livelli Obiettivo come Insieme & Azioni Checkbox**: `targetLevels` gestito come insieme `Record<string, number[]>`, `CheckboxAction` per livello con auto-spunta al level-up, pagina di dettaglio [ListDetailPage](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/pages/ListDetailPage.tsx).
- **Import / Export v3 Multi-profilo**: export e import di tutti i profili e liste condivise in formato JSON v3 con retrocompatibilità v1 e v2 e validazione type-guard in [validate.ts](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/lib/validate.ts).
- **UI / UX Mobile-First**: sticky section headers, navigazione flessibile via [FloatingNav](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/components/FloatingNav.tsx) a 2 pulsanti, pagina unificata [ListsPage](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/pages/ListsPage.tsx) (`UnifiedListCard` a progressive disclosure), sezioni collassabili (`CollapsibleSection`) e badge stack `×N`.
- **Automatismo Inventario & Refiner Badge**: deduzione automatica materiali al level-up con prompt di conferma in caso di conflitto inventario con altri banchi; calcolo del badge "craftabile ora" / "richiede Refiner Lvl 2" in [craft.ts](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/lib/craft.ts).
- **Selettori Zustand & Memoizzazione Pure**: selettori estratti in funzioni pure in [selectors.ts](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/store/selectors.ts) con lookup $O(1)$ per ordinamento liste e algoritmo di sottrazione per `getOtherNeedsPure`.
- **Accessibilità Drawer & Focus Trap**: componente [Drawer](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/components/Drawer.tsx) integrato con l'hook [useDialog](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/hooks/useDialog.ts) per gestione stack modali, `role="dialog"`, `aria-modal`, trappola `Tab`, cattura `Escape` e ripristino del focus.
