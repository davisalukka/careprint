import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages serves a project site from /<repo>/, so the bundle has to be
// built with that prefix. Override with BASE_PATH=/ for a root-served host
// (a user site or a custom domain).
const base = process.env.BASE_PATH ?? "/careprint/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      // One real HTML file per route: no client-side router and no 404.html
      // rewrite hack, so deep links resolve as plain static files.
      input: {
        main: resolve(__dirname, "index.html"),
        demo: resolve(__dirname, "demo/index.html"),
        methodology: resolve(__dirname, "methodology/index.html"),
      },
    },
  },
});
