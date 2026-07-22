# ADR 001 — Zustand senza Middleware Persist Nativ

## Contesto
Il middleware `persist` fornito nativamente da Zustand causava errori silenziosi di serializzazione e desincronizzazione tra lo stato in memoria e `localStorage` in diversi contesti d'esecuzione (iframe, estensioni, contesti privati).

## Decisione
Rimuovere il middleware `persist` nativo e adottare una gestione esplicita con salvataggi mirati (`save()`) e try/catch isolato nel wrapper [safeStorage.ts](file:///c:/Users/flabianca/Projects/Personali/arc-benches/src/lib/safeStorage.ts) (`safeLS`).

## Conseguenze
- **Vantaggi**: Nessun crash su contesti con storage bloccato; controllo totale sulle chiavi salvate (`PersistedState`).
- **Svantaggi**: Le nuove action dello store devono richiamare esplicitamente la persistenza fino all'implementazione del Persistence Boundary unico.
