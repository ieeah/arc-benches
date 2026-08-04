# Specifica Funzionale e Tecnica — Spedizioni (Expedition Project)

Riferimento Stato Attuale: [1_CURRENT.md](../1_CURRENT.md)

---

## 🎯 Panoramica e Obiettivo

Il modulo **Spedizioni** gestisce il tracciamento del progresso del giocatore verso il reset volontario (Prestige) dell'account e l'accumulo di ricompense permanenti. 
A causa delle limitazioni intrinseche del tracker (mancanza di sincronizzazione in tempo reale con il gioco reale e potenziale disallineamento dello stash), la specifica adotta un approccio **esplicito e manuale**, riducendo al minimo i calcoli automatici e basandosi su checkbox compilate dall'utente.

Tutto lo stato delle Spedizioni è memorizzato **per-profilo** ed è isolato tra i diversi Raiders creati nel tracker.

---

## 📐 Regole di Flusso e Funzionamento

### 1. La Carovana (Fasi 1-6)
* Le carovane sono modellate all'interno del motore di tracciamento come liste predefinite con `listType: 'expedition'`.
* Ciascuna carovana predefinita ha un `expeditionIndex` numerico (1, 2, 3...).
* Nella pagina Spedizioni, viene visualizzata esclusivamente la carovana che corrisponde all'indice corrente del giocatore:
  $$\text{Indice Attivo} = \text{completedExpeditionsCount} + 1$$
* **Fasi 1-4 (Assemblaggio)**: Tracciano i materiali specifici richiesti per la carovana.
* **Fase 5 (Donazioni)**: Gestita tramite 4 checkbox di completamento per-categoria (Combat, Survival, Provisions, Materials).
* **Fase 6 (Registrazione)**: 1 checkbox per registrare la prenotazione della partenza in gioco.

### 2. Damage Gate
* La Damage Challenge è tracciata tramite 5 checkbox manuali, ciascuna corrispondente a uno scaglione di danno/ricompensa:
  * **Spedizioni 1-3**: Ogni checkbox rappresenta 1 Skill Point permanente extra guadagnato (+1, +2, +3, +4, +5 SP totali).
  * **Spedizioni $\ge$ 4**: Ogni checkbox rappresenta una Mystery Reward (+1 Blueprint temporaneo e +150 Raider Tokens permanenti per scaglione).

### 3. Catch-Up SP
* Il Catch-Up consente di acquistare i punti abilità extra mancanti per raggiungere il tetto massimo globale di 15 punti.
* **Visibilità**: Il pannello è visibile solo se `earnedPermanentSkillPoints < 15` e il giocatore ha completato almeno 1 spedizione (`completedExpeditionsCount >= 1`). Se il giocatore ha già 15 punti, la sezione è nascosta.
* **Vincolo**: Le checkbox di Catch-Up sono disabilitate e non cliccabili finché l'utente non seleziona il 5° ed ultimo scaglione della Damage Challenge (completamento totale).
* **Advisory**: Accanto alle checkbox viene indicata la stima del valore in Coin totale (Stash + Coins fisiche) che l'utente deve possedere al momento della partenza in gioco per riscattare i punti selezionati (300.000 monete per ciascun punto di Catch-Up spuntato).

---

## 🛠 Struttura Dati (Zustand State)

Lo stato aggiuntivo nel profilo è il seguente:
* `completedExpeditionsCount: number` (default `0`)
* `earnedPermanentSkillPoints: number` (default `0`, cap a 15)
* `consecutiveStreak: number` (default `0`)
* `departureWindowActive: boolean` (default `false`)

Le checkbox temporanee per la finestra corrente vengono salvate nel record globale esistente `checkedActions` del profilo usando chiavi dedicate:
* Chiavi Danno: `expedition-damage|0|tier_{1..5}`
* Chiavi Catch-up: `expedition-catchup|0|sp_{1..5}`

---

## 🚪 Flussi di Chiusura Finestra (Post-Spedizione)

Quando il ciclo si conclude, l'utente interagisce con il pannello Post-Spedizione per dichiarare l'esito:

### A. Conferma Partenza (Reset Prestigio)
* Richiede una conferma a due passaggi (modale con doppio clic sul pracel o pulsante di conferma).
* Calcola la stima dei punti extra ottenuti in base alle checkbox spuntate, ma **mostra un campo di input numerico** che consente all'utente di effettuare l'override del valore reale ricevuto.
* Calcola i nuovi totali del profilo applicando la costante `MAX_EXTRA_SKILL_POINTS = 15`:
  $$\text{newTotalSP} = \text{Math.min}(15, \text{earnedPermanentSkillPoints} + G)$$
  * *Ripartizione*: Se il guadagno $G > 5$, 5 punti sono attribuiti alla spedizione attiva e la quota rimanente ($G - 5$) viene conteggiata come Catch-Up.
* Esegue il reset del prestigio sul tracker:
  * Azzera lo stash (`inventory = {}`).
  * Azzera il livello dei banchi (`hideoutLevels` impostato sui livelli di default, es. Refiner a 0, Scrappy a 1).
  * Azzera le checkbox temporanee di danni, catch-up e della carovana completata in `checkedActions`.
  * Incrementa `completedExpeditionsCount` di 1.
  * Incrementa `consecutiveStreak` di 1.

### B. Finestra Chiusa (Non Partito)
* Usato se il ciclo si è concluso ma il giocatore non ha effettuato la partenza.
* Resetta la streak di spedizioni consecutive a 0 (perdita dei buff temporanei).
* Pulisce le checkbox temporanee di danni e catch-up in `checkedActions`.
* Mantiene intatti lo stash, i banchi e i progressi della carovana (Fasi 1-5 completate).
* Offre un toggle opzionale per consentire all'utente di svuotare l'inventario del tracker.

---

## 🎨 Interfaccia Utente (UI)

La pagina `src/pages/ExpeditionPage.tsx` presenterà le seguenti sezioni:
1. **Carovana Attiva**: Visualizza la carovana corrente e lo stato delle Fasi 1-6 (checkbox e materiali).
2. **Damage Challenge**: Checkbox manuali per spuntare i tier raggiunti.
3. **Catch-up SP**: Checkbox manuali per selezionare i punti recuperati, visibili sotto le condizioni di cap.
4. **Pannello Post-Spedizione**: Per gestire l'esito del ciclo.
5. **Configurazione Iniziale**: Un Drawer ad apertura controllata (dal lato del trigger) che permette in qualunque momento di configurare manualmente streak, spedizioni e punti pregressi.
