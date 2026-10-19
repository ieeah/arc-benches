# Specifica Tecnica — Mappe Interattive & Punti di Interesse (v1.x)

Questo documento analizza l'architettura tecnica, i costi di sviluppo, i requisiti di rendering e il modello dati per l'implementazione del modulo **Mappe Interattive** previsto per la fase post-lancio (**v1.x**), dopo la migrazione a Next.js e Supabase.

---

## 1. Obiettivo & Requisiti Funzionali

Il modulo Mappe consentirà ai Raiders di:
1. **Navigare le mappe di gioco** (*Buried City*, *Dam Battlegrounds*, *The Spaceport*, *Blue Gate*, *Stella Montis*, *Riven Tides*) con zoom fluido e pan touch/mouse.
2. **Visualizzare nodi e punti di interesse (POI)**:
   * Container di loot categorizzati (Medici, Armi, Elettronica, Materiali).
   * Botole e ascensori di estrazione (stato attivo/richiede batteria/chiave).
   * Spawn boss ARC (Matriarch, Harvester, Rocketeer).
   * Bunker chiusi, stanze di sicurezza e chiavi richieste.
3. **Filtrare i POI per categoria o nome oggetto** (es. Mostrami dove trovare *Sensori Ottici* o Solo estrazioni sicure).
4. **Collegamento bidirezionale con lo Stash**: toccare un materiale nel tracker permette di aprire la mappa filtrata sui suoi nodi di spawn tipici.

---

## 2. Architettura di Rendering (Confronto Soluzioni)

| Criterio | **Soluzione A: Leaflet / react-leaflet (Raccomandata)** | **Soluzione B: Canvas Custom / Panzoom** | **Soluzione C: Mapbox GL / OpenLayers** |
| :--- | :--- | :--- | :--- |
| **Sistema di Coordinate** | Piane cartesiane non-geografiche (L.CRS.Simple) | Trasformazioni matrice 2D SVG/Canvas | GeoJSON proiettato |
| **Zoom & Pan Mobile** | Nativo, con pinch-to-zoom fluido e momentum | Da implementare a mano o con librerie terze | Eccessivamente pesante |
| **Marker & Clustering** | Plugin maturi (Leaflet.markercluster), performance elevate | Custom rendering a 60fps su canvas | Supporto nativo |
| **Peso Bundle** | ~38 KB gzipped | ~10 KB gzipped | ~150+ KB gzipped |
| **Manutenibilità** | **Alta**: ecosystem standard per gaming maps (*Tarkov*, *Rust*, *Warframe*) | Bassa: alto debito tecnico | Media |

**Scelta Architetturale:** Adozione di Leaflet con coordinate piane L.CRS.Simple, che converte i pixel dell'immagine della mappa ( \dots W, 0 \dots H$) in coordinate cartesiane intuitive senza distorsioni proiettive.

---

## 3. Gestione Asset Grafici, Risoluzione & Storage

* **Dimensione & Risoluzione Mappe:**
  * I tile attuali scaricati dai tile-server community (`scripts/data/maps/`) offrono una risoluzione base a zoom 12 (~4K equivalente).
  * **Nota Qualità:** Per la release v1.x definitiva, valutare l'estrazione delle texture native non compresse in 4K/8K direttamente dai file di gioco Unreal Engine 5 (`.pak`/`.utoc` tramite **FModel**) per eliminare qualsiasi artefatto di compressione JPEG.
* **Isolamento Storage (No Deploy Locale):**
  * I file dei tile non devono **mai risiedere nella cartella `public/`** dell'app per evitare di appesantire il bundle statico di produzione (Vite / Vercel / GitHub Pages).
  * Vengono archiviati localmente in `scripts/data/maps/` per la manutenzione e distribuiti in produzione esclusivamente tramite **Supabase Storage** (`/storage/v1/object/public/arc-assets/maps/{mapId}/{z}/{y}/{x}.jpg`).
* **Tile Piramidali:** Suddivisione in standard Slippy/Leaflet $256 \times 256$ pixel per livelli di zoom da 8 a 12 (o fino a 14 per overzoom).

---

## 4. Gestione Mappe Multi-Livello & Piani Verticali (Floor Toggle)

Alcune mappe presentano una struttura verticale complessa con più livelli:
* **Stella Montis:** Livello Superiore (L1) e Livello Inferiore (L2). Attualmente il tile-server li affianca in un unico canvas disallineato; l'implementazione finale deve **sovrapporli nella stessa coordinata geografica** consentendo il toggle tra i due piani.
* **The Blue Gate:** Superficie e Livello Sotterraneo (*Underground Tunnels / Bunker*). Nel dataset MapGenie attuale il livello sotterraneo non è presente e andrà cercato/estratto dai file di gioco o da fonti wiki complementari.
* **The Spaceport & Dam:** Strutture sotterranee e gallerie tecniche.

**Requisito UX/UI:**
1. Aggiunta di un selettore di piano (*Floor Switcher*: `Tutti`, `Superficie / L1`, `Sotterraneo / L2`) sovrapposto alla mappa.
2. Il cambio di piano aggiorna sia il layer visivo dei tile di sfondo, sia i marker POI filtrati per il campo `floor_level` nel database.

---

## 5. Modello Dati POI (Supabase / Postgres)

Grazie al passaggio a Supabase nella v0.9.0/1.0.0, i POI non appesantiscono il bundle client ma risiedono su una tabella relazionale indicizzata:

```sql
CREATE TABLE map_pois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id TEXT NOT NULL, -- 'buried-city', 'dam', 'spaceport', ecc.
  category TEXT NOT NULL, -- 'loot', 'extraction', 'boss', 'hazard', 'bunker'
  sub_type TEXT, -- 'medical-crate', 'weapon-locker', 'locked-room'
  name TEXT NOT NULL,
  description TEXT,
  x_coord DOUBLE PRECISION NOT NULL,
  y_coord DOUBLE PRECISION NOT NULL,
  floor_level INT DEFAULT 0, -- 0: Superficie, 1: Livello Superiore, -1: Livello Sotterraneo
  required_item_id TEXT, -- ID chiave richiesta (es. 'blue-gate-security-key')
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_map_pois_map_category ON map_pois(map_id, category);
CREATE INDEX idx_map_pois_map_floor ON map_pois(map_id, floor_level);
```

---

## 6. Stima di Costo & Allocazione Roadmap

* **Complessità Tecnica:** Medio-Alta.
* **Sforzo Principale:**
  1. Ricerca ed estrazione delle texture dei livelli sotterranei mancanti (*The Blue Gate Underground*).
  2. Allineamento geometrico e sovrapposizione dei livelli multi-piano (*Stella Montis L1/L2*).
  3. Raccolta e georeferenziazione delle coordinate dei POI con mapping del `floor_level`.
* **Posizionamento:** **Versione 1.x Orizzonte Tattico**, dopo il consolidamento dell'architettura Next.js + Supabase Storage CDN.

---

## 7. Pianificazione Itinerari Tattici & Routing (#118)

Il modulo di routing estende la mappa interattiva trasformandola in un assistente tattico di incursione a inizio raid:

### 7.1 Algoritmo di Calcolo Percorso
* **Modello matematico**: TSP (Travelling Salesperson Problem) leggero con vincoli di precedenza (DAG per step di quest sequenziali) e punto di partenza fisso (punto di spawn scelto dall'utente).
* **Complessità computazionale**: Trascurabile ($< 5\text{ ms}$ su $N \le 8$ tappe in linea retta euclidea nel browser), con immediata potatura (*pruning*) delle sequenze non conformi ai requisiti delle quest.
* **Tracciamento visivo**: Linea spezzata (`L.polyline`) tra i nodi con badge numerati progressivi (`1`, `2`, `3`...).

### 7.2 Separazione tra Nodi Fissi e Aree RNG / Probabilistiche
Per evitare percorsi rigidi su obiettivi non deterministici:
1. **Tappe dell'itinerario (Waypoints)**: Solo azioni e punti con coordinate note e fisse (interazioni con console, registratori, terminali, spawn point, porte bloccate, estrazioni).
2. **Layer "Aree ad Alta Probabilità" (Hotspots)**: Per obiettivi generici o soggetti a RNG (es. *"Elimina 5 Snitch"*, *"Trova 3 Componenti Elettronici"*), la mappa mostra layer tematici / zone sfumate ad alta probabilità di spawn/loot senza forzarli come nodi obbligati. L'utente valuta visivamente le zone e decide se aggiungere una tappa ad hoc.

### 7.3 Interattività & Controllo Utente (Mobile-First UX)
In coerenza con l'impostazione mobile-first dell'app, le interazioni avvengono direttamente sulla mappa e tramite Drawer dal basso parziale per non oscurare la visuale di gioco:

1. **Gestures dirette sulla mappa**:
   * **Tap su uno step esistente**: apre opzioni contestuali rapide (tra cui l'eliminazione diretta della tappa).
   * **Tap prolungato (long-press) su uno step**: abilita il trascinamento (drag) del marker per riposizionare geograficamente la tappa.
   * **Tap prolungato su una linea di tragitto**: inserisce un nuovo step intermedio esattamente in quel segmento del percorso, trascinabile poi nella posizione desiderata (l'utente decide esplicitamente dove inserire la tappa nella sequenza senza dover forzare un ricalcolo globale).
2. **Riordino tramite Bottom Drawer parziale (`from="bottom"`)**:
   * All'apertura del drawer per modificare l'ordine delle tappe, il foglio copre solo la parte inferiore dello schermo lasciando visibile la porzione superiore della mappa.
   * **Compensazione Viewport**: la mappa riposiziona la visuale centrando lo step selezionato esclusivamente nella porzione visibile non coperta dal drawer (offset verticale).
   * **Drag & Drop nell'elenco tappe (`@dnd-kit`)**: permette di riordinare facilmente l'ordine di visita.
   * **Ottimizzazione del ricalcolo**: l'aggiornamento visivo (es. re-indexing numerico e feedback che le modifiche sono state registrate) è immediato in UI, mentre il ricalcolo effettivo della geometria della spezzata avviene solo al termine del riordino (`onDragEnd`), minimizzando repaint e computazioni intermedie.
3. **Fonte dati coordinate**: Estrazione automatica da pipeline (MetaForge/ARDB) dei campi `locations` associati a quest e POI.


