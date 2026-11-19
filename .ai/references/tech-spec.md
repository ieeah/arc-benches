# Riferimento — ARC Benches

Da leggere insieme a `SKILL.md` quando si pianifica un intervento tecnico
non banale su questo progetto.

## Fonte principale

Vedi `PROJECT-PROFILE.md` e `AGENTS.md` nella root del repository,
sezione "Struttura della Documentazione (Layered-Docs)".

## Specifico per tech-spec

- **Dove salva l'output**: `docs/specs/<nome-feature>.md`, allineato
  alla convenzione layered-docs già in uso (vedi `docs/specs/progetti.md`,
  `docs/specs/spedizioni.md` come esempi di formato).
- **Layer architetturali da mappare nel piano** (stessa tabella di
  `do-task.md`):
  | Layer | Percorso |
  |---|---|
  | Modello / Tipi | `src/types/` |
  | Validazione & Lib | `src/lib/`, `src/utils/` |
  | Store & Stato | `src/store/`, `src/store/slices/` |
  | Dati statici | `src/data/items.json`, `scripts/` |
  | UI & Componenti | `src/components/` |
  | Pagine & Routing | `src/pages/` |
- Decisioni architetturali che emergono durante la stesura vanno proposte
  come nuovo file in `docs/adrs/`, non incorporate nella spec.
