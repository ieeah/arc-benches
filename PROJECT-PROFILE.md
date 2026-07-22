# Profilo progetto — ARC Benches

## Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS v4
- **State Management**: Zustand (slice per dominio, persistenza localStorage custom `safeLS`)
- **Utility / Tooling**: ESLint, `@dnd-kit` (drag & drop), Node.js (scripts di sincronizzazione dati con MetaForge API)
- **Deployment**: GitHub Pages (workflow automatico via `.github/workflows/deploy.yml`)

## Tracker
- **GitHub Issues** (riferimenti `#<numero>` nei commit)

## Convenzioni di commit
- **Conventional Commits**: `type: descrizione` (es. `feat: ...`, `fix: ...`, `docs: ...`, `perf: ...`, `refactor: ...`), con opzionale riferimento alla fase/issue (es. `feat: sostituisce bottom nav con pillola flottante (#7 Fase 2)`).

## Artifact di lavoro
- File markdown di analisi/roadmap in root (`ANALISI.md`, `ROADMAP.md`) e piani di dettaglio in `docs/` (es. `docs/zustand-optimization-plan.md`).

## Contesto
- **Progetto personale**: sviluppato come Companion Tracker mobile-first in italiano per *ARC Raiders*.

## Documentazione
- **Layered docs / Ibrido**: `README.md` (overview), `CLAUDE.md` (regole di architettura e comandi), `ROADMAP.md` (pianificazione), `ANALISI.md` (analisi iniziale) in root + spec/piani tecnici dettagliati in `docs/`.
