# 3_BACKLOG.md — Debito Tecnico & Bug

Elenco dei bug, debito tecnico, refactoring e miglioramenti su funzionalità esistenti in **ARC Benches**. Ogni voce indica la versione pianificata (vedi [VERSIONING.md](VERSIONING.md)).

---

## 0.5.0 "Segnale Radio"
- [ ] #72 [Tipi liste: `listType` required e type guard per narrowing](https://github.com/ieeah/arc-benches/issues/72)
- [ ] #73 [Tipi liste: discriminated union completa (Opzione A)](https://github.com/ieeah/arc-benches/issues/73) — dopo #72
- [ ] #83 [Liste: ricompense di livello con oggetto scelto dal catalogo completo](https://github.com/ieeah/arc-benches/issues/83) — oggi le ricompense di livello sono solo testo libero (form inline in `DevListsPage`): deve potersi scegliere un oggetto da tutta la lista, blueprint e cosmetici inclusi (nascosti sempre esclusi). Il selettore dei requisiti di consegna deve escludere gli elementi "non di gioco" (cosmetici): oggi manca `Outfits`. Correlata a #82.
- [ ] #82 [Liste: azioni vincolate a mappe specifiche e oggetti da portare](https://github.com/ieeah/arc-benches/issues/82) — alcune azioni vanno completate in mappe precise e/o richiedono di avere con sé certi oggetti al momento del compimento (distinti dai requisiti di consegna, non incidono sul fabbisogno dello Stash). Catalogo mappe globale condiviso con #81 e #59 (ogni azione/tip/gruppo referenzia comunque il proprio sottoinsieme). Checklist pre-raid degli oggetti nello Stash: possibile sviluppo futuro, fuori scope.
- [ ] #79 [UX Liste & Progetti: opzione "ripristinabile"](https://github.com/ieeah/arc-benches/issues/79) — in fase di creazione di un progetto/lista — il pulsante "Ripristina" (reset progresso) deve agire solo sulle liste/progetti marcati come ripristinabili, non su tutti indistintamente.
- [ ] #74 [Export/import completo: tutti i campi del profilo inclusi nel backup](https://github.com/ieeah/arc-benches/issues/74)
- [ ] #86 [Dati banchi al Lvl 3 (Frozen Trail)](https://github.com/ieeah/arc-benches/issues/86) — rigenerare `workbenches.json` con i nuovi requisiti.
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

## Completati di recente
- [x] #80 [Bug Stash: contatore quantità che torna a zero](https://github.com/ieeah/arc-benches/issues/80)
- [x] Bug UI Stash: lo slider delle azioni (`ActionSlider`) — il background azzurro del trascinamento usciva dai bordi arrotondati; ora slider lineare e riempimento clippato.
