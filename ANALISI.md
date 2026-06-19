# Analisi tecnica — ARC Benches

> Revisione completa del codice (giugno 2026) in vista delle prossime feature, della
> migrazione a DB esterno (Supabase) + auth + sync, e di un consolidamento della qualità.
> Documento di indirizzo: i task qui descritti vanno poi riportati/spuntati in `ROADMAP.md`.

**Scope della revisione**: letti tutti i 36 file sorgente (`src/**`). Tre aree richieste —
accessibilità, architettura, qualità del codice — più la nuova regola sui drawer.

---

## 0. Sintesi (TL;DR)

L'app è **solida e funzionalmente matura** come tracker local-only. Il modello dati `List`
è ben progettato e pronto per il DB; la separazione pagine↔componenti è rispettata; la UX
mobile è curata. I tre punti deboli, in ordine di urgenza:

1. **La persistenza è inlined in ~15 action** (`saveProfileState(...)` ripetuto). È il singolo
   ostacolo più grosso verso il sync: oggi non esiste **un solo punto** dove intercettare le
   modifiche per spedirle a Supabase. Va creato un *boundary di persistenza* unico **prima** del DB.
2. **Nessun confine di validazione** sui dati deserializzati. Con import/export ormai live, JSON
   esterno non fidato entra dritto nello store e in localStorage.
3. **Accessibilità dei modali/drawer assente** (no `role=dialog`, no focus trap, no Esc) e
   **componenti enormi** (`GoalsPage` ~660 righe, `store.ts` ~680 righe).

Nessuno di questi è bloccante per l'uso attuale, ma tutti e tre **scalano male** con le feature
in arrivo. Conviene saldarli ora, mentre la superficie è ancora piccola.

---

## 1. Regola dei Drawer (registrata)

**Regola** (aggiunta a `CLAUDE.md`): un `Drawer` si apre sempre dal lato del pulsante che lo
attiva. Trigger in alto → `from="top"`; in basso → `from="bottom"`; laterale → `left`/`right`.
Le direzioni laterali restano supportate da `Drawer` per usi futuri (menu a comparsa).

**Violazione esistente da correggere**: in `GoalsPage`, il **drawer Profili** è triggerato dal
chip nell'header (in alto) ma usa `from="bottom"`. Va portato a `from="top"`. Il drawer Azioni è
già corretto (`from="top"`, trigger in header).

> Nota: `ItemDetailSheet`, `ItemPicker`, `CustomListEditor` e i modali import/export NON usano
> ancora il componente `Drawer` (sono overlay/bottom-sheet fatti a mano — vedi §4 e la nota
> *BottomSheet* in ROADMAP). Quando verranno migrati sullo shell `Drawer`, erediteranno la regola.

---

## 2. Accessibilità

L'app non è ad oggi utilizzabile con tastiera o screen reader senza attriti importanti.

### 2.1 Dialog/overlay non accessibili (priorità ALTA)
Tutti gli overlay (`Drawer`, `ItemDetailSheet`, `ItemPicker`, `CustomListEditor`, modali
import/export) condividono le stesse lacune:
- manca `role="dialog"` + `aria-modal="true"` e un `aria-label`/`aria-labelledby` sul titolo;
- nessun **focus trap**: il focus può uscire dietro l'overlay;
- nessuna chiusura con **Esc**;
- nessun **ritorno del focus** all'elemento che ha aperto il modale;
- il backdrop è un `<div onClick>`: non operabile da tastiera.

→ Da risolvere **una volta sola** estraendo lo shell condiviso `BottomSheet`/`Drawer` (vedi §4.1):
un solo componente accessibile invece di cinque overlay da sistemare singolarmente.

### 2.2 Controlli icona-only / senza label associata
- `InventoryCard`: i bottoni +/- non hanno `aria-label` ("Aumenta/Diminuisci quantità"); l'input
  numerico non ha `<label>` associata (solo placeholder visivo via testo accanto).
- `LevelPills`: i bottoni contengono solo il numero → uno screen reader legge "2" senza contesto
  ("Livello attuale 2", "Obiettivo livello 3, selezionato").
- `ListRow`: la checkbox attiva/disattiva è un `<input type=checkbox>` nudo, senza label.
- `SortableListRow`: l'handle di drag (`GripVertical`) è un bottone senza `aria-label`.
- Il menu `⋯` (appena introdotto) ha `title` sul trigger ma il dropdown non è un `role="menu"`
  con `role="menuitem"` e frecce su/giù.
- `TabButton`: ha label testuale (bene) ma manca `aria-current`/semantica tab.

*Buone pratiche già presenti*: `IconButton` usa sistematicamente `title`; le icone immagine hanno
`alt`; i badge craft hanno `title`/`aria-label`; `CollapsibleSection` ora ha `aria-expanded`
(manca `aria-controls` verso il contenuto).

### 2.3 Tastiera
- **Drag & drop non operabile da tastiera**: solo `PointerSensor` + `TouchSensor`, manca il
  `KeyboardSensor` di dnd-kit (già in ROADMAP).
- Dropdown `⋯` si chiude solo su `mousedown`, non su Esc né su blur; non navigabile da tastiera.
- Modali non chiudibili con Esc (vedi §2.1).

### 2.4 Contrasto colore
- Uso pervasivo di `text-gray-400` a `text-[10px]`/`text-[11px]` (label "LIVELLO ATTUALE", count,
  sottotitoli): rischia di non superare **WCAG AA** su sfondo chiaro. Da verificare i contrasti
  chiave e, dove serve, scurire a `text-gray-500`/`-600` (già in ROADMAP).
- Stato per solo-colore: per lo più mitigato (la rarità ha anche testo nel dettaglio; "raccolto"
  ha icona + opacità; craft ha icona + title). `LevelBadge` distingue ready/maxed/default solo col
  colore ma il testo "Lvl x/y" resta sempre presente → accettabile.

---

## 3. Architettura (verso DB esterno + auth + sync)

Il modello dati è già ben orientato al DB (vedi *Criteri di design dello schema* in ROADMAP).
Le criticità sono nel **come** lo stato viene persistito e ricalcolato, non nella sua forma.

### 3.1 Boundary di persistenza unico — PREREQUISITO del sync (priorità ALTA)
Oggi ogni action fa esplicitamente `saveProfileState(s.activeProfileId, {...s, override})`
(ripetuto ~15 volte). Funziona, ma:
- è facile da dimenticare in una nuova action o passare l'`override` sbagliato;
- **non c'è un solo punto** dove agganciare il sync remoto. Per Supabase servirebbe ri-toccare
  tutte le action.

→ **Introdurre ora** un unico chokepoint di persistenza: una `useAppStore.subscribe(...)` che,
a ogni cambio dello slice persistito, fa il *pick* delle 8 chiavi e scrive con **debounce**.
Le action tornano a fare solo `set(...)`. Lo strato sync (Fase 2) si innesta su quell'unico
subscribe (debounce → upsert Supabase, last-write-wins su `updated_at`).
*Compatibile* con la scelta di CLAUDE.md di non usare il middleware `persist` (errori silenziosi):
qui la persistenza resta esplicita e in try/catch, ma centralizzata.

### 3.2 `store.ts` è un god-module (~680 righe)
Inventario, progressi, liste custom, import/export, profili e selettori in un'unica `create()`.
Dopo il multi-profilo è diventato difficile da navigare e impossibile da testare a pezzi.
→ Adottare il **slice pattern** di Zustand (slice inventory / lists / profiles / progress) e/o
estrarre la logica pura (selettori, migrazioni, IO) in moduli separati, lasciando allo store solo
l'orchestrazione. Propedeutico anche ai test (§4.4).

### 3.3 Selettori non memoizzati + subscription a tutto lo store (priorità MEDIA)
Le pagine fanno `const store = useAppStore()` → si iscrivono all'intero store; ogni cambiamento
ri-renderizza tutta la pagina e ricalcola `getMissingMaterials`/`getOrderedLists`/
`getTotalRequiredMaterials` (non memoizzati) a ogni render. Innocuo a questa scala, ma con il
**sync** un update remoto ri-renderizzerebbe tutto. → Selettori mirati + `useShallow`, e
memoizzazione dei selettori pesanti. (Già in ROADMAP.)

### 3.4 Validazione dei dati deserializzati (sicurezza, priorità ALTA)
`load()`, `loadProfileState()`, `parseImport()` fanno `JSON.parse` + cast `as` senza validazione
runtime. Con import/export live, è input esterno non fidato che finisce nello store e in
localStorage; domani sarà anche il payload di sync. → Aggiungere uno strato di validazione
(zod, oppure type-guard fatti a mano: chiavi note, numeri ≥ 0, id esistenti, livelli coerenti)
al confine di deserializzazione. Stesso confine riusabile per i payload remoti. (Già in ROADMAP,
sezione Sicurezza — qui sale di priorità.)

### 3.5 Versionamento dello schema persistito
Esiste solo la migrazione ad-hoc `migrateTargets` (number → number[]). Man mano che la forma
persistita evolve (e prima del DB) conviene un campo `schemaVersion` per profilo + una pipeline di
migrazioni ordinate, così la logica one-off smette di accumularsi sparsa nell'init.

### 3.6 Strategia degli ID
I profili usano `crypto.randomUUID()` (tranne `'default'`); le liste custom `custom:<uuid>`.
Per Supabase + RLS va bene generare gli UUID lato client. → Documentare la strategia e decidere
cosa fare di `'default'` (rinominarlo in un UUID alla prima sync, o tenerlo come id riservato).

### 3.7 Routing assente
La navigazione è `useState<Tab>` in `App.tsx` con tab nascosti (`items`, `list-detail`) e un
`returnTab`. Conseguenze: niente URL/deep-link, il back del browser esce dall'app, lo stato di
`ListDetailPage` si perde al refresh. Regge oggi, ma con l'hub Database e più pagine di dettaglio
il pattern `returnTab`/tab-nascosti diventa fragile. → Valutare un router (anche solo hash-based)
come decisione di medio termine, idealmente prima di moltiplicare le pagine.

### 3.8 Tema e preferenze: globali o per-profilo?
Il tema è un Context con persistenza propria (`localStorage 'theme'`), globale per device. Con i
profili (e, in Fase 2, la lingua che diventa preferenza di profilo) va deciso e documentato se
tema/lingua sono preferenze **device** o **profilo**. Scelta da prendere prima del sync.

### 3.9 Chiavi e magic string come parte del contratto
`'refiner'` hardcoded in 4 file; chiavi localStorage sparse (`theme`, `stash-sort`,
`goals-sections`, le chiavi profilo nello store). Prima del sync queste chiavi diventano parte del
contratto dati. → Centralizzarle in un modulo `keys.ts`/`constants.ts`. (Già in ROADMAP.)

---

## 4. Qualità del codice

Principio guida richiesto: niente funzioni/componenti enormi; preferire **util condivise e hook**
alla logica inline nei componenti; usare le best practice in modo **consistente** (es. `cn()`
introdotta ma non ancora adottata ovunque).

### 4.1 Shell di overlay duplicato → estrarre `BottomSheet` (alta leva)
`ItemDetailSheet`, `ItemPicker`, `CustomListEditor` e i modali in `GoalsPage` re-implementano ogni
volta lo stesso overlay (`fixed inset-0 bg-black/60 flex items-end … rounded-t-[28px]` +
`useScrollLock` + stop-propagation). Il componente `Drawer` esiste già ma è nato dopo. → Estrarre
un unico `BottomSheet`/consolidare su `Drawer`: **un solo refactor che chiude insieme la DRY e
quasi tutta l'accessibilità dei modali** (§2.1). È il refactor a leva più alta del lotto.

### 4.2 Componenti troppo grandi
- **`GoalsPage.tsx` (~660 righe)** — il caso peggiore. Contiene layout, DnD, sezioni, **drawer
  Profili** (~95 righe con stato proprio), **modale Export**, **modale Import**, **drawer Azioni**.
  → Scorporare in: `ProfilesDrawer`, `ExportModal`, `ImportModal`, `ActionsDrawer` (ognuno col
  proprio stato locale). La pagina torna a orchestrare.
- **`CustomListEditor.tsx` (~310 righe)** — coeso ma grande: estrarre `LevelEditor` (blocco
  per-livello) e l'editor delle azioni.
- **`store.ts` (~680 righe)** — vedi §3.2.

### 4.3 Logica nei componenti da spostare in selettori/util/hook
- `StashPage`: `itemPriorityIndex` + comparatore di sort è logica di dominio nel componente (oltre
  a essere O(n²), vedi ROADMAP). → Selettore `getOrderedMissingMaterials(sortKey, dir)` nello store
  con una `Map<itemId, priorità>` precalcolata.
- **Split attivi/completati duplicato** in `HideoutPage` e `GoalsPage` (`< maxLevel` / `>= maxLevel`).
  → Selettore condiviso (`getActiveLists()`/`getMaxedLists()`). Verrà assorbito dall'accorpamento
  Rifugio+Obiettivi, ma un selettore aiuta già ora.
- **`hideoutLevels['refiner'] ?? 0`** ripetuto in 4 file. → `getRefinerLevel()` (uccide anche la
  magic string `'refiner'`).
- **Lettura+parse localStorage con default** ripetuta inline in `StashPage` (sort), `GoalsPage`
  (sections), `ThemeProvider`. → Hook `useLocalStorageState` (basato su `safeLS`).
- **`baseLevel`** (`levels.find(l=>l.level===1)?.requirementItemIds.length===0 ? 1 : 0`) duplicato
  in `ListRow` e `ListDetailPage`. → util `getBaseLevel(list)`.
- Logica di **copertura materiale** ("collected"/"enough"/"conflict") in forme leggermente diverse
  in `ListCard`, `ListRow` e `ListDetailPage`. → util/selettore `materialStatus(...)` condiviso.

### 4.4 Adozione incoerente di `cn()`
`cn()` è usata in `LevelPills`, `ActionCheckbox`, `ListDetailPage`, ma molti componenti usano
ancora ternari in template literal nelle className: `InventoryCard`, `ListCard`, `ListRow`,
`SortableListRow`, `TabButton`, `LevelBadge`, `StashPage`, `ItemsPage`, `ItemDetailSheet`,
`CustomListEditor`, gran parte di `GoalsPage`. → Standardizzare su `cn()` ovunque (pass meccanico,
basso rischio, alta coerenza).

### 4.5 Dead code e residui
- **`src/App.css`** è interamente template Vite, non importato da nessuna parte. → Eliminare
  (già in ROADMAP).
- `index.css` dichiara `font-family: Inter` su `:root` ma **Inter non è caricato** (no `@font-face`
  / no `<link>`): si cade su `system-ui`. → O si carica Inter, o si toglie il riferimento.

### 4.6 `useLongPress` — correttezza
Due problemi: (1) l'`onClick` del bottone spara comunque al rilascio, sommandosi ai tick
dell'interval, e non c'è incremento immediato alla pressione (già in ROADMAP); (2) `callback`
cambia identità a ogni render (arrow inline nei call site) → mentre `active`, l'effect si ri-esegue
a ogni render del parent, azzerando e ricreando l'interval. → Tenere l'ultimo callback in un `ref`
e incrementare subito alla pressione, poi avviare l'interval.

### 4.7 Assenza totale di test
Non esiste infrastruttura di test. Per i refactor in arrivo (boundary di persistenza, split dello
store, accorpamento Rifugio+Obiettivi, sync) conviene introdurre almeno **unit test** su:
selettori dello store, migrazioni, `parseImport`/validazione. È il modo più economico per
de-rischiare i refactor strutturali sotto.

---

## 5. Piano prioritizzato

Legenda: 🔴 fare prima (sblocca/mette in sicurezza) · 🟠 alto valore · 🟡 rifinitura · 🔵 pre-Supabase.

| # | Intervento | Tipo | Pri | Effort | Dipende da / Note |
|---|---|---|---|---|---|
| 1 | **Boundary di persistenza unico** (subscribe + debounce) | Arch | 🔴 | ~mezza gg | §3.1 — prerequisito del sync |
| 2 | **Validazione input deserializzati** (load + import) | Sicurezza | 🔴 | ~1-2 h | §3.4 — import/export è live |
| 3 | **Estrarre `BottomSheet`/`Drawer` condiviso** (+a11y dialog) | Qualità/A11y | 🔴 | ~mezza gg | §4.1 + §2.1, chiude due aree insieme |
| 4 | **Fix direzione drawer Profili** (`from="top"`) | UI/regola | 🔴 | 5 min | §1 |
| 5 | **Rimuovere `src/App.css`** | Pulizia | 🔴 | 5 min | §4.5 |
| 6 | **Accorpamento Rifugio + Obiettivi** | Arch/UX | 🟠 | ~mezza gg | keystone (vedi ROADMAP); idealmente dopo #3 |
| 7 | **Scorporare `GoalsPage`** (ProfilesDrawer/Export/Import/Actions) | Qualità | 🟠 | ~mezza gg | §4.2; si semplifica dopo #3 |
| 8 | **Slice pattern per `store.ts`** + estrazione logica pura | Arch | 🟠 | ~mezza gg | §3.2; abilita i test |
| 9 | **Selettori condivisi** (refiner, split attivi/maxed, baseLevel, materialStatus) | Qualità | 🟠 | ~2-3 h | §4.3 |
| 10 | **Adozione `cn()` ovunque** | Qualità | 🟡 | ~1-2 h | §4.4, pass meccanico |
| 11 | **A11y controlli** (aria-label +/-, pills, checkbox, drag; Esc; KeyboardSensor) | A11y | 🟡 | ~mezza gg | §2.2-2.3 |
| 12 | **Contrasto colore** (audit text-gray-400 minuto) | A11y | 🟡 | ~2 h | §2.4 |
| 13 | **`keys.ts`/`constants.ts`** (chiavi LS + magic string) | Arch | 🔵 | ~1 h | §3.9 |
| 14 | **Selettori memoizzati + `useShallow`** | Perf | 🔵 | ~mezza gg | §3.3, prima del sync |
| 15 | **`schemaVersion` + pipeline migrazioni** | Arch | 🔵 | ~2-3 h | §3.5 |
| 16 | **Infrastruttura test** (store/IO/validazione) | Qualità | 🔵 | ~mezza gg | §4.7, de-rischia i refactor |
| 17 | **Fix `useLongPress`** (ref callback + press immediato) | Qualità | 🟡 | ~1 h | §4.6 |
| 18 | **Decidere routing** (hash/router) e tema/lingua per-profilo | Arch | 🔵 | decisione | §3.7-3.8, prima di nuove pagine |

### Sequenza consigliata
**Blocco 1 — igiene e sicurezza (rapido)**: #4, #5, #2 → poi #3 (shell condiviso) che apre la
strada sia all'a11y dei modali sia allo scorporo di GoalsPage.
**Blocco 2 — strutturale**: #1 (boundary persistenza) e #8 (slice store) insieme, perché toccano
le stesse action; #6 (accorpamento) come keystone UX subito dopo; #7 scorporo GoalsPage.
**Blocco 3 — pre-Supabase**: #14, #13, #15, #16 — saldare il debito prima di aprire il cantiere
Fase 2 (DB + auth + sync).
Le rifiniture (#9, #10, #11, #12, #17) si possono intercalare come riempitivo a basso rischio.

---

## 6. Prioritizzazione pesata (semplicità × valore × architettura)

La §5 ordina per intuizione (🔴🟠🟡🔵). Qui la stessa lista è **pesata** con un modello esplicito,
così la classifica è verificabile e ri-discutibile cambiando i pesi.

### 6.1 Modello
Tre assi, ognuno 1-5 (5 = meglio):
- **S — Semplicità implementativa**: 5 = minuti, basso rischio; 1 = refactor ampio e rischioso.
- **V — Valore per l'utente**: 5 = percepito subito da tutti; 1 = invisibile all'utente.
- **A — Priorità architetturale**: 5 = sblocca/mette in sicurezza il resto (sync, DB); 1 = ininfluente.

**Pesi scelti**: `W = 0.40·A + 0.35·V + 0.25·S`. Razionale: siamo in **fase di consolidamento
pre-DB**, quindi l'architettura pesa di più (è il macigno in arrivo); il valore utente tiene l'app
degna d'uso; la semplicità è un fattore di *momentum*/tiebreak, non l'obiettivo. Chi non condivide
i pesi può ricalcolare `W` dalla tabella.

### 6.2 Classifica
Ordinata per `W` decrescente. I numeri `#` sono quelli della tabella §5.

| # | Intervento | S | V | A | **W** |
|---|---|:-:|:-:|:-:|:-:|
| 6 | Accorpamento Rifugio + Obiettivi | 2 | 4 | 4 | **3.50** |
| 3 | Estrarre `BottomSheet`/`Drawer` condiviso (+a11y) | 3 | 3 | 4 | **3.40** |
| 2 | Validazione input deserializzati | 4 | 2 | 4 | **3.30** |
| 1 | Boundary di persistenza unico | 3 | 1 | 5 | **3.10** |
| 8 | Slice pattern per `store.ts` | 3 | 1 | 4 | **2.70** |
| 16 | Infrastruttura test | 3 | 1 | 4 | **2.70** |
| 14 | Selettori memoizzati + `useShallow` | 3 | 2 | 3 | **2.65** |
| 11 | A11y controlli (label, Esc, KeyboardSensor) | 3 | 3 | 2 | **2.60** |
| 9 | Selettori condivisi (refiner/split/baseLevel/…) | 4 | 1 | 3 | **2.55** |
| 13 | `keys.ts`/`constants.ts` | 4 | 1 | 3 | **2.55** |
| 12 | Contrasto colore | 4 | 3 | 1 | **2.45** |
| 10 | Adozione `cn()` ovunque | 5 | 1 | 2 | **2.40** |
| 18 | Decisione routing + tema/lingua per-profilo | 2 | 2 | 3 | **2.40** |
| 4 | Fix direzione drawer Profili | 5 | 2 | 1 | **2.35** |
| 7 | Scorporare `GoalsPage` | 3 | 1 | 3 | **2.30** |
| 15 | `schemaVersion` + pipeline migrazioni | 3 | 1 | 3 | **2.30** |
| 17 | Fix `useLongPress` | 4 | 2 | 1 | **2.10** |
| 5 | Rimuovere `src/App.css` | 5 | 1 | 1 | **2.00** |

### 6.3 Letture trasversali
- **I 4 in testa (6, 3, 2, 1) sono il vero cuore**: staccano dal resto perché combinano alto
  impatto architetturale e/o valore. Sono gli interventi su cui concentrare l'energia.
- **Impatto ≠ ordine di esecuzione.** #6 (accorpamento) è il più impattante (W 3.50) ma **non va
  per primo**: farlo *sopra* overlay duplicati (#3) e logica di split duplicata (#9) costa e rischia
  di più. L'ordine reale segue **dipendenze e rischio**, non solo `W`.
- **Quick win a costo ~nullo** (`S=5`): #5 e #4 hanno `W` basso (poco impatto) ma si fanno in
  minuti → si tolgono dal tavolo subito, non perché "valgano" molto ma perché costano zero.
- **Trappola della semplicità**: #10/#12/#17 sono facili e invoglianti, ma a basso impatto: vanno
  usati come **riempitivo** tra i blocchi pesanti, non come scusa per rimandare lo strutturale.

### 6.4 Ordine di esecuzione consigliato (riconcilia W + dipendenze + rischio + momentum)
- **Sprint 0 — sgombra il tavolo (minuti):** #5 (App.css), #4 (drawer Profili). Zero rischio.
- **Sprint 1 — sicurezza + abilitatore:** #2 (validazione) e #3 (`BottomSheet`). In più, **test
  minimi** su `parseImport`/validazione (anticipo di #16 su target stabili e a basso costo).
- **Sprint 2 — cuore strutturale:** #1 (boundary persistenza) + #8 (slice store) **insieme**
  (toccano le stesse action); poi #9 (selettori condivisi) per togliere duplicazione **prima**
  dell'accorpamento.
- **Sprint 3 — keystone UX:** #6 (accorpamento Rifugio+Obiettivi), poi #7 (scorporo `GoalsPage`,
  più facile dopo #3).
- **Sprint 4 — debito pre-Supabase:** #16 (estensione test sul nuovo store), #13, #14, #15, #18.
- **Riempitivo intercalabile (basso rischio):** #10 (`cn()`), #11 (a11y controlli), #12 (contrasto),
  #17 (`useLongPress`).

> Differenza con la §5: là la sequenza era a blocchi tematici; qui è la **stessa direzione** ma
> giustificata dai punteggi e con i quick win esplicitamente anticipati allo Sprint 0.

---

## 7. Note per il mantenimento di questo documento
- I task qui sopra vanno riflessi in `ROADMAP.md` man mano che si pianificano/chiudono; questo
  file è la **fotografia di analisi** (il *perché*), ROADMAP è la **lista operativa** (il *cosa*).
- Rivedere l'analisi dopo l'accorpamento Rifugio+Obiettivi e dopo l'introduzione del boundary di
  persistenza: entrambi cambiano abbastanza la mappa da giustificare un aggiornamento.
