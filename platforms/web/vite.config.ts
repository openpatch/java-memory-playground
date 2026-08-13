import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Pick up edits in the workspace package during development.
      ignored: [
        "!**/node_modules/@java-memory-playground/java-memory-playground/**",
        "!**/packages/java-memory-playground/src/**",
      ],
    },
  },
  optimizeDeps: {
    exclude: ["@java-memory-playground/java-memory-playground"],
  },
});
