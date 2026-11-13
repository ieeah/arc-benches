# Versioning

Piano previsionale delle versioni verso l'MVP (`1.0.0`) e oltre, basato sui task presenti in [1_CURRENT.md](1_CURRENT.md), [2_ROADMAP.md](2_ROADMAP.md) e [3_BACKLOG.md](3_BACKLOG.md) e consolidato nella revisione architetturale ([revisione-roadmap-dati-verso-1.0.0.md](revisione-roadmap-dati-verso-1.0.0.md) e [revisione-roadmap-tecnica-ui-verso-1.0.0.md](revisione-roadmap-tecnica-ui-verso-1.0.0.md)).
Il contenuto testuale del cosa-è-cambiato per versione non vive qui — per quello, vedi i tag Git e i changelog linkati in `changelog/`.

---

## Versione corrente

**0.5.0** ("Segnale Radio"), determinata dal tag Git `v0.5.0` e da `package.json`. In corso di consolidamento la **0.5.1** ("Taratura del Segnale").

> **Nota su v0.3.0**: Include consolidamento architetturale (validazione Zod, persistence boundary, WASM lockfile check, performance content-visibility), Role Maker, Tracker Blueprints, Pagina Impostazioni & Gestione Globale, Viste/Densità Stash, Supporto Tablet e la pipeline MetaForge con Studio Overrides.

---

## Tema dei nickname e Architettura delle Milestone verso la 1.0.0

I nickname seguono l'evoluzione narrativa del rifugio dei Raiders in Speranza, mentre la scansione da `0.5.0` a `1.0.0` separa nettamente **Dati di 1° livello (`0.5.x`)**, **Dati di 2° livello ed estesi (`0.6.x`)**, **Preparazione UI/Base UI e Pagine (`0.7.0`)**, **Passaggio a Next.js & Supabase (`0.8.0`)**, **Rifinitura Performance sul nuovo stack (`0.9.0`)** e **Lancio Pubblico (`1.0.0`)**:

- **0.1.0**: *Primo Rifugio* (Foundation tracker locale)
- **0.2.0**: *Sacca dei Materiali* (Gestione multi-profilo e liste custom)
- **0.3.0**: *Banco da Lavoro* (Rafforzamento architetturale & identity/roleplay)
- **0.4.0**: *Mappa di Spedizione* (Spedizioni, progetti, router centralizzato & legal)
- **0.5.0**: *Segnale Radio* (Gestione dei **Dati di 1° livello**: oggetti in-game non cosmetici, banchi, progetti, spedizioni base, pass, `ItemPicker`, craftabilità banchi, moduli attivabili e backup profilo)
- **0.5.1**: *Taratura del Segnale* (**Consolidamento della 0.5.0**: standardizzazione `PageLayout`, verifica `type` e touch-first, HTML/tema del browser, ordinamento Stash multi-criterio e passaggio a `@tailwindcss/vite`)
- **0.6.0**: *Archivio del Rifugio* (**Dati di 2° livello e avanzati — Blocco Principale**: pagina unificata *Collezioni* per Blueprint/Outfit/Stencil/Design/Arredi/Guardaroba, Armi amplificate e Ricerche Research Bench, dettagli costruzione/miglioramento/riparazione, elenco unico liste e Skill Tree)
- **0.6.x**: *Consolidamento & Dati Estesi* (**Consolidamento della 0.6.0 ed estensioni dati pre-1.0.0**: revisione Spedizioni, Quest Tracker utente + redesign mobile-first Dev Quest, limiti giornalieri Commercianti, viste/filtri avanzati Stash e Raid per zona di loot, Bacheca Trofei, valutazione Dashboard e revisione dati Role Maker)
- **0.7.0**: *Guida di Speranza* (**Preparazione UI/UX, Base UI & Struttura Pagine pre-migrazione**: Dev Studio UI Kit Playground, migrazione Drawer/Dialog e componenti a Base UI, redesign visivo e riorganizzazione pagine con dettaglio lista/Outpost in vista dell'App Router Next.js)
- **0.8.0**: *Ponte Next & Supabase* (**Passaggio alla Nuova Architettura**: migrazione a Next.js App Router, Database e Auth Supabase con sync offline-first, redesign completo Impostazioni sulla nuova persistenza e Backoffice `/admin` con fallback fonti)
- **0.9.0**: *Rifinitura Tattica* (**Performance, Ottimizzazione & Telemetria sul Nuovo Stack**: code-splitting e caricamento dinamico payload/Leaflet sul build finale, pre-calcolo indice di ricerca, virtualizzazione liste lunghe, `View Transitions` e telemetria first-party cookieless e anonima)
- **1.0.0**: *Rete Speranza* (**Lancio Pubblico Ufficiale**: offerte settimanali Cassio/Ermal via backend, Eventi Live, Mappe Interattive, Codex + sezione ARCs/Sonde/Corrieri, Condivisione Link Liste e Skill Tree e Tour Onboarding interattivo)
- **1.x**: *Orizzonte Tattico* (**Moduli Estesi Post-Lancio**: Supporto PWA, Checklist pre-raid, Modulo Pianificazione Raid, Percorsi Waypoint su mappa, Role Maker UI e micro-app)
- **2.x**: *Controllo Totale* (**Evoluzioni di Lungo Periodo**: Guide e suggerimenti in-app e Wrapper Mobile Nativo)

---

## 0.1.0 "Primo Rifugio" — Tracker Base & Stash Aggregato — Raggiunta
- **Tracker Local-only (Fase 0)** (→ [1_CURRENT.md](1_CURRENT.md))
- **Livelli Obiettivo come Insieme & Azioni Checkbox** (→ [1_CURRENT.md](1_CURRENT.md))
- **Automatismo Inventario & Refiner Badge** (→ [1_CURRENT.md](1_CURRENT.md))
Changelog: [changelog/0.1.0.md](../changelog/0.1.0.md)

---

## 0.2.0 "Sacca dei Materiali" — Multi-Profilo, UX Mobile-First — Raggiunta
- **Multi-profilo Locale & Liste Custom (Fase 1)** (→ [1_CURRENT.md](1_CURRENT.md))
- **Import / Export v3 Multi-profilo** (→ [1_CURRENT.md](1_CURRENT.md))
- **UI / UX Mobile-First** (→ [1_CURRENT.md](1_CURRENT.md))
Changelog: [changelog/0.2.0.md](../changelog/0.2.0.md)

---

## 0.3.0 "Banco da Lavoro" — Identity, UX & Solidità Architetturale — Raggiunta
- [x] #1 [Accessibilità Overlay Legacy & Controlli](https://github.com/ieeah/arc-benches/issues/1)
- [x] #23 [Role Maker — Randomizer di Personalità (Fase 3)](https://github.com/ieeah/arc-benches/issues/23)
- [x] #19 [Selettore Vista Stash (Fase 3)](https://github.com/ieeah/arc-benches/issues/19)
- [x] #2 [Persistence Boundary Unico](https://github.com/ieeah/arc-benches/issues/2)
- [x] #6 [Lockfile NPM WASM Check](https://github.com/ieeah/arc-benches/issues/6)
- [x] #3 [Validazione Runtime Schemi (Zod)](https://github.com/ieeah/arc-benches/issues/3)
- [x] #8 [UX Input Numerici (Stash & Liste Custom)](https://github.com/ieeah/arc-benches/issues/8)
- [x] #10 [Logica Icona Refiner in Stash](https://github.com/ieeah/arc-benches/issues/10)
- [x] #7 [Overflow Componenti Floating](https://github.com/ieeah/arc-benches/issues/7)
- [x] #12 [UX Catalogo e ItemPicker: Filtri, ordinamento e raggruppamento per "tipo oggetto"](https://github.com/ieeah/arc-benches/issues/12)
- [x] #13 [UX Catalogo e ItemPicker: Toggle per nascondere skin/elementi non droppabili](https://github.com/ieeah/arc-benches/issues/13)
- [x] #5 [Revisione Ordine Menu FloatingNav](https://github.com/ieeah/arc-benches/issues/5)
- [x] #31 [Predisposizione sistema di prefiltraggio per le barre di ricerca degli elementi](https://github.com/ieeah/arc-benches/issues/31)
- [x] #35 [Tracker Blueprints (Pagina Progetti)](https://github.com/ieeah/arc-benches/issues/35)
- [x] #39 [Ottimizzazione rendering liste con CSS content-visibility e accorgimenti a zero-dipendenze](https://github.com/ieeah/arc-benches/issues/39)
- [x] #41 [Pagina Impostazioni & Gestione Globale (Tema, Profili, Backup, Ergonomia)](https://github.com/ieeah/arc-benches/issues/41)
- [x] #43 [Impostazione densità griglia Stash: selettore 2 vs 3 colonne (Card Grandi / Piccole)](https://github.com/ieeah/arc-benches/issues/43)
- [x] #44 [Refactor visivo e proporzioni delle card e icone degli oggetti di gioco](https://github.com/ieeah/arc-benches/issues/44)
- [x] #45 [Pipeline MetaForge: normalizzazione icone e sistema di override dati con rilevamento modifiche upstream](https://github.com/ieeah/arc-benches/issues/45)
- [x] #46 [Supporto Layout Tablet: container fino a 768px, griglia a 4 colonne e UI a tutta larghezza](https://github.com/ieeah/arc-benches/issues/46)
- [x] #9 [Icone Categoria Elementi](https://github.com/ieeah/arc-benches/issues/9)
Changelog: [changelog/0.3.0.md](../changelog/0.3.0.md)

---

## 0.4.0 "Mappa di Spedizione" — Spedizioni, Progetti, Router Centralizzato & Legal — Raggiunta
- [x] #17 [Spedizioni & Progetti (Fase 3)](https://github.com/ieeah/arc-benches/issues/17)
  - [x] #42 [Visualizzazione e tracciamento delle azioni (requirementActions) nello Stash](https://github.com/ieeah/arc-benches/issues/42)
  - [x] #53 [Pagina Dev: gestione liste sviluppatore (Workbench/Project/Expedition/Quest)](https://github.com/ieeah/arc-benches/issues/53)
- [x] #47 [UX CustomListEditor: flusso selezione quantità con modale dedicata e azioni rapide riga](https://github.com/ieeah/arc-benches/issues/47)
- [x] #18 [Date di Scadenza per Liste e Progetti (Fase 3)](https://github.com/ieeah/arc-benches/issues/18)
- [x] #21 [Internazionalizzazione i18n (Fase 3)](https://github.com/ieeah/arc-benches/issues/21)
- [x] #48 [Scroll non bloccato quando gli overlay sono aperti](https://github.com/ieeah/arc-benches/issues/48)
- [x] #49 [i18n: Estensione del multilingua a tutti i componenti dell'UI](https://github.com/ieeah/arc-benches/issues/49)
- [x] #50 [UI/UX: Refactor Pills di Ordinamento con label fissa e slot toggle](https://github.com/ieeah/arc-benches/issues/50)
- [x] #68 [Navigazione Morphing a Molla con Navigation Stack e Gestione Animazioni Ridotte](https://github.com/ieeah/arc-benches/issues/68)
- [x] #51 [Navigazione: Store centralizzato, memorizzazione ultima pagina e predisposizione App Router](https://github.com/ieeah/arc-benches/issues/51)
- [x] #54 [Layout & Legal: Disclaimer non-affiliazione Embark Studios e attribuzioni dati MetaForge/ARDB](https://github.com/ieeah/arc-benches/issues/54)
- [x] #71 [Refactor & Clean-up: Decomposizione pagine Dev e UI in componenti modulari e custom hook](https://github.com/ieeah/arc-benches/issues/71)
Changelog: [changelog/0.4.0.md](../changelog/0.4.0.md)

---

## 0.5.0 "Segnale Radio" — Gestione dei Dati di 1° Livello — Raggiunta
Obiettivo: definire tutti i dati di 1° livello (oggetti in-game non puramente cosmetici, banchi, progetti, spedizioni base, pass), gli strumenti Dev di catalogo/liste e i flussi core di selezione e craftabilità.
Changelog: [changelog/0.5.0.md](../changelog/0.5.0.md)
- [x] #63 [Feature Flags Utente: Attivazione e disattivazione modulare delle sezioni dell'app](https://github.com/ieeah/arc-benches/issues/63)
- [x] #72 [Tipi liste: `listType` required e type guard](https://github.com/ieeah/arc-benches/issues/72)
- [x] #73 [Tipi liste: discriminated union completa (Opzione A)](https://github.com/ieeah/arc-benches/issues/73) — dopo #72
- [x] #77 [Config nav a fonte singola + dev editor visuale drag&drop](https://github.com/ieeah/arc-benches/issues/77)
- [x] #78 [Supporto ricompense granulari per item, azioni e step nei progetti](https://github.com/ieeah/arc-benches/issues/78)
- [x] #79 [Opzione "extractionWiped" per progetti e liste (azzeramento da estrazione/wipe)](https://github.com/ieeah/arc-benches/issues/79)
- [x] #80 [Fix Stash: il contatore quantità torna a zero dopo il tocco](https://github.com/ieeah/arc-benches/issues/80)
- [x] #82 [Azioni vincolate a mappe e oggetti da portare (definisce il catalogo globale delle mappe)](https://github.com/ieeah/arc-benches/issues/82)
- [x] #83 [Ricompense di livello da catalogo completo](https://github.com/ieeah/arc-benches/issues/83) — dopo #84
- [x] #84 [Custom Items Studio](https://github.com/ieeah/arc-benches/issues/84)
- [x] #85 [Modello Reward Pass come tipo di lista + editor Dev dei pass](https://github.com/ieeah/arc-benches/issues/85) — dopo #73, #83
- [x] #86 [Dati banchi al Lvl 3 (Frozen Trail)](https://github.com/ieeah/arc-benches/issues/86)
- [x] #87 [Progetto Outpost completo (moduli, Research Bench, arredi)](https://github.com/ieeah/arc-benches/issues/87) — dopo #82, #83
- [x] #90 [Reward Pass Tracker](https://github.com/ieeah/arc-benches/issues/90) — dopo #85, #83, #84
- [x] #103 [Script dati: modulo condiviso per ARC Tracker con cache locale](https://github.com/ieeah/arc-benches/issues/103)
- [x] #104 [Script dati: traduzioni italiane con ARC Tracker di ripiego (RaidTheory vince)](https://github.com/ieeah/arc-benches/issues/104) — dopo #103
- [x] #105 [Script dati: rapporto completo degli oggetti di ARC Tracker assenti dal catalogo](https://github.com/ieeah/arc-benches/issues/105) — dopo #103
- [x] #106 [Generatore delle quest da ARC Tracker con ripiego MetaForge](https://github.com/ieeah/arc-benches/issues/106)
- [x] #108 [Cestino Dev per liste e tracce eliminate, con pagina di gestione](https://github.com/ieeah/arc-benches/issues/108)
- [x] #110 [Popolamento del Frozen Trail con import una tantum e correzioni a mano](https://github.com/ieeah/arc-benches/issues/110)
- [x] #111 [Le azioni di un livello contano solo dal livello precedente](https://github.com/ieeah/arc-benches/issues/111)
- [x] #112 [Reward Pass: pass attivo cambiabile in qualsiasi momento, livello di ogni pass conservato](https://github.com/ieeah/arc-benches/issues/112)
- [x] #117 [Obiettivi spot pre-raid (azioni custom e oggetti da trovare nel raid)](https://github.com/ieeah/arc-benches/issues/117)
- [x] #129 [Badge per gli oggetti acquistabili dai commercianti (simile al Refiner)](https://github.com/ieeah/arc-benches/issues/129)
- [x] #130 [Barra di progresso dell'avanzamento sulle card delle liste](https://github.com/ieeah/arc-benches/issues/130)
- [x] #134 [Componente unificato `PageLayout` (header sticky, action bar e footer copyright)](https://github.com/ieeah/arc-benches/issues/134)
- [x] #137 [Fix mobile: scroll verticale bloccato se il tocco iniziale avviene sulla card centrale di ItemCard](https://github.com/ieeah/arc-benches/issues/137)
- [x] #138 [Fix liste: computo materiali a scalare per livello nelle barre di progresso (#130)](https://github.com/ieeah/arc-benches/issues/138)
- [x] #139 [Fix Stash: la pill del filtro "Completati" include le azioni permettendone l'annullamento](https://github.com/ieeah/arc-benches/issues/139)
- [x] #140 [Refactor i18n: internazionalizzazione testi residui hardcoded e attributi a11y nel JSX](https://github.com/ieeah/arc-benches/issues/140)
- [x] #143 [Catalogo: gestione e raggruppamento estetico/algoritmico di varianti d'arma, livelli (I-IV) e schemi omonimi](https://github.com/ieeah/arc-benches/issues/143) — bloccante per #88
- [x] #88 [UX `ItemPicker`: pool di oggetti contestuali, relevance ranking e cap risultati](https://github.com/ieeah/arc-benches/issues/88) — dopo #143
- [x] #75 [Badge di craftabilità sulle card degli oggetti (estensione a tutti i banchi)](https://github.com/ieeah/arc-benches/issues/75)
- [x] #102 [Moduli attivabili per profilo (`isSectionActive`)](https://github.com/ieeah/arc-benches/issues/102)
- [x] #74 [Export/import completo del profilo](https://github.com/ieeah/arc-benches/issues/74) — dopo #102
- [x] #157 [Aggiunta rapida materiali mancanti alla pianificazione raid (da dettaglio o card)](https://github.com/ieeah/arc-benches/issues/157)
- [x] #160 [Rendere riconoscibili le liste disattivate in Banchi e Liste anche a card chiusa](https://github.com/ieeah/arc-benches/issues/160)
- [x] #144 [Consolidamento, bugfix e rifiniture pre-rilascio 0.5.0](https://github.com/ieeah/arc-benches/issues/144)

---

## 0.5.1 "Taratura del Segnale" — Consolidamento della 0.5.0 & Tooling Vite — Non ancora raggiunta
Obiettivo: consolidare la `0.5.0` standardizzando il layout su tutte le pagine, rifinendo l'ordinamento Stash, applicando i fix rapidi HTML/CSS/a11y e velocizzando il build Vite con `@tailwindcss/vite` prima di aprire il cantiere della `0.6.0`.
- [x] #123 [`dvh`/`svh` al posto di `vh`/`h-screen`](https://github.com/ieeah/arc-benches/issues/123)
- [x] #128 [Adottare `modern-web-guidance` nel flusso di lavoro](https://github.com/ieeah/arc-benches/issues/128)
- [ ] #135 [Migrazione pagine esistenti a `PageLayout` e testing layout/scroll](https://github.com/ieeah/arc-benches/issues/135) — dopo #134
- [ ] #136 [Standardizzazione layout unificato `PageLayout` e fix retroattivo](https://github.com/ieeah/arc-benches/issues/136) — insieme a #135
- [x] #133 [Verifica retroattiva adozione `type` e standard mobile/touch-first](https://github.com/ieeah/arc-benches/issues/133)
- [x] #69 [Ordinamento Stash per priorità multi-criterio (Banco + Livello)](https://github.com/ieeah/arc-benches/issues/69)
- [x] #124 [`color-scheme`, `theme-color` e `accent-color` per la UI nativa del browser](https://github.com/ieeah/arc-benches/issues/124)
- [x] #125 [Scrollbar nascosta nelle liste di pill orizzontali: affordance di scorrimento](https://github.com/ieeah/arc-benches/issues/125)
- [x] #126 [`lang` dinamico, titolo e meta description in `index.html`](https://github.com/ieeah/arc-benches/issues/126)
- [ ] #149 [Rimozione assunzioni binarie ('it' vs 'en') ed estensione traduzioni in Dev Studio](https://github.com/ieeah/arc-benches/issues/149)
- [x] #150 [Background grafici dedicati per Armi amplificate, Stencil e Design](https://github.com/ieeah/arc-benches/issues/150)
- [x] #151 [Decomposizione modulare di `src/types.ts` in `src/types/` con barrel export](https://github.com/ieeah/arc-benches/issues/151)
- [ ] #152 [Estrazione logica condivisa tra `FloatingNav` e `MorphingFloatingNav` (hook e componenti atomici)](https://github.com/ieeah/arc-benches/issues/152)
- [x] #153 [Pulizia configurazione Vite, rimozione avvisi native config e conformità ESM](https://github.com/ieeah/arc-benches/issues/153)
- [ ] #154 [Decomposizione modulare di `SettingsPage.tsx` in sezioni atomiche](https://github.com/ieeah/arc-benches/issues/154)
- [x] #155 [Estrazione di componenti riutilizzabili per le pagine Dev Studio (de-inlineing JSX)](https://github.com/ieeah/arc-benches/issues/155)
- [x] #158 [Parità tra azioni e oggetti in tutti i calcoli di progresso e fix `getBaseLevel`](https://github.com/ieeah/arc-benches/issues/158)
- [x] #119 [Code-splitting delle pagine con `React.lazy` e rimozione pagine Dev dalla build di produzione](https://github.com/ieeah/arc-benches/issues/119) — anticipato da 0.9.0
- [x] Refactor & Follow-up: Base Items Studio, Dettaglio Oggetto e Ricerche Armi Amplificate ([base-items-e-varianti-followup.md](specs/base-items-e-varianti-followup.md))
- [x] #127 [Passare a `@tailwindcss/vite` e rimuovere PostCSS/autoprefixer e config Tailwind legacy](https://github.com/ieeah/arc-benches/issues/127)
- [x] #114 [Elenco unico delle liste senza raggruppamento per tipo e card differenziate](https://github.com/ieeah/arc-benches/issues/114) — anticipato da 0.6.0

---

## 0.6.0 "Archivio del Rifugio" — Gestione dei Dati di 2° Livello e Avanzati (Blocco Principale) — Non ancora raggiunta
Obiettivo: riunire in una pagina **Collezioni** tutti i tracker di sblocco (Blueprint e cosmetici), introdurre le meccaniche avanzate degli oggetti (Armi amplificate, Ricerche del Research Bench, ricette di costruzione/upgrade/riparazione), l'elenco unico delle liste e lo Skill Tree.
- [ ] #145 [Pagina unificata «Collezioni» (Blueprint, Cosmetici, Outfit, Stencil, Design, Arredi)](https://github.com/ieeah/arc-benches/issues/145) — issue wrapper di #91, #131, #109
  - [ ] #91 [Tracker collezioni cosmetiche (stencil, outfit, design, arredi)](https://github.com/ieeah/arc-benches/issues/91)
  - [ ] #131 [Sezione Guardaroba e catalogo personalizzazioni (skin, zaini, cosmetici e Scrappy)](https://github.com/ieeah/arc-benches/issues/131)
  - [ ] #109 [Outfit sbloccati a pezzi: distinguere completo, toggle e colori](https://github.com/ieeah/arc-benches/issues/109)
- [ ] #92 [Armi amplificate (Weapon Amplification) e gestione ricerche Research Bench](https://github.com/ieeah/arc-benches/issues/92)
- [ ] #113 [Costruzione, miglioramento di livello (`I→IV`) e riparazione nel dettaglio degli oggetti](https://github.com/ieeah/arc-benches/issues/113)
- [ ] #156 [Gestione azioni liste: riordinamento e azioni composte (sotto-azioni lineari o libere)](https://github.com/ieeah/arc-benches/issues/156)
- [ ] #159 [Pianificazione massiva da banchi/progetti e salvataggio slice come lista custom](https://github.com/ieeah/arc-benches/issues/159) — follow-up di #157
- [ ] #89 [Estrazione dati Skill Tree da MetaForge (`svelte-flow`)](https://github.com/ieeah/arc-benches/issues/89)
- [ ] #62 [Skill Tree dei Raiders: albero delle abilità, sinergie e contatore punti abilità](https://github.com/ieeah/arc-benches/issues/62) — dopo #89

---

## 0.6.x "Consolidamento & Dati Estesi" — Consolidamento 0.6.0 & Dati Pre-1.0.0 — Non ancora raggiunta
Obiettivo: consolidare la `0.6.0` e completare gli ultimi domini dati pre-`1.0.0` (revisione Spedizioni, redesign mobile-first delle Quest Dev + Quest Tracker utente, limiti giornalieri statici dei Commercianti, viste/filtri avanzati Stash e Raid per zona di loot, Bacheca Trofei).
- [ ] #146 [Revisione UX/UI e correzione logica pregresso, vincoli, requisiti e progressione delle spedizioni](https://github.com/ieeah/arc-benches/issues/146)
- [ ] #76 [Redesign da zero pagina Dev gestione quest e visualizzazione dipendenze (mobile-first)](https://github.com/ieeah/arc-benches/issues/76)
- [ ] #58 [Quest Tracker utente (condivide l'architettura mobile-first di #76)](https://github.com/ieeah/arc-benches/issues/58) — insieme a #76
- [ ] #94 [Commercianti: limiti giornalieri statici, countdown reset e scheda informativa Cassio/Ermal](https://github.com/ieeah/arc-benches/issues/94)
- [ ] #93 [Filtri per fonte lista nello Stash (configurati nelle Impostazioni)](https://github.com/ieeah/arc-benches/issues/93)
- [ ] #26 [Vista Aggregata per Banco/Lista nello Stash con accesso rapido al dettaglio lista per livelli](https://github.com/ieeah/arc-benches/issues/26)
- [ ] #59 [Spawn Tips "Dove trovo questo oggetto" basati sulle Zone di Loot (`loot_area`)](https://github.com/ieeah/arc-benches/issues/59)
- [ ] #81 [Raggruppamento per Mappa / Zona di Loot (prioritariamente in `RaidPlanPage`)](https://github.com/ieeah/arc-benches/issues/81) — collegata a #59
- [ ] #70 [Bacheca dei Trofei: archivio per progetti, spedizioni, pass e banchi completati](https://github.com/ieeah/arc-benches/issues/70)
- [ ] #56 [Dashboard Minimale: pagina di riepilogo non predefinita all'avvio (da analizzare; possibile rinvio/rimozione)](https://github.com/ieeah/arc-benches/issues/56)
- [ ] #101 [Role Maker: pagina Dev per la revisione manuale di ruoli e lore](https://github.com/ieeah/arc-benches/issues/101) — da rivalutare in ottica UGC/storico
- [ ] #37 [Role Maker: arricchimento, coerenza gameplay e correzione meccaniche](https://github.com/ieeah/arc-benches/issues/37) — insieme a #101

---

## 0.7.0 "Guida di Speranza" — Preparazione UI/UX, Base UI & Struttura Pagine (Pre-Migrazione) — Non ancora raggiunta
Obiettivo: creare il laboratorio UI Kit Dev, migrare i componenti e i dialog a **Base UI**, definire il nuovo design visivo e riorganizzare le pagine (dettaglio lista e Outpost) così da avere componenti e gerarchia delle viste pronti per diventare rotte dell'App Router di Next.js nella `0.8.0`.
Ordine di lavoro vincolato:
1. [ ] #141 [Dev Studio: UI Kit & Component Playground con vista comparativa e adozione incrementale Base UI](https://github.com/ieeah/arc-benches/issues/141) — **1° step obbligatorio prima di toccare Base UI**
2. [ ] #121 [Migrare Drawer, BottomSheet e modali a `<dialog>` nativo / Base UI Dialog](https://github.com/ieeah/arc-benches/issues/121) — dopo #141
3. [ ] #122 [Rimuovere lo scroll lock su html/body e usare `overscroll-behavior` sul dialog](https://github.com/ieeah/arc-benches/issues/122) — dopo #121
4. [ ] #60 [Refactor UI/UX Globale: consolidamento componenti, modali, drawer e densità visiva con Base UI](https://github.com/ieeah/arc-benches/issues/60) — dopo #141, #121
5. [ ] #115 [Valutare e applicare un redesign dell'app (meno «Tailwind generico»)](https://github.com/ieeah/arc-benches/issues/115) — insieme a #60
6. [ ] #4 [Supporto Tastiera per Drag & Drop](https://github.com/ieeah/arc-benches/issues/4)
7. [ ] #116 [Pagina di dettaglio per ogni lista, pagina dell'Outpost e riorganizzazione delle pagine](https://github.com/ieeah/arc-benches/issues/116) — chiude la preparazione strutturale pre-Next.js

---

## 0.8.0 "Ponte Next & Supabase" — Passaggio alla Nuova Architettura (Next.js, Supabase & Auth) — Non ancora raggiunta
Obiettivo: completare la migrazione tecnologica al nuovo stack (Next.js App Router, Database e Auth Supabase con sincronizzazione background offline-first, redesign completo delle Impostazioni sulla nuova persistenza e Backoffice `/admin`).
- [ ] #28 [Next.js & Vercel: migrazione ad App Router, SSR e Route Handlers](https://github.com/ieeah/arc-benches/issues/28)
- [ ] #14 [Supabase — Schema Dati di Gioco & RLS](https://github.com/ieeah/arc-benches/issues/14)
- [ ] #15 [Supabase — Account & Auth](https://github.com/ieeah/arc-benches/issues/15) — dopo #14
- [ ] #16 [Supabase — Sync Background offline-first](https://github.com/ieeah/arc-benches/issues/16) — dopo #14, #15
- [ ] #148 [Redesign completo pagina Impostazioni, audit globale preferenze e integrazione nuova persistenza](https://github.com/ieeah/arc-benches/issues/148) — dopo #28, #16
- [ ] #65 [Backoffice & Pipeline: area riservata Next.js (`/admin`) per sync dati, storage asset e studio overrides](https://github.com/ieeah/arc-benches/issues/65) — dopo #28, #14
- [ ] #97 [Fallback automatico della pipeline su fonte dati di backup](https://github.com/ieeah/arc-benches/issues/97) — parte di #65

---

## 0.9.0 "Rifinitura Tattica" — Performance, Ottimizzazione & Telemetria sul Nuovo Stack — Non ancora raggiunta
Obiettivo: con il nuovo stack (`0.8.0`) e la nuova UI (`0.7.0`) al loro posto, eseguire il tuning definitivo delle performance, del bundle, delle transizioni e della telemetria anonima cookieless in vista del lancio pubblico `1.0.0`.
- [ ] #119 [Ottimizzazione code-splitting delle rotte ed esclusione pagine Dev/Admin dal bundle client pubblico](https://github.com/ieeah/arc-benches/issues/119)
- [ ] #120 [Caricamento dinamico dei payload pesanti e di Leaflet](https://github.com/ieeah/arc-benches/issues/120) — insieme a #119
- [ ] #142 [Analisi pre-calcolo token normalizzati e indice di ricerca per il catalogo](https://github.com/ieeah/arc-benches/issues/142)
- [ ] #11 [Performance: virtualizzazione e ottimizzazione rendering per liste lunghe (Catalogo e Stash)](https://github.com/ieeah/arc-benches/issues/11)
- [ ] #27 [`View Transitions` fluide tra le rotte del router Next.js](https://github.com/ieeah/arc-benches/issues/27) — dopo #28
- [ ] #66 [Telemetria & Metriche: tassonomia eventi, KPI e specifiche privacy (rigorosamente cookieless e anonima)](https://github.com/ieeah/arc-benches/issues/66)
- [ ] #67 [Telemetria & Metriche: implementazione first-party su Route Handlers Next.js e Supabase](https://github.com/ieeah/arc-benches/issues/67) — dopo #66

---

## 1.0.0 "Rete Speranza" — Lancio Pubblico Ufficiale — Non ancora raggiunta
Obiettivo: completare le funzionalità cloud/live e social abilitate dal backend Next.js/Supabase, l'enciclopedia Codex, l'onboarding per i nuovi utenti e il rilascio pubblico ufficiale.
- [ ] #147 [Commercianti: integrazione offerte a rotazione settimanale di Cassio/Ermal via backend](https://github.com/ieeah/arc-benches/issues/147) — dopo #65
- [ ] #55 [Condizioni Mappe & Eventi Live: service multi-regione, caching backend e preferenze](https://github.com/ieeah/arc-benches/issues/55)
- [ ] #61 [Mappe Interattive: Pan/Zoom Leaflet, POI, estrattori, selettore multipiano e loot nodes su database](https://github.com/ieeah/arc-benches/issues/61)
- [ ] #64 [Codex di Speranza: enciclopedia lore, trascrizioni radio, guide e archivio di mondo](https://github.com/ieeah/arc-benches/issues/64)
- [ ] #57 [Sezione «ARCs» nel Codex (nemici, Sonde e Corrieri ARC)](https://github.com/ieeah/arc-benches/issues/57) — parte di #64
- [ ] #25 [Condivisione Liste tramite Link con Open-Graph preview (`/share/<token>`)](https://github.com/ieeah/arc-benches/issues/25)
- [ ] #98 [Condivisione build Skill Tree via link](https://github.com/ieeah/arc-benches/issues/98) — dopo #62, #25
- [ ] #20 [Tour Onboarding interattivo con `driver.js`](https://github.com/ieeah/arc-benches/issues/20)

---

## 1.x "Orizzonte Tattico" — Moduli Estesi Post-Lancio — Non ancora raggiunta
- [ ] #29 [Supporto PWA (service worker e offline manifest, dopo Next.js e #16)](https://github.com/ieeah/arc-benches/issues/29)
- [ ] #99 [Checklist pre-raid degli oggetti da portare](https://github.com/ieeah/arc-benches/issues/99)
- [ ] #132 [Modulo Pianificazione Raid (Briefing, obiettivi spot, checklist e percorsi)](https://github.com/ieeah/arc-benches/issues/132)
- [ ] #118 [Mappe Interattive: pianificazione itinerari e percorsi tattici (waypoint)](https://github.com/ieeah/arc-benches/issues/118) — collegata a #61
- [ ] #33 [Role Maker — Riorganizzazione UI e miglioramenti](https://github.com/ieeah/arc-benches/issues/33)
- [ ] #38 [Role Maker — Micro-app autonoma su sottodominio dedicato](https://github.com/ieeah/arc-benches/issues/38)

---

## 2.x "Controllo Totale" — Evoluzioni di Lungo Periodo — Non ancora raggiunta
- [ ] #100 [Guide e suggerimenti in-app](https://github.com/ieeah/arc-benches/issues/100) — confluisce in #64
- [ ] #40 [Wrapper Mobile Nativo (React Native / Capacitor / Expo)](https://github.com/ieeah/arc-benches/issues/40)
