import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';

describe('raidPlanSlice — allineamento Stash <-> Raid', () => {
  beforeEach(() => {
    useAppStore.setState((s) => ({
      ...s,
      inventory: {},
      raidPlan: {
        isRaidRunning: false,
        actions: [],
        items: [],
        updatedAt: Date.now(),
      },
    }));
  });

  it('1. Item aggiunto ex novo nel Raid (!fromStash): syncRaidWithStash non lo modifica né lo rimuove', () => {
    const store = useAppStore.getState();
    store.addRaidItem('elephant-obelisk', 10);

    let items = useAppStore.getState().raidPlan.items;
    expect(items).toHaveLength(1);
    expect(items[0].fromStash).toBeUndefined();
    expect(items[0].targetQuantity).toBe(10);

    // Anche se lo Stash cambia o non richiede quell'item, syncRaidWithStash lo lascia intatto
    useAppStore.getState().syncRaidWithStash();
    items = useAppStore.getState().raidPlan.items;
    expect(items).toHaveLength(1);
    expect(items[0].targetQuantity).toBe(10);
  });

  it('2. Item aggiunto dallo Stash (fromStash: true): si riallinea quando cambia lo Stash', () => {
    const store = useAppStore.getState();
    const totalReq = store.getTotalRequiredMaterials();
    const firstRequiredId = Object.keys(totalReq)[0];
    const reqQty = totalReq[firstRequiredId];
    expect(reqQty).toBeGreaterThan(2);

    store.addRaidItem(firstRequiredId, reqQty, { fromStash: true });
    expect(useAppStore.getState().raidPlan.items[0].fromStash).toBe(true);
    expect(useAppStore.getState().raidPlan.items[0].stashBaseTarget).toBe(reqQty);

    // Simula che nello Stash siano stati aggiunti 2 pezzi
    useAppStore.setState((s) => ({
      inventory: { ...s.inventory, [firstRequiredId]: 2 },
    }));

    useAppStore.getState().syncRaidWithStash();
    const synced = useAppStore.getState().raidPlan.items[0];
    expect(synced.targetQuantity).toBe(reqQty - 2);
    expect(synced.stashBaseTarget).toBe(reqQty - 2);
  });

  it('3. Caso misto: aggiunto dallo Stash (reqQty), aumentato manualmente (+5 nel Raid), poi Stash coperto di 2 -> preserva il +5', () => {
    const store = useAppStore.getState();
    const totalReq = store.getTotalRequiredMaterials();
    const itemId = Object.keys(totalReq)[0];
    const reqQty = totalReq[itemId];

    store.addRaidItem(itemId, reqQty, { fromStash: true });
    const raidItemId = useAppStore.getState().raidPlan.items[0].id;

    // Utente modifica manualmente il target nel Raid a reqQty + 5
    useAppStore.getState().updateRaidItemTarget(raidItemId, reqQty + 5);

    // Poi nello Stash aggiunge 2 unità
    useAppStore.setState((s) => ({
      inventory: { ...s.inventory, [itemId]: 2 },
    }));

    useAppStore.getState().syncRaidWithStash();
    const synced = useAppStore.getState().raidPlan.items[0];
    expect(synced.targetQuantity).toBe(reqQty - 2 + 5);
    expect(synced.stashBaseTarget).toBe(reqQty - 2);
    expect(synced.fromStash).toBe(true);
  });

  it('4. Caso misto 2: Stash coperto al 100%, ma nel Raid cerano +5 extra manuali -> restano i 5 extra e fromStash diventa false', () => {
    const store = useAppStore.getState();
    const totalReq = store.getTotalRequiredMaterials();
    const itemId = Object.keys(totalReq)[0];
    const reqQty = totalReq[itemId];

    store.addRaidItem(itemId, reqQty, { fromStash: true });
    const raidItemId = useAppStore.getState().raidPlan.items[0].id;
    useAppStore.getState().updateRaidItemTarget(raidItemId, reqQty + 5);

    // Stash copre tutto il fabbisogno
    useAppStore.setState((s) => ({
      inventory: { ...s.inventory, [itemId]: reqQty },
    }));

    useAppStore.getState().syncRaidWithStash();
    const synced = useAppStore.getState().raidPlan.items[0];
    expect(synced.targetQuantity).toBe(5);
    expect(synced.fromStash).toBe(false);
    expect(synced.stashBaseTarget).toBeUndefined();
  });

  it('5. applyRaidPlanToStash: aggiunge trovati allo Stash, scala targetQuantity e stashBaseTarget, resetta foundQuantity a 0', () => {
    const store = useAppStore.getState();
    const totalReq = store.getTotalRequiredMaterials();
    const itemId = Object.keys(totalReq)[0];
    const reqQty = totalReq[itemId];

    store.addRaidItem(itemId, reqQty, { fromStash: true });
    const raidItemId = useAppStore.getState().raidPlan.items[0].id;

    useAppStore.getState().setRaidItemFoundQuantity(raidItemId, 2);
    useAppStore.getState().applyRaidPlanToStash();

    const state = useAppStore.getState();
    expect(state.inventory[itemId]).toBe(2);
    expect(state.raidPlan.items[0].foundQuantity).toBe(0);
    expect(state.raidPlan.items[0].targetQuantity).toBe(Math.max(1, reqQty - 2));
    expect(state.raidPlan.items[0].stashBaseTarget).toBe(Math.max(0, reqQty - 2));
  });

  it('6. applyRaidPlanToStash non tocca né scala un item non richiesto dallo Stash', () => {
    const store = useAppStore.getState();
    store.addRaidItem('elephant-obelisk', 10);
    const id = useAppStore.getState().raidPlan.items[0].id;
    useAppStore.getState().setRaidItemFoundQuantity(id, 3);

    useAppStore.getState().applyRaidPlanToStash();
    const item = useAppStore.getState().raidPlan.items[0];
    expect(item.targetQuantity).toBe(10);
    expect(item.foundQuantity).toBe(3);
  });

  it('7. ignoreStashDiff salva lo snapshot ignorato e syncRaidWithStash lo pulisce', () => {
    const store = useAppStore.getState();
    store.ignoreStashDiff({ fabric: 10 });
    expect(useAppStore.getState().raidPlan.ignoredStashSnapshot).toEqual({ fabric: 10 });

    store.syncRaidWithStash();
    expect(useAppStore.getState().raidPlan.ignoredStashSnapshot).toBeUndefined();
  });
});
