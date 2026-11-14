/**
 * Fetch official Skill Tree data and icons for ARC Raiders.
 *
 * Source:
 *   - Nodes data: RaidTheory/arcraiders-data (datamined skillNodes.json with full IT/EN translations, topology, coordinates)
 *   - Skill icons: arcraiders.wiki via MediaWiki API (with fallback to IllicLanthresh/ARC-skilltree static repo)
 *
 * Usage:
 *   cd scripts && node fetch-skills.mjs [--skip-images]
 *
 * Output:
 *   - src/data/skills.json
 *   - public/icons/skills/*.png
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'data');
const SKILLS_JSON = join(DATA_DIR, 'skills.json');
const ICONS_DIR = join(ROOT, 'public', 'icons', 'skills');

const SKILL_NODES_URL = 'https://raw.githubusercontent.com/RaidTheory/arcraiders-data/main/skillNodes.json';
const FALLBACK_ICON_BASE = 'https://raw.githubusercontent.com/IllicLanthresh/ARC-skilltree/master/static/icons/';
const WIKI_API = 'https://arcraiders.wiki/w/api.php';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'ARCBenches/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'ARCBenches/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function resolveWikiIconUrls(skillNodes) {
  const titles = skillNodes.map(n => `File:Icon ${n.name.en}.png`);
  // MediaWiki API supports batching up to 50 titles
  const titlesParam = titles.map(encodeURIComponent).join('|');
  const apiUrl = `${WIKI_API}?action=query&titles=${titlesParam}&prop=imageinfo&iiprop=url&format=json`;

  try {
    const data = await fetchJson(apiUrl);
    const pages = data.query?.pages ?? {};
    const urlMap = new Map();
    for (const page of Object.values(pages)) {
      if (page.imageinfo && page.imageinfo.length > 0) {
        const title = page.title.replace('File:', '').trim();
        urlMap.set(title, page.imageinfo[0].url);
      }
    }
    return urlMap;
  } catch (err) {
    console.warn(`[fetch-skills] Wiki API failed: ${err.message}. Will use GitHub fallback.`);
    return new Map();
  }
}

async function main() {
  const skipImages = process.argv.includes('--skip-images');

  console.log('[fetch-skills] Fetching skillNodes.json from RaidTheory/arcraiders-data...');
  const rawNodes = await fetchJson(SKILL_NODES_URL);
  console.log(`[fetch-skills] Retrieved ${rawNodes.length} skill nodes.`);

  // 1. Normalize and structure skill nodes
  const formattedNodes = rawNodes.map(node => {
    return {
      id: node.id,
      name: {
        en: node.name?.en || '',
        it: node.name?.it || node.name?.en || '',
      },
      category: node.category, // "CONDITIONING" | "MOBILITY" | "SURVIVAL"
      isMajor: Boolean(node.isMajor),
      description: {
        en: node.description?.en || '',
        it: node.description?.it || node.description?.en || '',
      },
      maxPoints: node.maxPoints ?? 1,
      impactedSkill: node.impactedSkill
        ? {
            en: node.impactedSkill?.en || '',
            it: node.impactedSkill?.it || node.impactedSkill?.en || '',
          }
        : undefined,
      knownValue: node.knownValue || [],
      position: node.position || { x: 0, y: 0 },
      prerequisiteNodeIds: node.prerequisiteNodeIds || [],
      iconName: node.iconName || `${node.id}.png`,
      icon: `icons/skills/${node.iconName || `${node.id}.png`}`,
    };
  });

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(SKILLS_JSON, JSON.stringify(formattedNodes, null, 2), 'utf8');
  console.log(`[fetch-skills] Wrote ${formattedNodes.length} nodes to ${SKILLS_JSON}`);

  // 2. Download skill icons
  if (!skipImages) {
    mkdirSync(ICONS_DIR, { recursive: true });
    console.log('[fetch-skills] Resolving icon URLs...');
    const wikiUrlMap = await resolveWikiIconUrls(rawNodes);

    let downloaded = 0;
    let failed = 0;

    for (const node of formattedNodes) {
      const destPath = join(ICONS_DIR, node.iconName);
      if (existsSync(destPath)) {
        downloaded++;
        continue;
      }

      const wikiKey = `Icon ${node.name.en}.png`;
      const wikiUrl = wikiUrlMap.get(wikiKey);
      const fallbackUrl = `${FALLBACK_ICON_BASE}${node.iconName}`;

      let buffer = null;
      if (wikiUrl) {
        try {
          buffer = await fetchBuffer(wikiUrl);
        } catch {
          // Fall through to fallback
        }
      }

      if (!buffer) {
        try {
          buffer = await fetchBuffer(fallbackUrl);
        } catch (err) {
          console.warn(`[fetch-skills] Failed downloading icon for ${node.id} (${node.name.en}): ${err.message}`);
          failed++;
          continue;
        }
      }

      writeFileSync(destPath, buffer);
      downloaded++;
      process.stdout.write(`[fetch-skills] Icons: ${downloaded}/${formattedNodes.length}\r`);
    }

    console.log(`\n[fetch-skills] Icons completed: ${downloaded} downloaded/cached, ${failed} failed.`);
  }
}

main().catch(err => {
  console.error('[fetch-skills] Error:', err);
  process.exit(1);
});
