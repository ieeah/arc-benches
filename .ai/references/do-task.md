# Riferimento — Arc Benches

Da leggere insieme a `SKILL.md` quando si avvia l'analisi e la presa in carico di un task/issue su questo progetto.

## Fonte principale

Stack tecnico (React 19, TypeScript, Zustand con `safeLS`, Tailwind v4, Vite), convenzioni (`type` invece di `interface`, divieto di parametri inline lunghi su PowerShell CLI) e documentazione a livelli (`1_CURRENT.md`, `2_ROADMAP.md`, `specs/`, `adrs/`) sono documentati nelle regole di progetto e nella documentazione in `docs/` — leggili prima di procedere.

## Specifico per do-task

### Passo 0 — Sonda e Branch
- **Branch di lavoro**: se l'intervento richiede un branch dedicato, proponi il naming secondo il pattern del repository (es. `feature/<numero>-<slug>` o `fix/<numero>-<slug>`). Mai crearlo senza conferma.

### Passo 1 — Requisiti & Tracker (GitHub Issues)
- **Tracker**: GitHub Issues (identificati dal formato `#<numero>`, es. `#42`).
- **Recupero specifica**: recupera l'issue tramite GitHub CLI (`gh issue view <id> --json title,body,labels,assignees,milestone`).
- **Formalità preliminari**: prima di procedere, verifica che la issue sia assegnata all'utente (`--assignee @me`) e collegata alla milestone corretta (`--milestone <nome>`), secondo la stessa convenzione di `todo.md`. Se incompleta, segnalalo e proponi di sistemarla via `gh` prima di avviare l'analisi.
- **PowerShell / CLI safety**: mai passare testi lunghi o con backtick come argomenti inline di `gh` (rischio di espansione di variabili PowerShell o corruzione di caratteri). Usa file temporanei o piping stdin quando necessario.

### Multi-Issue & Riorganizzazione Bottom-Up
Quando l'intervento coinvolge più issue correlate o una gerarchia con sotto-issue (≥ 3 task interdipendenti), non pianificare nell'ordine casuale delle issue ma proponi una **riorganizzazione bottom-up**:
1. **Livello 0 (Modello & Dati)**: `src/types/`, `src/data/items.json`, schemi `src/lib/validate.ts`, `scripts/`
2. **Livello 1 (Stato & Business Logic)**: Slice Zustand in `src/store/slices/`, selettori, calcoli in `src/lib/` o `src/utils/`
3. **Livello 2 (Componenti UI & primitive grafiche)**: Componenti atomici, drawer, modali in `src/components/`
4. **Livello 3 (Pagine & orchestrazione)**: `src/pages/`, viste composite e integrazione dei flussi

Regole per il piano multi-issue:
- **Piano unificato**: sequenza ordinata bottom-up, etichettando ogni step con l'issue o sotto-issue di appartenenza (es. `Step 1 [Issue #42]: Creazione tipi e validatori`).
- **Commit atomici**: ogni commit cita esclusivamente l'issue di pertinenza (es. `feat(store): aggiunge slice spedizioni (#17)`).
- **Chiusura separata**: chiudi ciascuna issue singolarmente a fine lavoro tramite `chiudi-issue`.

### Passo 2 — Ricognizione Codebase, Layer & Persistenza

#### Layer architetturali da ispezionare
| Layer | Percorso | Cosa cercare |
|---|---|---|
| Modello / Tipi | `src/types/` | Definizioni TypeScript (`type` strictly, no `interface`), contratti di dominio |
| Validazione & Lib | `src/lib/`, `src/utils/` | Schemi `validate.ts`, calcoli, helper di dominio |
| Store & Stato | `src/store/`, `src/store/slices/` | Slice Zustand, persistenza (`safeLS`), selettori |
| Dati statici | `src/data/items.json`, `scripts/` | Catalogo oggetti, script di sincronizzazione MetaForge |
| UI & Componenti | `src/components/` | Componenti React, drawer (`from="top"` / `from="bottom"`), card |
| Pagine & Routing | `src/pages/` | Viste principali dell'applicazione |
| Documentazione | `docs/` | Layered docs (`1_CURRENT.md`, `2_ROADMAP.md`, `specs/`, `adrs/`) |

#### Ricognizione Dati / Stato (Non bloccante)
- **Assetto Client-side / statico**: l'ispezione dei dati è **completamente autonoma e non bloccante**. Non richiedere query SQL o conferme all'utente per consultare i dati: ispeziona direttamente `src/data/items.json`, i tipi in `src/types/`, gli schemi in `src/lib/validate.ts` e le slice dello store con gli appositi tool di lettura.
- **Evoluzione futura**: se l'issue tocca dati persistiti su backend remoto (es. PostgreSQL/Supabase), ispeziona schemi e migrazioni.

### Passo 3 — Dubbi & Piano
- **Dubbi bloccanti per l'analisi**: risolvili subito con l'utente in chat.
- **Task ordinari**: piano operativo sintetico presentato direttamente nella chat.
- **Task complessi / Epic**: se l'intervento richiede una specifica tecnica approfondita prima di scrivere codice, proponi formalmente `tech-spec`, salvando la specifica in `docs/specs/<nome-feature>.md`.

### Passo 4 — Materializzazione Artifact & Tracker
- **Abolizione artifact effimeri su disco**: non creare cartelle `_artifacts/<id>/` né file su disco come `analisi.md`, `onboarding.md` o `dubbi.md`. L'analisi e il piano vivono nell'output della chat. Tutto il materiale persistente deve risiedere nei `docs/` ufficiali (`docs/specs/`, `docs/adrs/`, ecc.).
- **Nessun commento di piano su GitHub all'avvio**: non proporre di postare il piano preliminare come commento su GitHub Issues (il consuntivo reale verrà pubblicato alla chiusura tramite `chiudi-issue`).
  - *Eccezione*: consentito commentare solo in caso di dubbi bloccanti o decisioni aperte che richiedono tracciamento asincrono sul ticket. In tal caso, per evitare corruzione da backtick o virgolette in PowerShell, usa sempre:
    ```powershell
    gh issue comment <id> --body-file path/to/scratch_comment.md
    ```

### Lingua
Tutti i documenti e le interazioni in chat con l'utente vanno scritti in **italiano**.
