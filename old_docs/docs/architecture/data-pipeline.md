# Data Pipeline e Dati di Gioco

Documento di dettaglio sulla gestione dei dati statici e dello script di sincronizzazione per **ARC Benches**.

---

## 📦 Struttura dei Dati Statici

L'applicazione non effettua chiamate API a runtime per recuperare i dati di gioco. Tutti i dati sono compilati in file JSON statici inclusi nel bundle:

### 1. `src/data/items.json`
- **Descrizione**: Fonte di verità per le informazioni sugli oggetti di gioco.
- **Formato ID**: Hyphen-case (es. `metal-parts`).
- **Contenuto**: Catalogo completo fornito da MetaForge (~590 item). Ogni voce include: nome, icona locale, rarità, tipo e l'eventuale banco di fabbricazione (`workbench`, es. `"Refiner"` / `"Refiner II"`).
- **Badge Refiner**: La UI incrocia il campo `workbench` dell'oggetto con il livello attuale del Refiner dell'utente per calcolare il badge "craftabile ora" (verde) o "richiede Refiner Lvl 2" (ambra).

### 2. `src/data/workbenches.json`
- **Descrizione**: Struttura dei banchi di lavoro, livelli disponibili e requisiti di potenziamento (`itemId` + `quantity`).
- **Integrità**: Ogni `itemId` presente nei requisiti dei banchi **DEVE** esistere come chiave all'interno di `items.json`.

---

## 🛠 Script di Ingestione (`scripts/fetch-items.mjs`)

Per aggiornare i dati di gioco a seguito di patch o aggiornamenti di *ARC Raiders*, si utilizza lo script dedicato situato nella cartella `scripts/`.

### Esecuzione
```bash
cd scripts
npm install
node fetch-items.mjs
```

### Funzionamento dello Script
1. **Paginazione MetaForge API**: Lo script scarica l'intero catalogo degli oggetti dall'API MetaForge.
2. **Download & Ottimizzazione Icone**: Scarica le immagini delle icone e le converte/ottimizza nella cartella `public/icons/items/` (utilizzando la libreria `sharp` contenuta nel `package.json` dedicato di `scripts/`).
3. **Caching Locale**: Salva il catalogo grezzo completo in `scripts/metaforge-raw.json` (gitignorato). Le esecuzioni successive riutilizzano la cache locale a meno che non venga passato il flag `--refresh`.
4. **Validazione Requisiti**: Verifica che ogni `itemId` richiesto nei banchi di lavoro (`workbenches.json`) sia presente nel catalogo generato.
