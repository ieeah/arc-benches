# Analisi Sorgenti Dati (ARC Raiders)

Questo documento riassume l'analisi condotta sulle principali fonti dati e API (sia ufficiali che community-driven) disponibili per *ARC Raiders*, al fine di stabilire l'architettura dati del Companion Tracker.

Poiché Embark Studios non fornisce attualmente un'API pubblica ufficiale per i dati di gioco, l'ecosistema si basa interamente sugli sforzi della community.

## 1. Sorgenti Primarie (Le più affidabili)

### MetaForge (metaforge.app / metaforge.gg)
*   **Cos'è:** Piattaforma community-driven progettata per fornire API e integrazioni a sviluppatori di terze parti.
*   **Affidabilità:** **Altissima**. È il motore che alimenta le applicazioni più popolari della community (es. *Coe.gg*). Dispone di endpoint API documentati ed è manutenuta attivamente da un team.
*   **Ruolo nel progetto:** **Sorgente di verità principale** per i dati JSON strutturati (items, statistiche, costi). Il nostro script `scripts/fetch-items.mjs` fa bene ad appoggiarsi qui.

### RaidTheory/arcraiders-data (GitHub)
*   **Cos'è:** Il repository GitHub più citato e utilizzato per il dump dei dati crudi di gioco in formato JSON. È la base dati per molti bot Discord e companion app.
*   **Affidabilità:** **Alta**. È un progetto open-source consolidato.
*   **Ruolo nel progetto:** **Sorgente di backup**. Se MetaForge dovesse avere dei downtime prolungati, questo repository rappresenta l'alternativa ideale per sincronizzare il nostro catalogo oggetti.

### ARC Raiders Wiki (arcraiders.wiki)
*   **Cos'è:** La wiki della community, basata su motore MediaWiki (`MediaWiki 1.43.8`).
*   **Affidabilità:** **Altissima per i media e le icone di categoria / mappa**. Sfrutta la robusta API nativa di MediaWiki (`/w/api.php`) per l'interrogazione strutturata dei dati e dei file multimediali ad alta risoluzione (1024x1024 / 512x512 trasparenti).
*   **Ruolo nel progetto:** **Sorgente di asset grafici & icone**. Uno script dedicato (`scripts/fetch-category-icons.mjs`) interroga le API batch di MediaWiki e genera file `.webp` ottimizzati in `public/icons/categories/`.

#### Dettaglio Endpoint & Query MediaWiki (`/w/api.php`)

*   **Base URL:** `https://arcraiders.wiki/w/api.php`
*   **Query Icone di Categoria Oggetti (Batch):**
    ```http
    GET /w/api.php?action=query&generator=categorymembers&gcmtitle=Category:Item_category_icons&gcmlimit=50&prop=imageinfo&iiprop=url|size|mime&format=json
    ```
    Restituisce tutti i file della categoria `Category:Item category icons` (`Icon_Material.png`, `Icon_Blueprint.png`, `Icon_Weapon.png`, `Icon_WeaponMod.png`, `Icon_Gadget.png`, `Icon_Grenade.png`, `Icon_Key.png`, `Icon_Augment.png`, `Icon_Shield.png`, `Icon_Regenerative.png`, `Icon_Trinket.png`, `Icon_Utility.png`, `Icon_Trap.png`, `Icon_Nature.png`, `Icon_Misc.png`, `Icon_Gift.png`).
*   **Query Icone Mappa & Condizioni (Per future estensioni mappe):**
    ```http
    GET /w/api.php?action=query&generator=categorymembers&gcmtitle=Category:Map_icons&gcmlimit=50&prop=imageinfo&iiprop=url|size|mime&format=json
    GET /w/api.php?action=query&generator=categorymembers&gcmtitle=Category:Map_condition_icons&gcmlimit=50&prop=imageinfo&iiprop=url|size|mime&format=json
    ```
*   **Query Icone Banchi di Lavoro & Stash:**
    ```http
    GET /w/api.php?action=query&generator=categorymembers&gcmtitle=Category:Workshop_icons&gcmlimit=50&prop=imageinfo&iiprop=url|size|mime&format=json
    GET /w/api.php?action=query&generator=categorymembers&gcmtitle=Category:Stash_icons&gcmlimit=50&prop=imageinfo&iiprop=url|size|mime&format=json
    ```

## 2. Sorgenti Secondarie / Alternative Tecniche

### Mahcks/arcraiders-data-api (GitHub)
*   **Cos'è:** Un repository personale che espone i file JSON di gioco tramite REST.
*   **Criticità:** Sebbene sia utile e ben fatto, è manutenuto da un singolo sviluppatore. Non ha la stessa scala di adozione di MetaForge o RaidTheory.
*   **Ruolo nel progetto:** Risorsa di riserva, utile per incrociare eventuali incongruenze nei dati.

## 3. Applicazioni Frontend (Non utili per i dati grezzi)

I seguenti strumenti sono eccellenti prodotti finali ma **non offrono API pubbliche stabili** per l'esportazione dei dati:

*   **Coe.gg:** Il companion tracker più famoso. Molto utile per trarre ispirazione su UI/UX, ma i dati sotto il cofano provengono da MetaForge.
*   **ARC Raiders Maps (arcraidersmaps.app):** Mappa interattiva Next.js. I dati geografici (coordinate, nodi di loot) sono iniettati nell'HTML. Potrebbe essere scrapata in futuro se decidessimo di implementare indicazioni su *dove* trovare materiali specifici.
*   **ARCTracker.io / ARDB (ardb.app):** Applicazioni web chiuse (senza API esposte). I dati sono fusi nel markup React Server Components (RSC) o HTML, rendendo lo scraping estremamente fragile.

## Conclusioni & Workflow Asset

1. **MetaForge (`scripts/fetch-items.mjs`)**: scarica e aggiorna `items.json` e le icone degli oggetti (`public/icons/items/*.webp`).
2. **ARC Raiders Wiki MediaWiki API (`scripts/fetch-category-icons.mjs`)**: scarica e normalizza le icone di categoria (`public/icons/categories/*.webp`).
