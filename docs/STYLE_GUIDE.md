# Style Guide & Convenzioni di Codice

Questo documento formalizza le convenzioni di codice osservate nella codebase di **ARC Benches**, estratte e validate. Serve come riferimento per mantenere lo stile uniforme.

## Naming
- **Componenti React**: `PascalCase` per i nomi dei file (es. `FloatingNav.tsx`) e per la definizione delle costanti esportate. (Livello di confidenza: **Consistente**).
- **Librerie / Hook / Store**: `camelCase` per file di logica e helper (es. `craft.ts`, `inventorySlice.ts`). (Livello di confidenza: **Consistente**).
- **Tipi**: `PascalCase` per i type alias e le interfacce, spesso concentrati in `types.ts` o importati esplicitamente con `import type`. (Livello di confidenza: **Consistente**).

## Formattazione
- **Indentazione e Sintassi**: 2 spazi, apici singoli (single quotes), punto e virgola a fine riga. Le funzioni sono quasi sempre scritte come arrow functions (`const Fn = () => {}`). (Livello di confidenza: **Consistente**).
- **Stilizzazione**: Classi Tailwind CSS inline. Utilizzo massiccio di `dark:` per la modalità scura. (Livello di confidenza: **Consistente**).

## Pattern Architetturali
- **Gestione Stato (Zustand)**: Lo store è suddiviso in domain slices (es. `createInventorySlice`, `createProgressSlice`), unificate in `useAppStore` dentro `src/store/index.ts`. (Livello di confidenza: **Consistente** - pattern intenzionale e documentato).
- **Persistence Boundary Unico**: I salvataggi su `localStorage` avvengono esclusivamente tramite il sottoscrittore unico nel `src/store/index.ts`, disaccoppiando le scritture dalle action dei singoli domini per prevenire corruzioni cross-profilo. (Livello di confidenza: **Consistente** - commento architetturale esplicito trovato nel file).
- **Componenti UI**: Le icone provengono da `lucide-react`. I componenti funzionali spesso destrutturano direttamente le props nell'argomento. (Livello di confidenza: **Consistente**).

## Conclusione sulle Lenti
- **Intenzionalità vs Incidente storico**: L'uniformità del pattern Zustand e dei nomi dei componenti dimostra un'intenzionalità chiara. La separazione logica in "domain slices" e la documentazione interna (es. commenti architetturali in `store/index.ts`) indicano una progettazione consapevole (pattern del progetto, non abitudine isolata o proiezione temporanea).
