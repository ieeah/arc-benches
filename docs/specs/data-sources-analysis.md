# Analisi Sorgenti Dati (ARC Raiders)

Questo documento riassume l'analisi condotta sulle principali fonti dati e API (sia ufficiali che community-driven) disponibili per *ARC Raiders*, al fine di stabilire l'architettura dati del Companion Tracker.

Poiché Embark Studios non fornisce attualmente un'API pubblica ufficiale per i dati di gioco, l'ecosistema si basa interamente sugli sforzi della community.

## 1. Sorgenti Primarie (Le più affidabili)

### MetaForge (metaforge.app / metaforge.gg)
*   **Cos'è:** Piattaforma community-driven leader per API e integrazioni di terze parti su *ARC Raiders*.
*   **Affidabilità:** **Altissima**. Dispone di endpoint documentati e manutenuti attivamente.
*   **Ruolo nel progetto:**
    1. **Sorgente di verità catalogo oggetti:** `items.json` e icone via `scripts/fetch-items.mjs`.
    2. **Sorgente di verità eventi live & condizioni mappe:** `GET /api/arc-raiders/events-schedule?region={region}` (orizzonte 41h, suddiviso per i 5 server regionali: `europe`, `north-america`, `south-america`, `asia`, `oceania`).

### ARDB.app (ARC Raiders Database — ardb.app/api)
*   **Cos'è:** Database strutturato e documentato della community con endpoint JSON REST dedicati.
*   **Affidabilità:** **Molto Alta**. Espone dati dettagliati su nemici ARC, drop rate e contratti delle quest.
*   **Ruolo nel progetto:**
    1. **Bestiario ARC & Drop Tables (Fase 0.7.0):** `GET /api/arc-enemies` e `/api/arc-enemies/{id}`, inclusi asset vettoriali SVG (`/arc/icons/*.svg`) e drop list complete per componente.
    2. **Quest Tracker Informativo (Fase 0.7.0):** `GET /api/quests`, con contratti, step operativi, commercianti associati e reward.

### RaidTheory/arcraiders-data (GitHub)
*   **Cos'è:** Il repository GitHub più citato e utilizzato per il dump dei dati crudi di gioco in formato JSON.
*   **Affidabilità:** **Alta**.
*   **Ruolo nel progetto:** **Sorgente di backup**. Se MetaForge o ARDB dovessero avere downtime, rappresenta l'alternativa ideale per sincronizzare il catalogo.

### ARC Raiders Wiki (arcraiders.wiki)
*   **Cos'è:** La wiki della community, basata su motore MediaWiki (`MediaWiki 1.43.8`).
*   **Affidabilità:** **Altissima per i media e le icone di categoria / mappa**. Sfrutta la robusta API nativa di MediaWiki (`/w/api.php`) per l'interrogazione batch dei file multimediali ad alta risoluzione.
*   **Ruolo nel progetto:** **Sorgente di asset grafici & icone di categoria**. Lo script `scripts/fetch-category-icons.mjs` interroga le API batch di MediaWiki e genera file `.webp` in `public/icons/categories/`.

---

## 2. Sorgenti Secondarie / Alternative Tecniche

### Mahcks/arcraiders-data-api (GitHub)
*   **Cos'è:** Repository personale che espone i file JSON di gioco tramite REST.
*   **Ruolo nel progetto:** Risorsa di riserva per incrociare eventuali incongruenze nei dati.

---

## 3. Applicazioni Frontend & Ispirazione UI

*   **Coe.gg:** Companion tracker di riferimento per ispirazione UI/UX. Dati alimentati da MetaForge.
*   **ARC Raiders Maps (arcraidersmaps.app):** Mappa interattiva da cui trarre ispirazione per coordinate e nodi di loot in ottica v1.x.

---

---

## 4. Evoluzione Architetturale: Transizione a Supabase Storage & Backoffice Next.js (Fase 0.9.0+)

Con la migrazione a Next.js e Supabase, l'infrastruttura dati e asset subirà una trasformazione radicale:

### A. Hosting Autonomo degli Asset (Supabase Storage)
* **Zero Dipendenze da CDN Esterne:** Tutti gli asset grafici (icone oggetti, immagini nemici, render 3D, tile ad alta risoluzione delle mappe) verranno salvati in bucket pubblici dedicati su **Supabase Storage** (`/storage/v1/object/public/arc-assets/...`).
* **Ruolo delle API Esterne:** MetaForge e ARDB non verranno interrogate in tempo reale dal browser per gli asset statici, ma usate esclusivamente a monte come sorgenti di aggiornamento per le nostre pipeline di sincronizzazione.

### B. Gestione Ibrida: Supabase Studio vs Next.js `/admin`
* **Supabase Studio (Dashboard Ufficiale):**
  * Gestione tabelle Postgres, visualizzazione e query SQL su cataloghi (`items`, `workbenches`, `quests`, `map_pois`).
  * Gestione bucket storage, permessi RLS e account utente.
* **Next.js `/admin` (Area Operativa Protetta per Ruolo Admin):**
  * **Sync Center:** Trigger manuale o visualizzazione job di importazione da MetaForge/ARDB, con **Visual Diff** (confronto a schermo di variazioni prezzi, ricette e nuovi oggetti prima dell'applicazione a DB).
  * **Studio Overrides & Traduzioni:** Evoluzione delle attuali pagine dev (`DevOverridesPage`, `DevTranslationsPage`) con salvataggio diretto su database.
  * **Map Tiler:** Script/tool per la scomposizione e l'upload automatico dei tile piramidali delle mappe.

---

## Conclusioni & Workflow Asset

1. **Catalogo Oggetti & Icone Base:** MetaForge (`scripts/fetch-items.mjs` $\rightarrow$ `items.json` e `public/icons/items/`).
2. **Icone di Categoria:** ARC Raiders Wiki MediaWiki API (`scripts/fetch-category-icons.mjs` $\rightarrow$ `public/icons/categories/`).
3. **Eventi Live Mappe:** MetaForge Events API (`/api/arc-raiders/events-schedule?region=...`).
4. **Bestiario ARC & Quest Informative:** ARDB API (`/api/arc-enemies`, `/api/quests` e relative icone vettoriali SVG).
5. **Storage & Sync a Regime (0.9.0+):** Supabase Storage per tutti gli asset multimediali + Next.js `/admin` per le pipeline e gli override.
