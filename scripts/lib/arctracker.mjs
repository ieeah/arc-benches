/**
 * Accesso ai dati pubblici di ARC Tracker (https://arctracker.io/developers/docs): oggetti, quest,
 * rifugio e progetti, senza autenticazione e con tutte le lingue. Modulo condiviso dagli script dati
 * (rapporto degli oggetti mancanti, traduzioni, quest, confronto del rifugio).
 *
 * Una sola richiesta per endpoint, con User-Agent dichiarato, e cache locale non versionata
 * (`scripts/arctracker-raw.json`): `refresh` riscarica. Lo schema non è dichiarato stabile, quindi
 * la forma delle risposte è verificata e un cambiamento fa fallire lo script senza scrivere nulla.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';

export const ARC_TRACKER_BASE = 'https://arctracker.io';
export const USER_AGENT = 'ARCBenchesCompanion/1.0 (+https://github.com/ieeah/arc-benches)';

/** Endpoint pubblici usati e chiave della risposta che contiene l'elenco. */
export const ENDPOINTS = {
  items: { path: '/api/items', listKey: 'items' },
  quests: { path: '/api/quests', listKey: 'quests' },
  hideout: { path: '/api/hideout', listKey: 'hideoutModules' },
  projects: { path: '/api/projects', listKey: 'projects' },
};

/** Id ARC Tracker (snake_case) → id del progetto (hyphen-case). */
export const normalizeId = (id) => String(id).trim().toLowerCase().replace(/_/g, '-');

/**
 * Pulisce un testo: il carattere di sostituzione U+FFFD (apostrofi rovinati, es. «Mountaineer�s»)
 * diventa un apostrofo; spazi normalizzati, nessuno spazio ai bordi.
 */
export function cleanText(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/�/g, "'").normalize('NFC').replace(/[ \t]+/g, ' ').trim();
}

/** Oggetto multilingua `{ it: 'x', 'ko-KR': 'y' }` ripulito; i codici lingua restano quelli di ARC Tracker (gli stessi di RaidTheory). */
export function normalizeLocalized(map) {
  const out = {};
  if (!map || typeof map !== 'object') return out;
  for (const [lang, text] of Object.entries(map)) {
    const cleaned = cleanText(text);
    if (typeof cleaned === 'string' && cleaned) out[lang] = cleaned;
  }
  return out;
}

/** Elenco contenuto in una risposta; le quest arrivano come oggetto indicizzato per id. */
export function extractList(endpoint, json) {
  const { listKey } = ENDPOINTS[endpoint];
  const raw = json?.[listKey];
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return Object.values(raw);
  throw new Error(`ARC Tracker /${endpoint}: manca "${listKey}" nella risposta (schema cambiato?)`);
}

const REQUIRED_FIELDS = {
  items: ['id', 'name', 'type'],
  quests: ['id', 'name'],
  hideout: ['id', 'name', 'levels'],
  projects: ['id', 'name'],
};

/** Controlla la forma di una risposta; lancia un errore descrittivo se non è quella attesa. */
export function validateResponse(endpoint, json) {
  const list = extractList(endpoint, json);
  if (list.length === 0) throw new Error(`ARC Tracker /${endpoint}: elenco vuoto`);
  for (const field of REQUIRED_FIELDS[endpoint]) {
    const missing = list.filter((entry) => entry?.[field] === undefined).length;
    // Qualche voce incompleta si tollera; se manca nella maggioranza lo schema è cambiato.
    if (missing > list.length / 2) {
      throw new Error(`ARC Tracker /${endpoint}: il campo "${field}" manca in ${missing}/${list.length} voci (schema cambiato?)`);
    }
  }
  return list;
}

/** Oggetto ARC Tracker con id e testi normalizzati, tutti i dati originali conservati. */
export function normalizeItem(raw) {
  return {
    id: normalizeId(raw.id),
    rawId: raw.id,
    names: normalizeLocalized(raw.name),
    descriptions: normalizeLocalized(raw.description),
    type: raw.type ?? null,
    rarity: raw.rarity ?? null,
    value: raw.value ?? null,
    weightKg: raw.weightKg ?? null,
    stackSize: raw.stackSize ?? null,
    recyclesInto: raw.recyclesInto ?? null,
    salvagesInto: raw.salvagesInto ?? null,
    repairCost: raw.repairCost ?? null,
    repairDurability: raw.repairDurability ?? null,
    mechanics: raw.mechanics ?? null,
    addedIn: raw.addedIn ?? null,
    updatedAt: raw.updatedAt ?? null,
    imageUrl: raw.imageFilename ?? null,
  };
}

async function fetchEndpoint(endpoint, fetchImpl) {
  const url = `${ARC_TRACKER_BASE}${ENDPOINTS[endpoint].path}`;
  const res = await fetchImpl(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`ARC Tracker ${url}: HTTP ${res.status}`);
  const json = await res.json();
  validateResponse(endpoint, json);
  return json;
}

/**
 * Dati di ARC Tracker, dalla cache locale se esiste (a meno di `refresh`), altrimenti scaricati.
 * Restituisce le risposte originali e `fetchedAt`; non scrive nulla finché tutti gli endpoint non sono validi.
 */
export async function loadArcTracker({ cachePath, refresh = false, fetchImpl = fetch, log = console.log }) {
  if (!refresh && existsSync(cachePath)) {
    const cached = JSON.parse(readFileSync(cachePath, 'utf-8'));
    log(`Uso la cache locale ${cachePath} (scaricata il ${cached.fetchedAt}); --refresh per riscaricare.`);
    return cached;
  }
  const data = { fetchedAt: new Date().toISOString() };
  for (const endpoint of Object.keys(ENDPOINTS)) {
    log(`Scarico ARC Tracker /${endpoint}…`);
    data[endpoint] = await fetchEndpoint(endpoint, fetchImpl);
  }
  writeFileSync(cachePath, JSON.stringify(data), 'utf-8');
  log(`Cache salvata in ${cachePath}`);
  return data;
}
