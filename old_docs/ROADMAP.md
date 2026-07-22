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

## Fase 1 — Multi-profilo locale ✅ (completata)

Prerequisito per il cloud: definisce il confine dei dati per-profilo che poi diventerà la riga sul DB.

- [x] Chiave localStorage namespaced per profilo: `arc-raiders-tracker-{profileId}`
- [x] Chiave `arc-raiders-tracker-profiles` con lista profili + profilo attivo
- [x] UI switcher profilo (chip nell'header Obiettivi → drawer bottom): switch, rename inline, delete con conferma, crea nuovo (auto-switch)
- [x] Migrazione automatica dei dati esistenti nel profilo "Principale"
- [x] Liste custom **condivisibili tra profili** (`shared: true`, immutabile dopo creazione): definizione globale (`arc-raiders-tracker-shared-lists`), progresso per-profilo; toggle in `CustomListEditor` alla creazione, con avviso che la condivisione non è reversibile (per rimuoverla da un profilo va eliminata da lì)
- [x] `getAllLists()` fa union `workbenches ∪ sharedCustomLists ∪ customLists`; tutte le action esistenti funzionano su liste condivise senza modifiche

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
- [ ] **Tieni o butta — indicatore "non vendere"** (effort: v1 ~mezza giornata, v2 dipende dai dati)
      Problema reale: molti oggetti non hanno un uso immediato ma vengono richiesti più avanti da
      missioni o progetti. Senza saperlo prima, si vendono "a occhio" e poi si fatica a ritrovarli
      quando servono. L'app deve dire a colpo d'occhio se un oggetto è da **tenere** o **vendibile**.

      **Stato derivato per oggetto** (non un flag manuale):
      - *Tieni* se richiesto da una qualsiasi fonte nota — banco (anche livelli oltre l'obiettivo
        attuale), progetto o missione — **anche se futuri / non ancora avviati**
      - *Vendibile* se nessuna fonte conosciuta lo richiede
      - Distinguere "serve ORA" (obiettivi attivi → già coperto dallo Stash) da "servirà
        PRIMA O POI" (qualsiasi requisito noto nel gioco): è quest'ultimo il valore nuovo, ciò
        che oggi non sai e ti fa vendere per sbaglio

      **Dati**: i requisiti dei banchi sono già in `workbenches.json` → la mappa item→usi-banco è
      derivabile subito (basta non fermarsi al livello obiettivo). Missioni/progetti richiedono dati
      nuovi → si appoggia ai **Progetti/Spedizioni** qui sopra e allo schema `items` completo della
      Fase 2 (i requisiti possono vivere come relazioni in DB o jsonb sull'item).

      **UX**: etichetta nel dettaglio oggetto ("⚠ Non vendere — serve per: Weapon Bench Lvl 3,
      Progetto X, Missione Y") e nella pagina Oggetti (Database), più un filtro "solo da tenere /
      solo vendibili". Attenzione al badge-clutter (stessa nota di "Zona di loot" in Fase 4):
      privilegiare dettaglio + filtro; badge sintetico sulle card solo se resta leggibile.

      **Incrementale**: v1 derivata solo dai banchi (già fattibile oggi, copre subito una fetta del
      problema); v2 estesa a missioni/progetti quando i relativi dati esistono.
- [x] **Liste custom + generalizzazione `List`** — FATTO.
      - **Tipo generico `List`** (`types.ts`): i banchi del gioco ne sono il seed read-only
        (`listType: 'workbench'`), le liste custom sono istanze utente (`custom: true`, id namespaced
        `custom:<uuid>`). `listType` resta ortogonale a `custom` (una custom potrà essere `project`/`quest`).
      - **Catalogo MetaForge completo** (~590 item) ingerito in `items.json` per l'item picker.
      - **Store**: slice `customLists` persistita, SEPARATA dall'array game `workbenches`; union via
        `getAllLists()` su cui operano tutti i selettori/azioni → aggregazione spesa, mancanti, priorità
        Stash, drag, hide, "Completati", bottone verde Rifugio gratis. CRUD `createCustomList`/
        `updateCustomList`/`deleteCustomList` con cleanup voci per-id.
      - **UI**: `CustomListEditor` (multi-stage) + `ItemPicker` (ricerca sul DB completo), "+ Lista" in
        Obiettivi, badge "Custom" + matita di modifica su `ListRow`.
      - **Rinominato** l'astrazione `Workbench`→`List`, `WorkbenchRow/Card/SortableWorkbenchRow`→
        `ListRow/ListCard/SortableListRow`, `getOrderedWorkbenches`→`getOrderedLists`, chiave
        `workbenchOrder`→`listOrder`. Tenuto "workbench" per il seed (`workbenches.json`, array
        `workbenches`, `listType:'workbench'`).
      - **Conseguenza**: Spedizioni, Progetti, Quest e "Tieni o butta" diventano istanze dello stesso
        motore (`listType` distingue etichette/icone/raggruppamenti), non feature da zero.
      - **Ancora da fare (Fase 2)**: migrazione persistenza da localStorage a tabella `lists` (game seed
        `custom=false`, custom per-profilo `custom=true` con RLS); il lavoro su localStorage NON è
        throwaway, il DB swappa solo il backend. Eventuale gating per `listType` di comportamenti che
        calzano sui banchi ma meno su quest/progetti (auto-deduzione inventario al level-up).
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
      - **L'inglese non va MAI escluso dalla ricerca**: anche con UI/nomi localizzati, la ricerca
        oggetti deve continuare a matchare il nome **inglese** oltre a quello localizzato (l'inglese
        è il nome "canonico" del gioco, quello che molti giocatori conoscono e usano nelle guide).
        In pratica il filtro confronta su `name[lang]` **e** `name['en']` (alias di ricerca sempre
        attivo); idealmente normalizzando accenti/maiuscole. Vale per `ItemsPage` e `ItemPicker`.
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
- [x] **Import / Export liste (JSON)** — esporta tutte le liste (banchi + custom) con stato
      (currentLevel, `targetLevels` come insieme di livelli, active) + **inventario** come file `.json`
      scaricabile. Import mergia per id: i banchi di gioco ripristinano solo lo stato, le liste custom
      anche la definizione; l'inventario viene ripristinato se presente nel file. Liste con `shared: true`
      vanno in `sharedCustomLists` all'import. Validazione struttura + banner errore inline. Formato
      `version: 2`; retrocompatibile con `version: 1`. Azioni Esporta/Importa nel drawer Azioni.
- [x] **Import/Export per profilo (formato v3)** — FATTO. Tutti gli export usano ora il formato unico
      `{ version: 3, sharedLists, profiles[] }` (sempre predisposto al multiprofilo, anche con un solo
      profilo selezionato). Modal di export con checkbox per profilo + master "Tutti i profili";
      `buildExportData()` legge il profilo attivo dallo store e gli altri da localStorage senza switch.
      Modal di import con checkbox profili (badge "Nuovo profilo" / "Sovrascrive esistente");
      `importMultiProfile()` mergia le `sharedLists` globali, salva ogni profilo selezionato e aggiorna
      lo stato live solo se coinvolge il profilo attivo. I file v1/v2 restano importabili (retrocompat).
- [x] **Livelli obiettivo come insieme + azioni checkbox + pagina dettaglio lista** — FATTO.
      - **`targetLevels` da soglia singola a insieme di livelli** (`Record<string, number[]>`): le
        pill "Livello Obiettivo" sono toggle indipendenti (vedi/ignora ogni livello), disaccoppiate
        dal livello attuale. Determinano cosa appare nello Stash, le azioni sulla card e tutto nel
        dettaglio. Migrazione automatica del vecchio formato numerico in `load()`. Convenienza:
        alzando il livello attuale, il livello successivo viene auto-aggiunto agli obiettivi.
      - **Azioni checkbox per livello** (`CheckboxAction`: id + label): definibili nell'editor liste,
        completamento in slice persistita `checkedActions` (key `listId|level|actionId`). Alzando il
        livello attuale le azioni dei livelli completati si auto-spuntano (restano correggibili a mano).
        Checkbox grande condiviso (`ActionCheckbox`) tra card, editor e dettaglio.
      - **Pagina dettaglio lista** (`ListDetailPage`, full-screen via tab in `App`, icona `Layers`
        sulla card): tutti i livelli con oggetti (posseduto/richiesto) e azioni, badge "Fatto" sui
        livelli ≤ attuale, toggle Obiettivo/Ignorato per livello.
      - **Editor liste**: inserimento livelli in mezzo/prima (non solo in coda), azioni con label,
        checkbox azione dinamico (riflette/aggiorna lo stato reale).
      - **Pulizia**: util locale `cn()` (in `lib/cn.ts`) al posto dei ternari nelle className.
      - **Rimandato**: interattività oggetti nel dettaglio (clone Stash con +/- vs azioni on/off).
- [ ] **Condivisione lista tramite link** (richiede Supabase) — un utente genera un link pubblico
      per una sua lista custom; chi lo apre la importa come copia nel proprio account, senza che i
      due utenti siano "amici" o abbiano bisogno di esportare/importare file JSON.

      **Modello**:
      - Ogni lista condivisibile ottiene un `share_token` (UUID v4 separato dall'id interno),
        generato on-demand al primo "Condividi" e persistito nella tabella `lists`.
      - L'URL è `https://<app>/share/<token>`: route pubblica che legge la definizione della lista
        (nome, items, livelli, azioni) senza autenticazione, e propone "Aggiungi alla mia app".
      - Chi importa riceve una **copia** indipendente (non un live-link): può modificarla liberamente,
        l'autore non vede le sue modifiche e viceversa. V2: "Segui aggiornamenti" (rif. al token,
        l'importer accetta o rifiuta eventuali aggiornamenti pubblicati dall'autore).
      - **RLS**: la riga lista è readable a tutti solo se `share_token IS NOT NULL`; la modifica
        rimane solo all'owner. Il token può essere revocato (reset a NULL) per disattivare il link.
      - **Schema**: colonna `share_token UUID UNIQUE NULL` sulla tabella `lists` (Fase 2);
        nessuna tabella aggiuntiva per v1. L'endpoint di import può essere una Supabase Edge Function
        o una query pubblica con RLS permissiva sulla colonna `share_token`.
      - **UI**: bottone "Condividi" nel menu ⋯ della card (solo su liste custom);
        copia il link negli appunti + mostra QR opzionale. Badge "Condivisa" sulla card.

- [ ] **Vista aggregata per banco (opzionale)** (~mezza giornata) — lo Stash resta volutamente
      una lista *aggregata e piatta* (è la ragion d'essere dell'app: ovviare alla mancanza di una
      vista d'insieme in-game). In aggiunta, una modalità/schermata secondaria che raggruppa i
      materiali mancanti per banco di destinazione (sezioni collassabili "Refiner Lvl 2",
      "Weapon Bench Lvl 3"…), per chi vuole capire *perché* gli serve un materiale. Non sostituisce
      la vista piatta: è un toggle / schermata separata.
---

- [ ] Altre idee man mano

---

## Fase 4 — UI/UX

- [x] **Sticky section headers** — tutte le pagine (Stash, Rifugio, Obiettivi, Oggetti) hanno
      l'header incollato in cima durante lo scroll: `sticky top-0 bg-white/80 dark:bg-black/80
      backdrop-blur-md z-10 border-b`. Il pattern è nel page wrapper, non in `SectionHeader`,
      così le pagine future lo ereditano senza modificare il componente.
- [x] **Navbar** — la classe `pb-safe` non esisteva (no-op): ora è una `@utility` reale su
      `env(safe-area-inset-bottom)` (con `viewport-fit=cover` in index.html), tab più alti (py-3)
- [x] **Stack badge** — badge `×N` sulle card dello Stash e riga "Stack" nel dettaglio oggetto;
      campo `stack_size` aggiunto a items.json e a `fetch-items.mjs` (da `stat_block.stackSize`)
- [x] **Input InventoryCard** — input `h-8` come i pulsanti -/+
- [x] **Automatismo priorità banchi** — in Obiettivi, al raggiungimento del livello massimo
      si apre un prompt che chiede se spostare il banco in fondo alla lista delle priorità.
      I banchi completati restano interattivi ma vanno in una sezione "Completati" (come in
      Rifugio); il corpo della card è estratto in `ListRow` (riusato da `SortableListRow`)
- [x] **Gestione inventario al cambio livello banchi** — alzare il livello implica che il
      potenziamento è stato pagato in gioco: i materiali tracciati vengono scalati
      automaticamente (i non tracciati sono stati trovati e spesi → saldo zero); la conferma
      viene chiesta solo se un materiale posseduto serve anche ad altri banchi attivi
      ("conflitto": potrebbe essere riservato a quelli)
- [x] **Miglioramento UX in "Rifugio"** — un materiale richiesto viene attenuato con spunta verde
      quando l'inventario copre sia il suo requisito sia il fabbisogno totale degli altri
      obiettivi attivi (nessun "conflitto")
- [x] **Accorpamento Rifugio + Obiettivi → pagina "Liste"** — FATTO. `ListsPage` (`UnifiedListCard` +
      `SortableUnifiedListCard`) sostituisce `HideoutPage` + `GoalsPage`. Bottom nav 3 tab → 2 tab
      (Stash / Liste, icona `LayoutList`). Card a **progressive disclosure** (`UnifiedListCard`):
      - **Card chiusa**: drag handle · nome · `Lvl x/y` · chevron; pill **Livello Attuale** (con
        prompt conflitto se necessario); requisiti prossimo livello con badge craft; bottone verde
        "Completa potenziamento" quando pronto.
      - **Card espansa** (tap sull'header): aggiunge pill **Livello Obiettivo**, toggle Attivo,
        azioni checkbox e (di nuovo) requisiti + bottone upgrade in fondo.
      - Stesso `space-y-3` / `border-t` / `px-4` in entrambi gli stati → gap tra le righe di pill
        identico tra chiuso e aperto.
      - Una sola sezione "Completati" (collassabile), prompt conflitto-inventario in un solo posto,
        sezioni *Banchi da lavoro* / *Liste personalizzate* / *Completati* preservate.
      - `HideoutPage`, `GoalsPage`, `ListCard`, `SortableListRow`, `ListRow` eliminati.
- [x] **Pillola di navigazione flottante (sostituisce la bottom nav)** — FATTO. `FloatingNav`
      sostituisce la `<nav>` a tab in basso. `SectionHeader` perde ThemeToggle e pulsante DB.
      - **2 pulsanti circolari**: primario (w-14, blu, icona pagina destinazione) + secondario (w-12,
        ghost, ⋯) con ordine speculare via `navSide` (default `'right'`, da localStorage `nav-side`).
      - **Menu ⋯** contestuale: su Liste → Profilo · + Lista · Esporta · Importa · Ripristina (rosso
        con conferma inline); su Stash → Nascondi completati (con checkmark); universali su entrambe:
        Database · Tema. Il tema non chiude il menu (toggle live visibile).
      - **`forwardRef` + `useImperativeHandle`** in `ListsPage` espone `openProfiles`, `createList`,
        `openExport`, `triggerImport`; `App.tsx` li richiama dai `pageMenuItems` via `listsPageRef`.
      - **Ripristina** gestito interamente in `FloatingNav` (stato `pendingDanger`, conferma inline)
        chiamando `store.resetProgress()` passato come `onClick` nell'item danger.
- [ ] **Revisione ordine voci menu ⋯ (FloatingNav)** — l'ordine attuale delle voci contestuali
      e universali nel menu della pillola va discussed e ridefinito (ergonomia + frequenza d'uso).
      Da fare in un momento dedicato.
- [x] **Sezioni collassabili in Obiettivi** — FATTO. Le liste sono raggruppate in sezioni
      collassabili (`CollapsibleSection`, animazione altezza con la grid-trick `0fr↔1fr`, 350ms):
      *Banchi da lavoro* (`listType: 'workbench'`), *Liste personalizzate* (`custom: true`) e
      *Completati* (chiusa di default). Stato aperto/chiuso persistito in localStorage
      (`goals-sections`). Drag & drop resta dentro la propria sezione.
- [x] **Componente `Drawer` riusabile con direzione configurabile** — FATTO. `Drawer` con prop
      `from: 'bottom' | 'top' | 'left' | 'right'`, animazioni slide-in/out per direzione + fade del
      backdrop, `useScrollLock`, chiusura animata (`isClosing`). Usato per il drawer Azioni in Obiettivi.
      Ora anche accessibile via `useDialog` (role=dialog, focus trap, Esc, ritorno focus).
- [x] **Header Obiettivi a due righe + drawer azioni** — FATTO. Header a due righe (riga 1: titolo +
      DB + tema; riga 2: `+ Lista` a sinistra, `Azioni ▲` a destra). "Azioni" apre un `<Drawer from="top">`
      con Esporta, Importa e **Ripristina** (in rosso, con conferma inline nel drawer). L'import chiede
      conferma con un modale che propone un backup (export) prima di procedere.
- [x] **ItemPicker mobile — selezione impossibile con pochi risultati** — FATTO. La search bar è stata
      spostata in fondo al picker (la tastiera la spinge su, i risultati restano nello spazio sopra) e i
      risultati ora crescono dall'alto: con 1-2 risultati le card sono in cima, sempre raggiungibili.
      Tap sul backdrop intelligente: primo tap fa `blur` (chiude la tastiera), secondo tap chiude il picker.
- [x] **Target tap troppo piccoli su mobile** — FATTO. I due bottoni icona (matita "Modifica" + layers
      "Dettaglio") su `ListRow` sono stati accorpati in un unico bottone `⋯` (w-9 h-9, ~44px) che apre un
      dropdown con le voci Dettaglio / Modifica (divider quando entrambe presenti, chiusura al click fuori).
- [x] **Testo e icone sezioni collassabili troppo piccoli su mobile** — FATTO. Titolo `CollapsibleSection`
      `text-xs` → `text-[13px] sm:text-sm`, badge count `text-[10px]` → `text-[11px] sm:text-xs`, chevron
      14 → 15px. Aggiunto `aria-expanded` per accessibilità.
- [x] **Bordo superiore card visibile quando sezione è chiusa** — FATTO. Mancava `overflow-hidden` sul div
      `grid` esterno di `CollapsibleSection`: il bordo della prima card sforava di 1px attraverso la clip
      della grid row a `0fr`.
- [ ] **Drawer filtri dalle pagine** (~1 ora per pagina, dopo `Drawer`) — lo stesso `<Drawer
      from="top">` usato in Obiettivi diventa il pattern standard per i filtri avanzati di ogni
      pagina. Filtri da definire pagina per pagina:
      - Stash: già ha i pill di sort inline; filtro per banco sorgente o per zona di loot
      - Rifugio: filtro per `listType` (banchi / liste custom / …)
      - Oggetti: filtro per rarità, tipo, craftabilità Refiner
- [ ] **Accesso al Database dal menu ⋯** (~superato dalla pillola) — scelta rivista: con la
      pillola flottante a 2 sole pagine NON si aggiunge un tab "Database". L'accesso alla pagina
      "Oggetti" (futuro hub Database: Oggetti/Arcs/…) passa dalla voce **Database** nel menu ⋯
      della pillola (universale, su entrambe le pagine); il pulsante DB nel `SectionHeader` si
      rimuove. Se in futuro il Database crescesse, valutare una terza destinazione nella pillola.
- [ ] **Celebrazione "ce l'hai fatta!"** (~mezza giornata) — quando TUTTI i banchi sono al
      livello massimo:
      - Animazione confetti al completamento dell'ultimo upgrade (canvas-confetti, ~2 KB gzip,
        oppure CSS-only); sparata una volta sola — flag in localStorage, non a ogni visita
        (si resetta col "Ripristina" o se un livello viene corretto al ribasso)
      - In Stash, l'empty state attuale ("Nessun materiale richiesto…") distingue due casi:
        obiettivi semplicemente vuoti vs rifugio completato — nel secondo caso illustrazione
        SVG celebrativa a tema (rifugio/banchi maxati) con messaggio "Ce l'hai fatta!",
        coerente con dark mode (CSS variables / currentColor, non colori hardcoded)
- [ ] **Barra di avanzamento globale** (~1-2 ore) — anello o barra in cima (Rifugio/Obiettivi)
      con la percentuale `materiali raccolti / totali` per gli obiettivi attivi, derivata da
      `getMissingMaterials()` (somma `owned` vs `required`, clamp 100%). Dà il senso di progresso
      che oggi manca del tutto. NB: è progresso sui *materiali*, NON sui raid — quanti raid servano
      è imprevedibile (RNG + PvPvE), quindi nessuna stima "raid mancanti".
- [ ] **Undo "Completa potenziamento"** (~2-3 ore) — `upgradeModule` scala l'inventario in modo
      irreversibile (abbassare il livello non rimborsa, by design). Un toast "Annulla" per qualche
      secondo dopo l'upgrade ripristina lo stato precedente (livello + inventario + target): è un
      undo dell'azione, non un rimborso manuale, quindi non viola l'invariante. Richiede uno
      snapshot dell'ultima azione (o un piccolo stack undo).
- [ ] **Feedback aptico sui controlli** (~1 ora) — `navigator.vibrate()` su tap +/- in
      `InventoryCard`, su completamento requisito e su "Completa potenziamento". L'app è web (e in
      prospettiva PWA): la Vibration API **è disponibile su Android (Chrome/Blink)** anche come web
      app/PWA, ma **iOS Safari NON la supporta** (Apple non la espone al web, nemmeno in PWA
      installata) → progressive enhancement: `if ('vibrate' in navigator)`, impulsi brevissimi
      (5-10ms), silenziosa dove non supportata. Si sposa con la celebrazione di fine gioco.
- [ ] **(Valutare) Zona di loot nello Stash** — il campo `loot_area` esiste già in `items.json` ed
      è mostrato solo nel dettaglio. Trasformerebbe lo Stash in "lista della spesa per raid". Rischio:
      troppi badge sulle card già dense → NON come badge permanente, ma semmai come
      **ordinamento/filtro "per zona"** (come gli altri pill di sort) o sezione nella vista
      aggregata. Bassa priorità, da valutare.

---

## Qualità del codice (performance · accessibilità · sicurezza · pulizia)

Rilevazioni da un'analisi del codice (giu 2026), ordinate per impatto dentro ogni area.

### Performance / correttezza

- [x] **`save()` serializzava l'intero DB di gioco a ogni azione** (bug risolto) — `save()` ora
      fa un pick esplicito delle 7 chiavi `PersistedState`; `workbenches` e `itemsInfo` (232 KB)
      non finiscono mai in localStorage.
- [ ] **Nessun selettore zustand → over-rendering + ricalcolo** — le pagine fanno
      `const store = useAppStore()` senza selettore: iscrizione all'intero store, ogni cambiamento
      ri-renderizza tutto e ricalcola i selettori non memoizzati (`getMissingMaterials`,
      `getTotalRequiredMaterials`, `getOrderedLists`) a ogni render. Innocuo a questa scala,
      ma anti-pattern da correggere prima di Supabase/multi-profilo: selettori mirati + `useShallow`.
      → Piano dettagliato: [`docs/zustand-optimization-plan.md`](docs/zustand-optimization-plan.md)
- [ ] **`itemPriorityIndex` nel comparatore di sort** — in `StashPage` è O(banchi×livelli) e viene
      chiamato 2× per confronto durante `.sort()`. Precalcolare una `Map<itemId, priorità>` prima
      del sort. (Stesso pattern: `getOrderedLists` usa `indexOf` nel comparatore → O(n²).)
      → Coperto dal piano sopra (`priorityMap` con `useMemo` + `getOrderedListsPure` con `Map`).
- [ ] **`useLongPress` doppio conteggio** — l'`onClick` del bottone spara comunque al rilascio,
      sommandosi ai tick dell'interval; nessun incremento immediato alla pressione. Conteggio non
      perfettamente prevedibile su pressioni lunghe.

### Accessibilità

- [x] **Dialog accessibili + shell `BottomSheet` condiviso** — FATTO. Hook `useDialog`
      (`src/hooks/useDialog.ts`): `role="dialog"`/`aria-modal`, focus trap, chiusura con Esc, ritorno
      del focus al trigger, stack per dialog annidati (solo il topmost reagisce). Nuovo componente
      `BottomSheet` (mobile-bottom / desktop-center) che assorbe gli overlay fatti a mano: migrati
      `ItemDetailSheet`, `ItemPicker` (con backdrop "intelligente" preservato) e `CustomListEditor`;
      anche `Drawer` usa `useDialog`. Restano i modali centrati import/export (da migrare con lo
      scorporo di `GoalsPage`).
- [ ] **Drag & drop non operabile da tastiera** — solo `PointerSensor` + `TouchSensor`; manca il
      `KeyboardSensor` di dnd-kit per riordinare le priorità senza mouse/touch.
- [ ] **Controlli icona-only senza label** — i pill di livello (`LevelPills`), i bottoni +/-
      (`InventoryCard`) e il toggle "attivo" (`ListRow`) non hanno `aria-label`/label
      associata. Le segnalazioni solo-colore (rarità/craft) hanno per lo più `title`/`aria-label`,
      ma verificare la copertura.
- [ ] **Contrasto testo minuto** — molte etichette `text-[10px]`/`text-[11px]` in `text-gray-400`
      rischiano di non superare WCAG AA su sfondo chiaro. Verificare i contrasti chiave.

### Sicurezza

L'app è client-only (nessun backend a runtime, dati di gioco statici nel bundle, icone locali):
superficie d'attacco ridotta, niente `dangerouslySetInnerHTML`/`eval`, React escapa nomi/descrizioni.

- [x] **Validare input deserializzati** — FATTO. Modulo `src/lib/validate.ts` (type-guard hand-rolled,
      zero-dep): sanitizza ogni confine di deserializzazione — `loadProfileState`/`loadProfilesMeta`/
      `loadSharedLists` (localStorage manomettibile) e `parseImport` v1/v2/v3 (file esterni). Policy:
      leniente in load (scarta voci corrotte, tiene le valide), strutturalmente stretta in import
      (rifiuta file malformati, sanifica i contenuti). Numeri ≥ 0, id non vuoti, liste/livelli/azioni
      validati; `activeProfileId` stale → fallback al primo profilo. Stessi guard riusabili per i
      payload di sync (Fase 2).
- [ ] **CSP (hardening, opzionale)** — nessuna Content-Security-Policy. Su GitHub Pages si può
      aggiungere un meta CSP restrittivo (`default-src 'self'`, + CDN icone se servisse) per ridurre
      l'impatto di eventuale codice iniettato.
- [ ] **(Già in roadmap)** Auth + RLS Supabase, last-write-wins sul sync — vedi Fase 2.

### Pulizia del codice

- [x] **`src/App.css` è codice morto** — FATTO. Residuo del template Vite, non importato da nessuna
      parte (`main.tsx` importa solo `index.css`). Eliminato.
- [ ] **Voce "fantasma" in `workbenches.json`** — `workbench` con `maxLevel: 0` filtrata all'init
      (`w.maxLevel > 0`). Documentare perché esiste o rimuoverla dai dati.
- [ ] **Logica duplicata `activeWBs`/`maxedWBs`** — lo split attivi/completati è ripetuto identico
      in `HideoutPage` e `GoalsPage`; assorbito naturalmente dall'accorpamento dei due tab (Fase 4).
- [ ] **Magic string e chiavi sparse** — `'refiner'`, le chiavi localStorage (`theme`, `stash-sort`,
      `STORAGE_KEY`) e gli id banco sono letterali sparsi; centralizzarli (un modulo `keys.ts`).
- [ ] **Ricerca Oggetti solo per nome** — `ItemsPage` filtra solo `name`; estendere a tipo/rarità.

---

## Criteri di design dello schema

- **Dati che cambiano sempre insieme** (inventario + livelli) → jsonb unico in `profile_state`
- **Dati con ciclo di vita proprio** (una spedizione inizia e finisce) → tabella dedicata
- **Dati di gioco** (items, workbenches, maps) → tabelle condivise read-only, seed da script,
  mai duplicati per-utente
- **Attributi eterogenei per tipo** (stat delle armi vs consumabili) → `stat_block` jsonb,
  non colonne sparse
- **Liste tracciabili unificate** (banchi, progetti, quest, custom) → un'unica entità `List`
  con `custom: boolean` (game read-only vs per-profilo) e `listType` (categoria semantica,
  ortogonale a `custom`); i `levels` coprono flat (livello unico) e multi-stage. Un solo motore di
  "requisiti di materiali" invece di feature parallele; i selettori esistenti restano invariati.
