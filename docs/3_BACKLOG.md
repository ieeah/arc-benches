# 3_BACKLOG.md — Debito Tecnico & Bug

Elenco dei bug, debito tecnico e miglioramenti su funzionalità esistenti in **ARC Benches**.

---

- [x] #1 [Accessibilità Overlay Legacy & Controlli](https://github.com/ieeah/arc-benches/issues/1)
- [x] #2 [Persistence Boundary Unico](https://github.com/ieeah/arc-benches/issues/2)
- [x] #3 [Validazione Runtime Schemi (Zod)](https://github.com/ieeah/arc-benches/issues/3)
- [ ] #4 [Supporto Tastiera per Drag & Drop](https://github.com/ieeah/arc-benches/issues/4)
- [x] #5 [Revisione Ordine Menu FloatingNav](https://github.com/ieeah/arc-benches/issues/5)
- [x] #6 [Lockfile NPM WASM Check](https://github.com/ieeah/arc-benches/issues/6)
- [x] #7 [Overflow Componenti Floating](https://github.com/ieeah/arc-benches/issues/7)
- [x] #8 [UX Input Numerici (Stash & Liste Custom)](https://github.com/ieeah/arc-benches/issues/8)
- [x] #9 [Icone Categoria Elementi](https://github.com/ieeah/arc-benches/issues/9)
- [x] #10 [Logica Icona Refiner in Stash](https://github.com/ieeah/arc-benches/issues/10)
- [ ] #11 [Virtualizzazione Liste](https://github.com/ieeah/arc-benches/issues/11)
- [x] #12 [UX Catalogo e ItemPicker: Filtri, ordinamento e raggruppamento per "tipo oggetto"](https://github.com/ieeah/arc-benches/issues/12)
- [x] #13 [UX Catalogo e ItemPicker: Toggle per nascondere skin/elementi non droppabili](https://github.com/ieeah/arc-benches/issues/13)
- [ ] Indicatore Fabbricazione Banchi di Lavoro: estensione dell'icona craft a tutti i banchi (non solo Refiner), con stato verde (livello banco raggiunto / producibile) e ambra (livello banco non ancora sufficiente)
- [ ] #69 [UX Stash: Ordinamento per priorità multi-criterio (Banco + Livello)](https://github.com/ieeah/arc-benches/issues/69) — oltre all'ordine dei banchi/liste, dare precedenza ai requisiti di livello inferiore (es. Lvl 2 prima di Lvl 3); per materiali aggregati su più livelli o banchi, assegnare la priorità più alta (livello minimo / primo banco nell'ordinamento).
- [ ] UX Stash: Filtri per fonte lista nel menu contestuale (...) — aggiunta di toggle nelle opzioni secondarie del floating nav per attivare/disattivare la visualizzazione di oggetti provenienti da specifiche tipologie di lista (banchi di lavoro, progetti, liste personalizzate, spedizioni, quest).
- [ ] #79 [UX Liste & Progetti: opzione "ripristinabile"](https://github.com/ieeah/arc-benches/issues/79) — in fase di creazione di un progetto/lista — il pulsante "Ripristina" (reset progresso) deve agire solo sulle liste/progetti marcati come ripristinabili, non su tutti indistintamente.
- [ ] #80 [Bug Stash: contatore quantità che torna a zero](https://github.com/ieeah/arc-benches/issues/80) — in alcuni casi il contatore quantità di un oggetto torna a zero dopo il tocco (dopo una frazione di secondo) e non è possibile incrementarlo — da riprodurre e individuare in quali condizioni si verifica. Un refresh della pagina lo risolve (indizio di stato in-memory disallineato dallo storage).
- [ ] #82 [Liste: azioni vincolate a mappe specifiche e oggetti da portare](https://github.com/ieeah/arc-benches/issues/82) — alcune azioni vanno completate in mappe precise e/o richiedono di avere con sé certi oggetti al momento del compimento (distinti dai requisiti di consegna, non incidono sul fabbisogno dello Stash). Catalogo mappe globale condiviso con #81 e #59 (ogni azione/tip/gruppo referenzia comunque il proprio sottoinsieme). Checklist pre-raid degli oggetti nello Stash: possibile sviluppo futuro, fuori scope.
- [ ] #83 [Liste: ricompense di livello con oggetto scelto dal catalogo completo](https://github.com/ieeah/arc-benches/issues/83) — oggi le ricompense di livello sono solo testo libero (form inline in `DevListsPage`): deve potersi scegliere un oggetto da tutta la lista, blueprint e cosmetici inclusi (nascosti sempre esclusi). Il selettore dei requisiti di consegna deve escludere gli elementi "non di gioco" (cosmetici): oggi manca `Outfits`. Correlata a #82.
- [ ] UX ItemPicker: filtri per tipo selezionabili in UI di volta in volta — oggi i tipi non selezionabili come requisito di consegna (Blueprint, Cosmetic, Outfits, Furniture, Research, Currency) sono fissi in una costante; valutare un filtro attivabile dall'utente nel selettore, dato che non è certo quali tipi vadano esclusi (Stencil e Design sono trovabili in raid).
