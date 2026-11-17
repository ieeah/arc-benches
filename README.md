# Scrappy's Nest

> *Precedentemente noto come **ARC Benches**.*

Companion tracker tattico **non ufficiale** in italiano per [ARC Raiders](https://arcraiders.com/): pianifica
le spedizioni e i raid, calcola in tempo reale i materiali mancanti per i banchi e i progetti del rifugio,
gestisce l'inventario dello Stash, traccia le collezioni in-raid (Blueprint, Design, Stencil), lo Skill Tree
interattivo, i Reward Pass e le ricette ufficiali di fabbricazione, potenziamento, riparazione e riciclo.

**Prova l'app:** https://ieeah.github.io/scrappys-nest/

Versione corrente: **0.6.0** ("Archivio del Rifugio") · in lavorazione: **0.6.5** ("Codex & Data Mining") (vedi [changelog 0.6.0](changelog/0.6.0.md) e [piano delle versioni](docs/VERSIONING.md)).

## Il problema che risolve

I tracker esistenti mostrano i costi dei potenziamenti livello per livello: se sei al livello 1 di
un banco e vuoi arrivare al 3, tocca a te sommare i materiali dei due step. Scrappy's Nest aggrega
**tutti i costi dal livello attuale a quello obiettivo**, li confronta con l'inventario che
possiedi e ti dice cosa manca, aggiornato a ogni oggetto raccolto.

## Funzionalità

- **Stash aggregato**: la lista della spesa globale con solo ciò che ti serve davvero. Contatore rapido, stato `posseduti/richiesti`, ordinamento multi-criterio (per priorità lista o per livello), vista a griglia o a lista compatta, interazione touch-first hold-to-complete e completamento azioni di livello con uno slide.
- **Banchi e liste**: banchi da lavoro, progetti, spedizioni, Reward Pass, Outpost e liste personalizzate riuniti in un unico elenco con priorità globale, drag-reveal per le liste nascoste dai filtri, barre di avanzamento segmentate (macro e micro-progresso) e prerequisiti tra liste (`requires`). Al level-up i materiali vengono scalati in automatico con gestione di eventuali conflitti.
- **Pianificazione Raid (`RaidPlan`)**: tracciamento spot di materiali e obiettivi da raccogliere durante le spedizioni, con collegamento rapido bidirezionale con lo Stash (`🎯 Nel Piano`), notifiche di fabbisogno coperto e radar d'azione nella barra di navigazione.
- **Fabbricazione, Upgrade I→IV, Riparazione e Riciclo**: schede ricetta ufficiali con stazioni del rifugio e in-raid richieste, percorsi evolutivi `I → II → III → IV` per i Base Items, rami di Amplificazione al Livello IV collegati alle Ricerche della Stazione di Ricerca, stime di riparazione (al rifugio vs sul campo) e ricerca inversa del riciclo dei materiali.
- **Collezioni in-raid**: archivio unificato per monitorare il possesso dei 206 collezionabili trovati in partita: 91 Blueprint di armi e gadget, 101 Design & Arredi del rifugio e 14 Stencil armi, con filtri di categoria, ricerca multilingua e barre di avanzamento.
- **Skill Tree interattivo**: albero delle abilità dei Raiders con canvas vettoriale a tridente organico (Condizionamento, Mobilità, Sopravvivenza), calcolo fedele dei punti abilità (76 SP base + fino a 15 extra da carovane), gestione milestone e modalità sandbox per sperimentare build.
- **Reward Pass**: gestione del pass attivo con livelli e tracce affiancate (Free/Premium), avanzamento dinamico a tier spaziali e archivio dei pass completati.
- **Catalogo oggetti**: scheda di dettaglio per ogni oggetto (rarità inclusa *Amplificato*, tipologia, valore, zone di loot, craftabilità), sfondi grafici autentici di gioco (armi amplificate, design, blueprint), e raggruppamento algoritmico di livelli (I–IV) e varianti d'arma.
- **Badge Refiner e Commercianti**: indicatori visivi per oggetti fabbricabili (con indicazione del livello di banco necessario) o acquistabili dai mercanti di Speranza.
- **Profili e modularità**: gestione multi-profilo sullo stesso dispositivo, attivazione e disattivazione modulare delle sezioni e funzionalità per singolo profilo (`isSectionActive`), esportazione e importazione backup in formato JSON v3.
- **UI mobile-first e accessibilità**: barra di navigazione flottante (classica o con morphing a molla elastica), gesture touch-first con pressione prolungata (tap-hold), layout dinamico (`dvh`/`svh`), sincronizzazione del tema del browser (`theme-color`), modalità animazioni ridotte (`prefers-reduced-motion`) e persistenza in `localStorage`: nessun account, nessun tracciamento.
- **Dev Studio (solo in locale)**: suite di strumenti per lo sviluppo (esclusa dalla build di produzione via `import.meta.env.DEV`) per gestire liste, pass, oggetti custom, override, varianti e traduzioni con anteprima differenze e applicazione diretta ai file del progetto (vedi [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).

## Stack

- [Vite](https://vite.dev/) con plugin nativo `@tailwindcss/vite`
- [React 19](https://react.dev/) e [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Zustand](https://zustand.docs.pmnd.rs/), con architettura a slice e persistenza sicura in `localStorage` (`safeLS`)
- [@dnd-kit](https://dndkit.com/) per il drag & drop
- [Lucide](https://lucide.dev/) per le icone
- [Vitest](https://vitest.dev/) per i test automatizzati

## Dati di gioco

I dati sono file JSON statici inclusi nel bundle: nessuna chiamata di rete a runtime.

- `src/data/items.json`, `item-variants.json` e `public/icons/items/`: catalogo oggetti sincronizzato da [MetaForge](https://metaforge.app/), integrato con oggetti custom e normalizzazione delle varianti d'arma e moduli. Traduzioni italiane da [RaidTheory](https://github.com/RaidTheory/arcraiders-data) con ripiego automatico da [ARC Tracker](https://arctracker.io/).
- `src/data/recipes.json`: 599 ricette ufficiali di costruzione, upgrade di livello I→IV, riparazione e riciclo/smantellamento estratte da [ARC Tracker](https://arctracker.io/).
- `src/data/quests.json` e `quests-source.json`: 123 quest dei commercianti con grafo di dipendenze, prerequisiti, obiettivi e ricompense.
- `src/data/skills.json` e `public/icons/skills/`: nodi, prerequisiti, coordinate e icone dello Skill Tree estratti da RaidTheory e Wiki.
- `src/data/workbenches.json`, `projects.json`, `expeditions.json`, `passes.json`, `traders.json`: liste di gioco, Outpost, spedizioni, tracce dei pass e catalogo dei commercianti.

I dati cambiano con le patch del gioco; l'aggiornamento avviene tramite gli script dedicati in `scripts/`:

```bash
cd scripts && npm install
node fetch-all.mjs            # Esegue l'intera pipeline di sincronizzazione dati (passa --refresh per riscaricare)
# Oppure esecuzione dei singoli moduli:
node fetch-items.mjs          # Rigenera items.json, icone e mapping sblocchi da MetaForge
node fetch-translations.mjs   # Sincronizza le traduzioni italiane (RaidTheory + fallback ARC Tracker)
node fetch-skills.mjs         # Estrae i nodi dello Skill Tree e scarica le icone
node fetch-quests.mjs         # Sincronizza le quest di gioco da MetaForge e ARC Tracker
node fetch-recipes.mjs        # Estrae ricette di crafting, upgrade I->IV, riparazione e riciclo
node fetch-category-icons.mjs # Scarica e normalizza le icone di categoria da Wiki API
node fetch-arctracker.mjs     # Rapporto locale degli oggetti assenti dal catalogo
```

## Sviluppo

```bash
npm install
npm run dev         # Dev server con HMR
npm test            # Test suite automatizzata (Vitest)
npm run build       # Type-check + build di produzione (le pagine Dev Studio vengono escluse via tree-shaking)
npm run lint        # ESLint
npm run preview     # Anteprima della build di produzione
npm run check:lock  # Verifica del lockfile (cross-platform, come in CI)
```

Il deploy su GitHub Pages è automatico a ogni push su `master`. Le convenzioni operative e le regole di sviluppo per gli agenti sono descritte in [AGENTS-PROJECT-RULES.md](AGENTS-PROJECT-RULES.md) e [AGENTS.md](AGENTS.md); la documentazione strutturale è organizzata in [docs/](docs/): stato attuale, roadmap, backlog, architettura, specifiche e decisioni (ADR).

## Roadmap verso la 1.0.0

- **0.6.0 "Archivio del Rifugio"** (corrente): pagina unificata Collezioni (Blueprint, Design, Stencil), Skill Tree interattivo dei Raiders, ricette complete di fabbricazione/upgrade I→IV/riparazione/riciclo, armi amplificate e ricerche Research Station.
- **0.6.5 "Codex & Data Mining"** (in lavorazione): estrazione totale del dataset di gioco, bestiario nemici ARC con loot table/debolezze, mappe e POI, normalizzazione 123 Quest e commercianti.
- **0.7.0 "Guida di Speranza"**: UI Kit Playground, migrazione componenti a Base UI e redesign mobile in vista dell'architettura Next.js.
- **0.8.0 "Ponte Next & Supabase"**: migrazione a Next.js App Router, database e autenticazione Supabase con sincronizzazione cloud offline-first.
- **0.9.0 "Rifinitura Tattica"**: performance, pre-calcolo indici di ricerca e virtualizzazione liste.
- **1.0.0 "Rete Speranza"**: lancio pubblico ufficiale con offerte live, mappe interattive e condivisione liste.

Dettagli completi in [docs/VERSIONING.md](docs/VERSIONING.md) e [docs/2_ROADMAP.md](docs/2_ROADMAP.md).

---

*ARC Raiders è un marchio di Embark Studios. Questo progetto non è affiliato né sponsorizzato.*
