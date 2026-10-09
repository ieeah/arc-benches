# Tech Spec — Armi Amplificate (Weapon Amplification)

Specifica di come mostrare in ARC Benches il sistema di amplificazione delle armi introdotto con Frozen Trail (8 ottobre 2026): prerequisiti, due rami di amplificazione per arma e come presentarne i requisiti nelle pagine di dettaglio delle armi.

Stato: **bozza in attesa di approvazione**. Nessun file sorgente è stato modificato.

---

## 1. Fonti e precedenza

| Fonte | Tipo | Uso |
| :--- | :--- | :--- |
| Riassunto strutturato del video `PSRrGIswnZg`, con timestamp, fornito dall'utente (seconda versione) | Primaria | Prevale in caso di conflitto |
| Sintesi precedente del video, fornita dall'utente | Superata | Sostituita dalla seconda versione |
| [Timesaver — Weapon Amplification Guide](https://timesaver.gg/blog/arc-raiders-weapon-amplification-guide) | Secondaria | Nodi per arma, permanenza, riparazioni. Termini generici sui materiali |
| [The Sixth Axis — Frozen Trail](https://www.thesixthaxis.com/2026/09/23/everything-we-know-about-arc-raiders-frozen-trail-pendola-pass-the-arc-frigate-weapon-amplification-more/) | Secondaria, pre-lancio | Riscontro su esempi di moduli |
| [Epic Carry — Amplified Weapons](https://epiccarry.com/arc-raiders/boost/amplified-weapons/) | Non usata | Pagina di vendita di boost |

Limiti:

- Il video non è stato letto direttamente. Il riassunto non è una trascrizione verbatim.
- I dati accurati (costi, materiali, nomi, obiettivi) vanno **verificati al momento dell'implementazione**. Questo documento fissa la struttura e la visualizzazione, non i valori.

## 2. Meccanica

### 2.1 Outpost e Postazione di Ricerca

- **Sblocco iniziale**: costruzione della stanza base, missione al Varco Blu, consegna dei materiali all'avamposto. *Riassunto (00:45–00:57).*
- **Materiali di scambio**: tavole e lamiere (sheet metal) si scambiano per semi presso Celeste. *Riassunto (01:02).*
- **Espansione**: per potenziare la Postazione di Ricerca fino al **livello 4** serve l'avamposto al **livello 3**. *Riassunto (08:13).*
- **Funzioni della Postazione**: recuperare progetti (anche dopo un wipe), fabbricare arredi con punti ricerca, sbloccare la **Ricerca Amplificata**, disponibile solo con la Postazione al **livello 4**. *Riassunto (01:28, 02:36, 02:56).*

### 2.2 Punti ricerca

- Si ottengono convertendo tomi di studio: tascabile rovinato, diario del rider, manuale tecnico, modulo dati ARC. *Riassunto (02:01).*
- Il **modulo dati ARC** si ottiene da contenuti end-game (Fregata e Imperatore a Pendola Pass). L'utente indica che è anche recuperabile in raid.
- La quantità di punti **dipende dalla rarità** dell'oggetto convertito. *Riassunto (02:29).*

### 2.3 Prerequisiti comuni

Per amplificare un'arma servono:

- l'arma al **livello 4** *(03:45)*;
- il **Banco Armi** (Gunsmith) al **livello 4**, che richiede componenti avanzati come pressa radiale e modulatore dell'imperatore *(04:27)*.

La Postazione di Ricerca al livello 4 serve **solo al ramo con ricerca** (vedi §2.4).

### 2.4 Due rami di amplificazione

Ogni arma ha due rami. Le armi potenziabili fino al livello 5 sono **15** *(03:39)*.

**Ramo senza ricerca**
- Richiede: Banco Armi al livello 4 e **materiali di fabbricazione** dell'arma *(04:14)*.
- Non richiede la Postazione di Ricerca.

**Ramo con ricerca amplificata**
- Richiede: Banco Armi al livello 4, **Postazione di Ricerca al livello 4** e il **progetto di ricerca sbloccato** *(05:05)*.
- Lo sblocco della ricerca è **permanente** e si fa **una sola volta** *(06:34)*. Ha tre fasi:
  1. **Obiettivi in gioco**: sfide di combattimento o esplorazione richieste dal progetto.
  2. **Pagamento del progetto**: punti ricerca e componenti rari.
  3. **Applicazione della mod**: si applica il perk all'arma di livello 4 pagando solo i **materiali di assemblaggio**.

### 2.5 Esempi del riassunto

| Fase | Anvil (Proiettili X) | Renegade (Mirino) |
| :--- | :--- | :--- |
| 1. Obiettivi in gioco | 1.000 danni con granate a impatto leggero a lucciole, calabroni, sfere infuocate e supervisori *(05:40)* | Raggiungere il Pellegrino in una sessione al Varco Blu e infliggere 1.000 danni ad ARC con il Falco Pescatore *(07:20)* |
| 2. Pagamento | 5.000 punti ricerca + 5 driver lanciarazzi *(06:06)* | 5.000 punti ricerca + 14 scanner spia *(07:32)* |
| 3. Applicazione | 3 fulmini fossilizzati *(06:40)* | 2 montaggi valvola del propellente, o materiali dedicati *(07:07)* |

Le tre fasi hanno la stessa struttura per ogni arma: cambiano obiettivi, costi e materiali.

### 2.6 Dettagli per arma (solo fonti secondarie)

Nodi indicati da Timesaver. Sono modifiche di attachment o di mod, quindi restano fuori dal perimetro di questa specifica. Da verificare in gioco.

- **Burletta**: Full-Auto, Burst-Fire, Increased Burst.
- **Renegade**: Scoped, More Reload.
- **Jupiter**: Scoped, Straight Bolt.
- **Osprey**: Straight Bolt.
- **Canto**: Carbine Conversion, Incendiary Rounds, Sprint Shooting.
- **Hairpin**: Semi-Auto, Incendiary Rounds, Sprint Shooting.
- **Bettina**: Semi-Auto, X Rounds, Bigger Mag.
- **Kettle**: X Rounds.
- **Anvil**: X Rounds, Anvil Splitter.
- **Rascal**: Incendiary Grenade.
- **Hullcracker**: Incendiary Grenade, Mag Reload.
- **Rattler**: Drum Mag (+40 caricatore), Incendiary Rounds, More Reload.

### 2.7 Permanenza e riparazioni

- Lo sblocco della ricerca è permanente (riassunto). La conversione dell'arma non è reversibile (Timesaver).
- La riparazione richiede i moduli già ricercati e consuma **Amplified Fragments** (Timesaver).

## 3. Conflitti tra fonti e risoluzione

| Punto | Riassunto del video | Altre fonti | Risoluzione |
| :--- | :--- | :--- | :--- |
| Postazione di Ricerca L4 nel ramo senza ricerca | Richiesta solo dal ramo con ricerca | — | **Risolto**: solo ramo con ricerca (confermato dall'utente, "quella del video") |
| Materiale di applicazione | Fulmini fossilizzati (Anvil), valvola del propellente (Renegade) | Timesaver: "Amplification Module", termine generico | **Risolto**: si usano i materiali del video. Timesaver è generico |
| Origine dei punti ricerca | Tomi di studio; modulo dati ARC da end-game | Sixth Axis: "materiali e componenti ARC" | Riassunto, con il modulo dati recuperabile anche in raid (utente) |
| Armi compatibili | 15 potenziabili fino al livello 5 | Timesaver: 15 al lancio, ne elenca 12, Venator assente | Numero confermato (15). Lista e Venator da verificare |
| Burletta full-auto | non indicato | Timesaver: sì | Confermato dall'utente |
| Rattler | non indicato | Timesaver: Drum Mag +40 caricatore | Da verificare |

## 4. Dati necessari

I valori non vanno fissati in questa fase. Vanno verificati in gioco al momento dell'implementazione. La specifica richiede solo la struttura:

Per ogni arma amplificabile:

- requisiti dei livelli 1–4 (materiali per livello);
- prerequisiti comuni: livello 4 dell'arma, Banco Armi al livello 4;
- **ramo senza ricerca**: materiali di fabbricazione;
- **ramo con ricerca**: prerequisito Postazione di Ricerca al livello 4, obiettivi in gioco, costo in punti ricerca, componenti rari di pagamento, materiali di assemblaggio.

## 5. Natura del dato

Non è uno strumento di tracciamento. Non servono liste interattive, stato per profilo, né fabbisogno calcolato sull'inventario. Le informazioni sono **riferimento statico** da mostrare nelle pagine di dettaglio delle armi.

Conseguenza: il motore delle liste (`List`, `getTotalRequiredMaterialsPure`, `prerequisites`) non viene usato.

## 6. Proposta

### 6.1 Dati

Un seed statico con un record per arma:

```ts
// src/types.ts — firme proposte, nessuna implementazione

export interface WeaponLevelRequirement {
  level: 1 | 2 | 3 | 4;
  requirements: ItemRequirement[];          // tipo già esistente
}

export interface AmplificationBranch {
  id: 'standard' | 'amplified';             // standard = senza ricerca, amplified = con ricerca
  requiresResearch: boolean;
  researchStationLevel?: 4;                 // solo ramo amplified
  researchPoints?: number;                  // solo ramo amplified; item 'research-points' del catalogo custom
  challenges?: string[];                    // solo ramo amplified; testo, non stato
  unlockMaterials?: ItemRequirement[];      // solo ramo amplified (componenti rari)
  assemblyMaterials: ItemRequirement[];     // materiali di fabbricazione (standard) o di assemblaggio (amplified)
}

export interface WeaponDetail {
  itemId: string;                           // id dell'arma nel catalogo
  levels: WeaponLevelRequirement[];         // livelli 1–4
  commonPrerequisites: {
    weaponLevel: 4;
    workbench: { id: 'gunsmith'; level: 4 };
  };
  amplificationBranches: AmplificationBranch[];   // sempre due
}
```

Il seed vive in `src/data/weapon-amplification.json`, letto come gli altri seed statici. I valori (materiali, costi, sfide) sono da verificare in gioco prima di inserirli.

### 6.2 Visualizzazione

Nella pagina di dettaglio dell'arma (`ItemDetailSheet.tsx`, da verificare), tre sezioni in ordine:

1. **Requisiti per livello** (livelli 1–4): elenco dei materiali per ogni livello.
2. **Prerequisiti dell'amplificazione**: un blocco con livello 4 dell'arma e Banco Armi al livello 4. Sempre visibile.
3. **Rami di amplificazione**: due card affiancate (su telefono una sotto l'altra).
   - **Senza ricerca**: materiali di fabbricazione.
   - **Con ricerca**: badge "Richiede Postazione di Ricerca Lvl 4", poi obiettivi, costo in punti ricerca, componenti rari, materiali di assemblaggio. Le fasi sono numerate.

Regole:

- Nessuno stato per profilo: niente spunte né evidenziazioni del progresso.
- Ogni dato mostra la fonte nel footer o nelle note, come per gli altri dati statici.
- Le etichette usano "Lvl" (AGENTS.md).
- Il ramo con ricerca è riconoscibile a colpo d'occhio dal badge, così l'utente capisce subito quale dei due è più impegnativo.

### 6.3 Alternative scartate

- **Lista per arma**: scartata. Non è interattiva e non ha stato per profilo.
- **Due liste per arma**: scartata. Il prerequisito è comune, quindi una sola descrizione con due rami.
- **Livello 5 unico**: scartato. I rami sono alternative, non una sequenza.

## 7. File coinvolti (previsione)

| File | Ruolo |
| :--- | :--- |
| `src/data/weapon-amplification.json` | seed statico per arma |
| `src/types.ts` | tipi `WeaponDetail`, `WeaponLevelRequirement`, `AmplificationBranch` |
| `src/lib/weaponAmplification.ts` | lettura del seed |
| `src/lib/validate.ts` | validazione del seed (due rami, campi condizionali) |
| `src/components/ItemDetailSheet.tsx` (da verificare) | sezioni di visualizzazione |
| `scripts/data/custom-items/` | valuta "Punti Ricerca" |
| `src/i18n/locales/it.ts`, `en.ts` | etichette delle sezioni |

## 8. Decisioni

- **D1 — Punti Ricerca** (✅): valuta custom in `scripts/data/custom-items/`, come Reward Points (`item_type: "Currency"`), non selezionabile come requisito di consegna.
- **D2 — Materiali di assemblaggio** (✅): dal video (fulmini fossilizzati, valvola del propellente). Timesaver è generico.
- **D3 — Burletta** (✅): ha la modalità full-auto.
- **D4 — Struttura** (✅): nessuna lista. Dati statici nelle pagine di dettaglio, con prerequisito comune e due rami.
- **D5 — Postazione di Ricerca L4** (✅): richiesta solo dal ramo con ricerca.
- **D6 — Verifica dei dati** (✅): i valori si verificano in gioco all'implementazione. Questa specifica fissa struttura e visualizzazione.
- **Fuori scope — Attachment**: rinculo, mirino e simili.
- **Fuori scope — Morte**: la perdita dell'arma e la durabilità non entrano nel modello.
- **Fuori scope — Lista delle 15 armi**: il numero (15) è confermato, la lista no.
- **Aperto — Venator**: non ancora verificato in gioco.

## 9. Rischi

- **R1 — Dati da verificare.** I valori vengono da riassunti e fonti secondarie. Vanno controllati in gioco all'implementazione.
- **R2 — Venator.** Le fonti non concordano. Non va inserito finché non è confermato.
- **R3 — Aggiornamenti.** Il seed va aggiornato a ogni patch.
- **R4 — Nomi dei materiali.** Le fonti usano termini diversi. Il nome in gioco va confermato prima di mostrare il dato.

## 10. Piano di test

- Unit: validazione del seed (livelli 1–4 presenti, due rami, campo `researchStationLevel` solo nel ramo con ricerca).
- Unit: `getWeaponDetail` su un'arma presente e una assente.
- Manuale: pagina di dettaglio di Anvil e Renegade, confronto con il gioco.
- Regressione: nessun cambiamento nelle liste e nel fabbisogno.

## 11. Cosa serve dall'utente

Nulla di bloccante per la struttura. Restano da verificare in gioco al momento dell'implementazione: i valori dei dati (costi, materiali, obiettivi) e Venator.
