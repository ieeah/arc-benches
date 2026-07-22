# UI Patterns e Componenti

Documento di dettaglio sulle convenzioni dell'interfaccia utente e l'architettura dei componenti in **ARC Benches**.

---

## 🎨 Design System e Temi

- **Mobile-First**: L'interfaccia è progettata primariamente per l'utilizzo su dispositivi mobili.
- **Tailwind CSS v4**: Gestione degli stili tramite utility classes e varianti custom (es. `@custom-variant dark` in `index.css`).
- **Dark Mode**: Attivata tramite classe `dark` sull'elemento `<html>`. La preferenza dell'utente è persistita in `localStorage` (`theme`).
- **ThemeContext**: Il tema è gestito tramite Context React isolato (`src/context/ThemeContext.tsx` e `src/context/ThemeProvider.tsx`). I componenti consumano direttamente il context senza necessità di prop-drilling.

---

## 🧩 Separazione dei Componenti

Per mantenere un'architettura pulita e scalabile:
1. **Pagine (`src/pages/`)**:
   - Gestiscono le viste principali (es. `StashPage`, `HideoutPage`, `GoalsPage`, `ItemsPage`).
   - Comunicano direttamente con lo store Zustand (`useAppStore`).
2. **Componenti Presentazionali (`src/components/`)**:
   - Ricevono dati ed eventi esclusivamente tramite `props`.
   - Non accedono mai direttamente allo store Zustand.

---

## 📐 Regole di Posizionamento ed Elementi Fissi

- **`SectionHeader`**: Componente fisso per l'intestazione delle pagine. Garantisce che il pulsante di Theme Toggle sia sempre posizionato a destra e il pulsante Database affiancato.
- **Direzione dei Drawer (`Drawer`)**:
  - Il drawer deve aprirsi sempre nella direzione coerente con la posizione del trigger di apertura:
    - Trigger in alto $\rightarrow$ `from="top"`
    - Trigger in basso $\rightarrow$ `from="bottom"`
    - Menu o trigger laterali $\rightarrow$ `from="left"` / `from="right"`
- **Interazioni Mobile**:
  - Input numerici con `inputMode="numeric"` per forzare la tastiera numerica mobile.
  - Long-press tramite l'hook `useLongPress` sui pulsanti `−/+` per incrementi/decrementi rapidi.
  - Sensor touch per il Drag & Drop (`@dnd-kit`) con delay di 200ms per evitare conflitti con lo scroll verticale della pagina.
