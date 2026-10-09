/**
 * Plugin Vite solo per lo sviluppo: espone `POST <base>__dev/apply`, con cui le pagine Dev scrivono
 * direttamente nei file del repository invece di farli scaricare e sovrascrivere a mano.
 *
 * Sicurezza: esiste solo nel dev server (`apply: 'serve'`), risponde solo a richieste da localhost
 * con stessa origine, scrive solo i percorsi di un elenco fisso e rifiuta di sovrascrivere un file
 * cambiato su disco rispetto a quello che l'app aveva caricato (a meno di `force`).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { addTrashEntry, clearTrash, readTrash, removeTrashEntry } from './dev-trash';

/** Gli unici file scrivibili (percorsi relativi alla radice, in formato POSIX). */
export const APPLY_ALLOWED_FILES = [
  'src/data/workbenches.json',
  'src/data/expeditions.json',
  'src/data/projects.json',
  'src/data/quests.json',
  'src/data/passes.json',
  'src/data/items-overrides.json',
  'src/data/nav.json',
  'src/data/feature-flags.json',
  'scripts/data/custom-items/items.json',
  'src/i18n/locales/it.ts',
  'src/i18n/locales/en.ts',
] as const;

/** Icone sorgente degli oggetti custom: file binari accanto a items.json, in base64. */
const ICON_FILE_PATTERN = /^scripts\/data\/custom-items\/[a-z0-9]+(-[a-z0-9]+)*\.(png|svg|webp)$/;

const MAX_BODY_BYTES = 10 * 1024 * 1024;

export interface ApplyFile {
  path: string;
  content: string;
  /**
   * Come il file era quando l'app l'ha caricato: per i `.json` la forma canonica
   * (`JSON.stringify` del contenuto letto), per i `.ts` il testo. Senza, nessun controllo.
   */
  baseline?: string;
  /** `base64`: `content` è un file binario (solo icone custom), senza controllo di conflitto. */
  encoding?: 'base64';
}

export type ApplyResult =
  | { status: 'ok'; written: string[] }
  | { status: 'conflict'; conflicts: string[] }
  | { status: 'error'; message: string };

const normalizeEol = (s: string) => s.replace(/\r\n/g, '\n');

function isCurrentOnDisk(diskText: string, filePath: string, baseline: string): boolean {
  if (filePath.endsWith('.json')) {
    try {
      return JSON.stringify(JSON.parse(diskText)) === baseline;
    } catch {
      return false;
    }
  }
  return normalizeEol(diskText) === normalizeEol(baseline);
}

/** Scrive i file richiesti sotto `root`, dopo aver validato percorsi e conflitti. */
export function applyFiles(root: string, files: ApplyFile[], force = false): ApplyResult {
  if (!Array.isArray(files) || files.length === 0) return { status: 'error', message: 'Nessun file da applicare.' };

  const targets: { rel: string; abs: string; content: string; binary: boolean }[] = [];
  const conflicts: string[] = [];

  for (const file of files) {
    const rel = typeof file?.path === 'string' ? path.posix.normalize(file.path) : '';
    const binary = file?.encoding === 'base64';
    const allowed = binary ? ICON_FILE_PATTERN.test(rel) : (APPLY_ALLOWED_FILES as readonly string[]).includes(rel);
    if (!allowed) {
      return { status: 'error', message: `Percorso non consentito: ${String(file?.path)}` };
    }
    if (typeof file.content !== 'string') return { status: 'error', message: `Contenuto non valido per ${rel}` };
    const abs = path.resolve(root, rel);
    if (!abs.startsWith(path.resolve(root) + path.sep)) {
      return { status: 'error', message: `Percorso fuori dal progetto: ${rel}` };
    }

    if (!binary && !force && typeof file.baseline === 'string' && fs.existsSync(abs)) {
      if (!isCurrentOnDisk(fs.readFileSync(abs, 'utf-8'), rel, file.baseline)) conflicts.push(rel);
    }
    targets.push({ rel, abs, content: file.content, binary });
  }

  if (conflicts.length > 0) return { status: 'conflict', conflicts };

  // Scrittura atomica per file: temporaneo nella stessa cartella, poi rename.
  for (const { abs, content, binary } of targets) {
    const tmp = `${abs}.tmp-${process.pid}`;
    if (binary) fs.writeFileSync(tmp, Buffer.from(content, 'base64'));
    else fs.writeFileSync(tmp, content, 'utf-8');
    fs.renameSync(tmp, abs);
  }
  return { status: 'ok', written: targets.map(t => t.rel) };
}

const LOCAL_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

function isSameOriginLocal(req: IncomingMessage): boolean {
  if (!LOCAL_ADDRESSES.has(req.socket.remoteAddress ?? '')) return false;
  const origin = req.headers.origin;
  if (!origin) return true; // richieste non-browser da localhost (es. curl)
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Richiesta troppo grande'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

export function devApplyPlugin(): Plugin {
  let root = process.cwd();
  return {
    name: 'arc-benches-dev-apply',
    apply: 'serve',
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      // Cestino Dev: GET = elenco, POST { action: 'add', entry } | { action: 'remove', id } | { action: 'clear' }
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0];
        if (!pathname.endsWith('/__dev/trash')) return next();
        if (!isSameOriginLocal(req)) return send(res, 403, { status: 'error', message: 'Richiesta non consentita.' });

        if (req.method === 'GET') return send(res, 200, { status: 'ok', entries: readTrash(root) });
        if (req.method !== 'POST') return send(res, 405, { status: 'error', message: 'Metodo non consentito.' });

        try {
          const body = JSON.parse(await readBody(req)) as { action?: string; entry?: unknown; id?: unknown };
          const result =
            body.action === 'add' ? addTrashEntry(root, body.entry)
            : body.action === 'remove' ? removeTrashEntry(root, body.id)
            : body.action === 'clear' ? clearTrash(root)
            : ({ ok: false, message: 'Azione non valida.' } as const);
          if (result.ok) send(res, 200, { status: 'ok', entries: result.entries });
          else send(res, 400, { status: 'error', message: result.message });
        } catch (err) {
          send(res, 400, { status: 'error', message: err instanceof Error ? err.message : 'Richiesta non valida.' });
        }
      });

      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0];
        if (!pathname.endsWith('/__dev/apply')) return next();

        if (!isSameOriginLocal(req)) return send(res, 403, { status: 'error', message: 'Richiesta non consentita.' });
        if (req.method !== 'POST') return send(res, 405, { status: 'error', message: 'Metodo non consentito.' });

        try {
          const body = JSON.parse(await readBody(req)) as { files?: ApplyFile[]; force?: boolean };
          const result = applyFiles(root, body.files ?? [], body.force === true);
          send(res, result.status === 'error' ? 400 : result.status === 'conflict' ? 409 : 200, result);
        } catch (err) {
          send(res, 400, { status: 'error', message: err instanceof Error ? err.message : 'Richiesta non valida.' });
        }
      });
    },
  };
}
