# 2_ROADMAP.md — Sviluppi Futuri

Roadmap delle funzionalità e dei sistemi non ancora presenti nel codice di **ARC Benches**.

---

- **Supabase — Schema Dati di Gioco (Fase 2a)**: tabelle condivise read-only `items` (catalogo completo con `stat_block` jsonb) e `workbenches`, con script di seed evoluto da MetaForge.
- **Supabase — Account & Auth (Fase 2b)**: autenticazione Supabase (magic link email, OAuth Discord/Google), tabelle `profiles` e `profile_state` con Row Level Security (RLS).
- **Supabase — Sync Background (Fase 2c)**: sincronizzazione background offline-first con debounce (~2s) e risoluzione conflitti a last-write-wins su `updated_at`.
- **Spedizioni & Progetti (Fase 3)**: tracking spedizioni attive/completate e progressi progetti per profilo come istanze del motore `List`.
- **Tieni o Butta — Indicatore "Non Vendere" (Fase 3)**: stato derivato per oggetto (da tenere se richiesto da banchi/progetti/missioni futuri vs vendibile) — vedi dettaglio in [tieni-o-butta.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/specs/tieni-o-butta.md).
- **Tour Onboarding con driver.js (Fase 3)**: tour guidato in ~8 step attraverso i tab con trigger al primo avvio e replay manuale.
- **Internazionalizzazione i18n (Fase 3)**: estrazione stringhe UI e supporto multilingua dei nomi oggetti/banchi preservando la ricerca in lingua inglese.
- **Checklist Stampabile (Fase 3)**: esportazione lista della spesa in vista print-friendly `@media print` o PDF client-side per Discord/gruppo raid.
- **Role Maker — Randomizer di Personalità (Fase 3)**: generator di archetipi comportamentali post-spedizione basato su matrice PvP/PvE/Social — vedi dettaglio in [role-maker.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/specs/role-maker.md).
- **Role Maker — Estensione Biografie & Lore**: approfondire le biografie dei 20 archetipi per giustificare nel dettaglio le motivazioni psicologiche, il passato e le ragioni del comportamento in superficie.
- **Condivisione Lista tramite Link (Fase 3)**: generazione `share_token` e route pubblica `/share/<token>` per importazione lista custom — vedi dettaglio in [condivisione-liste-link.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/specs/condivisione-liste-link.md).
- **Vista Aggregata per Banco (Fase 3)**: modalità secondaria con raggruppamento collassabile dei materiali mancanti per banco di destinazione.
