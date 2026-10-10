# Specifica — Azioni di livello e finestra di validità (#111)

Stato: **decisioni prese e implementate (2026-10-10, #111)**. Riguarda banchi, progetti, liste personalizzate e spedizioni.

## 1. Regola di gioco
- Gli **oggetti** richiesti per un livello si raccolgono e si conservano in anticipo.
- Le **azioni** vanno fatte a momento debito: l'azione del livello N si fa **quando si è al livello N−1** (`corrente + 1 = N`); fatta prima o dopo, nel gioco non conta.
- Chiave in `checkedActions`: `listId|livello|azioneId`. L'azione del livello N è quella che sblocca N.

## 2. Finestra
`finestra = corrente + 1`. Un'azione (semplice o passo di un'azione a livelli) è **valida** solo se il suo livello è la finestra. Un unico predicato (`src/lib/lists.ts`) serve UI, store e caricamento.

## 3. Dove le azioni si vedono e si toccano

| Punto | Cosa mostra | Interazione |
|---|---|---|
| **Stash** (sezione «Azioni») | solo la finestra (livelli obiettivo selezionati) | slider di completamento |
| **Card in «Banchi e Liste»** | solo materiali e azioni del livello successivo | checkbox e timeline |
| **Pagina di dettaglio** (panoramica) | tutti i livelli | solo la finestra è interagibile; livelli ≤ corrente: completate e bloccate; livelli oltre la finestra: visibili, disabilitate e attenuate |
| **Editor lista personalizzata** | definizioni sempre visibili (per modificarle); stato di spunta come nel dettaglio | idem |
| **Spedizioni** | fasi 1–6 (panoramica) | solo la fase attiva (vedi §5) |
| **«Completa potenziamento»** | — | abilitato solo con le azioni del livello successivo completate |

## 4. Store e dati
- `toggleAction`, `setLevelActionsBatch` e `setTieredActionStep` **rifiutano** (senza effetto) ciò che sta fuori finestra.
- **Pulizia al caricamento e all'import**: le spunte salvate per livelli oltre la finestra si eliminano (non sono né accettate né conservate). Le spunte dei livelli già superati restano.
- **Cambio del livello corrente** (`setModuleCurrentLevel`):
  - salendo da P a Q: per ogni livello in (P, Q] i materiali si considerano consegnati (sottratti, con l'avviso di conflitto già esistente), **azioni e passi delle azioni a livelli completati**, e il livello Q+1 entra nei livelli obiettivo;
  - scendendo da P a Q: **azioni e passi delle azioni a livelli dei livelli in (Q, P] si azzerano**; i materiali non tornano nell'inventario.
- «Completa potenziamento» (`upgradeModule`) fa lo stesso per un solo livello.

## 5. Spedizioni: fase attiva esplicita
- La fase si **salva**: `currentLevels[idSpedizione]` = fasi completate (0–6); la **fase attiva è `corrente + 1`**. La derivazione da spunte e inventario non esiste più (il progetto non è in produzione: nessuna migrazione dei salvataggi precedenti).
- **Solo la fase attiva è interagibile** (voci «consegnato», azioni, passi); le completate sono bloccate, le future visibili e bloccate.
- Avanzamento **mai automatico**: pulsante «Completa fase» (abilitato quando ogni voce è spuntata o coperta dall'inventario e azioni e passi sono fatti) e −/+ per impostare la fase.
  - Alzando da P a Q, per ogni fase in (P, Q]: voci consegnate (materiali sottratti dall'inventario, con lo stesso avviso delle liste), azioni e passi completati.
  - Abbassando da P a Q: si azzerano voci, azioni e passi delle fasi in (Q, P]; l'inventario non si tocca.
- **Sfida danni e recupero PS** restano sezioni a parte, con chiavi globali (`expedition-damage|0|…`, `expedition-catchup|0|…`) e passi già sequenziali nella timeline. La partenza (`confirmDeparture`) riporta la fase a 0.
- Lo Stash legge `currentLevels` direttamente (cade la sostituzione con la fase derivata).

## 6. Test
- Predicato di finestra (`lists.test.ts`); `getStashActionsPure` solo sulla finestra (`selectors.test.ts`).
- Store: rifiuto fuori finestra, salita e discesa con azioni e passi a livelli (`store.test.ts`); pulizia al caricamento (`persistence.test.ts`).
- Spedizioni: fase salvata, salita e discesa, partenza.
- Manuale: card con solo il livello successivo, dettaglio con checkbox attenuate, Stash senza azioni fuori finestra, cambio livello da 1 a 3 (materiali sottratti, azioni spuntate), spedizione −/+.

## 7. Correlate
#111 (azioni dal livello precedente), #112 (reward pass), [spedizioni.md](spedizioni.md).
