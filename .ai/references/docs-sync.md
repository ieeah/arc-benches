# Riferimento — ARC Benches

Da leggere insieme a `SKILL.md` quando si verifica se la documentazione
riflette lo stato reale del progetto.

## Fonte principale

Vedi `AGENTS.md` nella root del repository, sezione "Struttura della
Documentazione (Layered-Docs)", per la mappa completa: file in radice
(`PROJECT-PROFILE.md`, `README.md`), `docs/1_CURRENT.md`,
`docs/2_ROADMAP.md`, `docs/3_BACKLOG.md`, `docs/ARCHITECTURE.md`,
`docs/INCEPTION_BRIEF.md`, `docs/VERSIONING.md`, `docs/specs/`,
`docs/adrs/`.

## Specifico per docs-sync

- **Ordine di verità, sempre in questa direzione**: 1) la codebase reale
  è l'unica fonte di verità; 2) in base allo stato della codebase si
  aggiornano le issue su GitHub; 3) solo dopo si aggiornano i file di
  documentazione locale (`docs/1_CURRENT.md`, ecc.). Non invertire mai
  l'ordine — non dedurre lo stato del codice da quanto scritto nella
  documentazione o nelle issue, il confronto va sempre fatto contro il
  codice.
