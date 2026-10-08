# Analisi Impatto Aggiornamento "Frozen Trail"

Questo documento raccoglie e analizza tutte le novità e modifiche note dell'aggiornamento **"Frozen Trail"** di *ARC Raiders* (in arrivo l'**8 Ottobre 2026**), al fine di valutare post-rilascio se, come e quando integrarle nell'architettura e nella roadmap di **ARC Benches**.

---

## 🎯 Contestualizzazione

"Frozen Trail" rappresenta il più grande aggiornamento di contenuti e progressione per *ARC Raiders*, introducendo modifiche sostanziali sia al ciclo di gioco in raid (mappe, meteo, nemici, armi) sia ai sistemi di metagame e rifugio (Reward Pass, Outpost, Skill Tree, upgrade banchi).

Per **ARC Benches**, questo aggiornamento implica sia la necessità di sincronizzare i dati del catalogo (nuovi materiali, ricette e schemi), sia la possibilità di introdurre nuove funzionalità o riadattare moduli esistenti (es. Raider Decks $\rightarrow$ Reward Pass).

---

## 🕹️ 1. Sintesi delle Novità di Gioco

### 1.1 Nuova Mappa e Meccaniche Ambientali
* **Pendola Pass**: Una vasta regione montuosa e innevata situata oltre la Rust Belt, caratterizzata da spiccata verticalità, osservatori, villaggi abbandonati e un deposito ferroviario sepolto.
* **Flash Freeze**: Meccanica meteorologica dinamica. Ondate di freddo improvviso impongono ai Raider di cercare tempestivamente riparo in strutture riscaldate per evitare l'ipotermia e il danno progressivo.
* **The Frigate & The Emperor**: 
  - *The Frigate*: Vascello volante da guerra dell'ARC che pattuglia la mappa (contenuto endgame a rilievo alto con enigmi interni e loot raro).
  - *The Emperor*: Imponente macchina ARC abbattuta presente nella mappa, che funge da punto d'interesse e obiettivo ad altissimo valore strategico.

### 1.2 Nuovi Nemici ARC & Drop Tables
* **3 Nuove Unità ARC**:
  - **Bully**: Unità terrestre d'assalto pesante.
  - **Hydra**: Unità tattica multi-arma.
  - **Skulker**: Unità agile da scontro ravvicinato / stealth.
* **Componenti Rari ARC**: Inserimento di nuove parti e driver drop dei nemici (es. *Bastion Part*, *Queen Part*, *Sentinel Firing Core*, *Fireball Burner*, *Rocketeer Driver*, *Bison Driver*), essenziali per i potenziamenti avanzati dei banchi da lavoro.

### 1.3 Nuove Armi, Gadget e Weapon Amplification
* **Armi**:
  - *Stiletto*: Fucile da battaglia a munizioni leggere.
  - *Bantam*: Revolver pesante snub-nosed a munizioni pesanti.
* **Gadget & Mobilità**:
  - *Grappling Hook* (Rampino) e *Tether Launcher*.
  - *Yank Grenade*.
* **Weapon Amplification**: Nuovo sistema di personalizzazione e potenziamento delle armi (armi amplificate personalizzate che possono essere anche lootate da altri giocatori in caso di eliminazione).

### 1.4 Overhaul della Progressione e del Rifugio
* **Reward Pass (Sostituto dei Raider Decks)**:
  - I vecchi *Raider Decks* (basati sull'accumulo passivo della valuta Cred) vengono ritirati.
  - Il nuovo **Reward Pass** a 60 livelli si basa sul completamento di **Imprese (Feats)** in raid.
  - Strutturato in 3 percorsi: **Free Pass**, **Premium Pass** e **Legacy Pass** (quest'ultimo gratuito per tutti, consente di completare i vecchi Raider Decks senza scadenze temporali o FOMO).
* **Sistema Outpost**:
  - Un nuovo spazio di superficie personalizzabile ed espandibile (situato tra la Rust Belt e Pendola Pass), che affianca il *Den* sotterraneo per decorazioni, ricerche e potenziamenti.
* **Skill Tree Overhaul**:
  - Riorganizzazione dell'albero delle abilità per offrire maggiore flessibilità e personalizzazione dei Raider.
* **Upgrade Banchi da Lavoro (Workbenches Lvl 1 $\rightarrow$ Lvl 3)**:
  - I banchi del rifugio (*Gunsmith*, *Gear Bench*, *Medical Lab*, *Explosives Station*, *Utility Station*, *Refiner*, *Scrappy*) richiedono ora materiali combinati specifici per il raggiungimento del **Livello 3**.

---

## 🛠️ 2. Analisi d'Impatto su ARC Benches

| Categoria ARC Benches | Cambiamento in Frozen Trail | Impatto Tecnico / Funzionale |
| :--- | :--- | :--- |
| **Catalogo & Inventario (`StashPage`)** | Nuovi materiali (es. *Queen Part*, *Bastion Part*) e nuove risorse di fabbricazione. | Necessità di sincronizzare i dati tramite gli script in `scripts/` (`fetch-items.mjs` da MetaForge/Wiki). Nessuna modifica architetturale richiesta. |
| **Tracker Banchi (`ListsPage`)** | Estensione o modifica dei requisiti per i banchi al Livello 3. | Aggiornamento del file statico `workbenches.json` tramite la pipeline di fetch. Il motore di calcolo del fabbisogno gestirà automaticamente i nuovi livelli. |
| **Blueprints Tracker (`BlueprintsPage`)** | Introduzione dei progetti per nuove armi (*Stiletto*, *Bantam*), gadget e mod di amplificazione. | Aggiornamento del dataset dei progetti (superando l'attuale totale di 83 schemi). La UI gestirà reattivamente i nuovi schemi. |
| **Raider Decks $\rightarrow$ Reward Pass** | Transizione dal modello "Raider Decks" al "Reward Pass" (60 livelli, Feats, Free/Premium/Legacy). | **Opportunità Feature**: Modellare una nuova tipologia di lista o pagina per tracciare il completamento delle *Feats* e l'avanzamento dei 60 livelli del Reward Pass e dei Legacy Pass. |
| **Mappe Interattive (`#61`) & Eventi Live (`#55`)** | Mappa *Pendola Pass* e allerta meteo dinamica *Flash Freeze*. | Integrazione della mappa *Pendola Pass* nella vista mappe (v1.x) e gestione dell'evento meteo nella Dashboard Eventi Live (v0.6.0). |
| **Bestiario ARC (`#57`)** | Inserimento di *Bully*, *Hydra*, *Skulker*, *Frigate* ed *Emperor*. | Inclusione delle schede nemico con relative *Drop Tables* collegate ai materiali richiesti dai banchi (es. Refiner / Gunsmith Lvl 3). |
| **Skill Tree (`#62`)** | Riorganizzazione completa dell'albero abilità. | Riallimentazione della specifica dell'albero abilità in v1.x alle nuove meccaniche di Frozen Trail. |

---

## 📌 3. Opzioni di Integrazione nella Roadmap (Da Rivalutare Post-Patch)

Di seguito le opzioni per la roadmap da prendere in considerazione dopo l'uscita dell'aggiornamento e la verifica sul campo dei dati reali:

### Opzione A: Aggiornamento Dati Puramente Incrementale (Immediato post-patch)
- **Data Sync**: Esecuzione di `scripts/fetch-items.mjs` e `scripts/fetch-translations.mjs` per aggiornare `items.json`, `workbenches.json` e le immagini delle icone.
- **Blueprints (#35)**: Riconfigurate le pillole di avanzamento per il nuovo conteggio totale dei progetti.

### Opzione B: Integrazione Feature nel Ciclo Rilasci Esistente
- **v0.5.0 "Segnale Radio"**: Sincronizzazione dei dati dei banchi e dei nuovi blueprint.
- **v0.6.0 "Centro Operativo"**: 
  - Aggiunta allerta meteo *Flash Freeze* su *Pendola Pass* in **#55 (Condizioni Mappe & Eventi Live)**.
  - Inserimento del **Reward Pass Tracker** (le Feats non si tracciano: cambiano ogni settimana e per giocatore) (come evoluzione o sostituzione della gestione Raider Decks).
- **v0.7.0 "Guida di Speranza"**: 
  - Inserimento dei nuovi nemici ARC (*Bully*, *Hydra*, *Skulker*, *Frigate*, *Emperor*) nel **#57 Bestiario ARC & Drop Tables**.
- **v1.x "Orizzonte Tattico"**: 
  - Integrazione di *Pendola Pass* in **#61 Mappe Interattive** con indicazione dei ripari dal freddo.
  - Adeguamento del modulo **#62 Skill Tree**.

---

*Nota: Questo documento servirà da riferimento al rilascio ufficiale dell'aggiornamento dell'8 Ottobre 2026 per guidare le scelte effettive di sviluppo.*
