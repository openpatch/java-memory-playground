import { resolve } from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import type { Plugin as PostcssPlugin } from "postcss";

/** The class on the component's outermost element. Everything is inside it. */
const SCOPE = ".java-memory-playground";

/**
 * Confines the bundled stylesheet to the playground.
 *
 * The playground is embedded in pages that have stylesheets of their own, and
 * the bundle is a plain `<link>` — no shadow DOM, no CSS modules — so every
 * rule in it applies to the whole host page. Class names like `.sidebar`,
 * `.memory` or `.button-group` are common enough that this is not theoretical:
 * `.sidebar` alone was resizing the navigation of any book that embedded a
 * diagram. React Flow's own stylesheet is scoped along with ours; it is
 * namespaced well enough not to collide, but it has no business styling the
 * host page either.
 *
 * Prefixing here rather than in the source keeps the source readable, and
 * covers rules added later without anyone having to remember. Selectors that
 * already mention the scope are left alone, so the root rule stays matchable.
 */
const scopeToPlayground: PostcssPlugin = {
  postcssPlugin: "scope-to-playground",
  Rule(rule) {
    // `0%` and `to` inside @keyframes are steps, not selectors.
    const parent = rule.parent;
    if (
      parent?.type === "atrule" &&
      /(^|-)keyframes$/.test((parent as { name: string }).name)
    ) {
      return;
    }
    rule.selectors = rule.selectors.map((selector) => {
      if (selector.includes(SCOPE)) return selector;
      // A stylesheet meant for an element cannot reach the document root.
      if (selector === ":root") return SCOPE;
      return `${SCOPE} ${selector}`;
    });
  },
};

// Library build. React and react-dom stay external so that the consuming
// application (or the web component wrapper) provides a single React instance.
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [scopeToPlayground],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      formats: ["es"],
      entry: resolve(import.meta.dirname, "src/index.ts"),
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        assetFileNames: (asset) =>
          asset.name?.endsWith(".css") ? "index.css" : "assets/[name][extname]",
      },
    },
  },
  test: {
    environment: "node",
    // So that `index.css?raw` is the stylesheet rather than the empty string
    // Vitest substitutes for CSS by default. `palette.test.ts` reads it.
    css: true,
  },
});
