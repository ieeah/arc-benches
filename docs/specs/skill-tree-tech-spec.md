# Specifica Tecnica — Skill Tree dei Raiders (#62)

> **Stato**: Bozza di Progettazione  
> **Milestone**: 0.6.0 ("Archivio del Rifugio")  
> **Issue di riferimento**: [#62](https://github.com/ieeah/arc-benches/issues/62)  
> **Dipendenza Dati risolta**: [#89](https://github.com/ieeah/arc-benches/issues/89) (dataset e icone consolidate in `src/data/skills.json` e `public/icons/skills/`)  
> **Documenti correlati**: [docs/1_CURRENT.md](../1_CURRENT.md), [docs/2_ROADMAP.md](../2_ROADMAP.md), [docs/VERSIONING.md](../VERSIONING.md)

---

## 1. Obiettivo & Visione d'Insieme

Implementare la sezione interattiva **Skill Tree dei Raiders** (`#/skills`), che replica fedelmente l'albero delle abilità aggiornato di *ARC Raiders (Frozen Trail)* in una **visualizzazione d'insieme unica a tridente** (nessuna frammentazione forzata in tab), consentendo ai giocatori di:
1. Visualizzare l'intero albero con i 3 rami (*Condizionamento*, *Mobilità*, *Sopravvivenza*) e le connessioni native.
2. Allocare e revocare punti rispettando le regole di progressione (prerequisiti, livelli incrementali a 5 step, nodi on/off a 1 step, e cancelli milestone a 10, 30 e 40 punti).
3. Configurare il budget di Punti Abilità (SP) tramite livello Raider, con gestione slegata o opzionalmente agganciata ai punti permanenti delle Spedizioni.
4. Calcolare automaticamente il percorso di sblocco minimo tramite **Pathfinder** toccando un'abilità bersaglio.
5. Salvare e sincronizzare la propria build nello stato del profilo utente.

---

## 2. Modello Dati e Struttura

### 2.1 Schema del Dataset dei Nodi (`src/data/skills.json`)
Il dataset estratto con la #89 fornisce i 45 nodi suddivisi nei 3 rami:

```ts
export type SkillCategory = 'CONDITIONING' | 'MOBILITY' | 'SURVIVAL';

export type SkillLocalizedText = {
  en: string;
  it: string;
};

export type SkillNode = {
  id: string; // es. "mob_1", "mob_4l", "surv_5c"
  name: SkillLocalizedText;
  category: SkillCategory;
  isMajor: boolean; // true = Milestone a rombo con perk selezionabile; false = Nodo minore
  description: SkillLocalizedText;
  maxPoints: 1 | 5; // 1 = on/off (1 punto); 5 = incrementale (1..5 punti)
  impactedSkill?: SkillLocalizedText;
  knownValue?: string[];
  position: { x: number; y: number };
  prerequisiteNodeIds: string[];
  iconName: string;
  icon: string; // "icons/skills/..."
};
```

### 2.2 Topologia dei 14 Slot per Ramo

Ogni ramo condivide la medesima struttura simmetrica a 7 livelli verticali (42 slot totali nell'albero):

```
Tier 1:  [       Root (5 pt, circolare)        ]
                         │
Tier 2:         [ 2L (5) ]       [ 2R (5) ]
                    │                │
Tier 3:         [ 3L (5) ]       [ 3R (5/1) ]
                    │                │
Tier 4:         [   Milestone 10 SP (1 pt)   ]  <-- Scelta tra 2 perk (4L / 4R)
                ┌───┴────────┬───┴───┐
Tier 5:     [ 5L (5) ]   [ 5C (1/5) ] [ 5R (5) ]
                │            │           │
Tier 6:     [ 6L (5) ]   [ 6C (1) ]  [ 6R (5) ]
                └───┬────────┼───┬───────┘
Tier 7:     [ Milestone 30 SP ] [ Milestone 40 SP ] <-- Perk Capstone (7L / 7R)
```

1. **Root (1 slot)**: Circolare, sbloccato all'avvio (`maxPoints: 5`).
2. **Minori Inferiori (4 slot)**: 2 a sinistra (`2L`, `3L`) e 2 a destra (`2R`, `3R`), con `maxPoints: 5` (eccetto `surv_3r` che è on/off a 1 pt).
3. **Milestone Intermedio (1 slot a rombo)**: Convergenza dei due percorsi.
   - **Soglia**: Richiede almeno **10 punti spesi nel ramo**.
   - **Scelta esclusiva**: L'utente attiva 1 punto scegliendo tra le 2 opzioni del milestone (es. `cond_4l` vs `cond_4r`).
4. **Minori Superiori (6 slot)**: Tre vie parallele (Sinistra `5L-6L`, Centro `5C-6C`, Destra `5R-6R`).
   - Alcuni nodi sono incrementali (`5L`, `5R`, `6L`, `6R` a 5 pt), altri sono on/off (`cond_5c`, `cond_6c`, `mob_6c`, `surv_5c` a 1 pt).
5. **Milestone Finali (2 slot a rombo)**:
   - **1° Capstone**: Richiede almeno **30 punti spesi nel ramo** (consuma il 31° punto).
   - **2° Capstone**: Richiede almeno **40 punti spesi nel ramo** (consuma il 41° punto).

---

## 3. Motore di Validazione e Logica di Calcolo (`src/lib/skillTree.ts`)

Il motore è puro e deterministico, separato dalla UI e testabile unitariamente.

### 3.1 Interfaccia Dati Stato Build

```ts
export type SkillAllocation = {
  /** Punti allocati per nodo minore o selezione milestone (ID nodo -> punti allocati 0..maxPoints) */
  points: Record<string, number>;
  /** Perk selezionato per ciascuno slot milestone (ID slot -> ID nodo perk scelto) */
  selectedMilestones: {
    [branch in SkillCategory]?: {
      mid?: string;   // nodo selezionato per il milestone 10pt (es. "cond_4l")
      final1?: string; // nodo selezionato per il milestone 30pt (es. "cond_7l")
      final2?: string; // nodo selezionato per il milestone 40pt (es. "cond_7r")
    };
  };
};

export type SkillTreeBudget = {
  raiderLevel: number;             // 1..75 (1 punto per livello, default 75)
  expeditionBonusSP: number;       // 0..15 (SP permanenti spedizioni, opzionali)
  sandboxMode: boolean;            // se true, punti infiniti liberi
  totalAvailableSP: number;        // calcolato
  totalSpentSP: number;
  remainingSP: number;
  branchSpent: Record<SkillCategory, number>;
};
```

### 3.2 Regole di Validazione (Invarianti)

1. **Allocazione Punti su Nodo Minore**:
   - Consentita solo se `remainingSP > 0` (o `sandboxMode = true`).
   - Se il nodo è root: sempre consentita fino a `maxPoints`.
   - Se il nodo non è root: consentita solo se il nodo genitore immediato nello stesso percorso ha `points >= 1`.
2. **Sblocco e Assegnazione Milestone**:
   - Milestone 10 SP: consentito solo se `branchSpent[category] >= 10`.
   - Milestone 30 SP: consentito solo se `branchSpent[category] >= 30`.
   - Milestone 40 SP: consentito solo se `branchSpent[category] >= 40`.
   - L'attivazione assegna 1 SP alla skill selezionata.
3. **Ritiro Punti (Guardia di Integrità)**:
   - Una funzione `canDecrementNode(nodeId, allocation): boolean` verifica che scalare 1 punto non violi:
     - I prerequisiti di alcun nodo a valle con `points > 0`.
     - Nessuna soglia di cancello (10, 30, 40) per cui esista già un milestone allocato nel ramo.
4. **Pathfinder (Allocazione Automatica ad Obiettivo)**:
   - Funzione `computeShortestPath(targetNodeId, allocation, nodes): string[]`.
   - Identifica i nodi antenati minimi mancanti e calcola i punti "filler" minimi necessari per raggiungere le soglie di 10, 30 o 40 punti nel ramo, proponendo l'allocazione automatica in un click.

---

## 4. Integrazione con lo Store (`src/store/skillTreeSlice.ts`)

Nuova slice Zustand integrata in `useAppStore` e persistita nel profilo Raider attivo:

```ts
export type SkillTreeSlice = {
  skillAllocations: Record<string, number>; // id nodo -> punti (0..5)
  raiderLevel: number;                      // Livello simulato (1..75, default 75)
  useExpeditionBonus: boolean;              // Se considerare o meno i punti spedizione nel calcolo
  sandboxMode: boolean;                     // Modalità libera
  
  // Azioni
  allocateSkillPoint: (nodeId: string, delta: number) => boolean;
  selectMilestonePerk: (category: SkillCategory, slot: 'mid' | 'final1' | 'final2', nodeId: string) => boolean;
  autoAllocatePathTo: (targetNodeId: string) => boolean;
  resetSkillTree: () => void;
  setRaiderLevel: (level: number) => void;
  setUseExpeditionBonus: (enabled: boolean) => void;
  setSandboxMode: (enabled: boolean) => void;
};
```

* **Persistenza**: `skillAllocations`, `raiderLevel`, `useExpeditionBonus` e `sandboxMode` vengono serializzati in `safeLS` all'interno dell'oggetto profilo attivo (compatibile con l'export/import v3).
* **Disaccoppiamento Spedizioni**: Se la sezione `expeditions` è disattivata dalle impostazioni utente (`isSectionActive('expeditions') === false`), il calcolo ignora automaticamente i punti spedizione e nasconde i relativi controlli, lasciando solo i punti da livello e la modalità sandbox.

---

## 5. Architettura Componenti UI (Mobile-First)

### 5.1 Pagina Principale: `src/pages/SkillTreePage.tsx`
* **Header Sticky**:
  * Titolo «Albero delle Abilità» e pillola del Budget Punti:
    * `SP Rimanenti: X / Y` (con barra di avanzamento e pulsante rapido per aprire le opzioni budget: livello Raider e toggle Spedizioni).
  * Pulsante rapido **Ripristina (Reset)** con modale di conferma per azzerare la build.
* **Area Canvas a Tridente Unico (`SkillTreeCanvas.tsx`)**:
  * Un'unica vista che accoglie i 3 rami disposti a ventaglio dal centro in basso:
    * **Sinistra**: Condizionamento (Verde, angolato verso nord-ovest).
    * **Centro**: Mobilità (Giallo, dritto verso nord).
    * **Destra**: Sopravvivenza (Rosso, angolato verso nord-est).
  * Supporto touch fluido per pan e pinch-to-zoom (o scala preimpostata adatta sia a schermi smartphone che tablet/desktop widescreen).
  * Linee vettoriali SVG dinamiche tra i nodi: grigie/opache se inattive, luminose e colorate con il gradiente del ramo se attive.
* **Componente Nodo (`SkillTreeNode.tsx`)**:
  * **Minore**: cerchio con icona 28x28px, anello di progresso SVG o pillola numerica (es. `0/5`, `2/5` o checkbox per i nodi on/off a 1 pt).
  * **Milestone**: rombo grande con bordo dorato/evidenziato e icona interna (o `?` con lucchetto se bloccato).
  * Feedback tattile `active:scale-95` e indicatore visivo di sbloccabilità.
* **Drawer / Scheda Dettaglio Nodo (`SkillDetailSheet.tsx`)**:
  * Riproduce fedelmente la card informativa in-game (scheda bianca mostrata negli screenshot utente):
    * Nome bilingue in evidenza.
    * Descrizione dettagliata dell'effetto.
    * Nei Milestone: selettore a pulsanti per scegliere il perk attivo tra le 2 o 3 opzioni.
    * Nei Minori: pulsanti touch `+` e `-` (e pulsante rapido `Max`).
    * Banner rosso inferiore se bloccato: *«RICHIEDE 10 PUNTI IN [RAMO]»* o *«Richiede il nodo precedente»*.

---

## 6. Routing, Navigazione e Gating Modulare

1. **Routing (`src/router/index.ts`)**:
   - Registrazione rotta `'skills'` (con lazy loading `React.lazy(() => import('@/pages/SkillTreePage'))`).
2. **Navigazione (`src/data/nav.json`)**:
   - Voce `skills` con icona `GitFork` o `Network`, etichetta localizzata `nav.skills` («Abilità» / «Skill Tree»).
3. **Gating per-profilo (`isSectionActive('skill-tree')`)**:
   - Gestito tramite `enabledSections` in `SettingsPage.tsx` per abilitare/disabilitare la sezione a piacere.

---

## 7. Piano dei File Coinvolti

| File | Azione | Ruolo |
| :--- | :---: | :--- |
| `src/types/skills.ts` | Esistente | Tipi TypeScript nodi e albero |
| `src/data/skills.json` | Esistente | Dataset 45 nodi (estratto con #89) |
| `public/icons/skills/*.png` | Esistente | 45 icone grafiche scaricate |
| `src/lib/skillTree.ts` | **Nuovo** | Motore puro di validazione, sblocco cancelli e pathfinder |
| `src/lib/skillTree.test.ts` | **Nuovo** | Test unitari approfonditi su tutte le regole matematiche e i gate |
| `src/store/skillTreeSlice.ts` | **Nuovo** | Slice Zustand per build, livello e persistenza |
| `src/components/skills/SkillTreeCanvas.tsx` | **Nuovo** | Canvas responsive con albero a tridente e collegamenti SVG |
| `src/components/skills/SkillTreeNode.tsx` | **Nuovo** | Rendering visivo nodi cerchio/rombo con stati interattivi |
| `src/components/skills/SkillDetailSheet.tsx` | **Nuovo** | Scheda/drawer di dettaglio e allocazione punti in stile in-game |
| `src/pages/SkillTreePage.tsx` | **Nuovo** | Pagina principale albero abilità con header budget e reset |
| `src/i18n/locales/it.ts` e `en.ts` | **Modifica** | Stringhe localizzate per UI, header, budget e gate |
| `src/router/index.ts` e `App.tsx` | **Modifica** | Registrazione rotta `skills` e lazy load |
| `src/data/nav.json` | **Modifica** | Aggiunta voce di navigazione |

---

## 8. Verifiche e Criteri di Accettazione

1. **Integrità Regole**:
   - Impossibile allocare punti oltre il budget disponibile.
   - Impossibile assegnare punti a nodi successivi senza almeno 1 punto nel genitore.
   - Nodi Milestone bloccati finché il ramo non raggiunge rispettivamente 10, 30 e 40 punti spesi.
   - Impossibile revocare punti se l'azione rompe i requisiti dei nodi a valle o delle soglie di cancello.
2. **Supporto Nodi On/Off e 5 Livelli**:
   - Nodi con `maxPoints: 1` gestiti come toggle binario (0 o 1).
   - Nodi con `maxPoints: 5` incrementabili da 0 a 5.
3. **Esperienza Visiva Unica a Tridente**:
   - I tre rami visibili insieme nella schermata principale con colori distintivi (Verde, Giallo, Rosso).
   - Connessioni reattive chiare e scheda bianca di dettaglio fedele agli screenshot in-game.
4. **Verifica Test & Browser**:
   - 100% green su tutti i test unitari di logica e store.
   - Type-check e build di produzione esenti da errori.
   - Verifica visiva confermata tramite subagent browser su mobile e desktop.
