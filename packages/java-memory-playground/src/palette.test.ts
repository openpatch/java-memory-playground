import { describe, expect, it } from "vitest";

// `?raw` rather than `node:fs`, so the test needs no path handling and no
// Node type definitions.
import css from "./index.css?raw";
import * as palette from "./palette";

/** Every `--jmp-*` declared in the stylesheet, as written. */
const declared = new Map<string, string>();
for (const [, name, value] of css.matchAll(/(--jmp-[a-z-]+)\s*:\s*([^;]+);/g)) {
  declared.set(name, value.trim());
}

/** Follows `--jmp-surface: var(--jmp-white)` down to the colour at the end. */
const resolve = (name: string, seen = new Set<string>()): string => {
  if (seen.has(name)) throw new Error(`Cycle through ${name}`);
  seen.add(name);
  const value = declared.get(name);
  if (!value) throw new Error(`${name} is not declared in index.css`);
  const alias = value.match(/^var\((--jmp-[a-z-]+)\)$/);
  return alias ? resolve(alias[1], seen) : value;
};

/**
 * The colours below are spelled out twice on purpose — see `palette.ts` for why
 * a diagram being photographed cannot read them from the stylesheet. This is
 * the second copy checking itself against the first.
 */
describe("the palette in JavaScript", () => {
  it.each([
    ["--jmp-text", palette.TEXT],
    ["--jmp-text-muted", palette.TEXT_MUTED],
    ["--jmp-surface", palette.SURFACE],
    ["--jmp-surface-sunken", palette.SURFACE_SUNKEN],
    ["--jmp-warning", palette.WARNING],
  ])("matches %s", (token, value) => {
    expect(value).toBe(resolve(token));
  });
});
