# Consolidamento 0.5.0

Raccolta grezza dei punti emersi dalla prova manuale del 2026-10-09 (dopo il push di `d1214f5`). Non è ancora un piano: le voci vanno riorganizzate, raggruppate e pianificate. Le note «Ipotesi» sono sospetti da verificare, non diagnosi.

Legenda: **[bug]** comportamento sbagliato · **[ux]** ritocco di interfaccia · **[feat]** funzione nuova · **[dati]** contenuto del catalogo · **[verifica]** da riprodurre prima · **[test]** area non ancora provata.

---

## 1. Reward Pass: pagina e vista a livelli

- [ux] **Ordine dei livelli invertito**: nella vista a livelli il livello 1 va in cima e i successivi scendono (oggi il più alto è in cima).
  - Da rivedere con questa scelta: il binario verticale, lo scorrimento al «prossimo livello da raggiungere» (`scrollToNext`) e l'ordine di lettura.
- [bug] **I badge passano sopra l'header** della pagina (screenshot: le spille di toggle e colore coprono il titolo «Pass Legacy»).
  - Ipotesi: le spille hanno `z-10` e l'header sticky ha uno z-index più basso, oppure non crea il suo contesto di sovrapposizione. Le card che scorrono sotto l'header devono restare sotto.
- [ux] **Livello corrente anche nelle impostazioni di visualizzazione**, cioè nel pannello a inizio pagina dove si nascondono le tracce.
- [ux] **Pulsante per passare ai livelli del pass attivo** nella pagina `view=all`, oggi assente.
- [feat] **Animazione di coriandoli al completamento di un pass**, sia con il pulsante di completamento sia selezionando l'ultimo livello.
  - I colori devono essere quelli di ARC Raiders (da definire una palette dal gioco/dall'app).
  - Da decidere: rispettare `prefers-reduced-motion`; una libreria o un canvas proprio.
- [ux] **Configurazione del pass** al posto di «Cambia pass attivo».
  - Rinominare in «Configurazione Reward Pass» perché ora gestisce tutto.
  - Oggi non permette di cambiare pass né di reimpostare il livello di partenza.
  - Al clic apre una modale con l'elenco dei pass disponibili, più una voce «Nessuno», e il livello a cui impostarlo.
  - Da decidere: che fine fa il vincolo «un solo pass attivo, si cambia solo concludendolo» (testo attuale: «potrai sceglierne un altro solo concludendolo»).
- [ux] **Redesign** (non urgente) della pagina `view=all` e dell'intestazione della pagina del singolo pass.

## 2. Outfit e cosmetici

- [dati/ux] **Nome dei pezzi degli outfit**: l'informazione principale è il nome dell'outfit.
  - Esempio: «Goalie (new color)» al posto di «Colors (Goalie Color)».
  - Vale per varianti e aggiunte: colori, toggle. Da coordinare con la convenzione MetaForge «Nome (Tipo)» e con le traduzioni.
  - Impatto da controllare: ricerca, ordinamento, nomi nei custom items già creati (75 oggetti).
- [bug/dati] **Raider Token con icona generica**: ha una icona di categoria propria e non viene usata.
  - Ipotesi: la catena di ripiego `applyIconFallbacks` prende la categoria generica; controllare `item_type` e sottocategoria dell'oggetto.
- [verifica] **Le emote non hanno una propria icona?** Controllare se esiste una sottocategoria o un'icona dedicata, e come ripiegano.

## 3. Layout generale

- [ux] **Callout sui diritti e sulle sorgenti dati sempre a fondo pagina.** Mai a metà schermo: con poco contenuto va spinto in fondo alla finestra; con tanto contenuto resta dopo il contenuto, anche fuori dalla viewport.
  - Screenshot della pagina Reward Pass: il callout sta a metà.
  - Da rivedere nel layout principale (altezza minima della pagina e callout in coda), non pagina per pagina.

## 4. Tracker dei progetti (blueprint)

- [ux] Più spazio tra le card.
- [ux] Togliere il wrapper esterno e impaginare meglio il nome.
- [ux] Eliminare «Progetto» (o «Blueprint») davanti a ogni nome: nel tracker dei progetti è ovvio.
  - Da decidere: toglierlo solo in visualizzazione o anche nei dati; effetto sulla ricerca.

## 5. Pagine Dev

- [ux] **Pulsante «Home»** in tutte le pagine Dev e nella dashboard, verso la pagina principale impostata nelle impostazioni.
- [bug] **«Applica» nella pagina degli override** non scrive il file e scrive «nessuna modifica».
  - Ipotesi: il confronto è fatto contro il file già aggiornato e non contro quello vecchio. Vale anche la nostra modifica odierna delle bozze a differenze (la bozza viene tolta se uguale al file).
  - **Verificare lo stesso difetto in tutte le altre pagine con «Applica»**: liste, oggetti custom, navigazione, flag, traduzioni, cestino.
- [bug] **L'eliminazione di una lista non la rimuove dal file di origine.** Finisce nel cestino, ma al ricaricamento è ancora nel file, anche dopo aver scaricato la nuova versione.
  - Screenshot del Cestino: tre voci «New PROJECT List #7 (project)» con lo stesso id `test`, eliminate il 09/10/2026 alle 23:14, 23:15 e 23:15.
  - Da verificare anche per gli altri tipi di elemento eliminabili (spedizioni, banchi, progetti, tracce dei pass).
  - Da rivedere: cosa significa «elimina» quando le bozze vivono in `localStorage` e il file viene scritto solo con «Applica».

## 6. Da provare ancora (non testato)

- [test] Card: quantità nella barra come nel gioco, barra scura con l'icona nei progetti, `overflow-clip`.
- [test] Prestazioni e layout: miniature da 128px nelle righe piccole, icone di categoria per tema, header sticky unificati. Controllare scroll e tema chiaro/scuro nelle liste.
- [test] Impostazioni: la versione mostrata arriva da `package.json`.
- [test] Tipi: `List` come union su `listType` (#72, #73). Dall'esterno non cambia nulla, ma serve una passata su liste, spedizioni e progetti.
- [test] Script ARC Tracker, rapporto e import dei pass (solo locali).
- [test] Documentazione e changelog 0.5.0.

---

## Da riorganizzare

Raggruppamenti possibili, da discutere:

1. **Bug bloccanti degli strumenti Dev**: «Applica» negli override, eliminazione che non rimuove dal file (anche sul cestino).
2. **Pass: correzioni rapide**: z-index dei badge, ordine dei livelli, pulsante verso i livelli del pass attivo.
3. **Pass: configurazione**: modale di configurazione, livello corrente nelle impostazioni, coriandoli.
4. **Dati e icone**: Raider Token, emote, nomi dei pezzi degli outfit.
5. **Layout trasversale**: callout a fondo pagina, pulsante Home nelle pagine Dev.
6. **Tracker dei progetti**: spaziatura, wrapper, nomi.
7. **Redesign** delle pagine dei pass.
8. **Prova delle aree non ancora verificate**.
