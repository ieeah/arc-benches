# Inception Brief — ARC Benches

> **Nota di contestualizzazione**: Perimetro e decisioni di alto livello ricostruiti a posteriori su progetto già avviato ed evoluto.

---

## 🎯 Problema e Persone

### Problema Reale (Jobs to be Done)
I tracker di gioco esistenti mostrano requisiti e costi per singolo livello. Se un giocatore si trova al livello 1 di un banco da lavoro e desidera raggiungere il livello 3, deve calcolare manualmente la somma dei materiali richiesti per tutti gli step intermedi.
**ARC Benches** risolve questo problema aggregando automaticamente tutti i costi dal livello attuale al livello obiettivo (sia per i banchi di gioco sia per le liste custom dell'utente), confrontandoli in tempo reale con l'inventario posseduto e fornendo una lista della spesa d'insieme immediata.

### Attori e Persone
1. **Raider Solitario (Attore Principale)**: Giocatore mobile/desktop che cerca un'esperienza "zero-friction". L'app funziona senza registrazione, senza tracciamento e salva il 100% dei dati in locale (`localStorage`).
2. **Raider Multi-Device / Supporter (Attore Secondario - Opt-in)**: Utente che desidera sincronizzare i propri profili tra più dispositivi o condividere liste custom pubblicamente tramite URL web.

---

## 📐 Perimetro MVP vs Futuro

### Must Have (Già Implementati e Verificati nel Codice)
- **Stash (Lista della Spesa)**: Calcolo in tempo reale dei materiali mancanti, controlli rapido incrementali $+/-$, ordinamento per priorità/nome/rarità/tipo.
- **Modello Generico `List`**: Motore unificato per banchi del rifugio, liste custom utente e liste condivise tra profili.
- **Gestione Inventario & Deduzione**: Scalamento automatico dei materiali al level-up con gestione dei conflitti d'inventario tra banchi attivi.
- **Badge Refiner**: Calcolo in tempo reale della craftabilità degli oggetti in base al livello attuale del Refiner (badge verde/ambra).
- **Multi-Profilo & Import/Export v3**: Gestione di più profili di gioco locali e import/export esteso in formato JSON.
- **Role Maker**: Generator/randomizer di 20 archetipi comportamentali con regole operative e condizioni di vittoria.
- **Data Pipeline Offline-First**: Dati di gioco statici ingeriti tramite script Node (`fetch-items.mjs`) da MetaForge API e inclusi nel bundle.

### Nice to Have (Perimetro Futuro — Roadmap)
- **Supabase Cloud Sync & Auth (Fase 2)**: Autenticazione (Magic Link/OAuth) e sync background offline-first **strettamente opt-in**.
- **Spedizioni, Progetti e "Tieni o Butta" (Fase 3)**: Tracciamento spedizioni/progetti ed etichettatura "non vendere" per oggetti utili in futuro.
- **Condivisione Liste via Link**: Generazione `share_token` e route pubblica `/share/<token>` per la condivisione senza export JSON.
- **i18n & Checklist Stampabile**: Internazionalizzazione delle stringhe e vista print-friendly/PDF per raid di gruppo.

---

## ☠️ Pre-Mortem (Analisi dei Rischi e Mitigazione)

1. **Rischio Dipendenza da MetaForge API**:
   - *Causa*: MetaForge potrebbe modificare la struttura delle API, introdurre costi o chiudere i servizi.
   - *Mitigazione*: I dati di gioco vivono come file JSON statici nel bundle dell'app (`items.json`, `workbenches.json`). L'app runtime non fa alcuna chiamata di rete esterna. Anche con l'integrazione di Supabase (Fase 2), la pipeline di ingestion rimarrà un processo offline/script separato per garantire resilienza totale.
2. **Rischio Complessità Architetturale (Feature Creep)**:
   - *Causa*: L'accumulo di nuove entità di tracciamento potrebbe appesantire lo stato Zustand e la UX.
   - *Mitigazione*: Regola ferrea di design: prima di introdurre una nuova entità (es. Progetti, Quest), verificare se può essere modellata come semplice istanza del motore generico `List` (`listType`) senza duplicare la logica. Ogni aggiunta deve rispondere alla domanda: *"È davvero fondamentale per la UX?"*.

---

## ⚙️ Decisioni Tecniche di Alto Livello

- **Stack Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4.
- **State Management**: Zustand con slice divise per dominio (`inventory`, `progress`, `lists`, `profile`, `personality`).
- **Single Persistence Boundary**: Persistenza custom gestita da un unico sottoscrittore (`useAppStore.subscribe` in `src/store/index.ts`) che scrive su `localStorage` via adapter sicuro (`safeLS`). Nessun middleware `persist` nativo per evitare crash o desincronizzazioni.
- **Architettura Data Pipeline**: Ingestione dati disaccoppiata in `scripts/fetch-items.mjs` che scarica il catalogo MetaForge e ottimizza le icone in `public/icons/items/`.
- **Hosting & Infrastructure**: Single Page Application statica hostata su GitHub Pages con deploy automatico via GitHub Actions (`deploy.yml`).

---

## 📜 ADR Proposti

1. **ADR 001**: Rimoziome middleware `persist` nativo di Zustand in favore del sottoscrittore unico e adapter `safeLS`.
2. **ADR 002**: Generalizzazione del modello `Workbench` nell'astrazione generica `List` (`listType: workbench | project | quest | custom`).
3. **ADR 003**: Regola direzionale per i componenti `Drawer` (apertura coerente con il punto di tocco del trigger).
4. **ADR 004 (Futuro)**: Autenticazione e Cloud Sync Supabase come estensione **esclusivamente opt-in** del layer locale.

---

## 🔒 Sicurezza e Privacy

- **Privacy by Design**: Nessun tracciamento, nessun cookie analitico, nessun dato utente inviato a server terzi nell'esperienza base.
- **Sicurezza Confini Deserializzazione**: Validazione type-guard (`validate.ts`) su tutte le fonti esterne (localStorage, file JSON importati).
- **Futuro**: Integrazione di una libreria di schema validation leggera (valutare alternative a Zod per contenere la dimensione del bundle) prima del rilascio pubblico multi-utente.

---

## 🛠 Debito Tecnico Accettato

- **Lockfile NPM Cross-Platform**: Dipendenze con binding nativi (`sharp`) isolate in `scripts/package.json` per evitare fallimenti `npm ci` in CI Linux. Verificato tramite script `npm run check:lock`.
- **Ordinamento e Selettori $O(1)$**: Estratti selettori pure in `selectors.ts` per evitare calcoli expensive ad ogni re-render.

---

## 📏 Rigore Applicato

- **Livello di Rigore**: Proporzionato a un progetto nato per uso personale ma predisposto alla pubblicazione pubblica (open-source / community tool su GitHub Pages).
