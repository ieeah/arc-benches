# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # avvia il dev server (Vite HMR, serve sotto /arc-benches/)
npm run build      # type-check (tsc -b) + build produzione
npm run lint       # ESLint
npm run preview    # anteprima della build produzione
npm run check:lock # verifica che package-lock.json sia in sync (stesso check di npm ci in CI)

# Script dati (pacchetto separato, ha le sue dipendenze — sharp NON va nel progetto principale):
cd scripts && npm install && node fetch-items.mjs   # rigenera items.json + icone da MetaForge
```

Il deploy è automatico su GitHub Pages a ogni push su `master` (`.github/workflows/deploy.yml`).
`vite.config.ts` ha `base: '/arc-benches/'` per questo motivo.

**ATTENZIONE lockfile (bug npm cross-platform)**: i fallback WASM (`@emnapi/*`) servono alla CI
Linux ma non a Windows; rigenerare il lock con `node_modules` preesistente li perde e `npm ci` in
CI fallisce con EUSAGE. Regole: (1) dopo OGNI `npm install` che tocca il lock, esegui
`npm run check:lock` prima di pushare; (2) se fallisce, elimina SIA `node_modules` SIA
`package-lock.json` e rilancia `npm install`; (3) niente dipendenze con molti binding nativi
(sharp, esbuild standalone, ecc.) nel package.json principale — vanno in `scripts/package.json`.

## Cos'è questo progetto

**ARC Benches** è una Web App Mobile-First (React + TypeScript + Vite + Tailwind v4) che funge da
Companion Tracker in italiano per il videogioco *ARC Raiders*: aggrega i costi di potenziamento dei
banchi del rifugio dal livello attuale a un livello obiettivo, traccia l'inventario e calcola quali
banchi sono potenziabili. Vedi `ROADMAP.md` per la direzione (multi-profilo → Supabase → nuove feature).

## Architettura

### Dati di gioco: file JSON statici, nessuna API a runtime

- **`src/data/items.json`** — fonte di verità per gli ID item (formato hyphen: `metal-parts`).
  Contiene l'**intero catalogo MetaForge** (~590 item), non solo quelli usati dai banchi: serve
  all'item picker delle liste custom. Info per il rendering: nome, icona (locale), rarità, tipo.
  Rigenerabile con `scripts/fetch-items.mjs`, che pagina tutto il catalogo dall'API MetaForge,
  scarica+ottimizza le icone in `public/icons/items` e verifica che ogni `itemId` dei banchi esista.
  Il catalogo grezzo completo (tutti i campi, non trimmato) è cachato in `scripts/metaforge-raw.json`
  (gitignorato): re-run lo riusano; `--refresh` forza il re-fetch. Tienilo se un giorno serve
  esporre più campi (stat_block, sources, …) senza riscaricare.
- **`src/data/workbenches.json`** — banchi, livelli e requisiti (`itemId` + `quantity`), compilato a mano.
  Ogni `itemId` DEVE esistere come chiave in `items.json`.

Il campo `workbench` di `items.json` ("Refiner" / "Refiner II") indica dove un item si può craftare:
la UI lo incrocia col livello attuale del Refiner dell'utente per mostrare badge "craftabile ora"
(verde) o "richiede Refiner Lvl 2" (ambra) — vedi `refinerCraftLevel()` in `App.tsx`.

Le API esterne (arcdata.mahcks.com, metaforge.app) si sono rivelate inaffidabili o con ID divergenti:
NON reintrodurre fetch a runtime; i dati di gioco cambiano solo a patch del gioco e si aggiornano via script.

### Stato: Zustand senza middleware + localStorage custom (`src/store.ts`)

Il middleware `persist` di zustand è stato rimosso deliberatamente (errori silenziosi di storage):
la persistenza è esplicita — `load()` all'init, `save()` chiamato in ogni action che modifica stato
persistito (`PersistedState`: hideoutLevels, targetLevels, activeModules, inventory,
filterHideCompleted, listOrder, customLists). `save()` fa il **pick esplicito** delle sole chiavi
persistite: i call site passano `{...s, override}` ma il game seed (`workbenches`, `itemsInfo`) NON
finisce mai in localStorage. Ogni accesso a localStorage è in try/catch perché l'app può
girare in contesti dove è bloccato (iframe/preview): non deve mai crashare, al massimo non persiste.

Invarianti dello stato gestite nello store, non nella UI:
- target level sempre > current level: quando current raggiunge target, il target viene
  auto-promosso al livello successivo (clamp a maxLevel) — sia in `setModuleCurrentLevel` che in `upgradeModule`
- alzare il livello dai pill (Obiettivi) scala automaticamente i materiali tracciati
  dall'inventario (`setModuleCurrentLevel(…, deductMaterials)`): alzare il livello implica che il
  potenziamento è stato pagato in gioco (i materiali non tracciati sono stati trovati e spesi:
  saldo zero). La UI chiede conferma SOLO in caso di conflitto — un materiale posseduto che serve
  anche agli obiettivi di altri banchi attivi potrebbe essere riservato a quelli
  (`getTotalRequiredMaterials(excludeModuleId)` per il fabbisogno degli altri).
  Abbassare un livello non rimborsa mai. Il bottone verde in Rifugio (`upgradeModule`) scala sempre
- Scrappy parte dal livello 1 (`defaultHideoutLevels`), perché in gioco inizia sbloccato.
  Nella UI il "livello base" di un banco è derivato dai dati: livello 1 senza requisiti = parte sbloccato

I selettori (`getTotalRequiredMaterials`, `getMissingMaterials`, `getAvailableUpgrades`) sono funzioni
nello store che ricalcolano a ogni chiamata, non sono memoizzati.

**Modello `List`**: il tipo generico è `List` (in `types.ts`); i banchi del gioco ne sono il seed
read-only (`listType: 'workbench'`), le liste custom sono istanze utente. Una lista custom ha `id`
namespaced (`custom:<uuid>`), `custom: true` e `listType`. È tenuta in una slice persistita
`customLists` SEPARATA dall'array game `workbenches` (preserva "dati di gioco mai persistiti" e rende
lineare la futura migrazione a DB). Il selettore `getAllLists()` fa l'union `[...workbenches,
...customLists]` ed è la base su cui operano TUTTI gli altri selettori e azioni (`upgradeModule`,
`setModuleCurrentLevel`, `getOrderedLists`, …) → le liste custom ereditano gratis aggregazione
spesa, mancanti, priorità Stash, drag, "Completati", bottone verde Rifugio. CRUD: `createCustomList`
/ `updateCustomList` / `deleteCustomList` (init/cleanup delle voci per-id in hideoutLevels/targetLevels/
activeModules/listOrder). Editor: `CustomListEditor` + `ItemPicker` (ricerca sul catalogo
completo); entry point "+ Lista" in Obiettivi, badge "Custom" e matita di modifica su `ListRow`.
Le card generiche (`ListRow`, `ListCard`, `SortableListRow`) prendono la lista via prop `list`.

### UI: struttura a moduli

```
src/
  App.tsx          solo shell: stato tab + bottom nav (ThemeProvider wrappa tutto)
  pages/           StashPage, HideoutPage (Rifugio), GoalsPage (Obiettivi), ItemsPage (Oggetti)
  components/      presentazionali, riusabili (IconButton, ThemeToggle, SectionHeader, TabButton,
                   LevelBadge, LevelPills, InventoryCard, ListRow, ListCard, SortableListRow,
                   ItemDetailSheet, ItemPicker, CustomListEditor)
  context/         ThemeContext (hook) + ThemeProvider (componente) — file separati per react-refresh
  hooks/           useLongPress
  lib/             safeStorage (safeLS), rarity, craft (refinerCraftLevel)
```

Regole architetturali:
- **Le pagine** parlano direttamente con `useAppStore`; **i componenti** ricevono tutto via props
  (presentazionali) — niente store nei componenti
- **Elementi universali in posizione fissa**: `SectionHeader` rende theme toggle sempre più a destra,
  pulsante Database (prop `onOpenDatabase`) sempre accanto; le azioni specifiche del tab (prop
  `actions`) si aggiungono a sinistra. Non posizionare mai questi elementi a mano nelle pagine
- Il tema è un Context: i componenti lo consumano da soli, non va passato via props
- "Oggetti" è una pagina nascosta (non nella bottom nav, in futuro hub "Database" con Oggetti/Arcs/…).
  Dalle card dello Stash NON si naviga al dettaglio oggetto (scelta deliberata: su mobile
  confliggerebbe coi controlli +/-)
- L'ordinamento per priorità delle liste è logica di dominio → selettore `getOrderedLists()`
  nello store, non duplicato nelle pagine

- **Priorità liste**: drag & drop (@dnd-kit) in Obiettivi, ordine persistito in `listOrder`;
  determina l'ordine dei banchi in Rifugio E l'ordinamento "Priorità" dello Stash (ogni item prende
  la priorità del banco più prioritario che lo richiede)
- **Ordinamento Stash**: pill Priorità/A→Z/Rarità/Tipo; il click sul pill attivo inverte la direzione;
  persistito in localStorage (`stash-sort`)
- **Dark mode**: classe `dark` su `<html>`, `@custom-variant dark` in `index.css` (Tailwind v4),
  preferenza in localStorage (`theme`)
- **Mobile**: input numerici con `inputMode="numeric"` (tastiera numerica), long-press sui +/- per
  incremento rapido, TouchSensor dnd con delay 200ms per non confliggere con lo scroll
- **Direzione dei Drawer**: un `Drawer` si apre SEMPRE dal lato del pulsante che lo attiva — pulsante
  in alto → `from="top"`, in basso → `from="bottom"`. Le direzioni laterali (`left`/`right`) sono già
  supportate da `Drawer` e vanno usate quando il trigger è laterale (es. menu a comparsa). Il legame
  trigger↔direzione dà continuità spaziale al gesto: l'elemento entra da dove l'utente ha toccato.

### Convenzioni

- ID item sempre hyphen-case (`arc-alloy`), mai underscore — gli underscore erano il formato della
  vecchia API e sono stati eliminati ovunque
- UI in italiano, "Lvl" (non "Lv") per i livelli
- Card con superellisse: `rounded-[24px]`/`rounded-[28px]`
