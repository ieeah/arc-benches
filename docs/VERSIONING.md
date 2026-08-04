# Versioning

Piano previsionale delle versioni verso l'MVP (1.0.0) e oltre, basato sui task presenti in [1_CURRENT.md](1_CURRENT.md), [2_ROADMAP.md](2_ROADMAP.md) e [3_BACKLOG.md](3_BACKLOG.md) al momento della stesura (luglio 2026).
Il contenuto testuale del cosa-è-cambiato per versione non vive qui — per quello, vedi i tag Git e i changelog linkati in `changelog/`.

---

## Versione corrente

**0.1.0** ("Primo Rifugio"), determinata dal tag Git `v0.1.0`.

> **Nota su v0.2.0**: Il codice in `1_CURRENT.md` contiene già le funzionalità di Multi-profilo Locale e Liste Custom, ma il tag Git non è ancora stato formalizzato. Pertanto, la 0.2.0 è marcata come **Raggiunta (da taggare)**.

---

## Tema dei nickname: *Fasi di Sopravvivenza & Ricostruzione del Rifugio (ARC Raiders)*

I nickname seguono l'evoluzione narrativa del rifugio dei Raiders in Speranza:
- **0.1.0**: *Primo Rifugio* (Foundation tracker locale)
- **0.2.0**: *Sacca dei Materiali* (Gestione multi-profilo e liste custom)
- **0.3.0**: *Banco da Lavoro* (Rafforzamento architetturale & identity/roleplay)
- **0.4.0**: *Mappa di Spedizione* (Spedizioni, progetti e decisioni su materiali)
- **0.5.0**: *Segnale Radio* (Condivisione, i18n e onboarding della community)
- **1.0.0**: *Rete Speranza* (MVP Completo con cloud sync Supabase)

---

## 0.1.0 "Primo Rifugio" — Tracker Base & Stash Aggregato — Raggiunta
- **Tracker Local-only (Fase 0)** (→ [1_CURRENT.md](1_CURRENT.md))
- **Livelli Obiettivo come Insieme & Azioni Checkbox** (→ [1_CURRENT.md](1_CURRENT.md))
- **Automatismo Inventario & Refiner Badge** (→ [1_CURRENT.md](1_CURRENT.md))
Changelog: [changelog/0.1.0.md](../changelog/0.1.0.md)

---

## 0.2.0 "Sacca dei Materiali" — Multi-Profilo, UX Mobile-First & Accessibilità — Raggiunta (in attesa di tag)
- **Multi-profilo Locale & Liste Custom (Fase 1)** (→ [1_CURRENT.md](1_CURRENT.md))
- **Import / Export v3 Multi-profilo** (→ [1_CURRENT.md](1_CURRENT.md))
- **UI / UX Mobile-First** (→ [1_CURRENT.md](1_CURRENT.md))
- **Accessibilità Overlay Legacy & Controlli** (→ [3_BACKLOG.md](3_BACKLOG.md) / [accessibilita-overlay-e-controlli.md](specs/bugs/accessibilita-overlay-e-controlli.md))

---

## 0.3.0 "Banco da Lavoro" — Identity & Solidità Architetturale — Non ancora raggiunta
- **Role Maker — Randomizer di Personalità (Fase 3)** (→ [2_ROADMAP.md](2_ROADMAP.md) / [role-maker.md](specs/role-maker.md))
- **Selettore Vista Stash (Fase 3)** (→ [2_ROADMAP.md](2_ROADMAP.md))
- **Persistence Boundary Unico** (→ [3_BACKLOG.md](3_BACKLOG.md))
- **Lockfile NPM WASM Check** (→ [3_BACKLOG.md](3_BACKLOG.md))
- **Validazione Runtime Schemi (Zod)** (→ [3_BACKLOG.md](3_BACKLOG.md))
- **UX Input Numerici Stash** (→ [3_BACKLOG.md](3_BACKLOG.md))
- **Logica Icona Refiner in Stash** (→ [3_BACKLOG.md](3_BACKLOG.md))
- **Overflow Componenti Floating** (→ [3_BACKLOG.md](3_BACKLOG.md))

---

## 0.4.0 "Mappa di Spedizione" — Spedizioni, Progetti & Decisioni Materiali — Non ancora raggiunta
- **Spedizioni & Progetti (Fase 3)** (→ [2_ROADMAP.md](2_ROADMAP.md))
- **Date di Scadenza per Liste e Progetti (Fase 3)** (→ [2_ROADMAP.md](2_ROADMAP.md))
- **Supporto Tastiera per Drag & Drop** (→ [3_BACKLOG.md](3_BACKLOG.md))
- **Revisione Ordine Menu FloatingNav** (→ [3_BACKLOG.md](3_BACKLOG.md))
- **Icone Categoria Elementi** (→ [3_BACKLOG.md](3_BACKLOG.md))

---

## 0.5.0 "Segnale Radio" — Community, Sharing & Onboarding — Non ancora raggiunta
- **Condivisione Lista tramite Link (Fase 3)** (→ [2_ROADMAP.md](2_ROADMAP.md) / [condivisione-liste-link.md](specs/condivisione-liste-link.md))
- **Vista Aggregata per Banco (Fase 3)** (→ [2_ROADMAP.md](2_ROADMAP.md))
- **Role Maker — Estensione Biografie & Lore** (→ [2_ROADMAP.md](2_ROADMAP.md))
- **Tour Onboarding con driver.js (Fase 3)** (→ [2_ROADMAP.md](2_ROADMAP.md))
- **Checklist Stampabile (Fase 3)** (→ [2_ROADMAP.md](2_ROADMAP.md))
- **Internazionalizzazione i18n (Fase 3)** (→ [2_ROADMAP.md](2_ROADMAP.md))
- **View Transitions** (→ [2_ROADMAP.md](2_ROADMAP.md))

---

## 1.0.0 "Rete Speranza" — MVP Completo & Cloud Sync Supabase — Non ancora raggiunta
- **Supabase — Schema Dati di Gioco (Fase 2a)** (→ [2_ROADMAP.md](2_ROADMAP.md))
- **Supabase — Account & Auth (Fase 2b)** (→ [2_ROADMAP.md](2_ROADMAP.md))
- **Supabase — Sync Background (Fase 2c)** (→ [2_ROADMAP.md](2_ROADMAP.md))

---

## Oltre 1.0.0
- Nuovi banchi e materiali dalle patch future di ARC Raiders.
- Dashboard avanzata di gruppo / raid squad.
