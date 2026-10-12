# Amplificazione armi: informazioni secondarie (ARC Raiders, Frozen Trail 2.0)

> Bozza di ricerca · 12/10/2026 · Dati fuori dalla meccanica di amplificazione: dove trovare materiali, costi di sblocco, localizzazioni. Riferimento per la [tech spec](weapon-amplification-tech-spec.md). Dati per arma e ricerca completa: [amplificazioni-armi.md](amplificazioni-armi.md). Le informazioni già integrate nella spec non sono ripetute qui.

**Legenda:** ✅ ≥2 fonti concordi · ⚠️ fonte singola o discordante · ❌ non trovato
**Fonti:** codici A, D, W, K, M, P, Y in [amplificazioni-armi.md §9](amplificazioni-armi.md#9-fonti).

---

## 1. Avamposto (Outpost)

### 1.1 Sblocco

```
Completa "Sheltered Retreat" (K, M) ✅
  oppure: fotografa casa rurale a Ruined Homestead (Blue Gate),
          consegna materiali base, infliggi danni a ARC volanti e a un Bully (W) ⚠️
```

| Voce | Stato | Fonti |
|---|---|---|
| Obiettivo "Research Topside Living Conditions" come prerequisito | ⚠️ | Y |
| Difesa del sito: danni ad ARC designati | ⚠️ | Y |

### 1.2 Espansioni

| Passo | Sblocca | Materiali | Stato |
|---|---|---|---|
| Lvl 1 → 2 | Research Station Lvl II, stanza nuova | 3 Steel Cable · 20 Sheet Metal · 3 Cable Stripper | ✅ (A, Y) |
| Lvl 2 → 3 | Stanza nuova | 3 Epoxy Bucket · 35 Planks · 3 Hand Drill | ✅ (A, Y) |
| Lvl 3 → 4 | Gunsmith IV, Research Station Lvl IV, stanza nuova | 40 Sheet Metal · 3 Laser Level · 3 Insulation Roll | ✅ (A, Y) |

> Conflitto: la spec (video) dice che la Postazione di Ricerca a Lvl 4 richiede Avamposto Lvl 3. A e Y dicono Avamposto Lvl 4. Vedi §5.

---

## 2. Stazioni

| Stazione | Livello | Materiali | Stato |
|---|---|---|---|
| Research Station | I | 35 Planks · 5 Battered Paperback · 3 Mini Pump | ⚠️ (A) |
| Research Station (Workstation) | 4 | 3 Thermal Shaker · 3 ARC Data Module · 1 Frigate Inductor | ⚠️ (M) |

> Conflitto: M dice anche che il Gunsmith non supera il Lvl 3 nella pagina Workshop. Il Gunsmith IV è invece confermato da A, Y, W (vedi [spec §2.3](weapon-amplification-tech-spec.md)). Vedi §5.

---

## 3. Fonti di oggetti rari

| Oggetto | Dove si trova | Note | Stato |
|---|---|---|---|
| Fregata ARC | Sequenza di sabotaggio, percorso Cargo, contenitori di alto valore | Rischiosa | ✅ (K, Y) |
| Imperatore caduto | Pendola Pass, interno | Fonte di moduli ed Emperor Modulator | ✅ (A, K, Y, W) |
| Pneumatic Actuator (epico) | Payload dell'Imperatore, condizione Redirection | Max 3 per amplificazione | ✅ (A, K, Y, W) |
| Pressure Regulator (epico) | Payload dell'Imperatore, condizione Redirection | Stesso di sopra | ✅ (A, K, Y, W) |

### 3.1 Punti ricerca per oggetto

| Oggetto (id nel db) | Punti ricerca | Fonte |
|---|---|---|
| Battered Paperback (`battered-paperback`) | 50 | Utente |
| Raider Logbook (`raider-logbook`) | 100 | Utente |
| Exodus Technical Handbook (`exodus-technical-handbook`) | 150 | Utente |
| ARC Data Module (`arc-data-module`) | 200 | Utente, A |
| Frigate Diagnostic Node (`frigate-diagnostic-node`) | 1.000 | Utente, A, W |

Il valore dipende dalla rarità dell'oggetto (spec §2.2). I quattro tomi corrispondono al riassunto del video: tascabile rovinato, diario del rider, manuale tecnico, modulo dati ARC.

> Materiali di applicazione: la spec (video) indica fulmini fossilizzati (Anvil) e valvola del propellente (Renegade). Pneumatic Actuator e Pressure Regulator risultano nelle altre fonti. Vedi §5.

---

## 4. Riparazione e durabilità

| Voce | Valore | Stato |
|---|---|---|
| Frammenti Amplificati per riparare | Consumati dalla riparazione | ✅ (A, K, M) |
| Riciclo di un modulo Mk 1–5 (qualsiasi Mk) | 7 frammenti | ✅ (F, A) |
| Riciclo di arma amplificata o mod Anvil Splitter | Quantità non indicata | ❌ (A) |
| Durabilità dopo morte del Raider | 10% | ✅ (D, K, M) |
| Durabilità massima arma amplificata | 130 → 200 | ⚠️ (W) |
| Durabilità arma trovata da altri giocatori | ~10/200 | ⚠️ (W) |
| Field Repair (perk): ripara fino al 30% durante il raid | Valore da W, fonte singola | ⚠️ (W) |
| Field Repair si applica alle armi amplificate? Costo in frammenti? | Non noto | ❌ |

---

### 4.1 Morte e perdita

| Voce | Stato | Fonti |
|---|---|---|
| Alla morte si perdono arma amplificata, modulo e pezzi installati | ✅ | F, K |
| Il nuovo proprietario trova l'arma a ~10% durabilità | ✅ | D, K, M |
| Augment "Safekeeper": arma in tasca sicura a metà raid | ✅ | F |

### 4.2 Costi di riparazione

| Voce | Stato | Fonti |
|---|---|---|
| Costo riparazione non proporzionale alla durabilità residua | ✅ | F |

## 5. Conflitti aperti

| # | Tema | Versione A | Versione B | Azione |
|---|---|---|---|---|
| 1 | Avamposto per Postazione L4 | Lvl 3 (spec, video) | Lvl 4 (A, Y) | Verificare in gioco |
| 2 | Materiali Postazione L4 | Non nella spec | 3 Thermal Shaker, 3 ARC Data Module, 1 Frigate Inductor (M) | Verificare |
| 3 | Gunsmith massimo | Lvl IV (A, Y, W, spec) | Max Lvl 3 nel Workshop (M) | Verificare |
| 4 | Materiali di applicazione | Fulmini fossilizzati, valvola propellente (video) | Pneumatic Actuator + Pressure Regulator (A, K, Y, W) | Verificare: possono essere materiali diversi per perk |
| 5 | Ramo senza ricerca | Esiste (video, spec §2.4) | Nessuna delle altre fonti lo descrive: ogni perk richiede ricerca (A, K) | Verificare in gioco |
| 6 | Venator | 15ª arma nella spec (riassunto Timesaver: 12 armi) | Non amplificabile (conferma utente) | Chiuso: esclusa |

> Conflitti sulle statistiche per arma (cadenza, danno, headshot): vedi [amplificazioni-armi.md §7](amplificazioni-armi.md#7-conflitti-e-dati-da-verificare).

---

## 6. Gap

- [ ] Costo di applicazione per ogni perk (noto solo Anvil X-Rounds).
- [ ] Costo di sblocco dei moduli per Mk.
- [ ] Probabilità di drop di moduli e Fregate.
- [ ] Location esatta (zona/mappa) di Imperatore e Fregata.
- [ ] Localizzazione dei materiali commerciali (Planks, Steel Cable, Sheet Metal, ecc.): fuori dalle fonti lette.
- [ ] Obiettivi Outpost (Ruined Homestead, Research Topside): verificare con fonte primaria.
- [ ] Quantità frammenti da riciclo.
