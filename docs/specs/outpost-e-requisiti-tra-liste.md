# Specifica — Outpost e requisiti tra liste (#87)

Stato: **decisioni prese e implementate (2026-10-11)**. Riguarda l'Outpost, i suoi legami con Research Station e Gunsmith e il meccanismo generale dei requisiti di livello su altre liste.

## 1. Modello di progressione (ARC Raiders)
Le dipendenze formano un grafo aciclico orientato, a senso unico: ciò che sta più in alto non dipende da ciò che sta sotto.

| Nodo | Livelli | Dipende da |
|---|---|---|
| **Sheltered Retreat** (progetto, 3 fasi: foto alla fattoria, consegna materiali, danni ad ARC volanti e Bully) | 3 | livello giocatore 18 (solo informativo) |
| **Outpost** | 4 (0 = bloccato, 1 = stanza base, 2–4 = moduli) | Lvl 1 richiede Sheltered Retreat completato; Lvl 2–4 solo materiali |
| **Research Station** | 4 | Lvl N richiede Outpost ≥ N (tetto infrastrutturale) |
| **Gunsmith** | 4 | Lvl 1–3 indipendenti; Lvl 4 richiede Outpost ≥ 4, non la Research Station |
| **Weapon Amplification** | per arma | Gunsmith 4 (innesto) e Research Station 4 (perk): fuori dalle liste, vedi #92 |

L'Outpost può salire con la Research Station a 0: nessun vincolo in senso inverso.

## 2. Come lo rappresentano le liste
- **`sheltered-retreat`** (`projects.json`): era la lista `outpost` a 3 livelli, rinominata («Rifugio protetto»). La descrizione riporta il livello giocatore 18 come informazione: l'app non lo controlla.
- **`outpost`** (`workbenches.json`): lista `workbench` a 4 livelli. Lvl 1 senza materiali, con `requires` su `sheltered-retreat` Lvl 3. Lvl 2: 3 Steel Cable, 20 Sheet Metal, 3 Cable Stripper. Lvl 3: 3 Epoxy Bucket, 35 Planks, 3 Hand Drill. Lvl 4: 40 Sheet Metal, 3 Laser Level, 3 Insulation Roll.
- **Research Station** e **Gunsmith**: le azioni di testo «N Outpost rooms installed» diventano `requires` su `outpost` (Research Lvl 1–4 → Outpost 1–4, Gunsmith Lvl 4 → Outpost 4). I materiali restano.
- Un primo livello con `requires` non è «già sbloccato»: `getBaseLevel` parte da 0.

## 3. Meccanismo: `ListLevel.requires`
`requires?: { listId: string; level: number }[]` su ogni livello: per sbloccarlo, la lista indicata deve essere almeno a quel livello. È una **condizione derivata**, non un'azione da spuntare.

- **Salire** (`setModuleCurrentLevel`): si ferma al livello appena sotto il primo con un requisito non soddisfatto (`maxReachableLevel`); se non cambia nulla non si sottrae nulla. «Completa potenziamento» (`upgradeModule`) è rifiutato e `getAvailableUpgradesPure` non propone il livello.
- **Scendere**: le liste i cui livelli già raggiunti richiedono livelli ora più alti scendono a catena al livello appena sotto il primo violato (`getCascadeLowering`; Sheltered Retreat → Outpost → Research Station → Gunsmith), e perdono i progressi dei livelli lasciati (azioni, passi, consegne); i materiali non tornano nell'inventario. **La UI chiede prima conferma**, elencando le liste che scenderanno.
- **Stash**: i materiali di un livello bloccato restano nel fabbisogno (gli oggetti si raccolgono in anticipo); è il potenziamento a essere bloccato.
- **Dati**: `validateLevel` conserva `requires`; il test `seedRequirements.test.ts` verifica che ogni requisito punti a una lista esistente, a un livello raggiungibile e senza cicli.

## 4. Interfaccia
- **Card di «Banchi e Liste»**: i requisiti del livello successivo compaiono come chip («Richiede Outpost Lvl 2», ambra se non soddisfatto, verde se soddisfatto). Salire oltre un livello bloccato spiega cosa serve; scendere con dipendenti apre la conferma.
- **Pagina di dettaglio**: chip su ogni livello e gli stessi controlli sul selettore del livello corrente.
- **Dev**: editor «Requisiti su altre liste» per ogni livello in Gestione Liste.

## 5. Fuori scope
- **Weapon Amplification** (WA1, WA2 e l'avviso «arma amplificata non modificabile»): stato per arma, in #92.
- **Research Bench** (15 nodi `Research`) e **arredi** (69 `Furniture`, 100 `Design`): restano in #87 e nel tracker collezioni (#91).

## 6. Correlate
#87, #92, #91, [azioni-di-livello.md](azioni-di-livello.md).
