import { describe, expect, it } from "vitest";

// `?raw` rather than `node:fs`, so the test needs no path handling and no
// Node type definitions.
import css from "./index.css?raw";
import * as palette from "./palette";

/**
 * The `.java-memory-playground` block, which is where the palette is declared.
 *
 * Only that block: `.jmp-print` reassigns several of the same tokens, and it is
 * the everyday colours these constants have to agree with.
 */
const base = css.slice(
  css.indexOf(".java-memory-playground {"),
  css.indexOf("\n}", css.indexOf(".java-memory-playground {")),
);

/** Every `--jmp-*` declared there, as written. */
const declared = new Map<string, string>();
for (const [, name, value] of base.matchAll(/(--jmp-[a-z-]+)\s*:\s*([^;]+);/g)) {
  declared.set(name, value.trim());
}

type Resolved = string | { light: string; dark: string };

/**
 * Follows a declaration down to what it resolves to: `light-dark(a, b)`
 * resolves both halves, `var(--jmp-…)` aliases recurse, and a host token with
 * a fallback (`var(--color-text, …)` — the host flips those per theme itself,
 * so the fallback is the pair this component owns) resolves its fallback.
 */
const resolveValue = (value: string, seen: Set<string>): Resolved => {
  const pair = value.match(/^light-dark\((.+),\s*(.+)\)$/);
  if (pair) {
    // The halves of a pair are literals in the stylesheet, never another
    // pair, so they resolve to plain strings.
    return {
      light: resolveValue(pair[1], seen) as string,
      dark: resolveValue(pair[2], seen) as string,
    };
  }
  const alias = value.match(/^var\((--jmp-[a-z-]+)\)$/);
  if (alias) {
    if (seen.has(alias[1])) throw new Error(`Cycle through ${alias[1]}`);
    seen.add(alias[1]);
    const target = declared.get(alias[1]);
    if (!target) throw new Error(`${alias[1]} is not declared in index.css`);
    return resolveValue(target, seen);
  }
  const withFallback = value.match(/^var\([^,]+,\s*(.+)\)$/);
  if (withFallback) return resolveValue(withFallback[1], seen);
  return value;
};

const resolve = (name: string): Resolved => {
  const value = declared.get(name);
  if (!value) throw new Error(`${name} is not declared in index.css`);
  return resolveValue(value, new Set([name]));
};

/**
 * The colours below are spelled out twice on purpose — see `palette.ts` for why
 * a diagram being photographed cannot read them from the stylesheet. This is
 * the second copy checking itself against the first, both halves of every
 * light-dark() pair included.
 */
describe("the palette in JavaScript", () => {
  it.each([
    ["--jmp-black", palette.BLACK],
    ["--jmp-text", palette.TEXT],
    ["--jmp-text-muted", palette.TEXT_MUTED],
    ["--jmp-surface", palette.SURFACE],
    ["--jmp-surface-sunken", palette.SURFACE_SUNKEN],
    ["--jmp-warning", palette.WARNING],
    ["--jmp-danger", palette.DANGER],
  ])("matches %s", (token, entry) => {
    expect(resolve(token)).toEqual(entry);
  });
});
