# AGENTS.md

Questo file fornisce le linee guida e le regole operative per gli Agenti AI che lavorano su **ARC Benches**.

---

## 🚀 Comandi Rapidi

```bash
npm run dev        # Avvia il dev server (Vite HMR, base path /arc-benches/)
npm run build      # Type-check (tsc -b) + build di produzione
npm run lint       # ESLint
npm run preview    # Anteprima della build di produzione
npm run check:lock # Verifica che package-lock.json sia in sync (stesso check di npm ci in CI)

# Script dati (pacchetto separato in scripts/):
cd scripts && npm install && node fetch-items.mjs   # Rigenera items.json + icone da MetaForge
```

> ⚠️ **Gestione Lockfile (Bug npm cross-platform)**:
> I fallback WASM (`@emnapi/*`) servono alla CI Linux ma non a Windows; rigenerare il lockfile con `node_modules` preesistente potrebbe perderli e causare il fallimento di `npm ci` in CI (`EUSAGE`).
> **Regole**:
> 1. Dopo OGNI `npm install` che modifica il lockfile, esegui `npm run check:lock` prima del push.
> 2. Se fallisce, elimina SIA `node_modules` SIA `package-lock.json` e rilancia `npm install`.
> 3. Niente dipendenze con binding nativi pesanti (`sharp`, `esbuild` standalone, ecc.) nel `package.json` radice — vanno inserite esclusivamente in `scripts/package.json`.

---

## 🛠 Cos'è questo Progetto

**ARC Benches** è un Companion Tracker mobile-first (React 19 + TypeScript + Vite + Tailwind CSS v4) in italiano per il videogioco *ARC Raiders*.
Aggrega i costi di potenziamento dei banchi del rifugio dal livello attuale al livello obiettivo, traccia l'inventario, e calcola in tempo reale i materiali mancanti e i potenziamenti disponibili.

Per dettagli sul contesto generale, tracker ed estensioni consulta [PROJECT-PROFILE.md](PROJECT-PROFILE.md).

---

## 📐 Convenzioni e Regole di Progetto

- **Commit**: Segui lo standard Conventional Commits (`type: descrizione` o `type(scope): descrizione`), con eventuale riferimento all'issue o fase (es. `feat: aggiunge pill livello attuale (#7 Fase 2)`). Nessun riferimento a strumenti AI nei commit.
- **ID Oggetti**: Gli ID degli oggetti usano sempre la notazione hyphen-case (`metal-parts`), mai underscore.
- **Interfaccia Utente (UI)**:
  - Lingua della UI in italiano.
  - Abbreviazione livelli: utilizzare sempre **"Lvl"** (non "Lv" o "Lvl.").
  - Card con superellisse: `rounded-[24px]` o `rounded-[28px]`.
  - **Direzione dei Drawer**: Un drawer deve aprirsi sempre dal lato del pulsante trigger (trigger in alto → `from="top"`, trigger in basso → `from="bottom"`).

---

## 📚 Struttura della Documentazione (Layered-Docs)

Il progetto adotta la convenzione **layered-docs**: file sintetici in radice per la contestualizzazione rapida + cartella `docs/` per la documentazione tecnica di dettaglio.

### File in Radice
- [PROJECT-PROFILE.md](PROJECT-PROFILE.md) — Profilo sintetico condiviso del progetto.
- [README.md](README.md) — Presentazione pubblica, funzionalità e setup rapido.

### Documenti di Struttura (`docs/`)
- [docs/1_CURRENT.md](docs/1_CURRENT.md) — Stato attuale, funzionalità già costruite e verificate.
- [docs/2_ROADMAP.md](docs/2_ROADMAP.md) — Sviluppi futuri e nuove funzionalità non ancora presenti.
- [docs/3_BACKLOG.md](docs/3_BACKLOG.md) — Bug, debito tecnico e refactoring su cose esistenti.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Mappa statica di architettura e flusso dati.
- [docs/INCEPTION_BRIEF.md](docs/INCEPTION_BRIEF.md) — Documento d'insieme di fondazione (problema, persone, MVP, pre-mortem e decisioni tecniche).
- [docs/VERSIONING.md](docs/VERSIONING.md) — Piano previsionale delle versioni e della roadmap SemVer fino all'MVP (1.0.0).

### Specifiche di Dettaglio (`docs/specs/`)
- [docs/specs/tieni-o-butta.md](docs/specs/tieni-o-butta.md) — Specifica indicatore "non vendere".
- [docs/specs/role-maker.md](docs/specs/role-maker.md) — Specifica randomizer di personalità.
- [docs/specs/condivisione-liste-link.md](docs/specs/condivisione-liste-link.md) — Specifica condivisione liste via link.
- [docs/specs/ottimizzazione-zustand.md](docs/specs/ottimizzazione-zustand.md) — Specifica selettori pure Zustand.
- [docs/specs/bugs/accessibilita-overlay-e-controlli.md](docs/specs/bugs/accessibilita-overlay-e-controlli.md) — Specifica bug A11y.
- [docs/specs/gameplay-tips-and-strategies.md](docs/specs/gameplay-tips-and-strategies.md) — Suggerimenti e strategie per la gestione delle risorse di gioco.

### Decisioni Architetturali (`docs/adrs/`)
- [docs/adrs/001-zustand-senza-middleware-persist.md](docs/adrs/001-zustand-senza-middleware-persist.md) — Rimoziome middleware persist nativo.
- [docs/adrs/002-astrazione-lista-generica.md](docs/adrs/002-astrazione-lista-generica.md) — Generalizzazione modello `List`.
- [docs/adrs/003-regola-direzione-drawer.md](docs/adrs/003-regola-direzione-drawer.md) — Regola direzione apertura `Drawer`.

