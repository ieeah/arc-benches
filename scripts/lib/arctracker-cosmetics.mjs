/**
 * USO UNA TANTUM. Lettura dei cosmetici dalla pagina /cosmetics di ARC Tracker.
 *
 * Non esiste un'API per i cosmetici (la sezione pubblica `/api` non li contiene): i dati stanno nel
 * payload che la pagina web incorpora (formato interno di Next.js, che può cambiare a ogni rilascio).
 * Per questo NON è un meccanismo standard di aggiornamento: serve a un import iniziale, da rifare
 * a mano solo se necessario, finché non esisteranno fonti meglio strutturate. Due richieste in tutto
 * (italiano e inglese), con User-Agent dichiarato e cache locale non versionata.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { ARC_TRACKER_BASE, USER_AGENT, cleanText } from './arctracker.mjs';

const PUSH_PATTERN = /self\.__next_f\.push\(\[1,"(.*?)"\]\)<\/script>/gs;
const OBJECT_START = /\{"id":"[^"]+","kind":"[^"]+"/g;
const REQUIRED_KEYS = ['id', 'kind', 'name', 'sources', 'settings'];

/** Primo oggetto JSON che inizia a `start` (parentesi graffe bilanciate, stringhe escluse). */
function extractObject(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Cosmetici contenuti nell'HTML di una pagina /cosmetics. Fallisce con un errore descrittivo se il
 * payload non ha la forma attesa (formato cambiato), senza restituire dati parziali.
 */
export function parseCosmeticsPage(html) {
  const chunks = [...html.matchAll(PUSH_PATTERN)].map((m) => JSON.parse(`"${m[1]}"`));
  if (chunks.length === 0) throw new Error('ARC Tracker /cosmetics: payload non trovato (formato della pagina cambiato?)');
  const payload = chunks.join('');

  const byId = new Map();
  for (const match of payload.matchAll(OBJECT_START)) {
    const raw = extractObject(payload, match.index);
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw);
      if (!byId.has(obj.id)) byId.set(obj.id, obj);
    } catch { /* oggetto non cosmetico o troncato */ }
  }

  const list = [...byId.values()];
  const complete = list.filter((o) => REQUIRED_KEYS.every((k) => o[k] !== undefined));
  if (complete.length < 100 || complete.length < list.length * 0.9) {
    throw new Error(`ARC Tracker /cosmetics: solo ${complete.length}/${list.length} voci con la forma attesa (formato cambiato?)`);
  }
  return complete;
}

/** Elenco unico con nomi per lingua: `names: { it, en }` anche per i pezzi (settings) degli outfit. */
export function mergeLanguages(pages) {
  const en = new Map((pages.en ?? []).map((o) => [o.id, o]));
  return (pages.it ?? []).map((it) => {
    const other = en.get(it.id);
    const names = { it: cleanText(it.name), ...(other ? { en: cleanText(other.name) } : {}) };
    const enSettings = new Map((other?.settings ?? []).map((s) => [s.key, s]));
    const settings = (it.settings ?? []).map((setting) => {
      const enSetting = enSettings.get(setting.key);
      const enOptions = new Map((enSetting?.options ?? []).map((opt) => [opt.key, opt]));
      return {
        key: setting.key,
        names: { it: cleanText(setting.name), ...(enSetting ? { en: cleanText(enSetting.name) } : {}) },
        options: (setting.options ?? []).map((opt) => ({
          key: opt.key,
          base: opt.base === true,
          names: { it: cleanText(opt.name), ...(enOptions.get(opt.key) ? { en: cleanText(enOptions.get(opt.key).name) } : {}) },
          sources: opt.sources ?? [],
        })),
      };
    });
    return {
      id: it.id,
      kind: it.kind,
      names,
      addedIn: it.addedIn ?? null,
      release: it.release ?? null,
      sources: it.sources ?? [],
      settings,
    };
  });
}

/** Voci «raider-deck» di un cosmetico (o delle sue opzioni) per un pass, es. `frozen-trail-reward-pass`. */
export function passSources(cosmetic, deck) {
  const own = cosmetic.sources.filter((s) => s.type === 'raider-deck' && s.deck === deck);
  const fromOptions = cosmetic.settings.flatMap((setting) =>
    setting.options.flatMap((opt) =>
      opt.sources.filter((s) => s.type === 'raider-deck' && s.deck === deck).map((s) => ({ ...s, setting: setting.key, option: opt.key })),
    ),
  );
  return [...own, ...fromOptions];
}

async function fetchPage(language, fetchImpl) {
  const url = `${ARC_TRACKER_BASE}/${language}/cosmetics`;
  const res = await fetchImpl(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' } });
  if (!res.ok) throw new Error(`ARC Tracker ${url}: HTTP ${res.status}`);
  return parseCosmeticsPage(await res.text());
}

/** Pagine italiana e inglese (con cache locale a meno di `refresh`). Non scrive nulla se una delle due fallisce. */
export async function loadCosmeticsPages({ cachePath, refresh = false, fetchImpl = fetch, log = console.log }) {
  if (!refresh && existsSync(cachePath)) {
    const cached = JSON.parse(readFileSync(cachePath, 'utf-8'));
    log(`Uso la cache locale ${cachePath} (scaricata il ${cached.fetchedAt}).`);
    return cached;
  }
  const pages = {};
  for (const language of ['it', 'en']) {
    log(`Scarico ARC Tracker /${language}/cosmetics…`);
    pages[language] = await fetchPage(language, fetchImpl);
  }
  const data = { fetchedAt: new Date().toISOString(), pages };
  writeFileSync(cachePath, JSON.stringify(data), 'utf-8');
  return data;
}
