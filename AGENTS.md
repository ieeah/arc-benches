# AGENTS.md

Questo file fornisce una panoramica rapida e comandi utili per gli Agenti AI che lavorano su **ARC Benches**.

> ⚠️ **Regole Operative e Vincoli di Progetto**:
> Tutte le regole vincolanti (autonomia commit, convenzioni git, lockfile, UI, tracker CLI, cosa l'agente non deve fare) sono definite e consolidate in **[AGENTS-PROJECT-RULES.md](AGENTS-PROJECT-RULES.md)**.
> Prima di qualsiasi operazione, proposta o piano, fai riferimento a quel file.

---

## 🚀 Comandi Rapidi

```bash
npm run dev        # Avvia il dev server (Vite HMR, base path /arc-benches/)
npm run build      # Type-check (tsc -b) + build di produzione
npm run lint       # ESLint
npm run preview    # Anteprima della build di produzione
npm run check:lock # Verifica che package-lock.json sia in sync (stesso check di npm ci in CI)

# Script dati (pacchetto separato in scripts/):
cd scripts && npm install && node fetch-items.mjs            # Rigenera items.json + icone da MetaForge
cd scripts && npm install && node fetch-category-icons.mjs   # Scarica & normalizza icone di categoria da Wiki API
cd scripts && node fetch-translations.mjs                    # Sincronizza traduzioni IT degli oggetti da RaidTheory (passa --refresh per riscaricare)
cd scripts && node fetch-arctracker.mjs                      # Rapporto locale degli oggetti di ARC Tracker assenti dal catalogo (--refresh per riscaricare; nulla viene scritto in src/)
cd scripts && node fetch-quests.mjs                          # Sincronizza le 123 quest da MetaForge + ARC Tracker (--refresh per riscaricare)
```

---

## 🛠 Cos'è questo Progetto

**ARC Benches** è un Companion Tracker mobile-first (React 19 + TypeScript + Vite + Tailwind CSS v4) in italiano per il videogioco *ARC Raiders*.
Aggrega i costi di potenziamento dei banchi del rifugio dal livello attuale al livello obiettivo, traccia l'inventario, e calcola in tempo reale i materiali mancanti e i potenziamenti disponibili.

Per dettagli sul contesto generale, tracker ed estensioni consulta [PROJECT-PROFILE.md](PROJECT-PROFILE.md).

---

## 📐 Regole di Progetto

Le regole operative, le convenzioni di commit, l'uso di `gh`, le linee guida UI e la gestione del lockfile sono centralizzate in:
👉 **[AGENTS-PROJECT-RULES.md](AGENTS-PROJECT-RULES.md)**

---

## 📚 Struttura della Documentazione (Layered-Docs)

Il progetto adotta la convenzione **layered-docs**: file sintetici in radice per la contestualizzazione rapida + cartella `docs/` per la documentazione tecnica di dettaglio.

### File in Radice
- [AGENTS-PROJECT-RULES.md](AGENTS-PROJECT-RULES.md) — Regole e vincoli operativi vincolanti per gli agenti.
- [PROJECT-PROFILE.md](PROJECT-PROFILE.md) — Profilo sintetico condiviso del progetto.
- [README.md](README.md) — Presentazione pubblica, funzionalità e setup rapido.

### Documenti di Struttura (`docs/`)
- [docs/1_CURRENT.md](docs/1_CURRENT.md) — Stato attuale, funzionalità già costruite e verificate.
- [docs/2_ROADMAP.md](docs/2_ROADMAP.md) — Sviluppi futuri e nuove funzionalità non ancora presenti.
- [docs/3_BACKLOG.md](docs/3_BACKLOG.md) — Bug, debito tecnico e refactoring su cose esistenti.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Mappa statica di architettura e flusso dati.
- [docs/INCEPTION_BRIEF.md](docs/INCEPTION_BRIEF.md) — Documento d'insieme di fondazione (problema, persone, MVP, pre-mortem e decisioni tecniche).
- [docs/VERSIONING.md](docs/VERSIONING.md) — Piano previsionale delle versioni e della roadmap SemVer fino all'MVP (1.0.0).
- [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) — Convenzioni di codice osservate nella codebase.
- [docs/consolidamento-0.5.0.md](docs/consolidamento-0.5.0.md) — Raccolta dei punti emersi dalla prova manuale della 0.5.0, da riorganizzare.
- [changelog/](changelog/) — Note di rilascio per versione; la prossima versione ha una bozza sempre aggiornata (es. `changelog/0.5.0.md`).

### Specifiche di Dettaglio (`docs/specs/`)
- [docs/specs/progetti.md](docs/specs/progetti.md) — Specifica sistema progetti.
- [docs/specs/spedizioni.md](docs/specs/spedizioni.md) — Specifica spedizioni e donazioni.
- [docs/specs/condivisione-liste-link.md](docs/specs/condivisione-liste-link.md) — Specifica condivisione liste via link.
- [docs/specs/data-sources-analysis.md](docs/specs/data-sources-analysis.md) — Analisi comparativa delle fonti dati catalogo.
- [docs/specs/mappe-interattive.md](docs/specs/mappe-interattive.md) — Specifica tecnica e analisi di fattibilità mappe interattive (v1.x).
- [docs/specs/transizione-next-supabase.md](docs/specs/transizione-next-supabase.md) — Strategia di transizione su nuovo repository Next.js & Supabase.
- [docs/specs/confronto-stack-backend-supabase-vs-neon.md](docs/specs/confronto-stack-backend-supabase-vs-neon.md) — Analisi comparativa stack backend: Supabase vs Neon + Better-Auth + Drizzle.
- [docs/specs/azioni-di-livello.md](docs/specs/azioni-di-livello.md) — Azioni di livello: finestra di validità (corrente + 1) e fase attiva delle spedizioni.
- [docs/specs/outpost-e-requisiti-tra-liste.md](docs/specs/outpost-e-requisiti-tra-liste.md) — Outpost, Sheltered Retreat e requisiti di livello tra liste.
- [docs/specs/reward-pass-tech-spec.md](docs/specs/reward-pass-tech-spec.md) — Modello e visualizzazione dei Reward Pass (liste con tracce generiche).
- [docs/specs/gameplay-tips-and-strategies.md](docs/specs/gameplay-tips-and-strategies.md) — Suggerimenti e strategie per la gestione delle risorse di gioco.

### Decisioni Architetturali (`docs/adrs/`)
- [docs/adrs/001-zustand-senza-middleware-persist.md](docs/adrs/001-zustand-senza-middleware-persist.md) — Rimoziome middleware persist nativo.
- [docs/adrs/002-astrazione-lista-generica.md](docs/adrs/002-astrazione-lista-generica.md) — Generalizzazione modello `List`.
- [docs/adrs/003-regola-direzione-drawer.md](docs/adrs/003-regola-direzione-drawer.md) — Regola direzione apertura `Drawer`.
- [docs/adrs/004-rimozione-tieni-o-butta.md](docs/adrs/004-rimozione-tieni-o-butta.md) — Rimozione della feature «Tieni o Butta».
- [docs/adrs/005-migrazione-nextjs-e-integrazione-supabase.md](docs/adrs/005-migrazione-nextjs-e-integrazione-supabase.md) — Migrazione a Next.js e integrazione Supabase.
- [docs/adrs/006-feature-flags-da-seed-con-override-locale.md](docs/adrs/006-feature-flags-da-seed-con-override-locale.md) — Feature flag da seed con override locale (bozza).
- [docs/adrs/007-strumenti-dev-bozze-a-differenze-e-applica.md](docs/adrs/007-strumenti-dev-bozze-a-differenze-e-applica.md) — Strumenti Dev: bozze a differenze e «Applica» (bozza).
- [docs/adrs/008-reward-pass-come-lista-con-tracce-generiche.md](docs/adrs/008-reward-pass-come-lista-con-tracce-generiche.md) — Reward Pass come lista con tracce generiche (bozza).
