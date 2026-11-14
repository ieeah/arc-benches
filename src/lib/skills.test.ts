import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import skillsData from '@/data/skills.json';
import type { SkillNode } from '@/types';

describe('skills dataset (#89)', () => {
  const nodes = skillsData as SkillNode[];

  it('contains exactly 45 skill nodes across 3 branches', () => {
    expect(nodes).toHaveLength(45);

    const categories = {
      CONDITIONING: nodes.filter(n => n.category === 'CONDITIONING'),
      MOBILITY: nodes.filter(n => n.category === 'MOBILITY'),
      SURVIVAL: nodes.filter(n => n.category === 'SURVIVAL'),
    };

    expect(categories.CONDITIONING).toHaveLength(15);
    expect(categories.MOBILITY).toHaveLength(15);
    expect(categories.SURVIVAL).toHaveLength(15);
  });

  it('has valid localization in both IT and EN for all nodes', () => {
    for (const node of nodes) {
      expect(node.id).toBeTruthy();
      expect(node.name.en).toBeTruthy();
      expect(node.name.it).toBeTruthy();
      expect(node.description.en).toBeTruthy();
      expect(node.description.it).toBeTruthy();
      expect(node.maxPoints).toBeGreaterThanOrEqual(1);
      expect(node.position).toHaveProperty('x');
      expect(node.position).toHaveProperty('y');
    }
  });

  it('contains valid prerequisite node references', () => {
    const nodeIds = new Set(nodes.map(n => n.id));
    for (const node of nodes) {
      for (const prereq of node.prerequisiteNodeIds) {
        expect(nodeIds.has(prereq)).toBe(true);
      }
    }
  });

  it('verifies that all referenced icons exist in public/icons/skills', () => {
    for (const node of nodes) {
      const iconPath = join(process.cwd(), 'public', node.icon);
      expect(existsSync(iconPath)).toBe(true);
    }
  });
});
