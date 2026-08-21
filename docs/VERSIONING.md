# Versioning

Piano previsionale delle versioni verso l'MVP (1.0.0) e oltre, basato sui task presenti in [1_CURRENT.md](1_CURRENT.md), [2_ROADMAP.md](2_ROADMAP.md) e [3_BACKLOG.md](3_BACKLOG.md) al momento della stesura.
Il contenuto testuale del cosa-è-cambiato per versione non vive qui — per quello, vedi i tag Git e i changelog linkati in `changelog/`.

---

## Versione corrente

**0.2.0** ("Sacca dei Materiali"), determinata dal tag Git `v0.2.0`.

> **Nota su v0.2.0**: Il codice in `1_CURRENT.md` contiene le funzionalità di Multi-profilo Locale e Liste Custom, ed è stato formalizzato con il tag Git `v0.2.0`.

---

## Tema dei nickname: *Fasi di Sopravvivenza & Ricostruzione del Rifugio (ARC Raiders)*

I nickname seguono l'evoluzione narrativa del rifugio dei Raiders in Speranza:
- **0.1.0**: *Primo Rifugio* (Foundation tracker locale)
- **0.2.0**: *Sacca dei Materiali* (Gestione multi-profilo e liste custom)
- **0.3.0**: *Banco da Lavoro* (Rafforzamento architetturale & identity/roleplay)
- **0.4.0**: *Mappa di Spedizione* (Spedizioni, progetti e decisioni su materiali)
- **0.5.0**: *Segnale Radio* (Condivisione, i18n e onboarding della community)
- **1.0.0**: *Rete Speranza* (MVP Completo con cloud sync Supabase)

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

## 0.3.0 "Banco da Lavoro" — Identity, UX & Solidità Architetturale — Non ancora raggiunta
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
- [ ] #5 [Revisione Ordine Menu FloatingNav](https://github.com/ieeah/arc-benches/issues/5)
- [ ] #31 [Predisposizione sistema di prefiltraggio per le barre di ricerca degli elementi](https://github.com/ieeah/arc-benches/issues/31)
- [x] #35 [Tracker Blueprints (Pagina Progetti)](https://github.com/ieeah/arc-benches/issues/35)
- [x] #39 [Ottimizzazione rendering liste con CSS content-visibility e accorgimenti a zero-dipendenze](https://github.com/ieeah/arc-benches/issues/39)
- [x] #41 [Pagina Impostazioni & Gestione Globale (Tema, Profili, Backup, Ergonomia)](https://github.com/ieeah/arc-benches/issues/41)
- [x] #43 [Impostazione densità griglia Stash: selettore 2 vs 3 colonne (Card Grandi / Piccole)](https://github.com/ieeah/arc-benches/issues/43)
- [x] #44 [Refactor visivo e proporzioni delle card e icone degli oggetti di gioco](https://github.com/ieeah/arc-benches/issues/44)
- [ ] #45 [Pipeline MetaForge: normalizzazione icone e sistema di override dati con rilevamento modifiche upstream](https://github.com/ieeah/arc-benches/issues/45)
- [x] #46 [Supporto Layout Tablet: container fino a 768px, griglia a 4 colonne e UI a tutta larghezza](https://github.com/ieeah/arc-benches/issues/46)

---

## 0.4.0 "Mappa di Spedizione" — Spedizioni, Progetti & Decisioni Materiali — Non ancora raggiunta
- [ ] #17 [Spedizioni & Progetti (Fase 3)](https://github.com/ieeah/arc-benches/issues/17)
  - [ ] #42 [Visualizzazione e tracciamento delle azioni (requirementActions) nello Stash](https://github.com/ieeah/arc-benches/issues/42)
- [ ] #18 [Date di Scadenza per Liste e Progetti (Fase 3)](https://github.com/ieeah/arc-benches/issues/18)
- [ ] #21 [Internazionalizzazione i18n (Fase 3)](https://github.com/ieeah/arc-benches/issues/21)
- [ ] #4 [Supporto Tastiera per Drag & Drop](https://github.com/ieeah/arc-benches/issues/4)
- [ ] #9 [Icone Categoria Elementi](https://github.com/ieeah/arc-benches/issues/9)

---

## 0.5.0 "Segnale Radio" — Community & Onboarding — Non ancora raggiunta
- [ ] #26 [Vista Aggregata per Banco (Fase 3)](https://github.com/ieeah/arc-benches/issues/26)
- [x] #24 [Role Maker — Estensione Biografie & Lore](https://github.com/ieeah/arc-benches/issues/24)
- [ ] #27 [View Transitions](https://github.com/ieeah/arc-benches/issues/27)
- [ ] #29 [Supporto PWA (Progressive Web App & Offline Manifest)](https://github.com/ieeah/arc-benches/issues/29)

---

## 1.0.0 "Rete Speranza" — MVP completo — Non ancora raggiunta
- Consolidamento generale di tutte le funzionalità client-first, rifinitura UI e stabilità dello Stash offline su GitHub Pages.

---

## 1.x "Satellite di Speranza" — Sincronizzazione Cloud (SPA con DB & Sync) — Non ancora raggiunta
- [ ] #14 [Supabase — Schema Dati di Gioco (Fase 4a)](https://github.com/ieeah/arc-benches/issues/14)
- [ ] #15 [Supabase — Account & Auth (Fase 4b)](https://github.com/ieeah/arc-benches/issues/15)
- [ ] #16 [Supabase — Sync Background (Fase 4c)](https://github.com/ieeah/arc-benches/issues/16)
- [ ] #20 [Tour Onboarding con driver.js (Fase 3)](https://github.com/ieeah/arc-benches/issues/20)
- [ ] #25 [Condivisione Lista tramite Link (Fase 4d)](https://github.com/ieeah/arc-benches/issues/25)

---

## 2.x "Antenna di Speranza" — Migrazione Next.js & Serverless — Non ancora raggiunta
- [ ] #28 [Next.js & Vercel (Fase 5)](https://github.com/ieeah/arc-benches/issues/28)
- Servizio SSR per la rotta pubblica di condivisione `/share/<token>` con metadati SEO nativi.

## Oltre 2.x
- [ ] #40 [Wrapper Mobile Nativo (React Native / Capacitor / Expo)](https://github.com/ieeah/arc-benches/issues/40)
- Nuovi banchi e materiali dalle patch future di ARC Raiders.
- Dashboard avanzata di gruppo / raid squad.
