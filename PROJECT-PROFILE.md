# Profilo progetto — ARC Benches

## Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **State Management**: Zustand (slice per dominio, persistenza localStorage custom `safeLS`)
- **Utility / Tooling**: ESLint, `@dnd-kit` (drag & drop), Node.js (scripts di sincronizzazione dati con MetaForge API)
- **Deployment**: GitHub Pages (workflow automatico via `.github/workflows/deploy.yml`)

## Tracker
- **GitHub Issues** (riferimenti `#<numero>` nei commit)

## Convenzioni di commit
- **Conventional Commits**: `type: descrizione` o `type(scope): descrizione` (es. `feat: ...`, `fix: ...`, `docs: ...`, `perf: ...`, `refactor: ...`), con opzionale riferimento alla fase/issue (es. `feat: aggiunge pill livello attuale (#7 Fase 2)`). Nessun riferimento a strumenti AI.

## Artifact di lavoro
- File markdown in radice (`PROJECT-PROFILE.md`, `README.md`, `AGENTS.md`) e documenti di dettaglio/pianificazione in `docs/` (es. `docs/1_CURRENT.md`, `docs/2_ROADMAP.md`, `docs/3_BACKLOG.md`).

## Contesto
- **Progetto personale**: sviluppato come Companion Tracker mobile-first in italiano per *ARC Raiders*. Aggrega i costi di potenziamento dei banchi del rifugio, traccia l'inventario e calcola i materiali mancanti in tempo reale.

## Stile del codice
- **Formalizzato in**: [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) (convenzioni estratte: naming, formatting, pattern architetturali).

## Documentazione
- **Layered Docs**: adottata convenzione con file in radice per il contesto rapido (`AGENTS.md`, `PROJECT-PROFILE.md`) e cartella `docs/` divisa in documenti di struttura (`1_CURRENT.md`, `2_ROADMAP.md`, ecc.), specifiche (`docs/specs/`) e decisioni architetturali (`docs/adrs/`).

