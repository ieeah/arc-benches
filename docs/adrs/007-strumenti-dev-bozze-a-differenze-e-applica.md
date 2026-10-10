# ADR 007 — Strumenti Dev: bozze a differenze e «Applica» dal dev server

* **Stato**: bozza (senza alternative considerate: da aggiungere se emergono)

## Contesto
I dati statici (liste, oggetti custom, override, flag, navigazione) si modificano con pagine Dev, senza toccare il codice. Scaricare i file e sovrascriverli a mano era lento ed esposto a errori. Le bozze salvate come copia completa nel browser, inoltre, oscuravano i file aggiornati altrove (import, altri strumenti) e «Applica» poteva sovrascrivere dati più recenti.

## Decisione
- Le modifiche vivono in bozze in `localStorage` che contengono **solo le differenze** dal file, ricostruite sopra il file attuale ([draftStorage.ts](../../src/lib/draftStorage.ts)).
- «Applica» scrive i file con un plugin Vite attivo solo in sviluppo ([dev-apply.ts](../../vite-plugins/dev-apply.ts)): solo localhost, solo un elenco fisso di percorsi, rifiuto se il file è cambiato su disco rispetto a quanto caricato.
- Le liste eliminate vanno nel cestino `dev-trash/trash.json`, fuori dalla build.

## Conseguenze
- Una bozza vecchia non può cancellare né oscurare dati nuovi.
- Esistono solo in dev: gli utenti finali non hanno strumenti di modifica.
- Da completare (consolidamento 0.5.0): guardia sulle modifiche non applicate e rimozione dal file delle liste eliminate.
