# ARCHITECTURE.md — Mappa Architetturale

Mappa statica di **ARC Benches**. Per le decisioni e il loro perché: [adrs/](adrs/).

## Stack
- React 19 + TypeScript + Vite, Tailwind CSS v4 (variante `dark`), Vitest.
- Zustand per lo stato; `@dnd-kit` per il drag & drop.
- Routing a hash ([router](../src/router/index.ts), es. `#/list-detail?id=…`), pensato per GitHub Pages.
- i18n in [src/i18n](../src/i18n) (it/en); tema chiaro/scuro in `src/context`.

## Dati statici
In produzione l'app non fa chiamate di rete per i dati di gioco: tutto è in `src/data/` e viene importato nel bundle.

| File | Contenuto |
|---|---|
| `items.json` | Catalogo (~1000 oggetti): MetaForge + oggetti custom, con traduzioni IT. **Generato**, non si edita a mano. |
| `items-overrides.json` | Correzioni agli oggetti (anche a quelli custom). `overrides-conflicts.json`, generato da `fetch-items`, elenca quelle da rivedere. |
| `workbenches.json`, `projects.json`, `expeditions.json`, `passes.json`, `quests.json` | Liste di gioco (vedi sotto). |
| `maps.json`, `nav.json`, `feature-flags.json`, `personalities.json` | Catalogo mappe, albero di navigazione, flag, Role Maker. |

Pipeline (`scripts/`, pacchetto separato):
- `fetch-items.mjs` → `items.json` e icone in `public/icons/items/`; unisce MetaForge, `scripts/data/custom-items/items.json` e gli override.
- `fetch-translations.mjs` (RaidTheory) e `fetch-category-icons.mjs`.
- `fetch-arctracker.mjs` e `scripts/lib/arctracker*.mjs`: ARC Tracker come riscontro, **solo in locale**; cache e rapporti sono ignorati da git.
- `scripts/oneshot/`: import una tantum dei pass (Frozen Trail, Legacy).

## Modello `List`
- `List` ([types.ts](../src/types.ts)) è una union discriminata su `listType`: `workbench`, `expedition`, `project`, `quest`, `pass`, `custom` ([ADR 002](adrs/002-astrazione-lista-generica.md)).
- Ogni lista ha livelli con materiali (`requirementItemIds`), `actions`, `tieredActions` e, per i pass, `rewards` per traccia.
- `getAllListsPure` unisce banchi, progetti, liste custom (condivise e proprie) e la spedizione attiva; fabbisogno e spesa operano sull'unione.
- Calcoli come funzioni pure in [selectors.ts](../src/store/selectors.ts).

## Store
- Una sola `useAppStore`, composta da slice: inventario, progresso, liste, profilo, personalità, impostazioni, spedizioni, reward pass.
- Dati statici caricati in [gameData.ts](../src/store/gameData.ts); stato iniziale per slice da [boot.ts](../src/store/boot.ts).
- Persistenza esplicita, per profilo, in [persistence.ts](../src/store/persistence.ts) tramite [safeStorage.ts](../src/lib/safeStorage.ts) (`safeLS`), con validazione in [validate.ts](../src/lib/validate.ts). Niente middleware `persist` ([ADR 001](adrs/001-zustand-senza-middleware-persist.md)).
- Il progresso di un pass riusa `currentLevels[passId]`.

## Feature flag
[featureFlags.ts](../src/lib/featureFlags.ts): valore di partenza da `feature-flags.json`, sovrascrivibile in locale. Un flag spento nasconde voci di menu e rotte associate.

## Strumenti Dev (solo dev server)
Pagine `Dev*` (dashboard, liste, oggetti custom, override, traduzioni, flag, navigazione, cestino) che modificano i dati statici senza toccare il codice.
- Le modifiche vivono in **bozze** nel browser (`localStorage`), salvate come differenze dal file ([draftStorage.ts](../src/lib/draftStorage.ts)).
- «Applica» scrive i file via [vite-plugins/dev-apply.ts](../vite-plugins/dev-apply.ts): solo localhost, solo percorsi di un elenco fisso, rifiuta di sovrascrivere un file cambiato su disco.
- Le liste eliminate finiscono nel cestino (`dev-trash/trash.json`, fuori dalla build).

## Convenzioni UI
- Le pagine (`src/pages/`) leggono lo store; i componenti (`src/components/`) sono presentazionali, via `props`.
- Card con superellisse: `rounded-[24px]` o `rounded-[28px]`.
- Drawer aperto dal lato del trigger, con [useDialog](../src/hooks/useDialog.ts) ([ADR 003](adrs/003-regola-direzione-drawer.md)).
- Convenzioni di codice: [STYLE_GUIDE.md](STYLE_GUIDE.md).
