/**
 * Plugin Vite DEV per servire localmente i tile piramidali scaricati in scripts/data/maps/.
 * Permette il collaudo offline e lo switch di piani senza dipendere dalla rete o da CDN esterni.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export function devMapsPlugin(): Plugin {
  return {
    name: 'dev-maps-tiles',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        // Intercetta richieste verso /__dev-maps/* o /scrappys-nest/__dev-maps/*
        const match = url.match(/(?:\/scrappys-nest)?\/__dev-maps\/([^?]+)/);
        if (match) {
          const relativePath = decodeURIComponent(match[1]);
          const filePath = path.resolve(process.cwd(), 'scripts/data/maps', relativePath);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeType = ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg';
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        next();
      });
    },
  };
}
