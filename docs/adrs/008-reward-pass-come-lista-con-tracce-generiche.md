# ADR 008 — Reward Pass come lista con tracce generiche

* **Stato**: bozza. Dettaglio e decisioni: [reward-pass-tech-spec.md](../specs/reward-pass-tech-spec.md) (D1, D9, D11)

## Contesto
Il Reward Pass ha livelli con ricompense su più tracce (free, premium, legacy…), che cambiano da stagione a stagione.

## Decisione
Il pass è una `List` con `listType: 'pass'`; le tracce sono dati (`tracks`) e ogni ricompensa porta la sua traccia (`Reward.track`). Le ricompense sono sempre oggetti del catalogo (gli oggetti sintetici, come i pezzi di outfit, sono oggetti custom). Il livello raggiunto riusa `currentLevels[passId]`; il pass attivo è uno solo per profilo (`activeRewardPass`).

## Conseguenze
- Riusa editor Dev, ordinamento, import/export e cestino delle liste.
- La regola del cambio del pass attivo è in revisione: #112.
