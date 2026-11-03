import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HOLD_CONFIG,
  DEFAULT_HOLD_CONFIG,
  getHoldConfig,
  setHoldConfigOverride,
  resetHoldConfigOverride,
} from './holdConfig';
import { RAID_HOLD_CONFIG } from './raidConfig';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] ?? null; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
  removeItem(key: string) { delete this.store[key]; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
}

const mockLocalStorage = new MockStorage();
vi.stubGlobal('localStorage', mockLocalStorage);

describe('holdConfig', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    resetHoldConfigOverride();
  });

  it('defines valid non-zero durations for hold interactions', () => {
    expect(HOLD_CONFIG.deadzoneMs).toBeGreaterThan(0);
    expect(HOLD_CONFIG.completeDurationMs).toBeGreaterThan(0);
    expect(HOLD_CONFIG.uncompleteDurationMs).toBeGreaterThan(HOLD_CONFIG.completeDurationMs);
    expect(HOLD_CONFIG.burstDurationMs).toBeGreaterThan(0);
    expect(HOLD_CONFIG.touchMoveThresholdPx).toBeGreaterThan(0);
  });

  it('decomposes holdExit and stepperExit into 3 visual phases', () => {
    expect(HOLD_CONFIG.holdExit.feedbackMs).toBeGreaterThan(0);
    expect(HOLD_CONFIG.holdExit.settleMs).toBeGreaterThan(0);
    expect(HOLD_CONFIG.holdExit.fadeMs).toBeGreaterThan(0);

    expect(HOLD_CONFIG.stepperExit.feedbackMs).toBeGreaterThan(0);
    expect(HOLD_CONFIG.stepperExit.settleMs).toBeGreaterThan(0);
    expect(HOLD_CONFIG.stepperExit.fadeMs).toBeGreaterThan(0);
  });

  it('RAID_HOLD_CONFIG aliases HOLD_CONFIG for backwards compatibility', () => {
    expect(RAID_HOLD_CONFIG).toEqual(HOLD_CONFIG);
  });

  it('allows overriding and resetting values via localStorage', () => {
    setHoldConfigOverride({
      completeDurationMs: 600,
      holdExit: {
        feedbackMs: 300,
        settleMs: 200,
        fadeMs: 400,
      },
    });

    const active = getHoldConfig();
    expect(active.completeDurationMs).toBe(600);
    expect(active.holdExit.feedbackMs).toBe(300);
    expect(active.holdExit.settleMs).toBe(200);
    expect(active.holdExit.fadeMs).toBe(400);

    resetHoldConfigOverride();
    expect(getHoldConfig()).toEqual(DEFAULT_HOLD_CONFIG);
  });
});
