# Specifica — Condivisione Lista tramite Link

Riferimento Roadmap: [2_ROADMAP.md](file:///c:/Users/flabianca/Projects/Personali/arc-benches/docs/2_ROADMAP.md)

---

## 🎯 Obiettivo
Consentire agli utenti di condividere le proprie liste personalizzate con altri giocatori tramite un semplice URL pubblico, senza dover esportare file JSON.

---

## 🏗 Modello & Integrazione Supabase
- **Share Token**: colonna `share_token UUID UNIQUE NULL` nella tabella `lists`.
- **URL Pubblico**: `https://<app>/share/<token>`.
- **Importazione Copia**: l'utente che apre il link salva una copia indipendente della lista nel proprio profilo local-only / Supabase account.
- **Politiche RLS**: lettura pubblica consentita solo se `share_token IS NOT NULL`.
