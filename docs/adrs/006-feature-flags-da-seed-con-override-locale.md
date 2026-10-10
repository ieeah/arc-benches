# ADR 006 — Feature flag da seed con override locale

* **Stato**: bozza (senza alternative considerate: da aggiungere se emergono)

## Contesto
Moduli in lavorazione (Reward Pass, Mappe tattiche, Spedizioni…) devono poter stare nel codice distribuito senza essere visibili agli utenti, ed essere accesi per provarli.

## Decisione
Un flag per modulo, definito in [featureFlags.ts](../../src/lib/featureFlags.ts), con valore di partenza in `src/data/feature-flags.json` e override salvato nel browser (`arc_benches_feature_flags_v1`, non per profilo). Un flag spento nasconde le voci di menu (`navIds`) e le rotte (`routes`) del modulo. Il seed si modifica dalla pagina Dev dei flag.

## Conseguenze
- Si può pubblicare lavoro incompleto dietro un flag spento.
- L'override è per browser, non per profilo né sincronizzato.
- #102 prevede moduli attivabili dall'utente per profilo, che estenderebbe questo meccanismo.
