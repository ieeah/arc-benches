# ADR 005 — Migrazione a Next.js e Integrazione Supabase

* **Data**: 2026-08-04
* **Stato**: Approvato

---

## Contesto

ARC Benches è nato come Single Page Application (SPA) locale, ospitata in modo statico su GitHub Pages e basata su Vite, Zustand e localStorage. Questa architettura offline-first garantisce velocità e zero costi di gestione, ma presenta dei limiti invalicabili per i futuri sviluppi in roadmap:
1. **Condivisione Liste**: La condivisione tramite URL serializzati (query params) genera link troppo lunghi e non consente di servire metadati SEO (Open Graph) dinamici per le anteprime su Discord e altri social.
2. **Sincronizzazione Cloud**: L'infrastruttura client-only non permette la sincronizzazione automatica dei profili e dello stash su più dispositivi.
3. **Notifiche ed Eventi**: La gestione delle scadenze e delle finestre di spedizione centralizzate beneficerebbe di una logica server-side.

---

## Decisione

Abbiamo deciso di avviare l'evoluzione dell'infrastruttura dell'applicazione adottando la seguente architettura:

### 1. Evoluzione del Framework (Next.js & Vercel)
* Effettueremo la migrazione da Vite a **Next.js (App Router)**.
* L'applicazione verrà ospitata su **Vercel** per sfruttare il server-side rendering (SSR), le Server Actions e le API serverless.
* **Gestione Hydration**: Per gli utenti ospiti (guest), lo stato Zustand e la persistenza locale (localStorage) rimarranno client-side. Per evitare errori di idratazione (hydration mismatch), il rendering dello stato del profilo verrà posticipato al montaggio del client.

### 2. Database e Backend (Supabase)
* Adotteremo **Supabase** come fornitore unico di backend-as-a-service (BaaS), escludendo l'uso combinato di altri provider (come Vercel Postgres o Auth.js) per ridurre la complessità del codice.
* **Autenticazione**: Abiliteremo l'accesso tramite **Discord OAuth** (canale primario della community di ARC Raiders), **Google OAuth** e **Magic Link** via Email.
* **Modello Dati**: Struttura **ibrida** relazionale/documentale. Manteniamo relazioni solide per le entità principali (profili, oggetti statici) e memorizziamo la progressione flessibile (liste, stash, banchi, checkedActions) all'interno di campi JSONB.
* **Sync Engine**: Il sync offline-first utilizzerà un sistema con debounce (~2s) e risoluzione automatica dei conflitti basata sul criterio **Last-Write-Wins (LWW)** tramite timestamp `updated_at`.

### 3. Rotte Condivise `/share/<token>`
* Le liste condivise verranno salvate in una tabella dedicata su Supabase.
* La rotta `/share/<token>` eseguirà **Server-Side Rendering (SSR)** per recuperare la lista dal database e iniettare i meta-tag Open Graph necessari per visualizzare anteprime grafiche ricche sui canali social.

---

## Conseguenze

* **Vantaggi**:
  * Abilitazione di tutte le feature social (condivisione, account sync) con un'esperienza utente premium.
  * Anteprime SEO dinamiche ricche.
  * Struttura dati flessibile (JSONB) che riduce la necessità di migrazioni SQL ad ogni update dei dati di gioco.
* **Svantaggi**:
  * Abbandono di GitHub Pages per Vercel.
  * Spostamento del traguardo 1.0.0 per accogliere i lavori di migrazione strutturale.
