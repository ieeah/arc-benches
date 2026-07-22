# Specifica Bug/A11y — Accessibilità Overlay e Controlli

Riferimento Backlog: [3_BACKLOG.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/3_BACKLOG.md)

---

## 🎯 Stato Implementativo
- `Drawer`: **Risolto** tramite [useDialog.ts](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/hooks/useDialog.ts) (focus trap, `role="dialog"`, gestione `Escape`, stack modali e ripristino focus).
- Controlli Icon-only: **In corso / Backlog**.

---

## 📋 Requisiti di Adeguamento WCAG AA
1. **Label e Aria-label**:
   - `InventoryCard`: `aria-label` su bottoni `+` / `-`.
   - `LevelPills`: `aria-label` descrittive ("Livello attuale X", "Obiettivo livello Y").
   - `ListRow`: label per la checkbox del toggle attivo.
2. **Contrasti**:
   - Verifica ed eventuale adeguamento del testo grigio piccolo (`text-gray-400` a `10px/11px`) su sfondi chiari.
