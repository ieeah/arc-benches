#!/usr/bin/env node
/**
 * Orchestratore unificato per l'aggiornamento e la sincronizzazione di tutto il dataset di gioco.
 * Esegue in sequenza ordinata tutti i moduli di estrazione dati:
 *   1. fetch-items.mjs            -> Catalogo base MetaForge + icone locali
 *   2. fetch-translations.mjs     -> Traduzioni IT (RaidTheory + fallback ARC Tracker)
 *   3. fetch-skills.mjs           -> 45 nodi Skill Tree + icone
 *   4. fetch-quests.mjs           -> 123 Quest di gioco e grafo dipendenze
 *   5. fetch-recipes.mjs          -> Ricette Crafting, Upgrade I->IV, Riparazione e Riciclo
 *   6. fetch-category-icons.mjs   -> Icone di categoria da MediaWiki API
 *
 * Uso:
 *   node scripts/fetch-all.mjs           # esegue usando la cache locale esistente
 *   node scripts/fetch-all.mjs --refresh # forza il download fresco da tutte le API upstream
 */
import { fork } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REFRESH = process.argv.includes('--refresh');

const PIPELINE = [
  { script: 'fetch-items.mjs', label: '1. Catalogo Oggetti & Icone (MetaForge)', supportsRefresh: true },
  { script: 'fetch-translations.mjs', label: '2. Traduzioni Italiane (RaidTheory + ARC Tracker)', supportsRefresh: true },
  { script: 'fetch-skills.mjs', label: '3. Skill Tree dei Raiders (RaidTheory + Wiki)', supportsRefresh: false },
  { script: 'fetch-quests.mjs', label: '4. Grafo 123 Quest (MetaForge + ARC Tracker)', supportsRefresh: true },
  { script: 'fetch-recipes.mjs', label: '5. Ricette, Potenziamenti & Riparazioni (ARC Tracker)', supportsRefresh: true },
  { script: 'fetch-category-icons.mjs', label: '6. Icone Categoria (MediaWiki API)', supportsRefresh: false },
  { script: 'fetch-arc-maps.mjs', label: '7. Mappe & POI (arcraidersmaps.app)', supportsRefresh: true },
];

function runScript(scriptInfo) {
  return new Promise((resolve, reject) => {
    const scriptPath = join(__dirname, scriptInfo.script);
    const args = (REFRESH && scriptInfo.supportsRefresh) ? ['--refresh'] : [];

    console.log(`\n======================================================`);
    console.log(`▶ Avvio: ${scriptInfo.label}`);
    console.log(`  Comando: node scripts/${scriptInfo.script} ${args.join(' ')}`);
    console.log(`======================================================\n`);

    const startTime = Date.now();
    const child = fork(scriptPath, args, { stdio: 'inherit' });

    child.on('close', code => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (code === 0) {
        console.log(`\n✔ Completato: ${scriptInfo.label} (${elapsed}s)`);
        resolve();
      } else {
        reject(new Error(`Lo script ${scriptInfo.script} è terminato con codice di errore ${code}`));
      }
    });

    child.on('error', err => {
      reject(err);
    });
  });
}

async function main() {
  const overallStart = Date.now();
  console.log(`\n############################################################`);
  console.log(`# Scrappy's Nest — Pipeline Aggiornamento Dati              #`);
  console.log(`############################################################`);
  console.log(`Modalità: ${REFRESH ? 'NETWORK REFRESH (--refresh)' : 'CACHE LOCALE'}\n`);

  for (const step of PIPELINE) {
    await runScript(step);
  }

  const totalElapsed = ((Date.now() - overallStart) / 1000).toFixed(1);
  console.log(`\n############################################################`);
  console.log(`# ✔ PIPELINE COMPLETATA CON SUCCESSO IN ${totalElapsed}s              #`);
  console.log(`# Tutti i file in src/data/ sono aggiornati e sincronizzati.#`);
  console.log(`############################################################\n`);
}

main().catch(err => {
  console.error('\n❌ ERRORE NELLA PIPELINE DI FETCH:', err.message);
  process.exit(1);
});
