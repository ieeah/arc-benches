# 2_ROADMAP.md — Sviluppi Futuri

Roadmap delle funzionalità e dei sistemi non ancora presenti nel codice di **ARC Benches**.

---

## Versione 0.4.0 "Mappa di Spedizione"
- [x] #17 [Spedizioni & Progetti (Fase 3)](https://github.com/ieeah/arc-benches/issues/17)
  - [x] #42 [Visualizzazione e tracciamento delle azioni (requirementActions) nello Stash](https://github.com/ieeah/arc-benches/issues/42)
  - [ ] #53 [Pagina Dev: gestione liste sviluppatore (Workbench/Project/Expedition/Quest)](https://github.com/ieeah/arc-benches/issues/53)
- [x] #47 [UX CustomListEditor: flusso selezione quantità con modale dedicata e azioni rapide riga](https://github.com/ieeah/arc-benches/issues/47)
- [x] #18 [Date di Scadenza per Liste e Progetti (Fase 3)](https://github.com/ieeah/arc-benches/issues/18)
- [x] #21 [Internazionalizzazione i18n (Fase 3)](https://github.com/ieeah/arc-benches/issues/21)
- [x] #48 [Scroll non bloccato quando gli overlay sono aperti](https://github.com/ieeah/arc-benches/issues/48)
- [x] #49 [i18n: Estensione del multilingua a tutti i componenti dell'UI](https://github.com/ieeah/arc-benches/issues/49)
- [x] #50 [UI/UX: Refactor Pills di Ordinamento con label fissa e slot toggle](https://github.com/ieeah/arc-benches/issues/50)
- [ ] #51 [Navigazione: Store centralizzato, memorizzazione ultima pagina e predisposizione App Router](https://github.com/ieeah/arc-benches/issues/51)
- [ ] #54 [Layout & Legal: Disclaimer non-affiliazione Embark Studios e attribuzioni dati MetaForge/ARDB](https://github.com/ieeah/arc-benches/issues/54)
- [ ] #71 [Refactor & Clean-up: Decomposizione pagine Dev e UI in componenti modulari e custom hook](https://github.com/ieeah/arc-benches/issues/71)

---

## Versione 0.5.0 "Segnale Radio"
- [ ] #26 [Vista Aggregata per Banco (Fase 3)](https://github.com/ieeah/arc-benches/issues/26)
- [ ] #29 [Supporto PWA (Progressive Web App & Offline Manifest)](https://github.com/ieeah/arc-benches/issues/29)
- [ ] #4 [Supporto Tastiera per Drag & Drop](https://github.com/ieeah/arc-benches/issues/4)
- [ ] #27 [View Transitions](https://github.com/ieeah/arc-benches/issues/27)

---

## Versione 0.6.0 "Centro Operativo"
- [ ] #55 [Condizioni Mappe & Eventi Live: Service multi-regione, caching 24h e preferenze](https://github.com/ieeah/arc-benches/issues/55)
- [ ] #56 [Dashboard Minimale: Panoramica eventi live filtrabili e sintesi rifugio ad alto livello](https://github.com/ieeah/arc-benches/issues/56)
- [ ] #70 [Bacheca dei Trofei: Pagina archivio per visualizzare progetti, spedizioni e traguardi completati](https://github.com/ieeah/arc-benches/issues/70)
- [ ] #66 [Telemetria & Metriche: Definizione tassonomia eventi, KPI di utilizzo e specifiche privacy](https://github.com/ieeah/arc-benches/issues/66)

---

## Versione 0.7.0 "Guida di Speranza"
- [ ] #57 [Bestiario ARC & Drop Tables: Consultazione nemici ARC e componenti con icone SVG (ARDB)](https://github.com/ieeah/arc-benches/issues/57)
- [ ] #58 [Quest Tracker Informativo: Consultazione contratti e ricompense commercianti con ipotesi visualizzazione albero canvas (ARDB)](https://github.com/ieeah/arc-benches/issues/58)
- [ ] #59 [Spawn Tips "Dove trovo questo oggetto": Schede visive con screenshot in-game/mappa dei punti noti](https://github.com/ieeah/arc-benches/issues/59)

---

## Versione 0.8.0 "Rifinitura Tattica"
- [ ] #60 [Refactor UI/UX Globale: Consolidamento componenti, modali, drawer e densità visiva](https://github.com/ieeah/arc-benches/issues/60)
- [ ] #11 [Performance: Strategie di Ottimizzazione Rendering per Liste Lunghe](https://github.com/ieeah/arc-benches/issues/11)

---

## Versione 0.9.0 "Ponte Next & Supabase"
- [ ] #28 [Next.js & Vercel: Migrazione ad App Router, SSR e Route Handlers (Fase 5)](https://github.com/ieeah/arc-benches/issues/28)
- [ ] #14 [Database & Backend — Schema Dati di Gioco, Finestra Spedizione Globale & RLS (Fase 4a)](https://github.com/ieeah/arc-benches/issues/14)
- [ ] #15 [Supabase — Account & Auth (Fase 4b)](https://github.com/ieeah/arc-benches/issues/15)
- [ ] #16 [Supabase — Sync Background Offline-First (Fase 4c)](https://github.com/ieeah/arc-benches/issues/16)
- [ ] #65 [Backoffice & Pipeline: Area riservata Next.js (/admin) per sync dati, storage asset e studio overrides](https://github.com/ieeah/arc-benches/issues/65)
- [ ] #67 [Telemetria & Metriche: Implementazione first-party su Route Handlers Next.js e Supabase](https://github.com/ieeah/arc-benches/issues/67)

---

## Versione 1.0.0 "Rete Speranza" (Lancio Pubblico Ufficiale)
- [ ] #20 [Tour Onboarding interattivo per nuovi utenti](https://github.com/ieeah/arc-benches/issues/20)
- [ ] #25 [Condivisione Liste tramite Link con Open-Graph preview (Fase 4d)](https://github.com/ieeah/arc-benches/issues/25)

---

## Versione 1.x "Orizzonte Tattico" (Moduli Estesi Post-Lancio)
- [ ] #61 [Mappe Interattive: Pan/Zoom Leaflet, POI, estrattori e loot nodes su database](https://github.com/ieeah/arc-benches/issues/61)
  - *Multi-Livello & Floor Switcher*: Gestione piani verticali sovrapposti (Stella Montis L1/L2, Blue Gate e Spaceport) con toggle del layer e filtro POI su `floor_level`.
  - *Asset & Risoluzione*: Ricerca/estrazione del livello sotterraneo mancante di The Blue Gate e valutazione estrazione texture native in 4K/8K da Unreal Engine 5 (FModel) per massima nitidezza.
  - *Storage Remoto*: Distribuzione dei tile esclusivamente via Supabase Storage CDN (`scripts/data/maps/` $\rightarrow$ bucket CDN), senza inclusione nel bundle statico dell'app.
- [ ] #62 [Skill Tree dei Raiders: Albero delle abilità e sinergie](https://github.com/ieeah/arc-benches/issues/62)
- [ ] #24 [Role Maker — Estensione Biografie & Lore](https://github.com/ieeah/arc-benches/issues/24)
- [ ] #37 [Role Maker — Arricchimento, coerenza gameplay e correzione meccaniche](https://github.com/ieeah/arc-benches/issues/37)
- [ ] #38 [Role Maker: Creazione della pagina / micro-app autonoma su sottodominio dedicato](https://github.com/ieeah/arc-benches/issues/38)
- [ ] #34 [Vault Spedizione (Cassaforte Wipe)](https://github.com/ieeah/arc-benches/issues/34)

---

## Versione 2.x "Controllo Totale" (Personalizzazione & Mobile)
- [ ] #63 [Feature Flags Utente: Attivazione e disattivazione modulare delle sezioni dell'app](https://github.com/ieeah/arc-benches/issues/63)
- [ ] #64 [Codex di Speranza: Enciclopedia lore, trascrizioni radio, guide e archivio di mondo](https://github.com/ieeah/arc-benches/issues/64)
- [ ] #40 [Wrapper Mobile Nativo (React Native / Capacitor / Expo)](https://github.com/ieeah/arc-benches/issues/40)
