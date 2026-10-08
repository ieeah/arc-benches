# 2_ROADMAP.md — Sviluppi Futuri

Roadmap delle **nuove funzionalità e sistemi** non ancora presenti nel codice di **ARC Benches**, organizzata per versione.
Il piano completo (con dipendenze, ordine di lavoro e stato di ogni versione) vive in [VERSIONING.md](VERSIONING.md); miglioramenti, refactor e bug su cose esistenti stanno in [3_BACKLOG.md](3_BACKLOG.md).

---

## Versione 0.5.0 "Segnale Radio" — Fondamenta Dev e dati
- [ ] #84 [Pagina Dev: Custom Items Studio per gestire gli oggetti non presenti su MetaForge (alta priorità)](https://github.com/ieeah/arc-benches/issues/84)
- [ ] #85 [Modello Reward Pass come tipo di lista + editor Dev dei pass](https://github.com/ieeah/arc-benches/issues/85)
- [ ] #76 [Pagina Dev per la gestione delle quest e albero delle dipendenze](https://github.com/ieeah/arc-benches/issues/76)
- [ ] #87 [Progetto Outpost completo (moduli, Research Bench, arredi)](https://github.com/ieeah/arc-benches/issues/87)

---

## Versione 0.6.0 "Archivio del Rifugio" — Tracker e collezioni
- [ ] #90 [Reward Pass & Feats Tracker](https://github.com/ieeah/arc-benches/issues/90)
- [ ] #91 [Tracker collezioni cosmetiche (stencil, outfit, design, arredi)](https://github.com/ieeah/arc-benches/issues/91)
- [ ] #92 [Armi amplificate (Weapon Amplification)](https://github.com/ieeah/arc-benches/issues/92)
- [ ] #26 [Vista Aggregata per Banco (Fase 3)](https://github.com/ieeah/arc-benches/issues/26)

---

## Versione 0.7.0 "Guida di Speranza" — Quest, bestiario, spawn tips e Skill Tree
- [ ] #89 [Estrazione dati Skill Tree da MetaForge (svelte-flow)](https://github.com/ieeah/arc-benches/issues/89)
- [ ] #62 [Skill Tree dei Raiders: Albero delle abilità e sinergie](https://github.com/ieeah/arc-benches/issues/62)
  - *Nuovo albero (Frozen Trail)*: albero rielaborato — scelta binaria a metà ramo, fino a due su tre a fine ramo, valori di diverse abilità cambiati. La specifica va rifatta sul nuovo albero.
  - *Sorgente dati*: lo skill builder di MetaForge (`metaforge.app/arc-raiders/skill-builder`, rami Conditioning / Mobility / Survival) è reso con svelte-flow, quindi nodi e collegamenti sono estraibili dal payload della pagina invece di essere ricopiati a mano. Da verificare: la pagina è dietro Cloudflare (non raggiungibile da uno script semplice) e non è confermato che esponga già il nuovo albero; alternative: API MetaForge o RaidTheory/arcraiders-data.
- [ ] #58 [Quest Tracker Informativo: Consultazione contratti e ricompense commercianti con ipotesi visualizzazione albero canvas (ARDB)](https://github.com/ieeah/arc-benches/issues/58)
- [ ] #94 [Commercianti: limiti giornalieri e Nomadic Envoy](https://github.com/ieeah/arc-benches/issues/94)
- [ ] #95 [Planner progressione XP → Skill Points](https://github.com/ieeah/arc-benches/issues/95)
- [ ] #57 [Bestiario ARC & Drop Tables: Consultazione nemici ARC e componenti con icone SVG (ARDB)](https://github.com/ieeah/arc-benches/issues/57)
- [ ] #59 [Spawn Tips "Dove trovo questo oggetto": Schede visive con screenshot in-game/mappa dei punti noti](https://github.com/ieeah/arc-benches/issues/59)
- [ ] #81 [Stash: raggruppamento "per mappa"](https://github.com/ieeah/arc-benches/issues/81) — richiede il catalogo globale delle mappe definito in #82 (dato condiviso con #59)

---

## Versione 0.8.0 "Centro Operativo" — Dashboard, eventi live, trofei e telemetria
- [ ] #55 [Condizioni Mappe & Eventi Live: Service multi-regione, caching 24h e preferenze](https://github.com/ieeah/arc-benches/issues/55)
- [ ] #96 [Allerta Flash Freeze nel meteo dinamico](https://github.com/ieeah/arc-benches/issues/96)
- [ ] #56 [Dashboard Minimale: Panoramica eventi live filtrabili e sintesi rifugio ad alto livello](https://github.com/ieeah/arc-benches/issues/56)
- [ ] #70 [Bacheca dei Trofei: Pagina archivio per visualizzare progetti, spedizioni e traguardi completati](https://github.com/ieeah/arc-benches/issues/70)
- [ ] #66 [Telemetria & Metriche: Definizione tassonomia eventi, KPI di utilizzo e specifiche privacy](https://github.com/ieeah/arc-benches/issues/66)

---

## Versione 0.9.0 "Rifinitura Tattica"
Solo voci di refactor e performance: vedi [3_BACKLOG.md](3_BACKLOG.md) (#60, #11, #4).

---

## Versione 0.10.0 "Ponte Next & Supabase"
- [ ] #28 [Next.js & Vercel: Migrazione ad App Router, SSR e Route Handlers (Fase 5)](https://github.com/ieeah/arc-benches/issues/28)
- [ ] #27 [View Transitions](https://github.com/ieeah/arc-benches/issues/27) — dopo #28
- [ ] #14 [Database & Backend — Schema Dati di Gioco & RLS (Fase 4a)](https://github.com/ieeah/arc-benches/issues/14)
- [ ] #15 [Supabase — Account & Auth (Fase 4b)](https://github.com/ieeah/arc-benches/issues/15)
- [ ] #16 [Supabase — Sync Background Offline-First (Fase 4c)](https://github.com/ieeah/arc-benches/issues/16)
- [ ] #65 [Backoffice & Pipeline: Area riservata Next.js (/admin) per sync dati, storage asset e studio overrides](https://github.com/ieeah/arc-benches/issues/65)
- [ ] #97 [Fallback automatico della pipeline su fonte dati di backup](https://github.com/ieeah/arc-benches/issues/97)
- [ ] #67 [Telemetria & Metriche: Implementazione first-party su Route Handlers Next.js e Supabase](https://github.com/ieeah/arc-benches/issues/67)

---

## Versione 1.0.0 "Rete Speranza" (Lancio Pubblico Ufficiale)
Deve già contenere Skill Tree, tracker e collezioni, armi amplificate (0.6.0–0.7.0).
- [ ] #20 [Tour Onboarding interattivo per nuovi utenti](https://github.com/ieeah/arc-benches/issues/20)
- [ ] #25 [Condivisione Liste tramite Link con Open-Graph preview (Fase 4d)](https://github.com/ieeah/arc-benches/issues/25)

---

## Versione 1.x "Orizzonte Tattico" (Moduli Estesi Post-Lancio)
- [ ] #29 [Supporto PWA (service worker e offline)](https://github.com/ieeah/arc-benches/issues/29) — dopo la migrazione a Next, legata alla sync offline di #16
- [ ] #61 [Mappe Interattive: Pan/Zoom Leaflet, POI, estrattori e loot nodes su database](https://github.com/ieeah/arc-benches/issues/61)
  - *Multi-Livello & Floor Switcher*: Gestione piani verticali sovrapposti (Stella Montis L1/L2, Blue Gate e Spaceport) con toggle del layer e filtro POI su `floor_level`.
  - *Asset & Risoluzione*: Ricerca/estrazione del livello sotterraneo mancante di The Blue Gate e valutazione estrazione texture native in 4K/8K da Unreal Engine 5 (FModel) per massima nitidezza.
  - *Storage Remoto*: Distribuzione dei tile esclusivamente via Supabase Storage CDN (`scripts/data/maps/` $\rightarrow$ bucket CDN), senza inclusione nel bundle statico dell'app.
  - *Pendola Pass*: nuova regione montuosa e innevata, con i ripari dal freddo per il Flash Freeze.
- [ ] #98 [Condivisione build Skill Tree via link](https://github.com/ieeah/arc-benches/issues/98)
- [ ] #99 [Checklist pre-raid degli oggetti da portare](https://github.com/ieeah/arc-benches/issues/99)
- [ ] #33 [Role Maker — Riorganizzazione UI e Miglioramenti](https://github.com/ieeah/arc-benches/issues/33)
- [ ] #37 [Role Maker — Arricchimento, coerenza gameplay e correzione meccaniche](https://github.com/ieeah/arc-benches/issues/37)
- [ ] #38 [Role Maker: Creazione della pagina / micro-app autonoma su sottodominio dedicato](https://github.com/ieeah/arc-benches/issues/38)

---

## Versione 2.x "Controllo Totale" (Codex & Mobile)
- [ ] #64 [Codex di Speranza: Enciclopedia lore, trascrizioni radio, guide e archivio di mondo](https://github.com/ieeah/arc-benches/issues/64)
- [ ] #100 [Guide e suggerimenti in-app (confluisce nel Codex)](https://github.com/ieeah/arc-benches/issues/100)
- [ ] #40 [Wrapper Mobile Nativo (React Native / Capacitor / Expo)](https://github.com/ieeah/arc-benches/issues/40)

---

## Fuori sequenza
- **Spedizioni (da rivalutare)**: in pausa, Embark le sta ricostruendo da zero. Contiene #34 [Vault Spedizione (Cassaforte Wipe)](https://github.com/ieeah/arc-benches/issues/34). Si valuta un milestone intermedio dedicato in base a quando arriva la 1.0.0.
