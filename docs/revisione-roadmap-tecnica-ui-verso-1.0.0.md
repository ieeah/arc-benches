# Revisione Roadmap «Tecnica & UI» e Sequenza `0.7.x` → `1.0.0`

_Documento di lavoro aggiornato al 2026-11-06 — Decisioni su Gruppo A e B, e proposta di riallineamento architetturale delle milestone `0.7.x`, `0.8.x`, `0.9.x` e `1.0.0`._

> Per le decisioni consolidate sulle 52 issue legate ai dati vedi [revisione-roadmap-dati-verso-1.0.0.md](revisione-roadmap-dati-verso-1.0.0.md).

---

## 1. Il Problema Architetturale tra `0.7.x`, `0.8.x` e `0.9.x` (Perché invertire Performance e Cambio Stack)

Nel vecchio piano (`VERSIONING.md`), le milestone arrivavano fino alla `0.10.0` perché `0.7.0` e `0.8.0` erano occupate da feature dati (ora raccolte in `0.6.0` e `0.6.x`).
Mettendo le **Performance in `0.7.x`** prima del cambio di stack si creerebbe un doppio lavoro:
- **`#119` (`React.lazy` su Vite e rimozione pagine Dev dal bundle)** e **`#120` (dynamic import dei JSON sul client)** verrebbero riscritti da zero passando a **Next.js App Router (`#28`)**, dove il code-splitting per rotta è nativo, i JSON/dati vengono serviti da Server Components / Supabase (`#14`) e le pagine Dev diventano rotte `/admin` (`#65`).
- **`#11` (Virtualizzazione liste)** e **`#142` (Indice di ricerca)** andrebbero ricalibrati dopo il refactor UI con **Base UI (`#141`, `#60`, `#115`)** e dopo il cambio di struttura delle pagine (`#116`, `#28`).

### Nuova Sequenza Proposta (`0.5.x` → `1.0.0`, senza più bisogno della `0.10.0`)

| Milestone | Ruolo Architetturale | Cosa contiene |
| :--- | :--- | :--- |
| **`0.5.0` & `0.5.1`** | **Dati di 1° Livello & Consolidamento Base** | Oggetti in-game, liste, pass, `ItemPicker` (#143, #88), badge banchi (#75), moduli/export (#102, #74) + in `0.5.1` standardizzazione `PageLayout` (#135, #136), `type` (#133), HTML/tema (#124, #125, #126), ordinamento Stash (#69) e passaggio a `@tailwindcss/vite` (#127). |
| **`0.6.0` & `0.6.x`** | **Dati di 2° Livello, Collezioni & Dati Estesi** | Collezioni (#145, #91, #131, #109), Armi Amplificate (#92), Ricette/Upgrade (#113), Elenco unico liste (#114), Skill Tree (#89, #62) + in `0.6.x` Spedizioni (#146), Quest Dev & User (#76, #58), Commercianti statici (#94), Filtri/Viste Stash e Raid (#93, #26, #81, #59), Trofei (#70), valutazione Dashboard (#56). |
| **`0.7.0` (& `0.7.x`)** | **Preparazione UI/UX, Base UI & Struttura Pagine (Pre-Migrazione)** | **Prima** si crea il **Dev UI Kit Playground (#141)**; **poi** si migrano modali/drawer e componenti a **Base UI** (#121, #122, #60), si applica il redesign visivo (#115, #4) e si riorganizzano le pagine con il dettaglio lista/Outpost (#116) così da avere componenti puliti e rotte già pronte per l'App Router di Next.js. |
| **`0.8.0` (& `0.8.x`)** | **Passaggio alla Nuova Architettura (Next.js + Supabase + Auth)** | Migrazione a **Next.js App Router (#28)**, **Database & Auth Supabase (#14, #15, #16)**, **Redesign pagina Impostazioni sulla nuova persistenza (#148)** e **Backoffice `/admin` con fallback fonti (#65, #97)**. *(Completa il passaggio al nuovo stack)*. |
| **`0.9.0` (& `0.9.x`)** | **Performance, Ottimizzazione & Rifinitura sul Nuovo Stack** | Con nuovo stack e nuova UI definitivi, si eseguono le ottimizzazioni reali: **Bundle & Code-Splitting / Dynamic Loading (#119, #120)**, **Pre-calcolo indice ricerca (#142)**, **Virtualizzazione liste lunghe (#11)**, **View Transitions (#27)** e **Telemetria anonima cookieless (#66, #67)**. |
| **`1.0.0`** | **Feature Cloud/Social, Onboarding & Lancio Pubblico** | Offerte settimanali Cassio/Ermal via backend (#147), Eventi Live (#55), Mappe Interattive (#61), Codex + ARCs (#64, #57), Condivisione Link Liste e Skill Tree (#25, #98) e Tour Onboarding (#20). |

> 💡 **Pulizia Milestone su GitHub**: Con questa struttura possiamo eliminare le milestone **`0.10.0 Ponte Next & Supabase`** e **`Spedizioni (da rivalutare)`** (ormai vuota), mantenendo una progressione lineare `0.5` → `0.6` → `0.7` → `0.8` → `0.9` → `1.0.0`.

---

## 2. Gruppo A — Layout, Standard Codice, HTML/CSS e Tooling Locale (`0.5.1`) — ✅ Deciso

Tutte confermate in **`0.5.1 Taratura del Segnale`**:

| Issue | Titolo & Contenuto | Stato Decisione |
| :--- | :--- | :--- |
| **[#135](https://github.com/ieeah/arc-benches/issues/135)** | `refactor(layout): migrazione pagine esistenti a PageLayout e testing layout/scroll` | ✅ **`0.5.1`** |
| **[#136](https://github.com/ieeah/arc-benches/issues/136)** | `refactor(layout): standardizzazione layout unificato PageLayout e fix retroattivo` | ✅ **`0.5.1`** *(da chiudere/unificare con #135)* |
| **[#133](https://github.com/ieeah/arc-benches/issues/133)** | `refactor(code): verifica retroattiva adozione type e standard mobile/touch-first` | ✅ **`0.5.1`** |
| **[#126](https://github.com/ieeah/arc-benches/issues/126)** | `fix(html): lang dinamico, titolo e meta description in index.html` | ✅ **`0.5.1`** |
| **[#124](https://github.com/ieeah/arc-benches/issues/124)** | `feat(theme): color-scheme, theme-color e accent-color per la UI nativa del browser` | ✅ **`0.5.1`** |
| **[#125](https://github.com/ieeah/arc-benches/issues/125)** | `a11y(ui): scrollbar nascosta nelle liste di pill orizzontali senza altra affordance di scorrimento` | ✅ **`0.5.1`** |
| **[#127](https://github.com/ieeah/arc-benches/issues/127)** | `chore(build): passare a @tailwindcss/vite e rimuovere postcss/autoprefixer e la config Tailwind legacy` | ✅ **`0.5.1`** *(confermata in `0.5.1` anche se fuori scope, per velocizzare subito Vite durante la `0.6.x`)* |

---

## 3. Gruppo B — UI Kit Dev, Base UI, Redesign e Struttura Pagine (`0.7.0` / `0.7.x`) — ✅ Ordine Definito

Ordine di esecuzione vincolato: **prima `#141` (creazione della Dev Page UI Kit)**, poi il passaggio dei componenti a **Base UI** e la riorganizzazione delle pagine in vista di Next.js:

| Ordine | Issue | Titolo & Contenuto | Collocazione Proposta |
| :---: | :--- | :--- | :--- |
| **1°** | **[#141](https://github.com/ieeah/arc-benches/issues/141)** | `Dev Studio: UI Kit & Component Playground con vista comparativa e adozione incrementale Base UI` | **`0.7.0`** *(Prerequisito bloccante: creare la pagina Dev prima di iniziare il passaggio a Base UI)* |
| **2°** | **[#121](https://github.com/ieeah/arc-benches/issues/121)** | `refactor(ui): migrare Drawer, BottomSheet e modali a <dialog> nativo / Base UI Dialog` | **`0.7.0`** *(Subito dopo #141, usando i primitivi testati nel Playground)* |
| **3°** | **[#122](https://github.com/ieeah/arc-benches/issues/122)** | `refactor(ui): rimuovere lo scroll lock su html/body e usare overscroll-behavior sul dialog` | **`0.7.0`** *(Dipende da #121)* |
| **4°** | **[#60](https://github.com/ieeah/arc-benches/issues/60)** | `Refactor UI/UX Globale: Consolidamento componenti, modali, drawer e densità visiva` | **`0.7.0` / `0.7.x`** *(Adozione estesa Base UI su tutti i controlli dell'app)* |
| **5°** | **[#115](https://github.com/ieeah/arc-benches/issues/115)** | `ux(design): valutare un redesign dell'app, oggi troppo «Tailwind generico»` | **`0.7.0` / `0.7.x`** *(In parallelo a #60 grazie al confronto nel Playground #141)* |
| **6°** | **[#4](https://github.com/ieeah/arc-benches/issues/4)** | `Supporto Tastiera per Drag & Drop` | **`0.7.0` / `0.7.x`** |
| **7°** | **[#116](https://github.com/ieeah/arc-benches/issues/116)** | `feat(lists): pagina di dettaglio per ogni lista, pagina dell'Outpost e riorganizzazione delle pagine` | **`0.7.0` / `0.7.x`** *(Chiude la preparazione strutturale delle viste prima di passare all'App Router Next.js in `0.8.0`)* |

*(Nota: **`#119`** viene spostata insieme a **`#120`**, **`#142`** e **`#11`** nella **`0.9.0`**, dopo il passaggio a Next.js).*

---

## 4. Gruppo C — Passaggio a Next.js/Supabase (`0.8.0`), Performance (`0.9.0`) e Lancio (`1.0.0` / `1.x` / `2.x`)

Se confermi l'inversione tra Stack (`0.8.0`) e Performance (`0.9.0`), ecco come si distribuiscono le issue del Gruppo C (più le issue tecniche/backend collegate):

| Milestone Proposta | Issue | Titolo & Ruolo |
| :--- | :--- | :--- |
| **`0.8.0`** *(Nuovo Stack: Next.js + Supabase)* | **[#28](https://github.com/ieeah/arc-benches/issues/28)** | `Next.js & Vercel` — Migrazione a Next.js App Router, SSR e Route Handlers |
| **`0.8.0`** *(Nuovo Stack: Next.js + Supabase)* | **[#14](https://github.com/ieeah/arc-benches/issues/14), [#15](https://github.com/ieeah/arc-benches/issues/15), [#16](https://github.com/ieeah/arc-benches/issues/16)** | `Supabase` — Schema Dati & RLS (#14), Account & Auth (#15), Sync Background offline-first (#16) |
| **`0.8.0`** *(Nuovo Stack: Next.js + Supabase)* | **[#148](https://github.com/ieeah/arc-benches/issues/148)** | `Redesign completo pagina Impostazioni` — Integrato direttamente con la nuova persistenza Next.js/Supabase |
| **`0.8.0`** *(Nuovo Stack: Next.js + Supabase)* | **[#65](https://github.com/ieeah/arc-benches/issues/65), [#97](https://github.com/ieeah/arc-benches/issues/97)** | `Backoffice & Pipeline (/admin)` su Next.js (#65) + Fallback automatico su fonte dati di backup (#97) |
| **`0.9.0`** *(Performance & Rifinitura sul Nuovo Stack)* | **[#119](https://github.com/ieeah/arc-benches/issues/119), [#120](https://github.com/ieeah/arc-benches/issues/120)** | Ottimizzazione bundle/code-splitting delle rotte e delle pagine Dev/Admin (#119) + caricamento dinamico payload pesanti e Leaflet (#120) |
| **`0.9.0`** *(Performance & Rifinitura sul Nuovo Stack)* | **[#142](https://github.com/ieeah/arc-benches/issues/142), [#11](https://github.com/ieeah/arc-benches/issues/11)** | Pre-calcolo token normalizzati e indice di ricerca (#142) + Virtualizzazione delle liste lunghe sul DOM definitivo (#11) |
| **`0.9.0`** *(Performance & Rifinitura sul Nuovo Stack)* | **[#27](https://github.com/ieeah/arc-benches/issues/27)** | `View Transitions` fluide tra le pagine del router Next.js |
| **`0.9.0`** *(Performance & Rifinitura sul Nuovo Stack)* | **[#66](https://github.com/ieeah/arc-benches/issues/66), [#67](https://github.com/ieeah/arc-benches/issues/67)** | Telemetria first-party cookieless e anonima sul nuovo stack |
| **`1.0.0`** *(Lancio Pubblico)* | **[#20](https://github.com/ieeah/arc-benches/issues/20)** | `Tour Onboarding interattivo con driver.js` *(insieme a #147, #55, #61, #64, #57, #25, #98)* |
| **`1.x`** *(Post-Lancio)* | **[#29](https://github.com/ieeah/arc-benches/issues/29), [#33](https://github.com/ieeah/arc-benches/issues/33), [#38](https://github.com/ieeah/arc-benches/issues/38)** | `Supporto PWA` (#29) e `Role Maker UI / Micro-app` (#33, #38) |
| **`2.x`** | **[#40](https://github.com/ieeah/arc-benches/issues/40)** | `Wrapper Mobile Nativo (React Native / Capacitor / Expo)` |
