# 2_ROADMAP.md — Sviluppi Futuri

Roadmap delle funzionalità e dei sistemi non ancora presenti nel codice di **ARC Benches**.

---

- **Supabase — Schema Dati di Gioco (Fase 4a)**: tabelle condivise read-only `items` (catalogo completo con `stat_block` jsonb) e `workbenches`, con script di seed evoluto da MetaForge.
- **Supabase — Account & Auth (Fase 4b)**: autenticazione Supabase (magic link email, OAuth Discord/Google), tabelle `profiles` e `profile_state` con Row Level Security (RLS).
- **Supabase — Sync Background (Fase 4c)**: sincronizzazione background offline-first con debounce (~2s) e risoluzione conflitti a last-write-wins su `updated_at`.
- **Spedizioni & Progetti (Fase 3)**: tracking spedizioni attive/completate e progressi progetti per profilo come istanze del motore `List`. Integra le meccaniche ibride di donazione a valore, step progressivi e un tracker per spedizioni completate (con calcolo degli skill points extra guadagnati) per mostrare solo la spedizione attiva tra quelle disponibili — vedi dettaglio in [spedizioni-e-donazioni.md](specs/spedizioni-e-donazioni.md).
- **Date di Scadenza per Liste e Progetti (Fase 3)**: supporto alle date di scadenza per ciascuna lista o progetto, con visualizzazione del tempo rimanente e notifiche/indicatori visivi di scadenze imminenti.
- **Selettore Vista Stash (Fase 3)**: introduzione di un selettore di vista (griglia compattata vs lista dettagliata) nella pagina Stash. La vista Lista mostrerà informazioni dettagliate di dipendenza di ciascun oggetto (es. "necessario per: lista X, spedizioni").
- **Tour Onboarding con driver.js (Fase 3)**: tour guidato in ~8 step attraverso i tab con trigger al primo avvio e replay manuale.
- **Internazionalizzazione i18n (Fase 3)**: estrazione stringhe UI e supporto multilingua dei nomi oggetti/banchi preservando la ricerca a doppia lingua (es. alias in inglese per nomi in italiano).
- **Checklist Stampabile (Fase 3)**: esportazione lista della spesa in vista print-friendly `@media print` o PDF client-side per Discord/gruppo raid.
- **Role Maker — Randomizer di Personalità (Fase 3)**: generator di archetipi comportamentali post-spedizione basato su matrice PvP/PvE/Social — vedi dettaglio in [role-maker.md](specs/role-maker.md).
- **Role Maker — Estensione Biografie & Lore**: arricchire le biografie dei 20 archetipi in `personalities.json` e `role-maker.md` trasformandole da semplici descrizioni caratteriali a vere narrazioni personali (storia passata, eventi scatenanti prima/durante l'Esodo, traumi e ragioni psicologiche della condotta in superficie).
- **Condivisione Lista tramite Link (Fase 4d)**: generazione `share_token` e route pubblica `/share/<token>` per importazione lista custom — vedi dettaglio in [condivisione-liste-link.md](specs/condivisione-liste-link.md).
- **Vista Aggregata per Banco (Fase 3)**: modalità secondaria con raggruppamento collassabile dei materiali mancanti per banco di destinazione.
- **View Transitions**: integrare le View Transitions API per ottenere animazioni fluide durante la navigazione da una pagina all'altra dell'app.
- **Next.js & Vercel (Fase 5)**: migrazione strutturale dell'infrastruttura dell'app da Vite SPA a Next.js (App Router) su Vercel per supportare SSR e Server Actions (ADR 005).
