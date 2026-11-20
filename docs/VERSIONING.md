# Versioning

Piano previsionale delle versioni verso l'MVP (`1.0.0`) e oltre, basato sui task presenti in [1_CURRENT.md](1_CURRENT.md), [2_ROADMAP.md](2_ROADMAP.md) e [3_BACKLOG.md](3_BACKLOG.md) e consolidato nella revisione architetturale ([revisione-roadmap-dati-verso-1.0.0.md](revisione-roadmap-dati-verso-1.0.0.md) e [revisione-roadmap-tecnica-ui-verso-1.0.0.md](revisione-roadmap-tecnica-ui-verso-1.0.0.md)).
Il contenuto testuale del cosa-è-cambiato per versione non vive qui — per quello, vedi i tag Git e i changelog linkati in `changelog/`.

---

## Versione corrente

**0.6.9** ("Engine Freeze"), determinata da `package.json` (Feature & Data Freeze completato per Era 1).

> **Nota su v0.3.0**: Include consolidamento architetturale (validazione Zod, persistence boundary, WASM lockfile check, performance content-visibility), Role Maker, Tracker Blueprints, Pagina Impostazioni & Gestione Globale, Viste/Densità Stash, Supporto Tablet e la pipeline MetaForge con Studio Overrides.

---

## Tema dei nickname e Architettura delle Milestone verso la 1.0.0

I nickname seguono l'evoluzione narrativa del rifugio dei Raiders in Speranza. La strategia architetturale è articolata in **4 Ere** con passaggio a un **nuovo repository** per lo sviluppo manuale del portale definitivo (Next.js + Postgres serverless + Base UI):

### Era 1: Sandbox & Data Mining (Questo Repository — ~1 Mese)
- **0.1.0**: *Primo Rifugio* (Foundation tracker locale)
- **0.2.0**: *Sacca dei Materiali* (Gestione multi-profilo e liste custom)
- **0.3.0**: *Banco da Lavoro* (Rafforzamento architetturale & identity/roleplay)
- **0.4.0**: *Mappa di Spedizione* (Spedizioni, progetti, router centralizzato & legal)
- **0.5.0**: *Segnale Radio* (Dati di 1° livello: oggetti, banchi, progetti, pass base, item picker)
- **0.5.1**: *Taratura del Segnale* (Consolidamento layout `PageLayout`, ordinamento Stash multi-criterio, `@tailwindcss/vite`)
- **0.6.0**: *Archivio del Rifugio* (Formule e dati di 2° livello: Collezioni 206 oggetti, Skill Tree vettoriale, Armi amplificate, Upgrade `I→IV`, Riparazione)
- **0.6.5**: *Codex & Data Mining* (**Nuova** — Estrazione totale del dataset di gioco: Nemici ARC con loot table/debolezze, Mappe e POI, normalizzazione 123 Quest e Commercianti)
- **0.6.9**: *Engine Freeze* (**Raggiunta** — Isolamento `src/engine/` a zero dipendenze UI, 100% unit test, congelamento e preparazione alla transizione di repository)

### Era 2: Tooling & Seed (2–3 Settimane)
- Pipeline di ingestion, validatori di integrità referenziale e script di generazione seed SQL/Postgres.

### Era 3: Progettazione Architettura & Design (1 Mese)
- Schema relazionale definitivo (Drizzle/Supabase), wireframe, design tokens e setup componenti headless Base UI.

### Era 4: Nuovo Portale Next.js (Sviluppo Manuale — 3–5 Mesi a Milestone)
- **Milestone 1**: *Core Companion* (App shell, Auth, Stash aggregato e Banchi del rifugio)
- **Milestone 2**: *Progressione* (Reward Pass, Collezioni Blueprint/Design/Stencil, Quest Tracker)
- **Milestone 3**: *Codex & Mappe* (Skill Tree interattivo, Bestiario ARC, Mappe interattive e lancio 1.0.0)

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

## 0.5.1 "Taratura del Segnale" — Consolidamento della 0.5.0 & Tooling Vite — Raggiunta
Obiettivo: consolidare la `0.5.0` standardizzando il layout su tutte le pagine, rifinendo l'ordinamento Stash, applicando i fix rapidi HTML/CSS/a11y e velocizzando il build Vite con `@tailwindcss/vite` prima di aprire il cantiere della `0.6.0`.
Changelog: [changelog/0.5.1.md](../changelog/0.5.1.md)
- [x] #123 [`dvh`/`svh` al posto di `vh`/`h-screen`](https://github.com/ieeah/arc-benches/issues/123)
- [x] #128 [Adottare `modern-web-guidance` nel flusso di lavoro](https://github.com/ieeah/arc-benches/issues/128)
- [x] #135 [Migrazione pagine esistenti a `PageLayout` e testing layout/scroll](https://github.com/ieeah/arc-benches/issues/135) — dopo #134
- [x] #136 [Standardizzazione layout unificato `PageLayout` e fix retroattivo](https://github.com/ieeah/arc-benches/issues/136) — insieme a #135
- [x] #133 [Verifica retroattiva adozione `type` e standard mobile/touch-first](https://github.com/ieeah/arc-benches/issues/133)
- [x] #69 [Ordinamento Stash per priorità multi-criterio (Banco + Livello)](https://github.com/ieeah/arc-benches/issues/69)
- [x] #124 [`color-scheme`, `theme-color` e `accent-color` per la UI nativa del browser](https://github.com/ieeah/arc-benches/issues/124)
- [x] #125 [Scrollbar nascosta nelle liste di pill orizzontali: affordance di scorrimento](https://github.com/ieeah/arc-benches/issues/125)
- [x] #126 [`lang` dinamico, titolo e meta description in `index.html`](https://github.com/ieeah/arc-benches/issues/126)
- [x] #149 [Rimozione assunzioni binarie ('it' vs 'en') ed estensione traduzioni in Dev Studio](https://github.com/ieeah/arc-benches/issues/149)
- [x] #150 [Background grafici dedicati per Armi amplificate, Stencil e Design](https://github.com/ieeah/arc-benches/issues/150)
- [x] #151 [Decomposizione modulare di `src/types.ts` in `src/types/` con barrel export](https://github.com/ieeah/arc-benches/issues/151)
- [x] #152 [Estrazione logica condivisa tra `FloatingNav` e `MorphingFloatingNav` (hook e componenti atomici)](https://github.com/ieeah/arc-benches/issues/152)
- [x] #153 [Pulizia configurazione Vite, rimozione avvisi native config e conformità ESM](https://github.com/ieeah/arc-benches/issues/153)
- [x] #154 [Decomposizione modulare di `SettingsPage.tsx` in sezioni atomiche](https://github.com/ieeah/arc-benches/issues/154)
- [x] #155 [Estrazione di componenti riutilizzabili per le pagine Dev Studio (de-inlineing JSX)](https://github.com/ieeah/arc-benches/issues/155)
- [x] #158 [Parità tra azioni e oggetti in tutti i calcoli di progresso e fix `getBaseLevel`](https://github.com/ieeah/arc-benches/issues/158)
- [x] #119 [Code-splitting delle pagine con `React.lazy` e rimozione pagine Dev dalla build di produzione](https://github.com/ieeah/arc-benches/issues/119) — anticipato da 0.9.0
- [x] Refactor & Follow-up: Base Items Studio, Dettaglio Oggetto e Ricerche Armi Amplificate ([base-items-e-varianti-followup.md](specs/base-items-e-varianti-followup.md))
- [x] #127 [Passare a `@tailwindcss/vite` e rimuovere PostCSS/autoprefixer e config Tailwind legacy](https://github.com/ieeah/arc-benches/issues/127)
- [x] #114 [Elenco unico delle liste senza raggruppamento per tipo e card differenziate](https://github.com/ieeah/arc-benches/issues/114) — anticipato da 0.6.0

---

## 0.6.0 "Archivio del Rifugio" — Formule di 2° Livello e Collezioni — Raggiunta (Questo Repo)
Obiettivo: riunire nella pagina **Collezioni** tutti i tracker di sblocco in-raid (Blueprint, Design Arredi e Stencil Armi), chiudere le formule matematiche avanzate degli oggetti (Armi amplificate, Ricerche Research Bench, ricette upgrade/riparazione) e lo Skill Tree.
Changelog: [changelog/0.6.0.md](../changelog/0.6.0.md)
- [x] #164 [Campo `unlocks_item_id` per blueprint e design e integrazione nella pipeline](https://github.com/ieeah/arc-benches/issues/164)
- [x] #145 [Pagina unificata «Collezioni» in-raid (Blueprint, Design Arredi e Stencil Armi)](https://github.com/ieeah/arc-benches/issues/145)
  - [x] #91 [Tracker collezioni in-game (Design Arredi e Stencil Armi)](https://github.com/ieeah/arc-benches/issues/91)
- [x] #89 [Estrazione dati Skill Tree da MetaForge (`svelte-flow`)](https://github.com/ieeah/arc-benches/issues/89)
- [x] #62 [Skill Tree dei Raiders: albero delle abilità, sinergie e contatore punti abilità](https://github.com/ieeah/arc-benches/issues/62)
- [x] #92 [Armi amplificate (Weapon Amplification) e gestione ricerche Research Bench](https://github.com/ieeah/arc-benches/issues/92)
- [x] #113 [Costruzione, miglioramento di livello (`I→IV`) e riparazione nel dettaglio degli oggetti](https://github.com/ieeah/arc-benches/issues/113)

---

## 0.6.5 "Codex & Data Mining" — Estrazione Dataset Totale di Gioco — Raggiunta (Questo Repo)
Obiettivo: estrarre, validare e normalizzare in file JSON statici tutto il patrimonio informativo di *ARC Raiders*, così da avere la base dati pronta e congelata per il futuro database relazionale.
Changelog: [changelog/0.6.5.md](../changelog/0.6.5.md)
- [x] #57 **Dataset Codex EN/IT (88 voci)**: estratte e localizzate tutte le voci di *History*, *People*, *Toledo*, *ARC* e *Topside* in `src/data/codex.json`.
- [x] #61 **Dataset Mappe & POI**: pipeline `fetch-arc-maps.mjs`, 49.962 POI multi-livello, filtri e clustering (parte evolutiva Next.js/Supabase spostata in #170).
- [x] #94 **Commercianti & Economia**: catalogo merci con costi, limiti di acquisto giornalieri e scheda Inviato Nomade in `src/data/traders.json`.
- [x] #169 **Allineamento Stash <-> Pianificazione Raid**: pagina unificata, dock in `FloatingNav`/`MorphingFloatingNav`, Modifica Requisiti batch, sync intelligente e fix `applyRaidPlanToStash`.
- [x] #173 / #174 **Dettaglio BaseItem & Pill Overflow**: `repair`/`recycling` livello per livello su `baseItem`, indicatore bordo/glow e drag mouse sulle pill.
- *Spostate su Milestone #18 (Nuovo Progetto Next.js & Supabase):* #58 (Quest Tracker presentazione), #146 (Revisione UX/UI Spedizioni).

---

## 0.6.9 "Engine Freeze" — Isolamento Logica Pura & Conclusione Sandbox — Raggiunta (Questo Repo)
Obiettivo: estrarre tutto il "cervello" dell'applicazione in un modulo TypeScript puro (`src/engine/`) a **zero dipendenze da React o Zustand**, coperto da unit test Vitest al 100%, pronto per essere copiato 1:1 nel nuovo repository Next.js.
Changelog: [changelog/0.6.9.md](../changelog/0.6.9.md)
- [x] Estrazione e isolamento di `src/engine/` (`materials.ts`, `crafting.ts`, `expeditions.ts`, `skills.ts`, `quests.ts`).
- [x] Suite di test unitari completa per ciascun modulo dell'engine (obiettivo: 100% pass e zero accoppiamento UI).
- [x] Congelamento del codice (*Feature & Data Freeze*), dismissione strumenti Dev non necessari e preparazione alla transizione di repository.

---

## Era 2: Tooling & Seed (2–3 Settimane)
Obiettivo: preparare gli strumenti che convertiranno il dataset locale nel database del nuovo progetto.
- Pipeline di ingestion dati e script di normalizzazione.
- Generatore di Seed SQL / Postgres per Supabase / Neon con integrità referenziale.
- Script di validazione incrociata tra entità (ogni item referenziato in banchi, ricette, quest e drop deve esistere nel catalogo).

---

## Era 3: Progettazione Architettura & Design (1 Mese)
Obiettivo: pianificare con cura prima di scrivere codice nel nuovo repository.
- Schema relazionale definitivo (Drizzle ORM / Prisma).
- Wireframe e gerarchia responsive mobile-first.
- Setup del Design System con variabili semantiche e componenti unstyled `@base-ui-components/react`.
- Architettura Next.js: distinzione chiara tra Server Components (RSC) per dati/layout e Client Components per isole interattive.

---

## Era 4: Nuovo Portale Next.js (Sviluppo Manuale — 3–5 Mesi a Milestone)
Obiettivo: sviluppo manuale curato e artigianale del portale definitivo.
- **Milestone 1 — Core Companion (Settimane 1–8)**: Shell dell'applicazione, autenticazione Supabase/Better-Auth, Stash aggregato, Banchi e Liste del rifugio, sync offline-first.
- **Milestone 2 — Progressione (Settimane 9–14)**: Reward Pass, Collezioni (Blueprint, Design, Stencil), Quest Tracker e Spedizioni.
- **Milestone 3 — Codex & Mappe (Settimane 15–20)**: Skill Tree interattivo dei Raiders, Codex Nemici ARC / Bestiario, Mappe interattive e rilascio pubblico `1.0.0`.
- [ ] #159 [Pianificazione massiva da banchi/progetti e salvataggio slice come lista custom](https://github.com/ieeah/arc-benches/issues/159) — possibile implementazione futura / estensione raid nel nuovo portale
- [ ] #38 [Role Maker — Micro-app autonoma su sottodominio dedicato](https://github.com/ieeah/arc-benches/issues/38)

---

## 2.x "Controllo Totale" — Evoluzioni di Lungo Periodo — Non ancora raggiunta
- [ ] #100 [Guide e suggerimenti in-app](https://github.com/ieeah/arc-benches/issues/100) — confluisce in #64
- [ ] #40 [Wrapper Mobile Nativo (React Native / Capacitor / Expo)](https://github.com/ieeah/arc-benches/issues/40)
