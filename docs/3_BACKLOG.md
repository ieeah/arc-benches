# 3_BACKLOG.md — Debito Tecnico, Refactor & Ottimizzazioni

Elenco dei bug, debito tecnico, refactoring e miglioramenti su funzionalità esistenti in **ARC Benches**, allineato alla sequenza di milestone in [VERSIONING.md](VERSIONING.md).

---

## 0.5.0 "Segnale Radio" — Gestione dei Dati di 1° Livello
- [x] #143 [Catalogo: gestione e raggruppamento estetico/algoritmico di varianti d'arma, livelli (I-IV) e schemi omonimi](https://github.com/ieeah/arc-benches/issues/143) — il DB resta 100% compatibile con MetaForge; l'aggregazione famiglie (`getItemFamily`) e la disambiguazione `Blueprint`/`Design` avvengono a runtime/UI. Bloccante per #88.
- [x] #88 [UX `ItemPicker`: pool di oggetti contestuali, relevance ranking e cap risultati](https://github.com/ieeah/arc-benches/issues/88) — tre pool contestuali per punto d'uso (Opzione C + Variante A1), ranking per rilevanza e cap DOM a 50 elementi. Dipende da #143 e dalla bonifica categorie in #144.
- [x] #102 [Moduli attivabili per profilo (`isSectionActive`)](https://github.com/ieeah/arc-benches/issues/102) — toggle nelle impostazioni per spegnere sezioni non usate (Spedizioni, Progetti, Pass).
  - *Specifica tecnica*: [docs/specs/moduli-attivabili-per-profilo.md](specs/moduli-attivabili-per-profilo.md)
- [x] #74 [Export/import completo: tutti i campi del profilo inclusi nel backup](https://github.com/ieeah/arc-benches/issues/74) — dopo #102, include moduli attivi, pass completati con timestamp, livelli attivi e azioni.
- [x] #160 [Rendere riconoscibili le liste disattivate in Banchi e Liste anche a card chiusa](https://github.com/ieeah/arc-benches/issues/160) — bordo ambra tratteggiato, opacità 80%, badge Inattivo e griglia requisiti desaturata.
- [x] #157 [Aggiunta rapida materiali mancanti alla pianificazione raid (da dettaglio o card)](https://github.com/ieeah/arc-benches/issues/157) — trasferimento rapido del fabbisogno mancante dallo Stash al Raid Plan; richiede analisi preventiva tra pulsante nel dettaglio ed dropdown azioni su card.
- [x] #144 [Consolidamento, bugfix e rifiniture pre-rilascio 0.5.0](https://github.com/ieeah/arc-benches/issues/144) — bugfix «Applica» override in Dev, bonifica categorie errate nel catalogo tramite override, icone Raider Token/Emote, rifiniture UI Pass e Blueprint (dettagli in [consolidamento-0.5.0.md](consolidamento-0.5.0.md)).
- [ ] Fix/Raffinamento: calibrazione dissolvenza di uscita (`fadeMs`) da Hold — uniformare l'aggancio di `transitionDuration` inline/Tailwind su `holdExit.fadeMs`.

---

## 0.5.1 "Taratura del Segnale" — Consolidamento 0.5.0 & Tooling Vite
- [ ] #135 [Refactor Layout: migrazione pagine esistenti a `PageLayout` e testing layout/scroll](https://github.com/ieeah/arc-benches/issues/135) — applica `PageLayout` (#134) a `StashPage`, `ListsPage`, `BlueprintsPage`, `PassPage` e `PassesOverviewPage`.
- [ ] #136 [Refactor Layout: standardizzazione layout unificato `PageLayout` e fix retroattivo](https://github.com/ieeah/arc-benches/issues/136) — insieme a #135.
- [x] #133 [Refactor Codice: verifica retroattiva adozione `type` e standard mobile/touch-first](https://github.com/ieeah/arc-benches/issues/133)
- [x] #69 [UX Stash: ordinamento per priorità multi-criterio (Banco + Livello)](https://github.com/ieeah/arc-benches/issues/69) — selettore `getItemPriorityMapPure` con doppia modalità configurabile nelle Impostazioni (`Lista → Livello` / `Livello → Lista`), esclusione scaduti/consegnati e allineamento ordine azioni e dipendenze.
- [x] #125 [A11y UI: scrollbar nascosta nelle liste di pill orizzontali senza altra affordance di scorrimento](https://github.com/ieeah/arc-benches/issues/125)
- [x] #126 [Fix HTML: `lang` dinamico, titolo e meta description in `index.html`](https://github.com/ieeah/arc-benches/issues/126)
- [ ] #149 [Refactor i18n: rimozione assunzioni binarie ('it' vs 'en') ed estensione traduzioni in Dev Studio](https://github.com/ieeah/arc-benches/issues/149) — elimina controlli rigidi e assicura che nel Dev Studio sia possibile inserire/modificare traduzioni per tutte le lingue supportate.
- [x] #150 [UX Card: background grafici dedicati per Armi amplificate, Stencil e Design](https://github.com/ieeah/arc-benches/issues/150) — background dedicati in `ItemCardFrameV2` per oggetti Amplificati (armi e moduli, 4 bande + gradiente), Design (griglia `2px` con crocette `+`) e Blueprint (`blueprint-bg.jpg`), con rimozione del componente legacy `ItemCardFrame`.
- [x] #151 [Refactor Types: decomposizione modulare di `src/types.ts` in `src/types/` con barrel export](https://github.com/ieeah/arc-benches/issues/151) — scomposizione per dominio (sections, items, lists, export, personality, raid, store) preservando retrocompatibilità `@/types`.
- [ ] #152 [Refactor Nav: estrazione logica condivisa tra `FloatingNav` e `MorphingFloatingNav`](https://github.com/ieeah/arc-benches/issues/152) — hook comune `useFloatingNavState`, pulsante atomico radar raid e navigazione quick favorites/drill-down.
- [x] #153 [Chore Vite: pulizia configurazione Vite, rimozione avvisi native config e conformità ESM](https://github.com/ieeah/arc-benches/issues/153) — adozione `import.meta.dirname` ed estensioni `.ts` esplicite negli import plugin.
- [ ] #154 [Refactor Settings: decomposizione modulare di `SettingsPage.tsx` in sezioni atomiche](https://github.com/ieeah/arc-benches/issues/154) — estrazione `AppearanceConfigSection`, `NavigationErgonomicsSection`, `ProfilesManagerSection`, `BackupPortabilitySection`.
- [ ] #155 [Refactor Dev: estrazione di componenti riutilizzabili per le pagine Dev Studio (de-inlineing JSX)](https://github.com/ieeah/arc-benches/issues/155) — barra azioni unificata bozze, filtri e dialog di diff condivisi tra le pagine dev.
- [x] #158 [Refactor Liste: parità tra azioni e oggetti in tutti i calcoli di progresso e fix `getBaseLevel`](https://github.com/ieeah/arc-benches/issues/158) — fix `getBaseLevel` su livelli 1 con azioni/step, `currentLevelOf` uniforme nei selettori e store, peso `0%` sulle azioni future fuori finestra, consegne `item_<id>` considerate in `hasDeductionConflict`/`getOtherNeedsPure`/`getAvailableUpgradesPure`/`progressSlice`, e parità azioni/prerequisiti anche a card chiusa.
- [x] #119 [Perf Build: code-splitting delle pagine con `React.lazy` e rimozione pagine Dev dalla build di produzione](https://github.com/ieeah/arc-benches/issues/119) — anticipato da 0.9.0 a 0.5.1; riduce drasticamente il chunk principale (~1.53 MB).
- [x] Refactor & Follow-up: Base Items Studio, Dettaglio Oggetto e Ricerche Armi Amplificate — combobox blueprint, reset sottocategoria, traduzioni multi-lingua scalabili, focus management icon picker, navigazione bidirezionale blueprint/oggetto, raggruppamento "Craft e Potenziamenti" e dati ricerche amplificazioni. *Specifica tecnica*: [docs/specs/base-items-e-varianti-followup.md](specs/base-items-e-varianti-followup.md).
- [x] #127 [Build: passare a `@tailwindcss/vite` e rimuovere PostCSS/autoprefixer e config Tailwind legacy](https://github.com/ieeah/arc-benches/issues/127)
- [x] #114 [UX Liste: elenco unico senza raggruppamento per tipo, card differenziate e più intuitive](https://github.com/ieeah/arc-benches/issues/114) — elenco unico per priorità globale in ListsPage con ListTypeBadge, rango #N e ghost card Drag-Reveal per le liste filtrate.

---

## 0.6.0 "Archivio del Rifugio" — Dati di 2° Livello (Refactor UI Liste)
- [ ] #156 [Gestione azioni liste: riordinamento e azioni composte (sotto-azioni lineari o libere)](https://github.com/ieeah/arc-benches/issues/156) — riordinamento touch-first (Dnd + controlli touch) e macro-azioni con sotto-azioni lineari o libere.

---

## 0.6.x "Consolidamento & Dati Estesi"
- [ ] #146 [Refactor Spedizioni: revisione UX/UI e correzione logica pregresso, vincoli, requisiti e progressione](https://github.com/ieeah/arc-benches/issues/146)
- [ ] #76 [Dev Quest: redesign da zero pagina Dev gestione quest e visualizzazione dipendenze in ottica mobile-first](https://github.com/ieeah/arc-benches/issues/76) — sviluppata insieme al Quest Tracker utente (#58).
- [ ] #93 [UX Stash / Impostazioni: filtri per fonte lista configurabili nelle Impostazioni](https://github.com/ieeah/arc-benches/issues/93) — permette di scegliere quali tipologie di lista alimentano il fabbisogno dello Stash.
- [ ] #37 [Role Maker: arricchimento, coerenza gameplay e correzione meccaniche](https://github.com/ieeah/arc-benches/issues/37) — insieme a #101.

---

## 0.7.0 "Guida di Speranza" — Preparazione UI/UX, Base UI & Struttura Pagine (Pre-Migrazione)
Ordine di lavoro vincolato (**#141 prima del passaggio a Base UI**):
1. [ ] #141 [Dev Studio: UI Kit & Component Playground con vista comparativa e adozione incrementale Base UI](https://github.com/ieeah/arc-benches/issues/141)
2. [ ] #121 [Refactor UI: migrare Drawer, BottomSheet e modali a `<dialog>` nativo / Base UI Dialog](https://github.com/ieeah/arc-benches/issues/121) — elimina il focus trap manuale di `useDialog`; correlata a ADR 003 e #60.
3. [ ] #122 [Refactor UI: rimuovere lo scroll lock su html/body e usare `overscroll-behavior` sul dialog](https://github.com/ieeah/arc-benches/issues/122) — dopo #121.
4. [ ] #60 [Refactor UI/UX Globale: consolidamento componenti, modali, drawer e densità visiva con Base UI](https://github.com/ieeah/arc-benches/issues/60)
5. [ ] #115 [UX Design: valutare e applicare un redesign dell'app, oggi troppo «Tailwind generico»](https://github.com/ieeah/arc-benches/issues/115) — insieme a #60.
6. [ ] #4 [Accessibilità: supporto tastiera per Drag & Drop](https://github.com/ieeah/arc-benches/issues/4)
7. [ ] #116 [UX Pagine: pagina di dettaglio per ogni lista, pagina dell'Outpost e riorganizzazione delle pagine](https://github.com/ieeah/arc-benches/issues/116) — prepara la gerarchia delle viste per l'App Router di Next.js (#28).

---

## 0.8.0 "Ponte Next & Supabase" — Refactor Impostazioni sulla Nuova Persistenza
- [ ] #148 [Refactor Impostazioni: redesign completo pagina Impostazioni, audit globale preferenze e integrazione nuova persistenza](https://github.com/ieeah/arc-benches/issues/148) — raccoglie tutte le preferenze tracciate durante `0.5.0` → `0.7.0` (#102, #75, #93, #26, #112) integrandole nel nuovo livello di persistenza Next.js/Supabase (#28, #14–#16).

---

## 0.9.0 "Rifinitura Tattica" — Performance & Ottimizzazione sul Nuovo Stack
- [ ] #119 [Performance Build: ottimizzazione code-splitting delle rotte ed esclusione pagine Dev/Admin dal bundle client pubblico](https://github.com/ieeah/arc-benches/issues/119)
- [ ] #120 [Performance Data: caricamento dinamico dei payload pesanti e di Leaflet](https://github.com/ieeah/arc-benches/issues/120) — insieme a #119.
- [ ] #142 [Performance Search: analisi pre-calcolo token normalizzati e indice di ricerca per il catalogo](https://github.com/ieeah/arc-benches/issues/142)
- [ ] #11 [Performance Rendering: virtualizzazione e ottimizzazione per liste lunghe (Catalogo e Stash)](https://github.com/ieeah/arc-benches/issues/11)

---

## Completati di recente (0.5.0 / 0.5.1)
- [x] #137, #138, #139, #140 [Fix scroll mobile ItemCard, computo materiali a scalare barre progresso (#130), pill "Completati" per azioni nello Stash e internazionalizzazione testi/a11y residui].
- [x] #134 [Componente unificato `PageLayout` (header sticky, action bar e footer copyright)](https://github.com/ieeah/arc-benches/issues/134)
- [x] #129 [Badge per gli oggetti acquistabili dai commercianti (`TraderBadge`)](https://github.com/ieeah/arc-benches/issues/129)
- [x] #123 & #128 [`dvh`/`svh` al posto di `vh`/`h-screen` e adozione `modern-web-guidance` nel flusso di lavoro].
- [x] #87 & #90 [Progetto Outpost completo e Reward Pass Tracker].
- [x] #79 [UX Liste & Progetti: opzione "extractionWiped"](https://github.com/ieeah/arc-benches/issues/79)
- [x] #86 [Dati banchi al Lvl 3 (Frozen Trail)](https://github.com/ieeah/arc-benches/issues/86)
- [x] #72 & #73 [Tipi liste: discriminated union completa su `listType`].
- [x] #80 [Bug Stash: contatore quantità che torna a zero](https://github.com/ieeah/arc-benches/issues/80)
