# ADR 004 — Rimozione della Feature "Tieni o Butta"

## Contesto
La feature "Tieni o Butta" (indicatore "non vendere") era stata inizialmente pianificata per contrassegnare gli oggetti dell'inventario utili per futuri upgrade, progetti o spedizioni, aiutando i giocatori a decidere cosa conservare e cosa poter vendere.

## Decisione
Rimuovere interamente la feature "Tieni o Butta" dal perimetro e dalla roadmap di sviluppo di **ARC Benches** per le seguenti ragioni:
1. **Fattibilità tecnica limitata**: Non essendoci modo di conoscere l'inventario completo dell'utente in tempo reale (in particolare durante le spedizioni), non è tecnicamente possibile offrire un indicatore dinamico affidabile e accurato al 100%.
2. **UX Ridondante**: Per quanto riguarda le liste (sia i banchi del rifugio sia le liste custom), la sola presenza di un oggetto nella pagina "Stash" indica già in modo esplicito che quell'elemento è ancora necessario e non deve essere venduto. Introdurre un indicatore duplicato avrebbe solo sovraccaricato la UX.

## Conseguenze
- **Vantaggi**: Minore complessità dello stato Zustand, alleggerimento della UX del database oggetti, e semplificazione della logica dell'applicazione focalizzando l'attenzione dello stash come unico e sufficiente indicatore di necessità.
- **Svantaggi**: Nessuno.
