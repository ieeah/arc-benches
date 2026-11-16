import recipesCatalog from '@/data/recipes.json';
import type {
  RecipesCatalog,
  ItemRecipeData,
  UpgradeBranch,
  UpgradeRequirement,
} from '@/types/recipes';
import type { BaseItemDefinition } from '@/lib/baseItems';

const catalog = recipesCatalog as unknown as RecipesCatalog;

/**
 * Restituisce l'intera entry di ricetta e manutenzione per un dato itemId.
 */
export function getItemRecipe(itemId: string): ItemRecipeData | undefined {
  if (!itemId) return undefined;
  return catalog.recipes[itemId];
}

export type RecyclingSource = {
  itemId: string;
  recyclesYield?: number;
  salvagesYield?: number;
};

// Indice inverso lazy per il riciclo: targetItemId -> Array<RecyclingSource>
let reverseRecyclingIndex: Map<string, RecyclingSource[]> | null = null;

function buildReverseRecyclingIndex(): Map<string, RecyclingSource[]> {
  const index = new Map<string, RecyclingSource[]>();

  for (const [sourceId, entry] of Object.entries(catalog.recipes)) {
    if (!entry.recycling) continue;
    const { recyclesInto, salvagesInto } = entry.recycling;

    const touched = new Set<string>();
    if (recyclesInto) {
      Object.keys(recyclesInto).forEach((k) => touched.add(k));
    }
    if (salvagesInto) {
      Object.keys(salvagesInto).forEach((k) => touched.add(k));
    }

    for (const targetId of touched) {
      const recYield = recyclesInto?.[targetId];
      const salYield = salvagesInto?.[targetId];
      let list = index.get(targetId);
      if (!list) {
        list = [];
        index.set(targetId, list);
      }
      list.push({
        itemId: sourceId,
        recyclesYield: recYield,
        salvagesYield: salYield,
      });
    }
  }

  // Ordina per resa totale decrescente
  for (const list of index.values()) {
    list.sort((a, b) => {
      const yieldA = Math.max(a.recyclesYield ?? 0, a.salvagesYield ?? 0);
      const yieldB = Math.max(b.recyclesYield ?? 0, b.salvagesYield ?? 0);
      return yieldB - yieldA;
    });
  }

  return index;
}

/**
 * Restituisce l'elenco degli oggetti che, una volta riciclati o smantellati,
 * producono l'oggetto target specificato.
 */
export function getRecyclingSources(targetItemId: string): RecyclingSource[] {
  if (!targetItemId) return [];
  if (!reverseRecyclingIndex) {
    reverseRecyclingIndex = buildReverseRecyclingIndex();
  }
  return reverseRecyclingIndex.get(targetItemId) ?? [];
}

export type EvolutionStep = {
  fromItemId: string;
  toItemId: string;
  fromLevelName: string;
  toLevelName: string;
  ingredients: Record<string, number>;
  requires?: UpgradeRequirement[];
  isAmplified?: boolean;
};

/**
 * Costruisce la scaletta evolutiva completa per un Base Item (es. Anvil I -> II -> III -> IV -> Amplificazioni).
 */
export function getEvolutionTimeline(baseDef: BaseItemDefinition): {
  steps: EvolutionStep[];
  amplificationBranches: EvolutionStep[];
} {
  const steps: EvolutionStep[] = [];
  const amplificationBranches: EvolutionStep[] = [];

  const tierOrder = ['i', 'ii', 'iii', 'iv', 'v'];

  // Cerca le varianti ordinate per livello romano
  const tierIds: { tier: string; itemId: string; levelNum: number }[] = [];
  for (const vId of baseDef.variantItemIds) {
    const match = vId.match(/-(i|ii|iii|iv|v)$/i);
    if (match) {
      const tier = match[1].toLowerCase();
      const levelNum = tierOrder.indexOf(tier) + 1;
      tierIds.push({ tier, itemId: vId, levelNum });
    }
  }

  tierIds.sort((a, b) => a.levelNum - b.levelNum);

  // Costruisci gli step sequenziali di livello (es. I -> II -> III -> IV)
  for (let i = 0; i < tierIds.length - 1; i++) {
    const curr = tierIds[i];
    const next = tierIds[i + 1];
    const currRecipe = getItemRecipe(curr.itemId);
    const branch = currRecipe?.upgrade?.branches?.find((b: UpgradeBranch) => b.to === next.itemId);
    const cost = branch?.cost || currRecipe?.upgrade?.upgradeCost;

    if (cost && Object.keys(cost).length > 0) {
      steps.push({
        fromItemId: curr.itemId,
        toItemId: next.itemId,
        fromLevelName: `Lvl ${curr.tier.toUpperCase()}`,
        toLevelName: `Lvl ${next.tier.toUpperCase()}`,
        ingredients: cost,
        requires: branch?.requires,
        isAmplified: false,
      });
    }
  }

  // Cerca i rami di amplificazione (tipicamente dal livello massimo, es. IV)
  const maxTier = tierIds[tierIds.length - 1];
  if (maxTier) {
    const maxRecipe = getItemRecipe(maxTier.itemId);
    const branches = maxRecipe?.upgrade?.branches || [];
    for (const b of branches) {
      if (b.to && b.to !== maxTier.itemId && !tierIds.some((t) => t.itemId === b.to)) {
        amplificationBranches.push({
          fromItemId: maxTier.itemId,
          toItemId: b.to,
          fromLevelName: `Lvl ${maxTier.tier.toUpperCase()}`,
          toLevelName: 'Amplificato',
          ingredients: b.cost,
          requires: b.requires,
          isAmplified: true,
        });
      }
    }
  }

  return { steps, amplificationBranches };
}

/**
 * Restituisce i potenziamenti pertinenti per una specifica variante:
 * - Se non è al livello massimo, restituisce solo il prossimo livello (es. II -> III).
 * - Se è al livello massimo (IV) o amplificata, restituisce i rami di amplificazione.
 */
export function getNextUpgradeStep(
  itemId: string,
): {
  nextStep?: EvolutionStep;
  amplificationBranches: EvolutionStep[];
} {
  const recipe = getItemRecipe(itemId);
  const amplificationBranches: EvolutionStep[] = [];

  if (!recipe?.upgrade) {
    return { amplificationBranches: [] };
  }

  const branches = recipe.upgrade.branches || [];

  // Se l'oggetto ha upgradesTo esplicito (es. anvil-ii -> anvil-iii)
  const upgradesTo = recipe.upgrade.upgradesTo;
  const isUpgradesToAmplified = upgradesTo && /^amplified-/i.test(upgradesTo);

  let nextStep: EvolutionStep | undefined;

  if (upgradesTo && !isUpgradesToAmplified) {
    const branch = branches.find((b: UpgradeBranch) => b.to === upgradesTo);
    const cost = branch?.cost || recipe.upgrade.upgradeCost;
    if (cost && Object.keys(cost).length > 0) {
      const matchCurr = itemId.match(/-(i|ii|iii|iv|v)$/i);
      const matchNext = upgradesTo.match(/-(i|ii|iii|iv|v)$/i);
      nextStep = {
        fromItemId: itemId,
        toItemId: upgradesTo,
        fromLevelName: matchCurr ? `Lvl ${matchCurr[1].toUpperCase()}` : itemId,
        toLevelName: matchNext ? `Lvl ${matchNext[1].toUpperCase()}` : upgradesTo,
        ingredients: cost,
        requires: branch?.requires,
        isAmplified: false,
      };
    }
  }

  // Raccogli eventuali rami amplificati
  for (const b of branches) {
    if (/^amplified-/i.test(b.to) || b.to.includes('amplified')) {
      amplificationBranches.push({
        fromItemId: itemId,
        toItemId: b.to,
        fromLevelName: 'Lvl IV',
        toLevelName: 'Amplificato',
        ingredients: b.cost,
        requires: b.requires,
        isAmplified: true,
      });
    }
  }

  return { nextStep, amplificationBranches };
}

/**
 * Normalizza il nome visualizzato per una stazione/banco di crafting o riparazione.
 */
export function getStationDisplayName(stationId: string): string {
  switch (stationId) {
    case 'in-raid':
    case 'in_raid':
      return 'In Raid';
    case 'workbench':
      return 'Banco Base';
    case 'weapon-bench':
    case 'weapon_bench':
    case 'gunsmith':
      return 'Banco Armi (Gunsmith)';
    case 'med-station':
    case 'medical':
      return 'Banco Medico';
    case 'gear-bench':
    case 'gear_bench':
      return 'Banco Equipaggiamento';
    case 'explosives-bench':
    case 'explosives_bench':
      return 'Banco Esplosivi';
    case 'refiner':
      return 'Raffineria';
    default:
      return stationId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
