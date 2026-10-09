# Versioning

Piano previsionale delle versioni verso l'MVP (1.0.0) e oltre, basato sui task presenti in [1_CURRENT.md](1_CURRENT.md), [2_ROADMAP.md](2_ROADMAP.md) e [3_BACKLOG.md](3_BACKLOG.md) al momento della stesura.
Il contenuto testuale del cosa-è-cambiato per versione non vive qui — per quello, vedi i tag Git e i changelog linkati in `changelog/`.

---

## Versione corrente

**0.4.0** ("Mappa di Spedizione"), determinata dal tag Git `v0.4.0` e da `package.json`.

> **Nota su v0.3.0**: Include consolidamento architetturale (validazione Zod, persistence boundary, WASM lockfile check, performance content-visibility), Role Maker, Tracker Blueprints, Pagina Impostazioni & Gestione Globale, Viste/Densità Stash, Supporto Tablet e la pipeline MetaForge con Studio Overrides.

---

## Tema dei nickname: *Fasi di Sopravvivenza & Ricostruzione del Rifugio (ARC Raiders)*

I nickname seguono l'evoluzione narrativa del rifugio dei Raiders in Speranza:
- **0.1.0**: *Primo Rifugio* (Foundation tracker locale)
- **0.2.0**: *Sacca dei Materiali* (Gestione multi-profilo e liste custom)
- **0.3.0**: *Banco da Lavoro* (Rafforzamento architetturale & identity/roleplay)
- **0.4.0**: *Mappa di Spedizione* (Spedizioni, progetti, router centralizzato & legal)
- **0.5.0**: *Segnale Radio* (Fondamenta Dev e dati: liste, pass, progetti, database)
- **0.6.0**: *Archivio del Rifugio* (Tracker e collezioni: Reward Pass, collezioni cosmetiche, armi amplificate)
- **0.7.0**: *Guida di Speranza* (Quest, bestiario, spawn tips, Skill Tree)
- **0.8.0**: *Centro Operativo* (Dashboard, eventi live, trofei, telemetria)
- **0.9.0**: *Rifinitura Tattica* (Consolidamento UI/UX e performance prima della migrazione)
- **0.10.0**: *Ponte Next & Supabase* (Migrazione Next.js App Router, Auth e Database Cloud)
- **1.0.0**: *Rete Speranza* (Lancio Pubblico Ufficiale con Onboarding e Condivisione)
- **1.x**: *Orizzonte Tattico* (Mappe interattive con POI e Role Maker esteso)
- **2.x**: *Controllo Totale* (Codex, guide in-app e Mobile Wrapper)

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

## 0.5.0 "Segnale Radio" — Fondamenta Dev e Dati: liste, pass, progetti, database — Parziale
Obiettivo: mettere le basi perché lo sviluppatore possa gestire liste, pass, progetti e dati senza toccare il codice.
Già fatte: #63, #72, #73, #77, #78, #80, #82, #83, #84, #85. Ordine di lavoro (le dipendenze sono a destra di ogni voce):
- [x] #72 [Tipi liste: `listType` required e type guard](https://github.com/ieeah/arc-benches/issues/72)
- [x] #73 [Tipi liste: discriminated union (Opzione A)](https://github.com/ieeah/arc-benches/issues/73) — dopo #72
- [x] #84 [Custom Items Studio (alta priorità)](https://github.com/ieeah/arc-benches/issues/84)
- [x] #83 [Ricompense di livello da catalogo completo](https://github.com/ieeah/arc-benches/issues/83) — dopo #84
- [x] #82 [Azioni vincolate a mappe e oggetti da portare (definisce il catalogo globale delle mappe)](https://github.com/ieeah/arc-benches/issues/82)
- [x] #85 [Modello Reward Pass come tipo di lista + editor Dev dei pass](https://github.com/ieeah/arc-benches/issues/85) — dopo #73, #83
- [ ] #76 [Pagina Dev per la gestione delle quest](https://github.com/ieeah/arc-benches/issues/76) — dopo #72
- [ ] #87 [Progetto Outpost completo (moduli, Research Bench, arredi)](https://github.com/ieeah/arc-benches/issues/87) — dopo #82, #83
- [ ] #86 [Dati banchi al Lvl 3 (Frozen Trail)](https://github.com/ieeah/arc-benches/issues/86)
- [ ] #79 [Opzione "ripristinabile" per progetti e liste](https://github.com/ieeah/arc-benches/issues/79)
- [ ] #74 [Export/import completo del profilo](https://github.com/ieeah/arc-benches/issues/74)
- [ ] #102 [Moduli attivabili per profilo (`isSectionActive`)](https://github.com/ieeah/arc-benches/issues/102) — dopo #74
- [ ] #88 [Filtri per tipo selezionabili nell'ItemPicker](https://github.com/ieeah/arc-benches/issues/88)

---

## 0.6.0 "Archivio del Rifugio" — Tracker e Collezioni — Non ancora raggiunta
Obiettivo: tracciare la progressione di gioco (pass, collezioni, armi) sulle basi della 0.5.0.
- [ ] #90 [Reward Pass Tracker (solo livelli e ricompense, dati inseriti a mano; niente Feats)](https://github.com/ieeah/arc-benches/issues/90) — dopo #85, #83, #84
- [ ] #91 [Tracker collezioni cosmetiche (stencil, outfit, design, arredi)](https://github.com/ieeah/arc-benches/issues/91)
- [ ] #92 [Armi amplificate (Weapon Amplification)](https://github.com/ieeah/arc-benches/issues/92) — dopo #73, #83
- [ ] #26 [Vista Aggregata per Banco](https://github.com/ieeah/arc-benches/issues/26)
- [ ] #69 [Ordinamento Stash per priorità multi-criterio](https://github.com/ieeah/arc-benches/issues/69)
- [ ] #93 [Filtri per fonte lista nel menu dello Stash](https://github.com/ieeah/arc-benches/issues/93)
- [ ] #11 [Performance: virtualizzazione delle liste lunghe (Catalogo e Stash)](https://github.com/ieeah/arc-benches/issues/11) — anticipata da 0.9.0 per il lag di scroll su dispositivi di fascia media; si verifica prima l'effetto delle ottimizzazioni CSS e delle miniature

---

## 0.7.0 "Guida di Speranza" — Quest, Bestiario, Spawn Tips & Skill Tree — Non ancora raggiunta
Obiettivo: conoscenza del gioco e pianificazione della progressione. Lo Skill Tree è necessario per l'1.0.0.
- [ ] #89 [Estrazione dati Skill Tree da MetaForge (svelte-flow)](https://github.com/ieeah/arc-benches/issues/89)
- [ ] #62 [Skill Tree dei Raiders](https://github.com/ieeah/arc-benches/issues/62) — dopo #89
- [ ] #58 [Quest Tracker Informativo](https://github.com/ieeah/arc-benches/issues/58) — dopo #72, #76
- [ ] #94 [Commercianti: limiti giornalieri e Nomadic Envoy](https://github.com/ieeah/arc-benches/issues/94) — dopo #58
- [ ] #95 [Planner progressione XP → Skill Points](https://github.com/ieeah/arc-benches/issues/95) — dopo #58, #62
- [ ] #57 [Bestiario ARC & Drop Tables](https://github.com/ieeah/arc-benches/issues/57)
- [ ] #59 [Spawn Tips "Dove trovo questo oggetto"](https://github.com/ieeah/arc-benches/issues/59) — dopo #82
- [ ] #81 [Raggruppamento Stash per mappa](https://github.com/ieeah/arc-benches/issues/81) — dopo #82
- [ ] #75 [Badge di craftabilità sulle card (include l'estensione a tutti i banchi)](https://github.com/ieeah/arc-benches/issues/75)

---

## 0.8.0 "Centro Operativo" — Dashboard, Eventi Live, Trofei & Telemetria — Non ancora raggiunta
Obiettivo: sintesi operativa che riassume tracker e progetti delle versioni precedenti.
- [ ] #55 [Condizioni Mappe & Eventi Live](https://github.com/ieeah/arc-benches/issues/55)
- [ ] #96 [Allerta Flash Freeze](https://github.com/ieeah/arc-benches/issues/96) — dopo #55
- [ ] #56 [Dashboard Minimale](https://github.com/ieeah/arc-benches/issues/56) — dopo 0.6.0
- [ ] #70 [Bacheca dei Trofei](https://github.com/ieeah/arc-benches/issues/70) — dopo 0.6.0
- [ ] #66 [Telemetria: tassonomia eventi, KPI e privacy](https://github.com/ieeah/arc-benches/issues/66)

---

## 0.9.0 "Rifinitura Tattica" — Consolidamento UI/UX e Performance prima della migrazione — Non ancora raggiunta
- [ ] #60 [Refactor UI/UX Globale](https://github.com/ieeah/arc-benches/issues/60)
- [ ] #4 [Supporto Tastiera per Drag & Drop](https://github.com/ieeah/arc-benches/issues/4)

---

## 0.10.0 "Ponte Next & Supabase" — Migrazione Next.js, Auth & Database Cloud — Non ancora raggiunta
Obiettivo: migrazione dello stack; #28 per primo, perché sostituisce router e build su cui poggiano #27, #65 e #67.
- [ ] #28 [Next.js & Vercel (App Router, SSR, Route Handlers)](https://github.com/ieeah/arc-benches/issues/28)
- [ ] #27 [View Transitions](https://github.com/ieeah/arc-benches/issues/27) — dopo #28
- [ ] #14 [Supabase — Schema dati di gioco & RLS](https://github.com/ieeah/arc-benches/issues/14) — dopo #73, #85
- [ ] #15 [Supabase — Account & Auth](https://github.com/ieeah/arc-benches/issues/15) — dopo #14
- [ ] #16 [Supabase — Sync background offline-first](https://github.com/ieeah/arc-benches/issues/16) — dopo #14, #15, #74
- [ ] #65 [Backoffice & Pipeline (/admin)](https://github.com/ieeah/arc-benches/issues/65) — assorbe le pagine Dev della 0.5.0
- [ ] #97 [Fallback automatico su fonte dati di backup](https://github.com/ieeah/arc-benches/issues/97) — parte di #65
- [ ] #67 [Telemetria first-party](https://github.com/ieeah/arc-benches/issues/67) — dopo #66, #28

---

## 1.0.0 "Rete Speranza" — Lancio Pubblico Ufficiale — Non ancora raggiunta
Deve già contenere: Skill Tree (0.7.0), tracker e collezioni (0.6.0), armi amplificate (0.6.0).
- [ ] #20 [Tour Onboarding interattivo](https://github.com/ieeah/arc-benches/issues/20)
- [ ] #25 [Condivisione Liste tramite Link con Open-Graph preview](https://github.com/ieeah/arc-benches/issues/25) — dopo #14, #15, #16, #28
- Rilascio pubblico ufficiale su Vercel con sync multi-dispositivo, sicurezza e monitoraggio di base.

---

## 1.x "Orizzonte Tattico" — Moduli Estesi Post-Lancio — Non ancora raggiunta
- [ ] #29 [Supporto PWA (service worker e offline, dopo la migrazione a Next e legata a #16)](https://github.com/ieeah/arc-benches/issues/29) — dopo 0.10.0
- [ ] #61 [Mappe Interattive (include Pendola Pass)](https://github.com/ieeah/arc-benches/issues/61) — dopo 0.10.0 (tile su Supabase Storage)
- [ ] #98 [Condivisione build Skill Tree via link](https://github.com/ieeah/arc-benches/issues/98) — dopo #62, #25
- [ ] #99 [Checklist pre-raid degli oggetti da portare](https://github.com/ieeah/arc-benches/issues/99) — dopo #82
- [ ] #33 [Role Maker — Riorganizzazione UI](https://github.com/ieeah/arc-benches/issues/33)
- [ ] #37 [Role Maker — Arricchimento e correzione meccaniche](https://github.com/ieeah/arc-benches/issues/37)
- [ ] #38 [Role Maker — micro-app autonoma](https://github.com/ieeah/arc-benches/issues/38)
- [ ] #101 [Role Maker — pagina Dev per la revisione manuale di ruoli e lore](https://github.com/ieeah/arc-benches/issues/101) — la feature resta dietro il flag `role-maker` (false) finché i contenuti non sono rivisti

---

## 2.x "Controllo Totale" — Codex & Mobile — Non ancora raggiunta
- [ ] #64 [Codex di Speranza](https://github.com/ieeah/arc-benches/issues/64)
- [ ] #100 [Guide e suggerimenti in-app](https://github.com/ieeah/arc-benches/issues/100) — confluisce in #64
- [ ] #40 [Wrapper Mobile Nativo](https://github.com/ieeah/arc-benches/issues/40)

---

## Fuori sequenza
- **Spedizioni (da rivalutare)**: Embark sta ricostruendo le spedizioni da zero; ognuno conserva i punti bonus già ottenuti. Si valuta un milestone intermedio dedicato in base a quando arriva la 1.0.0 e a come saranno le nuove spedizioni. Contiene #34 [Vault Spedizione](https://github.com/ieeah/arc-benches/issues/34).
- **Nota**: #63 (Feature Flags, pianificata in 2.x) è stata completata fuori ordine e rientra nel milestone 0.5.0.
