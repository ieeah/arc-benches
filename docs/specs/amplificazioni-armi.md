# Amplificazioni armi: dati per arma (ARC Raiders, Frozen Trail 2.0)

> Bozza di ricerca · 12/10/2026 · Prerequisiti e sblocco: [spec §2.3](weapon-amplification-tech-spec.md#23-prerequisiti-comuni) · Stazioni, materiali, riparazione, avamposto: [info secondarie](amplificazione-armi-info-secondarie.md)

Questo documento contiene solo i dati specifici per arma: moduli, nodi, effetti, costi di montaggio, requisiti di ricerca, regole di esclusività. Le informazioni già in spec o nel documento secondario non sono ripetute.

**Legenda**

| Simbolo | Significato |
|---|---|
| ✅ | Confermato: fonte primaria (F) o ≥2 fonti concordi |
| ⚠️ | Fonte singola secondaria, dato discordante o sospetto: da verificare |
| ❌ | Non trovato nelle fonti |

**Codici fonte:** **F** = scheda per arma tratta da un video che mostra il gioco (fonte primaria, prevale sulle guide). A aoeah · D destructoid · P playerauctions · W arcraidershub · K keengamer · M mypandaplay · Y yahoo (fonti complete in §7).

**Nota nomi:** F usa "El Toro" (= Il Toro), "Bletta" (= Burletta), "Charge Burst" (= Charged Burst).

---

## 1. Regole di amplificazione

| Regola | Stato | Fonti |
|---|---|---|
| Lvl 4 (Tier IV) dell'arma è requisito per amplificare; dopo l'amplificazione l'arma è Lvl 5 | ✅ | Utente, F, A, K |
| Amplificazione porta la durabilità base a 200 senza aumentare il danno base | ✅ | W, M, F |
| Sblocca l'albero dei potenziamenti dell'arma | ✅ | F |
| Nodi con ricerca: task + 5.000 PR + parti ARC. Le ricerche restano sbloccate per sempre | ✅ | A, K, F |
| **Nodi senza ricerca esistono**: il requisito è per nodo, non per ramo | ✅ | F (vedi §3) |
| 2–4 opzioni per arma | ✅ | D, Y |
| Alcuni nodi sono esclusivi: scegliere uno blocca gli alternativi per quell'arma | ✅ | W, F |
| Alcuni perk condividono il nome tra armi ma cambiano valori | ✅ | P |
| "Amplified Durability" come stat separata | ⚠️ | M |
| Ferro, Tempest, Wolfpack non amplificabili (Ferro: nome corretto da trascrizione di F). Le 15 sono le armi amplificabili alla versione attuale; altre arriveranno con gli aggiornamenti | ✅ | F (Tempest anche A) |

---

## 2. Moduli di Amplificazione

Requisito e fonti: [spec §2.3](weapon-amplification-tech-spec.md#23-prerequisiti-comuni). Localizzazione: [info §3](amplificazione-armi-info-secondarie.md#3-fonti-di-oggetti-rari).

| Modulo | Rarità | Armi | Stato |
|---|---|---|---|
| Mk I | Comune | Rattler (A, K, F) · Hairpin (K, F) · Kettle (K, F) | ✅ |
| Mk II | Non comune | Il Toro (K, F) · Burletta (K, F) | ✅ |
| Mk III | Raro | Anvil (A, K, F) · Osprey (A, K, F) · Canto (K, F) · Rascal (K, F) · Renegade (K, F) | ✅ |
| Mk IV | Epico | Hullcracker (A, K, F) | ✅ |
| Mk V | Leggendario | Aphelion (K, F) · Equalizer (K, F) · Jupiter (K, F) · Bettina (F) | ✅ |

- Bettina: F indica Mk 5 (in gioco). K indicava Mk IV: superato da F.

---

## 3. Schede per arma

Costi di montaggio e requisiti di ricerca: fonte F (in gioco). Ricerca: 5.000 PR per ogni nodo con ricerca (A, K, F). Nomi: vedi [spec §2.6](weapon-amplification-tech-spec.md#26-amplificazioni-per-arma).

### 3.1 Anvil (Mk III)

**Esclusivi:** X-Rounds ⊗ Anvil Splitter.

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| X-Rounds | +5 danno base; +33% danno vs armatura ARC; penetrazione armatura "Very Strong"; −10% headshot; rinculo↑; velocità proiettile −50% | 3 Fossilized Lightning | 1.000 danni ciascuno a Hornet, Firefly, Surveyor, Fireball con Light Impact Grenades + 5 Rocketeer Driver | ✅ |
| Anvil Splitter | 1 colpo → 4 proiettili, ognuno −70% danno (48 totali vs 40); −40% headshot; dispersione ADS↑ | ❌ | Nessuna | ✅ effetti · ❌ costo |

### 3.2 Il Toro (Mk II)

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| Slug Rounds | Un proiettile al posto dei pallini (10× un pallino = +900%); +200% vs armatura ARC; dispersione −40%; velocità −50% | 4 Turbine Compressor (confermato) | 50 ARC volanti con fucili a pompa + 20 Tick Pod + 5.000 PR | ✅ |
| More Reload | +1 cartuccia extra per ricarica | 2 Propellant Valve Assembly | Nessuna | ✅ |

### 3.3 Rattler (Mk I)

**Prerequisito:** Drum Mag richiede More Reload (A, W).

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| More Reload | Ricarica 4 colpi alla volta invece di 2 | 2 Propellant Valve Assembly | Nessuna | ✅ |
| Drum Mag | +40 caricatore (64 totali); rinculo↑, dispersione↑, mira −10% | 4 Pressure Regulator | 15.000 danni a Bastion con Rattler + eliminarne 1 (F). K aggiunge 5 Bastion Cell | ✅ |
| Incendiary Rounds | 5 danno fuoco/s; fuoco +2 s; caricatore resta a 24 (A) | 3 Fossilized Lightning | 30 Fireball con mine esplosive | ✅ |

### 3.4 Burletta (Mk II)

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| Full Auto (esclusivo vs Burst) | Cadenza 33 → 53 (+60%); danno 10 → 8; stabilità ~72 → ~42; headshot −60% | 3 Pneumatic Actuator | Nessuna | ✅ |
| Burst Fire (incompatibile con Full Auto) | Modalità a raffica; +2 proiettili per raffica | 2 Queen Reactor | 3 Shredder con Raider Tool | ✅ |
| Increased Burst (richiede Burst Fire) | +2 colpi per raffica; +3 caricatore | 2 Pressure Regulator | 10.000 danni con Burletta a raffica o Aphelion a carica (K) | ✅ |
| Sprint Shooting (compatibile con Full Auto e Burst) | Sparo in corsa | 4 Fluted Rotor Core | Visitare 7 punti su Pass in un raid (Commissary, Supermarket, Altamera Station) | ✅ |

### 3.5 Kettle (Mk I)

**Esclusivi:** X-Rounds ⊗ Full Auto · X-Rounds ⊗ Anti-Shield.

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| Full Auto | Fuoco automatico; cadenza +15%; headshot ridotto; dispersione↑ | 3 Pneumatic Actuator | Nessuna | ✅ |
| X-Rounds | Come Anvil X-Rounds: +5 danno base, +33% vs armatura, penetrazione "Very Strong" | 3 Fossilized Lightning | Granate come Anvil (1.000 danni a Hornet, Firefly, Surveyor, Fireball + 5 Rocketeer Driver + 5.000 PR) | ✅ |
| Anti-Shield (compatibile con Full Auto) | Danno agli scudi Raider raddoppiato; −2 danno base | 3 Assessor Matrix | 700 danni inflitti ai Raider | ✅ |

### 3.6 Bettina (Mk V)

**Rami esclusivi:** Bigger Mag ⊗ Semi-Auto. X-Rounds dopo Semi-Auto.

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| Bigger Mag (ramo 1) | +15 caricatore (totale 37) | 3 Pressure Regulator | Nessuna | ✅ |
| Semi-Auto (ramo 2) | +3 danno base; −20% cadenza; non più full-auto | 3 Pneumatic Actuator | 5 Skulker con Raider Tool | ✅ |
| X-Rounds (dopo Semi-Auto) | +3 danno base; +25% vs armatura ARC; −4 caricatore; penetrazione "Very Strong" | 3 Fossilized Lightning | Granate come Anvil | ✅ |

Combinato Semi-Auto + X-Rounds: danno 16 → 24, caricatore 18 (F).

### 3.7 Hullcracker (Mk IV)

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| Incendiary Grenades | 11,25 danno burn/s; durata +5 s; impatto diretto 100 → 60; velocità granata dimezzata | 3 Fossilized Lightning | 3.000 danni con Blaze Grenades | ✅ |
| Mag Reload | Ricarica caricatore intero | 3 Propellant Valve Assembly | Nessuna | ✅ |

### 3.8 Hairpin (Mk I)

**Esclusivi:** Incendiary Rounds, Tracker Rounds, Semi-Auto (i primi tre). Sprint Shooting richiede Semi-Auto.

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| Incendiary Rounds | 5 danno burn/s; +2 s | 3 Fossilized Lightning | 30 Fireball con mine | ✅ |
| Tracker Rounds | Bersaglio colpito rivelato 5 s | 1 Matriarch Reactor | Nessuna | ✅ |
| Semi-Auto | +150% cadenza; −20% headshot; dispersione↑ | 3 Pneumatic Actuator | 5 Skulker con Raider Tool | ✅ |
| Sprint Shooting (dopo Semi-Auto) | Sparo in corsa | 3 Fluted Rotor Core | Ricerca mappa Pass/Pendola (F) | ✅ |

### 3.9 Renegade (Mk III)

**Montabili insieme:** More Reload + Scope.

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| More Reload | +1 colpo per ricarica | 2 Propellant Valve Assembly | Nessuna | ✅ |
| Scope | Mirino ottico a lungo raggio | 4 Fluted Rotor Core | Blue Gate, Pilgrim's Peak, 1.000 danni ARC con Osprey, 14 Snitch Scanner, 5.000 PR | ✅ |

Anti-Shield: non presente (F).

### 3.10 Osprey (Mk III)

**Esclusivi:** Tracker Rounds ⊗ Anti-Weak Point (W; F non lo indica).

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| Tracker Rounds | Bersaglio tracciato 5 s; proiettile −60% velocità | 2 Matriarch Reactor | Nessuna | ✅ |
| Anti-Weak Point | +100% vs punti deboli ARC; danno ridotto vs armatura | 2 Assessor Matrix | 40 propulsori su ARC volanti | ✅ |
| Ergonomic Bolt | Armare l'otturatore in mira | 3 Fluted Rotor Core | 1.000 danni con Hairpin in un raid | ✅ |

### 3.11 Rascal (Mk III)

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| High Velocity | Velocità proiettile +100%; dispersione in mira dimezzata | 2 Pneumatic Actuator | Nessuna | ✅ |
| Sprint Shooting | Sparo in corsa | 2 Fluted Rotor Core | Percorso di esplorazione Pendola/Pass | ✅ |
| Incendiary Grenades | 11,25 burn/s; impatto diretto 75 → 45 | 3 Fossilized Lightning | 3.000 danni con Blaze Grenades | ✅ |

### 3.12 Canto (Mk III)

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| Carbine Conversion | Rinculo in mira dimezzato; dispersione ridotta; cadenza −10%; estrazione più lenta | 3 Propellant Valve Assembly | Nessuna | ✅ |
| Sprint Shooting | Sparo in corsa | 4 Fluted Rotor Core | Esplorazione Pendola/Pass | ✅ |
| Incendiary Rounds | 5 burn/s; +2 s | 3 Fossilized Lightning | 30 Fireball con mine | ✅ |

### 3.13 Equalizer (Mk V)

**Esclusivi:** Ramping Damage ⊗ Anti-Weak Point.

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| Bigger Mag | 50 → 80 caricatore | 3 Pressure Regulator | Nessuna | ✅ |
| Ramping Damage | Danno cresce con permanenza sul bersaglio | 3 Queen Reactor | 1.500 danni a Vaporizer con Equalizer in un raid | ✅ |
| Anti-Weak Point | +67% vs punti deboli; −60% vs armatura | 2 Assessor Matrix | 40 propulsori su ARC volanti | ✅ |

### 3.14 Aphelion (Mk V)

**Esclusivi:** Increased Burst richiede Charged Burst (A).

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| Bigger Mag | +6 caricatore → 16 | 3 Pressure Regulator | Nessuna | ✅ |
| Charged Burst | Carica: fino a 2 colpi extra; meno danno e molto più rinculo. Numeri (−2,5 danno, +60% rinculo) solo P | 2 Queen Reactor | 5 ARC Turbine distrutte | ✅ effetto · ⚠️ numeri |
| Increased Burst | +2 colpi per raffica | 2 Pressure Regulator | Condivisa con Burletta (10.000 danni) | ✅ |
| Incendiary Rounds | 5 burn/s; +2 s | 3 Fossilized Lightning | 30 Fireball con mine | ✅ |

### 3.15 Jupiter (Mk V)

| Nodo | Effetti | Montaggio | Ricerca | Stato |
|---|---|---|---|---|
| Bigger Mag | +5 caricatore → 10 | 3 Pressure Regulator | Nessuna | ✅ |
| Scope | Mirino ottico | 3 Fluted Rotor Core | Condivisa con Renegade Scope | ✅ |
| Ergonomic Bolt | Armare in mira | 3 Fluted Rotor Core | Condivisa con Osprey (1.000 danni con Hairpin) | ✅ |

---

## 4. Ricerche: indice

Dettaglio nei nodi di §3.

- **Senza ricerca:** Mag Reload, Bigger Mag (Bettina, Equalizer, Aphelion, Jupiter), More Reload (Rattler, Renegade, Il Toro), Carbine Conversion, High Velocity, Tracker Rounds, Full Auto (Burletta, Kettle), Anvil Splitter.
- **Condivise:** Increased Burst (Burletta/Aphelion); Scope (Renegade/Jupiter); Ergonomic Bolt (Osprey/Jupiter); granate Anvil (Anvil/Bettina/Kettle).

---

## 5. Conflitti residui

Conflitti su stazioni, materiali, avamposto e nomi: [info §5](amplificazione-armi-info-secondarie.md#5-conflitti-aperti) e [spec §3](weapon-amplification-tech-spec.md#3-conflitti-tra-fonti-e-risoluzione).

| # | Tema | Versione F (in gioco) | Versione alternativa | Stato |
|---|---|---|---|---|
| 1 | Rattler Drum Mag: ricerca | 15.000 danni Bastion (F) | + 5 Bastion Cell (K) | Usare F; verificare le Bastion Cell |
| 2 | Osprey: esclusività AWP / Tracker | Non indicata (F) | Esclusivi (W) | Verificare |
| 3 | Charged Burst: numeri | Solo effetto qualitativo (F) | −2,5 danno, +60% rinculo (P) | Verificare |
| 4 | Burletta Full Auto: stabilità | ~72 → ~42 (F) | Non indicata altrove | Single source in-game |

Risolti con F (in gioco): Bettina Mk 5; Kettle X-Rounds +5 / +33%; Sprint Shooting (Burletta: 7 punti Pass; Hairpin, Rascal, Canto: esplorazione Pass/Pendola); Hairpin esclusività; Hairpin Semi-Auto −20% headshot; Bettina Semi-Auto −20% cadenza; Anvil X-Rounds +5 base; Renegade senza Anti-Shield; Slug senza incendiario.

---

## 6. Gap

- [ ] Costo montaggio Anvil Splitter (F non lo indica).
- [ ] Localizzazione dei materiali di montaggio: Fossilized Lightning, Propellant Valve Assembly, Queen Reactor, Fluted Rotor Core, Assessor Matrix, Matriarch Reactor, Turbine Compressor. Vedi [info §3](amplificazione-armi-info-secondarie.md#3-fonti-di-oggetti-rari).
- [ ] Dettaglio Field Repair: [info §4](amplificazione-armi-info-secondarie.md#4-riparazione-e-durabilità).

---

## 7. Fonti

- **F**: scheda per arma e regole generali, tratte da video che mostra il gioco (fornite dall'utente). Fonte primaria.
- A: https://www.aoeah.com/news/4872--arc-raiders-weapon-amplification-list--best-amplified-weapons-20-frozen-trail
- D: https://www.destructoid.com/all-weapon-amplifications-in-arc-raiders-and-how-they-work/
- P: https://www.playerauctions.com/arc-raiders-guide/tips-guides/all-amplifications-and-effects/ (letta via HTML fornito dall'utente)
- W: https://arcraidershub.com/guides/amplified-weapons-guide (attribuzione da verificare)
- K: https://www.keengamer.com/articles/guides/arc-raiders-all-15-amplified-weapons-how-to-unlock/
- M: https://mypandaplay.com/arc-raiders/guides/weapon-amplification/ (attribuzione da verificare)
- Y: https://tech.yahoo.com/gaming/articles/amplify-weapons-arc-raiders-191816522.html

Fonti del video di riassunto e dei documenti di spec: [spec §1](weapon-amplification-tech-spec.md#1-fonti-e-precedenza).
