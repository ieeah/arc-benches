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
- [ ] **Role Maker — randomizer di personalità** (~1 giorno, tutto client-side, nessun DB)
      Dopo ogni spedizione, "tirare un dado" che genera un profilo comportamentale da
      interpretare (roleplay) nella prossima run in superficie.

      **Matrice a 3 vettori** (scala 0-2 ciascuno), combinati per derivare il profilo:
      - *PvP* (aggressività verso altri Raider): 0 Pacifico/legittima difesa · 1 Opportunista
        (attacca solo deboli/isolati/con loot raro) · 2 Ostile KOS (caccia attiva)
      - *PvE* (focus macchine/bottino): 0 Evitante "rat" (niente rumore, loot minore, estrazione
        rapida) · 1 Cacciatore calcolato (contratti, ARC medi, rischi calcolati) · 2 Massimalista
        "chad" (zone ad alta densità, boss, depositi alto livello)
      - *Social* (emote/voice/segnali): 0 Fantasma (zero comunicazioni, fugge le interazioni) ·
        1 Guardingo (emote di tregua ma armi pronte) · 2 Samaritano (coordina via mic, rianima
        estranei, condivide risorse)

      **Archetipi predefiniti** (estratti dal dado, o varianti coerenti generate dalla matrice):
      - 🪐 *Il Santo di Speranza* (PvE puro/altruista) — PvP solo autodifesa, rianima gli
        estranei a terra, interviene ad aiutare, lascia i materiali extra a terra per gli altri
      - 🐀 *Il Topo di Fogna* (evitante/solitario) — evita ARC grossi e Raider, movimento
        accovacciato/condotti/fumogeni, fugge se avvicinato, pilucca i resti dei combattimenti altrui
      - ⚔️ *Il Cacciatore di Taglie* (neutrale-pragmatico) — non attacca a vista ma difende
        obiettivo ed estrazione in modo aggressivo dopo avvertimento; non si fida della voice chat
      - 🔥 *Il Mietitore KOS* (PvP puro) — spara a vista, imboscate ai terminali di estrazione,
        esche col loot a terra; ignora i contratti PvE, vive del loot rubato
      - 🎭 *Il Traditore Situazionale* (imprevedibile) — finge amicizia via voice/emote, aiuta
        contro un boss e tradisce subito dopo, mentre l'altro loota

      **Output**: profilo strutturato `personality_profile` con `name`, `tagline`,
      `matrix_values` (i 3 assi), `behavioral_rules` (3 regole operative), `winning_condition`
      (cosa rende la run un successo per quel profilo)

      **Varianti ed estensioni**:
      - Suggerimento loadout coerente con l'archetipo (Mietitore → armi meta PvP tipo
        Bobcat/Tempest; Topo → fumogeni e mobilità tipo Snap Hook; Santo → defibrillatore e scudi)
      - Niente assoluti: le regole generate devono avere sfumature condizionali
        (es. "amichevole finché non trovi un oggetto Epico")
      - UI: bottone "tira il dado" a fine spedizione, profilo corrente persistito e sempre
        visibile durante la run; storico dei ruoli interpretati (con Supabase → per profilo)
- [ ] **Drawer riepilogo requisiti banco** (~mezza giornata) — in Obiettivi E in Rifugio,
      icona "info" sulla card del banco che apre un drawer (stesso pattern di `ItemDetailSheet`:
      bottom sheet con `useScrollLock` + `overscroll-contain`) con vista informativa di TUTTI
      i materiali richiesti dal banco, divisi per livello (1, 2, 3…):
      - Per ogni livello: lista item con icona, nome, quantità, badge Refiner craftabile
      - Evidenziare visivamente i livelli già completati (es. spuntati/attenuati) e il prossimo
      - Estrarre il drawer-shell in un componente riusabile (`BottomSheet`) condiviso con
        ItemDetailSheet invece di duplicare overlay/lock/layout
---

- [ ] Altre idee man mano

---

## Fase 4 — UI/UX

- [x] **Navbar** — la classe `pb-safe` non esisteva (no-op): ora è una `@utility` reale su
      `env(safe-area-inset-bottom)` (con `viewport-fit=cover` in index.html), tab più alti (py-3)
- [x] **Stack badge** — badge `×N` sulle card dello Stash e riga "Stack" nel dettaglio oggetto;
      campo `stack_size` aggiunto a items.json e a `fetch-items.mjs` (da `stat_block.stackSize`)
- [x] **Input InventoryCard** — input `h-8` come i pulsanti -/+
- [x] **Automatismo priorità banchi** — in Obiettivi, al raggiungimento del livello massimo
      si apre un prompt che chiede se spostare il banco in fondo alla lista delle priorità.
      I banchi completati restano interattivi ma vanno in una sezione "Completati" (come in
      Rifugio); il corpo della card è estratto in `WorkbenchRow` (riusato da `SortableWorkbenchRow`)
- [x] **Gestione inventario al cambio livello banchi** — alzare il livello implica che il
      potenziamento è stato pagato in gioco: i materiali tracciati vengono scalati
      automaticamente (i non tracciati sono stati trovati e spesi → saldo zero); la conferma
      viene chiesta solo se un materiale posseduto serve anche ad altri banchi attivi
      ("conflitto": potrebbe essere riservato a quelli)
- [x] **Miglioramento UX in "Rifugio"** — un materiale richiesto viene attenuato con spunta verde
      quando l'inventario copre sia il suo requisito sia il fabbisogno totale degli altri
      obiettivi attivi (nessun "conflitto")
- [ ] **Accorpamento Rifugio + Obiettivi** (~mezza giornata) — i due tab dividono lo stesso
      oggetto (il banco) per funzione invece che per compito: stesse liste, doppia sezione
      "Completati", due strade per alzare il livello, e ogni feature nuova va fatta due volte
      (es. il drawer requisiti, speccato "in Obiettivi E in Rifugio").
      Un solo tab "Rifugio" con card a progressive disclosure:
      - Card chiusa (vista operativa, l'attuale Rifugio compattata): drag handle · nome ·
        `Lvl x/y` · chevron; requisiti del prossimo livello con badge craft; bottone verde
        "Completa potenziamento" quando pronto
      - Card espansa (tap sull'header): si aggiungono i pill Livello Attuale / Obiettivo e il
        toggle attivo (l'attuale Obiettivi)
      - Una sola sezione "Completati", prompt conflitto-inventario in un solo posto,
        "Ripristina" nell'header come azione di tab
      - Attenzione: il drag resta sull'handle (non sull'intera card), per convivere col
        tap-per-espandere e col TouchSensor (delay 200ms)
      - Da fare PRIMA delle feature di Fase 3: ogni aggiunta sui due tab raddoppia il costo
        dell'accorpamento
- [ ] **Tab Database nella bottom nav** (~1 ora, dopo l'accorpamento) — lo slot liberato in
      bottom nav va al Database: la pagina "Oggetti" (oggi nascosta, raggiungibile solo dal
      pulsante DB nell'header) diventa un tab di primo livello, futuro hub Database
      (Oggetti/Arcs/…). Il pulsante DB universale nel `SectionHeader` a quel punto si rimuove
- [ ] **Celebrazione "ce l'hai fatta!"** (~mezza giornata) — quando TUTTI i banchi sono al
      livello massimo:
      - Animazione confetti al completamento dell'ultimo upgrade (canvas-confetti, ~2 KB gzip,
        oppure CSS-only); sparata una volta sola — flag in localStorage, non a ogni visita
        (si resetta col "Ripristina" o se un livello viene corretto al ribasso)
      - In Stash, l'empty state attuale ("Nessun materiale richiesto…") distingue due casi:
        obiettivi semplicemente vuoti vs rifugio completato — nel secondo caso illustrazione
        SVG celebrativa a tema (rifugio/banchi maxati) con messaggio "Ce l'hai fatta!",
        coerente con dark mode (CSS variables / currentColor, non colori hardcoded)

---

## Criteri di design dello schema

- **Dati che cambiano sempre insieme** (inventario + livelli) → jsonb unico in `profile_state`
- **Dati con ciclo di vita proprio** (una spedizione inizia e finisce) → tabella dedicata
- **Dati di gioco** (items, workbenches, maps) → tabelle condivise read-only, seed da script,
  mai duplicati per-utente
- **Attributi eterogenei per tipo** (stat delle armi vs consumabili) → `stat_block` jsonb,
  non colonne sparse
