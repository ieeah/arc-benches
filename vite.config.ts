import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // Served from https://ieeah.github.io/arc-benches/
  base: "/arc-benches/",
  plugins: [react()],
});
