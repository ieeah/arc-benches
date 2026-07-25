# Implementazione Restante 0.2.0 "Sacca dei Materiali"

Questo piano copre i task rimanenti per completare la versione 0.2.0, focalizzata su UX Mobile-First e performance, come da roadmap aggiornata.

## Decisioni Architetturali Approvate

- **Librerie UI/Performance**: Approvata l'introduzione di `@floating-ui/react` per la gestione posizionamento overlay (overflow menu) e `@tanstack/react-virtual` per la virtualizzazione liste.
- **Logica Refiner (Stash)**: L'indicatore "costruibile" (icona refiner) continuerà a valutare **esclusivamente il livello del banco**, senza verificare le quantità. Modifica rigettata per evitare attrito nell'uso dello Stash, che non rappresenta una foto esatta dell'inventario.

## Modifiche Pianificate

### Architettura & Dipendenze
- Aggiunta di `@floating-ui/react` e `@tanstack/react-virtual` in `package.json`.

---

### View Transitions
**File:** `src/App.tsx`
Sostituiremo le chiamate dirette a `setActivePage` con un wrapper `flushSync` all'interno di `document.startViewTransition()` (quando supportato dal browser), delegando le animazioni a CSS (`::view-transition-old`, `::view-transition-new`).

---

### Floating Overflow & Menu Kebab
**File:** `src/components/FloatingNav.tsx`
Verrà refattorizzato per usare `useFloating` di `@floating-ui/react` con i middleware `shift` (per evitare che il menu esca dallo schermo) e `offset`. Verrà contestualmente rivisto l'ordine delle voci menu come da backlog.

**File:** `src/components/UnifiedListCard.tsx`
Spostamento del menu kebab (dettaglio, modifica, elimina) su un layer floating slegato dall'HTML flow della card. Questo bypassa il problema del `overflow: hidden` della card quando collassata.

---

### Virtualizzazione, Filtri e UX Catalogo
**File:** `src/components/ItemPicker.tsx`
- Rimozione del limite fisso a 80 risultati.
- Sostituzione del wrapper della griglia con `useVirtualizer` (window-based o parent-based) per renderizzare solo gli elementi visibili.
- Introduzione di due nuovi controlli in alto: un selettore `<select>` per filtrare per **Categoria** (Armi, Materiali, ecc.) e un toggle `Nascondi Skin/Non droppabili` (di default attivo).

**File:** Viste Database (`src/pages/Database.tsx` o equivalenti)
Stessi filtri (categoria, toggle skin) e raggruppamento per categoria.

---

### UX Input Numerici & Accessibilità
**File:** `src/components/InventoryCard.tsx` (e simili con input)
Modifica dello state dell'input numerico. Durante l'`onChange` accetterà il valore `""` (stringa vuota) per permettere la cancellazione del numero su tastiera mobile senza che scatti a `0` istantaneamente. Solo sull'`onBlur` o all'inserimento, il valore vuoto ricadrà a `0` e i valori superiori al massimo consentito (es. cap per quello slot) verranno tranciati al limite.

**File:** `src/components/LevelPills.tsx` / `src/components/IconButton.tsx`
Revisione attributi ARIA (`aria-label`) per i controlli che usano solo icone, come prescritto dal backlog.

---

### Script Dati (MetaForge)
**File:** `scripts/fetch-items.mjs`
Ispezione dell'API MetaForge per estrarre eventuali icone di categoria e salvarle nell'`items.json`.
