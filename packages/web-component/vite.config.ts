import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Everything (React included) is bundled into a single UMD file so the
// component can be dropped into any page with one <script> tag.
//
// Held at Vite 7 on purpose. Vite 8 bundles with Rolldown, which leaves the
// `require("react")` inside use-sync-external-store's CJS shim unresolved and
// the bundle throws on load. That shim arrives through @xyflow/react, which
// depends on zustand 4, so it cannot be avoided from here. Revisit when either
// React Flow moves off it or Rolldown handles the interop.
export default defineConfig(() => ({
  plugins: [react()],
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    lib: {
      formats: ["umd"],
      entry: resolve(import.meta.dirname, "src/index.ts"),
      name: "javaMemoryPlayground",
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      output: {
        assetFileNames: (asset) =>
          asset.name?.endsWith(".css") ? "index.css" : "assets/[name][extname]",
      },
    },
  },
  define: {
    "process.env.NODE_ENV": "'production'",
  },
}));
