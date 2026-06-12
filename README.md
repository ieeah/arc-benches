# ARC Benches

Companion tracker **non ufficiale** in italiano per [ARC Raiders](https://arcraiders.com/): tiene
traccia dei potenziamenti dei banchi da lavoro del rifugio e calcola automaticamente i materiali
da raccogliere, senza farti fare conti a mente livello per livello.

**Prova l'app:** https://ieeah.github.io/arc-benches/

## Il problema che risolve

I tracker esistenti mostrano i costi dei potenziamenti livello per livello: se sei al livello 1 del
Banco delle Armi e vuoi arrivare al 3, tocca a te sommare i materiali dei due step. ARC Benches
aggrega **tutti i costi dal livello attuale al livello obiettivo** di ogni banco, li confronta con
l'inventario che possiedi e ti dice cosa manca — aggiornato in tempo reale a ogni oggetto raccolto.

## Funzionalità

- **Stash** — la lista della spesa globale: solo i materiali che ti servono davvero, con contatore
  rapido `−/+` (long-press per andare veloce), stato `posseduti/richiesti`, ordinamento per
  priorità / nome / rarità / tipo
- **Rifugio** — un card per ogni banco con i requisiti del prossimo livello; quando l'inventario
  copre tutto il banco si illumina e un tap su "Completa potenziamento" scala i materiali e
  avanza il livello
- **Obiettivi** — livello attuale e livello obiettivo per ogni banco, esclusione dei banchi che
  non ti interessano, priorità di visualizzazione via drag & drop, reset completo
- **Badge Refiner** — gli oggetti craftabili nel Refiner sono marcati: verde se puoi craftarli
  subito col tuo livello attuale, ambra se prima devi potenziare il Refiner. Smetti di cercare
  in raid quello che puoi fabbricare in pochi secondi
- **Database Oggetti** — scheda di dettaglio per ogni oggetto: rarità, tipo, valore, zona di
  loot, craftabilità
- **Dark mode**, mobile-first, tutto salvato in localStorage: niente account, niente tracking

## Stack

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Zustand](https://zustand.docs.pmnd.rs/) (persistenza localStorage custom)
- [dnd-kit](https://dndkit.com/) per il drag & drop
- [Lucide](https://lucide.dev/) per le icone

## Dati di gioco

I dati sono file JSON statici nel bundle — nessuna chiamata API a runtime:

- `src/data/workbenches.json` — banchi, livelli e requisiti (curato a mano)
- `src/data/items.json` — nome, icona, rarità e metadati degli oggetti, generato da
  [MetaForge](https://metaforge.app/) con `node scripts/fetch-items.mjs`

I dati cambiano solo a patch del gioco: l'aggiornamento è manuale via script, non automatico.

## Sviluppo

```bash
npm install
npm run dev       # dev server con HMR
npm run build     # type-check + build di produzione
npm run lint      # ESLint
npm run preview   # anteprima della build
```

Il deploy su GitHub Pages è automatico a ogni push su `master` (GitHub Actions).

## Roadmap

Multi-profilo locale → sync cloud (Supabase) con auth → nuove sezioni (spedizioni, progetti,
database completo). Dettagli in [ROADMAP.md](ROADMAP.md).

---

*ARC Raiders è un marchio di Embark Studios. Questo progetto non è affiliato né sponsorizzato.*
