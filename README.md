# ARC Benches

Companion tracker **non ufficiale** in italiano per [ARC Raiders](https://arcraiders.com/): tiene
traccia dei potenziamenti dei banchi da lavoro e dei progetti del rifugio e calcola in automatico i
materiali che ti mancano, senza fare conti a mente livello per livello.

**Prova l'app:** https://ieeah.github.io/arc-benches/

Versione corrente: **0.4.0** · in lavorazione: **0.5.0** (vedi [changelog](changelog/0.5.0.md) e
[piano delle versioni](docs/VERSIONING.md)).

## Il problema che risolve

I tracker esistenti mostrano i costi dei potenziamenti livello per livello: se sei al livello 1 di
un banco e vuoi arrivare al 3, tocca a te sommare i materiali dei due step. ARC Benches aggrega
**tutti i costi dal livello attuale a quello obiettivo**, li confronta con l'inventario che
possiedi e ti dice cosa manca, aggiornato a ogni oggetto raccolto.

## Funzionalità

Disponibili:

- **Stash**: la lista della spesa globale, con solo ciò che ti serve davvero. Contatore rapido,
  stato `posseduti/richiesti`, ordinamento per priorità, nome, rarità o tipo, vista a griglia o a
  lista e azioni dei livelli completabili con uno slide.
- **Banchi e liste**: banchi da lavoro, progetti e liste personalizzate, ciascuno con livello
  attuale, livelli obiettivo e priorità di visualizzazione via drag & drop. Quando l'inventario
  copre un livello, il potenziamento si completa con un tap e scala i materiali.
- **Blueprint**: tracker dei progetti di gioco posseduti, con ricerca e avanzamento.
- **Database oggetti**: scheda di dettaglio per ogni oggetto (rarità, tipo, valore, zona di loot,
  craftabilità) con ricerca che accetta più parole e ignora gli accenti.
- **Badge Refiner**: gli oggetti fabbricabili sono marcati, verde se puoi farlo già, ambra se prima
  devi potenziare il Refiner.
- **Più profili** sullo stesso dispositivo, liste condivise tra profili, **export e import** JSON.
- **Italiano e inglese**, tema chiaro e scuro, animazioni ridotte; tutto in `localStorage`: niente
  account, niente tracking.

In sviluppo, dietro feature flag (spenti per gli utenti):

- **Reward Pass**: pass attivo, livelli con più tracce (gratuita, premium…) come nel gioco.
- **Spedizioni**, **Role Maker** e **mappe tattiche**.

Per chi sviluppa, un **Dev Studio** (solo in locale) permette di modificare liste, pass, oggetti
custom, override e traduzioni senza toccare il codice: vedi [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack

- [Vite](https://vite.dev/), [React 19](https://react.dev/) e TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Zustand](https://zustand.docs.pmnd.rs/), con persistenza esplicita in `localStorage`
- [dnd-kit](https://dndkit.com/) per il drag & drop, [Lucide](https://lucide.dev/) per le icone
- [Vitest](https://vitest.dev/) per i test

## Dati di gioco

I dati sono file JSON statici nel bundle: nessuna chiamata di rete a runtime.

- `src/data/items.json` e `public/icons/items/`: catalogo oggetti da
  [MetaForge](https://metaforge.app/), più gli oggetti non presenti (outfit, cosmetici…) definiti a
  mano. Traduzioni italiane da [RaidTheory](https://github.com/RaidTheory/arcraiders-data).
  [ARC Tracker](https://arctracker.io/) serve come riscontro, solo in locale.
- `src/data/workbenches.json`, `projects.json`, `expeditions.json`, `passes.json`: liste di gioco,
  curate a mano.

I dati cambiano a ogni patch del gioco: l'aggiornamento è manuale, via script.

```bash
cd scripts && npm install
node fetch-items.mjs          # rigenera items.json e le icone
node fetch-translations.mjs   # traduzioni italiane degli oggetti
```

## Sviluppo

```bash
npm install
npm run dev         # dev server con HMR
npm test            # test
npm run build       # type-check + build di produzione
npm run lint        # ESLint
npm run preview     # anteprima della build
npm run check:lock  # verifica il lockfile (come in CI)
```

Il deploy su GitHub Pages è automatico a ogni push su `master`. Convenzioni e regole di lavoro in
[AGENTS.md](AGENTS.md); la documentazione è in [docs/](docs/): stato attuale, roadmap, backlog,
architettura e decisioni (ADR).

## Roadmap

Dopo la 0.5.0 (strumenti Dev e dati: liste, pass, progetti) arrivano tracker e collezioni, quest e
Skill Tree, poi dashboard, redesign e migrazione a Next.js con Supabase (sync e account) verso la
1.0.0. Dettagli in [docs/2_ROADMAP.md](docs/2_ROADMAP.md).

---

*ARC Raiders è un marchio di Embark Studios. Questo progetto non è affiliato né sponsorizzato.*
