import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Everything (React included) is bundled into a single UMD file so the
// component can be dropped into any page with one <script> tag.
export default defineConfig(() => ({
  plugins: [react()],
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    lib: {
      formats: ["umd"],
      entry: resolve(__dirname, "src/index.ts"),
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
