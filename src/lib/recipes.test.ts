import { describe, it, expect } from 'vitest';
import {
  getItemRecipe,
  getRecyclingSources,
  getEvolutionTimeline,
  getNextUpgradeStep,
  getStationDisplayName,
} from './recipes';
import type { BaseItemDefinition } from './baseItems';

describe('recipes lib', () => {
  it('restituisce la ricetta per anvil-i', () => {
    const r = getItemRecipe('anvil-i');
    expect(r).toBeDefined();
    expect(r?.crafting).toBeDefined();
    expect(r?.crafting?.benches['weapon-bench']).toBeDefined();
    expect(r?.crafting?.ingredients['heavy-gun-parts']).toBeGreaterThan(0);
  });

  it('estrae le fonti di riciclo inverse per chemicals', () => {
    const sources = getRecyclingSources('chemicals');
    expect(sources.length).toBeGreaterThan(0);
    const adrenaline = sources.find((s) => s.itemId === 'adrenaline-shot');
    expect(adrenaline).toBeDefined();
    expect(adrenaline?.recyclesYield).toBe(1);
  });

  it('costruisce la scaletta evolutiva per un BaseItem come Anvil', () => {
    const fakeBase: BaseItemDefinition = {
      id: 'anvil',
      name: 'Anvil',
      item_type: 'Weapon',
      variantItemIds: [
        'anvil-i',
        'anvil-ii',
        'anvil-iii',
        'anvil-iv',
        'amplified-anvil',
      ],
    };

    const timeline = getEvolutionTimeline(fakeBase);
    expect(timeline.steps.length).toBe(3); // I->II, II->III, III->IV
    expect(timeline.steps[0].fromItemId).toBe('anvil-i');
    expect(timeline.steps[0].toItemId).toBe('anvil-ii');
    expect(timeline.steps[1].fromItemId).toBe('anvil-ii');
    expect(timeline.steps[1].toItemId).toBe('anvil-iii');
    expect(timeline.steps[2].fromItemId).toBe('anvil-iii');
    expect(timeline.steps[2].toItemId).toBe('anvil-iv');

    expect(timeline.amplificationBranches.length).toBeGreaterThan(0);
    expect(timeline.amplificationBranches[0].toItemId).toBe('amplified-anvil');
  });

  it('restituisce solo il prossimo step di upgrade per una variante specifica come anvil-ii', () => {
    const result = getNextUpgradeStep('anvil-ii');
    expect(result.nextStep).toBeDefined();
    expect(result.nextStep?.toItemId).toBe('anvil-iii');
    expect(result.amplificationBranches.length).toBe(0);
  });

  it('restituisce i rami amplificati per anvil-iv', () => {
    const result = getNextUpgradeStep('anvil-iv');
    expect(result.nextStep).toBeUndefined(); // anvil-iv upgradesTo amplified-anvil
    expect(result.amplificationBranches.length).toBeGreaterThan(0);
    expect(result.amplificationBranches[0].toItemId).toBe('amplified-anvil');
  });

  it('normalizza i nomi delle stazioni', () => {
    expect(getStationDisplayName('in-raid')).toBe('In Raid');
    expect(getStationDisplayName('weapon-bench')).toBe('Banco Armi (Gunsmith)');
    expect(getStationDisplayName('med-station')).toBe('Banco Medico');
  });
});
