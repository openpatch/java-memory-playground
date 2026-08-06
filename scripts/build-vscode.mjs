#!/usr/bin/env node

import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWatch = process.argv.includes("--watch");

const commonOptions = {
  bundle: true,
  sourcemap: true,
  minify: !isWatch,
  logLevel: "info",
};

/** The half that runs in VS Code's extension host, under Node. */
const extensionOptions = {
  ...commonOptions,
  entryPoints: [path.join(__dirname, "../platforms/vscode/src/extension.ts")],
  outfile: path.join(__dirname, "../platforms/vscode/dist/extension.js"),
  format: "cjs",
  platform: "node",
  // Provided by VS Code at runtime; bundling it would break the extension.
  external: ["vscode"],
  target: "node16",
};

/** The half that runs in the webview, which is a browser. */
const webviewOptions = {
  ...commonOptions,
  entryPoints: [path.join(__dirname, "../platforms/vscode/src/webview.tsx")],
  outfile: path.join(__dirname, "../platforms/vscode/dist/webview.js"),
  format: "iife",
  platform: "browser",
  target: ["es2020", "chrome90", "firefox90"],
  // A webview loads one script and one stylesheet; everything else has to be
  // inlined, because the content security policy allows no other source.
  loader: {
    ".svg": "dataurl",
    ".png": "dataurl",
    ".jpg": "dataurl",
    ".jpeg": "dataurl",
    ".woff": "dataurl",
    ".woff2": "dataurl",
    ".ttf": "dataurl",
    ".eot": "dataurl",
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
};

const copyStyles = async () => {
  const fs = await import("fs/promises");
  const from = path.join(
    __dirname,
    "../packages/java-memory-playground/dist/index.css",
  );
  const to = path.join(__dirname, "../platforms/vscode/dist/webview.css");
  try {
    await fs.copyFile(from, to);
  } catch (error) {
    throw new Error(
      `Could not copy ${from}. Build the playground package first: ` +
        `pnpm --filter @openpatch/java-memory-playground build\n${error.message}`,
    );
  }
};

async function build() {
  try {
    if (isWatch) {
      const contexts = await Promise.all([
        esbuild.context(extensionOptions),
        esbuild.context(webviewOptions),
      ]);
      await Promise.all(contexts.map((c) => c.watch()));
      await copyStyles();
      console.log("Watching for changes...");
    } else {
      await Promise.all([
        esbuild.build(extensionOptions),
        esbuild.build(webviewOptions),
      ]);
      await copyStyles();
      console.log("Build complete!");
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
