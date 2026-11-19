# Riferimento — ARC Benches

Da leggere insieme a `SKILL.md` durante il ciclo di commit su questo progetto.

## Fonte principale

Vedi `PROJECT-PROFILE.md` e `AGENTS.md` nella root del repository per convenzioni generali e divieto di attribuzioni AI.

## Specifico per commit

### Step 1 — Raggruppamento (Grouping)
- **Granularità bottom-up per livello architetturale**: quando la modifica attraversa più livelli, proponi un commit per livello:
  1. *Livello 0 — Modello & Dati*: `src/types/`, `src/data/items.json`, `src/lib/validate.ts`, `scripts/`
  2. *Livello 1 — Stato & Business Logic*: `src/store/slices/`, selettori, `src/lib/`, `src/utils/`
  3. *Livello 2 — Componenti UI*: `src/components/`
  4. *Livello 3 — Pagine & Orchestrazione*: `src/pages/`
- **`scripts/` sempre in commit separato**: pacchetto npm indipendente con proprio `package.json`, non accorpare mai con modifiche sotto `src/`.
- **Un commit per issue**: non accumulare modifiche su issue diverse nello stesso commit.

### Step 2 — Messaggio (Message)
- **Lingua**: italiano.
- **Scope tra parentesi**: libero per dominio/feature (es. `store`, `ui`, `data`, `spedizioni`).
- **Riferimento issue obbligatorio a fine riga**: quando il commit è legato a una issue esistente, chiudi la riga con `(#<numero> Fase <fase>)` (es. `feat(ui): aggiunge pill livello attuale (#7 Fase 2)`).

### Step 3 — Guardia Pre-Commit (Guard)
- **`scripts/node_modules`**: mai in stage.
- **Nessuna dipendenza nativa pesante** nel `package.json` di root (es. `sharp`, `esbuild` standalone vanno in `scripts/package.json`).
- **Verifica Lockfile**: se `package-lock.json` è modificato, segnala all'utente di eseguire `npm run check:lock` prima del push per prevenire la perdita dei fallback WASM in CI Linux.

### Regole generali del flusso
- **Nessun commit in autonomia**: richiedi sempre la conferma esplicita dell'utente prima di eseguire il comando.
- **Niente lint/build continui**: non lanciare `npm run lint`/`build` prima di ogni singolo step intermedio di una sequenza, solo come validazione finale.
