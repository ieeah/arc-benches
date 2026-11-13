# 2_ROADMAP.md — Sviluppi Futuri

Roadmap delle **nuove funzionalità e sistemi** non ancora presenti nel codice di **ARC Benches**, organizzata per versione.
Il piano completo (con dipendenze, ordine di lavoro e stato di ogni versione) vive in [VERSIONING.md](VERSIONING.md); miglioramenti, refactor, debito tecnico e ottimizzazioni su cose esistenti stanno in [3_BACKLOG.md](3_BACKLOG.md).

---

## Versione 0.5.0 "Segnale Radio" — Gestione dei Dati di 1° Livello
- [x] #75 [Badge di craftabilità sulle card degli oggetti (estensione a tutti i banchi)](https://github.com/ieeah/arc-benches/issues/75)
- [x] #102 [Moduli attivabili per profilo (`isSectionActive`, feature flags utente)](https://github.com/ieeah/arc-benches/issues/102)
  - *Specifica tecnica*: [docs/specs/moduli-attivabili-per-profilo.md](specs/moduli-attivabili-per-profilo.md)
- [x] #74 [Export/import completo: tutti i campi del profilo inclusi nel backup](https://github.com/ieeah/arc-benches/issues/74)
- [x] #160 [Rendere riconoscibili le liste disattivate in Banchi e Liste anche a card chiusa](https://github.com/ieeah/arc-benches/issues/160)

Tutte le voci della `0.5.0` sono completate e rilasciate in `v0.5.0`.

---

## Versione 0.5.1 "Taratura del Segnale" — Consolidamento 0.5.0 & Tooling Vite
- [x] #124 [Tema del browser: `color-scheme`, `theme-color` e `accent-color`](https://github.com/ieeah/arc-benches/issues/124)

Il resto della `0.5.1` (migrazione `PageLayout`, `type`, ordinamento priorità Stash #69, `@tailwindcss/vite` #127) è in [3_BACKLOG.md](3_BACKLOG.md).

---

## Versione 0.6.0 "Archivio del Rifugio" — Gestione dei Dati di 2° Livello e Avanzati (Blocco Principale)
- [ ] #145 [Pagina unificata «Collezioni» (Blueprint, Cosmetici, Outfit, Stencil, Design, Arredi)](https://github.com/ieeah/arc-benches/issues/145) — issue wrapper che riunisce:
  - [ ] #91 [Tracker collezioni cosmetiche (stencil, outfit, design, arredi)](https://github.com/ieeah/arc-benches/issues/91)
  - [ ] #131 [Sezione Guardaroba e catalogo personalizzazioni (skin, zaini, cosmetici e Scrappy)](https://github.com/ieeah/arc-benches/issues/131)
  - [ ] #109 [Outfit sbloccati a pezzi: distinguere completo, toggle e colori](https://github.com/ieeah/arc-benches/issues/109)
- [ ] #92 [Armi amplificate (Weapon Amplification) e gestione ricerche Research Bench](https://github.com/ieeah/arc-benches/issues/92)
- [ ] #113 [Costruzione, miglioramento di livello (`I→IV`) e riparazione nel dettaglio degli oggetti](https://github.com/ieeah/arc-benches/issues/113)
- [ ] #159 [Pianificazione massiva da banchi/progetti e salvataggio slice come lista custom](https://github.com/ieeah/arc-benches/issues/159)
- [ ] #89 [Estrazione dati Skill Tree da MetaForge (`svelte-flow`)](https://github.com/ieeah/arc-benches/issues/89)
- [ ] #62 [Skill Tree dei Raiders: albero delle abilità, sinergie e contatore punti abilità](https://github.com/ieeah/arc-benches/issues/62)
  - *Nuovo albero (Frozen Trail)*: albero rielaborato — scelta binaria a metà ramo, fino a due su tre a fine ramo, valori di diverse abilità cambiati.
  - *Sorgente dati*: lo skill builder di MetaForge (`metaforge.app/arc-raiders/skill-builder`, rami Conditioning / Mobility / Survival) è reso con `svelte-flow`, quindi nodi e collegamenti sono estraibili dal payload della pagina.

---

## Versione 0.6.x "Consolidamento & Dati Estesi" — Consolidamento 0.6.0 & Dati Pre-1.0.0
- [ ] #58 [Quest Tracker utente (condivide l'architettura mobile-first di #76)](https://github.com/ieeah/arc-benches/issues/58)
  - *Comportamento con le Spedizioni (reset opzionale)*: in gioco il Raider può scegliere se azzerare o conservare i progressi delle quest alla partenza; il flusso di chiusura/partenza richiederà la scelta all'utente prima del wipe.
- [ ] #161 [Visualizzazione oggetti per quest nello Stash con orizzonte per ramo e distinzione carry/consegna](https://github.com/ieeah/arc-benches/issues/161) — collegata a #58 e #76
- [ ] #94 [Commercianti: limiti giornalieri statici ("Ne puoi comprare X al giorno"), countdown reset e scheda informativa Cassio/Ermal](https://github.com/ieeah/arc-benches/issues/94)
- [ ] #26 [Vista Aggregata per Banco/Lista nello Stash con accesso rapido al dettaglio lista per livelli](https://github.com/ieeah/arc-benches/issues/26)
- [ ] #59 [Spawn Tips "Dove trovo questo oggetto" basati sulle Zone di Loot (`loot_area`)](https://github.com/ieeah/arc-benches/issues/59)
- [ ] #81 [Raggruppamento per Mappa / Zona di Loot (prioritariamente in `RaidPlanPage`)](https://github.com/ieeah/arc-benches/issues/81) — collegata a #59
- [ ] #70 [Bacheca dei Trofei: pagina archivio per progetti, spedizioni, pass e traguardi completati](https://github.com/ieeah/arc-benches/issues/70)
- [ ] #56 [Dashboard Minimale: pagina di riepilogo non predefinita all'avvio (da analizzare; possibile rinvio/rimozione)](https://github.com/ieeah/arc-benches/issues/56)
- [ ] #101 [Role Maker: pagina Dev per la revisione manuale di ruoli e lore](https://github.com/ieeah/arc-benches/issues/101) — da rivalutare in ottica UGC/storico; fino ad allora il modulo resta dietro il flag `role-maker` (`false`)

---

## Versione 0.7.0 "Guida di Speranza" — Preparazione UI/UX, Base UI & Struttura Pagine (Pre-Migrazione)
- [ ] #141 [Dev Studio: UI Kit & Component Playground con vista comparativa e adozione incrementale Base UI](https://github.com/ieeah/arc-benches/issues/141) — **1° step prima di toccare Base UI**
- [ ] #116 [Pagina di dettaglio per ogni lista, pagina dell'Outpost e riorganizzazione delle pagine](https://github.com/ieeah/arc-benches/issues/116)

Le altre voci della `0.7.0` (#121, #122, #60, #115, #4) sono refactor UI/accessibilità: vedi [3_BACKLOG.md](3_BACKLOG.md).

---

## Versione 0.8.0 "Ponte Next & Supabase" — Passaggio alla Nuova Architettura
- [ ] #28 [Next.js & Vercel: migrazione ad App Router, SSR e Route Handlers](https://github.com/ieeah/arc-benches/issues/28)
- [ ] #14 [Supabase — Schema Dati di Gioco & RLS](https://github.com/ieeah/arc-benches/issues/14)
- [ ] #15 [Supabase — Account & Auth](https://github.com/ieeah/arc-benches/issues/15)
- [ ] #16 [Supabase — Sync Background offline-first](https://github.com/ieeah/arc-benches/issues/16)
- [ ] #65 [Backoffice & Pipeline: area riservata Next.js (`/admin`) per sync dati, storage asset e studio overrides](https://github.com/ieeah/arc-benches/issues/65)
- [ ] #97 [Fallback automatico della pipeline su fonte dati di backup](https://github.com/ieeah/arc-benches/issues/97)

Il redesign completo delle Impostazioni sulla nuova persistenza (#148) è tracciato anche in [3_BACKLOG.md](3_BACKLOG.md).

---

## Versione 0.9.0 "Rifinitura Tattica" — Performance, Ottimizzazione & Telemetria sul Nuovo Stack
- [ ] #27 [`View Transitions` fluide tra le rotte del router Next.js](https://github.com/ieeah/arc-benches/issues/27) — dopo #28
- [ ] #66 [Telemetria & Metriche: tassonomia eventi, KPI di utilizzo e specifiche privacy (rigorosamente cookieless e anonima)](https://github.com/ieeah/arc-benches/issues/66)
- [ ] #67 [Telemetria & Metriche: implementazione first-party su Route Handlers Next.js e Supabase](https://github.com/ieeah/arc-benches/issues/67)

Le ottimizzazioni di performance sul nuovo stack (#119, #120, #142, #11) sono in [3_BACKLOG.md](3_BACKLOG.md).

---

## Versione 1.0.0 "Rete Speranza" (Lancio Pubblico Ufficiale)
- [ ] #147 [Commercianti: integrazione offerte a rotazione settimanale di Cassio/Ermal via backend](https://github.com/ieeah/arc-benches/issues/147)
- [ ] #55 [Condizioni Mappe & Eventi Live: service multi-regione, caching backend e preferenze](https://github.com/ieeah/arc-benches/issues/55)
- [ ] #61 [Mappe Interattive: Pan/Zoom Leaflet, POI, estrattori, selettore multipiano e loot nodes su database](https://github.com/ieeah/arc-benches/issues/61)
  - *Multi-Livello & Floor Switcher*: gestione piani verticali sovrapposti (Stella Montis L1/L2, Blue Gate e Spaceport) con toggle del layer e filtro POI su `floor_level`.
  - *Storage Remoto*: distribuzione dei tile via Supabase Storage CDN (`scripts/data/maps/` → bucket CDN).
  - *Pendola Pass*: regione montuosa e innevata con i ripari dal freddo.
- [ ] #64 [Codex di Speranza: enciclopedia lore, trascrizioni radio, guide e archivio di mondo](https://github.com/ieeah/arc-benches/issues/64)
- [ ] #57 [Sezione «ARCs» nel Codex (nemici, Sonde e Corrieri ARC, senza drop tables)](https://github.com/ieeah/arc-benches/issues/57)
- [ ] #25 [Condivisione Liste tramite Link con Open-Graph preview (`/share/<token>`)](https://github.com/ieeah/arc-benches/issues/25)
- [ ] #98 [Condivisione build Skill Tree via link](https://github.com/ieeah/arc-benches/issues/98)
- [ ] #20 [Tour Onboarding interattivo con `driver.js`](https://github.com/ieeah/arc-benches/issues/20)

---

## Versione 1.x "Orizzonte Tattico" (Moduli Estesi Post-Lancio)
- [ ] #29 [Supporto PWA (service worker e offline manifest)](https://github.com/ieeah/arc-benches/issues/29) — dopo la migrazione a Next.js (#28) e la sync di #16
- [ ] #99 [Checklist pre-raid degli oggetti da portare](https://github.com/ieeah/arc-benches/issues/99)
- [ ] #132 [Modulo Pianificazione Raid (Briefing, obiettivi spot, checklist e percorsi)](https://github.com/ieeah/arc-benches/issues/132)
- [ ] #118 [Mappe Interattive: pianificazione itinerari e percorsi tattici (waypoint)](https://github.com/ieeah/arc-benches/issues/118) — collegata a #61
- [ ] #33 [Role Maker — Riorganizzazione UI e miglioramenti](https://github.com/ieeah/arc-benches/issues/33)
- [ ] #38 [Role Maker — Creazione della pagina / micro-app autonoma su sottodominio dedicato](https://github.com/ieeah/arc-benches/issues/38)

---

## Versione 2.x "Controllo Totale" (Evoluzioni di Lungo Periodo)
- [ ] #100 [Guide e suggerimenti in-app (confluisce nel Codex #64)](https://github.com/ieeah/arc-benches/issues/100)
- [ ] #40 [Wrapper Mobile Nativo (React Native / Capacitor / Expo)](https://github.com/ieeah/arc-benches/issues/40)
