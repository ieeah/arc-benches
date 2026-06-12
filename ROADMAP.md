# Roadmap — ARC Benches

Companion tracker per ARC Raiders. Stato attuale: app local-only (localStorage), deploy su GitHub Pages.

---

## Fase 0 — Tracker local-only ✅ (completata)

- [x] Dati di gioco statici nel bundle: `src/data/items.json` + `src/data/workbenches.json` (ID items = fonte di verità)
- [x] Script `scripts/fetch-items.mjs` per aggiornare manualmente i dati da MetaForge
- [x] Inventario, livelli banchi, obiettivi, priorità banchi (drag & drop), persistiti in localStorage
- [x] Calcoli derivati: lista spesa aggregata, materiali mancanti, banchi potenziabili
- [x] UI mobile-first: tab Stash / Rifugio / Obiettivi, dark mode, ordinamenti
- [x] Deploy automatico su GitHub Pages

## Fase 1 — Multi-profilo locale (~mezza giornata)

Prerequisito per il cloud: definisce il confine dei dati per-profilo che poi diventerà la riga sul DB.

- [ ] Chiave localStorage namespaced per profilo: `arc-tracker:{profileId}`
- [ ] Chiave `profiles` con lista profili + profilo attivo
- [ ] UI switcher profilo (header) + crea / rinomina / elimina
- [ ] Migrazione automatica dei dati esistenti nel primo profilo

## Fase 2 — Supabase: dati di gioco + account + sync (~2-3 giorni)

### 2a. Schema dati di gioco (tabelle condivise, read-only per i client)

I JSON attuali sono un sottoinsieme minimo selezionato a mano: la tabella `items` completa
conterrà migliaia di record (tutto il catalogo MetaForge), per servire anche le feature future.

- [ ] `items` — catalogo completo: id, name, description, icon, rarity, value, `item_type` (colonna,
      eventualmente FK verso una `item_types` se servirà metadata per tipo), `stat_block` jsonb
      per gli attributi specifici (armi, scudi, ecc. hanno stat diverse → jsonb invece di 50 colonne)
- [ ] `workbenches` + `workbench_levels` (o jsonb `levels` sulla riga workbench) — requisiti di potenziamento
- [ ] Tabelle future quando serviranno: `maps`, `expeditions`, `projects`, …
      (weapons restano in `items` distinte da `item_type`, non tabella separata)
- [ ] Script di seed/aggiornamento da MetaForge (evoluzione di `fetch-items.mjs`, scrive su DB invece che su file)
- [ ] L'app legge i dati di gioco dal DB con cache locale (i dati cambiano solo a patch del gioco)

### 2b. Account e stato utente

- [ ] Auth Supabase: magic link email, poi OAuth Discord/Google
- [ ] `profiles` (id, user_id, name) — gli account di gioco di un utente
- [ ] `profile_state` (profile_id, state jsonb, updated_at) — inventario + livelli + obiettivi:
      dati "caldi" che cambiano insieme a ogni tap → un solo upsert, niente join
- [ ] RLS: ogni utente vede solo i propri profili

### 2c. Sync

- [ ] localStorage resta il layer primario (offline-first, ogni tap istantaneo)
- [ ] Sync in background verso Supabase con debounce (~2s dopo l'ultima modifica)
- [ ] Al login/avvio: confronto `updated_at` locale vs remoto, vince il più recente (last-write-wins)

## Fase 3 — Nuove funzionalità (effort da stimare per feature)

Ogni feature con ciclo di vita proprio = tabella dedicata (query mirate, niente caricamento totale).

- [ ] **Spedizioni** — tracking spedizioni attive/completate per profilo
- [ ] **Progetti** — tracking progressi progetti per profilo
- [ ] **Tour onboarding con driver.js** (~mezza giornata, ~5 KB gzip) — ~8 step attraverso i 3 tab
      (focus sul badge Refiner, la feature meno autoesplicativa). Richiede `data-tour` sugli elementi
      chiave e gestione del cambio tab negli hook (`onHighlightStarted` + attesa render); trigger al
      primo avvio via flag localStorage, replay da un'icona `?`. Evidenziare le card intere, non
      elementi che possono smontarsi (driver.js non è React-aware)
- [ ] **Internazionalizzazione completa (i18n)** (~1-2 giorni per l'infrastruttura + EN)
      - Libreria: react-i18next (standard de facto) o una soluzione leggera fatta in casa
        (le stringhe UI sono poche decine — valutare prima di aggiungere ~15 KB di dipendenza)
      - Estrarre tutte le stringhe UI hardcoded in italiano (label, tooltip, empty state,
        conferme) in file di traduzione per lingua
      - **Dati di gioco**: i nomi degli item da MetaForge sono solo in inglese; i nomi dei banchi
        in `workbenches.json` sono in italiano hardcoded → spostare i nomi localizzati in un
        campo per lingua (l'API hideout di mahcks ha già `name` multilingua completo: da, de, en,
        es, fr, it, ja, ko, pl, pt, ru, zh, … — recuperabile via script come per le icone)
      - Lingua iniziale da `navigator.language` con fallback EN, override manuale persistito
        in localStorage; con l'arrivo di Supabase diventa preferenza del profilo
      - Formattazione numeri/valute con `toLocaleString(lang)` (già usato per il valore item)
- [ ] **Checklist stampabile** (~mezza giornata) — esportare la lista della spesa corrente
      (materiali mancanti, filtrati per banchi attivi e obiettivi) in formato stampabile:
      - Via più semplice: vista print-friendly + `window.print()` con CSS `@media print`
        (nasconde nav/controlli, layout a lista compatta con checkbox vuote ☐, niente colori
        di sfondo per risparmiare inchiostro)
      - In alternativa/aggiunta: export PDF client-side (es. jsPDF) se serve condividerla
        (Discord, gruppo raid) senza passare dalla stampa del browser
      - Contenuto: nome materiale, mancanti/richiesti, badge Refiner (craftabile invece che
        da cercare), raggruppamento opzionale per banco di destinazione o per zona di loot
- [ ] Altre idee man mano

---

## Criteri di design dello schema

- **Dati che cambiano sempre insieme** (inventario + livelli) → jsonb unico in `profile_state`
- **Dati con ciclo di vita proprio** (una spedizione inizia e finisce) → tabella dedicata
- **Dati di gioco** (items, workbenches, maps) → tabelle condivise read-only, seed da script,
  mai duplicati per-utente
- **Attributi eterogenei per tipo** (stat delle armi vs consumabili) → `stat_block` jsonb,
  non colonne sparse
