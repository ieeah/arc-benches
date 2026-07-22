# Specifica — Ottimizzazione Zustand (Selettori Pure & Memoizzazione)

Riferimento Stato Attuale: [1_CURRENT.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/1_CURRENT.md)

---

## 🎯 Stato Implementativo
Implementato in [src/store/selectors.ts](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/store/selectors.ts).

---

## 💡 Architettura dei Selettori Pure
Tutti i ricalcoli di fabbisogno materiali, ordinamento e filtri sono stati estratti dallo store Zustand in **funzioni pure**:
- `getAllListsPure`: unione di banchi e liste custom.
- `getOrderedListsPure`: ordinamento mediante `Map` di indicizzazione ad alta efficienza $O(n)$.
- `getOtherNeedsPure`: calcolo sottrattivo del fabbisogno degli altri banchi attivi per evitare $N$ iterazioni complete $O(N \times \text{banchi})$.
