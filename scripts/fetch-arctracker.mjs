/**
 * Scarica (con cache) i dati pubblici di ARC Tracker e genera il RAPPORTO degli oggetti che
 * il nostro catalogo non ha, con tutti i dati, così non servono altri fetch dopo il primo.
 *
 * Usage:
 *   cd scripts && node fetch-arctracker.mjs [--refresh] [--report]
 *
 * Output (entrambi NON versionati e mai distribuiti: fuori da src/ e public/):
 *   scripts/arctracker-raw.json                       cache delle risposte originali
 *   scripts/reports/arctracker-missing-items.json     rapporto (con --report, anche di default)
 *
 * Il rapporto non modifica nulla: si decide di volta in volta cosa tenere (merge nei dati,
 * override, oggetto custom con il Custom Items Studio, o niente).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildMissingItemsReport } from './lib/arctracker-report.mjs';
import { extractList, loadArcTracker, normalizeItem } from './lib/arctracker.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CACHE = join(__dirname, 'arctracker-raw.json');
const REPORTS_DIR = join(__dirname, 'reports');
const ITEMS_JSON = join(ROOT, 'src', 'data', 'items.json');

const refresh = process.argv.includes('--refresh');

async function main() {
  const data = await loadArcTracker({ cachePath: CACHE, refresh });
  const theirs = extractList('items', data.items).map(normalizeItem);
  const ours = JSON.parse(readFileSync(ITEMS_JSON, 'utf-8'));

  const report = buildMissingItemsReport({
    theirs,
    ours,
    source: { fetchedAt: data.fetchedAt, version: data.items.version, generatedAt: data.items.generatedAt },
  });

  mkdirSync(REPORTS_DIR, { recursive: true });
  const outPath = join(REPORTS_DIR, 'arctracker-missing-items.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');

  const s = report.summary;
  console.log(`\nARC Tracker: ${s.theirs} oggetti · nostri: ${s.ours} · in comune: ${s.common}`);
  console.log(`Solo ARC Tracker: ${s.onlyTheirs} · solo nostri: ${s.onlyOurs}`);
  console.log(`Differenze sui campi in comune: ${s.fieldDiffs} (${Object.entries(s.fieldDiffsByField).map(([f, n]) => `${f} ${n}`).join(', ') || 'nessuna'})`);
  console.log(`Nomi italiani assenti da noi e disponibili da loro: ${s.italianNameFillable}`);
  console.log(`Solo ARC Tracker per tipo:`, s.onlyTheirsByType);
  console.log(`\nRapporto: ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
