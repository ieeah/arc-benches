# Strategia di Transizione a Next.js & Supabase (Fase 0.9.0+)

Questo documento formalizza la decisione architetturale e la roadmap per il passaggio dell'applicazione da prototipo/client-SPA (Vite + Tailwind + localStorage) al prodotto definitivo (Next.js + Supabase + CSS proprietario).

---

## 1. Ruolo del Progetto Attuale (Spike & Validazione Requisiti)

Il repository corrente è servito come **PoC (Proof of Concept) ed Exploratory Prototype** sviluppato rapidamente per:
* Validare il modello matematico di aggregazione dei costi e calcolo fabbisogno materiali.
* Definire l'astrazione generica delle liste (List, banchi, progetti, spedizioni).
* Integrare e normalizzare le fonti dati esterne di gioco (MetaForge API, ARDB.app, Wiki MediaWiki).
* Progettare la pipeline di override e correzione dei dati di catalogo (items-overrides.json).
* Raccogliere feedback sui flussi d'uso e consolidare le specifiche di business.

---

## 2. Decisione: Nuovo Repository & Ownership della Codebase

Al raggiungimento della fase di migrazione (**v0.9.0**), non si effettuerà un refactoring in-place, ma si procederà con l'**inizializzazione di un nuovo repository pulito**, archiviando questo come prototipo privato:

1. **Abbandono di Tailwind CSS:**
   * La parte grafica e i componenti visuali verranno riscritti da zero adottando un approccio CSS alternativo (es. CSS Modules, Vanilla CSS con variabili semantiche o Sass) controllato direttamente dall'autore.
2. **Architettura Next.js Nativa:**
   * Struttura creata da zero con Next.js App Router, distinguendo in modo naturale Server Components (RSC) e Client Components ('use client'), Server Actions e Route Handlers.
3. **Commit History Pulita:**
   * La repository pubblica finale partirà con una cronologia di commit ordinata, professionale e priva dei workaround temporanei legati alla SPA statica su GitHub Pages.

---

## 3. Matrice di Conservazione Asset & Logica

Per prevenire la *Sindrome del Secondo Sistema*, il nuovo progetto riutilizzerà i componenti di valore già collaudati:

| Modulo / File | Azione di Migrazione | Note |
| :--- | :--- | :--- |
| **Formule & Selettori (selectors.ts, craft.ts)** | 📦 **Copia 1:1** | Logica pura e isolata di calcolo materiali, conflitti inventario e Refiner. |
| **Validazione Runtime Zod (alidate.ts)** | 📦 **Copia 1:1** | Schemi di validazione JSON per profili, liste e import/export. |
| **Pipeline Normalizzazione Dati (scripts/)** | 📦 **Copia & Adattamento** | Pipeline di download da MetaForge/ARDB adattata per caricare su Supabase Storage e Postgres. |
| **Dati di Catalogo & Overrides (items-overrides.json)** | 📦 **Copia 1:1** | Base dati corretta per categorizzazioni e descrizioni. |
| **Documentazione & Specifiche (docs/specs/, drs/)** | 📦 **Copia 1:1** | Specifiche di dominio e contratti architetturali già approvati. |
| **Componenti UI / JSX / CSS Tailwind** | 🗑️ **Riscrizione da Zero** | Nuova estetica, layout e fogli di stile proprietari (senza Tailwind). |
| **State Storage Client (safeLS)** | 🔄 **Sostituzione** | Supabase Postgres + RLS con cache locale offline-first. |

---

## 4. Fasi Operative della Transizione

1. **Fase Prototipale Corrente (fino a v0.8.0):**
   * Continuare a utilizzare questo repository per testare la logica delle spedizioni, la dashboard, gli eventi live e consolidare i requisiti.
2. **Inizializzazione Nuovo Repo (v0.9.0):**
   * Creazione nuovo repository Next.js + Supabase.
   * Migrazione del *Domain Core* (`lib/`, `types/`, `scripts/`, `docs/`).
   * Setup dello schema database Supabase e Storage bucket.
   * Ricostruzione delle pagine e dei componenti con il nuovo design system CSS.
3. **Chiusura & Archiviazione:**
   * Archiviazione/privatizzazione di questo repository come sandbox di ricerca.
   * Lancio ufficiale della **v1.0.0** sul nuovo repository.

---

## 5. Subdomain Routing & Micro-App (es. Role Maker Standalone)

Con Next.js App Router e Vercel, l'architettura supporterà nativamente il **routing per sottodomini** tramite `middleware.ts`:

* **Struttura dei Domini:**
  * `arcbenches.app` / `app.arcbenches.app` $\rightarrow$ Companion Tracker principale (Banchi, Stash, Spedizioni, Dashboard, Mappe).
  * `rolemaker.arcbenches.app` (o `role.arcbenches.app`) $\rightarrow$ Micro-app autonoma dedicata alla generazione di identità, roleplay, archetipi e lore.
* **Vantaggi dell'Approccio Unificato in Next.js:**
  1. **Infrastruttura Singola:** Unico progetto Next.js (o monorepo Turborepo) con routing interno gestito dal middleware di riscrittura (`NextResponse.rewrite()`).
  2. **Single Sign-On & DB Condiviso:** Stesso database e condivisione automatica della sessione utente su tutti i sottodomini (cookie con wildcard `domain: .arcbenches.app`).
  3. **Identità Indipendente:** Il Role Maker può essere condiviso sui social/community Discord come strumento a sé stante con un proprio layout, branding e metadati Open-Graph dedicati, senza appesantire l'interfaccia del tracker.

---

## 6. Modello Dati Centralizzato per la Finestra di Spedizione

Nel modello client attuale, le date di apertura e chiusura sono temporaneamente memorizzate per lista. Nel backend definitivo, la finestra temporale è un'entità globale singleton:

* **Tabella `expedition_window`**:
  * `id`: UUID / primary key singleton (`current`)
  * `start_date`: Timestamp UTC apertura finestra donazioni/preparativi
  * `departure_date`: Timestamp UTC partenza effettiva (chiusura carovane)
  * `status`: Enum (`upcoming` | `open` | `departed` | `closed`)
  * `metadata`: Note opzionali su modificatori stagionali o condizioni globali
* I profili utente (`user_expeditions`) memorizzano solo la loro progressione individuale (`current_expedition_index`, `consecutive_streak`, `earned_sp`, `phase_completions`), sincronizzandosi con l'unica finestra attiva globale.

---

## 7. Valutazione Alternative a Supabase (Resilienza all'Inattività e Pause Progetto)

Il piano gratuito di Supabase mette forzatamente in pausa i progetti dopo **7 giorni di inattività**, richiedendo riattivazione manuale da dashboard o workaround di keep-alive inaffidabili. Per un companion tracker di gioco soggetto a stagionalità e pause tra playtest/wipe, si valutano le seguenti alternative architetturali:

| Opzione | Architettura | Politica Inattività / Pause | Pro | Contro |
| :--- | :--- | :--- | :--- | :--- |
| **Neon Serverless Postgres** + Better-Auth | Serverless Postgres + Auth in Next.js | **Nessuna pausa bloccante** (scala a 0 compute ma si risveglia automaticamente via SQL/HTTP in ~500ms) | 100% Postgres standard, Drizzle ORM, branching DB, zero manutenzione dashboard | Auth gestita a livello applicativo (Better-Auth / Clerk) anziché BaaS integrato |
| **Turso (libSQL / SQLite)** + Drizzle | SQLite distribuito su Edge | **Nessuna pausa** (500 DB, 9 GB storage gratis) | Cold start < 10ms, replica locale offline-first, velocissimo per letture | No RLS Postgres nativo; relazionale leggero |
| **Cloudflare D1 + Workers/Pages** | SQLite Serverless globale su CDN Cloudflare | **Nessuna pausa** (5M read/giorno gratis) | Completamente serverless, zero costi fissi, integrazione KV e R2 per asset | Ecosistema Cloudflare vincolante |
| **PocketBase (Self-Hosted)** | Go + SQLite (Auth, Realtime, File Storage, Admin UI) | **Sempre attivo** (su VPS Hetzner da 3.30€/mese o Fly.io) | BaaS completo chiavi in mano, zero limiti terzi, 100% controllo dati | Richiede gestione di una VPS o container Docker |
| **Firebase / Firestore** | NoSQL BaaS Google | **Nessuna pausa** (free tier permanente) | Realtime nativo collaudatissimo, Auth eccellente | Paradigma NoSQL / Document-based anziché relazionale SQL |

