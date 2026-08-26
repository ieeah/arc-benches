#!/usr/bin/env node

/**
 * ARC Benches — Map Tile Downloader
 * 
 * Scarica i tile puliti (senza UI / marker) per tutte le mappe di ARC Raiders
 * organizzandoli nella struttura standard Leaflet per l'hosting locale o Supabase Storage.
 * 
 * Uso:
 *   node scripts/fetch-map-tiles.mjs [--max-zoom 12] [--map buried-city]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_DIR = path.join(__dirname, 'data', 'maps');

const MAP_CONFIGS = [
  {
    id: 'buried-city',
    title: 'Buried City',
    pathPrefix: 'arc-raiders/buried-city/default-v4',
    minZoom: 8,
    maxZoom: 12, // 4K level detail (95-180 tiles)
  },
  {
    id: 'dam-battlegrounds',
    title: 'Dam Battlegrounds',
    pathPrefix: 'arc-raiders/dam-battlegrounds/default-v2',
    minZoom: 8,
    maxZoom: 12,
  },
  {
    id: 'spaceport',
    title: 'Spaceport (Acerra)',
    pathPrefix: 'arc-raiders/spaceport/default-v2',
    minZoom: 8,
    maxZoom: 12,
  },
  {
    id: 'the-blue-gate',
    title: 'The Blue Gate',
    pathPrefix: 'arc-raiders/the-blue-gate/default-v5',
    minZoom: 8,
    maxZoom: 12,
  },
  {
    id: 'stella-montis',
    title: 'Stella Montis',
    pathPrefix: 'arc-raiders/stella-montis/default-v1',
    minZoom: 8,
    maxZoom: 12,
  },
  {
    id: 'riven-tides',
    title: 'Riven Tides',
    pathPrefix: 'arc-raiders/riven-tides/default-v1',
    minZoom: 8,
    maxZoom: 12,
  },
];

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Referer': 'https://mapgenie.io/',
        },
      });
      if (res.status === 200) {
        const buffer = Buffer.from(await res.arrayBuffer());
        return buffer;
      }
      if (res.status === 404) {
        return null;
      }
    } catch (err) {
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
  return null;
}

async function findRootTiles(pathPrefix) {
  const rootTiles = [];
  for (let x = 124; x <= 132; x++) {
    for (let y = 124; y <= 132; y++) {
      const url = `https://tiles.mapgenie.io/games/${pathPrefix}/8/${y}/${x}.jpg`;
      const buf = await fetchWithRetry(url);
      if (buf) {
        rootTiles.push({ x, y, buf });
      }
    }
  }
  return rootTiles;
}

async function processMap(config, targetMaxZoom, outputDir = DEFAULT_OUTPUT_DIR) {
  console.log(`\n========================================`);
  console.log(`📍 Processo Mappa: ${config.title} (${config.id})`);
  console.log(`========================================`);

  const mapDir = path.join(outputDir, config.id);
  await fs.mkdir(mapDir, { recursive: true });

  const effectiveMaxZoom = Math.min(targetMaxZoom, config.maxZoom);
  let totalTiles = 0;
  let totalBytes = 0;
  const zoomStats = {};

  // 1. Zoom 8 Root discovery
  console.log(`🔍 Ricerca coordinate base (Zoom ${config.minZoom})...`);
  const rootTiles = await findRootTiles(config.pathPrefix);
  if (rootTiles.length === 0) {
    console.error(`❌ Nessun tile trovato per ${config.id} a zoom 8!`);
    return null;
  }

  let activeCoords = [];
  const zoom8Dir = path.join(mapDir, '8');
  await fs.mkdir(zoom8Dir, { recursive: true });

  for (const { x, y, buf } of rootTiles) {
    const yDir = path.join(zoom8Dir, String(y));
    await fs.mkdir(yDir, { recursive: true });
    await fs.writeFile(path.join(yDir, `${x}.jpg`), buf);
    activeCoords.push({ x, y });
    totalTiles++;
    totalBytes += buf.length;
  }

  zoomStats[8] = { tiles: rootTiles.length, bytes: rootTiles.reduce((acc, t) => acc + t.buf.length, 0) };
  console.log(`  -> Zoom 8: ${rootTiles.length} tile salvati (${(zoomStats[8].bytes / 1024).toFixed(1)} KB)`);

  // 2. Quadtree traversal for zoom levels
  for (let z = config.minZoom + 1; z <= effectiveMaxZoom; z++) {
    const candidates = new Set();
    for (const p of activeCoords) {
      for (let dx = -1; dx <= 2; dx++) {
        for (let dy = -1; dy <= 2; dy++) {
          candidates.add(`${2 * p.x + dx},${2 * p.y + dy}`);
        }
      }
    }

    const nextActive = [];
    let zoomBytes = 0;
    const zoomDir = path.join(mapDir, String(z));
    await fs.mkdir(zoomDir, { recursive: true });

    const candidateArray = Array.from(candidates);
    const BATCH_SIZE = 12;

    for (let i = 0; i < candidateArray.length; i += BATCH_SIZE) {
      const batch = candidateArray.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (key) => {
          const [x, y] = key.split(',').map(Number);
          const url = `https://tiles.mapgenie.io/games/${config.pathPrefix}/${z}/${y}/${x}.jpg`;
          const buf = await fetchWithRetry(url);
          if (buf) {
            const yDir = path.join(zoomDir, String(y));
            await fs.mkdir(yDir, { recursive: true });
            await fs.writeFile(path.join(yDir, `${x}.jpg`), buf);
            nextActive.push({ x, y });
            zoomBytes += buf.length;
            totalTiles++;
            totalBytes += buf.length;
          }
        })
      );
    }

    activeCoords = nextActive;
    zoomStats[z] = { tiles: nextActive.length, bytes: zoomBytes };
    console.log(`  -> Zoom ${z}: ${nextActive.length} tile salvati (${(zoomBytes / (1024 * 1024)).toFixed(2)} MB)`);
  }

  console.log(`✅ ${config.title} completata: ${totalTiles} tile totali (${(totalBytes / (1024 * 1024)).toFixed(2)} MB)`);

  return {
    id: config.id,
    title: config.title,
    minZoom: config.minZoom,
    maxZoom: effectiveMaxZoom,
    totalTiles,
    totalBytes,
    zoomStats,
  };
}

async function main() {
  const args = process.argv.slice(2);
  let targetMaxZoom = 12; // default 4K
  let specificMap = null;
  let outputDir = DEFAULT_OUTPUT_DIR;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--max-zoom' && args[i + 1]) {
      targetMaxZoom = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--map' && args[i + 1]) {
      specificMap = args[i + 1];
      i++;
    } else if (args[i] === '--out' && args[i + 1]) {
      outputDir = path.resolve(process.cwd(), args[i + 1]);
      i++;
    }
  }

  console.log(`🚀 ARC Benches — Map Tile Downloader`);
  console.log(`Cartella di output: ${outputDir}`);
  console.log(`Livello max zoom: ${targetMaxZoom}`);

  await fs.mkdir(outputDir, { recursive: true });

  const targets = specificMap
    ? MAP_CONFIGS.filter((m) => m.id === specificMap || m.id.includes(specificMap))
    : MAP_CONFIGS;

  if (targets.length === 0) {
    console.error(`Mappa '${specificMap}' non trovata. Opzioni: ${MAP_CONFIGS.map((m) => m.id).join(', ')}`);
    process.exit(1);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    maps: {},
  };

  let globalTiles = 0;
  let globalBytes = 0;

  for (const config of targets) {
    const result = await processMap(config, targetMaxZoom, outputDir);
    if (result) {
      manifest.maps[result.id] = result;
      globalTiles += result.totalTiles;
      globalBytes += result.totalBytes;
    }
  }

  const manifestPath = path.join(outputDir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\n🎉 COMPLETATO!`);
  console.log(`Totale tile scaricati: ${globalTiles}`);
  console.log(`Peso totale su disco: ${(globalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Manifest salvato in: ${manifestPath}`);
}

main().catch((err) => {
  console.error('Errore critico durante il download:', err);
  process.exit(1);
});
