# 3_BACKLOG.md — Debito Tecnico & Bug

Elenco dei bug, debito tecnico, refactoring e miglioramenti su funzionalità esistenti in **ARC Benches**. Ogni voce indica la versione pianificata (vedi [VERSIONING.md](VERSIONING.md)).

---

## 0.5.0 "Segnale Radio"
- [ ] #102 [Moduli attivabili per profilo (`isSectionActive`)](https://github.com/ieeah/arc-benches/issues/102) — toggle nelle impostazioni per spegnere sezioni non usate (Spedizioni, Progetti, Pass).
- [ ] #74 [Export/import completo: tutti i campi del profilo inclusi nel backup](https://github.com/ieeah/arc-benches/issues/74) — dopo #102, include moduli attivi, pass completati con timestamp, livelli attivi e azioni.
- [x] #79 [UX Liste & Progetti: opzione "extractionWiped"](https://github.com/ieeah/arc-benches/issues/79) — marcatura per liste/progetti soggetti al wipe o azzeramento legato all'estrazione (`extractionWiped: true`); il reset progressi agisce solo sulle liste marcate come tali, lasciando intatti i banchi del rifugio, i progetti permanenti e i blueprint sbloccati. Toggle in UI (Custom List e Dev) e campo esteso a tutti i seed pregressi.
- [ ] #88 [UX ItemPicker: filtri per tipo selezionabili in UI](https://github.com/ieeah/arc-benches/issues/88) — oggi i tipi non selezionabili come requisito di consegna (Blueprint, Cosmetic, Outfits, Furniture, Research, Currency) sono fissi in una costante; valutare un filtro attivabile dall'utente (Stencil e Design sono trovabili in raid).

## 0.6.0 "Archivio del Rifugio"
- [ ] #69 [UX Stash: Ordinamento per priorità multi-criterio (Banco + Livello)](https://github.com/ieeah/arc-benches/issues/69) — oltre all'ordine dei banchi/liste, dare precedenza ai requisiti di livello inferiore (es. Lvl 2 prima di Lvl 3); per materiali aggregati su più livelli o banchi, assegnare la priorità più alta (livello minimo / primo banco nell'ordinamento).
- [ ] #93 [UX Stash: filtri per fonte lista nel menu contestuale (...)](https://github.com/ieeah/arc-benches/issues/93) — toggle nelle opzioni secondarie del floating nav per attivare/disattivare gli oggetti provenienti da specifiche tipologie di lista (banchi di lavoro, progetti, liste personalizzate, spedizioni, quest).

- [ ] #11 [Performance: virtualizzazione delle liste lunghe (Catalogo e Stash)](https://github.com/ieeah/arc-benches/issues/11) — anticipata da 0.9.0: scroll a scatti su dispositivi di fascia media; prima si misura l'effetto di header opachi, `overflow-clip`, miniature 128px e icone per tema.

## 0.7.0 "Guida di Speranza"
- [ ] #75 [UX: badge di craftabilità sulle card degli oggetti](https://github.com/ieeah/arc-benches/issues/75) — include l'estensione dell'icona craft a tutti i banchi (non solo Refiner), con stato verde (livello banco raggiunto / producibile) e ambra (livello banco non ancora sufficiente).

## 0.9.0 "Rifinitura Tattica"
- [ ] #60 [Refactor UI/UX Globale: Consolidamento componenti, modali, drawer e densità visiva](https://github.com/ieeah/arc-benches/issues/60)
- [ ] #4 [Supporto Tastiera per Drag & Drop](https://github.com/ieeah/arc-benches/issues/4)
- [ ] #115 [UX: valutare un redesign dell'app, oggi troppo «Tailwind generico»](https://github.com/ieeah/arc-benches/issues/115) — da valutare insieme a #60; deve essere completato prima del rilascio pubblico della 1.0.0
- [ ] #116 [UX: pagina di dettaglio per ogni lista, pagina dell'Outpost e riorganizzazione delle pagine](https://github.com/ieeah/arc-benches/issues/116) — dopo il redesign del tema (#115)

## Da pianificare
- [ ] #114 [UX Liste: elenco unico senza raggruppamento per tipo, card differenziate e più intuitive](https://github.com/ieeah/arc-benches/issues/114) — la priorità si esprime con la posizione; correlata a #69. Comprende la rinomina della pagina «Banchi e Liste» (es. «Obiettivi»).

## Completati di recente
- [x] #79 [UX Liste & Progetti: opzione "extractionWiped"](https://github.com/ieeah/arc-benches/issues/79) — reset selettivo e integrazione nel modello e nei seed pregressi.
- [x] #86 [Dati banchi al Lvl 3 (Frozen Trail)] — verificati: livelli 1-3 invariati rispetto al gioco; Gunsmith Lvl 4, Stazione Ricerca e Outpost già integrati.
- [x] #72 & #73 [Tipi liste: discriminated union completa su `listType`].
- [x] #80 [Bug Stash: contatore quantità che torna a zero](https://github.com/ieeah/arc-benches/issues/80)
- [x] Bug UI Stash: lo slider delle azioni (`ActionSlider`) — il background azzurro del trascinamento usciva dai bordi arrotondati; ora slider lineare e riempimento clippato.
