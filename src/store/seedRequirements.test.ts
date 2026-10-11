import { describe, it, expect } from 'vitest';
import { workbenches, projects, expeditions } from './gameData';

/** Controlli di integrità sui requisiti tra liste dei dati di gioco: non dipendono dai valori, solo dalla coerenza. */
describe('seed requirements between lists', () => {
  const lists = [...workbenches, ...projects, ...expeditions];
  const byId = new Map(lists.map((l) => [l.id, l]));

  it('every requirement points to an existing list and to a level that list can reach', () => {
    for (const list of lists) {
      for (const lvl of list.levels) {
        for (const req of lvl.requires ?? []) {
          const target = byId.get(req.listId);
          expect(target, `${list.id} Lvl ${lvl.level} → ${req.listId}`).toBeDefined();
          expect(req.listId).not.toBe(list.id);
          expect(req.level, `${list.id} Lvl ${lvl.level} → ${req.listId} Lvl ${req.level}`).toBeGreaterThanOrEqual(1);
          expect(req.level).toBeLessThanOrEqual(target?.maxLevel ?? 0);
        }
      }
    }
  });

  it('the requirements have no cycles between lists', () => {
    const edges = new Map<string, Set<string>>();
    for (const list of lists) {
      for (const lvl of list.levels) {
        for (const req of lvl.requires ?? []) edges.set(list.id, (edges.get(list.id) ?? new Set()).add(req.listId));
      }
    }
    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (id: string): boolean => {
      if (done.has(id)) return true;
      if (visiting.has(id)) return false;
      visiting.add(id);
      const ok = [...(edges.get(id) ?? [])].every(visit);
      visiting.delete(id);
      done.add(id);
      return ok;
    };
    for (const id of edges.keys()) expect(visit(id), `ciclo che passa da ${id}`).toBe(true);
  });
});
