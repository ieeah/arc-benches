# Analisi congiunta — Issue #17, #18, #42

Prodotta da `nuova-issue` come base per il `tech-spec` congiunto. Non sostituisce
le spec di dettaglio già esistenti — le mette in relazione e verifica lo stato
reale del codice rispetto a quanto descrivono.

## Perché raggruppare

Le tre issue toccano lo stesso set di file core del motore `List`, nello stesso
ordine di dipendenza:

- `src/types.ts` — `List`, `ListLevel`, `CheckboxAction` vanno estesi da **tutte e
  tre** (nuovi campi per #17/#18, nessuna modifica di tipo per #42 ma nuova logica
  che li consuma).
- `src/lib/validate.ts` — `validateList`/`validateLevel`/`validateAction` vanno
  aggiornati in coordinamento, non in 3 passate scollegate.
- `src/store/selectors.ts` — `getTotalRequiredMaterialsPure`/`getMissingMaterialsPure`
  devono escludere le liste scadute (#18) **mentre** viene introdotta una nuova
  funzione gemella per le azioni mancanti (#42) — stessa pipeline di calcolo, stesso
  punto di aggancio in `StashPage.tsx`.
- `src/pages/StashPage.tsx` — riceve sia la sezione "azioni mancanti" (#42) sia gli
  effetti visivi di scadenza propagati da #18.

Fare le tre issue in sequenza scollegata rischierebbe di modificare le stesse
funzioni tre volte con assunzioni diverse. Il roadmap (`docs/2_ROADMAP.md`) già
annida #42 sotto #17.

## Scope — cosa è #17

Confermato con l'utente: **entrambi** i documenti di specifica già esistenti
appartengono a #17:

- [`docs/specs/spedizioni-e-donazioni.md`](spedizioni-e-donazioni.md) — motore di
  requisiti ibridi (oggetti / azioni checkbox / donazioni a valore) per Spedizioni
  e Progetti, riusando l'infrastruttura `List`.
- [`docs/specs/spedizioni.md`](spedizioni.md) — sistema Carovane/Prestige (Fasi
  1-6, Damage Gate, Catch-Up SP, reset post-spedizione), stato profilo dedicato
  (`completedExpeditionsCount`, `earnedPermanentSkillPoints`, `consecutiveStreak`,
  `departureWindowActive`).

**Fuori scope**: #34 "Vault Spedizione (Cassaforte Wipe)" — meccanica collegata ma
extra, non trattata in questo tech-spec.

## Stato reale del codice (verificato, non assunto dai doc)

- `ItemRequirement { itemId, quantity }`, `CheckboxAction { id, label }`,
  `ListLevel { level, requirementItemIds, actions? }` — **nessun campo di valore
  target o categoria** su `CheckboxAction`. La meccanica "donazione a valore" di
  spedizioni-e-donazioni.md può essere implementata **senza estendere il tipo**,
  incorporando il target nel testo del `label` (come la spec stessa propone: `"Donazione
  Provviste Completata (0/200.000)"`) — punto da confermare in tech-spec.
- `List { id, name, maxLevel, levels, custom?, listType?, shared? }` —
  `listType` è già `'workbench' | 'project' | 'quest' | 'custom'`: **nessun
  `'expedition'`**, **nessun `expirationDate`**, **nessun `rewards`**. Vanno aggiunti
  entrambi (tech-spec deve decidere se le Carovane usano un nuovo `listType:
  'expedition'` o restano `'project'` con stato profilo separato, come già
  suggerisce spedizioni.md).
- `selectors.ts`: tutte le pure function operano solo su `requirementItemIds`,
  **zero logica di scadenza o di azioni** — nessuno stub da rimuovere, si parte da
  zero pulito.
- `checkedActions` (chiave `"${listId}|${level}|${actionId}"`) vive in
  `progressSlice.ts`, già usato da `ListDetailPage.tsx`/`ActionCheckbox.tsx`/
  `CustomListEditor.tsx` — pattern di riferimento diretto e riusabile sia per le
  azioni "normali" di #42 sia per Damage Gate/Catch-Up di #17 (che infatti
  spedizioni.md già propone di modellare con le stesse chiavi
  `expedition-damage|0|tier_{1..5}`).
- `validate.ts`: nessuna validazione di data/rewards — punto di innesto chiaro in
  `validateList`.

## Piano d'intervento (ordine di dipendenza)

1. **#18 prima** (più piccola, sblocca le altre): estendere `List` con
   `expirationDate`, `ListLevel` con `rewards`; validazione in `validate.ts`;
   esclusione liste scadute in `getTotalRequiredMaterialsPure`/
   `getMissingMaterialsPure`; UI countdown/banner (`UnifiedListCard`,
   `ListDetailPage`).
2. **#42**: nuovo selector `getMissingActionsPure` (stesso pattern di
   `getMissingMaterialsPure`, ma su `lvl.actions` + `checkedActions`, escludendo
   liste scadute per coerenza con #18); nuova sezione in `StashPage.tsx`.
3. **#17**: motore requisiti ibridi (riusa #18 per `listType`/scadenze delle
   Spedizioni-Progetti, riusa #42 per la vista azioni mancanti delle donazioni);
   poi, come intervento largo a sé, il sistema Carovane/Prestige (stato profilo
   dedicato, `ExpeditionPage.tsx`, reset logic) — **non tecnicamente bloccante
   verso #18/#42, ma va disegnato per ultimo** perché consuma entrambi.

## Dubbi da risolvere in tech-spec (non bloccanti per l'analisi)

- `listType: 'expedition'` nuovo vs riuso di `'project'` per le Carovane.
- Se il target di valore delle donazioni resta testo libero nel `label` o merita
  un campo strutturato su `CheckboxAction` (impatta `validate.ts` e UI di editing
  in `CustomListEditor.tsx`).
- Se `getMissingActionsPure` deve escludere anche le azioni già auto-spuntate da
  level-up (`setModuleCurrentLevel`/`upgradeModule` le marcano `true`
  automaticamente) — presumibilmente sì, da confermare.
