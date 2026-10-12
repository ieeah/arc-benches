# Tech Spec — Armi Amplificate (Weapon Amplification)

Specifica di come mostrare in ARC Benches il sistema di amplificazione delle armi introdotto con Frozen Trail (8 ottobre 2026): prerequisiti, albero di nodi per arma, requisiti di ricerca per nodo e come presentarli nelle pagine di dettaglio delle armi.

Stato: **bozza in attesa di approvazione**. Nessun file sorgente è stato modificato.

Dati non certi, conflitti e informazioni secondarie (materiali, localizzazioni, costi di sblocco): [amplificazione-armi-info-secondarie.md](amplificazione-armi-info-secondarie.md). Dettaglio per arma, statistiche e regole di combinazione: [amplificazioni-armi.md](amplificazioni-armi.md).

---

## 1. Fonti e precedenza

| Fonte | Tipo | Uso |
| :--- | :--- | :--- |
| Schede per arma e regole generali tratte da video che mostra il gioco, fornite dall'utente | Primaria | Dati di gioco. Prevalgono sulle guide secondarie |
| Riassunto strutturato del video `PSRrGIswnZg`, con timestamp, fornito dall'utente (seconda versione) | Primaria | Prevale in caso di conflitto |
| Sintesi precedente del video, fornita dall'utente | Superata | Sostituita dalla seconda versione |
| [Timesaver — Weapon Amplification Guide](https://timesaver.gg/blog/arc-raiders-weapon-amplification-guide) | Secondaria | Nodi per arma, permanenza, riparazioni. Termini generici sui materiali |
| [The Sixth Axis — Frozen Trail](https://www.thesixthaxis.com/2026/09/23/everything-we-know-about-arc-raiders-frozen-trail-pendola-pass-the-arc-frigate-weapon-amplification-more/) | Secondaria, pre-lancio | Riscontro su esempi di moduli |
| Sette guide di confronto (aoeah, destructoid, playerauctions, arcraidershub, keengamer, mypandaplay, yahoo) | Secondaria | Conferma dei dati certi. Dettaglio in [amplificazioni-armi.md](amplificazioni-armi.md) |
| [Epic Carry — Amplified Weapons](https://epiccarry.com/arc-raiders/boost/amplified-weapons/) | Non usata | Pagina di vendita di boost |

Limiti:

- Il video del riassunto non è stato letto direttamente. Il riassunto non è una trascrizione verbatim.
- I valori (costi, materiali, obiettivi) vanno **verificati al momento dell'implementazione**. Questa specifica fissa la struttura e la visualizzazione, non i valori.

## 2. Meccanica

### 2.1 Outpost e Postazione di Ricerca

- **Sblocco iniziale**: costruzione della stanza base, missione al Varco Blu, consegna dei materiali all'avamposto. *Riassunto (00:45–00:57).*
- **Espansione**: per potenziare la Postazione di Ricerca fino al **livello 4** serve l'avamposto al **livello 3**. *Riassunto (08:13).* ⚠️ Altre fonti indicano l'avamposto al livello 4: vedi [info secondarie §1](amplificazione-armi-info-secondarie.md#1-avamposto-outpost).
- **Funzioni della Postazione**: recuperare progetti (anche dopo un wipe), fabbricare arredi con punti ricerca, sbloccare la **Ricerca Amplificata**, disponibile solo con la Postazione al **livello 4**. *Riassunto (01:28, 02:36, 02:56).*

### 2.2 Punti ricerca

- Si ottengono convertendo tomi di studio: tascabile rovinato, diario del rider, manuale tecnico, modulo dati ARC. *Riassunto (02:01).*
- Il **modulo dati ARC** si ottiene da contenuti end-game (Fregata e Imperatore a Pendola Pass). L'utente indica che è anche recuperabile in raid.
- La quantità di punti **dipende dalla rarità** dell'oggetto convertito. *Riassunto (02:29).* Valori: [info secondarie §3](amplificazione-armi-info-secondarie.md#3-fonti-di-oggetti-rari).

### 2.3 Prerequisiti comuni

Per amplificare un'arma servono:

- l'arma al **livello 4** (Tier IV) *(03:45)*. Dopo l'amplificazione l'arma è di **livello 5**;
- il **Banco Armi** (Gunsmith) al **livello 4**, con **3 Radial Press, 3 Magnetic Accelerator, 1 Emperor Modulator** *(04:27; confermato da A, Y, W)*;
- un **Modulo di Amplificazione** della **stessa rarità** dell'arma, da Mk I (comune) a Mk V (leggendario). Fonti: Fregata ARC e Imperatore caduto, Pendola Pass *(confermato da A, K, Y, W)*. Rarità per arma: [amplificazioni-armi.md §2](amplificazioni-armi.md#2-moduli-di-amplificazione).

Questi prerequisiti valgono per l'intero albero. Ogni nodo aggiunge i propri requisiti (§2.4).

### 2.4 Albero di nodi

Ogni arma ha un albero di nodi. Alla versione attuale le armi potenziabili fino al livello 5 sono **15** *(03:39; lista confermata, vedi §2.6)*. Altre armi arriveranno con gli aggiornamenti (R3).

Ogni nodo ha:

- **requisito di ricerca**: sì o no. Se sì, il nodo richiede:
  - Postazione di Ricerca al **livello 4**;
  - il **progetto di ricerca** sbloccato *(05:05)*. Lo sblocco è **permanente** e si fa **una sola volta** *(06:34)*. Ha tre fasi: obiettivi in gioco, pagamento (punti ricerca + componenti rari), applicazione;
- **costo di montaggio**: materiali di assemblaggio, pagati in ogni caso;
- **prerequisiti**: altri nodi che devono essere già montati. Se un prerequisito non è montato, il nodo non è attivabile;
- **esclusività**: nodi che non possono coesistere con questo.

Regola degli id (hyphen-case, come da AGENTS.md):

- i rami iniziano con `branch-`, es. `branch-1`, `branch-2`;
- i nodi iniziano con `node-`, es. `node-burst-fire`, `node-sprint-shooting`.

Il prefisso dice subito se un id è un ramo o un nodo, senza consultare il seed.

Regole di catena:

- Un nodo è attivabile solo se tutti i suoi prerequisiti sono montati e nessun nodo escluso è montato.
- Se un nodo è escluso, i nodi che ne dipendono restano bloccati (es. Full Auto esclude Burst Fire, quindi Increased Burst è bloccato).
- Il seed non memorizza lo stato di montaggio (§5). Queste regole servono a validare il seed e a mostrare il testo "Richiede" / "Esclude" in pagina.

Nel gioco il quadrato sopra un nodo è la ricerca collegata a quel nodo. Il nodo senza quadrato non richiede ricerca.

Esempio, ramo A a due nodi (verificato in gioco): N1 senza ricerca, N2 con ricerca. N2 richiede N1.

```
Ramo A:  N1 ──► N2 [ricerca]
Ramo B:  N3 [ricerca]
```

Esempio, Burletta (verificato in gioco):

```
Burletta
├─ Ramo 1  (scelta esclusiva: 1a blocca 1b e viceversa)
│   ├─ 1a: Burst Fire → Increased Burst   [ricerca su entrambi]
│   └─ 1b: Full Auto                      [nessuna ricerca]
└─ Ramo 2: Sprint Shooting                [ricerca, sempre disponibile]
```

Dettaglio di tutti i nodi: [amplificazioni-armi.md §3](amplificazioni-armi.md#3-schede-per-arma).

### 2.5 Esempi del riassunto

| Fase | Anvil (Proiettili X) | Renegade (Mirino) |
| :--- | :--- | :--- |
| 1. Obiettivi in gioco | 1.000 danni con granate a impatto leggero a lucciole, calabroni, sfere infuocate e supervisori *(05:40)* | Raggiungere il Pellegrino in una sessione al Varco Blu e infliggere 1.000 danni ad ARC con il Falco Pescatore *(07:20)* |
| 2. Pagamento | 5.000 punti ricerca + 5 driver lanciarazzi *(06:06)* | 5.000 punti ricerca + 14 scanner spia *(07:32)* |
| 3. Applicazione | 3 fulmini fossilizzati *(06:40)* | 2 montaggi valvola del propellente, o materiali dedicati *(07:07)* |

Le tre fasi hanno la stessa struttura per ogni nodo con ricerca: cambiano obiettivi, costi e materiali.

### 2.6 Amplificazioni per arma

Nomi confermati da almeno due fonti. Effetti, statistiche e regole di combinazione: [amplificazioni-armi.md §3](amplificazioni-armi.md#3-schede-per-arma).

| Arma | Amplificazioni |
| :--- | :--- |
| Anvil | Anvil Splitter · X-Rounds |
| Aphelion | Bigger Mag · Charged Burst · Increased Burst · Incendiary Rounds |
| Bettina | Bigger Mag · Semi-Auto · X-Rounds |
| Burletta | Burst Fire · Increased Burst · Full-Auto · Sprint Shooting |
| Canto | Carbine Conversion · Incendiary Rounds · Sprint Shooting |
| Equalizer | Bigger Mag · Anti-Weak Point · Ramping Damage |
| Hairpin | Incendiary Rounds · Semi-Auto · Sprint Shooting · Tracker Rounds |
| Hullcracker | Incendiary Grenades · Mag Reload |
| Il Toro | More Reload · Slug Rounds |
| Jupiter | Bigger Mag · Scoped · Ergonomic Bolt |
| Kettle | Anti-Shield · Full-Auto · X-Rounds |
| Osprey | Anti-Weak Point · Ergonomic Bolt · Tracker Rounds |
| Rascal | High Velocity · Incendiary Grenades · Sprint Shooting |
| Rattler | More Reload · Drum Mag · Incendiary Rounds |
| Renegade | More Reload · Scoped |

Stiletto e Bantam non sono amplificabili al lancio. Ferro, Tempest e Wolfpack non sono amplificabili (F; Tempest anche A). Le 15 sono le armi amplificabili alla versione attuale, non tutte le armi del gioco.

### 2.7 Permanenza e riparazioni

- Lo sblocco della ricerca è permanente (riassunto, F). La conversione dell'arma non è reversibile (Timesaver, confermato da altre fonti).
- La riparazione richiede i moduli già ricercati e consuma **Frammenti Amplificati** (Timesaver, confermato da altre fonti). Riciclo di un modulo Mk 1–5: 7 frammenti (F). Costo di riparazione non proporzionale alla durabilità residua (F).
- Durabilità base dell'arma amplificata: 200 (F, W, M).
- Alla morte: arma, modulo e pezzi installati persi (F, K). Augment "Safekeeper" permette di mettere l'arma in tasca sicura a metà raid (F). Valori: [info secondarie §4](amplificazione-armi-info-secondarie.md#4-riparazione-e-durabilità).

## 3. Conflitti tra fonti e risoluzione

| Punto | Riassunto del video | Altre fonti | Risoluzione |
| :--- | :--- | :--- | :--- |
| Requisito di ricerca | Ramo con ricerca e ramo senza ricerca | Alcuni nodi non richiedono ricerca (F); altre fonti dicono che ogni perk la richiede (A, K) | **Risolto**: requisito per nodo, confermato dal gioco (vedi §2.4) |
| Postazione di Ricerca L4 | Richiesta solo dal ramo con ricerca | — | **Risolto**: richiesta solo dai nodi con ricerca (confermato dall'utente) |
| Materiale di applicazione | Fulmini fossilizzati (Anvil), valvola del propellente (Renegade) | Pneumatic Actuator + Pressure Regulator (A, K, Y, W) | **Risolto**: si usano i materiali del video. Altri materiali da verificare ([info §5](amplificazione-armi-info-secondarie.md#5-conflitti-aperti)) |
| Origine dei punti ricerca | Tomi di studio; modulo dati ARC da end-game | Sixth Axis: "materiali e componenti ARC" | Riassunto, con il modulo dati recuperabile anche in raid (utente) |
| Avamposto per Postazione L4 | Livello 3 | Livello 4 (A, Y) | **Aperto**: vedi [info §1](amplificazione-armi-info-secondarie.md#1-avamposto-outpost) |
| Armi compatibili | 15 potenziabili fino al livello 5 | 15 confermate (lista in §2.6). Timesaver ne elenca 12 | **Risolto**: 15 e lista confermati |
| Nome bolt Jupiter/Osprey | Straight Bolt (Timesaver) | Ergonomic Bolt (P, W, K) | **Risolto**: Ergonomic Bolt |
| Burletta full-auto | non indicato | Timesaver: sì; altre fonti: sì | **Risolto**: confermato |
| Rattler | non indicato | Drum Mag +40 caricatore (A, W) | **Risolto**: confermato |

## 4. Dati necessari

I valori non vanno fissati in questa fase. Vanno verificati in gioco al momento dell'implementazione. La specifica richiede solo la struttura.

Per ogni arma amplificabile:

- requisiti dei livelli 1–4 (materiali per livello);
- prerequisiti comuni: livello 4 dell'arma, Banco Armi al livello 4, Modulo di Amplificazione della rarità dell'arma;
- per ogni nodo: id, nome, requisito di ricerca, prerequisiti, esclusività, materiali di assemblaggio;
- per ogni nodo con ricerca: livello della Postazione (4), punti ricerca, obiettivi in gioco, componenti rari di pagamento.

## 5. Natura del dato

Non è uno strumento di tracciamento. Non servono liste interattive, stato per profilo, né fabbisogno calcolato sull'inventario. Le informazioni sono **riferimento statico** da mostrare nelle pagine di dettaglio delle armi.

Conseguenza: il motore delle liste (`List`, `getTotalRequiredMaterialsPure`, `prerequisites`) non viene usato.

## 6. Proposta

### 6.1 Dati

Un seed statico con un record per arma. Ogni arma ha un albero di nodi.

```ts
// src/types.ts — firme proposte, nessuna implementazione

export interface WeaponLevelRequirement {
  level: 1 | 2 | 3 | 4;
  requirements: ItemRequirement[];          // tipo già esistente
}

export interface AmplificationResearch {
  researchStationLevel: 4;                  // fisso
  researchPoints: number;                   // item 'research-points' del catalogo custom
  challenges: string[];                     // testo, non stato
  unlockMaterials: ItemRequirement[];       // componenti rari di pagamento
}

export interface AmplificationNode {
  id: `node-${string}`;                     // hyphen-case, es. 'node-burst-fire'
  name: string;
  requiresResearch: boolean;
  research?: AmplificationResearch;         // presente solo se requiresResearch
  requires: `node-${string}`[];             // id dei nodi prerequisito
  excludes: `node-${string}`[];             // id dei nodi incompatibili (simmetrico)
  assemblyMaterials: ItemRequirement[];     // materiali di assemblaggio, sempre
}

export interface AmplificationBranch {
  id: `branch-${string}`;                   // es. 'branch-1'
  nodeIds: `node-${string}`[];              // nodi del ramo, solo per raggruppamento in pagina
}

export interface WeaponDetail {
  itemId: string;                           // id dell'arma nel catalogo
  levels: WeaponLevelRequirement[];         // livelli 1–4
  commonPrerequisites: {
    weaponLevel: 4;
    workbench: { id: 'gunsmith'; level: 4 };
    amplificationModule: { mk: 1 | 2 | 3 | 4 | 5 };   // rarità = rarità dell'arma
  };
  amplificationBranches: AmplificationBranch[];  // raggruppamento per la pagina
  amplificationNodes: AmplificationNode[];  // albero dei nodi (§2.4)
}
```

Il seed vive in `src/data/weapon-amplification.json`, letto come gli altri seed statici. I valori (materiali, costi, sfide) sono da verificare in gioco prima di inserirli.

### 6.2 Visualizzazione

Nella pagina di dettaglio dell'arma (`ItemDetailSheet.tsx`, da verificare), tre sezioni in ordine:

1. **Requisiti per livello** (livelli 1–4): elenco dei materiali per ogni livello.
2. **Prerequisiti dell'amplificazione**: un blocco con livello 4 dell'arma, Banco Armi al livello 4 e Modulo di Amplificazione. Sempre visibile.
3. **Albero di amplificazione**: ogni nodo è una card con:
   - nome e badge **"Ricerca"** se `requiresResearch`;
   - costo di montaggio;
   - se con ricerca: blocco collegato (come il quadrato in gioco) con Postazione Lvl 4, punti ricerca, obiettivi numerati, componenti rari;
   - "Richiede: …" e "Esclude: …" con i nomi dei nodi collegati.
   - Su desktop l'albero si legge per colonne. Su telefono è una lista indentata, un nodo per riga.

Regole:

- Nessuno stato per profilo: niente spunte né evidenziazioni del progresso.
- Ogni dato mostra la fonte nel footer o nelle note, come per gli altri dati statici.
- Le etichette usano "Lvl" (AGENTS.md).
- `excludes` è simmetrico: il seed va validato in modo che se A esclude B, anche B esclude A.

### 6.2.1 Rendering dell'albero (regola comune)

Tutti gli alberi di amplificazione sono costruiti da una sola funzione, con un solo set di regole grafiche. Nessuna arma ha una propria grammatica.

- **Funzione unica**: `renderAmplificationTree(weapon: WeaponDetail)`. Riceve solo i dati del seed (§6.1), non contiene dati specifici di un'arma.
- **Componenti condivisi**: nodo, quadrato di ricerca collegato, badge "Ricerca", connettori (prerequisito ed esclusività), blocco obiettivi e costi. Sono definiti una volta sola e riutilizzati da tutte le armi.
- **Regole grafiche fisse**:
  - un nodo con ricerca mostra il quadrato di ricerca collegato sopra di sé (come in gioco);
  - un nodo senza ricerca non mostra il quadrato;
  - un prerequisito è un connettore dal nodo precedente, un'esclusività è un'etichetta "Esclude: …" tra due nodi;
  - i rami sono solo un raggruppamento visivo (§2.4), non cambiano la disposizione dei nodi.
- **Nessun layout per arma**: se un albero non si adatta alle regole, si cambia la funzione (e vale per tutte le armi), non il singolo albero.
- **Test**: un test di snapshot per almeno tre armi di forme diverse (Burletta, Anvil, Hairpin) per verificare che la grammatica resti uguale.

### 6.3 Alternative scartate

- **Lista per arma**: scartata. Non è interattiva e non ha stato per profilo.
- **Due rami per arma (con ricerca / senza ricerca)**: scartata. Il requisito di ricerca è per nodo, e i nodi dello stesso albero stanno in rami diversi a seconda delle relazioni (es. Burletta: Full Auto e Burst sono esclusivi, Sprint è sempre disponibile). Un solo albero di nodi le rappresenta tutte.
- **Livello 5 unico**: scartato. I nodi sono alternative o aggiunte, non una sequenza.

## 7. File coinvolti (previsione)

| File | Ruolo |
| :--- | :--- |
| `src/data/weapon-amplification.json` | seed statico per arma |
| `src/types.ts` | tipi `WeaponDetail`, `WeaponLevelRequirement`, `AmplificationNode`, `AmplificationResearch` |
| `src/lib/weaponAmplification.ts` | lettura del seed |
| `src/lib/validate.ts` | validazione del seed (prefisso `branch-`/`node-` sugli id, prerequisiti esistenti, nessun ciclo in `requires`, `excludes` simmetrico, un nodo non richiede un nodo che lo esclude, `research` solo se `requiresResearch`) |
| `src/components/ItemDetailSheet.tsx` (da verificare) | sezioni di visualizzazione |
| `scripts/data/custom-items/` | valuta "Punti Ricerca" |
| `src/i18n/locales/it.ts`, `en.ts` | etichette delle sezioni |

## 8. Decisioni

- **D1 — Punti Ricerca** (✅): valuta custom in `scripts/data/custom-items/`, come Reward Points (`item_type: "Currency"`), non selezionabile come requisito di consegna.
- **D2 — Materiali di assemblaggio** (✅): dal video (fulmini fossilizzati, valvola del propellente). Timesaver è generico. Altri materiali: [info §5](amplificazione-armi-info-secondarie.md#5-conflitti-aperti).
- **D3 — Burletta** (✅): ha la modalità full-auto.
- **D4 — Struttura** (✅): nessuna lista. Dati statici nelle pagine di dettaglio, con prerequisiti comuni e un albero di nodi per arma.
- **D5 — Postazione di Ricerca L4** (✅): richiesta solo dai nodi con ricerca.
- **D6 — Verifica dei dati** (✅): i valori si verificano in gioco all'implementazione. Questa specifica fissa struttura e visualizzazione.
- **D7 — Modulo di Amplificazione** (✅): obbligatorio, rarità = rarità dell'arma (A, K, Y, W).
- **D8 — Nomi perk** (✅): Ergonomic Bolt (non Straight Bolt).
- **D9 — Requisito di ricerca per nodo** (✅): ogni nodo ha il proprio `requiresResearch`, prerequisiti ed esclusività. Modello in §2.4 e §6.1, visualizzazione in §6.2.
- **Fuori scope — Statistiche**: cadenza, danno, rinculo, dispersione, durata degli effetti. Valori in [amplificazioni-armi.md §3](amplificazioni-armi.md#3-schede-per-arma).
- **Fuori scope — Attachment**: rinculo, mirino e simili. Vale per le statistiche, non per i nomi dei perk (§2.6).
- **Fuori scope — Morte**: la perdita dell'arma e la durabilità non entrano nel modello. Valori in [info §4](amplificazione-armi-info-secondarie.md#4-riparazione-e-durabilità).
- **Venator** (✅): non amplificabile (conferma utente). Esclusa dalla spec.
- **Riquadri sopra i nodi** (✅): ricerca collegata al nodo (§2.4).
- **D10 — Pagina dev per il seed** (✅): una pagina di sviluppo per definire armi, nodi, statistiche, rami e requisiti, con cosa blocca e cosa è bloccato. Si realizza insieme al sistema di amplificazione, non prima. Permette di aggiungere armi con gli aggiornamenti senza modifiche al codice.
- **D11 — Rendering comune degli alberi** (✅): tutti gli alberi usano `renderAmplificationTree` e gli stessi componenti condivisi. Nessuna grammatica specifica per arma (§6.2.1).

## 9. Rischi

- **R1 — Dati da verificare.** I valori vengono da riassunti e fonti secondarie. Vanno controllati in gioco all'implementazione.
- **R2 — Aggiornamenti.** Il seed va aggiornato a ogni patch. La lista delle armi amplificabili (15 oggi) cresce con gli aggiornamenti.
- **R3 — Nomi dei materiali.** Le fonti usano termini diversi. Il nome in gioco va confermato prima di mostrare il dato.

## 10. Piano di test

- Unit: validazione del seed (prerequisiti esistenti, nessun ciclo in `requires`, `excludes` simmetrico, nessun nodo che richiede un nodo che lo esclude, `research` presente solo se `requiresResearch`, `amplificationModule` presente).
- Unit: regola di catena su Burletta: Increased Burst bloccato se Full Auto è montato.
- Unit: `getWeaponDetail` su un'arma presente e una assente.
- Manuale: pagina di dettaglio di Burletta (tre nodi con ricerca, uno senza, esclusività 1a/1b) e di Renegade, confronto con il gioco.
- Regressione: nessun cambiamento nelle liste e nel fabbisogno.

## 11. Cosa serve dall'utente

Nulla di bloccante. Restano da verificare in gioco al momento dell'implementazione: i valori dei dati (costi, materiali, obiettivi). Decisione da prendere: D10 (pagina dev per il seed).
