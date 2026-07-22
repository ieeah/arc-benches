# ARCHITECTURE.md — Mappa Architetturale

Mappa statica delle componenti e delle convenzioni del sistema **ARC Benches**.

---

## 🏗 Stack e Tecnologie
- **Core**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS v4 con varianti custom (`dark`) e utility di layout mobile.
- **State Management**: Zustand per lo stato client e le slice di dominio. Persistenza esplicita tramite adapter isolato [safeStorage.ts](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/lib/safeStorage.ts) (`safeLS`).
- **Drag & Drop**: `@dnd-kit/core` e `@dnd-kit/sortable`.

---

## 📦 Data Pipeline (Dati Statici)
L'app non effettua chiamate HTTP a runtime per recuperare dati di gioco.
- `src/data/items.json`: catalogo completo degli oggetti ingerito da MetaForge (~590 item) con rarità, tipi e banchi di produzione (`workbench`).
- `src/data/workbenches.json`: requisiti statici dei banchi da lavoro.
- `scripts/fetch-items.mjs`: script Node.js in ambiente separato per rigenerare `items.json` e ottimizzare le icone in `public/icons/items/`.

---

## 🔄 Modello Generico `List` & Selettori
- Il tipo generico `List` in [types.ts](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/types.ts) unifica i banchi di gioco (`listType: 'workbench'`) e le liste custom (`custom: true`, `shared: boolean`).
- `getAllListsPure` effettua l'unione `[...workbenches, ...sharedCustomLists, ...customLists]`. Tutti i calcoli di aggregazione spesa e fabbisogno operano sull'unione generica.
- I selettori dello store vivono come funzioni pure in [selectors.ts](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/store/selectors.ts).

---

## 📱 Convenzioni UI & Accessibilità
- **Separazione Pagine / Componenti**: le pagine in `src/pages/` comunicano con lo store Zustand; i componenti in `src/components/` sono puramente presentazionali (ricevono dati via `props`).
- **Superellisse**: card e contenitori usano `rounded-[24px]` o `rounded-[28px]`.
- **Drawer**: apertura coerente con il trigger (`from="top"` per trigger in alto, `from="bottom"` per trigger in basso) integrata con l'hook [useDialog](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/hooks/useDialog.ts).
