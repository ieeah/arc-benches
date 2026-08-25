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

## 3. Gestione Asset Grafici & Risoluzione

* **Dimensione Mappe:** Immagini sorgente da  \times 4096$ o  \times 8192$ pixel.
* **Strategia di Erogazione:**
  * Invece di scaricare un unico file monolitico da 20-30MB, le immagini vengono suddivise in **Tile piramidali** ( \times 256$ pixel per livelli di zoom da 0 a 5) in formato **WebP**.
  * I tile vengono serviti via CDN / Supabase Storage (o static hosting pubblico), scaricando solo i frammenti visibili nel viewport del giocatore.

---

## 4. Modello Dati POI (Supabase / Postgres)

Grazie al passaggio a Supabase nella v0.9.0/1.0.0, i POI non appesantiscono il bundle client ma risiedono su una tabella relazionale indicizzata:

`sql
CREATE TABLE map_pois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id TEXT NOT NULL, -- 'buried-city', 'dam', 'spaceport', ecc.
  category TEXT NOT NULL, -- 'loot', 'extraction', 'boss', 'hazard', 'bunker'
  sub_type TEXT, -- 'medical-crate', 'weapon-locker', 'locked-room'
  name TEXT NOT NULL,
  description TEXT,
  x_coord DOUBLE PRECISION NOT NULL,
  y_coord DOUBLE PRECISION NOT NULL,
  floor_level INT DEFAULT 0, -- Per bunker sotterranei o strutture multilivello
  required_item_id TEXT, -- ID chiave richiesta (es. 'blue-gate-security-key')
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_map_pois_map_category ON map_pois(map_id, category);
`

---

## 5. Stima di Costo & Allocazione Roadmap

* **Complessità Tecnica:** Medio-Alta.
* **Sforzo Principale:** Raccolta e georeferenziazione delle coordinate dei POI (data entry / scraping coordinato con la community).
* **Posizionamento:** **Versione 1.x Orizzonte Tattico**, dopo che il layer cloud (Next.js + Supabase + Storage CDN) è consolidato e stabile.
