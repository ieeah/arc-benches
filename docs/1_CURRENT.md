# 1_CURRENT.md — Stato Attuale

Stato attuale di **ARC Benches**: funzionalità già costruite, testate e funzionanti nel codice reale.

---

- **Tracker Local-only (Fase 0)**: dati statici `items.json` e `workbenches.json`, script `fetch-items.mjs` da MetaForge, inventario e obiettivi persistiti in localStorage (`safeLS`), calcoli derivati spesa/mancanti, UI mobile-first e deploy automatico GitHub Pages.
- **Multi-profilo Locale & Liste Custom (Fase 1)**: storage namespaced per profilo (`arc-raiders-tracker-{profileId}`), switcher profili, liste custom (`custom: true`, ID `custom:<uuid>`) e liste condivise tra profili (`shared: true`), astrazione generica `List` e selettore `getAllLists()`.
- **Livelli Obiettivo come Insieme & Azioni Checkbox**: `targetLevels` gestito come insieme `Record<string, number[]>`, `CheckboxAction` per livello con auto-spunta al level-up, pagina di dettaglio [ListDetailPage](../src/pages/ListDetailPage.tsx).
- **Import / Export v3 Multi-profilo**: export e import di tutti i profili e liste condivise in formato JSON v3 con retrocompatibilità v1 e v2 e validazione type-guard in [validate.ts](../src/lib/validate.ts).
- **UI / UX Mobile-First & Navigatore Flottante Unificato**: sticky section headers, navigazione flessibile via [FloatingNav](../src/components/FloatingNav.tsx) (tap singolo per toggle rapido tra 2 pagine preferite, pressione prolungata per menu completo gerarchico, context menu `...` con switcher profili rapido e auto-hide automatico all'apertura di drawer/modali), pagina unificata [ListsPage](../src/pages/ListsPage.tsx) (`UnifiedListCard` responsive a progressive disclosure), sezioni collassabili (`CollapsibleSection`) e badge stack `×N`.
- **Pagina Impostazioni & Gestione Globale**: pagina dedicata [SettingsPage](../src/pages/SettingsPage.tsx) per la selezione tema chiaro/scuro, configurazione delle 2 pagine preferite per la navigazione rapida, posizione della barra flottante (destra/sinistra), gestione/creazione/eliminazione dei profili e backup/export globale.
- **Automatismo Inventario & Refiner Badge**: deduzione automatica materiali al level-up con prompt di conferma in caso di conflitto inventario con altri banchi; calcolo del badge "craftabile ora" / "richiede Refiner Lvl 2" in [craft.ts](../src/lib/craft.ts).
- **Role Maker — Randomizer di Personalità (Fase 3)**: generatore di personalità/ruoli per arricchire l'identity e il roleplay durante le spedizioni, con visualizzazione biografia, regole operative in raid, condizioni di vittoria e loadout consigliati in [RoleMakerModal](../src/components/RoleMakerModal.tsx).

