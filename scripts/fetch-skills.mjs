/**
 * Sincronizza i 48 nodi dello Skill Tree di ARC Raiders (versione live Frozen Trail)
 * con localizzazioni complete IT/EN, topologia e icone CDN.
 *
 * Usage:
 *   cd scripts && node fetch-skills.mjs [--skip-images]
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'data');
const SKILLS_JSON = join(DATA_DIR, 'skills.json');
const ICONS_DIR = join(ROOT, 'public', 'icons', 'skills');

async function main() {
  console.log('Fetching live Skill Tree from arctracker.io...');
  const res = await fetch('https://arctracker.io/skill-tree', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching skill-tree page`);
  const html = await res.text();

  const scriptMatches = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)].map(
    (m) => m[1]
  );
  console.log(`Searching across ${scriptMatches.length} chunks...`);

  let rawSkills = null;
  for (const s of scriptMatches) {
    const cRes = await fetch(`https://arctracker.io${s}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const cText = await cRes.text();
    if (cText.includes('surv_road_warrior')) {
      const parseCall = 'JSON.parse(';
      const startIdx = cText.indexOf(parseCall);
      if (startIdx !== -1) {
        const quoteStart = startIdx + parseCall.length;
        const endIdx = cText.indexOf("')", quoteStart);
        const rawJsString = cText.slice(quoteStart, endIdx + 1);
        const unescaped = eval(rawJsString);
        rawSkills = JSON.parse(unescaped);
        console.log(`Found live skills dictionary with ${Object.keys(rawSkills).length} skills!`);
        break;
      }
    }
  }

  if (!rawSkills) throw new Error('Could not find live skills dictionary in chunks');

  const normalized = Object.values(rawSkills).map((s) => ({
    id: s.id,
    name: {
      en: s.name.en || '',
      it: s.name.it || s.name.en || '',
    },
    category: s.category,
    isMajor: s.isMajor ?? false,
    description: {
      en: s.description.en || '',
      it: s.description.it || s.description.en || '',
    },
    maxPoints: s.maxPoints || 1,
    impactedSkill: s.impactedSkill
      ? {
          en: s.impactedSkill.en || '',
          it: s.impactedSkill.it || s.impactedSkill.en || '',
        }
      : undefined,
    knownValue: s.knownValue || [],
    position: s.position,
    prerequisiteNodeIds: s.prerequisiteNodeIds || [],
    iconName: s.iconName,
    icon: `icons/skills/${s.iconName}`,
    minPointsSpent: s.minPointsSpent ?? 0,
  }));

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(SKILLS_JSON, JSON.stringify(normalized, null, 2));
  console.log(`Saved ${normalized.length} skills to ${SKILLS_JSON}`);

  // Download icons if not skipping
  const skipImages = process.argv.includes('--skip-images');
  if (!skipImages) {
    mkdirSync(ICONS_DIR, { recursive: true });
    let downloaded = 0;
    for (const s of normalized) {
      if (!s.iconName) continue;
      const dest = join(ICONS_DIR, s.iconName);
      if (!existsSync(dest)) {
        try {
          const iRes = await fetch(`https://cdn.arctracker.io/skillnodes/${s.iconName}`);
          if (iRes.ok) {
            const buf = Buffer.from(await iRes.arrayBuffer());
            writeFileSync(dest, buf);
            downloaded++;
          }
        } catch (e) {
          console.warn(`Could not download ${s.iconName}:`, e.message);
        }
      }
    }
    console.log(`Downloaded ${downloaded} new icons to ${ICONS_DIR}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
