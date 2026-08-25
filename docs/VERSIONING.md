# Versioning

Piano previsionale delle versioni verso l'MVP (1.0.0) e oltre, basato sui task presenti in [1_CURRENT.md](1_CURRENT.md), [2_ROADMAP.md](2_ROADMAP.md) e [3_BACKLOG.md](3_BACKLOG.md) al momento della stesura.
Il contenuto testuale del cosa-è-cambiato per versione non vive qui — per quello, vedi i tag Git e i changelog linkati in `changelog/`.

---

## Versione corrente

**0.3.0** ("Banco da Lavoro"), determinata dal tag Git `v0.3.0`.

> **Nota su v0.3.0**: Include consolidamento architetturale (validazione Zod, persistence boundary, WASM lockfile check, performance content-visibility), Role Maker, Tracker Blueprints, Pagina Impostazioni & Gestione Globale, Viste/Densità Stash, Supporto Tablet e la pipeline MetaForge con Studio Overrides.

---

## Tema dei nickname: *Fasi di Sopravvivenza & Ricostruzione del Rifugio (ARC Raiders)*

I nickname seguono l'evoluzione narrativa del rifugio dei Raiders in Speranza:
- **0.1.0**: *Primo Rifugio* (Foundation tracker locale)
- **0.2.0**: *Sacca dei Materiali* (Gestione multi-profilo e liste custom)
- **0.3.0**: *Banco da Lavoro* (Rafforzamento architetturale & identity/roleplay)
- **0.4.0**: *Mappa di Spedizione* (Spedizioni, progetti, router centralizzato & legal)
- **0.5.0**: *Segnale Radio* (Vista aggregata, PWA e rifiniture client)
- **0.6.0**: *Centro Operativo* (Dashboard minimale ed eventi live/condizioni mappe)
- **0.7.0**: *Guida di Speranza* (Bestiario, quest tracker con albero canvas & spawn tips)
- **0.8.0**: *Rifinitura Tattica* (Refactor UI/UX e preparazione alla migrazione)
- **0.9.0**: *Ponte Next & Supabase* (Migrazione Next.js App Router, Auth e Database Cloud)
- **1.0.0**: *Rete Speranza* (Lancio Pubblico Ufficiale con Onboarding e Condivisione)
- **1.x**: *Orizzonte Tattico* (Mappe interattive con POI, Skill Tree e Role Maker esteso)
- **2.x**: *Controllo Totale* (Feature Flags utente per moduli opzionali e Mobile Wrapper)

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

## 0.4.0 "Mappa di Spedizione" — Spedizioni, Progetti, Router Centralizzato & Legal — Non ancora raggiunta
- [ ] #17 [Spedizioni & Progetti (Fase 3)](https://github.com/ieeah/arc-benches/issues/17)
  - [ ] #42 [Visualizzazione e tracciamento delle azioni (requirementActions) nello Stash](https://github.com/ieeah/arc-benches/issues/42)
  - [ ] #53 [Pagina Dev: gestione liste sviluppatore (Workbench/Project/Expedition/Quest)](https://github.com/ieeah/arc-benches/issues/53)
- [x] #47 [UX CustomListEditor: flusso selezione quantità con modale dedicata e azioni rapide riga](https://github.com/ieeah/arc-benches/issues/47)
- [ ] #18 [Date di Scadenza per Liste e Progetti (Fase 3)](https://github.com/ieeah/arc-benches/issues/18)
- [x] #21 [Internazionalizzazione i18n (Fase 3)](https://github.com/ieeah/arc-benches/issues/21)
- [x] #48 [Scroll non bloccato quando gli overlay sono aperti](https://github.com/ieeah/arc-benches/issues/48)
- [x] #49 [i18n: Estensione del multilingua a tutti i componenti dell'UI](https://github.com/ieeah/arc-benches/issues/49)
- [x] #50 [UI/UX: Refactor Pills di Ordinamento con label fissa e slot toggle](https://github.com/ieeah/arc-benches/issues/50)
- [ ] #51 [Navigazione: Store centralizzato, memorizzazione ultima pagina e predisposizione App Router](https://github.com/ieeah/arc-benches/issues/51)
- [ ] #54 [Layout & Legal: Disclaimer non-affiliazione Embark Studios e attribuzioni dati MetaForge/ARDB](https://github.com/ieeah/arc-benches/issues/54)

---

## 0.5.0 "Segnale Radio" — Vista Aggregata, PWA & Rifiniture Client — Non ancora raggiunta
- [ ] #26 [Vista Aggregata per Banco (Fase 3)](https://github.com/ieeah/arc-benches/issues/26)
- [ ] #29 [Supporto PWA (Progressive Web App & Offline Manifest)](https://github.com/ieeah/arc-benches/issues/29)
- [ ] #4 [Supporto Tastiera per Drag & Drop](https://github.com/ieeah/arc-benches/issues/4)
- [ ] #27 [View Transitions](https://github.com/ieeah/arc-benches/issues/27)

---

## 0.6.0 "Centro Operativo" — Dashboard Minimale & Eventi Live — Non ancora raggiunta
- [ ] #55 [Condizioni Mappe & Eventi Live: Service multi-regione, caching 24h e preferenze](https://github.com/ieeah/arc-benches/issues/55)
- [ ] #56 [Dashboard Minimale: Panoramica eventi live filtrabili e sintesi rifugio ad alto livello](https://github.com/ieeah/arc-benches/issues/56)

---

## 0.7.0 "Guida di Speranza" — Bestiario, Quest & "Dove trovo questo oggetto" — Non ancora raggiunta
- [ ] #57 [Bestiario ARC & Drop Tables: Consultazione nemici ARC e componenti con icone SVG (ARDB)](https://github.com/ieeah/arc-benches/issues/57)
- [ ] #58 [Quest Tracker Informativo: Consultazione contratti e ricompense commercianti con ipotesi visualizzazione albero canvas (ARDB)](https://github.com/ieeah/arc-benches/issues/58)
- [ ] #59 [Spawn Tips "Dove trovo questo oggetto": Schede visive con screenshot in-game/mappa dei punti noti](https://github.com/ieeah/arc-benches/issues/59)

---

## 0.8.0 "Rifinitura Tattica" — Refactor UI/UX & Preparazione Migrazione — Non ancora raggiunta
- [ ] #60 [Refactor UI/UX Globale: Consolidamento componenti, modali, drawer e densità visiva](https://github.com/ieeah/arc-benches/issues/60)
- [ ] #11 [Performance: Strategie di Ottimizzazione Rendering per Liste Lunghe](https://github.com/ieeah/arc-benches/issues/11)

---

## 0.9.0 "Ponte Next & Supabase" — Migrazione Next.js, Auth & Database Cloud — Non ancora raggiunta
- [ ] #28 [Next.js & Vercel: Migrazione ad App Router, SSR e Route Handlers (Fase 5)](https://github.com/ieeah/arc-benches/issues/28)
- [ ] #14 [Supabase — Schema Dati di Gioco Postgres & RLS (Fase 4a)](https://github.com/ieeah/arc-benches/issues/14)
- [ ] #15 [Supabase — Account & Auth (Fase 4b)](https://github.com/ieeah/arc-benches/issues/15)
- [ ] #16 [Supabase — Sync Background Offline-First (Fase 4c)](https://github.com/ieeah/arc-benches/issues/16)
- [ ] #65 [Backoffice & Pipeline: Area riservata Next.js (/admin) per sync dati, storage asset e studio overrides](https://github.com/ieeah/arc-benches/issues/65)

---

## 1.0.0 "Rete Speranza" — Lancio Pubblico Ufficiale — Non ancora raggiunta
- [ ] #20 [Tour Onboarding interattivo per nuovi utenti](https://github.com/ieeah/arc-benches/issues/20)
- [ ] #25 [Condivisione Liste tramite Link con Open-Graph preview (Fase 4d)](https://github.com/ieeah/arc-benches/issues/25)
- Rilascio pubblico ufficiale su Vercel con sync multi-dispositivo, sicurezza e monitoraggio di base.

---

## 1.x "Orizzonte Tattico" — Moduli Estesi Post-Lancio — Non ancora raggiunta
- [ ] #61 [Mappe Interattive: Pan/Zoom Leaflet, POI, estrattori e loot nodes su database](https://github.com/ieeah/arc-benches/issues/61)
- [ ] #62 [Skill Tree dei Raiders: Albero delle abilità e sinergie](https://github.com/ieeah/arc-benches/issues/62)
- [ ] #24 [Role Maker — Estensione Biografie & Lore](https://github.com/ieeah/arc-benches/issues/24)
- [ ] #37 [Role Maker — Arricchimento, coerenza gameplay e correzione meccaniche](https://github.com/ieeah/arc-benches/issues/37)
- [ ] #38 [Role Maker: Creazione della pagina / micro-app autonoma su sottodominio dedicato](https://github.com/ieeah/arc-benches/issues/38)

---

## 2.x "Controllo Totale" — Personalizzazione Moduli & Mobile — Non ancora raggiunta
- [ ] #63 [Feature Flags Utente: Attivazione e disattivazione modulare delle sezioni dell'app](https://github.com/ieeah/arc-benches/issues/63)
- [ ] #64 [Codex di Speranza: Enciclopedia lore, trascrizioni radio, guide e archivio di mondo](https://github.com/ieeah/arc-benches/issues/64)
- [ ] #40 [Wrapper Mobile Nativo (React Native / Capacitor / Expo)](https://github.com/ieeah/arc-benches/issues/40)
