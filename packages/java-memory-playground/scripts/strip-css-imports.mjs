// Removes side-effect CSS imports (e.g. `import "./index.css";`) from the
// emitted declaration files. Vite bundles the CSS into dist/index.css, so
// these imports carry no type information, and TypeScript 7 consumers
// (noUncheckedSideEffectImports) report TS2882 for them when skipLibCheck
// is off.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dir = process.argv[2] ?? "dist";
const pattern = /^import\s+["'][^"']+\.css["'];?\r?\n/gm;

for (const entry of await readdir(dir, { recursive: true })) {
  if (!entry.endsWith(".d.ts")) continue;
  const file = join(dir, entry);
  const source = await readFile(file, "utf8");
  const stripped = source.replace(pattern, "");
  if (stripped !== source) await writeFile(file, stripped);
}
