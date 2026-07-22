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
Oggi ogni action fa esplicitamente `saveProfileState(s.activeProfileId, {...s, override})`.
- **Problema**: 15 righe duplicate nello store; se domani serve inviare un evento di sync al
  DB, va aggiunto in 15 punti. Se una action dimentica `saveProfileState`, la modifica resta
  solo in memoria.
- **Soluzione**: estrarre un *middleware Zustand custom* (o un `subscribe` isolato) che osserva i
  cambiamenti delle sole chiavi persistite e invoca un `PersistenceAdapter` unico:
  `adapter.saveProfile(profileId, state)`.
  - In v1 l'adapter scrive in `localStorage`.
  - In v2 (Supabase) l'adapter accoda la scrittura debouncata verso Supabase in background.
  Le action tornano a fare solo `set(...)` puro.

### 3.2 Confine di validazione (Zod) per dati esterni (priorità MEDIA)
Con import/export live e profili in localStorage, l'app deserializza JSON non fidati tramite `JSON.parse`
e li usa direttamente con cast TypeScript (`as ListExportFile`).
- **Rischio**: se la struttura del JSON salvato/importato è corrotta o vecchia, lo store entra in
  stato inconsistente (es. `inventory['metal-parts'] = "5"` stringa invece di numero, array `null`).
- **Soluzione**: introdurre Zod (~12 KB) o schemi TS leggeri scritti a mano in `src/lib/schemas.ts`
  per validare al confine: `loadProfileState`, `importLists`, `importMultiProfile`.
  In caso di errore: fallback sicuro a valore default con banner UI esplicito ("Profilo corrotto,
  ripristinato stato base").
