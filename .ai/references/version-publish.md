# Riferimento — ARC Benches

Da leggere insieme a `SKILL.md` quando si pubblica una GitHub Release
per un tag di versione su questo progetto.

## Fonte principale

Vedi `docs/VERSIONING.md` per il piano previsionale delle versioni e i
codename già assegnati, e `changelog.md` (reference di questo stesso
progetto) per la generazione delle note.

## Specifico per version-publish

- **Solo GitHub Release** — nessuna pubblicazione GitLab.
- **Flusso formalizzato** (finora fatto in modo informale, da questo
  momento standard):
  1. `a11y-review` sulla milestone/versione in chiusura, prima di
     taggare.
  2. `changelog` genera le note nel formato già in uso (vedi
     `changelog.md`).
  3. `gh release create <tag> --title "<titolo>" --notes-file
     <path-file>` con il body prodotto — sempre `--notes-file`, mai
     `--notes` inline, stessa regola di `--body-file` per i commenti
     issue (vedi `chiudi-issue.md`).
- **Titolo release**: formato `vX.Y.Z - <Codename>` — il codename non va
  inventato qui, è già assegnato per ogni versione in
  `docs/VERSIONING.md` (es. `0.3.0: "Banco da Lavoro"`).
- **Corpo delle note**: intro in prosa (1 paragrafo, riassume il salto
  della versione) seguita da sezioni con heading emoji raggruppate per
  tipo (es. "🚀 Nuove funzionalità", "🛠️ Solidità Architetturale &
  Performance", "🐛 Correzioni & Accessibilità"), ogni voce con
  riferimento `(#N)` alla issue — vedi
  `https://github.com/ieeah/arc-benches/releases/tag/v0.3.0` come
  esempio concreto del formato già usato.
