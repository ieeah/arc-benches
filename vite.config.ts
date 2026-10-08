import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { devApplyPlugin } from "./vite-plugins/dev-apply";

// La versione mostrata nell'app (Impostazioni) e' quella di package.json: nessun valore da aggiornare a mano.
const { version } = JSON.parse(fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8")) as { version: string };

// https://vite.dev/config/
export default defineConfig({
  // Served from https://ieeah.github.io/arc-benches/
  base: "/arc-benches/",
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [react(), devApplyPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: false,
  },
});
