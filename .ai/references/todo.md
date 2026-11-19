# Riferimento — ARC Benches

Da leggere insieme a `SKILL.md` quando si crea o organizza un elemento di
todo/roadmap/backlog su questo progetto.

## Fonte principale

Vedi `AGENTS.md` nella root del repository, sezione "Struttura della
Documentazione (Layered-Docs)" — `docs/2_ROADMAP.md` e `docs/3_BACKLOG.md`
sono già la struttura standard, nessuna deviazione.

## Specifico per todo

- **Ogni nuova issue va creata via `gh` CLI**, mai solo come voce di testo
  in `docs/2_ROADMAP.md`/`docs/3_BACKLOG.md` — quei file restano la vista
  di pianificazione, ma l'issue reale vive su GitHub.
- **Assegnazione obbligatoria per default**: ogni issue creata va
  assegnata all'utente (`--assignee @me`) e a una milestone
  (`--milestone <nome>`), a meno che non sia stato esplicitamente chiesto
  di ometterle per quel caso specifico.
- **Sotto-issue vere, non solo elenco puntato nel corpo**: quando un task
  complesso si scompone in sotto-task, ciascuno va creato come issue
  separata via CLI e collegato come sotto-issue della issue padre (non
  semplicemente elencato come checklist testuale dentro il corpo di
  un'unica issue).
