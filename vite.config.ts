import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["@codemirror/state", "@codemirror/view"],
  },
  resolve: {
    alias: {
      "@codemirror/state": path.resolve(
        __dirname,
        "./node_modules/@codemirror/state/dist/index.cjs"
      ),
      "@codemirror/lang-yaml": path.resolve(__dirname),
      "@codemirror/lang-json": path.resolve(
        __dirname,
        "./node_modules/@codemirror/lang-json/dist/index.cjs"
      ),
    },
  },
});
