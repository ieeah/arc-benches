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

## Era 1: Sandbox & Data Mining (Questo Repository — Mese 1)

### Versione 0.6.0 "Archivio del Rifugio" — Formule di 2° Livello e Collezioni (In corso)
- [x] #164 [Campo `unlocks_item_id` per blueprint e design e integrazione nella pipeline](https://github.com/ieeah/arc-benches/issues/164) — propedeutica a #145 e #91
- [x] #145 [Pagina unificata «Collezioni» in-raid (Blueprint, Design Arredi e Stencil Armi)](https://github.com/ieeah/arc-benches/issues/145) — issue wrapper di #91
  - [x] #91 [Tracker collezioni in-game (Design Arredi e Stencil Armi)](https://github.com/ieeah/arc-benches/issues/91)
- [x] #89 [Estrazione dati Skill Tree da MetaForge (`svelte-flow`)](https://github.com/ieeah/arc-benches/issues/89)
- [x] #62 [Skill Tree dei Raiders: albero delle abilità, sinergie e contatore punti abilità](https://github.com/ieeah/arc-benches/issues/62)
- [x] #92 [Armi amplificate (Weapon Amplification) e gestione ricerche Research Bench](https://github.com/ieeah/arc-benches/issues/92)
- [x] #113 [Costruzione, miglioramento di livello (`I→IV`) e riparazione nel dettaglio degli oggetti](https://github.com/ieeah/arc-benches/issues/113)

---

### Versione 0.6.5 "Codex & Data Mining" — Estrazione Dataset Totale di Gioco (Nuova)
Obiettivo: estrarre, validare e normalizzare tutti i dati statici di gioco prima della transizione a database relazionale. Zero refactoring UI: solo pipeline dati e script.
- [ ] #57 / #64 **Dataset Codex Nemici ARC**: script `fetch-enemies.mjs` per estrarre tutti gli ARC (Snitch, Bastion, Rocketeer, Sentinel, Queen, ecc.), punti deboli, loot table con percentuali di drop e lore in `src/data/codex-enemies.json`.
- [ ] #61 **Dataset Mappe & POI**: script `fetch-maps.mjs` per normalizzare coordinate, confini, punti di estrazione, bunker a chiave e zone di loot in `src/data/maps.json`.
- [ ] #58 / #106 **Consolidamento Grafo 123 Quest**: completamento dati missioni (mandanti, tappe, condizioni di completamento, ricompense) in `src/data/quests.json`.
- [ ] #94 **Commercianti & Economia**: catalogo merci con costi e limiti di acquisto statici giornalieri in `src/data/traders.json`.
- [ ] #146 **Regole Matematiche Spedizioni**: consolidamento scaglioni danno, formula fabbisogno scalare e gestione del reset.

---

### Versione 0.6.9 "Engine Freeze" — Isolamento Logica Pura & Conclusione Sandbox (Nuova)
Obiettivo: estrarre tutto il "cervello" dell'applicazione in un modulo TypeScript puro (`src/engine/`) a zero dipendenze da React o Zustand, coperto da unit test al 100%, pronto per il nuovo repository.
- [ ] Estrazione e isolamento di `src/engine/` (`materials.ts`, `crafting.ts`, `expeditions.ts`, `skills.ts`, `quests.ts`).
- [ ] Suite di test unitari completa per ciascun modulo dell'engine (100% pass e zero accoppiamento UI).
- [ ] Congelamento del codice (*Feature & Data Freeze*), dismissione strumenti Dev non necessari e privatizzazione/archiviazione del repository.

---

## Era 2: Tooling & Seed (2–3 Settimane)
- Pipeline di ingestion, validatori di integrità referenziale e script di generazione seed SQL/Postgres.

---

## Era 3: Progettazione Architettura & Design (1 Mese)
- Schema relazionale definitivo (Drizzle/Supabase), wireframe, design tokens e setup componenti headless Base UI.

---

## Era 4: Nuovo Portale Next.js (Sviluppo Manuale — 3–5 Mesi a Milestone)
- **Milestone 1 — Core Companion (Settimane 1–8)**: Shell app, Auth, Stash aggregato e Banchi del rifugio, sync offline-first.
- **Milestone 2 — Progressione (Settimane 9–14)**: Reward Pass, Collezioni (Blueprint, Design, Stencil), Quest Tracker e Spedizioni.
- **Milestone 3 — Codex & Mappe (Settimane 15–20)**: Skill Tree interattivo dei Raiders, Codex Nemici ARC / Bestiario, Mappe interattive e rilascio pubblico `1.0.0`.
- [ ] #159 [Pianificazione massiva da banchi/progetti e salvataggio slice come lista custom](https://github.com/ieeah/arc-benches/issues/159) — possibile implementazione futura / estensione raid nel nuovo portale
