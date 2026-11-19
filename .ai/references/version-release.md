# Riferimento — ARC Benches

Da leggere insieme a `SKILL.md` quando si esegue il bump e il tag di una
versione su questo progetto.

## Fonte principale

Vedi `docs/VERSIONING.md` per il piano previsionale delle versioni e
`version-publish.md` (reference di questo stesso progetto) per il flusso
di pubblicazione a valle.

## Specifico per version-release

- **Manifest da bumpare**: `package.json`, campo `"version"` — unico
  manifest, nessun altro file duplica il numero di versione.
- **Convenzione tag**: prefisso `v` + SemVer, es. `v0.3.0` (non `0.3.0`
  senza prefisso).
- **Sequenza**: bump `package.json` → commit → tag `vX.Y.Z` → push (tag
  incluso) → poi `version-publish` per la GitHub Release. Il bump/tag non
  include da solo la pubblicazione delle note — sono due passi distinti
  coordinati in sequenza.
