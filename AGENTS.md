# AGENTS.md

Questo file fornisce le linee guida e le regole operative per gli Agenti AI che lavorano su **ARC Benches**.

---

## 🚀 Comandi Rapidi

```bash
npm run dev        # Avvia il dev server (Vite HMR, base path /arc-benches/)
npm run build      # Type-check (tsc -b) + build di produzione
npm run lint       # ESLint
npm run preview    # Anteprima della build di produzione
npm run check:lock # Verifica che package-lock.json sia in sync (stesso check di npm ci in CI)

# Script dati (pacchetto separato in scripts/):
cd scripts && npm install && node fetch-items.mjs   # Rigenera items.json + icone da MetaForge
```

> ⚠️ **Gestione Lockfile (Bug npm cross-platform)**:
> I fallback WASM (`@emnapi/*`) servono alla CI Linux ma non a Windows; rigenerare il lockfile con `node_modules` preesistente potrebbe perderli e causare il fallimento di `npm ci` in CI (`EUSAGE`).
> **Regole**:
> 1. Dopo OGNI `npm install` che modifica il lockfile, esegui `npm run check:lock` prima del push.
> 2. Se fallisce, elimina SIA `node_modules` SIA `package-lock.json` e rilancia `npm install`.
> 3. Niente dipendenze con binding nativi pesanti (`sharp`, `esbuild` standalone, ecc.) nel `package.json` radice — vanno inserite esclusivamente in `scripts/package.json`.

---

## 🛠 Cos'è questo Progetto

**ARC Benches** è un Companion Tracker mobile-first (React 19 + TypeScript + Vite + Tailwind CSS v4) in italiano per il videogioco *ARC Raiders*.
Aggrega i costi di potenziamento dei banchi del rifugio dal livello attuale al livello obiettivo, traccia l'inventario, e calcola in tempo reale i materiali mancanti e i potenziamenti disponibili.

Per dettagli sul contesto generale, tracker ed estensioni consulta [PROJECT-PROFILE.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/PROJECT-PROFILE.md).

---

## 📐 Convenzioni e Regole di Progetto

- **Commit**: Segui lo standard Conventional Commits (`type: descrizione` o `type(scope): descrizione`), con eventuale riferimento all'issue o fase (es. `feat: aggiunge pill livello attuale (#7 Fase 2)`). Nessun riferimento a strumenti AI nei commit.
- **ID Oggetti**: Gli ID degli oggetti usano sempre la notazione hyphen-case (`metal-parts`), mai underscore.
- **Interfaccia Utente (UI)**:
  - Lingua della UI in italiano.
  - Abbreviazione livelli: utilizzare sempre **"Lvl"** (non "Lv" o "Lvl.").
  - Card con superellisse: `rounded-[24px]` o `rounded-[28px]`.
  - **Direzione dei Drawer**: Un drawer deve aprirsi sempre dal lato del pulsante trigger (trigger in alto → `from="top"`, trigger in basso → `from="bottom"`).

---

## 📚 Struttura della Documentazione (Layered-Docs)

Il progetto adotta la convenzione **layered-docs**: file sintetici in radice per la contestualizzazione rapida + cartella `docs/` per la documentazione tecnica di dettaglio.

### File in Radice
- [PROJECT-PROFILE.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/PROJECT-PROFILE.md) — Profilo sintetico condiviso del progetto.
- [README.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/README.md) — Presentazione pubblica, funzionalità e setup rapido.
- [ROADMAP.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/ROADMAP.md) — Roadmap di prodotto, stato delle fasi (Fase 0/1 completate, Fase 2 Supabase, Fase 3 nuove feature).

### Documenti Tecnici di Dettaglio (`docs/`)
- [docs/architecture/state-management.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/architecture/state-management.md) — Architettura Zustand, persistenza custom `safeLS`, modello `List` ed invarianti di stato.
- [docs/architecture/data-pipeline.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/architecture/data-pipeline.md) — Catalogo statico `items.json`, `workbenches.json`, script `fetch-items.mjs` e integrazione MetaForge API.
- [docs/architecture/ui-patterns.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/architecture/ui-patterns.md) — Architettura UI mobile-first, componenti presentazionali, gestione del tema ed elementi fissi.
- [docs/plans/zustand-optimization-plan.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/plans/zustand-optimization-plan.md) — Piano ed esecuzione dell'ottimizzazione Zustand (selettori e memoizzazione).
- [docs/plans/analisi-iniziale.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/plans/analisi-iniziale.md) — Analisi funzionale e requisiti storici iniziali del progetto.
