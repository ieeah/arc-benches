# Specifica Tecnica — Moduli Attivabili per Profilo (#102)

Riferimento Roadmap: [2_ROADMAP.md](../2_ROADMAP.md) (#102)  
Riferimento Backlog: [3_BACKLOG.md](../3_BACKLOG.md) (#102)  
Issue Correlate: [#102](https://github.com/ieeah/arc-benches/issues/102) (Moduli per profilo), [#74](https://github.com/ieeah/arc-benches/issues/74) (Export/import completo), [#91](https://github.com/ieeah/arc-benches/issues/91) (Tracker collezioni), [#109](https://github.com/ieeah/arc-benches/issues/109) (Tracker outfit), [ADR 006](../adrs/006-feature-flags-da-seed-con-override-locale.md) (Feature flags seed/override).

---

## 🎯 1. Panoramica e Obiettivo

L'obiettivo dell'issue **#102** è consentire a ciascun Raider (profilo locale) di personalizzare la propria esperienza nell'applicazione, attivando o disattivando intere macro-aree o singoli sotto-moduli funzionali che non utilizza (es. un giocatore focalizzato solo sul rifugio base può disattivare le *Spedizioni*, i *Progetti* o specifici *Tracker* cosmetici).

Disattivare un modulo a livello di profilo deve avere un impatto coerente e pervasivo:
1. **Navigazione pulita**: le voci corrispondenti scompaiono dalla barra di navigazione (`FloatingNav` / `MorphingFloatingNav`).
2. **Nessun vicolo cieco**: se un utente apre un URL/hash diretto a una pagina disattivata nel profilo, viene reindirizzato allo Stash.
3. **Stash e fabbisogni puliti**: i requisiti di materiali e le azioni legate a moduli disattivati non devono sporcare i calcoli dei materiali mancanti o la lista della spesa dello Stash.
4. **Isolamento per profilo**: la configurazione è memorizzata nello stato del singolo profilo e viene preservata e trasferita tramite backup completo (preparando il terreno per l'issue **#74**).

---

## 🏛️ 2. Architettura Gerarchica: Sistema (Dev) vs Profilo (Utente)

L'architettura adotta una **struttura ad albero gerarchica** composta da **Macro-Moduli** e **Sotto-Moduli**, unificando la governance tecnica (Feature Flags sviluppatore) con la personalizzazione d'uso (Scelte del Raider).

```
┌────────────────────────────────────────────────────────────────────────┐
│                      1. FEATURE FLAGS DI SISTEMA                       │
│                   (src/lib/featureFlags.ts / ADR 006)                  │
│       • Ambito: Browser / Build / Ambiente (seed + Dev Studio)         │
│       • Scopo: Gating tecnico di funzionalità WIP o non pronte          │
│       • Regola: Se il genitore o il flag è false, il modulo è spento    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ se attivo a sistema (visibile in prod)
┌────────────────────────────────────────────────────────────────────────┐
│                      2. MODULI ATTIVI DEL PROFILO                      │
│                      (isModuleActive / enabledModules)                 │
│       • Ambito: Singolo Raider (PersistedState per-profilo)            │
│       • Scopo: Preferenza d'uso e pulizia dell'interfaccia             │
│       • Regola: Switch master per macro-moduli + toggle granulari      │
└────────────────────────────────────────────────────────────────────────┘
```

### Invarianti di Gating a Cascata

1. **Invariante di Sistema (`isSystemModuleEnabled`)**:
   Un nodo $M$ è abilitato a livello di sistema se e solo se la sua feature flag di sistema è `true` E, se $M$ appartiene a un modulo genitore $P$, anche $P$ è abilitato a sistema:
   $$\text{isSystemModuleEnabled}(M) = \text{systemFlag}(M) \land (\text{parent}(M) == \text{null} \lor \text{isSystemModuleEnabled}(\text{parent}(M)))$$
   *Conseguenza*: Se gli sviluppatori spengono l'intero gruppo `trackers` a sistema, tutti i sotto-moduli (`blueprints`, `furniture-designs`, ecc.) risultano spenti a sistema.

2. **Invariante del Profilo (`isProfileModuleEnabled`)**:
   Un nodo $M$ è abilitato dall'utente se e solo se l'impostazione per $M$ nel profilo è `true` E, se $M$ ha un genitore $P$, anche $P$ è attivo per il profilo:
   $$\text{isProfileModuleEnabled}(\text{profile}, M) = \text{userSetting}(M) \land (\text{parent}(M) == \text{null} \lor \text{isProfileModuleEnabled}(\text{profile}, \text{parent}(M)))$$
   *Conseguenza*: Se l'utente spegne il macro-modulo `trackers`, tutti i suoi sotto-moduli si spengono a cascata per quel profilo.

3. **Attività Effettiva (`isModuleActive`)**:
   Un modulo o sotto-modulo è attivo in run-time se e solo se:
   $$\text{isModuleActive}(M) = \text{isSystemModuleEnabled}(M) \land \text{isProfileModuleEnabled}(\text{profile}, M)$$

4. **Visibilità nelle Impostazioni UI**:
   - Se $\text{isSystemModuleEnabled}(M) == \text{false}$, il modulo o sotto-modulo **non esiste per l'utente finale** e non compare affatto nelle Impostazioni del profilo.
   - Non appena una feature flag di sistema viene attivata (es. `maps: true` quando le mappe sono pronte per la produzione), il modulo diventa immediatamente visibile nelle Impostazioni del profilo e l'utente può decidere se mantenerlo attivo o spegnerlo.

---

## 📐 3. Tassonomia dei Moduli e Sotto-Moduli

### Albero delle Sezioni

```
ARC Benches
├── [core] Banchi del Rifugio (workbench) ──── [SEMPRE ATTIVO — Card visibile, toggle bloccato on]
├── [core] Stash & Inventario (stash) ──────── [SEMPRE ATTIVO — Card visibile, toggle bloccato on]
├── [core] Impostazioni (settings) ─────────── [SEMPRE ATTIVO — Card visibile, toggle bloccato on]
│
├── 🎯 raid (Pianificazione Raid & Radar)
│   └── 📋 raid-checklist (Checklist equipaggiamento da portare — 1.x #99)
│
├── 📦 expeditions (Spedizioni e Carovane) [sistema: expeditions]
│   └── 🔒 expeditions-vault (Vault Spedizione) [sistema: vault]
│
├── 📋 projects (Progetti Speciali del Rifugio) [sistema: sempre true]
│
├── 📜 quests (Registro Missioni & Quest Tracker — 0.6.x #58)
│
├── 🌳 skill-tree (Albero delle Abilità del Raider — 0.6.0 #62)
│
├── 🗂️ trackers (Registri e Collezioni — 0.6.0 #145) [sistema: trackers / blueprints]
│   ├── 📐 blueprints (Progetti e Blueprint Sbloccati) [sistema: blueprints]
│   ├── 🪑 furniture-designs (Design Arredi Rifugio/Outpost #91) [sistema: furniture-designs]
│   ├── 🎨 weapon-stencils (Stencil Cosmetici Armi #91) [sistema: weapon-stencils]
│   ├── 🦺 outfits (Outfit e Guardaroba #109, #131) [sistema: outfits]
│   └── 🏆 trophies (Bacheca dei Trofei & Archivio — 0.6.x #70)
│
├── 🎟️ reward-pass (Reward Pass / Tracce di Progressione) [sistema: reward-pass]
│
├── 📖 codex (Codex di Speranza & Bestiario ARC — 1.0.0 #64, #57)
│
├── 🗺️ maps (Mappe Tattiche Interattive — 1.0.0 #61, #55) [sistema: maps]
│   └── 📍 maps-waypoints (Itinerari e Waypoint — 1.x #118)
│
└── 🎲 role-maker (Role Maker / Generatore Archetipi) [sistema: role-maker]
```

### Tabella Descrittiva dei Nodi

| ID Modulo (`SectionId`) | Genitore (`parentId`) | Feature Flag Sistema | Nodi Navigazione | Rotte | Impatto Liste / Stash |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `workbench` | *nessuno (core)* | *(nessuno)* | `['workbench']` | `['benches', 'workbench']` | Banchi rifugio di base |
| `stash` | *nessuno (core)* | *(nessuno)* | `['stash']` | `['stash']` | Inventario e fabbisogni |
| `settings` | *nessuno (core)* | *(nessuno)* | `['settings']` | `['settings']` | Pagina impostazioni |
| `raid` | *nessuno (macro)* | *(nessuno, sempre abilitato)* | `['raid']` | `['raid']` | Nasconde voce nav e disabilita radar in FloatingNav |
| `raid-checklist` | `raid` | `raid-checklist` | — | — | Checklist oggetti da portare |
| `expeditions` | *nessuno (macro)* | `expeditions` | `['expeditions']` | `['expeditions']` | Esclude carovana attiva dai requisiti Stash |
| `expeditions-vault` | `expeditions` | `vault` | `['vault']` | `['vault']` | Nasconde voce/strumento Vault Spedizioni |
| `projects` | *nessuno (macro)* | *(nessuno, sempre abilitato)* | *(incluso in liste)* | *(sottosezione liste)* | Esclude liste `listType: 'project'` dallo Stash |
| `quests` | *nessuno (macro)* | `quests` | `['quests']` | `['quests']` | Registro missioni mercanti |
| `skill-tree` | *nessuno (macro)* | `skill-tree` | `['skill-tree']` | `['skill-tree']` | Albero delle abilità |
| `trackers` | *nessuno (macro)* | `trackers` | *(raggruppatore)* | — | Disattiva tutti i tracker figli |
| `blueprints` | `trackers` | `blueprints` | `['blueprints']` | `['blueprints']` | Nasconde voce nav e rotta Blueprints |
| `furniture-designs` | `trackers` | `furniture-designs` | `['furniture-designs']` | `['furniture-designs']` | Nasconde registro design arredi |
| `weapon-stencils` | `trackers` | `weapon-stencils` | `['weapon-stencils']` | `['weapon-stencils']` | Nasconde registro stencil armi |
| `outfits` | `trackers` | `outfits` | `['outfits']` | `['outfits']` | Nasconde registro outfit |
| `trophies` | `trackers` | `trophies` | `['trophies']` | `['trophies']` | Bacheca trofei e archivio |
| `reward-pass` | *nessuno (macro)* | `reward-pass` | `['reward-pass']` | `['reward-pass']` | Nasconde voce nav, rotta e avvisi pass |
| `codex` | *nessuno (macro)* | `codex` | `['codex']` | `['codex']` | Enciclopedia lore e nemici ARC |
| `role-maker` | *nessuno (macro)* | `role-maker` | `['role-maker']` | `['role-maker']` | Nasconde voce nav e trigger modal |
| `maps` | *nessuno (macro)* | `maps` | `['maps']` | `['maps']` | Nasconde voce nav e rotte mappe |
| `maps-waypoints` | `maps` | `maps-waypoints` | — | — | Itinerari tattici su mappa |

---

## 🛠️ 4. Tipi TypeScript e Persistenza

### A. Tipi dei Moduli (`src/types.ts` o `src/lib/sections.ts`)

```typescript
export type MacroSectionId =
  | 'raid'
  | 'expeditions'
  | 'projects'
  | 'quests'
  | 'skill-tree'
  | 'trackers'
  | 'reward-pass'
  | 'codex'
  | 'maps'
  | 'role-maker';

export type SubSectionId =
  | 'raid-checklist'
  | 'expeditions-vault'
  | 'blueprints'
  | 'furniture-designs'
  | 'weapon-stencils'
  | 'outfits'
  | 'trophies'
  | 'maps-waypoints';

export type CoreSectionId =
  | 'workbench'
  | 'stash'
  | 'settings';

export type SectionId = MacroSectionId | SubSectionId | CoreSectionId;

export type SectionDefinition = {
  id: SectionId;
  parentId?: MacroSectionId;
  nameKey: string;
  descriptionKey: string;
  systemFlag?: FeatureFlagId;
  navIds?: string[];
  routes?: string[];
  isCore?: boolean;
  defaultEnabled: boolean;
};
```

### B. Persistenza nello Stato del Profilo (`PersistedState`)

Nel profilo utente salviamo un dizionario `enabledSections: Record<string, boolean>`.

```typescript
export type PersistedState = Pick<AppState,
  'currentLevels' | 'targetLevels' | 'activeModules' | 'inventory' |
  'filterHideCompleted' | 'listOrder' | 'customLists' | 'checkedActions' |
  'activePersonalityId' | 'ownedBlueprints' | 'filterHideOwnedBlueprints' |
  'completedExpeditionsCount' | 'earnedPermanentSkillPoints' |
  'consecutiveStreak' | 'departureWindowActive' | 'activeRewardPass' | 'completedRewardPasses' |
  'enabledSections' // <-- Nuovo campo per-profilo
> & { language?: AppLanguage };
```

### C. Retrocompatibilità e Idratazione

Se un profilo caricato da `localStorage` non contiene `enabledModules`:
- I default sono `true` per tutti i moduli supportati.
- In fase di idratazione, qualsiasi campo mancante viene integrato con il default `true`.
- Se un macro-modulo è `false`, le funzioni di lettura considerano inattivi anche i suoi sotto-moduli, preservando la coerenza anche se il file JSON importato contenesse discrepanze.

### D. Azioni dello Store Zustand (`src/store/profileSlice.ts`)

```typescript
export interface ProfileSlice {
  // ...
  enabledModules: Record<ModuleId, boolean>;
  setModuleEnabled: (moduleId: ModuleId, enabled: boolean) => void;
  setMacroModuleWithChildren: (macroId: MacroModuleId, enabled: boolean) => void;
  resetModulesToDefault: () => void;
  isModuleActive: (moduleId: ModuleId) => boolean;
}
```

---

## 🧩 5. Interfaccia Utente e Superfici Coinvolte

### 1. Sezione "Moduli del Profilo" nelle Impostazioni (`SettingsPage.tsx`)
La pagina impostazioni presenta i moduli organizzati gerarchicamente:
- **Filtro iniziale**: Vengono mostrati SOLO i moduli il cui `isSystemModuleEnabled` è `true`.
- **Card Macro-Modulo**:
  - Titolo, icona e descrizione.
  - **Master Switch**: consente di attivare/disattivare l'intera macro-area.
- **Sotto-Moduli Annidati**:
  - Se il macro-modulo ha figli attivi a sistema (es. `trackers` con `blueprints`), sotto al master switch viene mostrata la lista dei sotto-moduli con toggle individuali.
  - Se il master switch è disattivato, i toggle dei sotto-moduli appaiono disabilitati / spenti con un messaggio chiaro (es. *"Attiva 'Registri e Collezioni' per configurare i singoli tracker"*).
  - Badge sintetico: es. `"3/3 attivi"` o `"Disattivato"`.

### 2. Navigazione (`useNavTree.ts` & `FloatingNav`)
- La navigazione filtra automaticamente tutti i nodi `navId` associati a moduli con `isModuleActive(id) === false`.
- Se tutti gli elementi di una categoria del menu (es. "Progressione") risultano disattivati, la categoria viene automaticamente omessa per mantenere il menu compatto.

### 3. Hash Router (`App.tsx`)
- Guardie di rotta: se l'utente naviga verso un hash appartenente a un modulo disattivato (es. `#/expeditions` o `#/blueprints`), viene reindirizzato in modo sicuro allo `stash`.

### 4. Calcolo Fabbisogni Stash (`selectors.ts` & `StashPage.tsx`)
- Gli aggregatori dei materiali escludono automaticamente le liste associate a moduli disattivati (es. la carovana se `expeditions` è spento, o i progetti se `projects` è spento).

---

## 🔒 6. Integrazione con Export/Import Completo (#74)

Il campo `enabledModules` è integrato nell'oggetto `PersistedState` e viene automaticamente incluso nell'export JSON completo del profilo. All'import, viene sanitizzato e ripristinato fedelmente.

---

## 🧪 7. Piano di Collaudo e Verifica

1. **Logica pura (`modules.test.ts`)**:
   - Test della cascata di sistema: disabilitare `trackers` a sistema disabilita `blueprints` anche se il flag del sotto-modulo fosse true.
   - Test della cascata del profilo: disabilitare `trackers` nel profilo disabilita `blueprints` anche se `enabledModules['blueprints'] === true`.
   - Test indipendenza tra moduli non correlati.
2. **Store & Persistenza (`store.test.ts`)**:
   - Verifica di `setModuleEnabled` e persistenza su `localStorage`.
   - Verifica cambio profilo con configurazioni moduli differenti.
3. **Verifica UI**:
   - Nelle impostazioni, verificare che i moduli disabilitati a sistema (es. `maps`) non compaiano.
   - Spegnendo `expeditions`, verificare la scomparsa dalla nav e il reindirizzamento da `#/expeditions`.
