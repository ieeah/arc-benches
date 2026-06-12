# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # avvia il dev server (Vite HMR, serve sotto /arc-benches/)
npm run build     # type-check (tsc -b) + build produzione
npm run lint      # ESLint
npm run preview   # anteprima della build produzione

node scripts/fetch-items.mjs   # rigenera src/data/items.json da MetaForge
```

Il deploy è automatico su GitHub Pages a ogni push su `master` (`.github/workflows/deploy.yml`).
`vite.config.ts` ha `base: '/arc-benches/'` per questo motivo.

## Cos'è questo progetto

**ARC Benches** è una Web App Mobile-First (React + TypeScript + Vite + Tailwind v4) che funge da
Companion Tracker in italiano per il videogioco *ARC Raiders*: aggrega i costi di potenziamento dei
banchi del rifugio dal livello attuale a un livello obiettivo, traccia l'inventario e calcola quali
banchi sono potenziabili. Vedi `ROADMAP.md` per la direzione (multi-profilo → Supabase → nuove feature).

## Architettura

### Dati di gioco: file JSON statici, nessuna API a runtime

- **`src/data/items.json`** — fonte di verità per gli ID item (formato hyphen: `metal-parts`).
  Info per il rendering: nome, icona (CDN MetaForge), rarità, tipo. Rigenerabile con
  `scripts/fetch-items.mjs`, che legge gli ID da `data.txt` e interroga l'API MetaForge.
- **`src/data/workbenches.json`** — banchi, livelli e requisiti (`itemId` + `quantity`), compilato a mano.
  Ogni `itemId` DEVE esistere come chiave in `items.json`.
- **`data.txt`** — appunti grezzi originali con i requisiti; include l'info "can be crafted in refiner"
  non ancora usata nella UI.

Le API esterne (arcdata.mahcks.com, metaforge.app) si sono rivelate inaffidabili o con ID divergenti:
NON reintrodurre fetch a runtime; i dati di gioco cambiano solo a patch del gioco e si aggiornano via script.

### Stato: Zustand senza middleware + localStorage custom (`src/store.ts`)

Il middleware `persist` di zustand è stato rimosso deliberatamente (errori silenziosi di storage):
la persistenza è esplicita — `load()` all'init, `save()` chiamato in ogni action che modifica stato
persistito (`PersistedState`: hideoutLevels, targetLevels, activeModules, inventory,
filterHideCompleted, workbenchOrder). Ogni accesso a localStorage è in try/catch perché l'app può
girare in contesti dove è bloccato (iframe/preview): non deve mai crashare, al massimo non persiste.

Invarianti dello stato gestite nello store, non nella UI:
- target level sempre > current level: quando current raggiunge target, il target viene
  auto-promosso al livello successivo (clamp a maxLevel) — sia in `setModuleCurrentLevel` che in `upgradeModule`
- Scrappy parte dal livello 1 (`defaultHideoutLevels`), perché in gioco inizia sbloccato.
  Nella UI il "livello base" di un banco è derivato dai dati: livello 1 senza requisiti = parte sbloccato

I selettori (`getTotalRequiredMaterials`, `getMissingMaterials`, `getAvailableUpgrades`) sono funzioni
nello store che ricalcolano a ogni chiamata, non sono memoizzati.

### UI: tutta in `src/App.tsx`

Tre tab (Stash / Rifugio / Obiettivi) su stato locale. Componenti riutilizzabili definiti nello stesso
file: `SectionHeader` (theme toggle sempre più a destra), `ThemeToggle`, `LevelBadge` (Lvl x/y),
`LevelPills`, `InventoryCard`, `WorkbenchCard`, `SortableWorkbenchRow`.

- **Priorità banchi**: drag & drop (@dnd-kit) in Obiettivi, ordine persistito in `workbenchOrder`;
  determina l'ordine dei banchi in Rifugio E l'ordinamento "Priorità" dello Stash (ogni item prende
  la priorità del banco più prioritario che lo richiede)
- **Ordinamento Stash**: pill Priorità/A→Z/Rarità/Tipo; il click sul pill attivo inverte la direzione;
  persistito in localStorage (`stash-sort`)
- **Dark mode**: classe `dark` su `<html>`, `@custom-variant dark` in `index.css` (Tailwind v4),
  preferenza in localStorage (`theme`)
- **Mobile**: input numerici con `inputMode="numeric"` (tastiera numerica), long-press sui +/- per
  incremento rapido, TouchSensor dnd con delay 200ms per non confliggere con lo scroll

### Convenzioni

- ID item sempre hyphen-case (`arc-alloy`), mai underscore — gli underscore erano il formato della
  vecchia API e sono stati eliminati ovunque
- UI in italiano, "Lvl" (non "Lv") per i livelli
- Card con superellisse: `rounded-[24px]`/`rounded-[28px]`
