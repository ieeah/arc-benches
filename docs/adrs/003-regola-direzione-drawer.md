# ADR 003 — Regola Direzione dei Drawer

## Contesto
I drawer e i modali a comparsa venivano aperti in modo disomogeneo, a volte dal basso anche quando il pulsante di attivazione si trovava nella parte superiore dello schermo.

## Decisione
Stabilire una regola UX fissa: la direzione di apertura di un `Drawer` deve corrispondere alla posizione del pulsante/trigger che lo attiva:
- Trigger in alto $\rightarrow$ `from="top"`
- Trigger in basso $\rightarrow$ `from="bottom"`
- Trigger laterale $\rightarrow$ `from="left"` / `from="right"`

## Conseguenze
- **Vantaggi**: Continuità spaziale del gesto e UX prevedibile su dispositivi mobile.
