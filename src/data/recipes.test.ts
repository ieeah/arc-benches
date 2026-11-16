import { describe, expect, it } from 'vitest';
import itemsData from './items.json';
import recipesRaw from './recipes.json';
import type { RecipesCatalog, ItemRecipeData } from '@/types/recipes';

describe('Catalogo Ricette e Manutenzione (recipes.json)', () => {
  const ourIdSet = new Set(Object.keys(itemsData));
  const recipesData = recipesRaw as unknown as RecipesCatalog;
  const { recipes, totalCraftable, totalUpgradable, totalRepairable } = recipesData;

  it('ha metriche coerenti con il payload', () => {
    expect(totalCraftable).toBeGreaterThan(100);
    expect(totalUpgradable).toBeGreaterThan(100);
    expect(totalRepairable).toBeGreaterThan(100);
    expect(Object.keys(recipes).length).toBeGreaterThan(500);
  });

  it('la mappa benches ha requisiti validi e sensati', () => {
    for (const [itemId, data] of Object.entries(recipes) as [string, ItemRecipeData][]) {
      if (data.crafting) {
        expect(data.crafting.benches).toBeDefined();
        const benchKeys = Object.keys(data.crafting.benches);
        expect(benchKeys.length, `Nessun banco per ${itemId}`).toBeGreaterThan(0);

        for (const [benchId, req] of Object.entries(data.crafting.benches)) {
          if (benchId !== 'in-raid') {
            expect(req.levelRequired).toBeGreaterThanOrEqual(1);
          }
          if (req.skillRequired) {
            expect(['surv_3r', 'surv_5c', 'surv_nomadic_crafting']).toContain(req.skillRequired);
          }
        }
      }
    }
  });

  it('tutti gli ingredienti di crafting esistono nel catalogo items.json', () => {
    for (const [itemId, data] of Object.entries(recipes) as [string, ItemRecipeData][]) {
      if (data.crafting?.ingredients) {
        for (const ingId of Object.keys(data.crafting.ingredients)) {
          expect(ourIdSet.has(ingId), `Ingrediente ${ingId} per ${itemId} mancante nel catalogo`).toBe(true);
        }
      }
    }
  });

  it('tutti i costi di upgrade e target branches esistono nel catalogo items.json', () => {
    for (const [itemId, data] of Object.entries(recipes) as [string, ItemRecipeData][]) {
      if (data.upgrade?.upgradeCost) {
        for (const ingId of Object.keys(data.upgrade.upgradeCost)) {
          expect(ourIdSet.has(ingId), `Materiale upgrade ${ingId} per ${itemId} mancante`).toBe(true);
        }
      }
      if (data.upgrade?.upgradesTo) {
        expect(ourIdSet.has(data.upgrade.upgradesTo), `Target upgradesTo ${data.upgrade.upgradesTo} mancante`).toBe(true);
      }
      if (data.upgrade?.branches) {
        for (const branch of data.upgrade.branches) {
          expect(ourIdSet.has(branch.to), `Branch target ${branch.to} per ${itemId} mancante`).toBe(true);
          for (const matId of Object.keys(branch.cost)) {
            expect(ourIdSet.has(matId), `Materiale branch ${matId} per ${itemId} mancante`).toBe(true);
          }
        }
      }
    }
  });

  it('tutti i costi di riparazione esistono nel catalogo items.json', () => {
    for (const [itemId, data] of Object.entries(recipes) as [string, ItemRecipeData][]) {
      if (data.repair?.cost) {
        for (const ingId of Object.keys(data.repair.cost)) {
          expect(ourIdSet.has(ingId), `Materiale repair ${ingId} per ${itemId} mancante`).toBe(true);
        }
      }
    }
  });
});
