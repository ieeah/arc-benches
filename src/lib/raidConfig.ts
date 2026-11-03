// ── PARAMETRI DI CONFIGURAZIONE INTERAZIONE (NON MAGIC NUMBERS) ──
export const RAID_HOLD_CONFIG = {
  /** Millisecondi iniziali di "zona morta" per ignorare tocchi accidentali o scroll */
  deadzoneMs: 100,
  /** Durata della pressione continua necessaria per completare l'oggetto (dopo la deadzone) */
  completeDurationMs: 250,
  /** Durata della pressione continua necessaria per deselezionare l'oggetto (dopo la deadzone) */
  uncompleteDurationMs: 400,
  /** Durata dell'effetto esplosione/glow post-completamento */
  burstDurationMs: 150,
} as const;
