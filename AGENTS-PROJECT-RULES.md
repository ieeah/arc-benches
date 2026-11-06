# AGENTS-PROJECT-RULES

_Scritto per ARC Benches, ultimo aggiornamento 2026-11-06_
_Se cambi una regola, usa la data di oggi; se la leggi solo, non modificare la data._

Questo file contiene tutte le regole, convenzioni e vincoli vincolanti che gli agenti AI devono rispettare prima di qualunque operazione su questo progetto.

---

## 1. Repository, Git & Tracker

- **Autonomia dei Commit**: Non effettuare MAI commit in autonomia senza esplicita autorizzazione o richiesta diretta dell'utente. Quando si lavora a un task o una issue, le modifiche devono rimanere nel working tree come modifiche non committate per permettere la revisione manuale dell'utente.
- **Esecuzione di Lint e Build**: Non lanciare i comandi di linting (`npm run lint`) e build (`npm run build`) ad ogni singola modifica intermedia o di piccolo conto. Ha senso eseguirli solo in presenza di errori espliciti da indagare, oppure come validazione finale al completamento del task prima che l'utente effettui il commit.
- **Formato dei Commit**: Seguire lo standard Conventional Commits (`type: descrizione` o `type(scope): descrizione`), con eventuale riferimento all'issue o fase (es. `feat: aggiunge pill livello attuale (#7 Fase 2)`). Nessun riferimento a strumenti AI nei commit.
- **Tracker CLI (`gh`) — Divieto di testo lungo inline**: Titoli lunghi, descrizioni di issue e milestone, o corpi di note/commenti non vanno mai passati come argomenti shell inline (es. `--body "..."` o stringhe complesse) per prevenire problemi di escape, troncamenti o differenze tra shell (PowerShell/Bash/CMD).
  - Usare sempre un file temporaneo (JSON con `--input` o markdown con `--body-file`), eliminandolo subito a operazione conclusa.
  - Formati supportati con `gh api`:
    - Issue: `gh api -X POST "repos/{owner}/{repo}/issues" --input temp_issue.json` (campi `title`, `body`, `labels: [...]`) oppure `gh issue create --title "..." --body-file file.md`.
    - Milestone: `gh api -X POST "repos/{owner}/{repo}/milestones" --input temp_milestone.json` (campi `title`, `description`, `due_on` in formato ISO 8601).
    - Note/Commenti: `gh api -X POST "repos/{owner}/{repo}/issues/<N>/comments" --input temp_note.json` oppure `gh issue comment <N> --body-file file.md`.
  - Verifica obbligatoria: rieseguire una `GET` sulla risorsa creata tramite `gh api` prima di considerarla confermata.
- **Release notes**: Ogni `feat`/`fix`/`perf` che entra aggiunge o aggiorna una riga nella bozza `changelog/<prossima versione>.md` (sezione giusta; il lavoro non previsto in `docs/VERSIONING.md` va in «Aggiunte non pianificate»), così alla release le note sono complete. Non basta il commit: la riga si scrive contestualmente nello stesso intervento.

---

## 2. Gestione Lockfile & Dipendenze

- **Cross-platform lockfile**: I fallback WASM (`@emnapi/*`) servono alla CI Linux ma non a Windows; rigenerare il lockfile con `node_modules` preesistente potrebbe perderli e causare il fallimento di `npm ci` in CI (`EUSAGE`).
  - Dopo OGNI `npm install` che modifica il lockfile, esegui `npm run check:lock` prima del push.
  - Se fallisce, elimina SIA `node_modules` SIA `package-lock.json` e rilancia `npm install`.
  - Niente dipendenze con binding nativi pesanti (`sharp`, `esbuild` standalone, ecc.) nel `package.json` radice — vanno inserite esclusivamente in `scripts/package.json`.

---

## 3. Convenzioni Dati, Architettura & Codice

- **ID Oggetti**: Gli ID degli oggetti usano sempre la notazione hyphen-case (`metal-parts`), mai underscore.
- **Modern Web Guidance**: Prima di scrivere o modificare HTML/CSS/JS lato client (dialog, layout, animazioni, performance, form), cerca la guida pertinente con la skill `modern-web-guidance`.
- **Stile del Codice**: Rispetta le linee guida formalizzate in `docs/STYLE_GUIDE.md` (convenzioni naming, formatting, pattern architetturali).
- **Riutilizzo Componenti e Composizione**: Cercare sempre di riutilizzare i componenti già esistenti nel progetto (`src/components/`), ricorrendo a composizione o derivazioni quando sensato invece di ricostruire varianti isolate o duplicare logica UI/comportamentale da zero.
- **Stato e Persistenza**: Gestione dello stato tramite Zustand con slice per dominio; la persistenza in `localStorage` avviene tramite wrapper custom `safeLS` (non middleware persist nativo di Zustand, vedi ADR 001).
- **TypeScript: sempre `type`, mai `interface`**: Utilizzare tassativamente `type` (e mai `interface`) per la definizione di modelli, DTO, tipi di stato e props dei componenti.
- **Modularità Obbligatoria delle Feature (`isSectionActive`)**: Per qualsiasi nuova funzionalità, pagina o strumento introdotto nella codebase, l'agente deve verificare preventivamente a quale macro-modulo o sotto-modulo appartenga, o se richieda un proprio modulo dedicato. È obbligatorio implementare sempre tutti i relativi controlli ed "interruttori" su quattro livelli:
  1. *Gating di Sistema*: aggancio a un eventuale `systemFlag` (`featureFlags.json`) per funzioni non ancora pronte in produzione.
  2. *Stato del Profilo*: registrazione dell'ID sezione in `enabledSections` del `PersistedState` con persistenza e default.
  3. *Funzione Unica `isSectionActive(sectionId)`*: utilizzata ovunque al posto di controlli sparsi (selettori materiali/fabbisogni, aggregatori liste, guardie di routing `App.tsx` con redirect a `#/stash`, e filtri di navigazione `useNavTree`).
  4. *Impostazioni Profilo*: presenza del toggle (master switch o sotto-modulo indentato) in `SettingsPage.tsx` con titolo, descrizione e icona localizzati (e card visibili con toggle attivo e disabilitato per le sezioni Core).
  Nessuna nuova sezione opzionale può essere aggiunta senza il corrispondente interruttore per-profilo.

---

## 4. Interfaccia Utente (UI)

- **Lingua UI**: Tutta l'interfaccia utente è rigorosamente in italiano.
- **Abbreviazione Livelli**: Utilizzare sempre **"Lvl"** (mai "Lv" o "Lvl.").
- **Superellissi**: Card e contenitori principali utilizzano raggio di curvatura `rounded-[24px]` o `rounded-[28px]`.
- **Direzione dei Drawer**: Un drawer deve aprirsi sempre dal lato del pulsante trigger (trigger in alto → `from="top"`, trigger in basso → `from="bottom"`).
- **Mobile-First & Touch-First**: Tutte le interfacce utente devono essere progettate prioritariamente per l'uso da smartphone e con il tocco del pollice. Aree di tocco minime generose (minimo 44×44px), feedback all'interazione (`active:scale-95`), leggibilità e contrasto elevato al buio, e preferenza per gesti a tocco singolo per le azioni frequenti prima ancora che al mouse e tastiera.

---

## 5. Documentazione (Layered Docs)

- **Struttura**: Il progetto adotta la convenzione layered-docs:
  - File sintetici in radice per la contestualizzazione rapida (`AGENTS.md`, `PROJECT-PROFILE.md`, `README.md`).
  - Documenti tecnici strutturali e di dettaglio in `docs/` (`1_CURRENT.md`, `2_ROADMAP.md`, `3_BACKLOG.md`, `ARCHITECTURE.md`, `VERSIONING.md`, `specs/`, `adrs/`).
- **Allineamento costante**: Quando si introducono nuove feature o modifiche architetturali, aggiornare la specifica pertinente in `docs/specs/` o l'ADR in `docs/adrs/`.

---

## 6. Cosa l'agente NON deve fare

- Non effettuare commit o push senza richiesta esplicita.
- Non eseguire build/lint a ogni singolo file modificato se non richiesto o al termine del task.
- Non inserire riferimenti a strumenti AI o prompt nei messaggi di commit o changelog.
- Non passare argomenti testo lunghi inline con il comando CLI `gh`.
- Non installare dipendenze native pesanti nel package radice.
