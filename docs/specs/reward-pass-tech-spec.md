# Tech Spec — Reward Pass "Frozen Trail"

Valutazione di come rappresentare il Reward Pass di *ARC Raiders* (Frozen Trail, disponibile dall'8 ottobre 2026) in ARC Benches: riuso del meccanismo **liste** già esistente oppure meccanismo dedicato.

Stato: **decisioni principali prese e implementate (2026-10-09)**. Il modello `listType: 'pass'` e l'editor Dev sono in #85; la pagina utente (selezione, anteprima, vista a livelli, pass attivo e completati) e lo stato per profilo sono implementati dietro il feature flag `reward-pass`, spento di default, perché il seed è ancora vuoto. Il Frozen Trail è popolato (D15); restano aperte D2 (dettaglio) e il Legacy Pass (dati in arrivo, D4); import/export dei nuovi campi è nella #74.

Issue di riferimento: [#85 Modello Reward Pass come tipo di lista + editor Dev dei pass](https://github.com/ieeah/arc-benches/issues/85), [#90 Reward Pass Tracker (solo livelli e ricompense, dati inseriti a mano; niente Feats)](https://github.com/ieeah/arc-benches/issues/90). Contesto già analizzato in [frozen-trail.md](frozen-trail.md).

---

## 1. Dati di riferimento e fonti

| Dato | Beebom | UrGameTips | Polygon |
| :--- | :--- | :--- | :--- |
| Livelli | 60 | 60 | non letta (errore di accesso) |
| Prezzo premium | 1.150 Raider Token | 1.150 Raider Token | — |
| Token gratuiti | 50 (tier 40), 100 (tier 55) | fino a 200 | — |
| Token premium | 200 (tier 4, 16, 28, 40), 300 (tier 55) | totale "fino a 1.150" se completato | — |
| Soglie punti | 135 (tier 1) → 8.985 (tier 60), +150 per tier | non indicate | 150 (tier 1) → 9.000 (tier 60), +150 per tier |
| Ricompense per tier | solo esempi (tier 1, 13, 25, 37, 49, 60) | non elencate | tabella completa 1–60, free e premium |
| Fine stagione | non indicata | non indicata | — |
| Progressione | punti ricompensa da missioni/obiettivi | Feat: 15 / 25 / 50 punti; 3 traguardi settimanali da 250 punti | — |

Osservazioni:

- **Le fonti non concordano sui Token.** Beebom attribuisce al premium 1.150 Token e ai tier gratuiti 150 Token totali; UrGameTips parla di fino a 200 gratuiti e di un totale di 1.350 (free + premium). Il dato va verificato in gioco prima di essere inserito nei dati.
- **Polygon fornisce la tabella completa** (fornita come HTML incollato dall'utente): 60 righe, tier 1–60 senza buchi, con ricompensa free e premium per ogni tier. Il tracciato premium è vuoto (`N/A`) in 10 tier: 6, 12, 18, 24, 30, 36, 42, 48, 54, 60.
- **Soglie punti (confermate)**: Frozen Trail a 150 punti per tier, quindi Polygon (150 × tier, tier 60 = 9.000) è corretta e la stima di Beebom (135 di partenza, 8.985) è errata. Legacy Pass: 100 punti per livello. Le soglie restano fuori dallo scope del tracker (vedi D10).
- **Token dalla tabella Polygon**: gratuiti 200 (tier 40, 50, 55: 50 + 50 + 100); premium 1.100 (tier 4, 16, 28, 40: 200 ciascuno; tier 55: 300). Totale 1.300, non 1.350 come indicato da UrGameTips. Il prezzo di 1.150 Token resta quello dichiarato da Beebom e UrGameTips.
- **Legacy Pass non coperto** da nessuna fonte: va inserito a mano (D4).
- **Le ricompense sono in gran parte cosmetiche** (tute, accessori, colorazioni, stencil, emote). Non tutte sono probabilmente presenti nel catalogo `items.json`. Vedi decisione D3.

## 2. Stato attuale del progetto

Dopo #85 (verificato nel codice):

- **Modello `List` generico** in `src/types.ts` (ADR-002): `ListBase` con `maxLevel`, `levels: ListLevel[]`, `startDate?`, `expirationDate?`, `prerequisites?`. Unione discriminata su `listType`: `'workbench' | 'expedition' | 'project' | 'quest' | 'pass' | 'custom'`.
- **`PassList`** (`listType: 'pass'`): `tracks: PassTrackDef[]` e `premiumCostTokens?` (lasciato opzionale, vedi D10). `Reward` ha `track?`; la validazione rende esplicita la traccia (D9) e scarta le ricompense di tracce non dichiarate.
- **`ListLevel`** ha `rewards?: Reward[]`; `Reward` è `{ itemId, quantity, track? }` (sempre un oggetto del catalogo).
- **Seed e editor Dev**: `src/data/passes.json` (vuoto), gruppo «Reward Pass» in Gestione Liste (nuovo pass con tracce free/premium; come ogni nuova lista parte da un solo livello), pannello tracce, selettore di traccia nelle ricompense di livello. Requisiti, azioni e scaglioni sono nascosti per i pass.
- **Cestino Dev** (`dev-trash/trash.json`): accoglie le tracce rimosse e le liste eliminate (D9).
- **Il pass non è caricato nell'app utente** (come le quest): non entra in Stash, fabbisogno o liste attive. `expirationDate` esiste su `List` ma non è usato dai pass (D5).
- **Valuta "Reward Points"** è nel catalogo (`items.json`, da `scripts/data/custom-items/`), ma non è selezionabile come requisito di consegna.
- **Non esiste ancora** lo stato per profilo (pass attivo, pass completati, tier raggiunto di un pass) né alcuna pagina utente del pass: sono #90.

Vincolo di prodotto già deciso (#90): **niente Feats**. Il tracker traccia solo il tier raggiunto e le ricompense.

## 3. Opzioni valutate

### Opzione A — Riuso di `custom` senza modifiche

Il pass è una lista `custom`, con 60 livelli, ciascuno con `rewards`. Il tier raggiunto è `currentLevel`.

- Pro: zero modifiche a tipi, store, selettori o editor dev.
- Contro: le liste custom sono create dall'utente e persistite nel profilo; il pass è invece contenuto di gioco da distribuire come seed (read-only), come workbench e progetti. Non c'è modo di distinguere free/premium. Ogni utente dovrebbe reinserire i 60 tier a mano. Non risolve #85.

### Opzione B — Nuovo `listType: 'pass'` sul modello `List` (consigliata)

Il pass diventa un tipo di lista seed, come `workbench`/`project`/`quest`, con dati in `src/data/passes.json` gestiti dall'editor Dev. Il motore non viene toccato perché i tier non hanno `requirementItemIds`. Il tracciato è un attributo della ricompensa, non una lista separata.

- Pro: segue ADR-002 ("generalizzare la lista"). Riusa `ListRow`, `UnifiedListCard`, editor Dev, `currentLevel`, `expirationDate` (stagione), ordinamento e import/export. Un solo progresso per pass (il premium sblocca solo ricompense, non cambia i tier).
- Contro: serve aggiungere un bucket in più in `LIST_FILES`, nei tipi e nell'editor Dev. Serve un punto di esclusione nel calcolo dei materiali e nelle liste attive (vedi rischi R1).

### Opzione C — Meccanismo dedicato (store slice + pagina + componenti propri)

Un nuovo slice `passSlice`, una pagina `PassPage`, un modello di dati dedicato con soglie punti.

- Pro: modella esattamente il sistema a punti e soglie di gioco; permette in futuro i Feats senza vincoli del modello lista.
- Contro: duplica persistenza, import/export, drag&drop, editor dev e tracking che la lista già fornisce, in contrasto con ADR-002. Costo alto per un valore che #90 non richiede (niente Feats).

**Raccomandazione: Opzione B.** Se in futuro si vorranno i Feats o un calcolo a punti, si aggiunge un campo opzionale sul livello (`pointsRequired`) senza cambiare il modello. Passare a C in quel momento è più economico che costruire C ora.

## 4. Modello dati

```ts
// src/types.ts

/** Id della traccia (es. 'free', 'premium', 'legacy'): una stringa libera, così nuove tracce sono solo dati (D7). */
export type PassTrack = string;

export interface Reward {
  itemId: string;          // invariato: ricompensa da catalogo
  quantity: number;
  track?: PassTrack;       // solo per i livelli di un pass; la validazione assegna la prima traccia se manca (D9)
}

export interface PassTrackDef {
  id: PassTrack;
  name: string;
  translations?: Record<string, { name?: string }>;
  /** Traccia a pagamento: le sue ricompense mostrano il lucchetto, come nel gioco. */
  locked?: boolean;
}

export type ListType = 'workbench' | 'project' | 'quest' | 'custom' | 'expedition' | 'pass';

/** Reward Pass (seed read-only, come i banchi). La stagione e il Legacy sono pass distinti (D4). */
export interface PassList extends ListBase {
  listType: 'pass';
  /** Tracce del pass, nell'ordine di visualizzazione (D7). */
  tracks: PassTrackDef[];
  /** Costo del tracciato premium in Raider Token (solo informativo, opzionale: D10). */
  premiumCostTokens?: number;
}

export type List = WorkbenchList | ExpeditionList | ProjectList | QuestList | CustomList | PassList;
```

Stato per profilo (non nel seed, da implementare in #90):

```ts
activeRewardPass: string | null;      // id del pass attivo; al massimo uno alla volta (D11)
completedRewardPasses: { id: string; name: string; completedAt: string }[];  // storico dei pass conclusi: resta visibile e alimenterà la futura pagina dei trofei (il nome è una copia, il seed potrebbe non averlo più)
// currentLevels[passId] = tier raggiunto (riuso del meccanismo esistente)
// passPremiumUnlocked: Record<string, boolean>  — vedi D2
```

Helper puri previsti per #90 (in `src/store/selectors.ts` o file dedicato):

```ts
export function getPassRewardsForTier(list: PassList, tier: number, unlockedPremium: boolean): Reward[];
export function getPassClaimableRewards(list: PassList, currentTier: number, unlockedPremium: boolean): Reward[];
```

Regole di filtro proposte:

- Ogni ricompensa ha una traccia dichiarata (D9). `free` → visibile quando `tier <= currentTier`; `premium` → solo se `unlockedPremium`.
- Altre tracce: regola dichiarata dal pass stesso (D7). Un `track` non dichiarato in `tracks` viene scartato in validazione.

Il selettore `getTotalRequiredMaterialsPure` non deve cambiare: una lista `pass` senza `requirementItemIds` non produce fabbisogno. Finché il pass non è caricato nell'app utente non può comparire nelle viste di fabbisogno (vedi R1).

## 5. Interfaccia

- **Editor Dev** (fatto in #85): gruppo `pass` in `DevListsPage` con pannello tracce (nome EN/IT, flag «a pagamento»), selettore di traccia nelle ricompense e cestino.
- **Pagina utente** `#/reward-pass` (feature flag `reward-pass`), a seconda dello stato del profilo:
  - **Nessun pass attivo**: le card dei pass non conclusi, ben visibili, e in fondo la sezione dei pass conclusi (con data). Ogni card porta alla pagina di anteprima.
  - **Pagina di anteprima** di un pass: nome e costo del premium (se presente); descrizione; livelli e tracce; ricompense totali (valute per oggetto, il resto per tipo: blueprint, outfit…); pulsante «Dettaglio livelli e tracce»; pulsante «Imposta come pass attivo» con modale di conferma (disabilitato, con il motivo, se c'è già un pass attivo o se è già concluso).
  - **Pass attivo**: la pagina è direttamente la vista a livelli (sotto), con il tier raggiunto (− / + o tocco sul livello) e «Concludi pass» (conferma). Un pulsante nell'header porta comunque all'elenco dei pass (`view=all`), con il pass attivo segnato, per dare solo un'occhiata agli altri; le anteprime restano in sola lettura e «Imposta come pass attivo» è disabilitato.
- **Vista a livelli** (copia del gioco, adattata al mobile): scorrimento verticale con il binario dei livelli a sinistra (il più alto in cima, come nel gioco), le tracce affiancate, ogni ricompensa come icona dell'oggetto con la quantità; le tracce `locked` mostrano il badge del lucchetto sulle icone, e anche nell'intestazione della colonna. Sfondo scuro «spaziale» (alone e stelle, senza l'anello e la scena 3D del gioco). Si scorre al prossimo livello da raggiungere, evidenziato; i livelli raggiunti e le loro ricompense sono disabilitati. Un tocco sull'icona apre il dettaglio dell'oggetto.
- **Opzioni di visualizzazione** nell'header (drawer dall'alto): tracce visibili, per dispositivo. «La mia traccia» si ottiene nascondendo le altre.
- **Impostazioni**: «Cambia pass attivo» (D11), con doppia conferma e avviso che il progresso viene eliminato.
- **Pass attivo non più nel seed** (R5): alla visita della pagina si chiede se segnarlo come **completato** (finisce nello storico/trofei) o **non completato** (il progresso viene eliminato), oppure di decidere dopo. Vale finché non esiste un archivio dei vecchi pass (probabile con il passaggio a un DB vero).
- Il tracciato premium non cambia l'avanzamento: è solo un filtro di visualizzazione.
- UI in italiano, abbreviazione "Lvl" (AGENTS.md); i drawer si aprono dal lato del pulsante che li apre (ADR-003).

## 6. File coinvolti

| File | Ruolo | Stato |
| :--- | :--- | :--- |
| `src/types.ts` | `PassTrackDef`, `PassList`, `Reward.track`, `ListType` | fatto (#85) |
| `src/lib/lists.ts`, `src/lib/validate.ts` | `isPass`, `DEFAULT_PASS_TRACKS`, validazione di tracce e `track` | fatto (#85) |
| `src/data/passes.json` | seed dei pass (tier, ricompense) | creato vuoto (#85) |
| `src/lib/devArtifacts.ts`, `src/hooks/dev/*`, `src/pages/DevListsPage.tsx`, `src/components/dev/DevPassSection.tsx` | gruppo `pass` e pannello tracce nell'editor Dev | fatto (#85) |
| `vite-plugins/dev-trash.ts`, `src/lib/devTrash.ts` | cestino Dev | fatto |
| `src/store/gameData.ts`, `src/store/rewardPassSlice.ts` | caricamento del seed, `activeRewardPass`, `completedRewardPasses`, azioni di selezione/conclusione/orfano | fatto (#90) |
| `src/store/persistence.ts`, `src/lib/validate.ts` | persistenza per profilo dei nuovi campi | fatto (#90) |
| import/export dei profili (`profileSlice`, `listIO`) | includere `activeRewardPass` e `completedRewardPasses` | #74 |
| `passPremiumUnlocked` | conteggio delle ricompense ottenibili | da decidere (D2) |
| `src/lib/rewardPass.ts`, `src/lib/passViewPrefs.ts` | totali delle ricompense, nomi delle tracce, preferenze di vista | fatto (#90) |
| `src/pages/RewardPassPage.tsx`, `src/components/pass/*`, `ChangeActivePassSection` | selezione, anteprima, vista a livelli, orfano, Impostazioni | fatto (#90) |
| `src/lib/featureFlags.ts`, `src/data/nav.json` | flag `reward-pass` (spento) e voce di menu | fatto (#90) |
| `src/i18n/locales/it.ts`, `en.ts` | etichette del flusso | fatto (#90) |

## 7. Decisioni

- **D1 — Modello**: ✅ **deciso** — Opzione B: i pass sono liste (`listType: 'pass'`); cambia solo la visualizzazione in UI (D8).
- **D2 — Stato premium**: *aperta.* Campo per profilo `passPremiumUnlocked`, non nel seed e non nel `List`, incluso in import/export. Con D8 le preferenze di visualizzazione (tracce nascoste, «la mia traccia») fanno da filtro di visibilità; D2 resta per il solo conteggio delle ricompense. Da riprendere in #90.
- **D3 — Ricompense cosmetiche non presenti nel catalogo**: ✅ **deciso e applicato (D15)** — oggetti custom con note «da rivedere». Testo originale:  `Reward` richiede `itemId`. Opzioni: (a) `label` e `itemId` opzionali, con migrazione di validate e UI; (b) aggiungere gli oggetti a `scripts/data/custom-items/` (oggi gestibili dal Custom Items Studio). *Raccomando (b) per i cosmetici con nome stabile, da confermare dopo aver verificato quali ricompense mancano.*
- **D4 — Legacy Pass**: ✅ **deciso** — il Legacy è una lista `pass` separata (ricompense dei vecchi Raider Deck), non una traccia del pass di stagione. Anche il Legacy è un pass selezionabile come attivo (D11).
- **D5 — Fine stagione**: ✅ **deciso** — nessuna scadenza. `expirationDate` resta non valorizzato. Se arriverà una scadenza, il campo esiste già su `List`.
- **D6 — Verifica dei dati**: ✅ **risolta per il Frozen Trail (D15); il Legacy resta a mano.** Testo originale:  Le ricompense dei 60 tier si compilano dall'editor Dev (a mano, oppure con uno script una tantum dalla tabella Polygon, vincolato a D3). Le fonti secondarie sono in disaccordo solo sui Token.
- **D7 — Tracce generiche**: ✅ **deciso** — non sono un'enumerazione fissa. Ogni pass dichiara le proprie (`tracks: PassTrackDef[]`: `free`, `premium` o altre che Embark introdurrà) e ogni ricompensa porta l'id della sua traccia. Aggiungere una traccia è un dato, non una modifica al codice.
- **D8 — Visualizzazione del pass attivo**: ✅ **deciso e implementato** — come nel gioco (screenshot di riferimento), non una griglia di testo: un livello per riga con le tracce affiancate e le ricompense come icone:
  - all'apertura scorre al livello corrente, evidenziato;
  - i livelli passati (e le loro ricompense) sono disabilitati;
  - il livello più alto è in cima, come nel gioco; le tracce `locked` mostrano il lucchetto; sfondo scuro adattato al mobile (D12);
  - su telefono le colonne diventano schede a scorrimento orizzontale o un selettore di traccia;
  - la configurazione sta nell'header: quali tracce nascondere (per dispositivo); «la mia traccia» coincide con il nascondere le altre;
  - si traccia solo il livello raggiunto (niente Feats).
- **D9 — Traccia sempre esplicita e cestino**: ✅ **deciso** (fatto) — ogni ricompensa di un pass porta il proprio `track` (la validazione assegna la prima traccia a quelle che ne sono prive, così riordinare le tracce non cambia il significato). Rimuovere una traccia la sposta, con le sue ricompense, nel cestino Dev (`dev-trash/trash.json`): file versionato, fuori da `src/` e `public/`, letto e scritto solo dal dev server, quindi non distribuito. Il cestino accoglie anche le liste eliminate da Gestione Liste. Un pass non ha requisiti di oggetti né azioni: è un tracker di tier e ricompense.
- **D10 — Ambito dei dati economici**: ✅ **deciso** — il tracker non gestisce il costo del pass (prezzo in Raider Token e rimborso fuori scope); `premiumCostTokens` resta nel modello come campo **opzionale e informativo**. Le soglie punti non sono modellate: il tracker registra solo il tier; se servisse il calcolo basterebbe `pointsRequired` opzionale per livello (Frozen Trail 150 punti per tier, Legacy 100). I bug di lancio dello sblocco premium non sono problemi del modello.
- **D11 — Un solo pass attivo per profilo**: ✅ **deciso e implementato** — come nel gioco, un profilo ha al massimo un pass attivo (`activeRewardPass`) e non può cambiarlo finché non lo conclude. Vale anche per il Legacy.
  - **Selezione**: senza pass attivo la pagina mostra le card dei pass non completati, ciascuna verso una pagina di anteprima con il pulsante «Imposta come pass attivo» e una modale di conferma. I pass completati stanno in una sezione dedicata in fondo alla pagina e saranno visibili anche nella futura pagina dei trofei.
  - **Completamento**: pulsante «Concludi pass», che porta il tier raggiunto all'ultimo livello, aggiunge il pass a `completedRewardPasses` e libera la selezione. Serve perché l'app non si sincronizza col gioco: il giocatore può averlo finito da giorni e aggiornarla solo ogni tanto.
  - **Via d'uscita**: in Impostazioni, «Cambia pass attivo» per correggere un errore di selezione; il progresso su quel pass viene eliminato (doppia conferma).
  - **Stato**: `activeRewardPass` e `completedRewardPasses` sono per profilo (persistiti; l'import/export è nella #74); il tier raggiunto riusa `currentLevels[passId]`.
  - **Pass scomparso dal seed**: finché non c'è un archivio dei vecchi pass, alla visita si chiede se segnarlo completato (storico/trofei, con il solo id come nome) o non completato (progresso eliminato).
- **D12 — Cosa si copia dal gioco**: ✅ **deciso** — non si ricrea l'intera schermata (impensabile su mobile): si copia la visualizzazione di livelli e tracce (icone, lucchetto sulle tracce a pagamento, binario dei livelli) e lo sfondo, adattato al mobile. Restano fuori la scena 3D centrale, la scheda dettaglio laterale (sostituita dal dettaglio oggetto al tocco) e il riquadro «Migliora pass premium».

- **D13 — Outfit sbloccati a pezzi**: ✅ **deciso** (issue #109) — completo di base (`Outfits`/`Outfit`), toggle (`Cosmetic`/`Outfit Variant`) e colori (`Cosmetic`/`Outfit Color`) si sbloccano in livelli diversi e vanno distinguibili. Si fanno: icone di sottocategoria (provvisorie, da sostituire con quelle del gioco) nella barra della card accanto al `×N` e nella catena di fallback, e un badge ad angolo dal simbolo diverso per tipo. Ripiego: etichetta testuale nella barra. **Non si fa il raggruppamento per outfit** nello stesso livello: non è mai successo che più pezzi di uno stesso outfit si sbloccassero insieme; si rivaluta solo se i dati dei livelli lo richiederanno (servirebbe un campo che leghi i pezzi all'outfit di base).
- **D16 — Immagine dei pezzi di outfit**: ✅ **fatto** — i pezzi (toggle e colori) non hanno un'immagine loro: usano quella dell'outfit di base se è nel catalogo (campo `iconFromItem`, catena di fallback: icona propria → icona dell'oggetto indicato → sottocategoria → categoria → generica), e nella card l'icona di toggle o colore compare nel badge (barra della categoria e badge ad angolo). Campo modificabile nel Custom Items Studio («Usa l'icona di»).
- **D14 — Quantità nella barra**: ✅ **fatto** — come nel gioco, `×N` a destra nella stessa barra dell'icona di categoria (`barRightSlot` di `ItemCardFrameV2`), per ogni ricompensa con quantità maggiore di 1.

- **D15 — Import una tantum del Frozen Trail**: ✅ **fatto** — la tabella completa dei livelli (Polygon, `scripts/data/frozen-trail-pass.json`) è incrociata con il catalogo e con i cosmetici di ARC Tracker (pagina `/cosmetics`, **solo uso una tantum**: non è un meccanismo standard e potrà essere sostituito da fonti meglio strutturate). Lo script `scripts/oneshot/import-frozen-trail.mjs` risolve ogni ricompensa: 51 su 110 sono già nel catalogo, 59 creano **45 oggetti custom** (pezzi di outfit, ciondoli, accessori e zaini, emote, stili del viso, acconciature, strumenti, outfit di Scrappy, arredi) con una nota «da rivedere» (rarità provvisoria, descrizione e icona mancanti, nome italiano mancante per i pezzi sintetici). Nomi e id seguono le convenzioni di MetaForge («Goggles (Radio Renegade Variant)»). I nomi italiani vengono dalla pagina di ARC Tracker. Le pagine Dev segnalano ciò che va corretto: pannello «Da correggere» in Gestione Liste (oggetti mancanti, oggetti da rivedere, tracce e livelli vuoti, mappe sconosciute) e nota per oggetto nel Custom Items Studio. Il rapporto completo (riconciliazione dei 478 cosmetici con il catalogo, indizi sul Legacy) è in `scripts/reports/` (non versionato).
- **Legacy Pass**: 62 livelli estratti a mano dall'interfaccia italiana (`scripts/data/legacy-pass-source.md`, copia fedele) e convertiti con `scripts/oneshot/import-legacy-pass.mjs` nello staging non distribuito `scripts/data/legacy-pass.json`: nomi e categorie italiani tradotti nei nomi inglesi di ARC Tracker (che ha entrambe le lingue), 21 ricompense già nel catalogo, 42 da creare (30 oggetti custom necessari, con i pezzi esatti di toggle e colori secondo il sito), e confronto riga per riga con ciò che il sito indica per il Legacy (45 livelli di cosmetici: coincidono tutti; i 17 senza cosmetici sono i token). Una sola riga da controllare: il livello 44 è scritto «pilota» ma il sito indica «Portiere». I 30 oggetti custom necessari al Legacy sono già nel catalogo (`--apply-custom-items`); il pass resta fuori da `src/data/passes.json` finché non lo si decide. Gli outfit di Scrappy hanno una categoria propria su ARC Tracker (`scrappy-outfit`, oltre a `scrappy-body`).

## 8. Rischi

- **R1 — Visibilità nelle viste di lista.** Oggi il pass non è caricato nell'app utente, quindi non può generare attività fittizie. Quando lo sarà (#90) va escluso dal fabbisogno, dalle liste attive e da `targetLevels` di default (`levelsAbove(0, maxLevel)`), e i quattro metodi di `listsSlice` vanno verificati con un pass presente.
- **R2 — Import di profili esistenti.** `importLists` deve accettare `listType: 'pass'` e i nuovi campi del profilo (`activeRewardPass`, `completedRewardPasses`) senza rompere i file già esportati.
- **R3 — Dati incompleti.** Il Legacy Pass non ha una fonte con le ricompense per livello: va inserito dall'editor Dev. Per il Frozen Trail esiste la tabella Polygon (D6).
- **R4 — Fonti in disaccordo.** Risolto per le soglie (150 per tier) e per il costo (non gestito, D10). Resta la differenza sul totale Token (1.300 da tabella contro 1.350 di UrGameTips), che non incide sul tracker.
- **R5 — Stato incoerente del pass attivo.** Gestito: un `activeRewardPass` che punta a un pass non più nel seed viene risolto dall'utente (completato nello storico o non completato), senza decisioni automatiche e senza perdere il progresso finché non sceglie.

## 9. Piano di test

- Fatto (#85): `validateList` per i pass (tracce duplicate o assenti, `track` sconosciuto o mancante, costo opzionale), `withListType` verso `pass`, cestino Dev (`dev-trash.test.ts`).
- Fatto (#90): slice (un solo pass attivo, tier limitato a 0..maxLevel, conclusione, via d'uscita, orfano completato/non completato, persistenza per profilo), totali delle ricompense, validazione della storia dei pass completati e del flag `locked`.
- Da fare: import/export con `activeRewardPass` e `completedRewardPasses` (#74); `passPremiumUnlocked` se confermato (D2).
- Regressione: `getTotalRequiredMaterialsPure` e `getMissingMaterialsPure` invariati con e senza pass presenti.
- Manuale: card di selezione, pagina di anteprima, conferma, vista a griglia con scroll al livello corrente, «Concludi pass», via d'uscita in Impostazioni, mobile a 375px.

## 10. Milestone (coerenti con VERSIONING)

- **0.5.0 — #85** (fatta): `listType: 'pass'`, tracce generiche, seed vuoto, editor Dev, cestino.
- **0.5.0 — #90 (anticipata, dietro flag)**: pagina del pass con selezione, anteprima, pass attivo e completati (D11), vista a livelli (D8, D12), stato per profilo, gestione del pass orfano. Il flag `reward-pass` resta spento finché non ci sono dati.
- **0.6.0**: dati reali del Frozen Trail e del Legacy (D3, D6), import/export (#74), eventuale pagina dei trofei.
- **Fuori scope ora**: Feats, soglie punti per tier, calcolo settimanale, costo del pass. Da riaprire solo con una nuova decisione.

## 11. Cosa resta da decidere

1. D3 — come rappresentare le ricompense senza oggetto nel catalogo.
2. D6 — come compilare i 60 tier del Frozen Trail (a mano o con uno script dalla tabella) e il Legacy.
3. D2 — il dettaglio dello stato «premium sbloccato» rispetto alle preferenze di visualizzazione (D8).

_Ultimo aggiornamento: 2026-10-09. Decisioni prese: D1, D4, D5, D7, D8, D9, D10, D11, D12, D13, D14, D15, D16._
