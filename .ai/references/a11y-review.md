# Riferimento — ARC Benches

Da leggere insieme a `SKILL.md` quando si valuta l'accessibilità
dell'interfaccia di questo progetto.

## Fonte principale

Vedi `PROJECT-PROFILE.md` e `AGENTS.md` nella root del repository per
stack (React 19 + Tailwind v4) e convenzioni UI.

## Specifico per a11y-review

- **Target dichiarato**: WCAG AA (informale, non conformità formale
  certificata — vale comunque il disclaimer di default della skill).
- **Quando va eseguita**: alla chiusura di ogni milestone/issue
  significativa lato UI, non solo su richiesta estemporanea — è un
  controllo ricorrente del ciclo di rilascio, non un'attività isolata.
  Nel flusso formalizzato di `version-publish.md` è il primo passo prima
  di generare il changelog e taggare la release.
- Nessun componente ancora verificato in modo sistematico: parti da zero,
  non assumere pattern già validati.
